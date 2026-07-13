// Feature « reels » — support client autonome : Me Plouton vote sur les sujets de
// reels présélectionnés par Nicolas. Aucune collecte via api/submit (réservé au
// questionnaire) : cette feature a son propre endpoint autonome (api/reels-vote.ts).
//
// Source des données : présélection Nicolas (Google Sheet « Sélection reels »).
// Chaque sujet est noté sur 5 critères pondérés → score composite /95.

/* ─────────────────────────── Types ─────────────────────────── */

export type ReelChoice = "tourne" | "voir" | "passe";

export type StatutKind = "retenu" | "reserve" | "a-scorer";

export interface ReelScores {
  demande: number; // 0–5
  universalite: number; // 0–5
  viralite: number; // 0–5
  partage: number; // 0–5
  business: number; // 0–5
}

export interface Reel {
  id: number;
  sujet: string;
  pilier: string;
  format: "actu" | "ressource";
  /** Axe testé / hypothèse de la présélection. */
  axe: string;
  /** null pour les sujets « À scorer » (round 2). */
  scores: ReelScores | null;
  /** Score composite /95, null si non scoré. */
  composite: number | null;
  statut: string;
  statutKind: StatutKind;
  /** Précision entre parenthèses du statut (ex. « 1 pénal », « actu », « test »). */
  statutNote?: string;
  /** Synthèse de la logique de sélection (transparence côté Me Plouton). */
  pourquoi: string;
  /** Données clés (volumes, vues on-site, contacts…). */
  donnees: string[];
  /** Slug de la ressource liée sur le site du cabinet (référence, non cliquable). */
  lien?: string;
}

/* ── Critères et pondérations (max composite = 5×(3+4+5+5+2) = 95) ── */

export const CRITERIA = [
  { key: "demande", label: "Demande", weight: 3 },
  { key: "universalite", label: "Universalité", weight: 4 },
  { key: "viralite", label: "Viralité", weight: 5 },
  { key: "partage", label: "Partage", weight: 5 },
  { key: "business", label: "Business", weight: 2 },
] as const satisfies ReadonlyArray<{ key: keyof ReelScores; label: string; weight: number }>;

export const COMPOSITE_MAX = 95;

/** Nombre maximum de « coups de cœur » épinglables (top des priorités de tournage). */
export const MAX_COEURS = 3;

/* ── Les 3 choix de vote, ordonnés du négatif au positif ── */

export const CHOICES: { key: ReelChoice; label: string; emoji: string }[] = [
  { key: "passe", label: "Je passe", emoji: "✋" },
  { key: "voir", label: "À voir", emoji: "🤔" },
  { key: "tourne", label: "Je tourne", emoji: "🔥" },
];

export const CHOICE_BY_KEY: Record<ReelChoice, (typeof CHOICES)[number]> = {
  passe: CHOICES[0],
  voir: CHOICES[1],
  tourne: CHOICES[2],
};

/* ─────────────────────────── Sujets ─────────────────────────── */

