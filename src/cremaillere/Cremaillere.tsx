import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  Baby,
  BedDouble,
  CalendarPlus,
  Check,
  Copy,
  Ghost,
  HeartCrack,
  Loader2,
  MapPin,
  PartyPopper,
  Share2,
  Sofa,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/utils";
import {
  APERO,
  ASTRO_BY_SLUG,
  ASTRO_SIGNS,
  DATES,
  DESSERTS,
  DRINKS,
  ENTREES,
  PARTY_CONFIG,
  PLATS,
  VOTE_LIMITS,
  formatDateFr,
  type PartyOption,
  type VoteCategory,
} from "./data";
import { emptyPartyState, fetchPartyState, submitDecline, submitRsvp, type PartyState } from "./api";
import { loadSession, makeGuestId, saveSession, type PartySession } from "./storage";
import { fileToAvatar } from "./avatar";
import { downloadIcs, googleCalendarUrl } from "./ics";

const POLL_MS = 25_000;
const PAGE_URL = "https://onboarding.rewolf.studio/cremaillere";

/* ═══════════════════════ Primitives d'UI ═══════════════════════ */

function Marquee({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const run = Array(6).fill(text).join(" ");
  return (
    <div aria-hidden className={cn("overflow-hidden whitespace-nowrap border-y-2 border-rw-line bg-rw-orange py-2", className)}>
      <motion.div
        className="inline-block font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-rw-black"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
      >
        <span>{run}</span>
        <span>{run}</span>
      </motion.div>
    </div>
  );
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("border-t-2 border-rw-line", className)}>
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">{children}</div>
    </section>
  );
}

function Heading({ eyebrow, title, sub, live }: { eyebrow: string; title: string; sub?: string; live?: boolean }) {
  return (
    <Reveal>
      <div className="flex items-center gap-3">
        <p className="rw-eyebrow text-rw-orange">{eyebrow}</p>
        {live && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-rw-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rw-orange" aria-hidden />
            En direct
          </span>
        )}
      </div>
      <h2 className="mt-3 text-4xl sm:text-6xl">{title}</h2>
      {sub && <p className="mt-4 max-w-2xl text-base text-rw-muted sm:text-lg">{sub}</p>}
    </Reveal>
  );
}

