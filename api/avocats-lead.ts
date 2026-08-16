import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * Réception des demandes de contact de la plaquette /avocats.
 *
 *   1. écrit le lead en Markdown dans le dépôt privé des réponses
 *   2. ouvre une issue GitHub de notification (non bloquant)
 *   3. envoie un e-mail direct via Resend si RESEND_API_KEY est défini (non bloquant)
 *
 * Fonction AUTONOME : aucun import hors de /api (cf. invariants du CLAUDE.md —
 * un `../src/lib/...` a déjà provoqué un FUNCTION_INVOCATION_FAILED en prod).
 *
 * Variables d'environnement (gérées côté Vercel) :
 *   GITHUB_TOKEN        — PAT fine-grained, Contents + Issues (RW)
 *   RESPONSES_REPO      — défaut "NicolasRewolf/onboarding-responses"
 *   RESEND_API_KEY      — facultatif
 *   AVOCATS_TO_EMAIL    — destinataire, défaut nicolas@rewolf.studio
 */

const REPO = process.env.RESPONSES_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.RESPONSES_BRANCH || "main";
const NOTIFY = process.env.NOTIFY_AVOCATS_HANDLE || "NicolasRewolf";
const LEAD_TO = process.env.AVOCATS_TO_EMAIL || "nicolas@rewolf.studio";
const LEAD_FROM = process.env.LEAD_FROM_EMAIL || "REWOLF <onboarding@resend.dev>";
const API = "https://api.github.com";

const AttributionSchema = z.object({
  utm_source: z.string().max(200).nullable().optional(),
  utm_medium: z.string().max(200).nullable().optional(),
  utm_campaign: z.string().max(200).nullable().optional(),
  utm_content: z.string().max(200).nullable().optional(),
  utm_term: z.string().max(200).nullable().optional(),
  gclid: z.string().max(400).nullable().optional(),
  referrer: z.string().max(2048).nullable().optional(),
  landing_url: z.string().max(2048).nullable().optional(),
});

const LeadSchema = z.object({
  nom: z.string().min(1).max(120),
  cabinet: z.string().min(1).max(160),
  barreau: z.string().min(1).max(120),
  domaine: z.string().min(1).max(160),
  email: z.string().email().max(200),
  telephone: z.string().max(40).optional().default(""),
  message: z.string().max(4000).optional().default(""),
  attribution: AttributionSchema.optional(),
  /** Champ leurre courant. Nom volontairement opaque : « website », « email » ou « url »
   *  font partie du vocabulaire de l'autofill et des gestionnaires de mots de passe,
   *  qui les remplissent même avec autocomplete="off". `rw_hp` ne ressemble à rien. */
  rw_hp: z.string().max(200).optional().default(""),
  /** Ancien nom du leurre. Conservé le temps que les caches navigateur tournent :
   *  un visiteur servi par l'ancien bundle poste encore ce champ. */
  website: z.string().max(200).optional().default(""),
});

type Lead = z.infer<typeof LeadSchema>;

function gh(token: string) {
  return (path: string, init: RequestInit = {}) =>
    fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
}

const b64utf8 = (s: string) => Buffer.from(s, "utf-8").toString("base64");

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildMarkdown(d: Lead, when: string): string {
  const a = d.attribution;
  const lignes = [
    `# Demande de contact — cabinets d'avocats`,
    "",
    `**Reçue le** : ${new Date(when).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
    "",
    "## Le cabinet",
    "",
    `- **Nom** : ${d.nom}`,
    `- **Cabinet** : ${d.cabinet}`,
    `- **Barreau** : ${d.barreau}`,
    `- **Domaine principal** : ${d.domaine}`,
    `- **E-mail** : ${d.email}`,
    `- **Téléphone** : ${d.telephone || "—"}`,
  ];

  if (d.message.trim()) {
    lignes.push("", "## Message", "", d.message.trim());
  }

  if (a) {
    lignes.push(
      "",
      "## Attribution",
      "",
      `- Source : ${a.utm_source || "—"} / ${a.utm_medium || "—"}`,
      `- Campagne : ${a.utm_campaign || "—"}`,
      `- Groupe d'annonces : ${a.utm_content || "—"}`,
      `- gclid : ${a.gclid || "—"}`,
      `- Référent : ${a.referrer || "—"}`,
      `- Page d'arrivée : ${a.landing_url || "—"}`,
    );
  }

  return lignes.join("\n") + "\n";
}

