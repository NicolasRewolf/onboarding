/**
 * Données de la page « Création de site internet pour avocats ».
 *
 * Page d'atterrissage dédiée au groupe d'annonces « Site internet ».
 * Elle existe pour une raison mesurée : les mots clés « création site internet
 * avocat » pointaient vers /avocats, qui vend un abonnement éditorial. Google
 * notait la page « convivialité inférieure à la moyenne » et le niveau de
 * qualité tombait à 2-3/10, ce qui faisait payer 8,10 € un clic estimé à 1,51 €.
 * Cette page-ci parle du site, et seulement du site.
 *
 * Règle de rédaction : rien n'est affirmé sans source vérifiable. Les chiffres
 * Plouton viennent de sa Search Console (publication autorisée) ; le prix vient
 * du dernier devis réellement remis à un cabinet d'avocats (D-2026-REWOLF012,
 * juin 2026, poste « conception et rédaction du site web »).
 */

/** Prix affichés. Un prix ferme, jamais de fourchette : l'audit des dix personas
 *  a montré que le flou tarifaire fait renoncer plus sûrement qu'un prix élevé. */
export const PRIX = {
  site: 7500,
  identiteVisuelle: 1500,
  photographie: 1200,
  editorialMensuel: 600,
  acomptePourcent: 30,
  semaines: 6,
  heuresClient: 4,
} as const;

export type Piece = { num: string; titre: string; texte: string };

/** Le livrable, décrit comme un périmètre et non comme une liste de fonctionnalités.
 *  Correspond exactement aux postes du devis avocat de juin 2026. */
export const PIECES: Piece[] = [
  {
    num: "01",
    titre: "Les pages du cabinet",
    texte:
      "Accueil, présentation du cabinet, une page par avocat, contact et honoraires. Ce qu'un justiciable lit avant de décider s'il vous appelle.",
  },
  {
    num: "02",
    titre: "Une page par matière",
    texte:
      "Pénal, famille, dommage corporel, affaires — une page par domaine que vous traitez. Pas une page « nos compétences » qui parle de tout et ne se classe sur rien.",
  },
  {
    num: "03",
    titre: "Un espace actualités et ressources",
    texte:
      "Un blog structuré par thèmes, avec catégories et liens internes, capable d'absorber plusieurs centaines d'articles sans devenir illisible. Vous pouvez y publier seul.",
  },
  {
    num: "04",
    titre: "La prise de contact",
    texte:
      "Un formulaire qui qualifie la demande — matière, urgence, coordonnées — et la trie automatiquement. Les messages arrivent dans votre boîte, pas dans la nôtre : nous n'avons accès ni aux demandes ni aux pièces jointes. Le visiteur est invité à s'en tenir à l'objet de son rendez-vous sans exposer son affaire en ligne — le secret vous engage dès le premier contact, y compris quand c'est lui qui en dit trop.",
  },
  {
    num: "05",
    titre: "Les pages obligatoires",
    texte:
      "Mentions légales, politique de confidentialité, RGPD, cookies, mentions déontologiques. Rédigées, pas copiées d'un générateur.",
  },
  {
    num: "06",
    titre: "Le socle technique",
    texte:
      "Nom de domaine et e-mail professionnel à votre nom, affichage impeccable sur ordinateur, tablette et téléphone, mise en ligne, trois mois de maintenance.",
  },
  {
    num: "07",
    titre: "La visibilité Google",
    texte:
      "Balisage complet, données structurées, reprise de votre fiche d'établissement Google, outils de suivi installés, et migration de vos anciennes URL sans perdre une page.",
  },
];

export type Verification = { num: string; titre: string; texte: string };

/**
 * Auto-diagnostic. Le lecteur teste son propre site en deux minutes : c'est
 * plus convaincant qu'un argumentaire, et ça ne porte aucun jugement a priori.
 */
