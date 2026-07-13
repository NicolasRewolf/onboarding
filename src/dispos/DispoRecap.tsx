import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { CalendarCheck, Check, Loader2, Lock, RefreshCw, Target, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type DayCell,
  type DispoEvent,
  type Part,
  buildMonths,
  formatSlot,
  resolveEvent,
  slotId,
} from "./event";
import { MonthView } from "./components/MonthView";
import { type DispoRecord, fetchRecap } from "./api";

export default function DispoRecap() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const event = useMemo(() => resolveEvent(slug, params), [slug, params]);
  const urlKey = params.get("k") || "";

  if (!event) return <UnknownEvent />;
  return <Recap event={event} initialKey={urlKey} />;
}

function Recap({ event: ev, initialKey }: { event: DispoEvent; initialKey: string }) {
  const months = useMemo(() => buildMonths(ev.start, ev.end), [ev.start, ev.end]);

  const [key, setKey] = useState(initialKey);
  const [keyInput, setKeyInput] = useState(initialKey);
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "locked"; message?: string }
    | { kind: "error"; message: string }
    | { kind: "ready"; responses: DispoRecord[] }
  >({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    const res = await fetchRecap(ev.slug, key || undefined);
    if (res.needsKey) setState({ kind: "locked", message: res.error });
    else if (!res.ok) setState({ kind: "error", message: res.error || "Erreur" });
    else setState({ kind: "ready", responses: res.responses || [] });
  }, [ev.slug, key]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ── Agrégats ── */
  const agg = useMemo(() => {
    const responses = state.kind === "ready" ? state.responses : [];
    const respondedIds = new Set(responses.map((r) => r.personId));
    const memberIds = new Set(ev.members.map((m) => m.id));

    // slotId → set des personId disponibles (membres ET invités)
    const availBySlot = new Map<string, Set<string>>();
    for (const r of responses) {
      for (const s of r.slots) {
        let set = availBySlot.get(s);
        if (!set) availBySlot.set(s, (set = new Set()));
        set.add(r.personId);
      }
    }

    // Comptage réservé aux MEMBRES de l'équipe : les invités restent visibles (pastilles,
    // détail) mais ne gonflent ni le numérateur (jamais > effectif) ni la chaleur.
    const countBySlot = new Map<string, number>();
    for (const [id, set] of availBySlot) {
      let c = 0;
      for (const pid of set) if (memberIds.has(pid)) c++;
      countBySlot.set(id, c);
    }

    // Un créneau « complet » = chaque membre de l'équipe est dispo.
    const isEveryone = (s: string) => {
      const set = availBySlot.get(s);
      return !!set && ev.members.every((m) => set.has(m.id));
    };

    const scored: { id: string; count: number; everyone: boolean }[] = [];
    for (const month of months) {
      for (const cell of month.days) {
        if (!cell.inRange) continue;
        for (const part of ["am", "pm"] as Part[]) {
          const id = slotId(cell.date, part);
          const count = countBySlot.get(id) ?? 0;
          if (count > 0) scored.push({ id, count, everyone: isEveryone(id) });
        }
      }
    }
    scored.sort((a, b) => b.count - a.count || (a.id < b.id ? -1 : 1));

    const missing = ev.members.filter((m) => !respondedIds.has(m.id));
    const guests = responses.filter((r) => !ev.members.some((m) => m.id === r.personId));

    return { responses, respondedIds, availBySlot, countBySlot, isEveryone, scored, missing, guests };
  }, [state, ev.members, months]);

  const [selected, setSelected] = useState<string | null>(null);

  /* ── États intermédiaires ── */
  if (state.kind === "loading") {
    return (
      <Shell title={ev.title}>
        <p className="flex items-center gap-2 py-24 font-mono text-[12px] uppercase tracking-wider text-rw-tertiary">
          <Loader2 className="size-4 animate-spin" /> Chargement des disponibilités…
        </p>
      </Shell>
    );
  }

  if (state.kind === "locked") {
    return (
      <Shell title={ev.title}>
        <div className="mx-auto max-w-sm py-20 text-center">
          <div className="mx-auto grid size-14 place-items-center border-2 border-rw-black bg-rw-paper-subtle">
            <Lock className="size-6 text-rw-black" />
          </div>
          <h2 className="mt-6 text-2xl">Récap protégé</h2>
          <p className="mt-3 text-[14px] text-rw-muted">Entre la clé d'accès pour voir les disponibilités.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setKey(keyInput.trim());
            }}
            className="mt-6 flex gap-2"
          >
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              type="password"
              placeholder="Clé d'accès"
              className="w-full border-2 border-rw-black bg-rw-white px-3 py-2.5 text-[14px] outline-none focus:border-rw-orange"
            />
            <Button type="submit" variant="rw">
              Voir
            </Button>
          </form>
        </div>
      </Shell>
    );
  }

  if (state.kind === "error") {
    return (
      <Shell title={ev.title}>
        <div className="py-20 text-center">
          <p className="text-[15px] text-rw-danger">Impossible de charger : {state.message}</p>
          <Button variant="rwOutline" className="mt-6" onClick={() => void load()}>
            <RefreshCw className="size-4" /> Réessayer
          </Button>
        </div>
      </Shell>
    );
  }

  const totalMembers = ev.members.length;
  const respondedCount = totalMembers - agg.missing.length;
  const bestEveryone = agg.scored.filter((s) => s.everyone);
  const top = (bestEveryone.length ? bestEveryone : agg.scored).slice(0, 8);

  return (
    <Shell title={ev.title}>
      {/* Suivi des réponses */}
      <div className="border-2 border-rw-black bg-rw-white p-5 shadow-[var(--shadow-hard-sm)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="rw-eyebrow text-rw-orange">Réponses</p>
            <p className="mt-1 text-[26px] font-extrabold tracking-tight">
              {respondedCount}
              <span className="text-rw-tertiary">/{totalMembers}</span>{" "}
              <span className="text-base font-bold text-rw-muted">ont rempli</span>
            </p>
          </div>
          <Button variant="rwOutline" size="sm" onClick={() => void load()}>
            <RefreshCw className="size-3.5" /> Rafraîchir
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ev.members.map((m) => {
            const done = agg.respondedIds.has(m.id);
            return (
              <span
                key={m.id}
                className={cn(
                  "inline-flex items-center gap-1.5 border-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider",
                  done ? "border-rw-black bg-rw-orange text-rw-black" : "border-rw-line-subtle bg-rw-white text-rw-tertiary",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : <span className="size-3" />}
                {m.name.split(" ")[0]}
              </span>
            );
          })}
          {agg.guests.map((g) => (
            <span
              key={g.personId}
              className="inline-flex items-center gap-1.5 border-2 border-rw-black bg-rw-black px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-rw-white"
            >
              <Check className="size-3" strokeWidth={3} /> {g.person.split(" ")[0]} · invité
            </span>
          ))}
        </div>

        {/* Notes éventuelles */}
        {agg.responses.some((r) => r.note) && (
          <ul className="mt-4 space-y-1.5 border-t-2 border-rw-line-subtle pt-4">
            {agg.responses
              .filter((r) => r.note)
              .map((r) => (
                <li key={r.personId} className="text-[13px] text-rw-muted">
                  <b className="text-rw-black">{r.person.split(" ")[0]} :</b> {r.note}
                </li>
              ))}
          </ul>
        )}
      </div>

      {agg.responses.length === 0 ? (
        <div className="mt-8 border-2 border-dashed border-rw-line-subtle p-12 text-center">
          <CalendarCheck className="mx-auto size-8 text-rw-tertiary" />
          <p className="mt-4 font-mono text-[12px] uppercase tracking-wider text-rw-tertiary">
            Personne n'a encore répondu
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] text-rw-muted">
            Partage le lien de l'équipe : <code className="text-rw-black">/dispo/{ev.slug}</code>
          </p>
        </div>
      ) : (
        <>
          {/* Meilleurs créneaux */}
          <section className="mt-10">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-rw-orange" />
              <h2 className="text-lg">
                {bestEveryone.length ? "Créneaux où tout le monde est là" : "Meilleurs créneaux"}
              </h2>
            </div>
            {bestEveryone.length === 0 && (
              <p className="mt-1 text-[13px] text-rw-muted">
                Personne ne réunit encore les {totalMembers}. Voici les créneaux les plus larges.
              </p>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {top.map((s) => {
                const missNames = ev.members
                  .filter((m) => !agg.availBySlot.get(s.id)?.has(m.id))
                  .map((m) => m.name.split(" ")[0]);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 border-2 px-4 py-3 text-left transition-transform hover:-translate-y-0.5",
                      s.everyone
                        ? "border-rw-black bg-rw-orange shadow-[var(--shadow-hard-sm)]"
                        : "border-rw-black bg-rw-white",
                      selected === s.id && "shadow-[var(--shadow-hard)]",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block font-bold tracking-tight">{formatSlot(s.id)}</span>
                      <span className="block text-[12px] text-rw-muted">
                        {s.everyone ? "Toute l'équipe dispo 🎯" : `Manque : ${missNames.join(", ")}`}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-lg font-extrabold">
                      {s.count}
                      <span className="text-[11px] text-rw-muted">/{totalMembers}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Détail d'un créneau sélectionné */}
          {selected && (
            <SlotDetail
              slot={selected}
              members={ev.members}
              guests={agg.guests}
              availBySlot={agg.availBySlot}
              respondedIds={agg.respondedIds}
              onClose={() => setSelected(null)}
            />
          )}

          {/* Heatmap calendrier */}
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg">Vue calendrier</h2>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-rw-muted">
                <span>0</span>
                <span className="flex">
                  {[0, 0.25, 0.5, 0.75, 1].map((a, i) => (
                    <span
                      key={i}
                      className="size-4 border border-rw-line-subtle"
                      style={{ backgroundColor: heat(a) }}
                    />
                  ))}
                </span>
                <span>{totalMembers}</span>
                <span className="ml-2 inline-flex items-center gap-1">
                  <span className="inline-block size-3 border-2 border-rw-black" /> tous
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {months.map((month) => (
                <MonthView
                  key={month.key}
                  month={month}
                  renderDay={(cell) => (
                    <RecapDay
                      cell={cell}
                      totalMembers={totalMembers}
                      countBySlot={agg.countBySlot}
                      isEveryone={agg.isEveryone}
                      selected={selected}
                      onSelect={setSelected}
                    />
                  )}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}

/* ── Couleur de chaleur : orange dosé, via token (color-mix, pas de hex en dur) ── */
function heat(alpha: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, alpha)) * 100);
  return `color-mix(in srgb, var(--rw-orange) ${pct}%, var(--rw-white))`;
}

/** Case-jour du récap : deux demi-cases teintées selon le nombre de dispos. */
function RecapDay({
  cell,
  totalMembers,
  countBySlot,
  isEveryone,
  selected,
  onSelect,
}: {
  cell: DayCell;
  totalMembers: number;
  countBySlot: Map<string, number>;
  isEveryone: (s: string) => boolean;
  selected: string | null;
  onSelect: (s: string) => void;
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
      <span
        className={cn(
          "px-1 py-0.5 text-right font-mono text-[10px]",
          cell.isWeekend ? "text-rw-tertiary" : "text-rw-muted",
        )}
      >
        {cell.day}
      </span>
      {(["am", "pm"] as Part[]).map((part) => {
        const id = slotId(cell.date, part);
        const count = countBySlot.get(id) ?? 0;
        const everyone = isEveryone(id);
        return (
          <button
            key={part}
            type="button"
            aria-label={`${formatSlot(id)} — ${count} dispo`}
            onClick={() => onSelect(id)}
            style={{ backgroundColor: count > 0 ? heat(count / Math.max(1, totalMembers)) : undefined }}
            className={cn(
              "flex h-6 items-center justify-center border-t border-rw-line-subtle font-mono text-[9px] font-bold transition-[outline] hover:outline hover:outline-2 hover:outline-rw-orange",
              everyone && "outline outline-2 -outline-offset-2 outline-rw-black",
              selected === id && "outline outline-2 -outline-offset-2 outline-rw-orange",
              count === 0 && "text-rw-tertiary/40",
            )}
          >
            {count > 0 ? count : ""}
          </button>
        );
      })}
    </div>
  );
}

/** Panneau détail d'un créneau : qui est dispo, qui manque, qui n'a pas répondu. */
function SlotDetail({
  slot,
  members,
  guests,
  availBySlot,
  respondedIds,
  onClose,
}: {
  slot: string;
  members: DispoEvent["members"];
  guests: DispoRecord[];
  availBySlot: Map<string, Set<string>>;
  respondedIds: Set<string>;
  onClose: () => void;
}) {
  const set = availBySlot.get(slot) ?? new Set<string>();
  const dispo = members.filter((m) => set.has(m.id));
  const notDispo = members.filter((m) => !set.has(m.id) && respondedIds.has(m.id));
  const noReply = members.filter((m) => !respondedIds.has(m.id));
  const dispoGuests = guests.filter((g) => set.has(g.personId));

  return (
    <div className="mt-6 border-2 border-rw-black bg-rw-white p-5 shadow-[var(--shadow-hard)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="rw-eyebrow text-rw-orange">Créneau</p>
          <h3 className="mt-1 text-xl">{formatSlot(slot)}</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="grid size-8 place-items-center text-rw-muted transition-colors hover:bg-rw-paper-subtle hover:text-rw-black"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <DetailCol title={`Dispo (${dispo.length + dispoGuests.length})`} tone="ok">
          {[...dispo.map((m) => m.name), ...dispoGuests.map((g) => `${g.person} · invité`)].map((n) => (
            <li key={n}>{n}</li>
          ))}
          {dispo.length + dispoGuests.length === 0 && <li className="text-rw-tertiary">—</li>}
        </DetailCol>
        <DetailCol title={`Pas dispo (${notDispo.length})`} tone="no">
          {notDispo.map((m) => (
            <li key={m.id}>{m.name}</li>
          ))}
          {notDispo.length === 0 && <li className="text-rw-tertiary">—</li>}
        </DetailCol>
        <DetailCol title={`Sans réponse (${noReply.length})`} tone="wait">
          {noReply.map((m) => (
            <li key={m.id}>{m.name}</li>
          ))}
          {noReply.length === 0 && <li className="text-rw-tertiary">—</li>}
        </DetailCol>
      </div>
    </div>
  );
}

function DetailCol({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "ok" | "no" | "wait";
  children: React.ReactNode;
}) {
  const dot = tone === "ok" ? "bg-rw-orange" : tone === "no" ? "bg-rw-black" : "bg-rw-line-subtle";
  return (
    <div>
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-rw-muted">
        <span className={cn("inline-block size-2.5 border border-rw-black", dot)} /> {title}
      </p>
      <ul className="mt-2 space-y-1 text-[13.5px] text-rw-black">{children}</ul>
    </div>
  );
}

/* ─────────────────────────── Coquille ─────────────────────────── */

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-rw-white text-rw-black">
      <header className="sticky top-0 z-40 border-b-2 border-rw-black bg-rw-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Wordmark className="h-4 text-rw-black sm:h-[18px]" />
            <span className="hidden h-4 w-px bg-rw-line-subtle sm:block" />
            <span className="hidden font-mono text-[11px] uppercase tracking-wider text-rw-muted sm:block">
              Récap dispos
            </span>
          </div>
          <span className="max-w-[60%] truncate font-mono text-[11px] uppercase tracking-wider text-rw-tertiary">
            {title}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">{children}</main>
    </div>
  );
}

function UnknownEvent() {
  return (
    <div className="grid min-h-dvh place-items-center bg-rw-white px-6 text-center">
      <div>
        <p className="rw-eyebrow text-rw-orange">Récap dispos</p>
        <h1 className="mt-4 text-3xl">Événement inconnu</h1>
        <p className="mt-4 max-w-sm text-[15px] text-rw-muted">Vérifie le slug dans l'URL.</p>
      </div>
    </div>
  );
}
