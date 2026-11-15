import { ALBRET } from "./albret";
import type { Answers, Card, CardAnswer, Chapter, EntretienContent, Option } from "./types";

/* ─────────────── Registre ─────────────── */

const ENTRETIENS: Record<string, EntretienContent> = { albret: ALBRET };

export interface ResolvedEntretien {
  content: EntretienContent;
  /** Slug de l'URL : dossier d'envoi et clé du brouillon. */
  slug: string;
  /** `test-…` / `demo-…` : dossier d'essai côté serveur, aucune notification. */
  isTest: boolean;
}

export function resolveEntretien(raw: string): ResolvedEntretien | null {
  const slug = raw.toLowerCase();
  const m = slug.match(/^(?:test|demo)-(.+)$/);
  const content = ENTRETIENS[m ? m[1] : slug];
  return content ? { content, slug, isTest: !!m } : null;
}

/* ─────────────── Réponses ─────────────── */

export function isVisible(card: Card, a: Answers): boolean {
  if (!card.when) return true;
  const v = a[card.when.id]?.value;
  return !(v && card.when.not.includes(v));
}

export const visibleCards = (ch: Chapter, a: Answers): Card[] => ch.cards.filter((c) => isVisible(c, a));

const filled = (s?: string) => !!s && s.trim().length > 0;

export function isAnswered(card: Card, x?: CardAnswer): boolean {
  if (!x || x.skipped) return false;
  switch (card.kind) {
    case "confirm":
      return !!x.value;
    case "choice":
      return !!x.value && (x.value !== "other" || filled(x.other));
    case "multi":
      return (x.values?.length ?? 0) > 0 || filled(x.other);
    case "grid":
      return Object.keys(x.rows ?? {}).length > 0;
    case "number":
    case "long":
      return filled(x.value);
    case "fields":
      return Object.values(x.fields ?? {}).some(filled);
    case "list":
      return (x.items ?? []).some(filled);
  }
}

/** Répondue ou passée : la carte n'attend plus rien. */
export const isDone = (card: Card, x?: CardAnswer) => isAnswered(card, x) || !!x?.skipped;

export interface Progress {
  answered: number;
  skipped: number;
  total: number;
}

export function chapterProgress(ch: Chapter, a: Answers): Progress {
  const cards = visibleCards(ch, a);
  return {
    answered: cards.filter((c) => isAnswered(c, a[c.id])).length,
    skipped: cards.filter((c) => !isAnswered(c, a[c.id]) && a[c.id]?.skipped).length,
    total: cards.length,
  };
}

export function totalProgress(content: EntretienContent, a: Answers): Progress {
  return content.chapters.reduce<Progress>(
    (acc, ch) => {
      const p = chapterProgress(ch, a);
      return { answered: acc.answered + p.answered, skipped: acc.skipped + p.skipped, total: acc.total + p.total };
    },
    { answered: 0, skipped: 0, total: 0 },
  );
}

export const chapterDone = (ch: Chapter, a: Answers) => visibleCards(ch, a).every((c) => isDone(c, a[c.id]));

/* ─────────────── Mise en forme (rapport) ─────────────── */

const lab = (opts: Option[], v?: string) => opts.find((o) => o.v === v)?.label ?? v ?? "";
const CONFIRM: Record<string, string> = { exact: "✅ C'est ça", nuance: "🟠 Pas tout à fait", faux: "❌ Non" };

/** Réponse lisible, sur une ou plusieurs lignes (Markdown). Vide si rien. */
export function formatAnswer(card: Card, x?: CardAnswer): string {
  if (!x || !isAnswered(card, x)) return "";
  switch (card.kind) {
    case "confirm":
      return CONFIRM[x.value!] ?? x.value!;
    case "choice":
      return x.value === "other" ? `Autre : ${x.other!.trim()}` : lab(card.options, x.value);
    case "multi": {
      const chosen = (x.values ?? []).map((v) => lab(card.options, v));
      if (filled(x.other)) chosen.push(`Autre : ${x.other!.trim()}`);
      let out = chosen.join(" · ");
      const removed = (card.preset ?? []).filter((v) => !(x.values ?? []).includes(v));
      if (removed.length) out += `\n_Décoché : ${removed.map((v) => lab(card.options, v)).join(", ")}_`;
      return out;
    }
    case "grid":
      return card.rows
        .map((r) => `- ${r.label} : ${x.rows?.[r.v] ? `**${lab(card.columns, x.rows[r.v])}**` : "—"}`)
        .join("\n");
    case "number": {
      const q = card.qualifiers ? lab(card.qualifiers, x.qualifier ?? card.qualifiers[0].v) : "";
      return `**${x.approx ? "environ " : ""}${x.value!.trim()}${card.unit ? ` ${card.unit}` : ""}${q ? ` ${q}` : ""}**`;
    }
    case "fields":
      return card.fields.map((f) => `- ${f.label} : ${filled(x.fields?.[f.key]) ? x.fields![f.key].trim() : "—"}`).join("\n");
    case "long":
      return x.value!.trim().split("\n").map((l) => `> ${l}`).join("\n");
    case "list":
      return (x.items ?? []).filter(filled).map((i) => `- ${i.trim()}`).join("\n");
  }
}

/** Réponse courte sur une ligne, pour le tableau par numéro de question. */
export function shortAnswer(card: Card, x?: CardAnswer): string {
  if (x?.skipped && !isAnswered(card, x)) return "⏭ passée";
  const s = formatAnswer(card, x)
    .replace(/\*\*|_/g, "")
    .replace(/^> /gm, "")
    .replace(/^- /gm, "")
    .replace(/\n+/g, " · ")
    .replace(/\|/g, "/");
  return s.length > 90 ? s.slice(0, 89) + "…" : s || "—";
}
