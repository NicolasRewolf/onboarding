// Feature « articles » — support client autonome : Julien découvre les sujets
// d'articles présélectionnés par Nicolas et choisit ceux qu'il veut voir rédigés.
// Endpoint dédié (api/articles-vote.ts), jamais api/submit (réservé au questionnaire).
//
// Source des données : prospection du 2026-08-05 sur le blog du cabinet — 5 pistes
// explorées, 33 candidats testés, 14 retenus. Volumes Google Ads France vérifiés par
// appel ; SERP top 10 contrôlée sur chaque sujet retenu. Les sujets écartés et leur
// motif vivent côté Nicolas (BACKLOG-IDEES-ARTICLES.md du dépôt éditorial).

/* ─────────────────────────── Types ─────────────────────────── */

export type ArticleChoice = "oui" | "peutetre" | "non";

export type SerieKey = "A" | "B" | "C" | "solo" | "reserve";

export interface Sujet {
  id: number;
  /** Titre de travail — pas le H1 final. */
  titre: string;
  /** Une phrase : pour qui, et ce que l'article règle. */
  accroche: string;
  /** Requête principale visée sur Google. */
  requete: string;
  /** Recherches mensuelles en France sur la requête principale. */
  volume: number;
  /** Précision de lecture du volume (head term, saisonnalité…). */
  volumeNote?: string;
  /** Page du cabinet vers laquelle l'article pousse. */
  pageCible: string;
  /** Libellé lisible de la page cible. */
  pageCibleLabel: string;
  /** L'angle que personne d'autre ne prend. */
  angle: string;
  /** Ce que la première page de Google ne dit pas aujourd'hui. */
  gap: string;
  /** Articles déjà en ligne vers lesquels celui-ci renverra. */
  maillage: string[];
  /** Le point de vigilance à la rédaction. */
  vigilance: string;
  serie: SerieKey;
  /** Fenêtre de publication conseillée. */
  periode: string;
  /** true si la fenêtre est contrainte (saisonnalité). */
  urgent?: boolean;
}

export interface Serie {
  key: SerieKey;
  titre: string;
  promesse: string;
  /** Ce que la série construit une fois les articles publiés à la suite. */
  effet?: string;
}

export interface ArticlesClient {
  slug: string;
  name: string;
  title?: string;
  isTest: boolean;
}

/* ─────────────────────────── Choix ─────────────────────────── */

export const CHOICES: { key: ArticleChoice; label: string; emoji: string; aria: string }[] = [
  { key: "non", label: "Sans moi", emoji: "✋", aria: "Écarter ce sujet" },
  { key: "peutetre", label: "Pourquoi pas", emoji: "🤔", aria: "Garder ce sujet en réserve" },
  { key: "oui", label: "Je le veux", emoji: "✍️", aria: "Retenir ce sujet pour rédaction" },
];

export const CHOICE_BY_KEY: Record<ArticleChoice, (typeof CHOICES)[number]> = {
  non: CHOICES[0],
  peutetre: CHOICES[1],
  oui: CHOICES[2],
};

/** Nombre de coups de cœur épinglables — les sujets à écrire en premier. */
export const MAX_COEURS = 3;

/** Cadence de production tenue par Nicolas. */
export const CADENCE_PAR_MOIS = 4;

/* ─────────────────────────── Séries ─────────────────────────── */

export const SERIES: Serie[] = [
  {
    key: "A",
    titre: "De la plainte à l'argent",
    promesse: "Une situation, un acte, une sortie de secours.",
    effet:
      "Tu as déjà « Dépôt de plainte » en amont et les guides CIVI/SARVI en aval. Il manque le milieu : ces trois-là le remplissent.",
  },
  {
    key: "B",
    titre: "Accident et maladie du travail",
    promesse: "La chronologie d'un dossier : reconnaissance, taux, régime.",
    effet: "Les trois s'appuient sur « Faute inexcusable », publié en juin, qui devient le point d'arrivée.",
  },
  {
    key: "C",
    titre: "Qui paie quand personne ne peut payer",
    promesse: "La pièce qui manque à ton dispositif.",
    effet: "CIVI et SARVI couvrent l'infraction, l'ONIAM le médical. Rien ne couvre le défaut d'assurance sur la route.",
  },
  {
    key: "solo",
    titre: "Les sujets qui se suffisent",
    promesse: "Forts, mais indépendants les uns des autres.",
  },
  {
    key: "reserve",
    titre: "En réserve",
    promesse: "Bons sujets, hors des quatre du mois. Si l'envie est là.",
  },
];

