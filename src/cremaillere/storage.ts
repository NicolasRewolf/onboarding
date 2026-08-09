// Persistance locale de la fiche (mémoire vive du navigateur) : on retrouve
// ses votes en revenant sur la page, et l'id stable permet de mettre à jour
// sa fiche côté repo au lieu d'en créer une nouvelle.

import type { VoteCategory } from "./data";

export interface PartySession {
  id: string;
  firstName: string;
  lastName: string;
  astro: string;
  email: string;
  avatar: string;
  kids: number;
  bring: { chaises: number; tableBasse: number; autre: string };
  votes: Record<VoteCategory, string[]>;
  sent: boolean;
  declined: boolean;
}

const KEY = "rw_cremaillere_v1";

export const emptySession = (): PartySession => ({
  id: "",
  firstName: "",
  lastName: "",
  astro: "",
  email: "",
  avatar: "",
  kids: 0,
  bring: { chaises: 0, tableBasse: 0, autre: "" },
  votes: { dates: [], drinks: [], apero: [], entrees: [], plats: [], desserts: [] },
  sent: false,
  declined: false,
});

export function loadSession(): PartySession {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySession();
    return { ...emptySession(), ...(JSON.parse(raw) as Partial<PartySession>) };
  } catch {
    return emptySession();
  }
}

export function saveSession(s: PartySession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* stockage plein ou bloqué : la page reste utilisable, on perd juste la reprise */
  }
}

/** Id stable et anonyme-compatible : prénom slugifié + suffixe aléatoire. */
export function makeGuestId(firstName: string): string {
  const base =
    firstName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "invite";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
