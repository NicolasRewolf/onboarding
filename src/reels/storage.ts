// Persistance locale du vote (reprise après rechargement). Aucune donnée ne quitte
// l'appareil avant l'envoi explicite — même modèle que le questionnaire de cadrage.

import type { ReelChoice } from "./data";

export interface ReelsSession {
  votes: Record<number, ReelChoice>;
  coeurs: number[];
  note: string;
  /** Index de la carte courante dans le deck. */
  index: number;
  /** true une fois l'envoi réussi (pour rouvrir sur l'écran de fin). */
  sent: boolean;
}

const PREFIX = "rw_reels_";

const EMPTY: ReelsSession = { votes: {}, coeurs: [], note: "", index: 0, sent: false };

export function loadSession(slug: string): ReelsSession {
  try {
    const raw = localStorage.getItem(PREFIX + slug);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<ReelsSession>;
    return {
      votes: parsed.votes && typeof parsed.votes === "object" ? parsed.votes : {},
      coeurs: Array.isArray(parsed.coeurs) ? parsed.coeurs : [],
      note: typeof parsed.note === "string" ? parsed.note : "",
      index: typeof parsed.index === "number" ? parsed.index : 0,
      sent: parsed.sent === true,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveSession(slug: string, session: ReelsSession): void {
  try {
    localStorage.setItem(PREFIX + slug, JSON.stringify(session));
  } catch {
    /* quota/private mode : le vote reste en mémoire, tant pis pour la reprise */
  }
}

export function clearSession(slug: string): void {
  try {
    localStorage.removeItem(PREFIX + slug);
  } catch {
    /* ignore */
  }
}
