import { type RawSection, type FontOption } from "./types";

// Onboarding « horloger » — GMT Bordeaux (Bryan Durand). Ton : tu. Calibré sur le benchmark SERP.

const FONTS: FontOption[] = [
  { name: "Cormorant", stack: "'Cormorant Garamond', serif" },
  { name: "Playfair Display", stack: "'Playfair Display', serif" },
  { name: "Cinzel", stack: "'Cinzel', serif" },
  { name: "Marcellus", stack: "'Marcellus', serif" },
  { name: "EB Garamond", stack: "'EB Garamond', serif" },
  { name: "Jost", stack: "'Jost', sans-serif" },
];

export const HORLOGER_RAW: RawSection[] = [
  {
    t: "L'artisan & l'atelier",
    d: "Ton identité et ta crédibilité — aujourd'hui quasi absentes du site, alors qu'elles font tout.",
    qs: [
      { id: "g1", p: "E", type: "text", label: "Sous quel nom l'atelier doit-il apparaître, et quel lien afficher avec ABH ?", why: "GMT = l'acteur ; ABH = le groupement qui porte certains agréments. On clarifie qui est mis en avant.", ph: "ex. GMT Bordeaux — atelier affilié à ABH (groupement d'horlogers)" },
      { id: "g2", p: "E", type: "textarea", label: "Ton parcours : formation, diplômes (CAP, BMA, DMA…), années de métier.", why: "C'est le cœur de ta crédibilité (E-E-A-T) — et la page « identité » aujourd'hui vide.", ph: "Diplômes, ateliers, marques formées, ce qui t'a mené à l'horlogerie…" },
      { id: "g3", p: "E", type: "text", label: "Depuis quand l'atelier existe-t-il ?", why: "L'ancienneté (« depuis 20XX ») est un signal d'autorité attendu par Google et les clients.", ph: "ex. depuis 2018" },
      { id: "g4", p: "E", type: "textarea", label: "Qu'est-ce qui te distingue des autres horlogers bordelais ?", why: "Ton angle de positionnement — et l'accroche de la page d'accueil.", ph: "Normes suisses, recharge laser, accompagnement de micro-marques…" },
      { id: "g5", p: "E", type: "booleanDetail", label: "D'accord pour être nommé et photographié sur le site (visage, à l'établi) ?", why: "L'artisan incarné est rare (38% des sites) et décisif pour la confiance.", detailPh: "Des préférences sur la mise en scène ?" },
    ],
  },
  {
    t: "Réputation & réassurance",
    d: "Tu as la 2ᵉ meilleure note du marché (4,9★ / 63 avis)… invisible sur le site. Le plus gros gisement.",
    qs: [
      { id: "g6", p: "E", type: "boolean", label: "On affiche tes avis Google (4,9★ / 63 avis) directement sur le site ?", why: "Sur 8 concurrents, un seul affiche sa note. Levier de conversion n°1, quasi gratuit." },
      { id: "g7", p: "E", type: "text", label: "Quelle garantie offres-tu, et sur quoi ?", why: "Une garantie chiffrée (« 12 mois sur révision ») rassure.", ph: "ex. 12 mois sur la révision complète" },
      { id: "g8", p: "E", type: "booleanDetail", file: true, label: "As-tu des photos avant / après de restaurations à montrer ?", why: "Une galerie de réalisations = preuve concrète du savoir-faire.", detailPh: "Joins-en quelques-unes si possible." },
      { id: "g9", p: "C", type: "textarea", label: "Presse, partenaires, réseau, labels à mentionner ?", why: "Signaux d'autorité supplémentaires.", ph: "Paul Bouyssou, Rooster Watches, presse locale, certifications…" },
    ],
  },
  {
    t: "Adresse, horaires & zones",
    d: "La base du référencement local — et le terrain « par quartier » que personne ne cible.",
    qs: [
      { id: "g10", p: "E", type: "text", label: "Adresse exacte de l'atelier + infos d'accès / parking.", why: "Ton site n'affiche aujourd'hui aucune adresse — c'est la base du SEO local.", ph: "1 rue Albert Einstein, 33700 Mérignac — parking, étage…" },
      { id: "g11", p: "E", type: "text", label: "Horaires d'ouverture (et est-ce uniquement sur RDV ?).", why: "Horaires + carte = conversion locale.", ph: "Lun-Ven 9h-18h, sur RDV…" },
      { id: "g12", p: "E", type: "multi", label: "Sur quels secteurs veux-tu être trouvé sur Google ? (une page par zone)", why: "Personne ne descend au quartier — c'est une longue traîne vierge à capter.", options: ["Mérignac", "Bordeaux Centre", "Sainte-Catherine", "Chartrons", "Bordeaux métropole", "Pessac", "Talence", "Le Bouscat"], allowOther: true },
    ],
  },
  {
    t: "Marques & agréments",
    d: "Citer les marques rassure ET capte « réparation [marque] bordeaux » — un actif quasi inexploité.",
    qs: [
      { id: "g13", p: "E", type: "textarea", label: "Marques que tu es agréé à réparer / dont tu as l'accès — et lesquelles via ABH vs GMT.", why: "Citer les marques rassure et nourrit la longue traîne.", ph: "Agréé Swatch Group (Tissot, Longines, Hamilton, Omega), accès Rolex…" },
      { id: "g14", p: "E", type: "multi", label: "Quelles marques mettre en avant en priorité ? (page « Réparation [marque] Bordeaux » dédiée)", why: "Seuls 2 concurrents font des pages par marque — territoire quasi vierge.", options: ["Rolex", "Omega", "Tudor", "TAG Heuer", "Tissot", "Longines", "Hamilton", "Seiko", "Cartier", "Breitling"], allowOther: true },
      { id: "g15", p: "C", type: "booleanDetail", label: "Des marques que tu ne PEUX PAS afficher (restrictions contractuelles) ?", why: "Pour rester conforme aux conditions des marques agréées.", detailPh: "Lesquelles, et quelles limites ?" },
      { id: "g16", p: "C", type: "boolean", label: "On affiche le logo « Atelier agréé Swatch Group » ?", why: "Marqueur d'autorité fort." },
    ],
  },
  {
    t: "Prestations & tarifs",
    d: "Le socle des actes — et le trou n°1 du marché : presque personne n'affiche de prix.",
    qs: [
      { id: "g17", p: "E", type: "multi", label: "Quelles prestations mettre en avant ?", why: "Le socle attendu par tout visiteur.", options: ["Révision complète", "Réparation quartz", "Réparation mécanique / auto", "Chronographe", "Recharge laser du boîtier", "Restauration bracelet Jubilé / Oyster", "Test & restauration d'étanchéité", "Matière luminescente", "Fabrication de pièces", "Pile / verre / bracelet"], allowOther: true },
      { id: "g18", p: "E", type: "booleanDetail", label: "On affiche des fourchettes de prix (« à partir de X€ ») + délais ? (tu as déjà ta grille K01-K12)", why: "Seuls 6% des sites affichent un prix, alors que « tarif horaire » est LA question posée. Premier à le faire = capte le clic.", detailPh: "Lesquelles afficher, lesquelles garder « sur devis » ?" },
      { id: "g19", p: "C", type: "text", label: "Délai moyen pour une révision / une réparation courante ?", why: "Répond à « combien de temps ça prend ? ».", ph: "ex. 3 à 6 semaines selon la pièce" },
    ],
  },
  {
    t: "Périmètre & boutique",
    d: "Réparation seule, ou aussi de la vente ? Cela décide d'un module e-commerce — ou pas.",
    qs: [
      { id: "g20", p: "E", type: "multi", label: "Au-delà de la réparation, vends-tu des produits ?", why: "Un atelier 100% réparation peut dominer le SERP sans rien vendre — c'est un choix de positionnement.", options: ["Non — 100% réparation / restauration", "Montres d'occasion / restaurées", "Montres neuves (marques)", "Bracelets", "Accessoires (écrins, outils…)"], allowOther: true },
      { id: "g21", p: "C", type: "choice", label: "Si tu vends, sous quelle forme ?", why: "Dimensionne le module e-commerce.", options: ["Vraie boutique en ligne (paiement + livraison)", "Vitrine / catalogue (contact pour acheter)", "Pas de vente en ligne"], precision: "Volume de produits, click & collect…" },
    ],
  },
  {
    t: "Direction artistique & polices",
    d: "L'univers visuel — et le choix de la typo qui donne le ton.",
    qs: [
      { id: "g22", p: "E", type: "choice", label: "Ton identité actuelle (vert olive, serif, le « ✦ ») : on la garde, on la fait évoluer, ou on repart ?", why: "Pour savoir d'où on part.", options: ["On garde l'esprit", "On fait évoluer", "On repart de zéro"], precision: "Ce à quoi tu tiens / ce qui te gêne." },
      { id: "g23", p: "E", type: "font", label: "Quelle police te parle le plus pour les titres du site ?", why: "La typo donne le ton : patrimoine, précision, luxe discret.", fontOptions: FONTS },
      { id: "g24", p: "E", type: "text", label: "Des couleurs que tu aimes ? Que tu veux éviter ?", why: "Pour cadrer la palette.", ph: "J'aime le vert olive / j'évite…" },
      { id: "g25", p: "C", type: "links", file: true, label: "3 à 5 sites, marques ou visuels que tu aimes (horlogerie ou non).", why: "Un moodboard pour aligner le goût avant les pistes.", ph: "Liens — un par ligne. Ou joins des images." },
      { id: "g26", p: "C", type: "text", label: "En 3 mots, l'ambiance visée ?", ph: "ex. précision · patrimoine · discrétion" },
    ],
  },
  {
    t: "Photo (shooting offert)",
    d: "Le shooting nourrit la page atelier (vide) et l'identité incarnée.",
    qs: [
      { id: "g27", p: "E", type: "multi", label: "Que faut-il shooter en priorité ?", why: "L'atelier en images + l'artisan en photo (E-E-A-T).", options: ["Portrait de Bryan", "Mains à l'établi", "Le labo & les équipements", "Montres avant / après", "Détails (mouvements, outils)", "L'atelier / la vitrine"], allowOther: true },
      { id: "g28", p: "C", type: "text", label: "Quelles pièces / montres mettre en valeur le jour J ?" },
      { id: "g29", p: "C", type: "text", label: "À l'aise face à l'objectif, ou faut-il une direction poussée ?", ph: "Très à l'aise / besoin d'être guidé…" },
      { id: "g30", p: "E", type: "text", label: "Tes disponibilités / la date idéale pour le shooting ?", ph: "ex. courant juillet, un mardi matin…" },
    ],
  },
  {
    t: "Contact & conversion",
    d: "Comment les clients te joignent — et le formulaire de devis (déjà ébauché).",
    qs: [
      { id: "g31", p: "E", type: "multi", label: "Comment veux-tu recevoir les demandes en priorité ?", why: "Pour concevoir le bon parcours de contact.", options: ["Formulaire de devis", "Téléphone", "E-mail", "Instagram", "WhatsApp", "RDV en ligne"], allowOther: true },
      { id: "g32", p: "E", type: "multi", label: "Quelles infos demander dans le formulaire de devis ? (on peut reprendre ta fiche atelier)", why: "Le formulaire est déjà ébauché sur le site — on le cale précisément.", options: ["Particulier / Pro", "Marque", "Modèle", "N° de boîte", "Calibre", "Demande / diagnostic", "Photo de la montre", "Coordonnées", "N° de TVA", "Niveau d'urgence"], allowOther: true },
      { id: "g33", p: "C", type: "boolean", label: "On active la prise de RDV en ligne ?", why: "Réduit la friction de contact." },
      { id: "g34", p: "E", type: "text", label: "Liens à connecter : Google Business Profile, Instagram, YouTube, Facebook.", why: "Cohérence de marque + signaux locaux.", ph: "@gmt_bordeaux, chaîne YouTube, page Facebook, fiche Google…" },
    ],
  },
  {
    t: "Contenu & FAQ",
    d: "Le carburant des réponses IA et des featured snippets — quasi vide chez les concurrents.",
    qs: [
      { id: "g35", p: "E", type: "textarea", label: "Les questions qu'on te pose tout le temps — avec tes réponses.", why: "Une FAQ nourrit les réponses des IA (AEO/GEO) et les featured snippets.", ph: "« Combien coûte un changement de pile ? », « Quand réviser ma montre ? », « Combien de temps ? »…" },
      { id: "g36", p: "C", type: "booleanDetail", label: "Veux-tu un blog / des articles conseils, et serais-tu prêt à l'alimenter ?", why: "Pour dimensionner le contenu éditorial.", detailPh: "Plutôt rédiger, valider, ou tout déléguer ? Des sujets en tête ?" },
      { id: "g37", p: "C", type: "text", label: "Des vidéos YouTube à intégrer ? (chaîne, vidéos clés)", ph: "Liens vers tes vidéos…" },
    ],
  },
  {
    t: "Logistique & validation",
    d: "Les derniers détails pour avancer vite — tu as déjà beaucoup de matière.",
    qs: [
      { id: "g38", p: "E", type: "text", label: "Le domaine gmtbordeaux.fr : qui le gère, et as-tu les accès ?", why: "Pour la mise en ligne sur ton domaine existant.", ph: "Géré chez OVH / Wix… j'ai les accès" },
      { id: "g39", p: "E", type: "multi", file: true, label: "Quels contenus as-tu déjà sous la main ?", why: "Inventaire de l'existant — tu en as déjà beaucoup.", options: ["Textes / expertises rédigées", "Photos de l'atelier", "Photos de montres", "Logos GMT / ABH", "Grille tarifaire", "Avis clients", "Vidéos"], allowOther: true },
      { id: "g40", p: "C", type: "text", label: "Qui valide, et quel est ton rythme de communication préféré ?", ph: "Toi seul / un associé — e-mail, tél, visio…" },
      { id: "g41", p: "C", type: "textarea", label: "Une envie, une crainte, ou un point qu'on n'a pas abordé ?", why: "L'espace libre — souvent là que se cache l'essentiel." },
    ],
  },
];