export const SERIE_BY_KEY: Record<SerieKey, Serie> = SERIES.reduce(
  (acc, s) => ({ ...acc, [s.key]: s }),
  {} as Record<SerieKey, Serie>,
);

/* ─────────────────────────── Sujets ─────────────────────────── */

export const SUJETS: Sujet[] = [
  {
    id: 1,
    titre: "Harcèlement scolaire : faire reconnaître la faute et obtenir réparation pour son enfant",
    accroche:
      "Pour le parent qui a signalé, qu'on a écouté poliment, et dont l'enfant va toujours aussi mal.",
    requete: "harcèlement scolaire que faire",
    volume: 590,
    volumeNote: "et 12 100/mois sur « harcèlement scolaire »",
    pageCible: "/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
    pageCibleLabel: "Victimes de délits ou crimes",
    angle:
      "Trois responsabilités, trois juridictions. Celle des parents de l'auteur est la seule qui fait payer.",
    gap: "Toute la première page s'arrête au numéro 3018 et au dialogue avec l'établissement. Personne n'explique comment on obtient réparation.",
    maillage: ["Assigner l'État pour faute lourde", "Délai déraisonnable de procédure", "Dépôt de plainte", "ITT pénale"],
    vigilance:
      "Première page tenue par les ministères et l'UNICEF : il faut aller nettement plus loin que la fiche pratique pour exister.",
    serie: "solo",
    periode: "Août",
    urgent: true,
  },
  {
    id: 2,
    titre: "Soumission chimique : ce que la loi permet quand la victime ne se souvient de rien",
    accroche: "Pour celle ou celui à qui l'on a versé quelque chose dans un verre, et dont la mémoire manque.",
    requete: "soumission chimique",
    volume: 2400,
    pageCible: "/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
    pageCibleLabel: "Victimes de délits ou crimes",
    angle:
      "Elle a perdu la mémoire, donc la preuve. Or la CIVI n'exige ni condamnation ni auteur identifié : personne ne montre cette porte.",
    gap: "La première page est entièrement sanitaire : prévention, dépistage, conduite à tenir médicale. Le droit y est absent.",
    maillage: ["Indemnisation CIVI", "SARVI ou CIVI", "Dépôt de plainte", "ITT pénale"],
    vigilance:
      "Sujet lourd : chaque qualification sera vérifiée sur Légifrance avant rédaction, et la course aux prélèvements chiffrée au jour près.",
    serie: "A",
    periode: "Août",
  },
  {
    id: 3,
    titre: "Conducteur non assuré ou en fuite : le FGAO et pourquoi son offre est presque toujours trop basse",
    accroche: "Pour la victime d'un chauffard introuvable, ou d'un conducteur qui roulait sans assurance.",
    requete: "fgao",
    volume: 2400,
    volumeNote: "et 1 300/mois sur « fonds de garantie des victimes »",
    pageCible: "/indemnisation-des-victimes/accidents-de-la-route",
    pageCibleLabel: "Accidents de la route",
    angle:
      "Le Fonds paie en dernier et oppose à la victime ses propres garanties pour baisser son offre. Et quand le client est le non-assuré, le conseil s'inverse.",
    gap: "La première page appartient au Fonds lui-même et à deux assureurs. Personne n'explique comment on conteste une offre.",
    maillage: ["Loi Badinter 85", "Piéton renversé", "Cycliste renversé", "Accident de moto"],
    vigilance: "Les délais pour saisir le Fonds seront vérifiés article par article avant d'écrire le moindre chiffre.",
    serie: "C",
    periode: "Août",
  },
  {
    id: 4,
    titre: "Avocat commis d'office : comment l'obtenir, ce qu'il coûte vraiment, et quand il ne suffit pas",
    accroche: "Pour la famille qui apprend une garde à vue à 6 h du matin et ne sait pas ce qu'elle a le droit de demander.",
    requete: "avocat commis d'office",
    volume: 5400,
    volumeNote: "le plus gros volume propre du champ pénal, stable toute l'année",
    pageCible: "/honoraires-rendez-vous",
    pageCibleLabel: "Honoraires & rendez-vous",
    angle:
      "Commis d'office, aide juridictionnelle, honoraires libres : le tri, vu de l'intérieur de la permanence bordelaise.",
    gap: "Aucun cabinet en première page. Les seuls formulaires proposés sont ceux de Pau, Troyes, Caen et Valence — et le résumé de Google cite des vidéos TikTok faute de mieux.",
    maillage: ["Changer d'avocat en cours de procédure", "Garde à vue : droits", "Après une garde à vue", "Comparution immédiate"],
    vigilance:
      "Registre non dénigrant absolu : le commis d'office est un confrère. La valeur se joue sur « quand il suffit, quand le dossier impose un avocat choisi ».",
    serie: "solo",
    periode: "Août",
  },
  {
    id: 5,
    titre: "Faire reconnaître une maladie professionnelle : les deux portes d'entrée",
    accroche: "Pour le salarié dont la pathologie vient du travail, mais dont la caisse conteste le lien.",
    requete: "crrmp",
    volume: 1600,
    volumeNote: "et 14 800/mois sur « maladie professionnelle »",
    pageCible: "/indemnisation-des-victimes/droit-et-accidents-du-travail",
    pageCibleLabel: "Droit et accidents du travail",
    angle:
      "Tout se joue sur la preuve : au tableau, la présomption joue ; hors tableau, c'est au salarié de démontrer le lien. Débouché naturel : le burn-out.",
    gap: "Le seul contenu de conseil de la première page s'adresse explicitement aux directions des ressources humaines.",
    maillage: ["Faute inexcusable de l'employeur", "Accident du travail : indemnisation", "Préparer son dossier médical"],
    vigilance:
      "Une association couvre déjà la procédure en position 1 : il faudra aller au-delà, avec de la jurisprudence nommée et des dossiers chiffrés.",
    serie: "B",
    periode: "Septembre",
  },
  {
    id: 6,
    titre: "Deux barèmes, deux montants : le taux d'incapacité en droit commun contre celui de la Sécurité sociale",
    accroche: "Pour la victime qui découvre que les mêmes séquelles ne valent pas la même chose selon le régime.",
    requete: "aipp",
    volume: 1600,
    volumeNote: "et 1 000/mois sur « taux ipp »",
    pageCible: "/indemnisation-des-victimes/droit-et-accidents-du-travail",
    pageCibleLabel: "Droit et accidents du travail",
    angle:
      "Les mêmes séquelles, deux taux, deux montants selon le régime. Tu es le seul de la page à pouvoir les chiffrer côte à côte.",
    gap: "Le contraste entre les deux barèmes n'est nulle part, alors que c'est la première question que pose un client.",
    maillage: ["Faute inexcusable de l'employeur", "Accident du travail : indemnisation", "Préparer son dossier médical", "Pretium doloris"],
    vigilance:
      "Frontière à tenir avec « Faute inexcusable » : on s'arrête au taux et on renvoie sur la majoration de rente.",
    serie: "B",
    periode: "Septembre",
  },
  {
    id: 7,
    titre: "Se constituer partie civile : l'acte qui vous fait passer de plaignant à partie au procès",
    accroche: "Pour la victime qui a porté plainte et découvre qu'elle n'est, juridiquement, encore personne au dossier.",
    requete: "se constituer partie civile",
    volume: 1000,
    volumeNote: "et 2 400/mois sur « partie civile »",
    pageCible: "/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
    pageCibleLabel: "Victimes de délits ou crimes",
    angle:
      "Deux vides : combien demander, pièce par pièce — et comment être payé si le condamné ne paie pas.",
    gap: "Le résumé de Google sert déjà la procédure. Ce qu'il ne dit jamais : combien demander, et comment être payé ensuite.",
    maillage: ["Dépôt de plainte", "SARVI ou CIVI", "Indemnisation CIVI", "SARVI : récupérer ses dommages-intérêts"],
    vigilance: "Vérifier d'abord si « Dépôt de plainte » traite déjà la plainte avec constitution de partie civile.",
    serie: "A",
    periode: "Septembre",
  },
  {
    id: 8,
    titre: "Classement sans suite : décoder le code de votre avis et savoir quoi faire ensuite",
    accroche: "Pour celui qui reçoit un courrier du parquet avec un numéro de motif et rien pour le comprendre.",
    requete: "classement sans suite",
    volume: 2900,
    volumeNote: "dont ~2 000/mois sur les codes de motif eux-mêmes",
    pageCible: "/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
    pageCibleLabel: "Victimes de délits ou crimes",
    angle:
      "Un tableau code par code : « auteur inconnu » n'appelle pas la même réponse qu'« infraction insuffisamment caractérisée », et ouvre la CIVI.",
    gap: "Les concurrents expliquent les recours contre le classement. Aucun ne fait le pont vers l'indemnisation.",
    maillage: ["Dépôt de plainte", "Indemnisation CIVI", "SARVI ou CIVI", "SARVI : récupérer ses dommages-intérêts"],
    vigilance: "L'entrée se fait par les codes de motif, pas par la décision du procureur : cinq confrères y sont déjà.",
    serie: "A",
    periode: "Septembre",
  },
  {
    id: 9,
    titre: "Accident de trajet : ce que la Sécurité sociale ne répare pas",
    accroche: "Pour le salarié blessé entre son domicile et son travail, indemnisé au forfait et qui s'arrête là.",
    requete: "accident de trajet",
    volume: 3600,
    volumeNote: "avec un pic mesuré à 5 400 en janvier (verglas)",
    pageCible: "/indemnisation-des-victimes/accidents-de-la-route",
    pageCibleLabel: "Accidents de la route",
    angle:
      "Double nature : accident du travail au forfait, mais aussi accident de la route — donc réparation intégrale si un tiers est en cause.",
    gap: "Toute la première page raisonne en indemnités journalières et jamais en réparation intégrale.",
    maillage: ["Loi Badinter 85", "Accident du travail : indemnisation", "Piéton renversé", "Faute inexcusable (en contraste)"],
    vigilance:
      "Formulation à surveiller : il n'y a pas « deux indemnisations » cumulables, les sommes de la Sécurité sociale sont déduites. Le seul concurrent sur le sujet écrit d'ailleurs l'inverse.",
    serie: "B",
    periode: "Octobre",
  },
  {
    id: 10,
    titre: "Saisir la commission après un accident médical : le seuil de gravité qui décide de tout",
    accroche: "Pour le patient qui veut éviter le procès et ne sait pas s'il est recevable devant la commission.",
    requete: "crci",
    volume: 880,
    pageCible: "/indemnisation-des-victimes/accidents-et-erreurs-medicales",
    pageCibleLabel: "Accidents et erreurs médicales",
    angle:
      "Le seuil de gravité, couperet d'entrée que personne n'explique. Bonus : Google affiche un encart « CRCI Bordeaux » et aucun cabinet bordelais n'y est.",
    gap: "On explique la procédure partout, jamais la condition d'entrée. C'est pourtant la première question.",
    maillage: ["Indemnisation ONIAM", "Accident médical et aléa thérapeutique", "Préparer son dossier médical", "Chirurgie esthétique ratée"],
    vigilance:
      "Frontière à arbitrer avec « Indemnisation ONIAM » déjà publié : la commission, c'est par quelle porte on entre ; l'ONIAM, c'est qui paie à la fin.",
    serie: "solo",
    periode: "Octobre",
  },
  {
    id: 11,
    titre: "La cour criminelle départementale : ce qui a changé pour les victimes de viol",
    accroche: "Pour comprendre la juridiction qui juge désormais la majorité des viols, sans jury populaire.",
    requete: "cour criminelle départementale",
    volume: 1600,
    volumeNote: "attention : le volume n'existe que sur la forme accentuée",
    pageCible: "/defense-penale/proces-criminel",
    pageCibleLabel: "Procès criminel",
    angle: "Une pièce de notoriété : le cabinet plaide devant elle, très peu de confrères en parlent.",
    gap: "Aucun cabinet en résultats naturels sur la requête.",
    maillage: ["Statuts en procédure pénale", "Comparution immédiate", "Période de sûreté"],
    vigilance: "Lectorat plutôt étudiant et institutionnel : c'est un actif d'image, pas un article qui apporte des dossiers.",
    serie: "reserve",
    periode: "Hors cadence",
  },
  {
    id: 12,
    titre: "Contre-expertise d'assurance : contester le rapport de l'expert",
    accroche: "Pour l'assuré à qui l'expert de la compagnie annonce un montant qu'il sait insuffisant.",
    requete: "contre expertise assurance",
    volume: 320,
    pageCible: "/droit-des-contrats-et-des-personnes/droit-assurances-particuliers-professionnels",
    pageCibleLabel: "Droit des assurances",
    angle: "Aucun avocat ne s'est positionné sur la requête : angle mort complet.",
    gap: "Le sujet est traité par des cabinets d'expertise, jamais par des juristes.",
    maillage: ["Sinistre habitation : recours", "Assurance perte d'exploitation", "Sinistre auto : preuve d'achat"],
    vigilance: "Petit volume, sujet secondaire : à prendre si ça te parle, pas par priorité.",
    serie: "reserve",
    periode: "Hors cadence",
  },
  {
    id: 13,
    titre: "Le sursis probatoire : ce que le tribunal attend vraiment de vous",
    accroche: "Pour le condamné qui a évité la prison mais découvre une liste d'obligations à tenir.",
    requete: "sursis probatoire",
    volume: 3600,
    pageCible: "/defense-penale/droit-penal",
    pageCibleLabel: "Droit pénal",
    angle: "La ligne de partage que personne ne pose : ce que le tribunal décide à l'audience, et ce que le juge d'application des peines décide après.",
    gap: "Deux cabinets sont déjà installés sur le sujet — il faut entrer par cette distinction ou ne pas entrer.",
    maillage: ["Aménagement de peine", "Période de sûreté", "Comparution immédiate"],
    vigilance: "Risque de doublon avec « Aménagement de peine » si la distinction n'est pas posée dès l'introduction.",
    serie: "reserve",
    periode: "Hors cadence",
  },
];

