import { chapterProgress, formatAnswer, isAnswered, isVisible, shortAnswer, totalProgress, type ResolvedEntretien } from "./logic";
import type { Answers } from "./types";

/* ─────────────── Brouillon local ─────────────── */

export interface Draft {
  answers: Answers;
  /** Mot laissé à Nicolas sur l'écran de fin. */
  message: string;
  /** Dernier envoi réussi (étape ou final). */
  sentAt?: string;
  sentAnswered?: number;
  /** Dernier envoi final (« J'ai fini »). */
  finalAt?: string;
}

const key = (slug: string) => `rewolf_entretien_${slug}_v1`;

export function loadDraft(slug: string): Draft {
  try {
    const raw = localStorage.getItem(key(slug));
    if (raw) return { answers: {}, message: "", ...(JSON.parse(raw) as Partial<Draft>) };
  } catch {
    /* navigation privée, données effacées : on repart de zéro */
  }
  return { answers: {}, message: "" };
}

export function saveDraft(slug: string, d: Draft): void {
  try {
    localStorage.setItem(key(slug), JSON.stringify(d));
  } catch {
    /* quota / mode privé : l'envoi au serveur reste la sauvegarde qui compte */
  }
}

/* ─────────────── Rapport Markdown ─────────────── */

const dateFr = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" });

export function buildReport(e: ResolvedEntretien, d: Draft, final: boolean, at: string): string {
  const { content } = e;
  const a = d.answers;
  const p = totalProgress(content, a);
  const unseen = p.total - p.answered - p.skipped;
  const L: string[] = [];

  L.push(`# Entretien — ${content.client.name}`, "");
  L.push(
    `> **${p.answered} / ${p.total}** réponses · ${p.skipped} passée${p.skipped > 1 ? "s" : ""} (à voir au téléphone) · ${unseen} pas encore vue${unseen > 1 ? "s" : ""}`,
    `> ${final ? "Envoi final" : "Envoi d'étape (en cours de remplissage)"} · ${dateFr(at)}${e.isTest ? " · **ESSAI**" : ""}`,
    "",
  );

  if (d.message.trim()) {
    L.push(`## Un mot de ${content.client.person}`, "", ...d.message.trim().split("\n").map((l) => `> ${l}`), "");
  }

  const skipped: string[] = [];
  const table: string[] = [];

  content.chapters.forEach((ch, ci) => {
    const cp = chapterProgress(ch, a);
    L.push(`## ${ci + 1}. ${ch.title}`, "", `_${cp.answered} / ${cp.total} réponses_`, "");
    for (const card of ch.cards) {
      if (!isVisible(card, a)) continue;
      const x = a[card.id];
      const refs = card.refs?.length ? ` · Q${card.refs.join(", Q")}` : "";
      L.push(`### ${card.label}${refs}`, "");
      if (card.kind === "confirm") L.push(`_Phrase proposée : « ${card.statement} »_`, "");
      if (isAnswered(card, x)) {
        L.push(formatAnswer(card, x));
        const site = card.kind === "confirm" ? (x?.value === "exact" ? card.statement : null) : card.preview?.(x!, a);
        if (site) L.push("", `Sur le site : « ${site} »`);
      } else if (x?.skipped) {
        L.push("⏭ _Passée : à voir au téléphone_");
        skipped.push(`- ${card.label}${refs}`);
      } else {
        L.push("_— pas encore vue_");
      }
      if (x?.note?.trim()) L.push("", `📝 ${x.note.trim()}`);
      L.push("");
      for (const n of card.refs ?? []) table.push(`| ${n} | ${shortAnswer(card, x)} | ${card.id} |`);
    }
  });

  if (skipped.length) L.push("## À voir au téléphone", "", ...skipped, "");

  table.sort((x, y) => parseInt(x.slice(2), 10) - parseInt(y.slice(2), 10));
  L.push(
    "## Par numéro de question",
    "",
    ...(content.refsNote ? [content.refsNote, ""] : []),
    "| Q | Réponse | Carte |",
    "|---|---|---|",
    ...table,
    "",
  );
  return L.join("\n");
}

/* ─────────────── Données structurées ─────────────── */

export function buildData(e: ResolvedEntretien, d: Draft, final: boolean, at: string) {
  const a = d.answers;
  return {
    slug: e.slug,
    client: e.content.client.name,
    final,
    submittedAt: at,
    progress: totalProgress(e.content, a),
    message: d.message.trim(),
    cards: e.content.chapters.flatMap((ch) =>
      ch.cards
        .filter((c) => isVisible(c, a))
        .map((c) => ({
          chapter: ch.id,
          id: c.id,
          refs: c.refs ?? [],
          kind: c.kind,
          label: c.label,
          answered: isAnswered(c, a[c.id]),
          answer: a[c.id] ?? null,
          text: formatAnswer(c, a[c.id]),
        })),
    ),
  };
}

/* ─────────────── Envoi ─────────────── */

export async function sendEntretien(e: ResolvedEntretien, d: Draft, final: boolean): Promise<{ ok: boolean; error?: string }> {
  const at = new Date().toISOString();
  const p = totalProgress(e.content, d.answers);
  try {
    const res = await fetch("/api/entretien", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: e.slug,
        client: { name: e.content.client.name },
        final,
        stats: p,
        reportMarkdown: buildReport(e, d, final, at),
        data: buildData(e, d, final, at),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? { ok: true } : { ok: false, error: body.error || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}
