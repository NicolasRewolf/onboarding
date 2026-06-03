import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { MAX_BODY_B64 } from "../src/lib/attachmentLimits";

/**
 * Reçoit un cadrage et l'écrit dans le dépôt privé GitHub des réponses.
 * Aucune donnée n'est stockée ailleurs. Le token reste côté serveur (env Vercel).
 *
 * Variables d'environnement attendues sur Vercel :
 *   GITHUB_TOKEN     — PAT fine-grained, accès Contents + Issues (RW) au repo réponses
 *   RESPONSES_REPO   — "owner/repo"  (défaut: NicolasRewolf/onboarding-responses)
 *   RESPONSES_BRANCH — branche       (défaut: main)
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const API = "https://api.github.com";
// Handle GitHub à notifier (mention + assignation). Reçoit un vrai push « Direct Mention »
// uniquement si l'issue est créée par un AUTRE compte que celui-ci (cf. compte bot).
const NOTIFY = process.env.NOTIFY_GITHUB_HANDLE || "NicolasRewolf";

// Schéma de la charge au seam de soumission : l'interface impose la forme, pas la convention.
const PayloadSchema = z.object({
  slug: z.string().optional(),
  client: z.object({
    slug: z.string().optional(),
    name: z.string().min(1),
    title: z.string().optional(),
    project: z.string().optional(),
    intro: z.string().optional(),
  }),
  answers: z.record(z.union([z.string(), z.array(z.string())])).optional().default({}),
  reportMarkdown: z.string().min(1),
  stats: z
    .object({ answered: z.number(), total: z.number(), missingEssential: z.number() })
    .partial()
    .optional(),
  submittedAt: z.string().optional(),
  attachments: z
    .array(z.object({ qid: z.string(), name: z.string(), b64: z.string() }))
    .optional()
    .default([]),
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
const safeSlug = (s: string) => String(s || "client").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64) || "client";
const safeName = (s: string) => String(s || "fichier").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);

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
      return res.status(400).json({ error: "Charge utile invalide.", details: parsed.error.issues.slice(0, 3) });
    }
    const { client, answers, reportMarkdown, stats, submittedAt, attachments } = parsed.data;

    // Garde-fou : limite de corps des fonctions Vercel (~4,5 Mo), constante partagée.
    const attachBytes = attachments.reduce((n, a) => n + a.b64.length, 0);
    if (attachBytes > MAX_BODY_B64) {
      return res.status(413).json({ error: "Pièces jointes trop volumineuses — réessayez sans les fichiers les plus lourds." });
    }

    const slug = safeSlug(parsed.data.slug || client.slug || "");
    const api = gh(token);
    const [owner, repo] = REPO.split("/");
    const dir = `responses/${slug}`;

    // Met à jour (ou crée) un fichier ; récupère le sha existant si besoin.
    async function putFile(path: string, contentB64: string, message: string) {
      let sha: string | undefined;
      const head = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`);
      if (head.ok) sha = ((await head.json()) as { sha?: string }).sha;
      const put = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
        method: "PUT",
        body: JSON.stringify({ message, content: contentB64, branch: BRANCH, ...(sha ? { sha } : {}) }),
      });
      if (!put.ok) throw new Error(`GitHub ${put.status} sur ${path}: ${await put.text()}`);
      return !sha; // true => fichier nouvellement créé
    }

    // Récupère le JSON existant (pour réutiliser le n° d'issue d'une soumission précédente).
    async function getExisting(path: string): Promise<Record<string, unknown> | null> {
      const r = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`);
      if (!r.ok) return null;
      try {
        const j = (await r.json()) as { content?: string };
        return JSON.parse(Buffer.from(j.content || "", "base64").toString("utf-8"));
      } catch {
        return null;
      }
    }

    const stamp = (submittedAt || new Date().toISOString()).toString();
    const prior = await getExisting(`${dir}/data.json`);
    const priorIssue = typeof prior?.issueNumber === "number" ? (prior.issueNumber as number) : undefined;

    // 1) Rapport + pièces jointes
    await putFile(`${dir}/report.md`, b64utf8(reportMarkdown), `Cadrage ${slug} — ${stamp}`);
    for (const att of attachments.slice(0, 20)) {
      if (!att.b64) continue;
      await putFile(`${dir}/attachments/${safeName(att.name)}`, att.b64, `Pièce jointe ${slug} — ${safeName(att.name)}`);
    }

    // 2) Notification : commente l'issue existante, sinon en crée une (non bloquant).
    const repoUrl = `https://github.com/${owner}/${repo}`;
    const reportUrl = `${repoUrl}/blob/${BRANCH}/${dir}/report.md`;
    let issueNumber = priorIssue;
    try {
      if (issueNumber) {
        await api(`/repos/${REPO}/issues/${issueNumber}/comments`, {
          method: "POST",
          body: JSON.stringify({
            body: `@${NOTIFY} 🔁 Nouvelle soumission de **${client.name}** — ${stats?.answered ?? "?"}/${stats?.total ?? "?"} réponses (${stamp}). [Voir le rapport](${reportUrl})`,
          }),
        });
      } else {
        const r = await api(`/repos/${REPO}/issues`, {
          method: "POST",
          body: JSON.stringify({
            title: `Cadrage — ${client.name}`,
            assignees: [NOTIFY],
            body: `@${NOTIFY} — nouveau cadrage de **${client.name}** (${stats?.answered ?? "?"}/${stats?.total ?? "?"} réponses).\n\n${reportMarkdown}\n\n— [Dossier](${repoUrl}/tree/${BRANCH}/${dir})`,
          }),
        });
        if (r.ok) issueNumber = ((await r.json()) as { number?: number }).number;
      }
    } catch {
      /* la notif est un bonus : on n'échoue pas l'envoi pour autant */
    }

    // 3) Données structurées (avec le n° d'issue pour lier les prochaines soumissions)
    await putFile(
      `${dir}/data.json`,
      b64utf8(JSON.stringify({ client, answers, stats, submittedAt: stamp, issueNumber: issueNumber ?? null }, null, 2)),
      `Cadrage ${slug} (data) — ${stamp}`,
    );

    return res.status(200).json({ ok: true, url: reportUrl });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erreur serveur" });
  }
}
