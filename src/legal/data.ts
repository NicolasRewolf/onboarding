/**
 * Informations légales — vérifiées sur le registre national des entreprises
 * (extrait Pappers / INPI, 7 août 2026). Ne pas modifier sans nouvelle vérification.
 */
export const LEGAL = {
  denomination: "Nicolas Doucet — Agence REWOLF",
  formeJuridique: "Entrepreneur individuel (micro-entreprise)",
  siret: "879 517 852 00031",
  siren: "879 517 852",
  rcs: "879 517 852 R.C.S. Bordeaux",
  tvaIntra: "FR 17 879 517 852",
  ape: "74.10Z — Activités spécialisées de design",
  adresse: "151 rue Jean Renaud Dandicolle, 33000 Bordeaux",
  immatriculation: "5 août 2021, greffe de Bordeaux",
  directeurPublication: "Nicolas Doucet",
  email: "nicolas@rewolf.studio",
  telephone: "06 31 62 17 76",
  siteVitrine: "https://www.rewolf.studio",
} as const;

export const HEBERGEUR = {
  nom: "Vercel Inc.",
  adresse: "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
  site: "https://vercel.com",
} as const;

/** Traceurs réellement déposés par ce site. À maintenir si la stack change. */
export const TRACEURS = [
  {
    nom: "Google Analytics 4",
    editeur: "Google Ireland Limited",
    finalite: "Mesure d'audience : pages vues, provenance, parcours.",
    duree: "14 mois",
    consentement: true,
  },
  {
    nom: "Google Ads",
    editeur: "Google Ireland Limited",
    finalite:
      "Mesure des conversions publicitaires : savoir quelle annonce a mené à une prise de contact.",
    duree: "90 jours",
    consentement: true,
  },
] as const;

export const MAJ = "7 août 2026";
