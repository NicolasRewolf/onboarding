import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Eraser, Loader2, Pencil, Users } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type DayCell,
  type DispoEvent,
  type Member,
  PART_LABEL,
  PART_SHORT,
  type Part,
  allSlots,
  buildMonths,
  formatSlot,
  resolveEvent,
  slotId,
  slugifyName,
} from "./event";
import { MonthView } from "./components/MonthView";
import { fetchMyDispos, submitDispos } from "./api";

type Picked = { id: string; name: string; role?: string };

export default function DispoParticipant() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const event = useMemo(() => resolveEvent(slug, params), [slug, params]);

  if (!event) return <UnknownEvent />;

  return <Participant key={event.slug} event={event} />;
}

function Participant({ event: ev }: { event: DispoEvent }) {
  const months = useMemo(() => buildMonths(ev.start, ev.end), [ev.start, ev.end]);

  const [picked, setPicked] = useState<Picked | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [loadingMine, setLoadingMine] = useState(false);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "done"; responded?: number } | { kind: "error"; message: string }
  >({ kind: "idle" });

  // Peinture au glisser : true = on ajoute, false = on retire (déterminé par la 1re case).
  const paintRef = useRef<boolean | null>(null);
  useEffect(() => {
    const stop = () => (paintRef.current = null);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  const applyPaint = useCallback((id: string, add: boolean) => {
    setSelected((prev) => {
      if (add === prev.has(id)) return prev;
      const next = new Set(prev);
      if (add) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const onSlotDown = useCallback(
    (e: React.PointerEvent, id: string, on: boolean) => {
      if (e.pointerType === "mouse") {
        if (e.button !== 0) return;
        // Souris : on démarre une peinture au glisser (empêche la sélection de texte).
        e.preventDefault();
        paintRef.current = !on;
        applyPaint(id, !on);
      } else {
        // Tactile / stylet : simple bascule, on laisse le défilement natif de la page.
        applyPaint(id, !on);
      }
    },
    [applyPaint],
  );

  const onSlotEnter = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (paintRef.current === null) return;
      if (e.buttons !== 1) {
        paintRef.current = null;
        return;
      }
      applyPaint(id, paintRef.current);
    },
    [applyPaint],
  );

  const toggleDay = useCallback((date: string) => {
    const am = slotId(date, "am");
    const pm = slotId(date, "pm");
    setSelected((prev) => {
      const next = new Set(prev);
      const both = next.has(am) && next.has(pm);
      if (both) {
        next.delete(am);
        next.delete(pm);
      } else {
        next.add(am);
        next.add(pm);
      }
      return next;
    });
  }, []);

  const fillWeekdays = useCallback(() => {
    const wd = allSlots(ev.start, ev.end, true);
    setSelected((prev) => new Set([...prev, ...wd]));
  }, [ev.start, ev.end]);

  const clearAll = useCallback(() => setSelected(new Set()), []);

  // Choix d'un membre : on pré-charge sa réponse existante (édition à la ré-ouverture).
  async function choose(p: Picked) {
    setPicked(p);
    setStatus({ kind: "idle" });
    setLoadingMine(true);
    const mine = await fetchMyDispos(ev.slug, p.id);
    if (mine) {
      setSelected(new Set(mine.slots));
      setNote(mine.note || "");
    } else {
      setSelected(new Set());
      setNote("");
    }
    setLoadingMine(false);
  }

  async function send() {
    if (!picked || status.kind === "sending") return;
    setStatus({ kind: "sending" });
    const res = await submitDispos({
      event: ev.slug,
      personId: picked.id,
      person: picked.name,
      role: picked.role,
      slots: [...selected].sort(),
      note: note.trim() || undefined,
      expectedTotal: ev.members.length,
    });
    if (res.ok) setStatus({ kind: "done", responded: res.responded });
    else setStatus({ kind: "error", message: res.error || "Envoi impossible" });
  }

  return (
    <div className="min-h-dvh bg-rw-white text-rw-black">
      <TopBar title={ev.title} />

      {!picked ? (
        <WhoStep event={ev} onPick={choose} />
      ) : status.kind === "done" ? (
        <DoneStep
          name={picked.name}
          count={selected.size}
          responded={status.responded}
          total={ev.members.length}
          onEdit={() => setStatus({ kind: "idle" })}
          onSwitch={() => setPicked(null)}
        />
      ) : (
        <GridStep
          months={months}
          picked={picked}
          selected={selected}
          note={note}
          setNote={setNote}
          loadingMine={loadingMine}
          status={status}
          onSlotDown={onSlotDown}
          onSlotEnter={onSlotEnter}
          toggleDay={toggleDay}
          fillWeekdays={fillWeekdays}
          clearAll={clearAll}
          onBack={() => setPicked(null)}
          onSend={send}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── En-tête ─────────────────────────── */

function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-rw-black bg-rw-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Wordmark className="h-4 text-rw-black sm:h-[18px]" />
          <span className="hidden h-4 w-px bg-rw-line-subtle sm:block" />
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-rw-muted sm:block">
            Dispos shooting
          </span>
        </div>
        <span className="max-w-[60%] truncate font-mono text-[11px] uppercase tracking-wider text-rw-tertiary">
          {title}
        </span>
      </div>
    </header>
  );
}

/* ─────────────────────────── Étape 1 : qui es-tu ? ─────────────────────────── */

function WhoStep({ event, onPick }: { event: DispoEvent; onPick: (p: Picked) => void }) {
  const [guest, setGuest] = useState("");
  const [showGuest, setShowGuest] = useState(false);

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="rw-eyebrow text-rw-orange">{event.subtitle}</p>
      <h1 className="mt-4 text-[clamp(2rem,5.5vw,3.4rem)] leading-[0.95]">
        Je <span className="text-rw-orange">suis</span>…
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-rw-muted">{event.intro}</p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {event.members.map((m: Member) => (
          <button
            key={m.id}
            onClick={() => onPick({ id: m.id, name: m.name, role: m.role })}
            className="group flex items-center justify-between gap-3 border-2 border-rw-black bg-rw-white px-4 py-3.5 text-left shadow-[var(--shadow-hard-sm)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-hard)]"
          >
            <span className="min-w-0">
              <span className="block truncate font-bold uppercase tracking-tight">{m.name}</span>
              <span className="block truncate text-[12.5px] text-rw-muted">{m.role}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-rw-tertiary transition-colors group-hover:text-rw-orange" />
          </button>
        ))}
      </div>

      {/* Invité hors liste */}
      <div className="mt-6">
        {!showGuest ? (
          <button
            onClick={() => setShowGuest(true)}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-rw-muted transition-colors hover:text-rw-black"
          >
            <Users className="size-3.5" /> Je ne suis pas dans la liste
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = guest.trim();
              if (name) onPick({ id: `invite-${slugifyName(name)}`, name });
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="block flex-1">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-rw-muted">
                Ton prénom / nom
              </span>
              <input
                autoFocus
                value={guest}
                onChange={(e) => setGuest(e.target.value)}
                className="w-full border-2 border-rw-black bg-rw-white px-3 py-2.5 text-[14px] outline-none transition-colors placeholder:text-rw-tertiary focus:border-rw-orange"
                placeholder="ex. Camille Roy"
              />
            </label>
            <Button type="submit" variant="rw" disabled={!guest.trim()}>
              Continuer <ArrowRight className="size-4" />
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────── Étape 2 : la grille ─────────────────────────── */

function GridStep({
  months,
  picked,
  selected,
  note,
  setNote,
  loadingMine,
  status,
  onSlotDown,
  onSlotEnter,
  toggleDay,
  fillWeekdays,
  clearAll,
  onBack,
  onSend,
}: {
  months: ReturnType<typeof buildMonths>;
  picked: Picked;
  selected: Set<string>;
  note: string;
  setNote: (v: string) => void;
  loadingMine: boolean;
  status: { kind: string; message?: string };
  onSlotDown: (e: React.PointerEvent, id: string, on: boolean) => void;
  onSlotEnter: (e: React.PointerEvent, id: string) => void;
  toggleDay: (date: string) => void;
  fillWeekdays: () => void;
  clearAll: () => void;
  onBack: () => void;
  onSend: () => void;
}) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      {/* Bandeau identité + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-rw-muted transition-colors hover:text-rw-black"
          >
            <ArrowLeft className="size-3.5" /> Changer de personne
          </button>
          <h1 className="mt-2 text-[clamp(1.6rem,4vw,2.6rem)] leading-[0.95]">
            Salut <span className="text-rw-orange">{picked.name.split(" ")[0]}</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-rw-muted">
            Marque les demi-journées où tu es dispo. Clique (ou glisse) sur{" "}
            <b className="text-rw-black">Matin</b> / <b className="text-rw-black">Après-midi</b>, ou sur le
            n° du jour pour la journée entière.
          </p>
        </div>
      </div>

      {/* Barre d'actions rapides + légende */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-y-2 border-rw-black py-3">
        <Button variant="rwOutline" size="sm" onClick={fillWeekdays}>
          <Check className="size-3.5" /> Jours de semaine
        </Button>
        <Button variant="rwOutline" size="sm" onClick={clearAll}>
          <Eraser className="size-3.5" /> Tout effacer
        </Button>
        <span className="ml-auto flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-rw-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 border border-rw-black bg-rw-orange" /> Dispo
          </span>
          <span>
            <b className="text-rw-black">{selected.size}</b> créneau{selected.size > 1 ? "x" : ""}
          </span>
        </span>
      </div>

      {loadingMine && (
        <p className="mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-rw-tertiary">
          <Loader2 className="size-3.5 animate-spin" /> Chargement de tes dispos…
        </p>
      )}

      {/* Calendriers */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {months.map((month) => (
          <MonthView
            key={month.key}
            month={month}
            renderDay={(cell) => (
              <ParticipantDay
                cell={cell}
                selected={selected}
                onSlotDown={onSlotDown}
                onSlotEnter={onSlotEnter}
                toggleDay={toggleDay}
              />
            )}
          />
        ))}
      </div>

      {/* Note facultative */}
      <label className="mt-8 block">
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-rw-muted">
          Une contrainte à signaler ? <span className="text-rw-tertiary normal-case tracking-normal">(facultatif)</span>
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="ex. plutôt en fin de journée, pas le 12 août…"
          className="w-full resize-y border-2 border-rw-black bg-rw-white px-3 py-2.5 text-[14px] outline-none transition-colors placeholder:text-rw-tertiary focus:border-rw-orange"
        />
      </label>

      {status.kind === "error" && (
        <p className="mt-4 border-2 border-rw-danger bg-rw-danger/5 px-3 py-2 text-[13px] text-rw-danger">
          L'envoi a échoué : {status.message}. Réessaie dans un instant.
        </p>
      )}

      {/* Envoi (sticky en bas) */}
      <div className="sticky bottom-0 z-30 -mx-5 mt-8 border-t-2 border-rw-black bg-rw-white/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-rw-muted">
            {selected.size === 0 ? "Aucun créneau sélectionné" : `${selected.size} demi-journée${selected.size > 1 ? "s" : ""}`}
          </span>
          <Button variant="rw" onClick={onSend} disabled={status.kind === "sending"}>
            {status.kind === "sending" ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Envoi…
              </>
            ) : (
              <>
                Envoyer mes dispos <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Une case-jour interactive : n° cliquable (journée entière) + 2 bandes matin/après-midi. */
function ParticipantDay({
  cell,
  selected,
  onSlotDown,
  onSlotEnter,
  toggleDay,
}: {
  cell: DayCell;
  selected: Set<string>;
  onSlotDown: (e: React.PointerEvent, id: string, on: boolean) => void;
  onSlotEnter: (e: React.PointerEvent, id: string) => void;
  toggleDay: (date: string) => void;
}) {
  if (!cell.inRange) {
    return (
      <div className="flex min-h-[3.75rem] items-start justify-end bg-rw-paper-subtle/40 p-1">
        <span className="font-mono text-[10px] text-rw-tertiary/50">{cell.day}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", cell.isWeekend && "bg-rw-paper-subtle/40")}>
      <button
        type="button"
        onClick={() => toggleDay(cell.date)}
        title="Journée entière"
        className={cn(
          "px-1 py-0.5 text-right font-mono text-[10px] transition-colors hover:text-rw-orange",
          cell.isWeekend ? "text-rw-tertiary" : "text-rw-muted",
        )}
      >
        {cell.day}
      </button>
      {(["am", "pm"] as Part[]).map((part) => {
        const id = slotId(cell.date, part);
        const on = selected.has(id);
        return (
          <button
            key={part}
            type="button"
            data-slot={id}
            aria-pressed={on}
            aria-label={`${PART_LABEL[part]} — ${formatSlot(id)}`}
            onPointerDown={(e) => onSlotDown(e, id, on)}
            onPointerEnter={(e) => onSlotEnter(e, id)}
            className={cn(
              "flex h-6 select-none items-center justify-center border-t border-rw-line-subtle font-mono text-[8px] uppercase tracking-wider transition-colors",
              on ? "bg-rw-orange text-rw-black" : "bg-transparent text-rw-tertiary hover:bg-rw-paper-subtle",
            )}
          >
            {on ? <Check className="size-3" strokeWidth={3} /> : PART_SHORT[part]}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Étape 3 : envoyé ─────────────────────────── */

function DoneStep({
  name,
  count,
  responded,
  total,
  onEdit,
  onSwitch,
}: {
  name: string;
  count: number;
  responded?: number;
  total: number;
  onEdit: () => void;
  onSwitch: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8 sm:py-24">
      <div className="mx-auto grid size-16 place-items-center border-2 border-rw-black bg-rw-orange shadow-[var(--shadow-hard)]">
        <Check className="size-8 text-rw-black" strokeWidth={3} />
      </div>
      <h1 className="mt-8 text-[clamp(2rem,5vw,3rem)]">Merci {name.split(" ")[0]} !</h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-rw-muted">
        Tes <b className="text-rw-black">{count} demi-journée{count > 1 ? "s" : ""}</b> de disponibilité sont
        enregistrées.{" "}
        {typeof responded === "number" && (
          <>
            {responded}/{total} personne{responded > 1 ? "s ont" : " a"} répondu pour l'instant.
          </>
        )}
      </p>
      <p className="mx-auto mt-3 max-w-md text-[13.5px] text-rw-tertiary">
        Tu peux revenir sur ce lien à tout moment pour ajuster tes dispos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="rwOutline" onClick={onEdit}>
          <Pencil className="size-4" /> Modifier mes dispos
        </Button>
        <Button variant="rwOutline" onClick={onSwitch}>
          <Users className="size-4" /> Une autre personne
        </Button>
      </div>
    </section>
  );
}

/* ─────────────────────────── Événement inconnu ─────────────────────────── */

function UnknownEvent() {
  return (
    <div className="grid min-h-dvh place-items-center bg-rw-white px-6 text-center">
      <div>
        <p className="rw-eyebrow text-rw-orange">Dispos</p>
        <h1 className="mt-4 text-3xl">Lien inconnu</h1>
        <p className="mt-4 max-w-sm text-[15px] text-rw-muted">
          Cet événement n'existe pas (ou plus). Vérifie le lien qu'on t'a envoyé.
        </p>
        <Button variant="rwOutline" className="mt-8" asChild>
          <a href="https://rewolf.studio">Retour</a>
        </Button>
      </div>
    </div>
  );
}
