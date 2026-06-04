// Registre des clients. Un client connu = une entrée ici (slug stable + questionnaire associé).
// Pour un nouveau client à la volée, pas besoin de redéployer :
//   /c/<slug>?n=Nom%20du%20client&t=Titre&p=Projet&q=horloger
// Les paramètres d'URL servent de repli si le slug n'est pas dans le registre.

export interface ClientInfo {
  slug: string;
  name: string;
  title?: string;
  project?: string;
  intro?: string;
  questionnaire?: string; // id dans QUESTIONNAIRES (défaut : "cadrage")
}

const REGISTRY: Record<string, ClientInfo> = {
  derieux: {
    slug: "derieux",
    name: "Me Jacques Derieux",
    title: "Avocat",
    project: "Identité visuelle · site web · blog · acquisition",
    questionnaire: "cadrage",
  },
  gmt: {
    slug: "gmt",
    name: "GMT Bordeaux",
    title: "Bryan Durand · Horloger",
    project: "Refonte du site web + shooting photo",
    questionnaire: "horloger",
  },
};

function prettify(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function resolveClient(slug: string, params: URLSearchParams): ClientInfo {
  const known = REGISTRY[slug.toLowerCase()];
  if (known) return known;
  return {
    slug,
    name: params.get("n") || prettify(slug),
    title: params.get("t") || undefined,
    project: params.get("p") || undefined,
    questionnaire: params.get("q") || undefined,
  };
}

export const KNOWN_CLIENTS = Object.values(REGISTRY);
