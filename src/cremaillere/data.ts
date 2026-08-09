// Feature « crémaillère » — carton d'invitation interactif (crémaillère ✕ PACS).
// Support personnel, même DA REWOLF, feature autonome (cf. CLAUDE.md « Ajouter un support »).
// Toutes les listes d'options vivent ici ; l'API (api/cremaillere.ts) ne connaît que des slugs.

export type VoteCategory = "dates" | "drinks" | "apero" | "entrees" | "plats" | "desserts";

export interface PartyOption {
  slug: string;
  label: string;
  emoji?: string;
  note?: string;
}

/* ── Réglages de la soirée ─────────────────────────────────────────────
   `confirmedDate` : null tant que rien n'est verrouillé. Le jour du verdict,
   poser un slug de DATES (ex. "2026-10-17") + push → la page passe en mode
   « C'EST OFFICIEL » (adresse révélée, .ics et Google Agenda activés). */
export const PARTY_CONFIG = {
  decisionDate: "2026-09-15",
  decisionDateLabel: "15 septembre",
  confirmedDate: null as string | null,
  startTime: "19:00",
  endTime: "02:00",
  address: {
    street: "11 rue Denfert Rochereau",
    city: "33130 Bègles",
    teaser: "Bègles — l'adresse exacte tombe avec le verdict.",
  },
};

/* ── Les dates candidates : tous les samedis d'octobre + les deux premiers
      de décembre 2026. Le slug EST la date ISO (utile pour l'ics). ── */
export const DATES: PartyOption[] = [
  { slug: "2026-10-03", label: "Sam. 3 octobre" },
  { slug: "2026-10-10", label: "Sam. 10 octobre" },
  { slug: "2026-10-17", label: "Sam. 17 octobre" },
  { slug: "2026-10-24", label: "Sam. 24 octobre" },
  { slug: "2026-10-31", label: "Sam. 31 octobre", emoji: "🎃", note: "Halloween — déguisement fortement considéré" },
  { slug: "2026-12-05", label: "Sam. 5 décembre" },
  { slug: "2026-12-12", label: "Sam. 12 décembre" },
];

export const DRINKS: PartyOption[] = [
  { slug: "biere", label: "Bière fraîche", emoji: "🍺" },
  { slug: "vin-rouge", label: "Vin rouge", emoji: "🍷" },
  { slug: "vin-blanc", label: "Vin blanc", emoji: "🥂" },
  { slug: "bulles", label: "Bulles de fête", emoji: "🍾", note: "crémant, on n'est pas des sultans" },
  { slug: "spritz", label: "Spritz", emoji: "🧡" },
  { slug: "rhum-arrange", label: "Rhum arrangé maison", emoji: "🥃" },
  { slug: "pastis", label: "Pastis", emoji: "🌞", note: "oui, en octobre" },
  { slug: "kombucha", label: "Kombucha / kéfir", emoji: "🫧" },
  { slug: "sans-alcool", label: "Softs stylés", emoji: "🍹", note: "virgin mojito, jus qui se respectent" },
];

export const APERO: PartyOption[] = [
  { slug: "planches", label: "Planches charcut' & fromages", emoji: "🧀" },
  { slug: "houmous", label: "Houmous & dips de légumes", emoji: "🥕" },
  { slug: "feuilletes", label: "Mini feuilletés chauds", emoji: "🥐" },
  { slug: "tapas", label: "Tapas — olives, tapenades, pan con tomate", emoji: "🫒" },
];

export const ENTREES: PartyOption[] = [
  { slug: "burrata", label: "Burrata, tomates confites", emoji: "🍅" },
  { slug: "veloute", label: "Velouté de saison", emoji: "🥣" },
  { slug: "tarte-fine", label: "Tarte fine chèvre-miel", emoji: "🍯" },
  { slug: "ceviche", label: "Ceviche de daurade", emoji: "🐟" },
  { slug: "salade", label: "Grande salade fraîcheur", emoji: "🥗" },
  { slug: "oeufs-mimosa", label: "Œufs mimosa de compétition", emoji: "🥚" },
];

export const PLATS: PartyOption[] = [
  { slug: "lasagnes", label: "Lasagnes maison", emoji: "🍝" },
  { slug: "gratin", label: "Gratin dauphinois du siècle", emoji: "🥔" },
  { slug: "chili", label: "Chili — con & sin carne", emoji: "🌶️" },
  { slug: "curry", label: "Curry coco légumes", emoji: "🥥" },
  { slug: "raclette", label: "Raclette", emoji: "🫕", note: "oui, déjà" },
  { slug: "burgers", label: "Burgers maison", emoji: "🍔" },
];

export const DESSERTS: PartyOption[] = [
  { slug: "fondant", label: "Fondant au chocolat", emoji: "🍫" },
  { slug: "tiramisu", label: "Tiramisu", emoji: "☕" },
  { slug: "cheesecake", label: "Cheesecake", emoji: "🍰" },
  { slug: "tarte-pommes", label: "Tarte aux pommes de mamie", emoji: "🍎" },
  { slug: "pavlova", label: "Pavlova", emoji: "☁️" },
  { slug: "fruits", label: "Salade de fruits", emoji: "🍓", note: "pour la forme" },
];

/* ── Plafonds de vote par personne (répliqués côté serveur, cf. invariant
      « fonction autonome » : api/cremaillere.ts duplique ces bornes). ── */
export const VOTE_LIMITS: Record<VoteCategory, number> = {
  dates: DATES.length,
  drinks: 3,
  apero: 2,
  entrees: 3,
  plats: 3,
  desserts: 3,
};

export const CATEGORY_OPTIONS: Record<VoteCategory, PartyOption[]> = {
  dates: DATES,
  drinks: DRINKS,
  apero: APERO,
  entrees: ENTREES,
  plats: PLATS,
  desserts: DESSERTS,
};

export const ASTRO_SIGNS: PartyOption[] = [
  { slug: "belier", label: "Bélier", emoji: "♈️" },
  { slug: "taureau", label: "Taureau", emoji: "♉️" },
  { slug: "gemeaux", label: "Gémeaux", emoji: "♊️" },
  { slug: "cancer", label: "Cancer", emoji: "♋️" },
  { slug: "lion", label: "Lion", emoji: "♌️" },
  { slug: "vierge", label: "Vierge", emoji: "♍️" },
  { slug: "balance", label: "Balance", emoji: "♎️" },
  { slug: "scorpion", label: "Scorpion", emoji: "♏️" },
  { slug: "sagittaire", label: "Sagittaire", emoji: "♐️" },
  { slug: "capricorne", label: "Capricorne", emoji: "♑️" },
  { slug: "verseau", label: "Verseau", emoji: "♒️" },
  { slug: "poissons", label: "Poissons", emoji: "♓️" },
];

export const ASTRO_BY_SLUG = Object.fromEntries(ASTRO_SIGNS.map((s) => [s.slug, s]));

/** "2026-10-17" → "samedi 17 octobre 2026" */
export function formatDateFr(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
