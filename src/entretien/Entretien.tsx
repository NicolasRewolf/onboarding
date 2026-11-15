import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Clock, Loader2, Send, SkipForward } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardInput } from "./CardInput";
import {
  chapterDone,
  chapterProgress,
  isAnswered,
  isDone,
  resolveEntretien,
  totalProgress,
  visibleCards,
  type ResolvedEntretien,
} from "./logic";
import { loadDraft, saveDraft, sendEntretien, type Draft } from "./report";
import type { Answers, Card, CardAnswer, Chapter } from "./types";

type Screen =
  | { s: "intro" }
  | { s: "map" }
  | { s: "card"; ch: number; i: number }
  | { s: "chapter"; ch: number }
  | { s: "end" }
  | { s: "sent" };

type SendState = "idle" | "sending" | "ok" | "error";

const hourFr = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** La phrase que la réponse donnera sur le site, si la carte en a une. */
function sitePhrase(card: Card, x: CardAnswer | undefined, all: Answers): string | null {
  if (!x) return null;
  if (card.kind === "confirm") return x.value === "exact" ? card.statement : null;
  return card.preview?.(x, all) ?? null;
}

export default function Entretien() {
  const { slug = "" } = useParams();
  const entry = resolveEntretien(slug);
  if (!entry) return <Navigate to="/" replace />;
  return <Session key={entry.slug} entry={entry} />;
}

