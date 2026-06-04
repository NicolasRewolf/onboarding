// Registre des questionnaires — un fichier par onboarding (./cadrage, ./horloger).
// Numérotation séquentielle automatique selon la position : ajouter / retirer / déplacer
// une question ne demande aucune renumérotation.
export * from "./types";

import type { Questionnaire, Section, RawSection } from "./types";
import { CADRAGE_RAW } from "./cadrage";
import { HORLOGER_RAW } from "./horloger";

function buildQuestionnaire(id: string, raw: RawSection[], tone: "vous" | "tu" = "vous"): Questionnaire {
  let n = 0;
  const sections: Section[] = raw.map((s) => ({
    t: s.t,
    d: s.d,
    qs: s.qs.map((q) => ({ ...q, n: ++n })),
  }));
  const allQ = sections.flatMap((s) => s.qs);
  return { id, tone, sections, allQ, total: allQ.length, essentialIds: allQ.filter((q) => q.p === "E").map((q) => q.id) };
}

export const QUESTIONNAIRES: Record<string, Questionnaire> = {
  cadrage: buildQuestionnaire("cadrage", CADRAGE_RAW, "vous"),
  horloger: buildQuestionnaire("horloger", HORLOGER_RAW, "tu"),
};

export const DEFAULT_QUESTIONNAIRE = "cadrage";

export function resolveQuestionnaire(id?: string): Questionnaire {
  return (id ? QUESTIONNAIRES[id] : undefined) ?? QUESTIONNAIRES[DEFAULT_QUESTIONNAIRE];
}
