import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * Reçoit une demande de devis depuis /forfaits-flash et :
 *   1. l'écrit en markdown dans le dépôt privé GitHub des réponses
 *   2. ouvre une issue de notification (mention + assignation) côté Élise
 *   3. envoie un e-mail direct à Élise via Resend (si RESEND_API_KEY est défini)
 *
 * Fonction autonome : aucun import hors de /api (cf. invariant CLAUDE.md).
 *
 * Variables d'environnement attendues sur Vercel :
 *   GITHUB_TOKEN        — PAT fine-grained, accès Contents + Issues (RW)
 *   RESPONSES_REPO      — "owner/repo"  (défaut : NicolasRewolf/onboarding-responses)
 *   RESPONSES_BRANCH    — branche       (défaut : main)
 *   NOTIFY_LEADS_HANDLE — handle GitHub à notifier (défaut : Eliserewolf)
 *   RESEND_API_KEY      — clé Resend (facultatif : si présent → envoi mail direct)
 *   LEAD_TO_EMAIL       — destinataire mail (défaut : elise@rewolf.studio)
 *   LEAD_FROM_EMAIL     — expéditeur (défaut : "REWOLF <onboarding@resend.dev>")
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const NOTIFY = process.env.NOTIFY_LEADS_HANDLE || "Eliserewolf";
const LEAD_TO = process.env.LEAD_TO_EMAIL || "elise@rewolf.studio";
const LEAD_FROM = process.env.LEAD_FROM_EMAIL || "REWOLF <onboarding@resend.dev>";
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
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const fmtEur = (n: number) => n.toLocaleString("fr-FR") + " € TTC";
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "lead";

function buildHtmlEmail(d: z.infer<typeof LeadSchema>, when: string, leadUrl: string): string {
  const devisRows: string[] = [];
  if (d.devis) {
    if (d.devis.forfait && typeof d.devis.forfaitPrice === "number") {
      devisRows.push(
        `<li style="margin: 4px 0;">Forfait <b>${esc(d.devis.forfait)}</b> — ${fmtEur(d.devis.forfaitPrice)}</li>`,
      );
    }
    for (const e of d.devis.extras ?? []) {
      devisRows.push(`<li style="margin: 4px 0;">${esc(e.name)} · ${fmtEur(e.price)}</li>`);
    }
    if (typeof d.devis.total === "number") {
      devisRows.push(
        `<li style="margin: 8px 0 0; padding-top: 8px; border-top: 1px solid #E4E0D7;"><b>Total estimé : ${fmtEur(d.devis.total)}</b></li>`,
      );
    }
  }

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Lead</title></head>
<body style="margin:0; padding:24px; background:#F4F2EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0A0A0A;">
  <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 2px solid #0A0A0A; padding: 32px;">
    <p style="margin: 0; color: #FF4F04; font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600;">
      Lead · Forfaits Flash
    </p>
    <h1 style="margin: 12px 0 0; font-size: 28px; line-height: 1.05; letter-spacing: -0.02em; text-transform: uppercase; font-weight: 800;">
      ${esc(d.firstName)} ${esc(d.lastName)}
    </h1>
    <p style="margin: 6px 0 0; font-size: 15px; color: #5C5A54;">${esc(d.company)}</p>

    <table style="width:100%; margin-top: 24px; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #5C5A54; width: 120px; vertical-align: top;">E-mail</td>
        <td style="padding: 8px 0;"><a href="mailto:${esc(d.email)}" style="color: #FF4F04; text-decoration: none; font-weight: 600;">${esc(d.email)}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5C5A54; vertical-align: top;">Téléphone</td>
        <td style="padding: 8px 0;">${d.phone ? esc(d.phone) : '<span style="color:#918E86;">—</span>'}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5C5A54; vertical-align: top;">Reçu le</td>
        <td style="padding: 8px 0; color: #5C5A54; font-family: ui-monospace, monospace; font-size: 12px;">${esc(when)}</td>
      </tr>
    </table>

    ${
      devisRows.length
        ? `
    <h2 style="margin: 28px 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.22em; color: #5C5A54; font-family: ui-monospace, monospace; font-weight: 500;">
      Devis composé
    </h2>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px;">${devisRows.join("")}</ul>
    `
        : ""
    }

    ${
      d.notes
        ? `
    <h2 style="margin: 28px 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.22em; color: #5C5A54; font-family: ui-monospace, monospace; font-weight: 500;">
      Précisions du prospect
    </h2>
    <p style="margin: 0; padding: 14px; background: #F4F2EC; border-left: 3px solid #FF4F04; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${esc(d.notes)}</p>
    `
        : ""
    }

    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E4E0D7; font-family: ui-monospace, monospace; font-size: 11px; color: #918E86; text-transform: uppercase; letter-spacing: 0.1em;">
      <a href="mailto:${esc(d.email)}?subject=${encodeURIComponent(`Re: votre demande, REWOLF`)}" style="color: #FF4F04; font-weight: 600; text-decoration: none;">Répondre au prospect</a>
      &nbsp;·&nbsp;
      <a href="${esc(leadUrl)}" style="color: #918E86; text-decoration: none;">Voir le fichier source</a>
    </div>
  </div>
  <p style="max-width: 560px; margin: 16px auto 0; text-align: center; font-family: ui-monospace, monospace; font-size: 10px; color: #918E86; text-transform: uppercase; letter-spacing: 0.22em;">
    Reçu via onboarding.rewolf.studio/forfaits-flash
  </p>
</body></html>`;
}

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

    const repoUrl = `https://github.com/${owner}/${repo}`;
    const leadUrl = `${repoUrl}/blob/${BRANCH}/${path}`;

    // 2) E-mail direct via Resend (si configuré). Non bloquant.
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: LEAD_FROM,
            to: [LEAD_TO],
            reply_to: data.email,
            subject: `Lead Forfaits Flash : ${data.firstName} ${data.lastName} (${data.company})`,
            html: buildHtmlEmail(data, when, leadUrl),
            text: markdown,
          }),
        });
      } catch {
        /* l'e-mail est un bonus, on a déjà l'enregistrement GitHub */
      }
    }

    // 3) Notification GitHub : issue mentionnant + assignant @NOTIFY (non bloquant)
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