function Session({ entry }: { entry: ResolvedEntretien }) {
  const { content } = entry;
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState<Draft>(() => loadDraft(entry.slug));
  const [screen, setScreen] = useState<Screen>(() =>
    Object.keys(loadDraft(entry.slug).answers).length ? { s: "map" } : { s: "intro" },
  );
  const [sendState, setSendState] = useState<SendState>("idle");

  useEffect(() => {
    document.title = `Entretien · ${content.client.name}`;
  }, [content]);

  const draftRef = useRef(draft);
  const screenRef = useRef(screen);
  useEffect(() => {
    draftRef.current = draft;
    saveDraft(entry.slug, draft);
  }, [draft, entry.slug]);
  useEffect(() => {
    screenRef.current = screen;
    window.scrollTo({ top: 0 });
  }, [screen]);

  /* ── Envoi : un à la fois, le suivant attend son tour ── */
  const inFlight = useRef(false);
  const queued = useRef<boolean | null>(null);
  const send = useCallback(
    async (final: boolean) => {
      if (inFlight.current) {
        queued.current = (queued.current ?? false) || final;
        return;
      }
      inFlight.current = true;
      setSendState("sending");
      const d = draftRef.current;
      const r = await sendEntretien(entry, d, final);
      inFlight.current = false;
      if (r.ok) {
        const at = new Date().toISOString();
        const answered = totalProgress(content, d.answers).answered;
        setDraft((x) => ({ ...x, sentAt: at, sentAnswered: answered, ...(final ? { finalAt: at } : {}) }));
        setSendState("ok");
        if (final) setScreen({ s: "sent" });
      } else {
        console.warn("Entretien : envoi refusé", r.error);
        setSendState("error");
      }
      if (queued.current !== null) {
        const f = queued.current;
        queued.current = null;
        void send(f);
      }
    },
    [entry, content],
  );

  /* ── Réponses ── */
  const patch = useCallback((id: string, p: Partial<CardAnswer>) => {
    setDraft((d) => {
      const prev = d.answers[id] ?? {};
      const onlyNote = Object.keys(p).length === 1 && "note" in p;
      return { ...d, answers: { ...d.answers, [id]: { ...prev, ...p, skipped: onlyNote ? prev.skipped : false } } };
    });
  }, []);

  /* ── Navigation ── */
  const timer = useRef<number | undefined>(undefined);
  const sendAfterRender = useRef(false);
  const clearTimer = () => window.clearTimeout(timer.current);

  const openChapter = (ch: number) => {
    clearTimer();
    const cards = visibleCards(content.chapters[ch], draftRef.current.answers);
    const i = cards.findIndex((c) => !isDone(c, draftRef.current.answers[c.id]));
    setScreen({ s: "card", ch, i: Math.max(0, i) });
  };

  const advance = useCallback(
    (ch: number, i: number, a: Answers) => {
      const cards = visibleCards(content.chapters[ch], a);
      if (i + 1 < cards.length) {
        setScreen({ s: "card", ch, i: i + 1 });
      } else {
        // Envoyé après le rendu, pour partir avec la dernière réponse du chapitre.
        sendAfterRender.current = true;
        setScreen({ s: "chapter", ch });
      }
    },
    [content],
  );
  useEffect(() => {
    if (!sendAfterRender.current) return;
    sendAfterRender.current = false;
    void send(false);
  }, [screen, send]);

  const next = (ch: number, i: number) => {
    clearTimer();
    const card = visibleCards(content.chapters[ch], draftRef.current.answers)[i];
    // Liste pré-cochée validée telle quelle : la présélection devient la réponse.
    if (card?.kind === "multi" && card.preset && !draftRef.current.answers[card.id]?.values) {
      patch(card.id, { values: card.preset });
    }
    advance(ch, i, draftRef.current.answers);
  };

  const skip = (ch: number, i: number) => {
    clearTimer();
    const a = draftRef.current.answers;
    const card = visibleCards(content.chapters[ch], a)[i];
    setDraft((d) => ({ ...d, answers: { ...d.answers, [card.id]: { ...d.answers[card.id], skipped: true } } }));
    advance(ch, i, a);
  };

  const prev = (ch: number, i: number) => {
    clearTimer();
    setScreen(i > 0 ? { s: "card", ch, i: i - 1 } : { s: "map" });
  };

  // Réponse en un geste : on laisse voir le choix, puis carte suivante.
  const picked = (ch: number, i: number) => {
    clearTimer();
    timer.current = window.setTimeout(() => {
      const sc = screenRef.current;
      if (sc.s === "card" && sc.ch === ch && sc.i === i) advance(ch, i, draftRef.current.answers);
    }, 320);
  };
  useEffect(() => {
    const t = timer;
    return () => window.clearTimeout(t.current);
  }, []);

  const total = totalProgress(content, draft.answers);
  const nextChapter = (from: number) => {
    for (let k = 1; k <= content.chapters.length; k++) {
      const c = (from + k) % content.chapters.length;
      if (!chapterDone(content.chapters[c], draft.answers)) return c;
    }
    return -1;
  };

  const key =
    screen.s === "card" ? `card-${screen.ch}-${screen.i}` : screen.s === "chapter" ? `chapter-${screen.ch}` : screen.s;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {entry.isTest && (
        <div className="bg-rw-black px-4 py-2 text-center font-mono text-[11px] uppercase tracking-widest text-rw-white">
          Mode essai · les réponses vont dans un dossier d'essai, sans notification
        </div>
      )}
      <header className="border-b-2 border-rw-black">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Wordmark className="h-4 text-rw-black" />
          <span className="rw-eyebrow text-rw-muted">{content.client.name}</span>
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          className="flex flex-1 flex-col"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -28 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {screen.s === "intro" && <Intro entry={entry} onStart={() => openChapter(0)} />}

          {screen.s === "map" && (
            <ChapterMap
              entry={entry}
              answers={draft.answers}
              draft={draft}
              sendState={sendState}
              onOpen={openChapter}
              onFinish={() => setScreen({ s: "end" })}
            />
          )}

          {screen.s === "card" &&
            (() => {
              const ch = content.chapters[screen.ch];
              const cards = visibleCards(ch, draft.answers);
              const card = cards[Math.min(screen.i, cards.length - 1)];
              if (!card) return null;
              return (
                <CardScreen
                  key={card.id}
                  chapter={ch}
                  chapterIndex={screen.ch}
                  cards={cards}
                  index={screen.i}
                  card={card}
                  answers={draft.answers}
                  onChange={(p) => patch(card.id, p)}
                  onPicked={() => picked(screen.ch, screen.i)}
                  onNext={() => next(screen.ch, screen.i)}
                  onSkip={() => skip(screen.ch, screen.i)}
                  onPrev={() => prev(screen.ch, screen.i)}
                  onMap={() => {
                    clearTimer();
                    setScreen({ s: "map" });
                  }}
                />
              );
            })()}

          {screen.s === "chapter" && (
            <ChapterDone
              chapter={content.chapters[screen.ch]}
              index={screen.ch}
              answers={draft.answers}
              sendState={sendState}
              onRetry={() => void send(false)}
              next={nextChapter(screen.ch)}
              chapters={content.chapters}
              onOpen={openChapter}
              onMap={() => setScreen({ s: "map" })}
              onEnd={() => setScreen({ s: "end" })}
            />
          )}

          {screen.s === "end" && (
            <EndScreen
              entry={entry}
              draft={draft}
              sendState={sendState}
              onMessage={(message) => setDraft((d) => ({ ...d, message }))}
              onGoto={(ch, i) => setScreen({ s: "card", ch, i })}
              onMap={() => setScreen({ s: "map" })}
              onSend={() => void send(true)}
            />
          )}

          {screen.s === "sent" && (
            <Sent person={content.client.person} answered={total.answered} skipped={total.skipped} onMap={() => setScreen({ s: "map" })} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════ Écrans ═══════════════════════════ */

function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn("mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12", className)}>{children}</main>;
}

function ProgressBar({ value, total, className }: { value: number; total: number; className?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className={cn("h-3 border-2 border-rw-black bg-rw-white", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-rw-orange transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Intro({ entry, onStart }: { entry: ResolvedEntretien; onStart: () => void }) {
  const { content } = entry;
  const firsts = content.chapters.filter((c) => c.first);
  const points = [
    `${content.chapters.length} petits chapitres, une demi-heure en tout. Pas besoin de tout faire d'un coup.`,
    `Commence par les ${firsts.length} premiers : c'est ce qui me manque le plus, une dizaine de minutes.`,
    "Tu sèches sur une question ? « Je passe », on en parlera au téléphone.",
    "Si tu t'arrêtes, rien n'est perdu : tu reprends plus tard sur le même téléphone (ou le même ordi). Et je reçois tes réponses au fur et à mesure.",
  ];
  return (
    <Page className="flex flex-col justify-center">
      <p className="rw-tag w-fit">Entretien · {content.client.name}</p>
      <h1 className="mt-5 text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">{content.intro.title}</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-rw-muted">{content.intro.lead}</p>
      <ul className="mt-8 space-y-3 border-l-4 border-rw-orange pl-4">
        {points.map((p) => (
          <li key={p} className="text-[15px] leading-relaxed">
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-rw-muted">
        Les phrases « sur le site », c'est moi qui les propose : on les retouchera ensemble.
      </p>
      <div className="mt-10">
        <Button variant="rw" size="lg" onClick={onStart}>
          C'est parti <ArrowRight />
        </Button>
      </div>
    </Page>
  );
}

function ChapterMap({
  entry,
  answers,
  draft,
  sendState,
  onOpen,
  onFinish,
}: {
  entry: ResolvedEntretien;
  answers: Answers;
  draft: Draft;
  sendState: SendState;
  onOpen: (ch: number) => void;
  onFinish: () => void;
}) {
  const { content } = entry;
  const t = totalProgress(content, answers);
  const firstTodo = content.chapters.findIndex((c) => !chapterDone(c, answers));
  return (
    <Page>
      <p className="rw-eyebrow text-rw-muted">Sommaire</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Où tu en es
      </h1>
      <div className="mt-6 flex items-center gap-3">
        <ProgressBar value={t.answered + t.skipped} total={t.total} className="flex-1" />
        <span className="shrink-0 font-mono text-sm font-semibold">
          {t.answered + t.skipped} / {t.total}
        </span>
      </div>
      <SaveLine draft={draft} sendState={sendState} />

      <ol className="mt-8 space-y-3">
        {content.chapters.map((ch, k) => {
          const p = chapterProgress(ch, answers);
          const done = chapterDone(ch, answers);
          const started = p.answered + p.skipped > 0;
          return (
            <li key={ch.id}>
              <button
                type="button"
                onClick={() => onOpen(k)}
                className={cn(
                  "group flex w-full items-start gap-4 border-2 border-rw-black p-4 text-left transition-[transform,box-shadow]",
                  "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[var(--shadow-hard)]",
                  k === firstTodo ? "bg-rw-white shadow-[var(--shadow-hard-orange)]" : done ? "bg-rw-paper-subtle" : "bg-rw-white",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center border-2 border-rw-black text-lg font-extrabold",
                    done ? "bg-rw-black text-rw-white" : k === firstTodo ? "bg-rw-orange" : "bg-rw-white",
                  )}
                >
                  {done ? <Check className="size-5" /> : k + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold leading-tight">{ch.title}</span>
                    {ch.first && !done && <span className="rw-tag">D'abord</span>}
                  </span>
                  <span className="mt-1 block text-sm text-rw-muted">{ch.sub}</span>
                  <span className="mt-2 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-rw-tertiary">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" aria-hidden /> {ch.minutes} min
                    </span>
                    <span>
                      {done ? "Fait" : started ? `${p.answered + p.skipped} / ${p.total}` : `${p.total} questions`}
                    </span>
                  </span>
                </span>
                <ArrowRight className="mt-2 size-5 shrink-0 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden />
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 border-t-2 border-rw-black pt-6">
        <Button variant="rwDark" size="lg" onClick={onFinish} className="w-full sm:w-auto">
          {draft.finalAt ? "Je te renvoie tout" : "J'ai fini, je t'envoie tout"} <Send />
        </Button>
        <p className="mt-3 text-sm text-rw-muted">Même si t'as pas tout rempli : le reste, on en parle au téléphone.</p>
      </div>
    </Page>
  );
}

function SaveLine({ draft, sendState }: { draft: Draft; sendState: SendState }) {
  if (sendState === "sending")
    return (
      <p className="mt-3 inline-flex items-center gap-2 text-sm text-rw-muted">
        <Loader2 className="size-4 animate-spin" /> Envoi en cours…
      </p>
    );
  return (
    <p className="mt-3 text-sm text-rw-muted">
      {draft.sentAt
        ? `Bien reçu de mon côté : ${draft.sentAnswered} réponses, le ${hourFr(draft.sentAt)}.`
        : "Rien d'envoyé pour l'instant : ça part tout seul à la fin de chaque chapitre."}
    </p>
  );
}

function CardScreen({
  chapter,
  chapterIndex,
  cards,
  index,
  card,
  answers,
  onChange,
  onPicked,
  onNext,
  onSkip,
  onPrev,
  onMap,
}: {
  chapter: Chapter;
  chapterIndex: number;
  cards: Card[];
  index: number;
  card: Card;
  answers: Answers;
  onChange: (p: Partial<CardAnswer>) => void;
  onPicked: () => void;
  onNext: () => void;
  onSkip: () => void;
  onPrev: () => void;
  onMap: () => void;
}) {
  const x = answers[card.id] ?? {};
  const ready = isAnswered(card, x) || (card.kind === "multi" && !!card.preset && !x.values);
  const phrase = card.kind === "confirm" ? null : sitePhrase(card, x, answers);
  const [noteOpen, setNoteOpen] = useState(!!x.note);
  const withNote = card.kind !== "confirm" && card.kind !== "long";

  // Entrée = suivante (hors zone de texte).
  const nextRef = useRef(onNext);
  useEffect(() => {
    nextRef.current = onNext;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "Enter" || t?.tagName === "TEXTAREA" || t?.tagName === "BUTTON") return;
      if (ready) {
        e.preventDefault();
        nextRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready]);

  return (
    <>
      <div className="border-b-2 border-rw-line-subtle">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button type="button" onClick={onMap} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
            <ArrowLeft className="size-4" /> Sommaire
          </button>
          <span className="ml-auto truncate font-mono text-[11px] uppercase tracking-widest text-rw-muted">
            {chapterIndex + 1}. {chapter.title}
          </span>
        </div>
        <div className="mx-auto flex max-w-2xl gap-1 px-4 pb-3" aria-label={`Question ${index + 1} sur ${cards.length}`}>
          {cards.map((c, k) => (
            <span
              key={c.id}
              className={cn(
                "h-1.5 flex-1",
                k === index
                  ? "bg-rw-orange"
                  : isAnswered(c, answers[c.id])
                    ? "bg-rw-black"
                    : answers[c.id]?.skipped
                      ? "bg-rw-tertiary"
                      : "bg-rw-line-subtle",
              )}
            />
          ))}
        </div>
      </div>

      <Page className="pb-4 sm:pb-8">
        <p className="rw-eyebrow text-rw-muted">
          Question {index + 1} sur {cards.length}
        </p>
        {/* Casse normale : une question longue en capitales se lit mal. */}
        <h2 className="mt-3 text-2xl font-extrabold normal-case leading-tight tracking-tight sm:text-3xl">{card.label}</h2>
        {card.help && <p className="mt-3 text-[15px] leading-relaxed text-rw-muted">{card.help}</p>}

        <div className="mt-7">
          <CardInput card={card} value={x} onChange={onChange} onPicked={onPicked} />
        </div>

        {phrase && (
          <figure className="mt-6 border-l-4 border-rw-orange bg-rw-paper-subtle px-4 py-3">
            <figcaption className="rw-eyebrow text-rw-muted">Sur le site, ça donnera</figcaption>
            <blockquote className="mt-1.5 font-semibold leading-snug">« {phrase} »</blockquote>
          </figure>
        )}

        {withNote &&
          (noteOpen || x.note ? (
            <label className="mt-6 block">
              <span className="mb-1.5 block text-sm font-semibold">{card.notePh ?? "Un mot de plus"}</span>
              <textarea
                autoFocus={!x.note}
                rows={2}
                value={x.note ?? ""}
                onChange={(e) => onChange({ note: e.target.value })}
                className="w-full border-2 border-rw-black bg-rw-white px-3 py-2 text-base outline-none focus-visible:shadow-[var(--shadow-hard-orange)]"
              />
            </label>
          ) : (
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="mt-6 text-sm font-semibold text-rw-muted underline underline-offset-4 hover:text-rw-black"
            >
              + {card.notePh ?? "Un mot de plus ?"}
            </button>
          ))}
      </Page>

      {/* Au-dessus du bandeau cookies tant qu'il est affiché (hauteur publiée par ConsentBanner). */}
      <footer className="sticky border-t-2 border-rw-black bg-background" style={{ bottom: "var(--rw-consent-h, 0px)" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Button variant="rwOutline" size="icon" onClick={onPrev} aria-label="Question précédente">
            <ArrowLeft />
          </Button>
          <Button variant="ghost" onClick={onSkip} className="text-rw-muted">
            <SkipForward /> Je passe
          </Button>
          <Button variant="rw" onClick={onNext} disabled={!ready} className="ml-auto">
            {index + 1 < cards.length ? "Suivante" : "Fin du chapitre"} <ArrowRight />
          </Button>
        </div>
      </footer>
    </>
  );
}

function ChapterDone({
  chapter,
  index,
  answers,
  sendState,
  onRetry,
  next,
  chapters,
  onOpen,
  onMap,
  onEnd,
}: {
  chapter: Chapter;
  index: number;
  answers: Answers;
  sendState: SendState;
  onRetry: () => void;
  next: number;
  chapters: Chapter[];
  onOpen: (ch: number) => void;
  onMap: () => void;
  onEnd: () => void;
}) {
  const reduce = useReducedMotion();
  const p = chapterProgress(chapter, answers);
  const phrases = [
    ...new Set(
      visibleCards(chapter, answers)
        .filter((c) => isAnswered(c, answers[c.id]))
        .map((c) => sitePhrase(c, answers[c.id], answers))
        .filter((s): s is string => !!s),
    ),
  ];
  return (
    <Page>
      <motion.div
        initial={reduce ? false : { scale: 0.6, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 16 }}
        className="grid size-16 place-items-center border-2 border-rw-black bg-rw-orange shadow-[var(--shadow-hard)]"
      >
        <Check className="size-8" strokeWidth={3} />
      </motion.div>
      <p className="rw-eyebrow mt-6 text-rw-muted">Chapitre {index + 1} bouclé</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{chapter.title}</h1>
      <p className="mt-2 text-rw-muted">
        {p.answered} réponse{p.answered > 1 ? "s" : ""}
        {p.skipped ? ` · ${p.skipped} passée${p.skipped > 1 ? "s" : ""}, on en parlera au téléphone` : ""}
      </p>

      {phrases.length > 0 && (
        <section className="mt-8">
          <h2 className="rw-eyebrow">Ce que ça donne sur le site</h2>
          <ul className="mt-3 space-y-2">
            {phrases.map((s) => (
              <li key={s} className="border-l-4 border-rw-orange bg-rw-paper-subtle px-4 py-3 font-semibold leading-snug">
                « {s} »
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 text-sm">
        {sendState === "sending" && (
          <p className="inline-flex items-center gap-2 text-rw-muted">
            <Loader2 className="size-4 animate-spin" /> Envoi en cours…
          </p>
        )}
        {sendState === "ok" && (
          <p className="inline-flex items-center gap-2 font-semibold text-rw-success">
            <CircleCheck className="size-4" /> Bien reçu de mon côté, merci !
          </p>
        )}
        {sendState === "error" && (
          <div className="border-2 border-rw-danger p-3">
            <p className="font-semibold text-rw-danger">L'envoi n'a pas marché.</p>
            <p className="mt-1 text-rw-muted">Pas grave : tout est gardé ici, ça repartira à la fin du prochain chapitre.</p>
            <button type="button" onClick={onRetry} className="mt-2 font-semibold underline underline-offset-4">
              Réessayer
            </button>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {next >= 0 ? (
          <Button variant="rw" size="lg" onClick={() => onOpen(next)}>
            Chapitre {next + 1} : {chapters[next].title} <ArrowRight />
          </Button>
        ) : (
          <Button variant="rw" size="lg" onClick={onEnd}>
            J'ai tout vu, on termine <ArrowRight />
          </Button>
        )}
        <Button variant="rwOutline" size="lg" onClick={onMap}>
          Sommaire
        </Button>
      </div>
    </Page>
  );
}

function EndScreen({
  entry,
  draft,
  sendState,
  onMessage,
  onGoto,
  onMap,
  onSend,
}: {
  entry: ResolvedEntretien;
  draft: Draft;
  sendState: SendState;
  onMessage: (s: string) => void;
  onGoto: (ch: number, i: number) => void;
  onMap: () => void;
  onSend: () => void;
}) {
  const { content } = entry;
  const a = draft.answers;
  const t = totalProgress(content, a);
  const unseen = t.total - t.answered - t.skipped;
  const skipped = content.chapters.flatMap((ch, k) =>
    visibleCards(ch, a)
      .map((c, i) => ({ c, i, k }))
      .filter(({ c }) => !isAnswered(c, a[c.id]) && a[c.id]?.skipped),
  );
  return (
    <Page>
      <p className="rw-eyebrow text-rw-muted">Dernière étape</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">On envoie ?</h1>

      <dl className="mt-8 grid grid-cols-3 border-2 border-rw-black">
        {[
          ["Réponses", t.answered],
          ["Passées", t.skipped],
          ["Pas vues", unseen],
        ].map(([l, n], k) => (
          <div key={l} className={cn("p-4", k > 0 && "border-l-2 border-rw-black")}>
            <dt className="rw-eyebrow text-rw-muted">{l}</dt>
            <dd className="mt-1 text-3xl font-extrabold">{n}</dd>
          </div>
        ))}
      </dl>

      {skipped.length > 0 && (
        <section className="mt-8">
          <h2 className="rw-eyebrow">À voir au téléphone</h2>
          <ul className="mt-3 divide-y-2 divide-rw-line-subtle border-y-2 border-rw-line-subtle">
            {skipped.map(({ c, i, k }) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onGoto(k, i)}
                  className="flex w-full items-center gap-3 py-3 text-left text-[15px] hover:bg-rw-paper-subtle"
                >
                  <span className="flex-1">{c.label}</span>
                  <span className="shrink-0 text-sm font-semibold underline underline-offset-4">Répondre</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {unseen > 0 && (
        <p className="mt-6 text-[15px]">
          {unseen} question{unseen > 1 ? "s" : ""} pas encore vue{unseen > 1 ? "s" : ""}.{" "}
          <button type="button" onClick={onMap} className="font-semibold underline underline-offset-4">
            Retour au sommaire
          </button>
        </p>
      )}

      <label className="mt-8 block">
        <span className="mb-1.5 block font-semibold">Un petit mot ? (si tu veux)</span>
        <textarea
          rows={4}
          value={draft.message}
          onChange={(e) => onMessage(e.target.value)}
          placeholder="Un créneau pour s'appeler, un truc qui t'a fait tiquer…"
          className="w-full border-2 border-rw-black bg-rw-white px-3 py-3 text-base outline-none focus-visible:shadow-[var(--shadow-hard-orange)]"
        />
      </label>

      {sendState === "error" && (
        <p className="mt-4 border-2 border-rw-danger p-3 text-sm">
          <span className="font-semibold text-rw-danger">L'envoi n'a pas marché.</span>{" "}
          Pas grave, tout est gardé ici : réessaie dans un moment.
        </p>
      )}

      <div className="mt-8">
        <Button variant="rw" size="lg" onClick={onSend} disabled={sendState === "sending"} className="w-full sm:w-auto">
          {sendState === "sending" ? <Loader2 className="animate-spin" /> : <Send />} Envoyer
        </Button>
      </div>
    </Page>
  );
}

function Sent({ person, answered, skipped, onMap }: { person: string; answered: number; skipped: number; onMap: () => void }) {
  return (
    <Page className="flex flex-col justify-center">
      <div className="grid size-16 place-items-center border-2 border-rw-black bg-rw-orange shadow-[var(--shadow-hard)]">
        <Check className="size-8" strokeWidth={3} />
      </div>
      <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Merci {person}, j'ai tout reçu !</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-rw-muted">
        Tes {answered} réponses sont bien arrivées.
        {skipped > 0 ? ` Les ${skipped} que t'as passées, on se les fait au téléphone.` : ""}
      </p>
      <p className="mt-3 max-w-xl text-[15px] text-rw-muted">
        Si tu veux changer un truc, reviens sur le même téléphone (ou le même ordi) et renvoie, c'est tout.
      </p>
      <div className="mt-10">
        <Button variant="rwOutline" size="lg" onClick={onMap}>
          Revoir mes réponses
        </Button>
      </div>
    </Page>
  );
}
