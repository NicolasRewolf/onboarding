import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * Reçoit une demande de devis depuis /forfaits-flash et :
 *   1. l'écrit en markdown dans le dépôt privé GitHub des réponses
 *   2. ouvre une issue de notification (mention + assignation) côté Élise
 *
 * Fonction autonome : aucun import hors de /api (cf. invariant CLAUDE.md).
 * Réutilise les variables d'environnement Vercel déjà en place pour submit.ts :
 *   GITHUB_TOKEN        — PAT fine-grained, accès Contents + Issues (RW)
 *   RESPONSES_REPO      — "owner/repo"  (défaut : NicolasRewolf/onboarding-responses)
 *   RESPONSES_BRANCH    — branche       (défaut : main)
 *   NOTIFY_LEADS_HANDLE — handle GitHub à notifier (défaut : Eliserewolf)
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const NOTIFY = process.env.NOTIFY_LEADS_HANDLE || "Eliserewolf";
const API = "https://api.github.com";

const ExtraSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().nonnegative(),
});

const LeadSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  company: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().default(""),
  notes: z.string().trim().max(3000).optional().default(""),
  devis: z
    .object({
      forfait: z.string().max(60).nullable().optional(),
      forfaitPrice: z.number().nonnegative().optional(),
      extras: z.array(ExtraSchema).max(20).optional().default([]),
      total: z.number().nonnegative().optional().default(0),
    })
    .optional(),
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
const fmtEur = (n: number) => n.toLocaleString("fr-FR") + " € TTC";
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "lead";

function buildMarkdown(d: z.infer<typeof LeadSchema>, when: string): string {
  const lines: string[] = [];
  lines.push(`# Lead Forfaits Flash — ${d.firstName} ${d.lastName}`);
  lines.push("");
  lines.push(`- **Entreprise** : ${d.company}`);
  lines.push(`- **E-mail** : ${d.email}`);
  lines.push(`- **Téléphone** : ${d.phone || "—"}`);
  lines.push(`- **Reçu le** : ${when}`);
  lines.push("");

  if (d.devis) {
    lines.push("## Devis composé");
    lines.push("");
    if (d.devis.forfait && typeof d.devis.forfaitPrice === "number") {
      lines.push(`- Forfait : **${d.devis.forfait}** (${fmtEur(d.devis.forfaitPrice)})`);
    } else {
      lines.push("- Forfait : _aucun sélectionné_");
    }
    if (d.devis.extras && d.devis.extras.length) {
      lines.push("- Extras :");
      for (const e of d.devis.extras) lines.push(`  - ${e.name} · ${fmtEur(e.price)}`);
    }
    if (typeof d.devis.total === "number") {
      lines.push(`- **Total estimé** : ${fmtEur(d.devis.total)}`);
    }
    lines.push("");
  }

  if (d.notes && d.notes.length) {
    lines.push("## Précisions du prospect");
    lines.push("");
    lines.push(d.notes);
    lines.push("");
  }
  return lines.join("\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res
      .status(500)
      .json({ error: "Configuration serveur incomplète (GITHUB_TOKEN manquant)." });
  }

  try {
    const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const parsed = LeadSchema.safeParse(raw);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Formulaire invalide.", details: parsed.error.issues.slice(0, 3) });
    }
    const data = parsed.data;
    const when = new Date().toISOString();
    const dateStamp = when.slice(0, 19).replace(/[:T]/g, "-");
    const slug = `${dateStamp}-${slugify(`${data.firstName}-${data.lastName}-${data.company}`)}`;
    const path = `leads/forfaits-flash/${slug}.md`;
    const api = gh(token);
    const [owner, repo] = REPO.split("/");

    // 1) Markdown du lead
    const markdown = buildMarkdown(data, when);
    const put = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Lead forfaits-flash : ${data.firstName} ${data.lastName} (${data.company})`,
        content: b64utf8(markdown),
        branch: BRANCH,
      }),
    });
    if (!put.ok) {
      const text = await put.text();
      throw new Error(`GitHub ${put.status} sur ${path} : ${text}`);
    }

    // 2) Notification : issue mentionnant + assignant @NOTIFY (non bloquant)
    const repoUrl = `https://github.com/${owner}/${repo}`;
    const leadUrl = `${repoUrl}/blob/${BRANCH}/${path}`;
    try {
      const issueBody = [
        `@${NOTIFY} — nouveau lead **Forfaits Flash** :`,
        "",
        `- **${data.firstName} ${data.lastName}** (${data.company})`,
        `- E-mail : ${data.email}`,
        `- Téléphone : ${data.phone || "—"}`,
        "",
        markdown,
        "",
        `— [Voir le fichier source](${leadUrl})`,
      ].join("\n");

      await api(`/repos/${REPO}/issues`, {
        method: "POST",
        body: JSON.stringify({
          title: `Lead — ${data.firstName} ${data.lastName} (${data.company})`,
          assignees: [NOTIFY],
          labels: ["lead", "forfaits-flash"],
          body: issueBody,
        }),
      });
    } catch {
      /* la notif est un bonus, on n'échoue pas l'enregistrement pour autant */
    }

    return res.status(200).json({ ok: true, url: leadUrl });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erreur serveur" });
  }
}
