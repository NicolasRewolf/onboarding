import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * Reçoit les votes de reels d'un client (ex. Me Plouton depuis /reels/plouton) et :
 *   1. écrit le récap markdown dans le dépôt privé GitHub des réponses
 *   2. ouvre une issue de notification (mention + assignation) → notif fiable
 *   3. envoie un e-mail direct via Resend (si RESEND_API_KEY est défini) — bonus
 *
 * Fonction autonome : aucun import hors de /api (cf. invariant CLAUDE.md).
 * Ne dépend PAS de Resend : l'issue GitHub suffit à notifier Nicolas.
 *
 * Variables d'environnement attendues sur Vercel :
 *   GITHUB_TOKEN         — PAT fine-grained, accès Contents + Issues (RW) au repo réponses
 *   RESPONSES_REPO       — "owner/repo"  (défaut : NicolasRewolf/onboarding-responses)
 *   RESPONSES_BRANCH     — branche       (défaut : main)
 *   NOTIFY_GITHUB_HANDLE — handle à notifier (défaut : NicolasRewolf)
 *   RESEND_API_KEY       — clé Resend (facultatif : si présent → envoi mail direct)
 *   VOTE_TO_EMAIL        — destinataire mail (défaut : nicolas@rewolf.studio)
 *   VOTE_FROM_EMAIL      — expéditeur (défaut : "REWOLF <onboarding@resend.dev>")
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const NOTIFY = process.env.NOTIFY_GITHUB_HANDLE || "NicolasRewolf";
const TO = process.env.VOTE_TO_EMAIL || "nicolas@rewolf.studio";
const FROM = process.env.VOTE_FROM_EMAIL || "REWOLF <onboarding@resend.dev>";
const API = "https://api.github.com";

const ChoiceEnum = z.enum(["tourne", "voir", "passe"]);

const PayloadSchema = z.object({
  client: z.object({
    slug: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(120),
    title: z.string().max(120).nullable().optional(),
  }),
  votes: z
    .array(
      z.object({
        id: z.number().int(),
        sujet: z.string().min(1).max(240),
        choice: ChoiceEnum,
      }),
    )
    .max(100),
  coeurs: z.array(z.number().int()).max(20).optional().default([]),
  note: z.string().max(3000).optional().default(""),
  stats: z
    .object({
      tourne: z.number(),
      voir: z.number(),
      passe: z.number(),
      coeurs: z.number(),
      decided: z.number(),
      total: z.number(),
    })
    .partial()
    .optional(),
  recapMarkdown: z.string().min(1).max(60000),
  submittedAt: z.string().optional(),
});

type Payload = z.infer<typeof PayloadSchema>;

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
const safeSlug = (s: string) =>
  String(s || "client").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64) || "client";

/** « Me Plouton » → « Maître Plouton » (même règle que le front). */
function salutation(name: string): string {
  const m = name.match(/^M(?:e|aître)\.?\s+(.+)$/i);
  if (m) {
    const parts = m[1].trim().split(/\s+/).filter(Boolean);
    return "Maître " + parts[parts.length - 1];
  }
  return name;
}

const CHOICE_LABEL: Record<z.infer<typeof ChoiceEnum>, { emoji: string; label: string }> = {
  tourne: { emoji: "🔥", label: "Je tourne" },
  voir: { emoji: "🤔", label: "À voir" },
  passe: { emoji: "✋", label: "Je passe" },
};

