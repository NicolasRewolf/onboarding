import { type Question, type Section, SECTIONS, ALL_Q, TOTAL_Q, ESSENTIAL_IDS } from "./questionnaire";
import { FIELD_VALUE, fileNames, type Answers } from "./fieldTypes";

export type { Answers };

// Le concern « pièce jointe » est générique (q.file) ; il se compose par-dessus le contrat de type.
const hasFiles = (q: Question, a: Answers): boolean => !!q.file && fileNames(q, a).length > 0;

export function isAnswered(q: Question, a: Answers): boolean {
  return FIELD_VALUE[q.type].isAnswered(q, a) || hasFiles(q, a);
}

export function formatAnswer(q: Question, a: Answers): string {
  let out = FIELD_VALUE[q.type].format(q, a);
  if (hasFiles(q, a)) out += (out ? "\n" : "") + "📎 " + fileNames(q, a).join(", ");
  return out.trim();
}

export const answeredCount = (a: Answers): number => ALL_Q.filter((q) => isAnswered(q, a)).length;
export const sectionAnswered = (s: Section, a: Answers): number => s.qs.filter((q) => isAnswered(q, a)).length;
export const sectionComplete = (s: Section, a: Answers): boolean =>
  sectionAnswered(s, a) > 0 && s.qs.filter((q) => q.p === "E").every((q) => isAnswered(q, a));
export const missingEssentials = (a: Answers): Question[] =>
  ESSENTIAL_IDS.map((id) => ALL_Q.find((q) => q.id === id)!).filter((q) => !isAnswered(q, a));

export { SECTIONS, ALL_Q, TOTAL_Q, ESSENTIAL_IDS };
