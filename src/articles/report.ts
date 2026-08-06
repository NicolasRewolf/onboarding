// Récap de la sélection : markdown (envoi serveur + copie presse-papier) et corps
// mailto compact (filet de sécurité si l'endpoint échoue). Source de vérité de la
// mise en forme lisible — le serveur ne fait que persister ce markdown.

import { CHOICE_BY_KEY, SERIE_BY_KEY, SUJETS, formatVolume, salutation } from "./data";
import type { ArticleChoice, ArticlesClient, Sujet } from "./data";
import type { ArticlesSession } from "./storage";

export interface SelectionLine {
  id: number;
  titre: string;
  choice: ArticleChoice;
  coeur: boolean;
  sujet: Sujet;
}

/** Ordonne les sujets tranchés : coups de cœur d'abord, puis oui → peut-être → non. */
export function buildSelectionLines(session: ArticlesSession): SelectionLine[] {
  const rank: Record<ArticleChoice, number> = { oui: 0, peutetre: 1, non: 2 };
  const coeurs = new Set(session.coeurs);
  return SUJETS.filter((s) => session.choix[s.id])
    .map((s) => ({
      id: s.id,
      titre: s.titre,
      choice: session.choix[s.id],
      coeur: coeurs.has(s.id),
      sujet: s,
    }))
    .sort((a, b) => {
      if (a.coeur !== b.coeur) return a.coeur ? -1 : 1;
      if (rank[a.choice] !== rank[b.choice]) return rank[a.choice] - rank[b.choice];
      return a.id - b.id;
    });
}

export interface SelectionStats {
  oui: number;
  peutetre: number;
  non: number;
  coeurs: number;
  tranches: number;
  total: number;
}

export function selectionStats(session: ArticlesSession): SelectionStats {
  const choix = Object.values(session.choix);
  return {
    oui: choix.filter((c) => c === "oui").length,
    peutetre: choix.filter((c) => c === "peutetre").length,
    non: choix.filter((c) => c === "non").length,
    coeurs: session.coeurs.length,
    tranches: choix.length,
    total: SUJETS.length,
  };
}

function line(l: SelectionLine, withStar = true): string {
  const c = CHOICE_BY_KEY[l.choice];
  const star = withStar && l.coeur ? "⭐ " : "";
  const serie = l.sujet.serie === "solo" || l.sujet.serie === "reserve" ? "" : ` _(série ${l.sujet.serie})_`;
  return `- ${star}${c.emoji} **${l.titre}** — ${formatVolume(l.sujet.volume)} rech./mois${serie}`;
}

export function buildRecapMarkdown(client: ArticlesClient, session: ArticlesSession): string {
  const lines = buildSelectionLines(session);
  const s = selectionStats(session);
  const byChoice = (k: ArticleChoice) => lines.filter((l) => l.choice === k);
  const coeurs = lines.filter((l) => l.coeur);

  const out: string[] = [];
  out.push(`# Sélection de sujets — ${salutation(client.name)}`);
  out.push("");
  out.push(
    `**Bilan :** ✍️ ${s.oui} à rédiger · 🤔 ${s.peutetre} en réserve · ✋ ${s.non} écartés · ⭐ ${s.coeurs} priorité(s) — ${s.tranches}/${s.total} sujets tranchés.`,
  );
  out.push("");

  if (coeurs.length) {
    out.push(`## ⭐ À écrire en premier`);
    out.push("");
    coeurs.forEach((l) => out.push(line(l, false)));
    out.push("");
  }

  const sections: { key: ArticleChoice; title: string }[] = [
    { key: "oui", title: "✍️ Je le veux" },
    { key: "peutetre", title: "🤔 Pourquoi pas" },
    { key: "non", title: "✋ Sans moi" },
  ];
  for (const sec of sections) {
    const group = byChoice(sec.key);
    if (!group.length) continue;
    out.push(`## ${sec.title} (${group.length})`);
    out.push("");
    group.forEach((l) => out.push(line(l)));
    out.push("");
  }

  // Séries complètes retenues : information utile pour l'ordre de production.
  const retenus = new Set(byChoice("oui").map((l) => l.id));
  const seriesCompletes = (["A", "B", "C"] as const).filter((k) => {
    const membres = SUJETS.filter((s) => s.serie === k);
    return membres.length > 0 && membres.every((m) => retenus.has(m.id));
  });
  if (seriesCompletes.length) {
    out.push(`## 🧩 Séries retenues au complet`);
    out.push("");
    seriesCompletes.forEach((k) => out.push(`- **Série ${k}** — ${SERIE_BY_KEY[k].titre}`));
    out.push("");
  }

  const nonTranches = SUJETS.filter((s) => !session.choix[s.id]);
  if (nonTranches.length) {
    out.push(`## ⏳ Pas encore tranchés (${nonTranches.length})`);
    out.push("");
    nonTranches.forEach((s) => out.push(`- ${s.titre}`));
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

/** Corps mailto compact — filet de sécurité si l'endpoint échoue. */
export function buildMailtoBody(client: ArticlesClient, session: ArticlesSession): string {
  const lines = buildSelectionLines(session);
  const s = selectionStats(session);
  const titres = (k: ArticleChoice) =>
    lines.filter((l) => l.choice === k).map((l) => `${l.coeur ? "⭐ " : ""}${l.titre}`);

  const parts: string[] = [];
  parts.push(`Bonjour Nicolas,`, ``, `Voici les sujets que je retiens :`, ``);
  parts.push(`✍️ À rédiger (${s.oui}) :`, ...titres("oui").map((t) => `  • ${t}`), ``);
  if (s.peutetre) parts.push(`🤔 Pourquoi pas (${s.peutetre}) :`, ...titres("peutetre").map((t) => `  • ${t}`), ``);
  if (s.non) parts.push(`✋ Sans moi (${s.non}) :`, ...titres("non").map((t) => `  • ${t}`), ``);
  if (session.note.trim()) parts.push(`Un mot : ${session.note.trim()}`, ``);
  parts.push(`— ${salutation(client.name)}`);
  return parts.join("\n");
}
