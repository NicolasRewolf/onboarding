import { SECTIONS, ALL_Q, TOTAL_Q } from "./questionnaire";
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
export function buildMarkdownReport(client: ClientInfo, answers: Answers, submittedAt: string): string {
  const answered = answeredCount(answers);
  const missing = missingEssentials(answers);
  const L: string[] = [];

  L.push(`# Cadrage — ${client.name}`);
  L.push("");
  L.push(
    `> **${answered}/${TOTAL_Q}** réponses · ${missing.length} essentielle${missing.length > 1 ? "s" : ""} manquante${missing.length > 1 ? "s" : ""} · reçu le ${submittedAt}`,
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

  SECTIONS.forEach((s, i) => {
    L.push(`## ${String(i + 1).padStart(2, "0")} · ${s.t}`);
    L.push("");
    s.qs.forEach((q) => {
      const ans = formatAnswer(q, answers);
      L.push(`**${q.n}. ${q.label}**`);
      if (ans) {
        // indente les réponses multilignes en blockquote pour la lisibilité
        L.push(ans.split("\n").map((line) => line).join("  \n"));
      } else {
        L.push(q.p === "E" ? "_— à compléter (essentiel)_" : "_— non renseigné_");
      }
      L.push("");
    });
  });

  L.push("---");
  L.push("");
  L.push("_Généré par l'onboarding REWOLF · onboarding.rewolf.studio_");
  return L.join("\n");
}

export function buildPayload(client: ClientInfo, answers: Answers, submittedAt: string): SubmissionPayload {
  return {
    slug: client.slug,
    client,
    answers,
    reportMarkdown: buildMarkdownReport(client, answers, submittedAt),
    stats: {
      answered: answeredCount(answers),
      total: TOTAL_Q,
      missingEssential: missingEssentials(answers).length,
    },
    submittedAt,
  };
}

export { ALL_Q };
