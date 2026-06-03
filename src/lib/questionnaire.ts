// ════════════════════════════════════════════════════════════════════
// Questionnaire de cadrage REWOLF — socle réutilisable (52 questions / 9 sections)
// Source : questionnaire de cadrage projet REWOLF.
// ════════════════════════════════════════════════════════════════════

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
  | "budget";

export type Priority = "E" | "C"; // Essentiel / Confort (facultatif)

export interface Question {
  id: string;
  n: number;
  p: Priority;
  type: QType;
  label: string;
  why?: string;
  ph?: string;
  options?: string[];
  budgetOptions?: [string, string][]; // [montant, sous-titre]
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

export const SECTIONS: Section[] = [
  {
    t: "Vous & le cabinet",
    d: "Pour bien vous cerner avant de poser la moindre piste créative.",
    qs: [
      { id: "q1", n: 1, p: "E", type: "text", label: "Nom exact sous lequel vous exercez (et nom commercial du cabinet s'il diffère) ?", why: "Pour vos mentions légales, vos signatures mail et votre futur nom de domaine.", ph: "Me Jacques Derieux — Cabinet…" },
      { id: "q2", n: 2, p: "E", type: "choice", label: "Êtes-vous seul, en collaboration, ou prévoyez-vous d'associer / recruter prochainement ?", why: "Cela oriente le branding (nom propre ou cabinet) et la future page « équipe ».", options: ["Seul·e", "En collaboration", "Association / recrutement à venir"], precision: "Précisez si besoin…" },
      { id: "q3", n: 3, p: "E", type: "textarea", label: "Depuis combien de temps exercez-vous, et quel est votre parcours ?", why: "Barreau, formations, distinctions : la matière première de votre page cabinet et de votre crédibilité (y compris aux yeux de Google).", ph: "Année de prestation de serment, barreau, diplômes, expériences marquantes…" },
      { id: "q4", n: 4, p: "E", type: "text", label: "Où êtes-vous installé, et quelle zone géographique visez-vous ?", why: "Adresse et barreau de rattachement : référencement local, ciblage des recherches « ville » et Google Business Profile.", ph: "Ville, barreau, zone d'intervention…" },
      { id: "q5", n: 5, p: "C", type: "text", label: "Comment décririez-vous votre personnalité professionnelle en 3 mots ?", why: "Pour caler le ton éditorial du site et la direction artistique de l'identité.", ph: "ex. rigoureux, combatif, humain" },
      { id: "q6", n: 6, p: "E", type: "textarea", label: "Qu'est-ce qui vous différencie d'un confrère du même barreau, concrètement ?", why: "C'est votre angle de positionnement — et l'accroche de votre page d'accueil.", ph: "Approche, spécialité, méthode, type de clientèle…" },
      { id: "q7", n: 7, p: "C", type: "textarea", label: "Des confrères ou cabinets dont vous admirez la communication ?", why: "Des repères de direction artistique et un point de départ pour notre veille.", ph: "Noms + ce qui vous plaît chez eux (le site, le ton, l'identité…)" },
    ],
  },
  {
    t: "Domaines d'expertise & contenu",
    d: "Ce qui structurera l'arborescence du site et la production de contenu.",
    qs: [
      { id: "q8", n: 8, p: "E", type: "ranked", label: "Quels sont vos domaines d'intervention ? Classez-les par ordre d'importance.", why: "Ils définissent les silos d'expertise du site et l'ordre de priorité des contenus.", ph: "1. …\n2. …\n3. …" },
      { id: "q9", n: 9, p: "E", type: "textarea", label: "Pour chaque domaine : plutôt défense, conseil, ou contentieux ?", why: "Cela change la formulation des pages d'expertise et le registre des appels à l'action.", ph: "ex. Droit de la famille → conseil + contentieux ; Pénal → défense…" },
      { id: "q10", n: 10, p: "E", type: "textarea", label: "Y a-t-il des niches où vous voulez devenir une référence identifiée ?", why: "C'est là qu'on concentrera la stratégie de contenu et les mots-clés à fort enjeu.", ph: "Sujets précis sur lesquels vous voulez être LA réponse…" },
      { id: "q11", n: 11, p: "E", type: "textarea", label: "Quels sont les profils de vos clients types selon les domaines ?", why: "Particuliers, pros, situations d'urgence… cela hiérarchise l'information et le ton (urgence vs réassurance).", ph: "Pour chaque domaine, qui vient vous voir et dans quel état d'esprit…" },
      { id: "q12", n: 12, p: "E", type: "textarea", label: "Des affaires marquantes, décisions obtenues ou dossiers emblématiques communicables ?", why: "Pour bâtir une page « affaires » avec des preuves concrètes plutôt que des promesses.", ph: "Même anonymisées : résultats obtenus, jurisprudence, dossiers notables…" },
      { id: "q13", n: 13, p: "E", type: "textarea", label: "Certains sujets sont-ils sensibles ou à éviter dans la communication publique ?", why: "Vos lignes rouges éditoriales et les contraintes déontologiques à respecter.", ph: "Sujets, formulations ou domaines à ne pas mettre en avant…" },
    ],
  },
  {
    t: "Identité visuelle & branding",
    d: "La direction artistique : couleurs, typographies, impression générale.",
    qs: [
      { id: "q14", n: 14, p: "E", type: "textarea", file: true, label: "Avez-vous déjà un logo, des couleurs, une charte, même informels ?", why: "Pour savoir si on part d'une refonte ou d'une création from scratch.", ph: "Décrivez l'existant — et joignez-le ci-dessous si vous l'avez." },
      { id: "q15", n: 15, p: "E", type: "textarea", label: "Quelle impression voulez-vous donner au premier regard ?", why: "Sérieux, accessible, premium, combatif… c'est le cœur de la direction artistique.", ph: "Décrivez le ressenti visé chez quelqu'un qui découvre votre cabinet…" },
      { id: "q16", n: 16, p: "E", type: "text", label: "Des couleurs que vous aimez ? Que vous détestez / interdisez ?", why: "Pour cadrer la palette print et web dès les premières propositions.", ph: "J'aime… / J'évite absolument…" },
      { id: "q17", n: 17, p: "C", type: "links", file: true, label: "3 à 5 visuels, sites ou marques (tout secteur) qui vous parlent esthétiquement.", why: "Un moodboard pour aligner nos attentes avant les premières pistes.", ph: "Liens, noms de marques — un par ligne. Ou joignez des images." },
      { id: "q18", n: 18, p: "E", type: "multi", label: "Le logo devra vivre sur quels supports ?", why: "Cela détermine les déclinaisons à prévoir et les formats de livraison.", options: ["Site web", "Plaque professionnelle", "Papeterie / courrier", "Robe", "Réseaux sociaux", "Signature mail"], allowOther: true },
      { id: "q19", n: 19, p: "C", type: "boolean", label: "Souhaitez-vous une charte / guidelines de marque pour de futurs collaborateurs ?", why: "Pour savoir si ce livrable doit faire partie du périmètre." },
    ],
  },
  {
    t: "Photographie & image",
    d: "Faut-il prévoir un shooting — et dans quelles conditions.",
    qs: [
      { id: "q20", n: 20, p: "C", type: "booleanDetail", label: "Souhaitez-vous un shooting photo (portrait, cabinet, équipe) ?", why: "Pour décider d'inclure — ou non — le poste photo au devis.", detailPh: "Si oui : quel type de photos vous imaginez ?" },
      { id: "q21", n: 21, p: "C", type: "text", label: "Êtes-vous à l'aise face à l'objectif, ou faut-il une direction poussée le jour J ?", why: "Cela influe sur la logistique et la durée du shooting.", ph: "Très à l'aise / plutôt timide / besoin d'être guidé…" },
      { id: "q22", n: 22, p: "C", type: "text", label: "Avez-vous un lieu qui peut servir de décor, ou faut-il un studio ?", why: "Pour organiser le repérage et estimer le coût logistique.", ph: "Cabinet, extérieur, à définir, studio nécessaire…" },
    ],
  },
  {
    t: "Le site web",
    d: "Pages, fonctionnalités, autonomie : le cœur du chiffrage technique.",
    qs: [
      { id: "q23", n: 23, p: "E", type: "text", label: "Avez-vous déjà un nom de domaine ? Si oui, lequel, et qui le gère ?", why: "Pour anticiper la migration, les DNS et la configuration technique.", ph: "ex. cabinet-derieux.fr — géré chez OVH / pas encore de domaine" },
      { id: "q24", n: 24, p: "C", type: "links", label: "Des sites d'avocats (ou autres) dont vous aimez la structure ou l'expérience ?", why: "Des références d'arborescence et d'expérience utilisateur.", ph: "Liens — un par ligne." },
      { id: "q25", n: 25, p: "E", type: "multi", label: "Quelles pages jugez-vous indispensables ?", why: "Cela définit l'arborescence et le périmètre de développement, page par page.", options: ["Accueil", "Expertises", "Cabinet / À propos", "Honoraires", "Contact", "Blog / Actualités", "FAQ", "Mentions légales"], allowOther: true },
      { id: "q26", n: 26, p: "E", type: "textarea", label: "Voulez-vous afficher vos honoraires / modalités ?", why: "Forfait, taux horaire, aide juridictionnelle, premier RDV : transparence et qualification des demandes.", ph: "Ce que vous accepteriez d'afficher, et sous quelle forme…" },
      { id: "q27", n: 27, p: "E", type: "multi", label: "Quelles fonctionnalités au-delà des pages ?", why: "Ces modules constituent le cœur du chiffrage technique.", options: ["Prise de RDV en ligne", "FAQ filtrable", "Espace client sécurisé", "Paiement en ligne", "Newsletter", "Chat / messagerie"], allowOther: true },
      { id: "q28", n: 28, p: "E", type: "choice", label: "Souhaitez-vous gérer vous-même le contenu après livraison, ou déléguer ?", why: "Pour calibrer la prise en main, votre niveau d'autonomie et un éventuel suivi.", options: ["Gérer moi-même", "Déléguer entièrement", "Un mix des deux"], precision: "Précisez…" },
      { id: "q29", n: 29, p: "E", type: "textarea", label: "Avez-vous des contraintes déontologiques de l'Ordre à respecter sur le site ?", why: "Mentions obligatoires, sollicitation personnalisée… pour rester pleinement conforme.", ph: "Tout ce que l'Ordre impose ou interdit, à votre connaissance…" },
      { id: "q30", n: 30, p: "C", type: "boolean", label: "Le site doit-il exister en plusieurs langues ?", why: "Cela ouvre un périmètre technique et de traduction supplémentaire." },
    ],
  },
  {
    t: "Blog & stratégie de contenu",
    d: "Votre présence éditoriale et votre moteur de visibilité dans le temps.",
    qs: [
      { id: "q31", n: 31, p: "E", type: "text", label: "Souhaitez-vous un blog / espace actualités, et à quelle fréquence publier ?", why: "Pour dimensionner le module blog et le calendrier éditorial.", ph: "Oui, environ 1 article / mois — ou : pas pour l'instant" },
      { id: "q32", n: 32, p: "E", type: "choice", label: "Préférez-vous rédiger vous-même, valider des contenus rédigés, ou tout déléguer ?", why: "Cela définit le modèle de production éditoriale et l'accompagnement.", options: ["Rédiger moi-même", "Valider des contenus", "Tout déléguer"], precision: "Précisez…" },
      { id: "q33", n: 33, p: "C", type: "textarea", label: "Quels types de contenus vous semblent pertinents ?", why: "Vulgarisation, analyses de décisions, victoires… vos lignes éditoriales et catégories.", ph: "Les formats qui vous parlent et ceux que vous voulez éviter…" },
      { id: "q34", n: 34, p: "E", type: "textarea", label: "Acceptez-vous de communiquer sur vos dossiers réels (anonymisés) ?", why: "C'est le contenu le plus convaincant : études de cas et preuves d'expertise.", ph: "Jusqu'où êtes-vous prêt à aller, et avec quelles précautions…" },
      { id: "q35", n: 35, p: "C", type: "text", label: "Êtes-vous actif sur des réseaux (LinkedIn, etc.) à connecter au site ?", why: "Pour les intégrations et la cohérence de votre marque.", ph: "Liens vers vos profils, ou : aucun pour l'instant" },
    ],
  },
  {
    t: "Contact & acquisition",
    d: "Comment les futurs clients vous trouvent et vous joignent.",
    qs: [
      { id: "q36", n: 36, p: "E", type: "multi", label: "Comment voulez-vous être contacté en priorité ?", why: "Pour concevoir le bon parcours de contact et le formulaire.", options: ["Formulaire", "Téléphone", "E-mail", "RDV en ligne", "WhatsApp"], allowOther: true },
      { id: "q37", n: 37, p: "E", type: "multi", label: "Quelles informations récolter via le formulaire pour qualifier une demande ?", why: "Ce sont les champs du formulaire et le pré-tri des dossiers.", options: ["Nom", "E-mail", "Téléphone", "Domaine concerné", "Description du besoin", "Niveau d'urgence"], allowOther: true },
      { id: "q38", n: 38, p: "C", type: "text", label: "Voulez-vous distinguer les demandes par domaine ou par urgence dès le formulaire ?", why: "Pour mettre en place une logique de routage et des champs conditionnels.", ph: "Oui / non, et selon quels critères…" },
      { id: "q39", n: 39, p: "C", type: "boolean", label: "Faut-il pouvoir joindre des pièces (documents du dossier) à une demande ?", why: "Cela implique un upload de fichiers et un stockage sécurisé conforme au RGPD." },
      { id: "q40", n: 40, p: "C", type: "boolean", label: "Souhaitez-vous suivre l'origine des contacts (Google, réseaux, bouche-à-oreille) ?", why: "Pour mettre en place le suivi et mesurer ce qui vous amène des dossiers." },
      { id: "q41", n: 41, p: "C", type: "text", label: "Avez-vous déjà fait de la publicité en ligne, ou comptez-vous le faire ?", why: "Pour préparer la mesure (Analytics, Search Console) et la stratégie d'acquisition.", ph: "Jamais / déjà fait du Google Ads / on aimerait s'y mettre…" },
    ],
  },
  {
    t: "Ambition, budget & planning",
    d: "Pour calibrer la proposition au plus juste de vos objectifs.",
    qs: [
      { id: "q42", n: 42, p: "E", type: "textarea", label: "Où voyez-vous le cabinet dans 2-3 ans ?", why: "Pour dimensionner et rendre évolutif tout ce qu'on construit.", ph: "Croissance, notoriété, nouveaux domaines, recrutement…" },
      { id: "q43", n: 43, p: "E", type: "choice", label: "Quel est le rôle principal attendu du site ?", why: "C'est la priorité qui tranchera nos arbitrages de conception.", options: ["Visibilité", "Crédibilité", "Génération de dossiers"], precision: "Nuancez si besoin…" },
      { id: "q44", n: 44, p: "E", type: "textarea", label: "Comment mesurerez-vous que ce projet est réussi, dans 6 mois ?", why: "Pour définir ensemble les objectifs et indicateurs de suivi.", ph: "À quoi saurez-vous que c'était un bon investissement…" },
      { id: "q45", n: 45, p: "E", type: "budget", label: "Avez-vous une enveloppe budgétaire indicative en tête pour l'ensemble ?", why: "Pour calibrer la proposition et hiérarchiser les priorités — aucune réponse n'est un engagement.", budgetOptions: [["Moins de 5 000 €", "Démarrage ciblé"], ["5 000 – 10 000 €", "Identité + site essentiel"], ["10 000 – 20 000 €", "Projet complet"], ["20 000 – 35 000 €", "Ambitieux & sur-mesure"], ["Plus de 35 000 €", "Premium / long terme"], ["À définir ensemble", "On en parle"]] },
      { id: "q46", n: 46, p: "E", type: "text", label: "Quelle est votre échéance idéale de mise en ligne ? Un évènement à caler dessus ?", why: "Pour bâtir le rétroplanning et l'ordre de production.", ph: "ex. avant septembre 2026 — rentrée / installation / anniversaire du cabinet" },
      { id: "q47", n: 47, p: "C", type: "choice", label: "Préférez-vous tout livrer d'un bloc, ou avancer par étapes ?", why: "Cela définit le découpage de la mission et l'échelonnement des acomptes.", options: ["Tout d'un bloc", "Par étapes (identité → site → contenu)", "À voir ensemble"], precision: "Précisez…" },
      { id: "q48", n: 48, p: "C", type: "text", label: "Souhaitez-vous un accompagnement après la mise en ligne ?", why: "Maintenance, SEO, contenu : un suivi récurrent type 6 mois.", ph: "Oui, lequel / non, je gère ensuite…" },
    ],
  },
  {
    t: "Logistique & validation",
    d: "Les derniers détails pour qu'on travaille efficacement ensemble.",
    qs: [
      { id: "q49", n: 49, p: "C", type: "text", label: "Qui valide les livrables ? Vous seul, ou d'autres personnes ?", why: "Pour fluidifier le circuit de validation et éviter les allers-retours.", ph: "Vous seul / un associé / un proche de confiance…" },
      { id: "q50", n: 50, p: "C", type: "text", label: "Quel est votre canal et rythme de communication préféré pendant le projet ?", why: "Pour caler la cadence de suivi et les points d'étape.", ph: "E-mail, téléphone, visio — et à quelle fréquence…" },
      { id: "q51", n: 51, p: "E", type: "multi", file: true, label: "Disposez-vous déjà de contenus exploitables ?", why: "Un inventaire de l'existant : autant de temps de production gagné.", options: ["Textes / bio", "Photos", "Logo", "Témoignages", "Charte existante"], allowOther: true },
      { id: "q52", n: 52, p: "C", type: "textarea", label: "Une question, une crainte ou une envie qu'on n'a pas couverte ici ?", why: "L'espace libre pour tout ce qui compte et qu'on n'aurait pas pensé à demander.", ph: "Dites-nous tout — c'est souvent ici que se cache l'essentiel." },
    ],
  },
];

export const ALL_Q: Question[] = SECTIONS.flatMap((s) => s.qs);
export const TOTAL_Q = ALL_Q.length;
export const ESSENTIAL_IDS = ALL_Q.filter((q) => q.p === "E").map((q) => q.id);