export const REELS: Reel[] = [
  {
    id: 1,
    sujet: "Sortir de l'emprise : ordonnance de protection & contrôle coercitif",
    pilier: "Actu / société",
    format: "actu",
    axe: "Sujet en hausse + autorité",
    scores: { demande: 5, universalite: 4, viralite: 4, partage: 5, business: 5 },
    composite: 86,
    statut: "RETENU",
    statutKind: "retenu",
    pourquoi:
      "Composite n°1 (86), en hausse de +50 %/an, sujet d'autorité phare qui convertit fort.",
    donnees: ["6 600 rech./mois (+50 %/an)", "Article « contrôle coercitif » : 4 694 vues", "Pilier violences : 9 contacts"],
    lien: "controle-coercitif-reconnaitre-agir",
  },
  {
    id: 2,
    sujet: "Harcèlement scolaire & cyber : le guide des parents",
    pilier: "Société",
    format: "ressource",
    axe: "Universalité de masse + momentum",
    scores: { demande: 5, universalite: 5, viralite: 4, partage: 5, business: 3 },
    composite: 86,
    statut: "RÉSERVE",
    statutKind: "reserve",
    pourquoi:
      "86 (ex æquo en tête) mais le 2ᵉ créneau sociétal est déjà pris — échange possible avec l'inceste.",
    donnees: ["12 100 rech./mois", "Aucun article dédié", "+125 % (potentiel en réserve)"],
    lien: "pilier-victimes-de-delits-ou-crimes",
  },
  {
    id: 3,
    sujet: "Faux conseiller bancaire : le virement frauduleux",
    pilier: "Victime / quotidien",
    format: "ressource",
    axe: "Relatabilité grand public",
    scores: { demande: 4, universalite: 5, viralite: 4, partage: 5, business: 3 },
    composite: 83,
    statut: "RETENU",
    statutKind: "retenu",
    pourquoi: "Arnaque ultra-relatable, partage maximal — cœur du grand public.",
    donnees: ["720 rech./mois (+23 % ce mois)", "Article « arnaque en ligne » : 143 vues", "Pilier conso : 6 contacts"],
    lien: "arnaque-en-ligne-victime-escroquerie-recours",
  },
  {
    id: 4,
    sujet: "Casier judiciaire : contenu & effacement",
    pilier: "Pénal de masse",
    format: "ressource",
    axe: "Universalité de masse (emploi / vie quotidienne)",
    scores: { demande: 5, universalite: 5, viralite: 4, partage: 4, business: 4 },
    composite: 83,
    statut: "RÉSERVE",
    statutKind: "reserve",
    pourquoi: "83, quasi-universel (90 500 rech./mois), mais la règle « 1 seul pénal » le renvoie au round 2.",
    donnees: ["90 500 rech./mois", "Article « casier » : 3 089 vues"],
    lien: "casier-judiciaire-comprendre-et-effacer",
  },
  {
    id: 5,
    sujet: "Accident de la route : les 3 réflexes",
    pilier: "Victime / route",
    format: "ressource",
    axe: "Pari sûr grand public",
    scores: { demande: 4, universalite: 5, viralite: 4, partage: 4, business: 5 },
    composite: 82,
    statut: "RÉSERVE",
    statutKind: "reserve",
    pourquoi: "82, pari sûr — échange possible avec « morsure de chien » si on veut moins de risque.",
    donnees: ["480 rech./mois", "Articles piéton 2 974 / Badinter 2 115 vues", "Pilier route : 3 contacts"],
    lien: "loi-badinter-85-comprendre-vos-droits",
  },
  {
    id: 6,
    sujet: "Assurance : la 1ʳᵉ offre n'est jamais la dernière",
    pilier: "Victime / quotidien",
    format: "ressource",
    axe: "Anti-assureur (demande prouvée)",
    scores: { demande: 5, universalite: 5, viralite: 4, partage: 4, business: 3 },
    composite: 81,
    statut: "RETENU",
    statutKind: "retenu",
    pourquoi: "Colère + utilité ; demande prouvée par les 8 407 vues de l'article sinistre auto.",
    donnees: ["1 300 / 320 rech./mois", "Article « sinistre auto » : 8 407 vues", "Pilier assurances : 7 contacts"],
    lien: "sinistre-habitation-recours-assurance",
  },
  {
    id: 7,
    sujet: "Porter plainte : et si on refuse de la prendre ?",
    pilier: "Victime",
    format: "ressource",
    axe: "Volume de masse + universalité",
    scores: { demande: 5, universalite: 5, viralite: 4, partage: 4, business: 3 },
    composite: 81,
    statut: "RETENU",
    statutKind: "retenu",
    pourquoi: "Masse (9 900 rech./mois) + universel ; l'angle « le refus est illégal » est viral.",
    donnees: ["9 900 + 8 100 rech./mois", "Article « dépôt de plainte » : 1 978 vues", "Pilier victimes : 14 contacts"],
    lien: "depot-de-plainte-en-france-comment-porter-plainte",
  },
  {
    id: 8,
    sujet: "Garde à vue : vos droits si la police vous arrête",
    pilier: "Pénal procédural",
    format: "ressource",
    axe: "Test du champion (recherche → social)",
    scores: { demande: 5, universalite: 4, viralite: 4, partage: 4, business: 5 },
    composite: 81,
    statut: "RETENU",
    statutKind: "retenu",
    statutNote: "1 pénal",
    pourquoi:
      "Le meilleur article du site, reframé grand public ; test du transfert recherche → social.",
    donnees: ["3 600 rech./mois", "Article « durée GAV » : 17 179 vues (n°1)", "16 intentions de RDV"],
    lien: "duree-de-la-garde-a-vue-24h-48h-96h-combien-de-temps-maximum",
  },
  {
    id: 9,
    sujet: "Inceste & imprescriptibilité : le délai change tout",
    pilier: "Actu / autorité",
    format: "actu",
    axe: "Test autorité / E-E-A-T",
    scores: { demande: 3, universalite: 5, viralite: 4, partage: 4, business: 5 },
    composite: 79,
    statut: "RETENU",
    statutKind: "retenu",
    statutNote: "actu",
    pourquoi: "Test d'autorité ; angle unique (le cabinet comme acteur du débat législatif).",
    donnees: ["« prescription crime sexuel » 90 rech./mois (+56 %)", "Posts cabinet = signal d'autorité"],
    lien: "proposition-de-loi-inceste-et-imprescriptibilite",
  },
  {
    id: 10,
    sujet: "ITT : les 3 lettres qui décident de la gravité",
    pilier: "Victime / pénal",
    format: "ressource",
    axe: "Pépite on-site (sleeper)",
    scores: { demande: 4, universalite: 4, viralite: 4, partage: 4, business: 5 },
    composite: 78,
    statut: "RÉSERVE",
    statutKind: "reserve",
    pourquoi: "Fort en on-site (9 958 vues) mais terme technique, universalité moyenne.",
    donnees: ["170 rech./mois", "Article « ITT pénale » : 9 958 vues (n°3)", "13 intentions de RDV"],
    lien: "itt-penale-definition-en-2025",
  },
  {
    id: 11,
    sujet: "Pension alimentaire impayée : récupérer votre argent",
    pilier: "Famille",
    format: "ressource",
    axe: "Garantie de valeur business",
    scores: { demande: 3, universalite: 4, viralite: 4, partage: 4, business: 5 },
    composite: 75,
    statut: "RETENU",
    statutKind: "retenu",
    pourquoi: "Le pilier famille est le top des conversions (53 contacts) → garantie business.",
    donnees: ["110 rech./mois", "Pilier FAMILLE : 53 contacts / 180 j (n°1 conversion)"],
    lien: "pension-alimentaire-impayee-recours",
  },
  {
    id: 12,
    sujet: "Morsure de chien : qui paie, et combien ?",
    pilier: "Victime / quotidien",
    format: "ressource",
    axe: "Test faible recherche / forte viralité",
    scores: { demande: 2, universalite: 5, viralite: 4, partage: 4, business: 2 },
    composite: 70,
    statut: "RETENU",
    statutKind: "retenu",
    statutNote: "test",
    pourquoi: "Test viral assumé (ton intuition) : peu recherché mais très relatable.",
    donnees: ["880 / 50 rech./mois", "Aucun article dédié", "Vie courante ≈ 0 contact"],
    lien: "responsabilite-du-fait-des-choses",
  },
  {
    id: 13,
    sujet: "Comparution immédiate : que se passe-t-il, comment se défendre ?",
    pilier: "Pénal procédural",
    format: "ressource",
    axe: "Drame procédural (côté accusé)",
    scores: null,
    composite: null,
    statut: "À SCORER",
    statutKind: "a-scorer",
    pourquoi: "Dramatique et fort volume, mais public « accusé ».",
    donnees: ["5 400 rech./mois", "Article « comparution immédiate » : 1 095 vues"],
  },
  {
    id: 14,
    sujet: "Abus de faiblesse : protéger un proche âgé",
    pilier: "Victime / pénal",
    format: "ressource",
    axe: "Relatabilité (proches âgés)",
    scores: null,
    composite: null,
    statut: "À SCORER",
    statutKind: "a-scorer",
    pourquoi: "Très relatable (parents âgés ciblés), potentiel viral + business.",
    donnees: ["4 400 rech./mois", "Article « abus de confiance » : 7 241 vues"],
  },
  {
    id: 15,
    sujet: "Escroquerie sentimentale (brouteur) : reconnaître & agir",
    pilier: "Victime / actu",
    format: "actu",
    axe: "Fort viral / partage",
    scores: null,
    composite: null,
    statut: "À SCORER",
    statutKind: "a-scorer",
    pourquoi: "Très partageable et émotionnel ; volume FR à confirmer.",
    donnees: ["Fort potentiel viral", "Volume à sourcer"],
  },
  {
    id: 16,
    sujet: "Diffamation & e-réputation : agir quand on vous salit en ligne",
    pilier: "Pénal / victime",
    format: "ressource",
    axe: "Gisement, plus de niche",
    scores: null,
    composite: null,
    statut: "À SCORER",
    statutKind: "a-scorer",
    pourquoi: "Gisement à faible concurrence, mais plus de niche.",
    donnees: ["1 900 rech./mois (« diffamation plainte »)"],
  },
  {
    id: 17,
    sujet: "Chirurgie esthétique ratée : vos recours",
    pilier: "Victime / médical",
    format: "ressource",
    axe: "Viral potentiel (avant / après)",
    scores: null,
    composite: null,
    statut: "À SCORER",
    statutKind: "a-scorer",
    pourquoi: "Visuel fort (avant / après), sujet médical relatable.",
    donnees: ["Article « chirurgie esthétique » : 116 vues (récent)"],
  },
  {
    id: 18,
    sujet: "Usurpation d'identité : réagir vite",
    pilier: "Victime",
    format: "ressource",
    axe: "Gros volume mais en déclin",
    scores: null,
    composite: null,
    statut: "À SCORER",
    statutKind: "a-scorer",
    pourquoi: "Gros volume (9 900 rech./mois) MAIS −80 %/an — prudence.",
    donnees: ["9 900 rech./mois", "−80 %/an (en déclin)"],
  },
];

