/**
 * Données de la plaquette « Cabinets d'avocats ».
 *
 * Les chiffres Plouton proviennent de la Google Search Console du cabinet
 * (propriété jplouton-avocat.fr), relevés le 6 août 2026 sur la fenêtre
 * glissante de 16 mois. Publication autorisée par le cabinet.
 * Reprise du site + migration Wix : février 2025.
 */

export type Trimestre = {
  label: string;
  periode: string;
  impressions: number;
  clics: number;
  position: number;
};

/** Trajectoire trimestrielle du cabinet Plouton depuis la reprise. */
export const TRAJECTOIRE: Trimestre[] = [
  { label: "T2 2025", periode: "avr. → juin 2025", impressions: 737_083, clics: 16_553, position: 18.6 },
  { label: "T3 2025", periode: "juil. → sept. 2025", impressions: 965_805, clics: 20_617, position: 13.47 },
  { label: "T4 2025", periode: "oct. → déc. 2025", impressions: 1_056_375, clics: 27_941, position: 9.73 },
  { label: "T1 2026", periode: "janv. → mars 2026", impressions: 1_730_504, clics: 42_856, position: 8.18 },
  { label: "T2 2026", periode: "avr. → juin 2026", impressions: 1_421_243, clics: 34_478, position: 7.37 },
];

/** Chiffres clés mis en avant dans le hero et la section preuve. */
export const CHIFFRES = {
  positionDepart: 18.6,
  positionActuelle: 7.37,
  impressions16Mois: 6_333_612,
  clics16Mois: 153_300,
  articles: 427,
  repriseAnnee: "février 2025",
  /** Comparaison T2 2025 → T2 2026, à saisonnalité neutralisée. */
  yoy: {
    impressions: 92.8,
    clics: 108.3,
  },
} as const;

/**
 * Tarif affiché. Correspond au récurrent réellement facturé (4 articles à 150 € HT).
 * L'audit des dix personas a montré que l'absence de prix leur faisait imaginer
 * bien pire que la réalité : sept sur dix ont renoncé à appeler pour cette raison.
 */
export const TARIF = {
  mensuel: 600,
  articlesParMois: 4,
  prixArticle: 150,
  siteAPartirDe: 2500,
} as const;

export type Bloc = {
  num: string;
  titre: string;
  chapo: string;
  items: string[];
};

/**
 * Le 360 regroupé en quatre blocs. On ne liste pas dix services : un cabinet
 * n'achète pas une liste, il achète de ne pas piloter cinq prestataires.
 */
export const BLOCS: Bloc[] = [
  {
    num: "01",
    titre: "Marque & positionnement",
    chapo:
      "Ce qui distingue votre cabinet d'un autre, formulé avant d'être dessiné. Un pénaliste, un fiscaliste et un cabinet d'affaires ne se présentent pas de la même façon.",
    items: [
      "Positionnement & territoire de communication",
      "Identité visuelle complète",
      "Ton de voix & charte éditoriale",
      "Supports print et plaquettes",
    ],
  },
  {
    num: "02",
    titre: "Site & socle technique",
    chapo:
      "Un site rapide, lisible sur mobile, correctement structuré pour Google. C'est la condition d'entrée : sans elle, aucun contenu ne remonte.",
    items: [
      "Conception & développement",
      "Architecture des pages et des domaines d'intervention",
      "Performance, accessibilité, données structurées",
      "Migration sans perte de positionnement",
    ],
  },
  {
    num: "03",
    titre: "Contenu & référencement",
    chapo:
      "Le cœur du dispositif. Des articles qu'un avocat accepte de signer, écrits sur les questions que vos futurs clients posent réellement à Google.",
    items: [
      "Stratégie de mots-clés et de contenus",
      "Rédaction juridique long format",
      "Reprise et restructuration de vos articles existants",
      "Suivi mensuel des positions et du trafic",
    ],
  },
  {
    num: "04",
    titre: "Photographie & image",
    chapo:
      "Un cabinet se choisit aussi sur une impression. Les photos d'équipe génériques coûtent des rendez-vous.",
    items: [
      "Portraits d'associés et de collaborateurs",
      "Reportage au cabinet",
      "Direction de shooting",
      "Livrables web, print et réseaux",
    ],
  },
];

export type Etape = { num: string; titre: string; texte: string; duree: string };

export const PROCESS: Etape[] = [
  {
    num: "01",
    titre: "Cadrage",
    texte:
      "Un échange, puis un questionnaire structuré. On identifie vos domaines porteurs, votre ressort géographique et ce que cherchent vos futurs clients.",
    duree: "1 à 2 semaines",
  },
  {
    num: "02",
    titre: "Fondations",
    texte:
      "Identité si nécessaire, architecture du site, socle technique. C'est la phase la plus visible, et la moins rentable si elle s'arrête là.",
    duree: "4 à 8 semaines",
  },
  {
    num: "03",
    titre: "Production éditoriale",
    texte:
      "La partie qui produit les résultats. Publication régulière, chaque texte relu et validé par vous avant mise en ligne.",
    duree: "en continu",
  },
  {
    num: "04",
    titre: "Mesure",
    texte:
      "Rapport mensuel : positions, trafic, requêtes gagnées. Chiffres bruts issus de votre Search Console, pas d'indicateurs maison.",
    duree: "mensuel",
  },
];

/**
 * Références de studio — marque, direction artistique, photographie.
 * Volontairement séparées du cas Plouton : les personas lisaient cette ligne
 * comme « agence de luxe généraliste », ce qui isolait le seul client avocat.
 */
export const REFERENCES = [
  "Dassault Aviation",
  "GQ × Mouton Cadet",
  "Maker's Mark",
  "Hôtels Eklo",
  "Le M. — Musée du Vin",
  "Hysope",
] as const;

export const CONTACT = {
  nicolas: {
    nom: "Nicolas Doucet",
    role: "Co-fondateur · web, contenu, acquisition",
    email: "nicolas@rewolf.studio",
    tel: "06 31 62 17 76",
    telHref: "+33631621776",
  },
  elise: {
    nom: "Élise Ribelles",
    role: "Co-fondatrice · marque, direction artistique",
    email: "elise@rewolf.studio",
    tel: "06 34 67 27 68",
    telHref: "+33634672768",
  },
} as const;

/** Formatage FR : 1 730 504 → « 1 730 504 » (espaces insécables fines). */
export function formatNombre(n: number): string {
  return n.toLocaleString("fr-FR").replace(/ /g, " ");
}

export function formatPosition(p: number): string {
  return p.toFixed(2).replace(".", ",");
}