function buildHtmlEmail(d: Payload, when: string, fileUrl: string): string {
  const coeurs = new Set(d.coeurs);
  const s = d.stats || {};
  const group = (k: z.infer<typeof ChoiceEnum>) => d.votes.filter((v) => v.choice === k);
  const row = (v: Payload["votes"][number]) =>
    `<li style="margin:5px 0;">${coeurs.has(v.id) ? "⭐ " : ""}${CHOICE_LABEL[v.choice].emoji} ${esc(v.sujet)}</li>`;

  const section = (k: z.infer<typeof ChoiceEnum>) => {
    const g = group(k);
    if (!g.length) return "";
    return `
    <h2 style="margin:24px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.18em;color:#5C5A54;font-family:ui-monospace,monospace;font-weight:600;">
      ${CHOICE_LABEL[k].emoji} ${CHOICE_LABEL[k].label} (${g.length})
    </h2>
    <ul style="margin:0;padding-left:20px;font-size:14px;">${g.map(row).join("")}</ul>`;
  };

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Votes reels</title></head>
<body style="margin:0;padding:24px;background:#F4F2EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A0A0A;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:2px solid #0A0A0A;padding:32px;">
    <p style="margin:0;color:#FF4F04;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:600;">
      Votes reels
    </p>
    <h1 style="margin:12px 0 0;font-size:28px;line-height:1.05;letter-spacing:-0.02em;text-transform:uppercase;font-weight:800;">
      ${esc(salutation(d.client.name))}
    </h1>
    <p style="margin:10px 0 0;font-size:15px;color:#5C5A54;">
      🔥 ${s.tourne ?? group("tourne").length} à tourner · 🤔 ${s.voir ?? group("voir").length} à voir ·
      ✋ ${s.passe ?? group("passe").length} écartés · ⭐ ${d.coeurs.length} coup(s) de cœur
    </p>
    ${section("tourne")}
    ${section("voir")}
    ${section("passe")}
    ${
      d.note.trim()
        ? `<h2 style="margin:24px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.18em;color:#5C5A54;font-family:ui-monospace,monospace;font-weight:600;">Un mot</h2>
    <p style="margin:0;padding:14px;background:#F4F2EC;border-left:3px solid #FF4F04;white-space:pre-wrap;font-size:14px;line-height:1.6;">${esc(d.note.trim())}</p>`
        : ""
    }
    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #E4E0D7;font-family:ui-monospace,monospace;font-size:11px;color:#918E86;text-transform:uppercase;letter-spacing:0.1em;">
      <a href="${esc(fileUrl)}" style="color:#FF4F04;font-weight:600;text-decoration:none;">Voir le récap complet</a>
      &nbsp;·&nbsp; ${esc(when)}
    </div>
  </div>
</body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Configuration serveur incomplète (GITHUB_TOKEN manquant)." });
  }

  try {
    const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const parsed = PayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(400).json({ error: "Votes invalides.", details: parsed.error.issues.slice(0, 3) });
    }
    const data = parsed.data;
    // Horodatage du chemin = horloge serveur UNIQUEMENT. On ne laisse jamais une
    // entrée client (submittedAt) piloter le chemin d'écriture dans le dépôt privé
    // (cf. forfaits-flash-lead.ts qui génère `when` côté serveur, et submit.ts qui
    // passe les segments de chemin par safeSlug/safeName). Le replace ne conserve
    // que chiffres et tirets — sanitisation défensive même si `when` est déjà ISO.
    const when = new Date().toISOString();
    const dateStamp = when.slice(0, 19).replace(/[^0-9]/g, "-");
    const slug = safeSlug(data.client.slug);
    const path = `votes/reels/${slug}/${dateStamp}.md`;
    const api = gh(token);
    const [owner, repo] = REPO.split("/");

    // 1) Récap markdown dans le dépôt privé
    const put = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Votes reels : ${data.client.name} (${dateStamp})`,
        content: b64utf8(data.recapMarkdown),
        branch: BRANCH,
      }),
    });
    if (!put.ok) {
      const text = await put.text();
      throw new Error(`GitHub ${put.status} sur ${path} : ${text}`);
    }

    const repoUrl = `https://github.com/${owner}/${repo}`;
    const fileUrl = `${repoUrl}/blob/${BRANCH}/${path}`;

    // 2) Issue de notification (mention + assignation) — canal fiable, sans Resend
    try {
      const s = data.stats || {};
      const issueBody = [
        `@${NOTIFY} — nouveaux **votes reels** de **${data.client.name}** :`,
        "",
        `- 🔥 ${s.tourne ?? "?"} à tourner · 🤔 ${s.voir ?? "?"} à voir · ✋ ${s.passe ?? "?"} écartés · ⭐ ${data.coeurs.length} coup(s) de cœur`,
        "",
        data.recapMarkdown,
        "",
        `— [Récap complet](${fileUrl})`,
      ].join("\n");

      await api(`/repos/${REPO}/issues`, {
        method: "POST",
        body: JSON.stringify({
          title: `Votes reels — ${data.client.name}`,
          assignees: [NOTIFY],
          labels: ["reels", "vote"],
          body: issueBody,
        }),
      });
    } catch {
      /* la notif est un bonus : on n'échoue pas l'enregistrement pour autant */
    }

    // 3) E-mail direct via Resend (si configuré). Non bloquant.
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: FROM,
            to: [TO],
            subject: `Votes reels : ${data.client.name}`,
            html: buildHtmlEmail(data, when, fileUrl),
            text: data.recapMarkdown,
          }),
        });
      } catch {
        /* l'e-mail est un bonus, on a déjà l'enregistrement GitHub + l'issue */
      }
    }

    return res.status(200).json({ ok: true, url: fileUrl });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erreur serveur" });
  }
}
