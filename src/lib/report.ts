import { type Questionnaire } from "./questionnaire";
import { type Answers, answeredCount, formatAnswer, missingEssentials } from "./answers";
import { type ClientInfo } from "./clients";

export interface SubmissionPayload {
  slug: string;
  client: ClientInfo;
  answers: Answers;
  reportMarkdown: string;
  stats: { answered: number; total: number; missingEssential: number };
  submittedAt: string;
}

/** Rapport Markdown lisible — le livrable que tu ouvres sur GitHub pour ton devis. */
export function buildMarkdownReport(
  qn: Questionnaire,
  client: ClientInfo,
  answers: Answers,
  submittedAt: string,
  skippedAttachments: string[] = [],
): string {
  const answered = answeredCount(qn, answers);
  const missing = missingEssentials(qn, answers);
  const L: string[] = [];

  L.push(`# Cadrage — ${client.name}`);
  L.push("");
  L.push(
    `> **${answered}/${qn.total}** réponses · ${missing.length} essentielle${missing.length > 1 ? "s" : ""} manquante${missing.length > 1 ? "s" : ""} · reçu le ${submittedAt}`,
  );
  L.push("");
  L.push(`- **Client :** ${client.name}${client.title ? ` — ${client.title}` : ""}`);
  if (client.project) L.push(`- **Projet :** ${client.project}`);
  L.push(`- **Lien :** \`/c/${client.slug}\``);
  L.push("");

  if (missing.length) {
    L.push(`> ⚠️ Réponses essentielles non renseignées : ${missing.map((q) => `#${q.n}`).join(", ")}`);
    L.push("");
  }
  if (skippedAttachments.length) {
    L.push(
      `> 📎 Pièce(s) jointe(s) non transmise(s) automatiquement (trop volumineuse(s), à demander au client) : ${skippedAttachments.join(", ")}`,
    );
    L.push("");
  }

  qn.sections.forEach((s, i) => {
    L.push(`## ${String(i + 1).padStart(2, "0")} · ${s.t}`);
    L.push("");
    s.qs.forEach((q) => {
      const ans = formatAnswer(q, answers);
      L.push(`**${q.n}. ${q.label}**`);
      if (ans) L.push(ans.split("\n").join("  \n"));
      else L.push(q.p === "E" ? "_— à compléter (essentiel)_" : "_— non renseigné_");
      L.push("");
    });
  });

  L.push("---");
  L.push("");
  L.push("_Généré par l'onboarding REWOLF · onboarding.rewolf.studio_");
  return L.join("\n");
}

export function buildPayload(
  qn: Questionnaire,
  client: ClientInfo,
  answers: Answers,
  submittedAt: string,
  skippedAttachments: string[] = [],
): SubmissionPayload {
  return {
    slug: client.slug,
    client,
    answers,
    reportMarkdown: buildMarkdownReport(qn, client, answers, submittedAt, skippedAttachments),
    stats: {
      answered: answeredCount(qn, answers),
      total: qn.total,
      missingEssential: missingEssentials(qn, answers).length,
    },
    submittedAt,
  };
}