export const SUJETS_A_L_AFFICHE = SUJETS.filter((s) => s.serie !== "reserve");
export const SUJETS_EN_RESERVE = SUJETS.filter((s) => s.serie === "reserve");

/** Sujets d'une série, dans l'ordre de production. */
export function sujetsDeSerie(key: SerieKey): Sujet[] {
  return SUJETS.filter((s) => s.serie === key);
}

/* ─────────────────────────── Clients ─────────────────────────── */

// On tutoie Julien (proche) : pas de « Maître » dans l'interface — le récap envoyé
// à Nicolas reprend ce même prénom.
const REGISTRY: Record<string, ArticlesClient> = {
  plouton: { slug: "plouton", name: "Julien", title: "Cabinet Plouton", isTest: false },
};

const isTestSlug = (slug: string) => /^(demo|test)/i.test(slug);

function prettify(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function resolveArticlesClient(slug: string, params: URLSearchParams): ArticlesClient {
  const known = REGISTRY[slug.toLowerCase()];
  if (known) return known;
  return {
    slug,
    name: params.get("n") || prettify(slug),
    title: params.get("t") || undefined,
    isTest: isTestSlug(slug),
  };
}

/** « Me Plouton » → « Maître Plouton » ; un prénom seul reste tel quel. */
export function salutation(name: string): string {
  const m = name.match(/^M(?:e|aître)\.?\s+(.+)$/i);
  if (m) {
    const parts = m[1].trim().split(/\s+/).filter(Boolean);
    return "Maître " + parts[parts.length - 1];
  }
  return name;
}

/* ─────────────────────────── Affichage ─────────────────────────── */

/** « 2400 » → « 2 400 ». */
export function formatVolume(n: number): string {
  return n.toLocaleString("fr-FR");
}
