import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Loader2,
  Mail,
  Pencil,
  Send,
  Star,
  Undo2,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CHOICES,
  CHOICE_BY_KEY,
  COMPOSITE_MAX,
  CRITERIA,
  MAX_COEURS,
  REELS,
  REELS_SCORED,
  REELS_TOSCORE,
  resolveReelsClient,
  salutation,
  statutMeta,
  type Reel,
  type ReelChoice,
  type ReelsClient,
} from "./data";
import { clearSession, loadSession, saveSession, type ReelsSession } from "./storage";
import { buildMailtoBody, buildRecapMarkdown, buildVoteLines, voteStats } from "./report";

const NICOLAS_EMAIL = "nicolas@rewolf.studio";

type Phase = "intro" | "vote" | "recap" | "done";

/* ═══════════════════════════ Page ═══════════════════════════ */

export default function ReelsVote() {
  const { slug = "invite" } = useParams();
  const [params] = useSearchParams();
  const client = useMemo(() => resolveReelsClient(slug, params), [slug, params]);

  const [session, setSession] = useState<ReelsSession>(() => loadSession(slug));
  const [phase, setPhase] = useState<Phase>(() => (loadSession(slug).sent ? "done" : "intro"));
  const [exitDir, setExitDir] = useState<ReelChoice>("tourne");

  // Persistance : toute évolution de la session est sauvegardée localement.
  useEffect(() => {
    saveSession(slug, session);
  }, [slug, session]);

  const patch = useCallback((p: Partial<ReelsSession>) => setSession((s) => ({ ...s, ...p })), []);

  const stats = voteStats(session);
  const firstUndecided = REELS.findIndex((r) => !session.votes[r.id]);

  const start = () => {
    if (firstUndecided === -1) {
      setPhase("recap");
      return;
    }
    const idx =
      session.index >= 0 && session.index < REELS.length && !session.votes[REELS[session.index].id]
        ? session.index
        : firstUndecided;
    patch({ index: idx });
    setPhase("vote");
  };

  // Vote fonctionnel : lit s.index à jour → sûr même en cas de votes très rapides
  // (clavier) où plusieurs touches tombent avant un re-render.
  const vote = (choice: ReelChoice) => {
    setExitDir(choice);
    setSession((s) => {
      const reel = REELS[s.index];
      if (!reel) return s;
      return {
        ...s,
        votes: { ...s.votes, [reel.id]: choice },
        index: Math.min(s.index + 1, REELS.length),
      };
    });
  };

  const toggleCoeurId = (coeurs: number[], id: number): number[] => {
    if (coeurs.includes(id)) return coeurs.filter((x) => x !== id);
    if (coeurs.length >= MAX_COEURS) return coeurs; // plafond : top prioritaire
    return [...coeurs, id];
  };

  /** Coup de cœur sur la carte courante (lecture fonctionnelle de l'index). */
  const toggleCurrentCoeur = () =>
    setSession((s) => {
      const reel = REELS[s.index];
      if (!reel) return s;
      return { ...s, coeurs: toggleCoeurId(s.coeurs, reel.id) };
    });

  /** Coup de cœur par id (récap, où l'index n'est pas en jeu). */
  const toggleCoeur = (id: number) =>
    setSession((s) => ({ ...s, coeurs: toggleCoeurId(s.coeurs, id) }));

  const undo = () =>
    setSession((s) => {
      const prev = Math.max(0, s.index - 1);
      const reel = REELS[prev];
      const nextVotes = { ...s.votes };
      if (reel) delete nextVotes[reel.id];
      return { ...s, index: prev, votes: nextVotes };
    });

  // Fin du deck → récap.
  useEffect(() => {
    if (phase === "vote" && session.index >= REELS.length) setPhase("recap");
  }, [phase, session.index]);

  const changeVote = (id: number, choice: ReelChoice) =>
    patch({ votes: { ...session.votes, [id]: choice } });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TopBar client={client} stats={stats} phase={phase} onRecap={() => setPhase("recap")} />

      {phase === "intro" && <Intro client={client} session={session} onStart={start} />}

      {phase === "vote" && session.index < REELS.length && (
        <VoteDeck
          reel={REELS[session.index]}
          index={session.index}
          exitDir={exitDir}
          coeur={session.coeurs.includes(REELS[session.index].id)}
          coeursLeft={MAX_COEURS - session.coeurs.length}
          stats={stats}
          onVote={vote}
          onToggleCoeur={toggleCurrentCoeur}
          onUndo={undo}
          onRecap={() => setPhase("recap")}
          canUndo={session.index > 0}
        />
      )}

      {phase === "recap" && (
        <Recap
          client={client}
          session={session}
          onChangeVote={changeVote}
          onToggleCoeur={toggleCoeur}
          onSetNote={(note) => patch({ note })}
          onResume={() => {
            if (firstUndecided !== -1) {
              patch({ index: firstUndecided });
              setPhase("vote");
            }
          }}
          onSent={() => {
            patch({ sent: true });
            setPhase("done");
          }}
        />
      )}

      {phase === "done" && (
        <Done
          client={client}
          session={session}
          onEdit={() => setPhase("recap")}
          onReset={() => {
            clearSession(slug);
            setSession(loadSession(slug));
            setPhase("intro");
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════ Top bar ═══════════════════════════ */

function TopBar({
  client,
  stats,
  phase,
  onRecap,
}: {
  client: ReelsClient;
  stats: ReturnType<typeof voteStats>;
  phase: Phase;
  onRecap: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b-2 border-rw-black bg-white px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <Wordmark className="h-4 text-rw-black sm:h-[18px]" />
        <span className="hidden h-4 w-px bg-rw-line-subtle sm:block" />
        <span className="hidden font-mono text-[11px] uppercase tracking-wider text-rw-muted sm:block">
          Sélection reels · {salutation(client.name)}
        </span>
      </div>
      {phase === "vote" ? (
        <button
          onClick={onRecap}
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-rw-muted transition-colors hover:text-rw-black"
        >
          <span className="tabular-nums text-rw-black">
            {stats.decided}/{stats.total}
          </span>
          <span className="hidden sm:inline">· voir le récap</span>
          <Pencil className="size-3.5" />
        </button>
      ) : (
        <span className="font-mono text-[11px] uppercase tracking-wider text-rw-tertiary">
          {stats.total} sujets
        </span>
      )}
    </header>
  );
}

/* ═══════════════════════════ Intro ═══════════════════════════ */

function Intro({
  client,
  session,
  onStart,
}: {
  client: ReelsClient;
  session: ReelsSession;
  onStart: () => void;
}) {
  const decided = Object.keys(session.votes).length;
  const hasDraft = decided > 0;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col justify-center px-6 py-12 sm:px-8">
      <p className="rw-eyebrow text-rw-orange">REWOLF × {salutation(client.name)} · Reels</p>
      <h1 className="mt-4 text-[clamp(2.1rem,6vw,3.9rem)] leading-[0.94]">
        <span className="text-rw-orange">{salutation(client.name)}</span>, à vous de choisir vos reels.
      </h1>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-rw-muted">
        On a présélectionné <b className="text-rw-black">{REELS.length} sujets</b> pour vos reels, notés selon
        cinq critères (demande, universalité, viralité, partage, business). À vous de trancher, à l'instinct :
        lesquels vous avez <b className="text-rw-black">hâte de tourner</b> ?
      </p>

      {/* Légende des choix */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {CHOICES.slice()
          .reverse()
          .map((c) => (
            <div key={c.key} className="flex items-center gap-3 border-2 border-rw-black bg-white p-3 shadow-[var(--shadow-hard-sm)]">
              <span className="text-2xl" aria-hidden>
                {c.emoji}
              </span>
              <span className="font-bold uppercase tracking-tight">{c.label}</span>
            </div>
          ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-[13px] text-rw-muted">
        <Star className="size-4 fill-rw-orange text-rw-orange" />
        Épinglez jusqu'à <b className="text-rw-black">{MAX_COEURS} coups de cœur</b> — vos priorités de tournage.
      </p>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-rw-muted">
        <span>≈ 5 MIN</span>
        <span>
          {REELS_SCORED} SCORÉS · {REELS_TOSCORE} À SCORER
        </span>
        <span>REPRISE AUTO</span>
      </div>

      <div className="mt-9">
        <Button variant="rw" size="lg" onClick={onStart}>
          {hasDraft ? `Reprendre (${decided}/${REELS.length})` : "Commencer à voter"}
          <ArrowRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Deck de vote ═══════════════════════════ */

const cardVariants = {
  enter: { opacity: 0, scale: 0.96, y: 16 },
  center: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 },
  exit: (dir: ReelChoice) =>
    dir === "tourne"
      ? { x: 360, y: -30, rotate: 12, opacity: 0 }
      : dir === "passe"
        ? { x: -360, y: -30, rotate: -12, opacity: 0 }
        : { y: 380, scale: 0.9, opacity: 0 },
};

function VoteDeck({
  reel,
  index,
  exitDir,
  coeur,
  coeursLeft,
  stats,
  onVote,
  onToggleCoeur,
  onUndo,
  onRecap,
  canUndo,
}: {
  reel: Reel;
  index: number;
  exitDir: ReelChoice;
  coeur: boolean;
  coeursLeft: number;
  stats: ReturnType<typeof voteStats>;
  onVote: (c: ReelChoice) => void;
  onToggleCoeur: () => void;
  onUndo: () => void;
  onRecap: () => void;
  canUndo: boolean;
}) {
  const reduce = useReducedMotion();

  // Raccourcis clavier : ← passe · → tourne · ↑/↓ à voir · c coup de cœur · ⌫ retour
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") onVote("passe");
      else if (e.key === "ArrowRight") onVote("tourne");
      else if (e.key === "ArrowUp" || e.key === "ArrowDown") onVote("voir");
      else if (e.key.toLowerCase() === "c") onToggleCoeur();
      else if (e.key === "Backspace" && canUndo) onUndo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onVote, onToggleCoeur, onUndo, canUndo]);

  const peek1 = REELS[index + 1];
  const peek2 = REELS[index + 2];

  return (
    <div className="mx-auto max-w-2xl px-5 pb-40 pt-6 sm:px-8">
      <ProgressBar stats={stats} index={index} />

      {/* Deck : carte active + 2 cartes en dessous pour l'effet de paquet */}
      <div className="relative mt-6">
        {peek2 && <PeekCard offset={2} />}
        {peek1 && <PeekCard offset={1} />}
        <AnimatePresence custom={exitDir} mode="popLayout" initial={false}>
          <motion.div
            key={reel.id}
            custom={exitDir}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduce ? { duration: 0 } : { duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative z-10"
          >
            <ReelCard reel={reel} index={index} coeur={coeur} coeursLeft={coeursLeft} onToggleCoeur={onToggleCoeur} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barre d'actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-rw-black bg-white/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <VoteButton choice="passe" onClick={() => onVote("passe")} />
            <VoteButton choice="voir" onClick={() => onVote("voir")} />
            <VoteButton choice="tourne" onClick={() => onVote("tourne")} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-rw-muted transition-colors hover:text-rw-black disabled:opacity-30"
            >
              <Undo2 className="size-3.5" /> Retour
            </button>
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-rw-tertiary sm:block">
              ← passe · ↑ à voir · → je tourne · C coup de cœur
            </span>
            <button
              onClick={onRecap}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-rw-muted transition-colors hover:text-rw-black"
            >
              Récap <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ stats, index }: { stats: ReturnType<typeof voteStats>; index: number }) {
  const pct = Math.round((index / REELS.length) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-rw-muted">
          Sujet {String(index + 1).padStart(2, "0")} <span className="text-rw-tertiary">/ {REELS.length}</span>
        </p>
        <div className="flex gap-3 font-mono text-[11px] tabular-nums text-rw-muted">
          <span>🔥 {stats.tourne}</span>
          <span>🤔 {stats.voir}</span>
          <span>✋ {stats.passe}</span>
          <span className="text-rw-orange">⭐ {stats.coeurs}</span>
        </div>
      </div>
      <div className="mt-2 h-2 border-2 border-rw-black">
        <div className="h-full bg-rw-orange transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Cartes fantômes derrière la carte active — effet de paquet. */
function PeekCard({ offset }: { offset: 1 | 2 }) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0 top-0 h-full border-2 border-rw-black bg-white"
      style={{
        transform: `translateY(${offset * 10}px) scale(${1 - offset * 0.03})`,
        zIndex: 10 - offset,
        opacity: 1 - offset * 0.35,
        boxShadow: "var(--shadow-hard-sm)",
      }}
    />
  );
}

function VoteButton({ choice, onClick }: { choice: ReelChoice; onClick: () => void }) {
  const c = CHOICE_BY_KEY[choice];
  const isPrimary = choice === "tourne";
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 border-2 border-rw-black py-2.5 font-bold uppercase tracking-tight shadow-[var(--shadow-hard-sm)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
        isPrimary ? "bg-rw-orange text-rw-black" : "bg-white text-rw-black",
      )}
    >
      <span className="text-xl leading-none" aria-hidden>
        {c.emoji}
      </span>
      <span className="text-[12px] sm:text-[13px]">{c.label}</span>
    </button>
  );
}

/* ═══════════════════════════ Carte sujet ═══════════════════════════ */

function ReelCard({
  reel,
  index,
  coeur,
  coeursLeft,
  onToggleCoeur,
}: {
  reel: Reel;
  index: number;
  coeur: boolean;
  coeursLeft: number;
  onToggleCoeur: () => void;
}) {
  const st = statutMeta(reel.statutKind);
  const coeurDisabled = !coeur && coeursLeft <= 0;

  return (
    <article className="border-2 border-rw-black bg-white shadow-[var(--shadow-hard)]">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 border-b-2 border-rw-black bg-rw-paper-subtle px-5 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rw-tag">{reel.pilier}</span>
          <span className="border-2 border-rw-black bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]">
            {reel.format === "actu" ? "Actu" : "Ressource"}
          </span>
          <span className={cn("border-2 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]", st.className)}>
            {st.label}
            {reel.statutNote ? ` · ${reel.statutNote}` : ""}
          </span>
        </div>
        <motion.button
          onClick={onToggleCoeur}
          disabled={coeurDisabled}
          whileTap={{ scale: 0.8 }}
          animate={coeur ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          aria-pressed={coeur}
          aria-label={coeur ? "Retirer des coups de cœur" : "Coup de cœur"}
          title={coeurDisabled ? `Maximum ${MAX_COEURS} coups de cœur` : "Coup de cœur"}
          className={cn(
            "grid size-9 shrink-0 place-items-center border-2 border-rw-black transition-colors disabled:opacity-30",
            coeur ? "bg-rw-orange" : "bg-white hover:bg-rw-paper-subtle",
          )}
        >
          <Star className={cn("size-4", coeur ? "fill-rw-black text-rw-black" : "text-rw-black")} />
        </motion.button>
      </div>

      {/* Corps */}
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-rw-tertiary">
          Sujet {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="mt-2 text-[clamp(1.5rem,4.4vw,2.15rem)] leading-[1.02]">{reel.sujet}</h2>

        <div className="mt-4 border-l-[3px] border-rw-orange bg-rw-paper-subtle px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rw-muted">Angle testé</span>
          <p className="text-[14px] font-medium text-rw-black">{reel.axe}</p>
        </div>

        {reel.scores ? (
          <ScorePanel reel={reel} />
        ) : (
          <div className="mt-5 border-2 border-dashed border-rw-tertiary bg-rw-paper-subtle px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rw-muted">Pas encore scoré</p>
            <p className="mt-1 text-[13.5px] text-rw-muted">
              Sujet en réserve, gardé pour un 2ᵉ tour. Votez à l'instinct — votre avis fait pencher la balance.
            </p>
          </div>
        )}

        {/* Pourquoi */}
        <div className="mt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rw-muted">Pourquoi ce sujet</p>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-rw-black">{reel.pourquoi}</p>
        </div>

        {/* Données clés */}
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rw-muted">Données clés</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {reel.donnees.map((d) => (
              <li key={d} className="border border-rw-line-subtle bg-white px-2 py-1 font-mono text-[11px] text-rw-muted">
                {d}
              </li>
            ))}
          </ul>
        </div>

        {reel.lien && (
          <p className="mt-4 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-rw-tertiary">
            Ressource liée · {reel.lien}
          </p>
        )}
      </div>
    </article>
  );
}

function ScorePanel({ reel }: { reel: Reel }) {
  const scores = reel.scores!;
  const pct = reel.composite !== null ? Math.round((reel.composite / COMPOSITE_MAX) * 100) : 0;
  return (
    <div className="mt-5 border-2 border-rw-black">
      {/* Composite */}
      <div className="flex items-center justify-between gap-4 border-b-2 border-rw-black bg-rw-black px-4 py-3 text-white">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">Score composite</p>
          <p className="mt-1 h-1.5 w-28 overflow-hidden border border-white/30">
            <span className="block h-full bg-rw-orange" style={{ width: `${pct}%` }} />
          </p>
        </div>
        <p className="flex items-baseline gap-1">
          <span className="text-[34px] font-extrabold leading-none tracking-tight text-rw-orange tabular-nums">
            {reel.composite}
          </span>
          <span className="font-mono text-[11px] text-white/60">/ {COMPOSITE_MAX}</span>
        </p>
      </div>
      {/* Critères */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-2">
        {CRITERIA.map((crit) => {
          const val = scores[crit.key];
          return (
            <div key={crit.key} className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] text-rw-muted">
                {crit.label} <span className="font-mono text-[10px] text-rw-tertiary">×{crit.weight}</span>
              </span>
              <span className="flex gap-0.5" aria-label={`${val} sur 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn("size-2.5 border border-rw-black", i < val ? "bg-rw-orange" : "bg-white")}
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════ Récap ═══════════════════════════ */

function Recap({
  client,
  session,
  onChangeVote,
  onToggleCoeur,
  onSetNote,
  onResume,
  onSent,
}: {
  client: ReelsClient;
  session: ReelsSession;
  onChangeVote: (id: number, c: ReelChoice) => void;
  onToggleCoeur: (id: number) => void;
  onSetNote: (n: string) => void;
  onResume: () => void;
  onSent: () => void;
}) {
  const stats = voteStats(session);
  const lines = buildVoteLines(session);
  const undecided = REELS.filter((r) => !session.votes[r.id]);
  const coeurSet = new Set(session.coeurs);

  const [status, setStatus] = useState<
    { k: "idle" } | { k: "sending" } | { k: "error"; msg: string }
  >({ k: "idle" });
  const [copied, setCopied] = useState(false);

  const coeurLines = lines.filter((l) => coeurSet.has(l.id));

  const submit = async () => {
    if (status.k === "sending") return;
    setStatus({ k: "sending" });
    const payload = {
      client: { slug: client.slug, name: client.name, title: client.title ?? null },
      votes: lines.map((l) => ({ id: l.id, sujet: l.sujet, choice: l.choice })),
      coeurs: session.coeurs,
      note: session.note,
      stats,
      recapMarkdown: buildRecapMarkdown(client, session),
      submittedAt: new Date().toISOString(),
    };
    try {
      const r = await fetch("/api/reels-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Erreur ${r.status}`);
      }
      onSent();
    } catch (e) {
      setStatus({ k: "error", msg: e instanceof Error ? e.message : "Envoi impossible" });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildRecapMarkdown(client, session));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const mailtoHref = `mailto:${NICOLAS_EMAIL}?subject=${encodeURIComponent(
    `Mes votes reels — ${salutation(client.name)}`,
  )}&body=${encodeURIComponent(buildMailtoBody(client, session))}`;

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-10 sm:px-8">
      <p className="rw-eyebrow text-rw-orange">Votre sélection</p>
      <h1 className="mt-3 text-[clamp(2rem,5.5vw,3.2rem)]">Relisez, ajustez, envoyez.</h1>
      <p className="mt-3 max-w-lg text-[15px] text-rw-muted">
        {stats.decided}/{stats.total} sujets tranchés. Vous pouvez encore changer chaque vote avant d'envoyer à
        Nicolas.
      </p>

      {/* Bilan */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile emoji="🔥" label="Je tourne" n={stats.tourne} highlight />
        <StatTile emoji="🤔" label="À voir" n={stats.voir} />
        <StatTile emoji="✋" label="Je passe" n={stats.passe} />
        <StatTile emoji="⭐" label="Coups de cœur" n={stats.coeurs} />
      </div>

      {/* Coups de cœur */}
      {coeurLines.length > 0 && (
        <div className="mt-8 border-2 border-rw-black bg-rw-orange/10 p-4 shadow-[var(--shadow-hard-sm)]">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-rw-black">
            <Star className="size-4 fill-rw-orange text-rw-orange" /> Coups de cœur — priorité tournage
          </p>
          <ul className="mt-3 space-y-1.5">
            {coeurLines.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-[14px] font-medium">
                <span aria-hidden>{CHOICE_BY_KEY[l.choice].emoji}</span>
                {l.sujet}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sujets tranchés — éditables */}
      {lines.length > 0 && (
        <div className="mt-8 space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-rw-muted">Tous vos votes</p>
          {lines.map((l) => {
            const reel = REELS.find((r) => r.id === l.id)!;
            const isCoeur = coeurSet.has(l.id);
            const coeurDisabled = !isCoeur && session.coeurs.length >= MAX_COEURS;
            return (
              <div key={l.id} className="border-2 border-rw-black bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-medium leading-snug">{reel.sujet}</p>
                  <button
                    onClick={() => onToggleCoeur(l.id)}
                    disabled={coeurDisabled}
                    aria-pressed={isCoeur}
                    aria-label="Coup de cœur"
                    className={cn(
                      "grid size-7 shrink-0 place-items-center border-2 border-rw-black transition-colors disabled:opacity-30",
                      isCoeur ? "bg-rw-orange" : "bg-white hover:bg-rw-paper-subtle",
                    )}
                  >
                    <Star className={cn("size-3.5", isCoeur ? "fill-rw-black text-rw-black" : "text-rw-black")} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {CHOICES.map((c) => {
                    const active = l.choice === c.key;
                    return (
                      <button
                        key={c.key}
                        onClick={() => onChangeVote(l.id, c.key)}
                        className={cn(
                          "border-2 border-rw-black py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
                          active
                            ? c.key === "tourne"
                              ? "bg-rw-orange text-rw-black"
                              : "bg-rw-black text-white"
                            : "bg-white text-rw-muted hover:bg-rw-paper-subtle",
                        )}
                      >
                        {c.emoji} {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Non tranchés */}
      {undecided.length > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3 border-2 border-dashed border-rw-tertiary bg-rw-paper-subtle p-4">
          <p className="text-[14px] text-rw-muted">
            <b className="text-rw-black">{undecided.length}</b> sujet{undecided.length > 1 ? "s" : ""} pas encore
            tranché{undecided.length > 1 ? "s" : ""}.
          </p>
          <Button variant="rwOutline" onClick={onResume}>
            Reprendre <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Mot pour Nicolas */}
      <label className="mt-8 block">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-rw-muted">
          Un mot pour Nicolas ? <span className="normal-case tracking-normal text-rw-tertiary">facultatif</span>
        </span>
        <textarea
          value={session.note}
          onChange={(e) => onSetNote(e.target.value)}
          rows={3}
          placeholder="Une idée d'angle, un sujet à ajouter, une contrainte de tournage…"
          className="mt-2 w-full resize-y border-2 border-rw-black bg-white px-3 py-2.5 text-[14px] outline-none transition-colors placeholder:text-rw-tertiary focus:border-rw-orange"
        />
      </label>

      {status.k === "error" && (
        <p className="mt-6 border-2 border-rw-danger bg-rw-danger/5 px-4 py-3 text-[13.5px] text-rw-danger">
          L'envoi automatique a échoué ({status.msg}). Pas de panique : vos votes restent sur cet appareil.
          Utilisez <b>« Copier le récap »</b> ou l'e-mail ci-dessous pour l'envoyer à Nicolas.
        </p>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="rw" size="lg" onClick={submit} disabled={status.k === "sending" || stats.decided === 0}>
          {status.k === "sending" ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          {status.k === "sending" ? "Envoi…" : "Envoyer à Nicolas"}
        </Button>
        <Button variant="rwOutline" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copié !" : "Copier le récap"}
        </Button>
        <Button variant="ghost" asChild>
          <a href={mailtoHref}>
            <Mail className="size-4" /> Par e-mail
          </a>
        </Button>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-rw-tertiary">
        Vos votes restent privés · envoyés uniquement à REWOLF
      </p>
    </div>
  );
}

function StatTile({ emoji, label, n, highlight }: { emoji: string; label: string; n: number; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "border-2 border-rw-black p-3 text-center",
        highlight ? "bg-rw-orange" : "bg-white",
      )}
    >
      <p className="text-2xl leading-none" aria-hidden>
        {emoji}
      </p>
      <p className="mt-1.5 text-2xl font-extrabold tabular-nums leading-none">{n}</p>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-rw-muted">{label}</p>
    </div>
  );
}

/* ═══════════════════════════ Fin ═══════════════════════════ */

function Done({
  client,
  session,
  onEdit,
  onReset,
}: {
  client: ReelsClient;
  session: ReelsSession;
  onEdit: () => void;
  onReset: () => void;
}) {
  const stats = voteStats(session);

  const download = () => {
    const md = buildRecapMarkdown(client, session);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `votes-reels-${client.slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center sm:py-28">
      <motion.div
        initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="mx-auto grid size-20 place-items-center border-2 border-rw-black bg-rw-orange shadow-[var(--shadow-hard)]"
      >
        <Check className="size-10 text-rw-black" strokeWidth={3} />
      </motion.div>
      <h1 className="mt-8 text-[clamp(2.2rem,6vw,3.4rem)]">
        Merci, <span className="text-rw-orange">{salutation(client.name)}</span>.
      </h1>
      <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-rw-muted">
        Vos votes sont partis chez Nicolas — <b className="text-rw-black">{stats.tourne} sujets à tourner</b>,{" "}
        {stats.coeurs} coup{stats.coeurs > 1 ? "s" : ""} de cœur en priorité. Il s'en sert pour bâtir le planning de
        tournage et revient vers vous très vite.
      </p>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button variant="rwOutline" onClick={download}>
          <Download className="size-4" /> Télécharger une copie
        </Button>
        <Button variant="ghost" onClick={onEdit}>
          <Pencil className="size-4" /> Modifier mes votes
        </Button>
      </div>

      <div className="mt-12 border-t border-rw-black/10 pt-8">
        <p className="rw-eyebrow text-rw-orange">Envie d'en ajouter un ?</p>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-rw-muted">
          Une idée de sujet qui n'est pas dans la liste ? Écrivez à Nicolas, on la score et on l'ajoute au prochain
          tour.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button variant="rwDark" asChild>
            <a href={`mailto:${NICOLAS_EMAIL}?subject=${encodeURIComponent(`Reels — ${salutation(client.name)}`)}`}>
              <Mail className="size-4" /> Écrire à Nicolas
            </a>
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Recommencer à zéro
          </Button>
        </div>
      </div>
    </div>
  );
}
