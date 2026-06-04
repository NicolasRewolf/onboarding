import { type Question, type Section, type Questionnaire } from "./questionnaire";
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

export const answeredCount = (qn: Questionnaire, a: Answers): number => qn.allQ.filter((q) => isAnswered(q, a)).length;
export const sectionAnswered = (s: Section, a: Answers): number => s.qs.filter((q) => isAnswered(q, a)).length;
export const sectionComplete = (s: Section, a: Answers): boolean =>
  sectionAnswered(s, a) > 0 && s.qs.filter((q) => q.p === "E").every((q) => isAnswered(q, a));
export const missingEssentials = (qn: Questionnaire, a: Answers): Question[] =>
  qn.essentialIds.map((id) => qn.allQ.find((q) => q.id === id)!).filter((q) => !isAnswered(q, a));
