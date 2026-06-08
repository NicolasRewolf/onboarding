/**
 * Contenu de la plaquette d'offres REWOLF (synchrone avec REWOLF_Offres_Services_v2.pdf).
 * Source unique pour la page /offre-starter : changer un prix ici ⇒ ça se répercute partout
 * (hero, cartes, comparatif, calculateur).
 */

export type Forfait = {
  id: "origine" | "signature";
  number: "01" | "02";
  name: string;
  tagline: string;
  price: number;
  delay: string;
  payment: string;
  rounds: string;
  blocks: { title: string; items: string[] }[];
  forWho: string[];
};

export const FORFAITS: Forfait[] = [
  {
    id: "origine",
    number: "01",
    name: "Origine",
    tagline: "L'essentiel du branding, structuré et prêt à l'emploi.",
    price: 800,
    delay: "1 mois",
    payment: "Paiement en 2×",
    rounds: "2 rounds de révisions",
    blocks: [
      {
        title: "Stratégie de marque",
        items: ["À propos & mission", "Vision & valeurs", "Moodboard & direction artistique"],
      },
      {
        title: "Identité visuelle",
        items: ["Logo principal & secondaire", "Palette de couleurs", "Typographies"],
      },
      {
        title: "Livrables",
        items: ["Brand book PDF", "Fichiers logos (JPG, PNG, SVG)"],
      },
    ],
    forWho: [
      "Vous créez votre activité et voulez partir sur de bonnes bases",
      "Votre image actuelle ne vous ressemble pas",
      "Budget maîtrisé, sans compromis sur la qualité",
    ],
  },
  {
    id: "signature",
    number: "02",
    name: "Signature",
    tagline: "Une identité complète, cohérente sur tous vos supports.",
    price: 1600,
    delay: "2 mois",
    payment: "Paiement en 2×",
    rounds: "2 rounds de révisions",
    blocks: [
      {
        title: "Stratégie complète",
        items: [
          "À propos, mission, vision, valeurs",
          "Tonalité & personnalité de marque",
          "Territoire verbal",
          "Moodboard & direction artistique",
          "Stratégie de contenu",
        ],
      },
      {
        title: "Identité visuelle complète",
        items: [
          "Logo principal, secondaire, icônes",
          "Palette de couleurs complète",
          "Typographies",
          "Motifs & textures",
          "Brand guidelines & mockups",
        ],
      },
      {
        title: "Livrables",
        items: ["Brand book PDF", "Fichiers logos (JPG, PNG, SVG)"],
      },
    ],
    forWho: [
      "Vraies ambitions de déploiement",
      "Identité prête sur tous vos supports",
      "Accompagnement stratégique, pas seulement créatif",
    ],
  },
];

export type Extra = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  detail: string;
};

export const EXTRAS: Extra[] = [
  {
    id: "shooting",
    name: "Shooting de marque",
    price: 600,
    priceLabel: "600 € HT",
    detail: "Demi-journée · DA · retouche",
  },
  {
    id: "small",
    name: "Graphisme Small",
    price: 300,
    priceLabel: "300 € HT",
    detail: "Carte de visite, sticker, étiquette",
  },
  {
    id: "medium",
    name: "Graphisme Medium",
    price: 500,
    priceLabel: "500 € HT",
    detail: "Flyer, kit Instagram, menu",
  },
  {
    id: "big",
    name: "Graphisme Big",
    price: 1400,
    priceLabel: "à partir de 1 400 € HT",
    detail: "Packaging, livrets, présentations",
  },
];

/** Lignes du comparatif : ✓ = inclus, "—" = non inclus. */
export const COMPARATIF: { label: string; origine: boolean; signature: boolean }[] = [
  { label: "Stratégie de marque (mini)", origine: true, signature: false },
  { label: "Stratégie de marque complète", origine: false, signature: true },
  { label: "Tonalité & territoire verbal", origine: false, signature: true },
  { label: "Stratégie de contenu", origine: false, signature: true },
  { label: "Logo principal & secondaire", origine: true, signature: true },
  { label: "Palette de couleurs", origine: true, signature: true },
  { label: "Typographies", origine: true, signature: true },
  { label: "Icônes, motifs & textures", origine: false, signature: true },
  { label: "Brand guidelines & mockups", origine: false, signature: true },
  { label: "Brand book PDF + fichiers logos", origine: true, signature: true },
  { label: "2 rounds de révisions inclus", origine: true, signature: true },
];

export const PROCESS: { n: string; title: string; detail: string; tag?: string }[] = [
  { n: "01", title: "Contact", detail: "Par e-mail ou via le formulaire sur rewolf.studio" },
  { n: "02", title: "Appel découverte", detail: "30 min pour comprendre vos besoins et valider la formule" },
  {
    n: "03",
    title: "Questionnaire de brief",
    detail:
      "Vous remplissez un questionnaire détaillé sur votre marque et vos objectifs — le fondement de toute la mission",
    tag: "Nouveau",
  },
  { n: "04", title: "Devis & lancement", detail: "Devis confirmé + acompte de 50 % pour démarrer" },
  { n: "05", title: "Création & révisions", detail: "2 rounds de révisions inclus. Au-delà : facturation au temps passé." },
  { n: "06", title: "Livraison", detail: "Livrables organisés, nommés, prêts à l'emploi immédiatement" },
];

/**
 * Aperçus de projets en bas de page (section Portfolio).
 * Les images sont chargées depuis /public/projects/<slug>.jpg — déposer
 * un visuel carré ou portrait pour chaque projet. Si le fichier manque,
 * un fond beige clair s'affiche en fallback (DA REWOLF).
 */
export const PORTFOLIO: { slug: string; name: string; tag: string; detail: string }[] = [
  { slug: "la-princiere", name: "La Princière", tag: "Food", detail: "Identité restaurant indépendant" },
  { slug: "etche-verde", name: "Etche Verde", tag: "Bien-être", detail: "Branding acteur du naturel" },
  { slug: "yamas", name: "Yamas", tag: "Food", detail: "Identité restaurant méditerranéen" },
];

export const CONTACT = {
  name: "Elise Ribelles",
  role: "Co-fondatrice · Brand designer & stratège marketing",
  credentials: "5+ ans en direction artistique",
  email: "elise@rewolf.studio",
  phone: "06 34 67 27 68",
  site: "rewolf.studio",
};

export const formatPrice = (n: number) =>
  n.toLocaleString("fr-FR").replace(/ /g, " ").replace(",", " ");