/* ─────────────────────────── Client ─────────────────────────── */

export interface ReelsClient {
  slug: string;
  name: string;
  title?: string;
  /** Nom de la prestation / du contrat, affiché en intro. */
  contrat?: string;
}

const REGISTRY: Record<string, ReelsClient> = {
  plouton: {
    slug: "plouton",
    name: "Me Plouton",
    title: "Avocat",
    contrat: "Contrat de réalisation de reels",
  },
};

function prettify(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Résout un client depuis le slug (registre) avec repli sur les paramètres d'URL (?n=&t=). */
export function resolveReelsClient(slug: string, params: URLSearchParams): ReelsClient {
  const known = REGISTRY[slug.toLowerCase()];
  if (known) return known;
  return {
    slug,
    name: params.get("n") || prettify(slug),
    title: params.get("t") || undefined,
    contrat: params.get("c") || undefined,
  };
}

/** « Me Plouton » / « Me Jacques Derieux » → « Maître Plouton » ; sinon le nom tel quel. */
export function salutation(name: string): string {
  const m = name.match(/^M(?:e|aître)\.?\s+(.+)$/i);
  if (m) {
    const parts = m[1].trim().split(/\s+/).filter(Boolean);
    return "Maître " + parts[parts.length - 1];
  }
  return name;
}

/* ─────────────────────────── Helpers d'affichage ─────────────────────────── */

export function statutMeta(kind: StatutKind): { label: string; className: string } {
  switch (kind) {
    case "retenu":
      return { label: "Retenu", className: "border-rw-black bg-rw-orange text-rw-black" };
    case "reserve":
      return { label: "Réserve", className: "border-rw-black bg-rw-white text-rw-black" };
    case "a-scorer":
      return { label: "À scorer", className: "border-dashed border-rw-tertiary bg-rw-white text-rw-tertiary" };
  }
}

/** Sujets déjà scorés vs en attente — pour l'intro. */
export const REELS_SCORED = REELS.filter((r) => r.composite !== null).length;
export const REELS_TOSCORE = REELS.length - REELS_SCORED;
