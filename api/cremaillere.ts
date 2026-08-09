import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * Feature « crémaillère » (support personnel, cf. src/cremaillere/).
 *
 *  GET   /api/cremaillere                → état agrégé (mur des invités + votes en direct)
 *  POST  /api/cremaillere {kind:"rsvp"}  → enregistre/écrase la fiche d'un invité
 *  POST  /api/cremaillere {kind:"decline"} → comptabilise un « je vous aime pas » (anonyme)
 *
 * Stockage dans le dépôt privé des réponses, sous `cremaillere/` :
 *   rsvps/<id>.json    — fiche complète (nom, e-mail éventuel : jamais renvoyés au front)
 *   declines/<ts>.json — un clic de sans-cœur
 *   state.json         — agrégat PUBLIC (prénoms, signes, miniatures, compteurs de votes),
 *                        recalculé depuis les fiches à chaque écriture. Le GET ne lit que lui.
 *   _meta.json         — n° d'issue de notification (un seul fil, cf. api/dispos.ts)
 *
 * Fonction AUTONOME : aucun import hors de /api (invariant CLAUDE.md). Les plafonds de
 * vote dupliquent src/cremaillere/data.ts — dupliquer plutôt qu'importer.
 *
 * Variables d'environnement (Vercel) : GITHUB_TOKEN, RESPONSES_REPO, RESPONSES_BRANCH,
 * NOTIFY_GITHUB_HANDLE — les mêmes que les autres fonctions, rien de nouveau à poser.
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const NOTIFY = process.env.NOTIFY_GITHUB_HANDLE || "NicolasRewolf";
const API = "https://api.github.com";
const DIR = "cremaillere";

// Miniature ~320px JPEG en data-URL : bien en dessous de la limite de corps Vercel.
const MAX_AVATAR_CHARS = 200_000;

// Plafonds par personne — répliqués de src/cremaillere/data.ts (VOTE_LIMITS).
const SLUG_RE = /^[a-z0-9-]{1,32}$/;
const slugArr = (max: number) => z.array(z.string().regex(SLUG_RE)).max(max).default([]);

const RsvpSchema = z.object({
  kind: z.literal("rsvp"),
  id: z.string().regex(/^[a-z0-9-]{3,64}$/),
  firstName: z.string().trim().min(1).max(40),
  lastName: z.string().trim().min(1).max(60),
  astro: z.string().regex(SLUG_RE),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  avatar: z.string().startsWith("data:image/").max(MAX_AVATAR_CHARS).optional().or(z.literal("")),
  kids: z.number().int().min(0).max(10).default(0),
  bring: z
    .object({
      chaises: z.number().int().min(0).max(20).default(0),
      tableBasse: z.number().int().min(0).max(5).default(0),
      autre: z.string().trim().max(200).default(""),
    })
    .default({ chaises: 0, tableBasse: 0, autre: "" }),
  votes: z.object({
    dates: slugArr(12),
    drinks: slugArr(3),
    apero: slugArr(2),
    entrees: slugArr(3),
    plats: slugArr(3),
    desserts: slugArr(3),
  }),
  par: z.string().trim().max(40).optional(),
});

const DeclineSchema = z.object({ kind: z.literal("decline") });

type Rsvp = z.infer<typeof RsvpSchema>;
type VoteCategory = keyof Rsvp["votes"];
const CATEGORIES: VoteCategory[] = ["dates", "drinks", "apero", "entrees", "plats", "desserts"];

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

type GhFetch = ReturnType<typeof gh>;

const b64utf8 = (s: string) => Buffer.from(s, "utf-8").toString("base64");
const escMd = (s: string) => String(s).replace(/[\\`*_{}[\]()#+\-!<>|@~]/g, "\\$&");

// Lecture en média BRUT : l'API contents plafonne le champ `content` (base64) à ~1 Mo,
// or state.json embarque les miniatures des invités et peut dépasser. Le raw n'a pas ce plafond.
async function readJson(api: GhFetch, path: string): Promise<Record<string, unknown> | null> {
  const r = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`, {
    headers: { Accept: "application/vnd.github.raw+json" },
  });
  if (!r.ok) return null;
  try {
    return JSON.parse(await r.text());
  } catch {
    return null;
  }
}

/** Sha d'un fichier via le listing de son dossier parent (fiable même au-delà de 1 Mo). */
async function fileSha(api: GhFetch, path: string): Promise<string | undefined> {
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  const r = await api(`/repos/${REPO}/contents/${encodeURIComponent(dir)}?ref=${BRANCH}`);
  if (!r.ok) return undefined;
  const items = (await r.json()) as { path: string; sha: string }[];
  return items.find?.((i) => i.path === path)?.sha;
}

/** Crée/met à jour un fichier. Retry sur 409 : deux invités peuvent voter en même temps. */
async function putFile(api: GhFetch, path: string, contentB64: string, message: string) {
  for (let attempt = 0; ; attempt++) {
    const sha = await fileSha(api, path);
    const put = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      body: JSON.stringify({ message, content: contentB64, branch: BRANCH, ...(sha ? { sha } : {}) }),
    });
    if (put.ok) return;
    if ((put.status === 409 || put.status === 422) && attempt < 2) continue;
    throw new Error(`GitHub ${put.status} sur ${path}: ${await put.text()}`);
  }
}

async function listJsonFiles(api: GhFetch, dir: string): Promise<{ name: string; path: string }[]> {
  const r = await api(`/repos/${REPO}/contents/${encodeURIComponent(dir)}?ref=${BRANCH}`);
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`GitHub ${r.status} sur ${dir}: ${await r.text()}`);
  const items = (await r.json()) as { name: string; path: string; type: string }[];
  return items.filter((i) => i.type === "file" && i.name.endsWith(".json"));
}

