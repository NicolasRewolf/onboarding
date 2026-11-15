import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * Reçoit les réponses d'un entretien (ex. /entretien/albret) et :
 *   1. écrit `reponses.md` (rapport lisible) et `reponses.json` (données) dans le
 *      dépôt privé des réponses, en écrasant la version précédente : un envoi à la
 *      fin de chaque chapitre, l'historique des commits garde chaque étape ;
 *   2. prévient par e-mail, une fois par séance : au premier chapitre envoyé, quand
 *      la personne reprend après au moins deux heures sans e-mail, et toujours à
 *      l'envoi final. Le rapport complet est recopié dans l'e-mail.
 *
 * Fonction autonome : aucun import hors de /api (cf. invariant CLAUDE.md).
 * Slugs `test-…` / `demo-…` : dossier `_tests`, e-mail marqué « [Essai] ».
 *
 * Variables d'environnement :
 *   GITHUB_TOKEN        — PAT fine-grained, Contents (RW) sur le dépôt réponses
 *   RESPONSES_REPO      — "owner/repo"  (défaut : NicolasRewolf/onboarding-responses)
 *   RESPONSES_BRANCH    — branche       (défaut : main)
 *   RESEND_API_KEY      — clé Resend
 *   LEAD_FROM_EMAIL     — expéditeur, le même que les autres supports
 *   ENTRETIEN_TO_EMAIL  — destinataire des e-mails
 * Sans RESEND_API_KEY ou ENTRETIEN_TO_EMAIL, aucun e-mail ; les réponses sont quand même enregistrées.
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const MAIL_FROM = process.env.LEAD_FROM_EMAIL || "REWOLF <onboarding@resend.dev>";
const API = "https://api.github.com";

/** Sans e-mail depuis ce délai, un nouvel envoi d'étape compte comme une nouvelle séance. */
const SEANCE_MS = 2 * 60 * 60 * 1000;

/** Entretiens existants → prénom de la personne (dupliqué de src/entretien : pas d'import hors /api). */
const KNOWN = new Map([["albret", "Pierre"]]);

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
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** Envoie l'e-mail de suivi. Ne lève jamais : renvoie false si rien n'est parti. */
async function sendMail(subject: string, line: string, reportUrl: string, report: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ENTRETIEN_TO_EMAIL;
  if (!key || !to) {
    console.warn("[entretien] RESEND_API_KEY ou ENTRETIEN_TO_EMAIL absente — aucun e-mail envoyé");
    return false;
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [to],
        subject,
        text: `${line}\n\nSes réponses à jour : ${reportUrl}\n\n———\n\n${report}`,
        html:
          `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#111">` +
          `<p style="margin:0 0 12px">${esc(line)}</p>` +
          `<p style="margin:0 0 20px"><a href="${esc(reportUrl)}">Lire ses réponses à jour</a></p>` +
          `<pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:13px;background:#f6f5f2;padding:16px;border-radius:6px">${esc(report)}</pre>` +
          `</div>`,
      }),
    });
    // `fetch` ne lève pas sur un statut d'erreur : sans ce test, un refus de Resend ne laisse aucune trace.
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error(`[entretien] Resend a refusé l'envoi — HTTP ${r.status} : ${detail.slice(0, 500)}`);
      return false;
    }
    console.log(`[entretien] e-mail envoyé : ${subject}`);
    return true;
  } catch (e) {
    console.error("[entretien] Resend injoignable :", e instanceof Error ? e.message : e);
    return false;
  }
}

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
    const { final, stats, reportMarkdown, data } = parsed.data;

    // Le slug décide du dossier : seulement un entretien connu, ou son essai.
    const slug = safeSlug(parsed.data.slug);
    const m = slug.match(/^(?:test|demo)-(.+)$/);
    const isTest = !!m;
    const person = KNOWN.get(m ? m[1] : slug);
    if (!person) return res.status(404).json({ error: "Entretien inconnu." });

    const json = JSON.stringify(data, null, 2);
    if (json.length > 600_000) return res.status(413).json({ error: "Réponses trop volumineuses." });

    const dir = isTest ? `entretiens/_tests/${slug}` : `entretiens/${slug}`;
    const when = new Date().toISOString(); // horloge serveur uniquement
    const api = gh(token);

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

    // Date du dernier e-mail de suivi (gardée dans le JSON).
    let notifiedAt: string | undefined;
    try {
      const prior = JSON.parse((await getFile(`${dir}/reponses.json`)).text || "{}") as { notifiedAt?: unknown };
      if (typeof prior.notifiedAt === "string") notifiedAt = prior.notifiedAt;
    } catch {
      /* pas de JSON précédent lisible : aucun e-mail encore envoyé */
    }

    const answered = stats?.answered ?? 0;
    const total = stats?.total ?? 0;
    const skipped = stats?.skipped ?? 0;
    const progress = `${answered}/${total}`;
    const label = final ? "envoi final" : "étape";
    await putFile(`${dir}/reponses.md`, reportMarkdown, `Entretien ${slug} — ${label} (${progress})`);

    const reportUrl = `https://github.com/${REPO}/blob/${BRANCH}/${dir}/reponses.md`;

    // Un e-mail par séance, et toujours à l'envoi final.
    if (final || !notifiedAt || Date.now() - Date.parse(notifiedAt) >= SEANCE_MS) {
      const [subject, line] = final
        ? [
            `${person} a tout envoyé (${progress})`,
            `${person} a appuyé sur « J'ai fini » : ${plural(answered, "réponse")} sur ${total}` +
              (skipped ? `, ${plural(skipped, "question")} passée${skipped > 1 ? "s" : ""}, à voir au téléphone.` : "."),
          ]
        : notifiedAt
          ? [`${person} a repris le questionnaire (${progress})`, `${person} a repris ses réponses : ${answered} sur ${total} pour l'instant.`]
          : [`${person} a commencé le questionnaire (${progress})`, `${person} a commencé à répondre : ${answered} sur ${total} pour l'instant.`];
      if (await sendMail(`${isTest ? "[Essai] " : ""}${subject}`, line, reportUrl, reportMarkdown)) notifiedAt = when;
    }

    await putFile(
      `${dir}/reponses.json`,
      JSON.stringify({ ...data, receivedAt: when, notifiedAt: notifiedAt ?? null }, null, 2),
      `Entretien ${slug} (données) — ${label} (${progress})`,
    );

    return res.status(200).json({ ok: true, url: reportUrl });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erreur serveur" });
  }
}
