import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * Reçoit la sélection de sujets d'articles d'un client (ex. Me Plouton depuis
 * /articles/plouton) et :
 *   1. écrit le récap markdown dans le dépôt privé GitHub des réponses
 *   2. ouvre une issue de notification (mention + assignation) → notif fiable
 *   3. envoie un e-mail direct via Resend (si RESEND_API_KEY est défini) — bonus
 *
 * Fonction autonome : aucun import hors de /api (cf. invariant CLAUDE.md).
 * Ne dépend PAS de Resend : l'issue GitHub suffit à notifier Nicolas.
 *
 * Variables d'environnement (mêmes que api/reels-vote.ts) :
 *   GITHUB_TOKEN · RESPONSES_REPO · RESPONSES_BRANCH · NOTIFY_GITHUB_HANDLE
 *   RESEND_API_KEY · VOTE_TO_EMAIL · VOTE_FROM_EMAIL
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const NOTIFY = process.env.NOTIFY_GITHUB_HANDLE || "NicolasRewolf";
const TO = process.env.VOTE_TO_EMAIL || "nicolas@rewolf.studio";
const FROM = process.env.VOTE_FROM_EMAIL || "REWOLF <onboarding@resend.dev>";
const API = "https://api.github.com";

const ChoiceEnum = z.enum(["oui", "peutetre", "non"]);

const PayloadSchema = z.object({
  client: z.object({
    slug: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(120),
    title: z.string().max(120).nullable().optional(),
  }),
  choix: z
    .array(
      z.object({
        id: z.number().int(),
        titre: z.string().min(1).max(240),
        choice: ChoiceEnum,
      }),
    )
    .max(100),
  coeurs: z.array(z.number().int()).max(20).optional().default([]),
  note: z.string().max(3000).optional().default(""),
  stats: z
    .object({
      oui: z.number(),
      peutetre: z.number(),
      non: z.number(),
      coeurs: z.number(),
      tranches: z.number(),
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
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const safeSlug = (s: string) =>
  String(s || "client")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 64) || "client";

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
  oui: { emoji: "✍️", label: "Je le veux" },
  peutetre: { emoji: "🤔", label: "Pourquoi pas" },
  non: { emoji: "✋", label: "Sans moi" },
};

function buildHtmlEmail(d: Payload, when: string, fileUrl: string): string {
  const coeurs = new Set(d.coeurs);
  const s = d.stats || {};
  const group = (k: z.infer<typeof ChoiceEnum>) => d.choix.filter((v) => v.choice === k);
  const row = (v: Payload["choix"][number]) =>
    `<li style="margin:5px 0;">${coeurs.has(v.id) ? "⭐ " : ""}${CHOICE_LABEL[v.choice].emoji} ${esc(v.titre)}</li>`;

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
<html lang="fr"><body style="margin:0;padding:24px;background:#F4F2EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A0A0A;">
  <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:2px solid #0A0A0A;padding:28px;">
    <p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.22em;color:#5C5A54;">Sélection de sujets</p>
    <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;">${esc(salutation(d.client.name))} a choisi ses articles</h1>
    <p style="margin:14px 0 0;font-size:14px;color:#5C5A54;">
      ✍️ ${s.oui ?? "?"} à rédiger · 🤔 ${s.peutetre ?? "?"} en réserve · ✋ ${s.non ?? "?"} écartés · ⭐ ${d.coeurs.length} priorité(s)
    </p>
    ${section("oui")}
    ${section("peutetre")}
    ${section("non")}
    ${
      d.note.trim()
        ? `<h2 style="margin:24px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.18em;color:#5C5A54;font-family:ui-monospace,monospace;font-weight:600;">💬 Son mot</h2>
           <p style="margin:0;font-size:14px;white-space:pre-wrap;">${esc(d.note.trim())}</p>`
        : ""
    }
    <p style="margin:28px 0 0;font-size:12px;color:#918E86;">Reçu le ${esc(when)} — <a href="${esc(fileUrl)}" style="color:#FF4F04;">récap complet</a></p>
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
    return res.status(500).json({ error: "Configuration serveur incomplète (GITHUB_TOKEN)." });
  }

  try {
    const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const parsed = PayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(400).json({ error: "Sélection invalide.", details: parsed.error.issues.slice(0, 3) });
    }
    const data = parsed.data;

    // Horodatage du chemin = horloge serveur UNIQUEMENT : une entrée client
    // (submittedAt) ne pilote jamais le chemin d'écriture dans le dépôt privé.
    const when = new Date().toISOString();
    const dateStamp = when.slice(0, 19).replace(/[^0-9]/g, "-");
    const slug = safeSlug(data.client.slug);

    // Slug « demo… » / « test… » : dossier isolé, AUCUNE notification. Le serveur
    // est la source de vérité (le slug d'URL décide, pas un flag client).
    const isTest = /^(demo|test)/i.test(slug);
    const path = isTest
      ? `votes/articles/_tests/${slug}/${dateStamp}.md`
      : `votes/articles/${slug}/${dateStamp}.md`;
    const api = gh(token);
    const [owner, repo] = REPO.split("/");

    // 1) Récap markdown dans le dépôt privé
    const put = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Sélection sujets : ${data.client.name} (${dateStamp})`,
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

    // 2) Issue de notification — canal fiable, sans Resend. Sautée en démo.
    if (!isTest) {
      try {
        const s = data.stats || {};
        const issueBody = [
          `@${NOTIFY} — nouvelle **sélection de sujets** de **${data.client.name}** :`,
          "",
          `- ✍️ ${s.oui ?? "?"} à rédiger · 🤔 ${s.peutetre ?? "?"} en réserve · ✋ ${s.non ?? "?"} écartés · ⭐ ${data.coeurs.length} priorité(s)`,
          "",
          data.recapMarkdown,
          "",
          `— [Récap complet](${fileUrl})`,
        ].join("\n");

        await api(`/repos/${REPO}/issues`, {
          method: "POST",
          body: JSON.stringify({
            title: `Sélection sujets — ${data.client.name}`,
            assignees: [NOTIFY],
            labels: ["articles", "selection"],
            body: issueBody,
          }),
        });
      } catch {
        /* la notif est un bonus : on n'échoue pas l'enregistrement pour autant */
      }
    }

    // 3) E-mail direct via Resend (si configuré). Non bloquant. Sauté en démo.
    const resendKey = process.env.RESEND_API_KEY;
    if (!isTest && resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: FROM,
            to: [TO],
            subject: `Sujets retenus : ${data.client.name}`,
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
