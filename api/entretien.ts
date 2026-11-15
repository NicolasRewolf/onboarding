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

/* ─────────────── E-mail lisible, tiré du rapport ───────────────
 * Le rapport Markdown vient de src/entretien/report.ts (buildReport) :
 *   ## Un mot de …  /  ## N. Chapitre  /  ### Question · Qn  /  ## À voir au téléphone  /  ## Par numéro…
 * L'e-mail n'en garde que ce que la personne a répondu : ni questions pas encore vues,
 * ni numéros de questions, ni tableau final (ils restent dans le rapport complet). */

interface MailCard { label: string; proposed?: string; answer: string[]; site?: string; note?: string }
interface MailChapter { title: string; cards: MailCard[]; opened: boolean }
interface MailReport { message: string[]; chapters: MailChapter[]; skipped: string[] }

function parseReport(md: string): MailReport {
  const out: MailReport = { message: [], chapters: [], skipped: [] };
  let section: "head" | "message" | "chapter" | "skipped" | "end" = "head";
  let card: (MailCard & { state: "answered" | "skipped" | "unseen" }) | null = null;
  const closeCard = () => {
    const ch = out.chapters.at(-1);
    if (card && ch) {
      if (card.state !== "unseen") ch.opened = true;
      if (card.state === "answered") ch.cards.push(card);
    }
    card = null;
  };
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (section === "end") break;
    if (line.startsWith("## ")) {
      closeCard();
      const title = line.slice(3);
      if (title.startsWith("Un mot de ")) section = "message";
      else if (title === "À voir au téléphone") section = "skipped";
      else if (title.startsWith("Par numéro")) section = "end";
      else {
        section = "chapter";
        out.chapters.push({ title, cards: [], opened: false });
      }
      continue;
    }
    if (section === "message" && line.startsWith("> ")) out.message.push(line.slice(2));
    else if (section === "skipped" && line.startsWith("- ")) out.skipped.push(line.slice(2).replace(/ · Q[\d, Q]+$/, ""));
    else if (section === "chapter") {
      if (line.startsWith("### ")) {
        closeCard();
        card = { label: line.slice(4).replace(/ · Q[\d, Q]+$/, ""), answer: [], state: "answered" };
      } else if (!card || !line || /^_\d+ \/ \d+ réponses_$/.test(line)) continue;
      else if (line === "_— pas encore vue_") card.state = "unseen";
      else if (line.startsWith("⏭")) card.state = "skipped";
      else if (line.startsWith("_Phrase proposée : ")) card.proposed = line.slice(19, -1);
      else if (line.startsWith("Sur le site : ")) card.site = line.slice(14);
      else if (line.startsWith("📝 ")) card.note = line.slice(3);
      else card.answer.push(line);
    }
  }
  closeCard();
  // Deux cartes de suite peuvent donner la même phrase du site (taux, puis assiette) : on ne la montre qu'une fois.
  for (const ch of out.chapters) ch.cards.forEach((c, i) => c.site && c.site === ch.cards[i - 1]?.site && (ch.cards[i - 1].site = undefined));
  return out;
}

/** **gras** et _italique_ du rapport, sur du texte déjà échappé. */
const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|\s)_(.+?)_(?=\s|$)/g, "$1<em>$2</em>");
const bare = (s: string) => s.replace(/\*\*/g, "").replace(/(^|\s)_(.+?)_(?=\s|$)/g, "$1$2");
const answerLine = (l: string) => l.replace(/^> ?/, "").replace(/^- /, "• ");

