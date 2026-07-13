import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * Feature « dispos » (support autonome, cf. src/dispos/).
 *
 *  POST  /api/dispos                 → enregistre les dispos d'une personne
 *                                      (un fichier JSON par personne, pas de conflit d'écriture)
 *  GET   /api/dispos?event=<slug>    → agrégat de toutes les réponses (page récap)
 *  GET   /api/dispos?event=<slug>&person=<id> → la réponse d'une seule personne (pré-remplissage)
 *
 * Écrit dans le dépôt privé GitHub des réponses, sous `dispos/<event>/`. Le token
 * reste côté serveur (env Vercel). Fonction AUTONOME : aucun import hors de /api
 * (cf. invariant CLAUDE.md — un `../src/...` casse la fonction en prod).
 *
 * Variables d'environnement (Vercel) :
 *   GITHUB_TOKEN        — PAT fine-grained, Contents + Issues (RW) sur le dépôt réponses
 *   RESPONSES_REPO      — "owner/repo"  (défaut : NicolasRewolf/onboarding-responses)
 *   RESPONSES_BRANCH    — branche       (défaut : main)
 *   NOTIFY_GITHUB_HANDLE— handle notifié à chaque réponse (défaut : NicolasRewolf)
 *   DISPOS_RECAP_KEY    — clé facultative : si définie, l'agrégat exige ?k=<clé>
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const NOTIFY = process.env.NOTIFY_GITHUB_HANDLE || "NicolasRewolf";
const API = "https://api.github.com";
// Hôte fixe pour les liens de notif (pas d'en-tête Host spoofable dans le récap).
const SITE = process.env.DISPOS_SITE_URL || "https://onboarding.rewolf.studio";

const SLOT_RE = /^\d{4}-\d{2}-\d{2}\|(am|pm)$/;

const PostSchema = z.object({
  event: z.string().trim().min(1).max(64),
  personId: z.string().trim().min(1).max(64),
  person: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120).optional(),
  slots: z.array(z.string().regex(SLOT_RE)).max(500).default([]),
  note: z.string().trim().max(2000).optional(),
  expectedTotal: z.number().int().positive().max(200).optional(),
});

function gh(token: string) {
  return (path: string, init: RequestInit = {}) =>
    fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "rewolf-onboarding",
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
}

const b64utf8 = (s: string) => Buffer.from(s, "utf-8").toString("base64");
const safeSlug = (s: string) =>
  String(s || "x").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64) || "x";