/** Carte d'option votable : sélection + jauge des votes de tout le monde. */
function VoteCard({
  option,
  selected,
  count,
  maxCount,
  leader,
  atCap,
  onToggle,
}: {
  option: PartyOption;
  selected: boolean;
  count: number;
  maxCount: number;
  leader: boolean;
  atCap: boolean;
  onToggle: () => void;
}) {
  const blocked = atCap && !selected;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      disabled={blocked}
      className={cn(
        "group relative flex h-full w-full flex-col gap-2 border-2 border-rw-line p-4 text-left transition-transform",
        selected ? "bg-rw-orange text-rw-black rw-shadow" : "bg-rw-white hover:-translate-y-0.5 hover:rw-shadow-sm",
        blocked && "cursor-not-allowed opacity-40 hover:translate-y-0 hover:shadow-none",
      )}
    >
      {leader && count > 0 && (
        <span className="absolute -top-3 right-3 border-2 border-rw-line bg-rw-black px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-rw-white">
          En tête
        </span>
      )}
      <span className="flex items-start justify-between gap-2">
        <span className="font-semibold leading-tight">
          {option.emoji && <span className="mr-1.5">{option.emoji}</span>}
          {option.label}
          {option.note && (
            <span className={cn("block text-xs font-normal", selected ? "text-rw-black/70" : "text-rw-tertiary")}>
              ({option.note})
            </span>
          )}
        </span>
        <span className={cn("shrink-0 font-mono text-xs", selected ? "text-rw-black" : "text-rw-muted")}>
          {count} <span className="hidden sm:inline">voix</span>
        </span>
      </span>
      <span className={cn("h-1.5 w-full", selected ? "bg-rw-black/15" : "bg-rw-paper-subtle")} aria-hidden>
        <motion.span
          className={cn("block h-full", selected ? "bg-rw-black" : "bg-rw-orange")}
          initial={false}
          animate={{ width: `${maxCount > 0 ? Math.round((count / maxCount) * 100) : 0}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </span>
    </button>
  );
}

function VoteBoard({
  category,
  options,
  state,
  session,
  onToggle,
  columns = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  category: VoteCategory;
  options: PartyOption[];
  state: PartyState;
  session: PartySession;
  onToggle: (category: VoteCategory, slug: string) => void;
  columns?: string;
}) {
  const counts = state.votes[category] ?? {};
  const maxCount = Math.max(1, ...options.map((o) => counts[o.slug] || 0));
  const top = Math.max(0, ...options.map((o) => counts[o.slug] || 0));
  const picked = session.votes[category];
  const limit = VOTE_LIMITS[category];
  return (
    <div>
      <div className={cn("grid grid-cols-1 gap-4 pt-2", columns)}>
        {options.map((o, i) => (
          <Reveal key={o.slug} delay={Math.min(i * 0.04, 0.3)} className="h-full">
            <VoteCard
              option={o}
              selected={picked.includes(o.slug)}
              count={counts[o.slug] || 0}
              maxCount={maxCount}
              leader={top > 0 && (counts[o.slug] || 0) === top}
              atCap={picked.length >= limit}
              onToggle={() => onToggle(category, o.slug)}
            />
          </Reveal>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-rw-tertiary">
        {picked.length}/{limit} choix {picked.length >= limit ? "— plafond atteint, on avait dit un budget" : ""}
      </p>
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max, label }: { value: number; onChange: (v: number) => void; min?: number; max: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border-2 border-rw-line bg-rw-white">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-3 py-1.5 font-extrabold hover:bg-rw-paper-subtle"
          aria-label={`Moins de ${label}`}
        >
          −
        </button>
        <span className="min-w-10 border-x-2 border-rw-line px-2 py-1.5 text-center font-mono text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-3 py-1.5 font-extrabold hover:bg-rw-paper-subtle"
          aria-label={`Plus de ${label}`}
        >
          +
        </button>
      </div>
      <span className="text-sm text-rw-muted">{label}</span>
    </div>
  );
}

/** Lien sacré du +1 : copiable, partageable, sans sous-formulaire. */
function ShareLink({ par }: { par?: string }) {
  const [copied, setCopied] = useState(false);
  const url = par ? `${PAGE_URL}?par=${encodeURIComponent(par)}` : PAGE_URL;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bloqué : le lien reste sélectionnable à la main */
    }
  };
  const share = () => {
    void navigator.share?.({ title: "Crémaillère ✕ PACS", text: "Remplis ta fiche, c'est un ordre affectueux.", url });
  };
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <code className="flex-1 select-all truncate border-2 border-rw-line bg-rw-paper-subtle px-3 py-2.5 font-mono text-xs">
        {url}
      </code>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 border-2 border-rw-line bg-rw-white px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider hover:bg-rw-paper-subtle"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-rw-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié" : "Copier"}
        </button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={share}
            className="flex items-center gap-1.5 border-2 border-rw-line bg-rw-black px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-rw-white hover:bg-rw-orange hover:text-rw-black"
          >
            <Share2 className="h-3.5 w-3.5" /> Partager
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ Blocs de page ═══════════════════════ */

function VideoBlock() {
  const [missing, setMissing] = useState(false);
  const [muted, setMuted] = useState(true);
  return (
    <section className="border-t-2 border-rw-line bg-rw-black text-rw-white">
      {missing ? (
        <div className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center gap-5 px-5 py-20 text-center">
          <span className="text-6xl" aria-hidden>
            🎬
          </span>
          <h2 className="text-3xl text-rw-white sm:text-5xl">Ici, très bientôt : la vidéo officielle</h2>
          <p className="max-w-md text-rw-white/70">
            Tournée avec Élise, un budget de zéro euro et une ambition démesurée. En attendant, tout le reste est ouvert :
            descends.
          </p>
        </div>
      ) : (
        <div className="relative">
          <video
            src="/cremaillere/video.mp4"
            className="h-[85svh] w-full object-cover"
            autoPlay
            loop
            muted={muted}
            playsInline
            onError={() => setMissing(true)}
            aria-label="Vidéo d'annonce de la crémaillère"
          />
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="absolute bottom-5 right-5 flex items-center gap-2 border-2 border-rw-white bg-rw-black/80 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-rw-white backdrop-blur-sm hover:bg-rw-orange hover:text-rw-black"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {muted ? "Remettre le son" : "Couper"}
          </button>
        </div>
      )}
    </section>
  );
}

const DECLINE_STEPS = ["Je vous aime pas 💔", "Vraiment ?", "Il y aura du gratin."];

/* ═══════════════════════ Page ═══════════════════════ */

export default function Cremaillere() {
  const [params] = useSearchParams();
  const invitedBy = (params.get("par") || "").slice(0, 40);

  const [session, setSession] = useState<PartySession>(() => loadSession());
  const [state, setState] = useState<PartyState>(() => emptyPartyState());
  const [stateLoaded, setStateLoaded] = useState(false);
  const [participating, setParticipating] = useState(() => {
    const s = loadSession();
    return s.sent || s.firstName.trim() !== "";
  });
  const [declineStep, setDeclineStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Crémaillère ✕ PACS — vous êtes invités · Bègles";
  }, []);

  // Mémoire vive locale : la fiche survit aux refresh.
  useEffect(() => {
    saveSession(session);
  }, [session]);

  // État partagé : au chargement puis toutes les 25 s (votes « en temps réel »).
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      const s = await fetchPartyState();
      if (alive && s) {
        setState(s);
        setStateLoaded(true);
      }
    };
    void pull();
    const t = setInterval(pull, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const patch = useCallback((p: Partial<PartySession>) => setSession((s) => ({ ...s, ...p })), []);

  const toggleVote = useCallback((category: VoteCategory, slug: string) => {
    setSession((s) => {
      const current = s.votes[category];
      const next = current.includes(slug)
        ? current.filter((x) => x !== slug)
        : current.length < VOTE_LIMITS[category]
          ? [...current, slug]
          : current;
      return { ...s, votes: { ...s.votes, [category]: next } };
    });
  }, []);

  const participate = () => {
    setParticipating(true);
    setDeclineStep(0);
    patch({ declined: false });
    requestAnimationFrame(() => document.getElementById("fiche")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const decline = async () => {
    if (declineStep < DECLINE_STEPS.length - 1) {
      setDeclineStep((n) => n + 1);
      return;
    }
    patch({ declined: true });
    const res = await submitDecline();
    if (res.ok && res.state) setState(res.state);
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError("");
    setPhotoBusy(true);
    try {
      const avatar = await fileToAvatar(file);
      patch({ avatar });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Photo illisible.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!session.firstName.trim()) m.push("prénom");
    if (!session.lastName.trim()) m.push("nom");
    if (!session.astro) m.push("signe astro");
    if (!session.avatar) m.push("photo");
    if (session.votes.dates.length === 0) m.push("au moins une date");
    return m;
  }, [session]);

  const submit = async () => {
    if (missing.length || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    const id = session.id || makeGuestId(session.firstName);
    const res = await submitRsvp({
      kind: "rsvp",
      id,
      firstName: session.firstName.trim(),
      lastName: session.lastName.trim(),
      astro: session.astro,
      email: session.email.trim() || undefined,
      avatar: session.avatar || undefined,
      kids: session.kids,
      bring: session.bring,
      votes: session.votes,
      par: invitedBy || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error || "Envoi impossible — réessaie dans une minute.");
      return;
    }
    if (res.state) setState(res.state);
    patch({ id, sent: true, declined: false });
    setJustSent(true);
  };

  const leaderOf = useCallback(
    (category: VoteCategory, options: PartyOption[]): { option: PartyOption; count: number } | null => {
      const counts = state.votes[category] ?? {};
      let best: { option: PartyOption; count: number } | null = null;
      for (const o of options) {
        const c = counts[o.slug] || 0;
        if (c > 0 && (!best || c > best.count)) best = { option: o, count: c };
      }
      return best;
    },
    [state],
  );

  const topDate = leaderOf("dates", DATES);
  const confirmed = PARTY_CONFIG.confirmedDate;
  const showStickyBar = participating && !session.declined;

  return (
    <main className={cn("min-h-svh bg-background", showStickyBar && "pb-24")}>
      {/* ─────────── Hero ─────────── */}
      <Marquee text="Crémaillère ✕ PACS ✕ open gratin ✕ " />
      <header className="mx-auto max-w-5xl px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-24">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="rw-eyebrow text-rw-orange"
        >
          Invitation officielle — Bègles, France
        </motion.p>
        {invitedBy && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-4">
            <span className="rw-tag">Tu viens de la part de {invitedBy} — excellent choix</span>
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 text-5xl sm:text-7xl md:text-8xl"
        >
          On a des murs.
          <br />
          On a un <span className="text-rw-orange">PACS</span>.
          <br />
          Il ne manque que{" "}
          <span className="underline decoration-rw-orange decoration-[6px] underline-offset-8 sm:decoration-8">vous</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-8 max-w-xl text-lg text-rw-muted"
        >
          Une pendaison de crémaillère <em>et</em> une célébration de PACS, le même soir, au même endroit. Deux fêtes pour
          le prix d'une : on appelle ça de la gestion.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap gap-2"
        >
          <span className="rw-tag">2 fêtes = 1 soirée</span>
          <span className="rw-tag bg-rw-black text-rw-white">Kids friendly</span>
          <span className="rw-tag">Vote du menu en direct</span>
        </motion.div>
        <motion.a
          href="#rsvp"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-14 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-rw-muted hover:text-rw-orange"
        >
          <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden /> Descends, tout se décide en bas
        </motion.a>
      </header>

      {/* ─────────── Vidéo ─────────── */}
      <VideoBlock />

      {/* ─────────── Le choix ─────────── */}
      <Section id="rsvp">
        <Heading
          eyebrow="Étape 01 — le grand choix"
          title="Tu viens ou pas ?"
          sub="Il n'y a que deux réponses possibles. L'une des deux est la bonne."
        />
        <Reveal delay={0.1} className="mt-10 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={participate}
            className="group border-2 border-rw-line bg-rw-orange p-6 text-left rw-shadow transition-transform hover:-translate-y-1"
          >
            <PartyPopper className="h-8 w-8" aria-hidden />
            <span className="mt-3 block text-2xl font-extrabold uppercase leading-none sm:text-3xl">
              Je veux participer
            </span>
            <span className="mt-2 block text-sm text-rw-black/70">La bonne réponse. Fiche, votes, gloire.</span>
          </button>
          {session.declined ? (
            <div className="border-2 border-rw-line bg-rw-black p-6 text-rw-white">
              <HeartCrack className="h-8 w-8 text-rw-orange" aria-hidden />
              <span className="mt-3 block text-2xl font-extrabold uppercase leading-none sm:text-3xl">C'est noté. 💔</span>
              <span className="mt-2 block text-sm text-rw-white/70">
                Tu rejoins les {Math.max(state.declineCount, 1)} sans-cœur anonymes. La porte reste ouverte, le gratin
                aussi.
              </span>
              <button
                type="button"
                onClick={participate}
                className="mt-4 border-2 border-rw-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider hover:bg-rw-orange hover:text-rw-black hover:border-rw-orange"
              >
                Bon, d'accord, je viens
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={decline}
              className="group border-2 border-rw-line bg-rw-white p-6 text-left transition-transform hover:-translate-y-1 hover:rw-shadow-sm"
            >
              <Ghost className="h-8 w-8 text-rw-muted" aria-hidden />
              <span className="mt-3 block text-2xl font-extrabold uppercase leading-none text-rw-muted sm:text-3xl">
                {DECLINE_STEPS[declineStep]}
              </span>
              <span className="mt-2 block text-sm text-rw-tertiary">
                {declineStep === 0 ? "Bouton déconseillé par 9 dentistes sur 10." : "Dernier avertissement affectueux."}
              </span>
            </button>
          )}
        </Reveal>

        {/* Le mur des invités */}
        <div className="mt-16">
          <Heading
            eyebrow="Le mur"
            title="Ils ont dit oui"
            sub={
              state.guests.length
                ? `${state.guests.length} invité·e·s au compteur${state.kidsTotal ? `, ${state.kidsTotal} mini-humain(s) inclus` : ""}. ${
                    state.declineCount ? `Et ${state.declineCount} clic(s) sur « je vous aime pas » — on ne juge pas. (Si.)` : ""
                  }`
                : "Personne pour l'instant. Sois la première miniature du mur, la postérité t'attend."
            }
            live
          />
          {state.guests.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-4">
              {state.guests.map((g, i) => (
                <Reveal key={g.id} delay={Math.min(i * 0.03, 0.4)}>
                  <figure className="w-20 text-center">
                    {g.avatar ? (
                      <img
                        src={g.avatar}
                        alt={`Photo de ${g.firstName}`}
                        className="h-20 w-20 border-2 border-rw-line object-cover rw-shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-20 w-20 items-center justify-center border-2 border-rw-line bg-rw-paper-subtle text-2xl">
                        {ASTRO_BY_SLUG[g.astro]?.emoji ?? "🙂"}
                      </span>
                    )}
                    <figcaption className="mt-1.5 truncate font-mono text-[11px] uppercase tracking-wider">
                      {g.firstName} {ASTRO_BY_SLUG[g.astro]?.emoji}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ─────────── Sections réservées aux partants ─────────── */}
      <AnimatePresence>
        {participating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            {/* Ta fiche */}
            <Section id="fiche" className="bg-rw-paper-subtle">
              <Heading
                eyebrow="Étape 02 — ta fiche"
                title="Décline ton identité"
                sub="Le strict nécessaire : qui tu es, ton signe (on fait le plan de table à l'ascendant) et une photo qui deviendra ta miniature officielle sur le mur."
              />
              <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
                {/* Photo */}
                <Reveal>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => void onPhoto(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      "relative flex h-52 w-52 flex-col items-center justify-center gap-2 border-2 border-rw-line text-center",
                      session.avatar ? "p-0" : "border-dashed bg-rw-white hover:bg-rw-paper-subtle",
                    )}
                  >
                    {session.avatar ? (
                      <>
                        <img src={session.avatar} alt="Ta future miniature" className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-rw-black/80 py-1.5 font-mono text-[10px] uppercase tracking-wider text-rw-white">
                          Changer la photo
                        </span>
                      </>
                    ) : (
                      <>
                        {photoBusy ? <Loader2 className="h-6 w-6 animate-spin" /> : <span className="text-3xl">📸</span>}
                        <span className="px-4 font-mono text-[11px] uppercase tracking-wider text-rw-muted">
                          Ta plus belle photo*
                          <br />
                          (clic ici)
                        </span>
                      </>
                    )}
                  </button>
                  {photoError && <p className="mt-2 max-w-52 text-xs text-rw-danger">{photoError}</p>}
                  <p className="mt-2 max-w-52 text-xs text-rw-tertiary">
                    Recadrée en carré, compressée, immortalisée. Choisis bien.
                  </p>
                </Reveal>

                {/* Champs */}
                <div className="grid gap-5">
                  <Reveal className="grid gap-5 sm:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="rw-eyebrow">Ton prénom*</span>
                      <input
                        value={session.firstName}
                        onChange={(e) => patch({ firstName: e.target.value })}
                        placeholder="Jean-Michel"
                        className="border-2 border-rw-line bg-rw-white px-3 py-2.5 outline-none focus-visible:border-rw-orange"
                        autoComplete="given-name"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="rw-eyebrow">Ton nom*</span>
                      <input
                        value={session.lastName}
                        onChange={(e) => patch({ lastName: e.target.value })}
                        placeholder="Dugratin"
                        className="border-2 border-rw-line bg-rw-white px-3 py-2.5 outline-none focus-visible:border-rw-orange"
                        autoComplete="family-name"
                      />
                      <span className="text-xs text-rw-tertiary">Reste entre nous — jamais affiché sur le mur.</span>
                    </label>
                  </Reveal>
                  <Reveal>
                    <span className="rw-eyebrow">Ton signe astro*</span>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                      {ASTRO_SIGNS.map((s) => (
                        <button
                          key={s.slug}
                          type="button"
                          aria-pressed={session.astro === s.slug}
                          onClick={() => patch({ astro: s.slug })}
                          className={cn(
                            "border-2 border-rw-line px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide",
                            session.astro === s.slug ? "bg-rw-orange rw-shadow-sm" : "bg-rw-white hover:bg-rw-paper-subtle",
                          )}
                        >
                          <span className="block text-lg">{s.emoji}</span>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </Reveal>
                  <Reveal className="grid gap-5 sm:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="rw-eyebrow">Ton mail (optionnel)</span>
                      <input
                        type="email"
                        value={session.email}
                        onChange={(e) => patch({ email: e.target.value })}
                        placeholder="toi@quelquepart.fr"
                        className="border-2 border-rw-line bg-rw-white px-3 py-2.5 outline-none focus-visible:border-rw-orange"
                        autoComplete="email"
                      />
                      <span className="text-xs text-rw-tertiary">
                        Uniquement pour t'envoyer le verdict du {PARTY_CONFIG.decisionDateLabel}. Zéro newsletter, promis.
                      </span>
                    </label>
                    <div className="grid content-start gap-1.5">
                      <span className="rw-eyebrow">Mini-humains</span>
                      <Stepper value={session.kids} onChange={(v) => patch({ kids: v })} max={6} label="enfant(s) avec toi" />
                      <span className="text-xs text-rw-tertiary">
                        <Baby className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                        Kids friendly : deux chambres à l'étage pour les siestes et les couchages.
                      </span>
                    </div>
                  </Reveal>
                  <Reveal className="border-2 border-rw-line bg-rw-white p-5">
                    <p className="font-extrabold uppercase">Tu viens accompagné·e ? +1, +2 ?</p>
                    <p className="mt-1.5 text-sm text-rw-muted">
                      Pas de +1 fantôme ici : <strong>chaque humain remplit sa propre fiche</strong> (et vote pour ses
                      propres boissons, on n'est pas des animaux). Envoie-lui ce lien sacré :
                    </p>
                    <div className="mt-4">
                      <ShareLink par={session.firstName.trim() || undefined} />
                    </div>
                  </Reveal>
                </div>
              </div>
            </Section>

            {/* La date */}
            <Section id="dates">
              <Heading
                eyebrow="Étape 03 — le sondage"
                title="Quand ?"
                sub="Coche tous les samedis où tu es libre. La date qui récolte le plus de voix devient LA date — verdict en direct ci-dessous."
                live
              />
              {topDate && (
                <Reveal>
                  <p className="mt-6 inline-block border-2 border-rw-line bg-rw-black px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-rw-white">
                    🏆 En tête : {formatDateFr(topDate.option.slug)} — {topDate.count} voix
                  </p>
                </Reveal>
              )}
              <div className="mt-8">
                <VoteBoard category="dates" options={DATES} state={state} session={session} onToggle={toggleVote} />
              </div>
            </Section>

            {/* Le bar */}
            <Section id="bar" className="bg-rw-paper-subtle">
              <Heading
                eyebrow="Étape 04 — le bar"
                title="Qu'est-ce qu'on te sert ?"
                sub="Neuf options, trois choix max par tête. C'est un budget, pas un open bar. Ton +1 vote depuis sa propre fiche, on a dit."
                live
              />
              <div className="mt-8">
                <VoteBoard category="drinks" options={DRINKS} state={state} session={session} onToggle={toggleVote} />
              </div>
            </Section>

            {/* Le menu */}
            <Section id="menu">
              <Heading
                eyebrow="Étape 05 — le menu"
                title="On mange quoi ?"
                sub="Le peuple décide de tout, l'exécutif cuisine. Les plafonds sont non négociables."
                live
              />
              <div className="mt-10 grid gap-12">
                {(
                  [
                    ["Apéro dinatoire", "2 choix max", "apero", APERO],
                    ["Entrées", "3 choix max", "entrees", ENTREES],
                    ["Plats", "3 choix max", "plats", PLATS],
                    ["Desserts", "3 choix max", "desserts", DESSERTS],
                  ] as const
                ).map(([title, cap, category, options]) => (
                  <div key={category}>
                    <Reveal className="flex items-baseline gap-3">
                      <h3 className="text-2xl sm:text-3xl">{title}</h3>
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-rw-tertiary">{cap}</span>
                    </Reveal>
                    <div className="mt-4">
                      <VoteBoard category={category} options={options} state={state} session={session} onToggle={toggleVote} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* La collecte */}
            <Section id="collecte" className="bg-rw-black text-rw-white">
              <Heading
                eyebrow="Étape 06 — la collecte"
                title="Prête-nous de quoi vous asseoir"
                sub="On a une maison, un PACS et de l'ambition. On n'a PAS assez de chaises. Toute contribution siège-compatible sera célébrée publiquement."
              />
              <div className="mt-10 grid gap-8 lg:grid-cols-2">
                <Reveal className="grid content-start gap-5 border-2 border-rw-white/20 p-6">
                  <p className="rw-eyebrow text-rw-orange">Ce que tu peux amener</p>
                  <Stepper value={session.bring.chaises} onChange={(v) => patch({ bring: { ...session.bring, chaises: v } })} max={20} label="chaise(s)" />
                  <Stepper
                    value={session.bring.tableBasse}
                    onChange={(v) => patch({ bring: { ...session.bring, tableBasse: v } })}
                    max={5}
                    label="table(s) basse(s)"
                  />
                  <label className="grid gap-1.5">
                    <span className="text-sm text-rw-white/70">Autre chose ? (plaid, enceinte, tabouret de compétition…)</span>
                    <input
                      value={session.bring.autre}
                      onChange={(e) => patch({ bring: { ...session.bring, autre: e.target.value.slice(0, 200) } })}
                      placeholder="Une guirlande qui clignote"
                      className="border-2 border-rw-white/30 bg-transparent px-3 py-2.5 text-rw-white outline-none placeholder:text-rw-white/30 focus-visible:border-rw-orange"
                    />
                  </label>
                </Reveal>
                <Reveal delay={0.1} className="grid content-start gap-4 border-2 border-rw-orange p-6">
                  <p className="rw-eyebrow text-rw-orange">Déjà promis par la communauté</p>
                  <p className="flex items-center gap-3 text-3xl font-extrabold uppercase">
                    <Sofa className="h-8 w-8 text-rw-orange" aria-hidden />
                    {state.bring.chaises} chaise{state.bring.chaises > 1 ? "s" : ""} · {state.bring.tableBasse} table
                    {state.bring.tableBasse > 1 ? "s" : ""} basse{state.bring.tableBasse > 1 ? "s" : ""}
                  </p>
                  {state.bring.autres.length > 0 && (
                    <ul className="grid gap-1 text-sm text-rw-white/70">
                      {state.bring.autres.slice(0, 8).map((a) => (
                        <li key={a}>— {a}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-sm text-rw-white/50">
                    Objectif : que personne ne mange son gratin debout. On y croit.
                  </p>
                </Reveal>
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── Infos pratiques ─────────── */}
      <Section id="infos">
        <Heading eyebrow="Les infos" title="Ce qu'il faut savoir" />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {(
            [
              [
                <Baby key="i" className="h-6 w-6" aria-hidden />,
                "Kids friendly",
                "Les enfants sont les bienvenus. Deux chambres à l'étage : siestes, couchages, replis stratégiques.",
              ],
              [
                <MapPin key="i" className="h-6 w-6" aria-hidden />,
                "Où ça ?",
                confirmed
                  ? `${PARTY_CONFIG.address.street}, ${PARTY_CONFIG.address.city}. C'est officiel, tu peux programmer le GPS.`
                  : PARTY_CONFIG.address.teaser,
              ],
              [
                <BedDouble key="i" className="h-6 w-6" aria-hidden />,
                "Dress code",
                "Viens comme tu es. Sauf le 31 octobre, où un déguisement serait fortement considéré. 🎃",
              ],
            ] as const
          ).map(([icon, title, body], i) => (
            <Reveal key={title} delay={i * 0.08} className="border-2 border-rw-line bg-rw-white p-6 rw-shadow-sm">
              <span className="text-rw-orange">{icon}</span>
              <h3 className="mt-3 text-xl">{title}</h3>
              <p className="mt-2 text-sm text-rw-muted">{body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ─────────── Le verdict ─────────── */}
      <Section id="verdict" className={cn(confirmed ? "bg-rw-orange" : "bg-rw-paper-subtle")}>
        {confirmed ? (
          <div>
            <Heading eyebrow="Le verdict" title="C'est officiel." />
            <Reveal delay={0.1}>
              <p className="mt-6 text-3xl font-extrabold uppercase sm:text-5xl">{formatDateFr(confirmed)}</p>
              <p className="mt-3 text-lg">
                {PARTY_CONFIG.startTime} — jusqu'à ce que le voisinage capitule · {PARTY_CONFIG.address.street},{" "}
                {PARTY_CONFIG.address.city}
              </p>
              {topDate && state.guests.length > 0 && (
                <p className="mt-2 text-sm text-rw-black/70">
                  {state.guests.length} invité·e·s, un menu voté démocratiquement, zéro chaise achetée.
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={googleCalendarUrl(confirmed)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-2 border-2 border-rw-line bg-rw-black px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-rw-white hover:bg-rw-white hover:text-rw-black"
                >
                  <CalendarPlus className="h-4 w-4" /> Google Agenda
                </a>
                <button
                  type="button"
                  onClick={() => downloadIcs(confirmed)}
                  className="flex items-center gap-2 border-2 border-rw-line bg-rw-white px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider hover:bg-rw-black hover:text-rw-white"
                >
                  <CalendarPlus className="h-4 w-4" /> Fichier .ics (Apple & co)
                </button>
              </div>
            </Reveal>
          </div>
        ) : (
          <div>
            <Heading
              eyebrow="Le verdict"
              title={`Rendez-vous le ${PARTY_CONFIG.decisionDateLabel}`}
              sub="Le jour où tout se verrouille. Voilà comment ça se passe :"
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["01", "Tu votes", "Dates, boissons, menu, mobilier : tout ce que tu viens de faire plus haut."],
                  [
                    "02",
                    `Le ${PARTY_CONFIG.decisionDateLabel}, on verrouille`,
                    "La date gagnante devient officielle. Démocratie totale, sauf en cas d'égalité — là, c'est nous.",
                  ],
                  [
                    "03",
                    "Tout le monde est prévenu",
                    "Cette page passe en mode « c'est officiel » : date, invités, menu gagnant, adresse exacte — et le fichier calendrier (Google Agenda / iCal) qui va bien. Par mail aussi, si tu l'as laissé.",
                  ],
                ] as const
              ).map(([num, title, body], i) => (
                <Reveal key={num} delay={i * 0.08} className="border-2 border-rw-line bg-rw-white p-6">
                  <span className="font-mono text-xs font-semibold text-rw-orange">{num}</span>
                  <h3 className="mt-2 text-lg leading-tight">{title}</h3>
                  <p className="mt-2 text-sm text-rw-muted">{body}</p>
                </Reveal>
              ))}
            </div>
            {topDate && (
              <Reveal delay={0.2}>
                <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-rw-muted">
                  Tendance actuelle : {formatDateFr(topDate.option.slug)} ({topDate.count} voix). Rien n'est joué.
                </p>
              </Reveal>
            )}
          </div>
        )}
      </Section>

      {/* ─────────── Footer ─────────── */}
      <footer className="border-t-2 border-rw-line bg-rw-black px-5 py-10 text-rw-white">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rw-white/60">
            Fait avec amour, React et un budget chaises inexistant
            {stateLoaded ? "" : " · connexion aux votes en cours…"}
          </p>
          <a
            href="https://rewolf.studio"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 text-rw-white/60 transition-colors hover:text-rw-orange"
            aria-label="REWOLF Studio"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Propulsé par</span>
            <Wordmark className="h-4" />
          </a>
        </div>
      </footer>

      {/* ─────────── Barre d'envoi collante ─────────── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-rw-line bg-rw-white"
          >
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
              <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-rw-muted">
                {submitError ? (
                  <span className="text-rw-danger">{submitError}</span>
                ) : session.sent && missing.length === 0 ? (
                  "Fiche envoyée ✅ — modifie et renvoie quand tu veux"
                ) : missing.length ? (
                  `Il manque : ${missing.join(", ")}`
                ) : (
                  "Tout est bon. Appuie."
                )}
              </p>
              <button
                type="button"
                onClick={submit}
                disabled={submitting || missing.length > 0}
                className={cn(
                  "shrink-0 border-2 border-rw-line px-5 py-3 font-extrabold uppercase tracking-wide transition-colors",
                  missing.length === 0 && !submitting
                    ? "bg-rw-orange text-rw-black rw-shadow-sm hover:bg-rw-orange-ink"
                    : "bg-rw-paper-subtle text-rw-tertiary",
                )}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Envoi…
                  </span>
                ) : session.sent ? (
                  "Mettre à jour ma fiche"
                ) : (
                  "Envoyer ma fiche 🚀"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── Confirmation d'envoi ─────────── */}
      <AnimatePresence>
        {justSent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-rw-black/70 p-5"
            onClick={() => setJustSent(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 24 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="w-full max-w-md border-2 border-rw-line bg-rw-white p-8 rw-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-5xl" aria-hidden>
                🎉
              </span>
              <h3 className="mt-4 text-3xl">C'est dans la boîte, {session.firstName.trim() || "toi"} !</h3>
              <p className="mt-3 text-sm text-rw-muted">
                Ta miniature est sur le mur, tes votes comptent déjà. Prochaine étape : le verdict du{" "}
                {PARTY_CONFIG.decisionDateLabel}. En attendant, propage l'invitation :
              </p>
              <div className="mt-5">
                <ShareLink par={session.firstName.trim() || undefined} />
              </div>
              <button
                type="button"
                onClick={() => setJustSent(false)}
                className="mt-6 w-full border-2 border-rw-line bg-rw-black py-3 font-extrabold uppercase text-rw-white hover:bg-rw-orange hover:text-rw-black"
              >
                Retourner voter
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