const C = { orange: "#FF4F04", black: "#0A0A0A", muted: "#5C5A54", tertiary: "#918E86", paper: "#F4F2EC", line: "#E4E0D7" };
const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`; // apostrophes : il vit dans style="…"

interface MailIntro { title: string; line: string; pct: number; isTest: boolean; client: string; person: string; url: string }

function buildHtml(r: MailReport, i: MailIntro): string {
  const cards = (ch: MailChapter) =>
    ch.cards
      .map(
        (c) =>
          `<tr><td style="padding:14px 0 0">` +
          `<div style="font-size:13px;line-height:18px;color:${C.muted}">${esc(c.label)}</div>` +
          (c.proposed ? `<div style="font-size:14px;line-height:20px;color:${C.muted};font-style:italic;margin-top:4px">${esc(c.proposed)}</div>` : "") +
          `<div style="font-size:16px;line-height:23px;color:${C.black};margin-top:4px">${c.answer.map((l) => inline(answerLine(l))).join("<br>")}</div>` +
          (c.note ? `<div style="font-size:14px;line-height:20px;color:${C.black};margin-top:6px">📝 ${esc(c.note)}</div>` : "") +
          (c.site ? `<div style="font-size:13px;line-height:19px;color:${C.muted};background:${C.paper};padding:8px 10px;margin-top:8px">Sur le site : ${esc(c.site)}</div>` : "") +
          `</td></tr>`,
      )
      .join("");
  const answered = r.chapters.filter((ch) => ch.cards.length);
  const unopened = r.chapters.filter((ch) => !ch.opened).map((ch) => ch.title.replace(/^\d+\. /, ""));
  const pct = Math.max(0, Math.min(100, Math.round(i.pct)));
  return (
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
    `<body style="margin:0;padding:0;background:${C.paper}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:2px solid ${C.black};font-family:${FONT}">` +
    // En-tête
    `<tr><td style="padding:28px 24px 0">` +
    `<div style="font-size:11px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:${C.orange};font-weight:700">Questionnaire · ${esc(i.client)}${i.isTest ? ` · <span style="color:${C.black}">Essai</span>` : ""}</div>` +
    `<h1 style="margin:10px 0 0;font-size:26px;line-height:31px;color:${C.black};font-weight:800">${esc(i.title)}</h1>` +
    `<p style="margin:10px 0 0;font-size:16px;line-height:23px;color:${C.black}">${esc(i.line)}</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px"><tr>` +
    (pct > 0 ? `<td width="${pct}%" style="height:6px;background:${C.orange};font-size:0;line-height:0">&nbsp;</td>` : "") +
    (pct < 100 ? `<td style="height:6px;background:${C.line};font-size:0;line-height:0">&nbsp;</td>` : "") +
    `</tr></table>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr><td style="background:${C.black}">` +
    `<a href="${esc(i.url)}" style="display:inline-block;padding:12px 18px;font-size:14px;line-height:18px;font-weight:700;color:#ffffff;text-decoration:none">Voir le rapport complet →</a>` +
    `</td></tr></table>` +
    `</td></tr>` +
    // Mot de la personne
    (r.message.length
      ? `<tr><td style="padding:28px 24px 0"><div style="border-left:3px solid ${C.orange};padding:2px 0 2px 14px">` +
        `<div style="font-size:11px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};font-weight:700">Un mot de ${esc(i.person)}</div>` +
        `<div style="font-size:16px;line-height:23px;color:${C.black};margin-top:6px">${r.message.map(esc).join("<br>")}</div></div></td></tr>`
      : "") +
    // Réponses, chapitre par chapitre
    answered
      .map(
        (ch) =>
          `<tr><td style="padding:28px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
          `<tr><td style="border-top:2px solid ${C.black};padding-top:10px;font-size:13px;line-height:18px;letter-spacing:1px;text-transform:uppercase;font-weight:800;color:${C.black}">${esc(ch.title)}</td></tr>` +
          cards(ch) +
          `</table></td></tr>`,
      )
      .join("") +
    // À voir au téléphone
    (r.skipped.length
      ? `<tr><td style="padding:28px 24px 0"><div style="background:${C.paper};padding:14px 16px">` +
        `<div style="font-size:13px;line-height:18px;letter-spacing:1px;text-transform:uppercase;font-weight:800;color:${C.orange}">À voir au téléphone</div>` +
        `<div style="font-size:15px;line-height:22px;color:${C.black};margin-top:6px">${r.skipped.map((s) => `• ${esc(s)}`).join("<br>")}</div></div></td></tr>`
      : "") +
    // Pas encore ouverts
    (unopened.length && unopened.length < r.chapters.length
      ? `<tr><td style="padding:20px 24px 0;font-size:13px;line-height:19px;color:${C.tertiary}">Pas encore ouverts : ${esc(unopened.join(", "))}.</td></tr>`
      : "") +
    `<tr><td style="padding:28px 24px 24px;font-size:12px;line-height:17px;color:${C.tertiary}">Envoyé automatiquement par le questionnaire, une fois par séance et à chaque « J'ai fini ».</td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}

function buildText(r: MailReport, i: MailIntro): string {
  const L: string[] = [i.line, `Rapport complet : ${i.url}`, ""];
  if (r.message.length) L.push(`UN MOT DE ${i.person.toUpperCase()}`, ...r.message, "");
  for (const ch of r.chapters.filter((c) => c.cards.length)) {
    L.push(ch.title.toUpperCase(), "");
    for (const c of ch.cards) {
      L.push(c.label);
      if (c.proposed) L.push(bare(c.proposed));
      L.push(...c.answer.map((l) => (l.startsWith("- ") ? bare(answerLine(l)) : `→ ${bare(answerLine(l))}`)));
      if (c.note) L.push(`📝 ${c.note}`);
      if (c.site) L.push(`Sur le site : ${c.site}`);
      L.push("");
    }
  }
  if (r.skipped.length) L.push("À VOIR AU TÉLÉPHONE", ...r.skipped.map((s) => `• ${s}`), "");
  return L.join("\n");
}

/** Envoie l'e-mail de suivi. Ne lève jamais : renvoie false si rien n'est parti. */
async function sendMail(subject: string, html: string, text: string): Promise<boolean> {
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
        html,
        text,
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
    const { client, final, stats, reportMarkdown, data } = parsed.data;

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
      const [title, line] = final
        ? [
            `${person} a tout envoyé`,
            `${person} a appuyé sur « J'ai fini » : ${plural(answered, "réponse")} sur ${total}` +
              (skipped ? `, ${plural(skipped, "question")} passée${skipped > 1 ? "s" : ""}, à voir au téléphone.` : "."),
          ]
        : notifiedAt
          ? [`${person} a repris le questionnaire`, `${person} a repris ses réponses : ${answered} sur ${total} pour l'instant.`]
          : [`${person} a commencé le questionnaire`, `${person} a commencé à répondre : ${answered} sur ${total} pour l'instant.`];
      const report = parseReport(reportMarkdown);
      const intro: MailIntro = { title, line, pct: total ? (answered / total) * 100 : 0, isTest, client: client.name, person, url: reportUrl };
      const subject = `${isTest ? "[Essai] " : ""}${title} (${progress})`;
      if (await sendMail(subject, buildHtml(report, intro), buildText(report, intro))) notifiedAt = when;
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