/* ── Agrégat public : recalculé depuis les fiches (jamais de nom/e-mail dedans) ── */

interface PartyState {
  updatedAt: string;
  guests: { id: string; firstName: string; astro: string; avatar?: string }[];
  declineCount: number;
  kidsTotal: number;
  votes: Record<VoteCategory, Record<string, number>>;
  bring: { chaises: number; tableBasse: number; autres: string[] };
}

const emptyState = (): PartyState => ({
  updatedAt: new Date().toISOString(),
  guests: [],
  declineCount: 0,
  kidsTotal: 0,
  votes: { dates: {}, drinks: {}, apero: {}, entrees: {}, plats: {}, desserts: {} },
  bring: { chaises: 0, tableBasse: 0, autres: [] },
});

async function rebuildState(api: GhFetch): Promise<PartyState> {
  const state = emptyState();
  const files = await listJsonFiles(api, `${DIR}/rsvps`);
  for (const f of files) {
    const raw = await readJson(api, f.path);
    const parsed = RsvpSchema.safeParse(raw);
    if (!parsed.success) continue;
    const r = parsed.data;
    state.guests.push({
      id: r.id,
      firstName: r.firstName,
      astro: r.astro,
      ...(r.avatar ? { avatar: r.avatar } : {}),
    });
    state.kidsTotal += r.kids;
    state.bring.chaises += r.bring.chaises;
    state.bring.tableBasse += r.bring.tableBasse;
    if (r.bring.autre) state.bring.autres.push(`${r.firstName} : ${r.bring.autre}`);
    for (const cat of CATEGORIES) {
      for (const slug of new Set(r.votes[cat])) {
        state.votes[cat][slug] = (state.votes[cat][slug] || 0) + 1;
      }
    }
  }
  state.declineCount = (await listJsonFiles(api, `${DIR}/declines`)).length;
  state.updatedAt = new Date().toISOString();
  await putFile(
    api,
    `${DIR}/state.json`,
    b64utf8(JSON.stringify(state, null, 2)),
    `Crémaillère — agrégat (${state.guests.length} invités, ${state.declineCount} sans-cœur)`,
  );
  return state;
}

/* ── Handler ── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Configuration serveur incomplète (GITHUB_TOKEN manquant)." });
  }
  const api = gh(token);

  try {
    if (req.method === "GET") {
      const state = (await readJson(api, `${DIR}/state.json`)) as PartyState | null;
      return res.status(200).json({ state: state ?? emptyState() });
    }
    if (req.method === "POST") return await handlePost(req, res, api);
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erreur serveur" });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse, api: GhFetch) {
  const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  if (raw?.kind === "decline") {
    const parsed = DeclineSchema.safeParse(raw);
    if (!parsed.success) return res.status(400).json({ error: "Charge utile invalide." });
    const stamp = new Date().toISOString().replace(/[^0-9]/g, "-").slice(0, 23);
    await putFile(
      api,
      `${DIR}/declines/${stamp}.json`,
      b64utf8(JSON.stringify({ at: new Date().toISOString() }, null, 2)),
      "Crémaillère — un sans-cœur de plus 💔",
    );
    const state = await rebuildState(api);
    return res.status(200).json({ ok: true, state });
  }

  const parsed = RsvpSchema.safeParse(raw);
  if (!parsed.success) {
    return res.status(400).json({ error: "Fiche invalide.", details: parsed.error.issues.slice(0, 3) });
  }
  const d = parsed.data;
  const isNew = !(await readJson(api, `${DIR}/rsvps/${d.id}.json`));

  // Fiche complète (source de vérité, confidentielle : nom + e-mail restent ici).
  await putFile(
    api,
    `${DIR}/rsvps/${d.id}.json`,
    b64utf8(JSON.stringify({ ...d, updatedAt: new Date().toISOString() }, null, 2)),
    `Crémaillère — fiche de ${d.firstName} (${d.id})`,
  );

  const state = await rebuildState(api);

  // Notification : un fil unique d'issue, un commentaire par fiche (non bloquant).
  await notify(api, d, state, isNew).catch(() => {});

  return res.status(200).json({ ok: true, state });
}

async function notify(api: GhFetch, d: Rsvp, state: PartyState, isNew: boolean) {
  const topDate = Object.entries(state.votes.dates).sort((a, b) => b[1] - a[1])[0];
  const line = `${isNew ? "🎉" : "🔁"} **${escMd(d.firstName)} ${escMd(d.lastName)}** (${escMd(d.astro)}${
    d.kids ? `, +${d.kids} enfant(s)` : ""
  }${d.par ? `, invité·e par ${escMd(d.par)}` : ""}) ${isNew ? "débarque" : "a mis sa fiche à jour"} — ${
    state.guests.length
  } invités, ${state.declineCount} sans-cœur${topDate ? ` · date en tête : ${topDate[0]} (${topDate[1]} voix)` : ""}.`;

  const metaPath = `${DIR}/_meta.json`;
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
        title: "🏠 Crémaillère ✕ PACS — RSVP en direct",
        assignees: [NOTIFY],
        labels: ["cremaillere"],
        body: `@${NOTIFY} — les fiches tombent ici.\n\n${line}`,
      }),
    });
    if (r.ok) {
      issueNumber = ((await r.json()) as { number?: number }).number;
      if (issueNumber) {
        await putFile(api, metaPath, b64utf8(JSON.stringify({ issueNumber }, null, 2)), `Crémaillère — méta (issue #${issueNumber})`);
      }
    }
  }
}
