// Types du questionnaire — partagés par tous les onboardings.
// La numérotation (n) est calculée à la construction (cf. ./index.ts).

export type QType =
  | "text"
  | "textarea"
  | "list"
  | "ranked"
  | "links"
  | "boolean"
  | "booleanDetail"
  | "choice"
  | "multi"
  | "budget"
  | "logo"
  | "font";

export type Priority = "E" | "C"; // Essentiel / Confort (facultatif)

export interface FontOption {
  name: string;
  stack: string; // font-family CSS
}

export interface Question {
  id: string;
  n: number;
  p: Priority;
  type: QType;
  label: string;
  why?: string;
  ph?: string;
  options?: string[];
  budgetOptions?: [string, string][];
  fontOptions?: FontOption[];
  precision?: string;
  detailPh?: string;
  allowOther?: boolean;
  file?: boolean;
}

export interface Section {
  t: string;
  d: string;
  qs: Question[];
}

/** Un questionnaire = des sections + ses dérivés (numérotés, comptés). */
export interface Questionnaire {
  id: string;
  tone: "vous" | "tu";
  /** Accroche du titre d'intro, après le nom du client (« {Nom}, {tagline} »). */
  tagline: string;
  sections: Section[];
  allQ: Question[];
  total: number;
  essentialIds: string[];
}

export type RawQuestion = Omit<Question, "n">;
export interface RawSection {
  t: string;
  d: string;
  qs: RawQuestion[];
}