// Neutralise le markdown (liens/mentions) dans les valeurs libres injectées dans une issue.
const escMd = (s: string) => String(s).replace(/[\\`*_{}[\]()#+\-!<>|@~]/g, "\\$&");
// Noms de fichiers réservés dans dispos/<event>/ (jamais un personId).
const RESERVED_IDS = new Set(["_meta"]);

type GhFetch = ReturnType<typeof gh>;

/** Décode le contenu base64 d'un fichier renvoyé par l'API Contents. */
async function readJson(api: GhFetch, path: string): Promise<Record<string, unknown> | null> {
  const r = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`);
  if (!r.ok) return null;
  try {
    const j = (await r.json()) as { content?: string };
    return JSON.parse(Buffer.from(j.content || "", "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

/** Crée/met à jour un fichier (récupère le sha existant si besoin). */
async function putFile(api: GhFetch, path: string, contentB64: string, message: string) {
  let sha: string | undefined;
  const head = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`);
  if (head.ok) sha = ((await head.json()) as { sha?: string }).sha;
  const put = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: contentB64, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!put.ok) throw new Error(`GitHub ${put.status} sur ${path}: ${await put.text()}`);
}

/** Liste les fichiers de réponses d'un événement (hors _meta.json). */
async function listResponseFiles(api: GhFetch, dir: string): Promise<{ name: string; path: string }[]> {
  const r = await api(`/repos/${REPO}/contents/${encodeURIComponent(dir)}?ref=${BRANCH}`);
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`GitHub ${r.status} sur ${dir}: ${await r.text()}`);
  const items = (await r.json()) as { name: string; path: string; type: string }[];
  return items.filter(
    (i) => i.type === "file" && i.name.endsWith(".json") && i.name !== "_meta.json",
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Configuration serveur incomplète (GITHUB_TOKEN manquant)." });
  }
  const api = gh(token);

  try {
    if (req.method === "GET") return await handleGet(req, res, api);
    if (req.method === "POST") return await handlePost(req, res, api);
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erreur serveur" });
  }
}

/* ───────────────────────────── GET ───────────────────────────── */

async function handleGet(req: VercelRequest, res: VercelResponse, api: GhFetch) {
  const event = safeSlug(String(req.query.event || ""));
  if (!event || event === "x") return res.status(400).json({ error: "Paramètre event manquant." });
  const dir = `dispos/${event}`;

  // Réponse individuelle : volontairement SANS clé — le pré-remplissage participant
  // (fetchMyDispos sur /dispo/:slug) en a besoin, et l'équipe n'a pas la clé récap.
  // Compromis assumé : les ids étant des prénoms, l'agrégat reste devinable même si
  // DISPOS_RECAP_KEY est posée. Acceptable ici (données peu sensibles, support « un seul lien »).
  const person = req.query.person ? safeSlug(String(req.query.person)) : "";
  if (person) {
    const record = await readJson(api, `${dir}/${person}.json`);
    return res.status(200).json({ record: record ?? null });
  }

  // Agrégat : protégé si DISPOS_RECAP_KEY est défini.
  const recapKey = process.env.DISPOS_RECAP_KEY;
  if (recapKey && String(req.query.k || "") !== recapKey) {
    return res.status(401).json({ error: "Clé d'accès requise.", needsKey: true });
  }

  const files = await listResponseFiles(api, dir);
  const responses: unknown[] = [];
  for (const f of files) {
    const rec = await readJson(api, f.path);
    if (rec) responses.push(rec);
  }
  return res.status(200).json({ responses });
}

/* ───────────────────────────── POST ───────────────────────────── */

async function handlePost(req: VercelRequest, res: VercelResponse, api: GhFetch) {
  const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const parsed = PostSchema.safeParse(raw);
  if (!parsed.success) {
    return res.status(400).json({ error: "Charge utile invalide.", details: parsed.error.issues.slice(0, 3) });
  }
  const d = parsed.data;
  const event = safeSlug(d.event);
  const personId = safeSlug(d.personId);
  if (RESERVED_IDS.has(personId)) {
    return res.status(400).json({ error: "Identifiant réservé." });
  }
  const dir = `dispos/${event}`;
  const stamp = new Date().toISOString();

  const record = {
    personId,
    person: d.person,
    role: d.role,
    slots: [...new Set(d.slots)].sort(),
    note: d.note || "",
    updatedAt: stamp,
  };

  await putFile(
    api,
    `${dir}/${personId}.json`,
    b64utf8(JSON.stringify(record, null, 2)),
    `Dispos ${event} — ${d.person} (${record.slots.length} créneaux)`,
  );

  // Nombre de réponses reçues (pour la notification et le retour front).
  let responded: number | undefined;
  try {
    responded = (await listResponseFiles(api, dir)).length;
  } catch {
    /* non bloquant */
  }

  // Notification : un fil unique par événement (_meta.json garde le n° d'issue), comme submit.ts.
  await notify(api, dir, event, d, responded).catch(() => {});

  return res.status(200).json({ ok: true, responded });
}

async function notify(
  api: GhFetch,
  dir: string,
  event: string,
  d: z.infer<typeof PostSchema>,
  responded: number | undefined,
) {
  const recapUrl = `${SITE}/dispo/${event}/recap`;
  const total = d.expectedTotal ? `/${d.expectedTotal}` : "";
  const line = `✅ **${escMd(d.person)}** a renseigné ses dispos — ${d.slots.length} demi-journées${
    responded ? ` · ${responded}${total} réponses` : ""
  }. [Voir le récap](${recapUrl})`;

  const metaPath = `${dir}/_meta.json`;
  const meta = (await readJson(api, metaPath)) as { issueNumber?: number } | null;
  let issueNumber = typeof meta?.issueNumber === "number" ? meta.issueNumber : undefined;

  if (issueNumber) {
    await api(`/repos/${REPO}/issues/${issueNumber}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: line }),
    });
  } else {
    const r = await api(`/repos/${REPO}/issues`, {
      method: "POST",
      body: JSON.stringify({
        title: `🗓 Dispos shooting — ${event}`,
        assignees: [NOTIFY],
        labels: ["dispos"],
        body: `@${NOTIFY} — collecte des disponibilités en cours.\n\n${line}\n\n— [Récap en direct](${recapUrl})`,
      }),
    });
    if (r.ok) {
      issueNumber = ((await r.json()) as { number?: number }).number;
      if (issueNumber) {
        await putFile(
          api,
          metaPath,
          b64utf8(JSON.stringify({ issueNumber }, null, 2)),
          `Dispos ${event} — méta (issue #${issueNumber})`,
        );
      }
    }
  }
}
