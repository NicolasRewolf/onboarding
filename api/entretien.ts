import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * Reçoit les réponses d'un entretien (ex. Pierre Henry depuis /entretien/albret) et :
 *   1. écrit `reponses.md` (rapport lisible) et `reponses.json` (données) dans le
 *      dépôt privé des réponses, en écrasant la version précédente : un envoi à la
 *      fin de chaque chapitre, l'historique des commits garde chaque étape ;
 *   2. à l'envoi final seulement, ouvre une issue de notification (ou la commente
 *      si elle existe déjà) : un seul signal pour Nicolas, pas un par chapitre.
 *
 * Fonction autonome : aucun import hors de /api (cf. invariant CLAUDE.md).
 * Slugs `test-…` / `demo-…` : dossier `_tests`, aucune notification.
 *
 * Variables d'environnement (les mêmes que submit.ts) :
 *   GITHUB_TOKEN         — PAT fine-grained, Contents + Issues (RW) sur le dépôt réponses
 *   RESPONSES_REPO       — "owner/repo"  (défaut : NicolasRewolf/onboarding-responses)
 *   RESPONSES_BRANCH     — branche       (défaut : main)
 *   NOTIFY_GITHUB_HANDLE — handle à notifier (défaut : NicolasRewolf)
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const NOTIFY = process.env.NOTIFY_GITHUB_HANDLE || "NicolasRewolf";
const API = "https://api.github.com";

/** Entretiens existants (dupliqué de src/entretien/logic.ts : pas d'import hors /api). */
const KNOWN = ["albret"];

const PayloadSchema = z.object({
  slug: z.string().trim().min(1).max(64),
  client: z.object({ name: z.string().trim().min(1).max(120) }),
  final: z.boolean(),
  stats: z.object({ answered: z.number(), skipped: z.number(), total: z.number() }).partial().optional(),
  reportMarkdown: z.string().min(1).max(300_000),
  data: z.record(z.unknown()),
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
const safeSlug = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: "Configuration serveur incomplète (GITHUB_TOKEN manquant)." });

  try {
    const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const parsed = PayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(400).json({ error: "Réponses invalides.", details: parsed.error.issues.slice(0, 3) });
    }
    const { client, final, stats, reportMarkdown, data } = parsed.data;

    // Le slug décide du dossier : seulement un entretien connu, ou son essai.
    const slug = safeSlug(parsed.data.slug);
    const m = slug.match(/^(?:test|demo)-(.+)$/);
    const isTest = !!m;
    if (!KNOWN.includes(m ? m[1] : slug)) return res.status(404).json({ error: "Entretien inconnu." });

    const json = JSON.stringify(data, null, 2);
    if (json.length > 600_000) return res.status(413).json({ error: "Réponses trop volumineuses." });

    const dir = isTest ? `entretiens/_tests/${slug}` : `entretiens/${slug}`;
    const when = new Date().toISOString(); // horloge serveur uniquement
    const api = gh(token);
    const [owner, repo] = REPO.split("/");

    async function getFile(path: string): Promise<{ sha?: string; text?: string }> {
      const r = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`);
      if (!r.ok) return {};
      const j = (await r.json()) as { sha?: string; content?: string };
      return { sha: j.sha, text: j.content ? Buffer.from(j.content, "base64").toString("utf-8") : undefined };
    }

    // Écrase le fichier ; un second essai si un autre envoi vient de le modifier.
    async function putFile(path: string, text: string, message: string) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const { sha } = await getFile(path);
        const put = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
          method: "PUT",
          body: JSON.stringify({ message, content: b64utf8(text), branch: BRANCH, ...(sha ? { sha } : {}) }),
        });
        if (put.ok) return;
        if (attempt === 1 || (put.status !== 409 && put.status !== 422)) {
          throw new Error(`GitHub ${put.status} sur ${path} : ${await put.text()}`);
        }
      }
    }

    // N° d'issue d'un envoi final précédent (gardé dans le JSON).
    let issueNumber: number | undefined;
    try {
      const prior = JSON.parse((await getFile(`${dir}/reponses.json`)).text || "{}") as { issueNumber?: unknown };
      if (typeof prior.issueNumber === "number") issueNumber = prior.issueNumber;
    } catch {
      /* pas de JSON précédent lisible : pas d'issue à reprendre */
    }

    const progress = `${stats?.answered ?? "?"}/${stats?.total ?? "?"}`;
    const label = final ? "envoi final" : "étape";
    await putFile(`${dir}/reponses.md`, reportMarkdown, `Entretien ${slug} — ${label} (${progress})`);

    const repoUrl = `https://github.com/${owner}/${repo}`;
    const reportUrl = `${repoUrl}/blob/${BRANCH}/${dir}/reponses.md`;

    if (final && !isTest) {
      try {
        const line = `**${client.name}** — ${progress} réponses, ${stats?.skipped ?? 0} passée(s). [Lire les réponses](${reportUrl})`;
        if (issueNumber) {
          await api(`/repos/${REPO}/issues/${issueNumber}/comments`, {
            method: "POST",
            body: JSON.stringify({ body: `@${NOTIFY} 🔁 Nouvel envoi final de l'entretien : ${line}` }),
          });
        } else {
          const r = await api(`/repos/${REPO}/issues`, {
            method: "POST",
            body: JSON.stringify({
              title: `Entretien — ${client.name}`,
              assignees: [NOTIFY],
              body: `@${NOTIFY} — l'entretien est rempli : ${line}`,
            }),
          });
          if (r.ok) issueNumber = ((await r.json()) as { number?: number }).number;
        }
      } catch {
        /* la notification est un bonus : les réponses sont déjà enregistrées */
      }
    }

    await putFile(
      `${dir}/reponses.json`,
      JSON.stringify({ ...data, receivedAt: when, issueNumber: issueNumber ?? null }, null, 2),
      `Entretien ${slug} (données) — ${label} (${progress})`,
    );

    return res.status(200).json({ ok: true, url: reportUrl });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erreur serveur" });
  }
}
