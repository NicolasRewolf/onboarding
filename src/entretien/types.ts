// Entretien : une question par écran, la plupart en un geste.
// Support distinct du questionnaire de cadrage (/c/:slug) : contenu, réponses et
// envoi propres (api/entretien.ts), pour ne rien changer aux supports en ligne.

export interface Option {
  v: string;
  label: string;
}

/** Réponse à une carte. Chaque type de carte n'utilise que ses champs. */
export interface CardAnswer {
  value?: string; // confirm, choice, number, long
  values?: string[]; // multi
  rows?: Record<string, string>; // grid : ligne → colonne
  fields?: Record<string, string>; // fields : clé → texte
  items?: string[]; // list
  qualifier?: string; // number : TTC/HT, jours/semaines…
  approx?: boolean; // number : « environ »
  other?: string; // choice / multi : « Autre »
  note?: string; // précision libre, sur toutes les cartes
  skipped?: boolean; // « Je passe » : à voir au téléphone
}

export type Answers = Record<string, CardAnswer>;

interface CardBase {
  id: string;
  /** Numéros des questions du document de préparation (questions-pierre-2026-11-14.md). */
  refs?: number[];
  label: string;
  help?: string;
  notePh?: string;
  /** La carte n'apparaît pas si la réponse à `id` vaut l'une des valeurs `not`. */
  when?: { id: string; not: string[] };
  /** La phrase que la réponse donnera sur le site, montrée pendant la saisie. */
  preview?: (a: CardAnswer, all: Answers) => string | null;
}

export type Card =
  | (CardBase & { kind: "confirm"; statement: string })
  | (CardBase & { kind: "choice"; options: Option[]; other?: boolean })
  | (CardBase & { kind: "multi"; options: Option[]; preset?: string[]; max?: number; other?: boolean })
  | (CardBase & {
      kind: "grid";
      rows: Option[];
      columns: Option[];
      /** Raccourci « tout sur la première colonne » (affiché dès 3 lignes, sauf `false`). */
      bulk?: boolean;
    })
  | (CardBase & {
      kind: "number";
      unit: string;
      step?: number;
      min?: number;
      max?: number;
      qualifiers?: Option[];
      approx?: boolean;
    })
  | (CardBase & { kind: "fields"; fields: { key: string; label: string; ph?: string }[] })
  | (CardBase & { kind: "long"; ph?: string; starters?: string[] })
  | (CardBase & { kind: "list"; itemPh?: string });

export type CardKind = Card["kind"];

export interface Chapter {
  id: string;
  title: string;
  sub: string;
  minutes: number;
  /** Chapitres dont le site a besoin en premier. */
  first?: boolean;
  cards: Card[];
}

export interface EntretienContent {
  /** Slug réel du client (dossier des réponses). */
  slug: string;
  client: { name: string; person: string };
  intro: { title: string; lead: string };
  /** Rappel en tête du tableau « par numéro de question » du rapport. */
  refsNote?: string;
  chapters: Chapter[];
}