export const VERIFICATIONS: Verification[] = [
  {
    num: "01",
    titre: "Cherchez-vous dans Google",
    texte:
      "Tapez votre matière suivie de votre ville — « avocat pénaliste Toulouse ». Vous apparaissez en première page, sans compter les annuaires ni les publicités ?",
  },
  {
    num: "02",
    titre: "Ouvrez votre site sur votre téléphone",
    texte:
      "Chronométrez l'affichage de votre page d'accueil, puis appelez votre propre cabinet. Si le numéro n'est pas appelable d'un geste, l'appel se reporte sur le confrère suivant — et ceux qui se perdent sont les appels du soir et du week-end, ceux que l'on passe dans l'urgence. Posez ensuite la question qui vient juste après : qui décroche pendant que vous êtes à l'audience, et que dit cette personne ?",
  },
  {
    num: "03",
    titre: "Demandez à une intelligence artificielle",
    texte:
      "Demandez à ChatGPT ou à l'aperçu IA de Google de vous recommander un avocat de votre matière dans votre ville. Notez les cabinets cités, et si le vôtre en est. C'est déjà un canal de recommandation.",
  },
];

export type Temps = { num: string; titre: string; duree: string; texte: string };

/** Ce que ça coûte en temps — l'objection la plus sous-estimée chez un avocat surchargé. */
export const TEMPS: Temps[] = [
  {
    num: "01",
    titre: "Cadrage",
    duree: "1 heure",
    texte:
      "Au téléphone. Votre barreau, vos matières, ce que vous voulez que nous disions et surtout ce que vous refusez que nous écrivions.",
  },
  {
    num: "02",
    titre: "Choix visuels",
    duree: "30 minutes",
    texte:
      "Avec Élise. Vous tranchez entre deux directions, pas entre quinze nuances de bleu.",
  },
  {
    num: "03",
    titre: "Relecture juridique",
    duree: "1 heure 30",
    texte:
      "Vous êtes le seul à pouvoir valider un texte de droit signé de votre nom. Vous corrigez, vous ne rédigez pas. Si le cabinet compte plusieurs associés, désignez celui qui tranche : un texte relu par quatre confrères n'est jamais publié, et ce n'est pas le texte qui est en cause.",
  },
  {
    num: "04",
    titre: "Recette avant mise en ligne",
    duree: "1 heure",
    texte:
      "Vous parcourez le site achevé, vous relevez ce qui doit être repris, nous corrigeons avant la mise en ligne.",
  },
];

export type Question = { q: string; r: string };

export const FAQ: Question[] = [
  {
    q: "Je n'ai pas encore de site du tout.",
    r: "C'est plus simple, et c'est le même prix. Il n'y a rien à migrer et personne à convaincre de changer ses habitudes.",
  },
  {
    q: "J'ai déjà un site. Faut-il tout refaire ?",
    r: "Pas toujours. Nous identifions d'abord les pages qui se classent et reçoivent des visites : elles sont conservées et leurs URL migrées telles quelles. Le reste est repris. Si votre site actuel remplit son office, nous vous le dirons plutôt que de vous vendre une refonte.",
  },
  {
    q: "Sur quelle technologie ?",
    r: "Wix Studio ou Framer selon le projet. Ce sont des outils que vous pouvez reprendre en main seul — c'est justement pourquoi nous les choisissons. Le nom de domaine, les contenus et les accès sont à votre nom dès le premier jour.",
  },
  {
    q: "Qui écrit les textes ?",
    r: "Nous. Vous relisez et vous validez. Rien n'est publié sans votre accord écrit, y compris les pages de présentation de vos matières.",
  },
  {
    q: "Au bout de combien de temps voit-on des résultats ?",
    r: "Le site est en ligne en six semaines. La visibilité dans Google, elle, se construit sur des trimestres : le cabinet dont vous lisez les chiffres a mis cinq trimestres pour passer de la 18ᵉ à la 7ᵉ place. Aucun prestataire honnête ne vous promettra davantage.",
  },
  {
    q: "Et si je veux partir ?",
    r: "Le nom de domaine, l'hébergement et les accès Google sont ouverts à votre nom dès le premier jour, et les droits sur les textes et les photographies vous sont cédés par écrit. Le jour où vous arrêtez, rien ne se coupe et rien ne se renégocie.",
  },
];
