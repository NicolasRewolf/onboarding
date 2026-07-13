// Construit le récap des votes : markdown (envoi serveur + copie presse-papier) et
// corps mailto compact (filet de sécurité si l'endpoint échoue). Source de vérité de
// la mise en forme lisible — le serveur ne fait que persister ce markdown.

import { CHOICE_BY_KEY, REELS, type ReelChoice, type ReelsClient } from "./data";
import { salutation } from "./data";
import type { ReelsSession } from "./storage";

export interface VoteLine {
  id: number;
  sujet: string;
  choice: ReelChoice;
  coeur: boolean;
  composite: number | null;
}

/** Ordonne les sujets votés par choix (tourne → voir → passe), coups de cœur d'abord. */
export function buildVoteLines(session: ReelsSession): VoteLine[] {
  const rank: Record<ReelChoice, number> = { tourne: 0, voir: 1, passe: 2 };
  const coeurs = new Set(session.coeurs);
  return REELS.filter((r) => session.votes[r.id])
    .map((r) => ({
      id: r.id,
      sujet: r.sujet,
      choice: session.votes[r.id],
      coeur: coeurs.has(r.id),
      composite: r.composite,
    }))
    .sort((a, b) => {
      if (a.coeur !== b.coeur) return a.coeur ? -1 : 1;
      if (rank[a.choice] !== rank[b.choice]) return rank[a.choice] - rank[b.choice];
      return a.id - b.id;
    });
}

export interface VoteStats {
  tourne: number;
  voir: number;
  passe: number;
  coeurs: number;
  decided: number;
  total: number;
}

export function voteStats(session: ReelsSession): VoteStats {
  const votes = Object.values(session.votes);
  return {
    tourne: votes.filter((v) => v === "tourne").length,
    voir: votes.filter((v) => v === "voir").length,
    passe: votes.filter((v) => v === "passe").length,
    coeurs: session.coeurs.length,
    decided: votes.length,
    total: REELS.length,
  };
}

function line(r: VoteLine): string {
  const c = CHOICE_BY_KEY[r.choice];
  const star = r.coeur ? "⭐ " : "";
  const score = r.composite !== null ? ` _(score ${r.composite}/95)_` : "";
  return `- ${star}${c.emoji} **${r.sujet}**${score}`;
}

export function buildRecapMarkdown(client: ReelsClient, session: ReelsSession): string {
  const lines = buildVoteLines(session);
  const s = voteStats(session);
  const byChoice = (k: ReelChoice) => lines.filter((l) => l.choice === k);
  const coeurs = lines.filter((l) => l.coeur);

  const out: string[] = [];
  out.push(`# Votes reels — ${salutation(client.name)}`);
  out.push("");
  out.push(
    `**Bilan :** 🔥 ${s.tourne} à tourner · 🤔 ${s.voir} à voir · ✋ ${s.passe} écartés · ⭐ ${s.coeurs} coup(s) de cœur — ${s.decided}/${s.total} sujets tranchés.`,
  );
  out.push("");

  if (coeurs.length) {
    out.push(`## ⭐ Coups de cœur (à tourner en priorité)`);
    out.push("");
    coeurs.forEach((l) => out.push(line({ ...l, coeur: false }))); // pas de double étoile dans cette section
    out.push("");
  }

  const sections: { key: ReelChoice; title: string }[] = [
    { key: "tourne", title: "🔥 Je tourne" },
    { key: "voir", title: "🤔 À voir / à discuter" },
    { key: "passe", title: "✋ Je passe" },
  ];
  for (const sec of sections) {
    const group = byChoice(sec.key);
    if (!group.length) continue;
    out.push(`## ${sec.title} (${group.length})`);
    out.push("");
    group.forEach((l) => out.push(line(l)));
    out.push("");
  }

  const undecided = REELS.filter((r) => !session.votes[r.id]);
  if (undecided.length) {
    out.push(`## ⏳ Pas encore tranchés (${undecided.length})`);
    out.push("");
    undecided.forEach((r) => out.push(`- ${r.sujet}`));
    out.push("");
  }

  if (session.note.trim()) {
    out.push(`## 💬 Mot de ${salutation(client.name)}`);
    out.push("");
    out.push(session.note.trim());
    out.push("");
  }

  return out.join("\n");
}

/** Corps mailto compact (les titres regroupés), sans dépasser les limites d'URL. */
export function buildMailtoBody(client: ReelsClient, session: ReelsSession): string {
  const lines = buildVoteLines(session);
  const s = voteStats(session);
  const byChoice = (k: ReelChoice) =>
    lines.filter((l) => l.choice === k).map((l) => `${l.coeur ? "⭐ " : ""}${l.sujet}`);

  const parts: string[] = [];
  parts.push(`Bonjour Nicolas,`, ``, `Voici mes votes sur les sujets de reels :`, ``);
  parts.push(`🔥 Je tourne (${s.tourne}) :`, ...byChoice("tourne").map((t) => `  • ${t}`), ``);
  if (s.voir) parts.push(`🤔 À voir (${s.voir}) :`, ...byChoice("voir").map((t) => `  • ${t}`), ``);
  if (s.passe) parts.push(`✋ Je passe (${s.passe}) :`, ...byChoice("passe").map((t) => `  • ${t}`), ``);
  if (session.note.trim()) parts.push(`Un mot : ${session.note.trim()}`, ``);
  parts.push(`— ${salutation(client.name)}`);
  return parts.join("\n");
}
