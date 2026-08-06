// Persistance locale de la sélection (reprise après rechargement). Rien ne quitte
// l'appareil avant l'envoi explicite — même modèle que le vote reels.

import type { ArticleChoice } from "./data";

export interface ArticlesSession {
  choix: Record<number, ArticleChoice>;
  coeurs: number[];
  note: string;
  /** true une fois l'envoi réussi (pour rouvrir sur l'écran de fin). */
  sent: boolean;
}

const PREFIX = "rw_articles_";

const EMPTY: ArticlesSession = { choix: {}, coeurs: [], note: "", sent: false };

export function loadSession(slug: string): ArticlesSession {
  try {
    const raw = localStorage.getItem(PREFIX + slug);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<ArticlesSession>;
    return {
      choix: parsed.choix && typeof parsed.choix === "object" ? parsed.choix : {},
      coeurs: Array.isArray(parsed.coeurs) ? parsed.coeurs : [],
      note: typeof parsed.note === "string" ? parsed.note : "",
      sent: parsed.sent === true,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveSession(slug: string, session: ArticlesSession): void {
  try {
    localStorage.setItem(PREFIX + slug, JSON.stringify(session));
  } catch {
    /* quota / navigation privée : la sélection reste en mémoire, tant pis pour la reprise */
  }
}

export function clearSession(slug: string): void {
  try {
    localStorage.removeItem(PREFIX + slug);
  } catch {
    /* ignore */
  }
}
