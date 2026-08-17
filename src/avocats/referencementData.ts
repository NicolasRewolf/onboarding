/**
 * Données de la page « Référencement et contenu juridique pour avocats ».
 *
 * Page d'atterrissage dédiée au groupe d'annonces « Référencement ».
 *
 * Pourquoi elle existe, mesuré le 17 août 2026 : les groupes « Référencement »
 * et « Communication » pointaient tous les deux vers `/avocats`, une page qui
 * présente les quatre métiers du studio. Deux intentions différentes, une page
 * fourre-tout — exactement le décalage annonce → page que Google sanctionne
 * dans la composante « convivialité de la page de destination », notée
 * inférieure à la moyenne sur 100 % des mots clés depuis le lancement.
 *
 * Cette page-ci ne parle que d'une chose : être trouvé sur Google, et le
 * contenu qui y mène. C'est aussi la seule offre que la trajectoire du cabinet
 * Plouton démontre réellement — la preuve y est native, pas empruntée.
 *
 * Règle de rédaction, héritée des deux pages sœurs : rien n'est affirmé sans
 * source vérifiable, et aucune promesse de position n'est faite.
 */

/** Ce que couvre l'abonnement. Les montants viennent de `data.ts` (TARIF). */
export const RYTHME = {
  articlesParMois: 4,
  motsParArticle: "1 500 à 2 500",
  relectureHeures: 1,
  delaiPremiersSignes: "un à deux trimestres",
} as const;

export type Question = { num: string; titre: string; texte: string };

/**
 * Ce que tape un justiciable. Le cœur de l'argument : il ne cherche pas un
 * avocat, il cherche une réponse — et il choisit celui qui la lui a donnée.
 */
export const REQUETES: Question[] = [
  {
    num: "01",
    titre: "Il ne connaît pas votre nom",
    texte:
      "Personne ne tape « maître Untel » avant de vous connaître. On tape « que risque-t-on pour une conduite sans permis », « combien de temps dure une garde à vue », « mon employeur peut-il me licencier pendant un arrêt ». Votre nom vient après la réponse, jamais avant.",
  },
  {
    num: "02",
    titre: "Il cherche à comprendre avant d'appeler",
    texte:
      "Un justiciable qui découvre son problème passe des heures à lire avant de composer un numéro. Le cabinet qu'il appelle est presque toujours celui dont il a lu quelque chose — pas celui dont il a vu une plaquette.",
  },
  {
    num: "03",
    titre: "Il pose sa question à une machine",
    texte:
      "Une partie de ces recherches n'arrive plus sur un moteur mais sur une intelligence artificielle, qui répond en citant ses sources. Les cabinets qui écrivent sont ceux qui se font citer. Ceux qui ne publient rien n'existent pas dans cette conversation.",
  },
];

export type Piece = { num: string; titre: string; texte: string };

/** Ce qu'on livre chaque mois. Décrit comme un travail, pas comme un volume. */
export const LIVRAISON: Piece[] = [
  {
    num: "01",
    titre: "Le choix des sujets",
    texte:
      "Nous partons de ce que vos futurs clients tapent réellement, pas de ce qui nous semble intéressant. Volumes de recherche, questions posées, concurrence sur chaque requête. Vous validez la liste avant qu'une ligne soit écrite.",
  },
  {
    num: "02",
    titre: "La recherche juridique",
    texte:
      "Textes, jurisprudence, barèmes en vigueur. Un article qui se trompe sur un délai vous coûte plus cher qu'un article qui n'existe pas — c'est votre nom en signature, pas le nôtre.",
  },
  {
    num: "03",
    titre: "La rédaction",
    texte:
      `Quatre articles par mois, ${RYTHME.motsParArticle} mots, écrits pour être lus par un justiciable et non par un confrère. Le droit y est exact, la langue y est claire.`,
  },
  {
    num: "04",
    titre: "La structure et le maillage",
    texte:
      "Titres, métadonnées, table des matières, liens vers vos pages de matières. Un article isolé ne remonte pas : c'est l'ensemble qui construit la position, article après article.",
  },
  {
    num: "05",
    titre: "La mise en ligne",
    texte:
      "Nous publions, vous n'avez rien à faire. Les articles arrivent en brouillon, vous validez, ils partent. Aucun texte n'est publié sans votre accord écrit.",
  },
  {
    num: "06",
    titre: "Le rapport mensuel",
    texte:
      "Positions, trafic, requêtes gagnées. Chiffres bruts issus de votre Search Console — pas d'indicateurs maison, pas de tableau de bord flatteur.",
  },
];

/**
 * Ce que l'abonnement ne fait pas. Section délibérée : ce lectorat repère une
 * promesse excessive plus vite que n'importe quel autre, et une seule suffit
 * à disqualifier tout le reste.
 */
export const LIMITES: Piece[] = [
  {
    num: "01",
    titre: "Aucune promesse de position",
    texte:
      "Personne ne peut garantir une place sur Google, et quiconque vous la vend ment. Nous nous engageons sur un rythme de publication et sur la qualité du travail, pas sur un rang.",
  },
  {
    num: "02",
    titre: "Ce n'est pas immédiat",
    texte:
      `Comptez ${RYTHME.delaiPremiersSignes} avant des signes lisibles, et davantage pour une position installée. Le cabinet dont vous lisez les chiffres plus bas a mis cinq trimestres. Si vous avez besoin de dossiers le mois prochain, ce n'est pas le bon outil.`,
  },
  {
    num: "03",
    titre: "Ça ne rattrape pas un site cassé",
    texte:
      "Si votre site est lent, illisible sur téléphone ou mal structuré, les articles y seront mal servis. Nous vous le dirons au premier échange — et nous refuserons le contenu tant que le socle ne tient pas.",
  },
];

export type FAQ = { q: string; r: string };

export const QUESTIONS: FAQ[] = [
  {
    q: "Qui écrit, exactement ?",
    r: "Nous. Vous relisez et vous validez. Nous ne sous-traitons pas la rédaction juridique, et aucun texte ne part sans votre accord écrit — c'est votre nom qui le signe.",
  },
  {
    q: "Est-ce que ça parle de mes dossiers ?",
    r: "Jamais. Les articles traitent de la règle, pas de vos affaires et pas de vous. C'est ce qui les rend publiables sans avoir le sentiment de se vendre, et ce qui vous tient à distance du secret professionnel.",
  },
  {
    q: "Combien de temps ça me prend ?",
    r: `Environ ${RYTHME.relectureHeures} heure par mois. Vous relisez par lots, vous corrigez ce qui doit l'être, vous ne rédigez pas. Si le cabinet compte plusieurs associés, désignez celui qui tranche : un texte relu par quatre confrères n'est jamais publié.`,
  },
  {
    q: "Et si j'arrête ?",
    r: "Vous arrêtez à la fin du mois de votre choix, le premier compris. Les articles publiés restent les vôtres, les droits vous sont cédés par écrit, et rien ne se coupe le jour où vous partez.",
  },
  {
    q: "C'est compatible avec le RIN ?",
    r: "Oui. Un article qui explique une règle de droit relève de l'information juridique, pas de la publicité personnelle au sens de l'article 10 du RIN. Nous travaillons dans ce cadre, et tout texte qui vous semble limite ne sort pas.",
  },
  {
    q: "Je n'ai pas de blog sur mon site.",
    r: "Nous en créons un, structuré par thèmes, capable d'absorber plusieurs centaines d'articles sans devenir illisible. Si votre site ne peut pas l'accueillir, c'est le sujet d'avant — voyez la page consacrée à la création de site.",
  },
];