function buildHtmlEmail(d: Lead, leadUrl: string): string {
  const ligne = (k: string, v: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#5C5A54;font-size:13px">${esc(k)}</td>` +
    `<td style="padding:6px 0;color:#0A0A0A;font-size:14px;font-weight:600">${esc(v)}</td></tr>`;

  return [
    `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px">`,
    `<p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#FF4F04;margin:0 0 6px">REWOLF · Cabinets d'avocats</p>`,
    `<h2 style="margin:0 0 18px;font-size:20px;color:#0A0A0A">${esc(d.cabinet)} — barreau de ${esc(d.barreau)}</h2>`,
    `<table style="border-collapse:collapse">`,
    ligne("Contact", d.nom),
    ligne("Domaine", d.domaine),
    ligne("E-mail", d.email),
    ligne("Téléphone", d.telephone || "—"),
    `</table>`,
    d.message.trim()
      ? `<p style="margin:18px 0 0;padding:14px;background:#F4F2EC;border-left:3px solid #FF4F04;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(d.message.trim())}</p>`
      : "",
    `<p style="margin:22px 0 0;font-size:12px"><a href="${esc(leadUrl)}" style="color:#FF4F04">Voir la fiche complète</a></p>`,
    `</div>`,
  ].join("");
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
      // On journalise les CHEMINS des champs fautifs, jamais leurs valeurs (RGPD).
      console.warn(
        "[avocats-lead] formulaire rejeté par la validation, champs :",
        parsed.error.issues.map((i) => i.path.join(".")).join(", "),
      );
      return res
        .status(400)
        .json({ error: "Formulaire invalide.", details: parsed.error.issues.slice(0, 3) });
    }
    const data = parsed.data;

    // Leurre rempli : très probablement un robot, mais PAS forcément.
    // Le champ s'appelait « website », un nom que les gestionnaires de mots de passe et
    // l'autofill des navigateurs remplissent volontiers malgré autocomplete="off".
    // On ne jette donc plus rien : le lead part en quarantaine et reste consultable.
    const suspect = Boolean(data.rw_hp.trim() || data.website.trim());

    const when = new Date().toISOString();
    const dateStamp = when.slice(0, 19).replace(/[:T]/g, "-");
    const slug = `${dateStamp}-${slugify(`${data.cabinet}-${data.barreau}`)}`;
    const path = suspect
      ? `leads/avocats/_suspects/${slug}.md`
      : `leads/avocats/${slug}.md`;

    if (suspect) {
      console.warn(
        `[avocats-lead] leurre rempli — mise en quarantaine dans ${path} ` +
          `(champ rw_hp=${JSON.stringify(data.rw_hp.slice(0, 40))}, ` +
          `website=${JSON.stringify(data.website.slice(0, 40))})`,
      );
    }
    const api = gh(token);
    const [owner, repo] = REPO.split("/");

    const markdown = buildMarkdown(data, when);
    const put = await api(`/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Lead avocats : ${data.cabinet} (barreau de ${data.barreau})`,
        content: b64utf8(markdown),
        branch: BRANCH,
      }),
    });
    if (!put.ok) {
      const text = await put.text();
      throw new Error(`GitHub ${put.status} sur ${path} : ${text}`);
    }

    const leadUrl = `https://github.com/${owner}/${repo}/blob/${BRANCH}/${path}`;

    // Les fiches en quarantaine sont écrites mais ne déclenchent ni e-mail ni issue :
    // on garde la protection anti-spam sans jamais rien détruire. À relire de temps en temps.
    if (suspect) {
      console.warn(`[avocats-lead] quarantaine écrite, notifications ignorées — ${leadUrl}`);
      return res.status(200).json({ ok: true });
    }

    // E-mail direct (bonus, non bloquant)
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
            subject: `Cabinet ${data.cabinet} — barreau de ${data.barreau}`,
            html: buildHtmlEmail(data, leadUrl),
            text: markdown,
          }),
        });
      } catch (e) {
        // L'enregistrement GitHub fait déjà foi, mais on veut savoir que le mail est tombé.
        console.error("[avocats-lead] Resend a échoué :", e instanceof Error ? e.message : e);
      }
    }

    // Issue de notification (bonus, non bloquant)
    try {
      await api(`/repos/${REPO}/issues`, {
        method: "POST",
        body: JSON.stringify({
          title: `Lead avocats — ${data.cabinet} (${data.barreau})`,
          body: [
            `@${NOTIFY} — nouvelle demande depuis /avocats :`,
            "",
            markdown,
            "",
            `— [Voir le fichier source](${leadUrl})`,
          ].join("\n"),
        }),
      });
    } catch (e) {
      console.error("[avocats-lead] issue de notification échouée :", e instanceof Error ? e.message : e);
    }

    console.log(`[avocats-lead] lead enregistré — ${leadUrl}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[avocats-lead] échec :", message);
    return res.status(500).json({ error: `Envoi impossible : ${message}` });
  }
}
