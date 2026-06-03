// Contrat de valeur d'un type de question — PUR (zéro React), donc testable seul.
// Concentre, par type : « répondue ? », le formatage, et le vocabulaire d'encodage
// (les constantes Oui/Non et les clés auxiliaires). Le renderer React consomme ce module.

import { type Question, type QType } from "./questionnaire";

export type Answers = Record<string, string | string[]>;

export const YES = "Oui";
export const NO = "Non";

/** Clé auxiliaire d'une réponse (suffixe). Source unique pour l'encodage. */
export const aux = (
  qid: string,
  k: "detail" | "precision" | "other" | "branding" | "link" | "files",
): string => `${qid}_${k}`;

export const fileNames = (q: Question, a: Answers): string[] => {
  const f = a[aux(q.id, "files")];
  return Array.isArray(f) ? f : [];
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");

export interface FieldValue {
  isAnswered(q: Question, a: Answers): boolean;
  format(q: Question, a: Answers): string;
}

const textLike: FieldValue = {
  isAnswered: (q, a) => str(a[q.id]).trim().length > 0,
  format: (q, a) => str(a[q.id]),
};

const boolLike = (withDetail: boolean): FieldValue => ({
  isAnswered: (q, a) => a[q.id] === YES || a[q.id] === NO,
  format: (q, a) => {
    let out = str(a[q.id]);
    if (withDetail && a[q.id] === YES) {
      const d = str(a[aux(q.id, "detail")]).trim();
      if (d) out += " — " + d;
    }
    return out;
  },
});

const choiceValue: FieldValue = {
  isAnswered: (q, a) => !!a[q.id],
  format: (q, a) => {
    let out = str(a[q.id]);
    const p = str(a[aux(q.id, "precision")]).trim();
    if (p) out += (out ? " — " : "") + p;
    return out;
  },
};

const multiValue: FieldValue = {
  isAnswered: (q, a) =>
    (Array.isArray(a[q.id]) && (a[q.id] as string[]).length > 0) || !!a[aux(q.id, "other")],
  format: (q, a) => {
    const arr = Array.isArray(a[q.id]) ? [...(a[q.id] as string[])] : [];
    const other = str(a[aux(q.id, "other")]).trim();
    if (other) arr.push(other);
    return arr.join(" · ");
  },
};

const budgetValue: FieldValue = {
  isAnswered: (q, a) => !!a[q.id],
  format: (q, a) => str(a[q.id]),
};

const logoValue: FieldValue = {
  isAnswered: (q, a) => a[q.id] === YES || a[q.id] === NO,
  format: (q, a) => {
    const v = a[q.id];
    if (v === YES) {
      let out = "Oui — possède déjà une identité visuelle";
      const files = fileNames(q, a);
      if (files.length) out += "\n📎 " + files.join(", ");
      const link = str(a[aux(q.id, "link")]).trim();
      if (link) out += "\n🔗 " + link;
      return out;
    }
    if (v === NO) {
      const b = str(a[aux(q.id, "branding")]).trim();
      return "Non — " + (b || "souhaite que REWOLF crée son identité");
    }
    return "";
  },
};

// Registre exhaustif : ajouter un membre à QType force une entrée ici (erreur TS sinon).
export const FIELD_VALUE: Record<QType, FieldValue> = {
  text: textLike,
  textarea: textLike,
  list: textLike,
  ranked: textLike,
  links: textLike,
  boolean: boolLike(false),
  booleanDetail: boolLike(true),
  choice: choiceValue,
  multi: multiValue,
  budget: budgetValue,
  logo: logoValue,
};
