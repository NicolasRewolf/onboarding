import { type RawSection } from "./types";

// Onboarding « cadrage » — Me Jacques Derieux (avocat). Ton : vous.
export const CADRAGE_RAW: RawSection[] = [
  {
    t: "Vous & le cabinet",
    d: "Pour bien vous cerner avant de poser la moindre piste créative.",
    qs: [
      { id: "q1", p: "E", type: "text", label: "Nom exact sous lequel vous exercez (et nom commercial du cabinet s'il diffère) ?", why: "Pour vos mentions légales, vos signatures mail et votre futur nom de domaine.", ph: "Me Jacques Derieux — Cabinet…" },
      { id: "q2", p: "E", type: "choice", label: "Êtes-vous seul, en collaboration, ou prévoyez-vous d'associer / recruter prochainement ?", why: "Cela oriente le branding (nom propre ou cabinet) et la future page « équipe ».", options: ["Seul·e", "En collaboration", "Association / recrutement à venir"], precision: "Précisez si besoin…" },
      { id: "q3", p: "E", type: "textarea", label: "Depuis combien de temps exercez-vous, et quel est votre parcours ?", why: "Barreau, formations, distinctions : la matière première de votre page cabinet et de votre crédibilité (y compris aux yeux de Google).", ph: "Année de prestation de serment, barreau, diplômes, expériences marquantes…" },
      { id: "q4", p: "E", type: "text", label: "Devant quelles juridictions, dans quelles villes êtes-vous amené à plaider ?", why: "Pour cibler votre référencement local sur les villes où vous intervenez réellement.", ph: "ex. Toulouse, Montauban, cour d'appel de Toulouse… ou partout en France" },
      { id: "q5", p: "C", type: "text", label: "Quelle image, quelle posture souhaitez-vous incarner aux yeux de vos clients ?", why: "Pour donner une intention claire au ton éditorial et à la direction artistique.", ph: "ex. la rigueur rassurante · le combat sans concession · la proximité humaine…" },
      { id: "q6", p: "E", type: "textarea", label: "Qu'est-ce qui vous différencie d'un confrère du même barreau, concrètement ?", why: "C'est votre angle de positionnement — et l'accroche de votre page d'accueil.", ph: "Approche, spécialité, méthode, type de clientèle…" },
      { id: "q7", p: "C", type: "textarea", label: "Des confrères ou cabinets dont vous admirez la communication ?", why: "Des repères de direction artistique et un point de départ pour notre veille.", ph: "Noms + ce qui vous plaît chez eux (le site, le ton, l'identité…)" },
      { id: "q8", p: "C", type: "booleanDetail", label: "Bénéficiez-vous déjà d'une visibilité médiatique (presse, radio, TV, podcasts) ?", why: "Pour capitaliser sur votre notoriété existante et nourrir votre crédibilité.", detailPh: "Si oui : lesquels, à quelle fréquence ? (liens bienvenus)" },
    ],
  },
  {
    t: "Domaines d'expertise & contenu",
    d: "Ce qui structurera l'arborescence du site et la production de contenu.",
    qs: [
      { id: "q9", p: "E", type: "ranked", label: "Quels sont vos domaines d'intervention ? Classez-les par ordre d'importance.", why: "Ils définissent les silos d'expertise du site et l'ordre de priorité des contenus.", ph: "1. …\n2. …\n3. …" },
      { id: "q10", p: "E", type: "textarea", label: "Pour chaque domaine : plutôt défense, conseil, ou contentieux ?", why: "Cela change la formulation des pages d'expertise et le registre des appels à l'action.", ph: "ex. Droit de la famille → conseil + contentieux ; Pénal → défense…" },
      { id: "q11", p: "E", type: "textarea", label: "Y a-t-il des niches où vous voulez devenir une référence identifiée ?", why: "C'est là qu'on concentrera la stratégie de contenu et les mots-clés à fort enjeu.", ph: "Sujets précis sur lesquels vous voulez être LA réponse…" },
      { id: "q12", p: "E", type: "textarea", label: "Quels sont les profils de vos clients types selon les domaines ?", why: "Particuliers, pros, situations d'urgence… cela hiérarchise l'information et le ton (urgence vs réassurance).", ph: "Pour chaque domaine, qui vient vous voir et dans quel état d'esprit…" },
      { id: "q13", p: "E", type: "textarea", label: "Des affaires marquantes, décisions obtenues ou dossiers emblématiques communicables ?", why: "Pour bâtir une page « affaires » avec des preuves concrètes plutôt que des promesses.", ph: "Même anonymisées : résultats obtenus, jurisprudence, dossiers notables…" },
    ],
  },
  {
    t: "Identité visuelle & branding",
    d: "La direction artistique : couleurs, typographies, impression générale.",
    qs: [
      { id: "q14", p: "E", type: "logo", label: "Avez-vous déjà un logo, une identité visuelle ?", why: "Pour savoir si on part d'une base existante ou d'une création complète." },
      { id: "q15", p: "E", type: "textarea", label: "Quelle impression voulez-vous donner au premier regard ?", why: "Sérieux, accessible, premium, combatif… c'est le cœur de la direction artistique.", ph: "Décrivez le ressenti visé chez quelqu'un qui découvre votre cabinet…" },
      { id: "q16", p: "E", type: "text", label: "Des couleurs que vous aimez ? Que vous détestez / interdisez ?", why: "Pour cadrer la palette print et web dès les premières propositions.", ph: "J'aime… / J'évite absolument…" },
      { id: "q17", p: "C", type: "links", file: true, label: "3 à 5 visuels, sites ou marques (tout secteur) qui vous parlent esthétiquement.", why: "Un moodboard pour aligner nos attentes avant les premières pistes.", ph: "Liens, noms de marques — un par ligne. Ou joignez des images." },
      { id: "q18", p: "E", type: "multi", label: "Sur quels supports aimeriez-vous qu'on décline votre identité ?", why: "Vous choisissez les supports — on s'occupe de la création et des formats.", options: ["Site web", "Plaque professionnelle", "Cartes de visite", "Papeterie / courrier", "Signature mail", "Réseaux sociaux", "Robe & accessoires", "Tampon professionnel"], allowOther: true },
      { id: "q19", p: "C", type: "boolean", label: "Souhaitez-vous une charte / guidelines de marque pour de futurs collaborateurs ?", why: "Pour savoir si ce livrable doit faire partie du périmètre." },
    ],
  },
  {
    t: "Photographie & image",
    d: "Faut-il prévoir un shooting — et dans quelles conditions.",
    qs: [
      { id: "q20", p: "C", type: "booleanDetail", label: "Souhaitez-vous un shooting photo (portrait, cabinet, équipe) ?", why: "Pour décider d'inclure — ou non — le poste photo au devis.", detailPh: "Si oui : quel type de photos vous imaginez ?" },
      { id: "q21", p: "C", type: "text", label: "Êtes-vous à l'aise face à l'objectif, ou faut-il une direction poussée le jour J ?", why: "Cela influe sur la logistique et la durée du shooting.", ph: "Très à l'aise / plutôt timide / besoin d'être guidé…" },
      { id: "q22", p: "C", type: "text", label: "Avez-vous un lieu qui peut servir de décor, ou faut-il un studio ?", why: "Pour organiser le repérage et estimer le coût logistique.", ph: "Cabinet, extérieur, à définir, studio nécessaire…" },
    ],
  },
  {
    t: "Le site web",
    d: "Pages, fonctionnalités, autonomie : le cœur du chiffrage technique.",
    qs: [
      { id: "q23", p: "E", type: "text", label: "On vous créera votre nom de domaine — avez-vous une préférence ?", why: "Vous n'avez pas encore de site : on réserve et configure le domaine pour vous.", ph: "ex. cabinet-derieux.fr, derieux-avocat.fr… ou : je vous fais confiance" },
      { id: "q24", p: "C", type: "links", label: "Des sites d'avocats (ou autres) dont vous aimez la structure ou l'expérience ?", why: "Des références d'arborescence et d'expérience utilisateur.", ph: "Liens — un par ligne." },
      { id: "q25", p: "E", type: "multi", label: "Quelles pages jugez-vous indispensables ?", why: "Cela définit l'arborescence et le périmètre de développement, page par page.", options: ["Accueil", "Expertises", "Cabinet / À propos", "Honoraires", "Contact", "Blog / Actualités", "FAQ", "Mentions légales"], allowOther: true },
      { id: "q26", p: "E", type: "textarea", label: "L'affichage des honoraires est obligatoire — sous quelle forme souhaitez-vous les présenter ?", why: "Forfaits, taux horaire, première consultation, aide juridictionnelle… on vous aide à le présenter avec clarté.", ph: "Ce que vous accepteriez d'afficher et sous quelle forme…" },
      { id: "q27", p: "E", type: "multi", label: "Quelles fonctionnalités au-delà des pages ?", why: "Ces modules constituent le cœur du chiffrage technique.", options: ["Prise de RDV en ligne", "FAQ filtrable", "Espace client sécurisé", "Paiement en ligne", "Newsletter", "Chat / messagerie", "Podcast"], allowOther: true },
      { id: "q28", p: "E", type: "choice", label: "Souhaitez-vous gérer vous-même le contenu après livraison, ou déléguer ?", why: "Pour calibrer la prise en main, votre niveau d'autonomie et un éventuel suivi.", options: ["Gérer moi-même", "Déléguer entièrement", "Un mix des deux"], precision: "Précisez…" },
    ],
  },
  {
    t: "Blog & stratégie de contenu",
    d: "Votre présence éditoriale et votre moteur de visibilité dans le temps.",
    qs: [
      { id: "q29", p: "E", type: "booleanDetail", label: "Souhaitez-vous un blog / espace actualités, et seriez-vous prêt à l'entretenir ?", why: "Pour dimensionner le blog et définir qui produit les contenus dans le temps.", detailPh: "Si oui : plutôt rédiger vous-même, valider nos contenus, ou tout déléguer ? Et à quelle fréquence ?" },
      { id: "q30", p: "E", type: "textarea", label: "Acceptez-vous de communiquer sur vos dossiers réels (anonymisés) ?", why: "C'est le contenu le plus convaincant : études de cas et preuves d'expertise.", ph: "Jusqu'où êtes-vous prêt à aller, et avec quelles précautions…" },
      { id: "q31", p: "C", type: "text", label: "Êtes-vous actif sur des réseaux (LinkedIn, etc.) à connecter au site ?", why: "Pour les intégrations et la cohérence de votre marque.", ph: "Liens vers vos profils, ou : aucun pour l'instant" },
    ],
  },
  {
    t: "Contact & acquisition",
    d: "Comment les futurs clients vous trouvent et vous joignent.",
    qs: [
      { id: "q32", p: "E", type: "multi", label: "Comment voulez-vous être contacté en priorité ?", why: "Pour concevoir le bon parcours de contact et le formulaire.", options: ["Formulaire", "Téléphone", "E-mail", "RDV en ligne", "WhatsApp"], allowOther: true },
      { id: "q33", p: "E", type: "multi", label: "Quelles informations récolter via le formulaire pour qualifier une demande ?", why: "Ce sont les champs du formulaire et le pré-tri des dossiers.", options: ["Nom", "Nom de l'entreprise", "E-mail", "Téléphone", "Domaine concerné", "Description du besoin", "Préjudice estimé", "Niveau d'urgence"], allowOther: true },
      { id: "q34", p: "C", type: "text", label: "Voulez-vous distinguer les demandes par domaine ou par urgence dès le formulaire ?", why: "Pour mettre en place une logique de routage et des champs conditionnels.", ph: "Oui / non, et selon quels critères…" },
      { id: "q35", p: "C", type: "booleanDetail", label: "Disposez-vous d'un standard téléphonique ou d'une personne pour répondre aux appels ?", why: "Pour concevoir le bon parcours de contact (numéro affiché, rappel, formulaire…).", detailPh: "Si oui : qui répond, à quels horaires ? Sinon, faut-il y réfléchir ensemble ?" },
      { id: "q36", p: "C", type: "boolean", label: "Souhaitez-vous suivre l'origine des contacts (Google, réseaux, bouche-à-oreille) ?", why: "Pour mettre en place le suivi et mesurer ce qui vous amène des dossiers." },
      { id: "q49", p: "C", type: "choice", label: "Votre fiche Google (Google Business Profile) — où en êtes-vous ?", why: "C'est un levier de visibilité locale majeur (Google Maps, « avocat + ville », avis clients). Dans tous les cas, on peut la créer, l'optimiser et l'animer pour vous.", options: ["Pas de fiche / je ne sais pas", "J'en ai une, mais à l'abandon", "À jour et active"], precision: "Un lien vers votre fiche, ou ce que vous aimeriez qu'on en fasse ?" },
      { id: "q37", p: "C", type: "booleanDetail", label: "Seriez-vous prêt à investir dans Google Ads pour accélérer l'acquisition ?", why: "Pour calibrer une éventuelle stratégie payante et le budget à prévoir.", detailPh: "Si oui : quel budget maximum par mois envisageriez-vous ?" },
    ],
  },
  {
    t: "Ambition, budget & planning",
    d: "Pour calibrer la proposition au plus juste de vos objectifs.",
    qs: [
      { id: "q38", p: "E", type: "textarea", label: "Où voyez-vous le cabinet dans 2-3 ans ?", why: "Pour dimensionner et rendre évolutif tout ce qu'on construit.", ph: "Croissance, notoriété, nouveaux domaines, recrutement…" },
      { id: "q39", p: "E", type: "choice", label: "Quel est le rôle principal attendu du site ?", why: "C'est la priorité qui tranchera nos arbitrages de conception.", options: ["Visibilité", "Crédibilité", "Génération de dossiers"], precision: "Nuancez si besoin…" },
      { id: "q40", p: "E", type: "textarea", label: "Comment mesurerez-vous que ce projet est réussi, dans 6 mois ?", why: "Pour définir ensemble les objectifs et indicateurs de suivi.", ph: "À quoi saurez-vous que c'était un bon investissement…" },
      { id: "q41", p: "E", type: "budget", label: "Avez-vous une enveloppe budgétaire indicative en tête pour l'ensemble ?", why: "Pour calibrer la proposition et hiérarchiser les priorités — aucune réponse n'est un engagement.", budgetOptions: [["Moins de 5 000 €", "Démarrage ciblé"], ["5 000 – 10 000 €", "Identité + site essentiel"], ["10 000 – 20 000 €", "Projet complet"], ["20 000 – 35 000 €", "Ambitieux & sur-mesure"], ["Plus de 35 000 €", "Premium / long terme"], ["À définir ensemble", "On en parle"]] },
      { id: "q42", p: "E", type: "text", label: "Quelle est votre échéance idéale de mise en ligne ?", why: "Pour bâtir le rétroplanning et l'ordre de production.", ph: "ex. avant septembre 2026 — rentrée / installation…" },
      { id: "q43", p: "C", type: "textarea", label: "Avez-vous une affaire importante ou médiatisée prévue cette année ?", why: "Un évènement fort = une échéance naturelle : on calera la mise en ligne avant, pour saisir la fenêtre de visibilité.", ph: "Décrivez (sans rien dévoiler de confidentiel) et la date approximative si connue…" },
      { id: "q44", p: "C", type: "choice", label: "Préférez-vous tout livrer d'un bloc, ou avancer par étapes ?", why: "Cela définit le découpage de la mission et l'échelonnement des acomptes.", options: ["Tout d'un bloc", "Par étapes (identité → site → contenu)", "À voir ensemble"], precision: "Précisez…" },
      { id: "q45", p: "C", type: "text", label: "Souhaitez-vous un accompagnement après la mise en ligne ?", why: "Maintenance, SEO, contenu : un suivi récurrent type 6 mois.", ph: "Oui, lequel / non, je gère ensuite…" },
    ],
  },
  {
    t: "Logistique & validation",
    d: "Les derniers détails pour qu'on travaille efficacement ensemble.",
    qs: [
      { id: "q46", p: "C", type: "text", label: "Quel est votre canal et rythme de communication préféré pendant le projet ?", why: "Pour caler la cadence de suivi et les points d'étape.", ph: "E-mail, téléphone, visio — et à quelle fréquence…" },
      { id: "q47", p: "E", type: "multi", file: true, label: "Disposez-vous déjà de contenus exploitables ?", why: "Un inventaire de l'existant : autant de temps de production gagné.", options: ["Textes / bio", "Photos", "Logo", "Témoignages", "Charte existante"], allowOther: true },
      { id: "q48", p: "C", type: "textarea", label: "Une question, une crainte ou une envie qu'on n'a pas couverte ici ?", why: "L'espace libre pour tout ce qui compte et qu'on n'aurait pas pensé à demander.", ph: "Dites-nous tout — c'est souvent ici que se cache l'essentiel." },
    ],
  },
];
