import { useEffect, useRef } from "react";
import { Check, Mic, Minus, PencilLine, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card, CardAnswer } from "./types";

interface Props {
  card: Card;
  value: CardAnswer;
  onChange: (patch: Partial<CardAnswer>) => void;
  /** Réponse donnée en un geste : la page passe à la carte suivante. */
  onPicked: () => void;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

/** Touches 1, 2, 3… pour choisir sans souris. */
function useDigitKeys(count: number, pick: (i: number) => void) {
  const pickRef = useRef(pick);
  useEffect(() => {
    pickRef.current = pick;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= count) {
        e.preventDefault();
        pickRef.current(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);
}

function Chip({
  on,
  onClick,
  disabled,
  className,
  children,
  hint,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center gap-3 border-2 border-rw-black px-4 py-3 text-left text-[15px] font-medium leading-snug transition-[transform,box-shadow,background-color] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-35",
        on ? "bg-rw-orange shadow-[var(--shadow-hard-sm)]" : "bg-rw-white hover:bg-rw-paper-subtle",
        className,
      )}
    >
      {hint && (
        <span className="hidden w-4 shrink-0 font-mono text-[11px] text-rw-tertiary sm:inline" aria-hidden>
          {hint}
        </span>
      )}
      <span className="flex-1">{children}</span>
      {on && <Check className="size-4 shrink-0" aria-hidden />}
    </button>
  );
}

const inputCls =
  "w-full border-2 border-rw-black bg-rw-white px-3 py-3 text-base outline-none placeholder:text-rw-tertiary focus-visible:shadow-[var(--shadow-hard-orange)]";

/* ─────────────── Les types de cartes ─────────────── */

function ConfirmInput({ card, value, onChange, onPicked }: Props & { card: Extract<Card, { kind: "confirm" }> }) {
  const opts = [
    { v: "exact", label: "C'est exact", Icon: Check },
    { v: "nuance", label: "À nuancer", Icon: PencilLine },
    { v: "faux", label: "Faux", Icon: X },
  ];
  const pick = (v: string) => {
    onChange({ value: v });
    if (v === "exact") onPicked();
  };
  useDigitKeys(3, (i) => pick(opts[i].v));
  return (
    <div className="space-y-5">
      <figure className="border-l-4 border-rw-orange bg-rw-paper-subtle px-4 py-4">
        <figcaption className="rw-eyebrow text-rw-muted">Sur le site</figcaption>
        <blockquote className="mt-2 text-lg font-semibold leading-snug">« {card.statement} »</blockquote>
      </figure>
      <div className="grid gap-2 sm:grid-cols-3">
        {opts.map(({ v, label, Icon }, i) => (
          <Chip key={v} on={value.value === v} onClick={() => pick(v)} hint={String(i + 1)}>
            <span className="inline-flex items-center gap-2">
              <Icon className="size-4" aria-hidden />
              {label}
            </span>
          </Chip>
        ))}
      </div>
      {(value.value === "nuance" || value.value === "faux") && (
        <textarea
          autoFocus
          rows={3}
          value={value.note ?? ""}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder={value.value === "faux" ? "Ce qui est vrai chez vous…" : "Ce qu'il faudrait dire…"}
          className={inputCls}
        />
      )}
    </div>
  );
}

function ChoiceInput({ card, value, onChange, onPicked }: Props & { card: Extract<Card, { kind: "choice" }> }) {
  const all = card.other ? [...card.options, { v: "other", label: "Autre…" }] : card.options;
  const pick = (v: string) => {
    onChange({ value: v });
    if (v !== "other") onPicked();
  };
  useDigitKeys(all.length, (i) => pick(all[i].v));
  return (
    <div className="space-y-2">
      {all.map((o, i) => (
        <Chip key={o.v} on={value.value === o.v} onClick={() => pick(o.v)} hint={String(i + 1)} className="w-full">
          {o.label}
        </Chip>
      ))}
      {value.value === "other" && (
        <input
          autoFocus
          value={value.other ?? ""}
          onChange={(e) => onChange({ other: e.target.value })}
          placeholder="Précise…"
          className={inputCls}
        />
      )}
    </div>
  );
}

function MultiInput({ card, value, onChange }: Props & { card: Extract<Card, { kind: "multi" }> }) {
  const chosen = value.values ?? card.preset ?? [];
  const full = !!card.max && chosen.length >= card.max;
  const toggle = (v: string) => onChange({ values: chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v] });
  return (
    <div className="space-y-4">
      {card.max && (
        <p className="font-mono text-xs uppercase tracking-widest text-rw-muted">
          {chosen.length} / {card.max} choisis
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {card.options.map((o) => (
          <Chip key={o.v} on={chosen.includes(o.v)} disabled={full && !chosen.includes(o.v)} onClick={() => toggle(o.v)}>
            {o.label}
          </Chip>
        ))}
      </div>
      {card.other && (
        <input
          value={value.other ?? ""}
          onChange={(e) => onChange({ other: e.target.value, values: chosen })}
          placeholder="Autre chose ? Écris-le ici"
          className={inputCls}
        />
      )}
    </div>
  );
}

function GridInput({ card, value, onChange }: Props & { card: Extract<Card, { kind: "grid" }> }) {
  const rows = value.rows ?? {};
  const set = (r: string, c: string) => {
    const next = { ...rows };
    if (next[r] === c) delete next[r];
    else next[r] = c;
    onChange({ rows: next });
  };
  const first = card.columns[0];
  const bulk = card.bulk !== false && card.rows.length >= 3;
  return (
    <div>
      {bulk && (
        <button
          type="button"
          onClick={() => onChange({ rows: Object.fromEntries(card.rows.map((r) => [r.v, first.v])) })}
          className="mb-3 border-2 border-dashed border-rw-black px-3 py-2 text-sm font-semibold hover:border-solid hover:bg-rw-paper-subtle"
        >
          Tout sur « {first.label} », puis je corrige
        </button>
      )}
      <div className="divide-y-2 divide-rw-line-subtle border-y-2 border-rw-line-subtle">
        {card.rows.map((r) => (
          <div key={r.v} className="py-3">
            <p className="mb-2 text-[15px] font-medium leading-snug">{r.label}</p>
            <div className="flex gap-1.5" role="group" aria-label={r.label}>
              {card.columns.map((c) => (
                <button
                  key={c.v}
                  type="button"
                  aria-pressed={rows[r.v] === c.v}
                  onClick={() => set(r.v, c.v)}
                  className={cn(
                    "h-11 flex-1 border-2 border-rw-black px-2 text-sm font-semibold transition-colors",
                    rows[r.v] === c.v ? "bg-rw-orange" : "bg-rw-white hover:bg-rw-paper-subtle",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberInput({ card, value, onChange }: Props & { card: Extract<Card, { kind: "number" }> }) {
  const step = card.step ?? 1;
  const parse = (s?: string) => parseFloat((s ?? "").replace(",", ".").replace(/\s/g, ""));
  const bump = (dir: 1 | -1) => {
    const cur = parse(value.value);
    let n = Number.isNaN(cur) ? (card.min ?? 0) : cur + dir * step;
    if (card.min !== undefined) n = Math.max(card.min, n);
    if (card.max !== undefined) n = Math.min(card.max, n);
    onChange({ value: String(Math.round(n * 100) / 100).replace(".", ",") });
  };
  const sq =
    "grid size-14 shrink-0 place-items-center border-2 border-rw-black bg-rw-white hover:bg-rw-paper-subtle active:bg-rw-orange";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" className={sq} onClick={() => bump(-1)} aria-label="Moins">
          <Minus className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-2 border-b-4 border-rw-black pb-1">
          <input
            inputMode="decimal"
            value={value.value ?? ""}
            onChange={(e) => onChange({ value: e.target.value.replace(/[^0-9.,\s]/g, "") })}
            placeholder="—"
            aria-label={card.label}
            className="w-full min-w-0 bg-transparent text-center text-5xl font-extrabold tracking-tight outline-none placeholder:text-rw-tertiary"
          />
          {card.unit && <span className="shrink-0 text-xl font-bold text-rw-muted">{card.unit}</span>}
        </div>
        <button type="button" className={sq} onClick={() => bump(1)} aria-label="Plus">
          <Plus className="size-5" />
        </button>
      </div>
      {(card.qualifiers || card.approx) && (
        <div className="flex flex-wrap justify-center gap-2">
          {card.qualifiers?.map((q) => (
            <Chip key={q.v} on={(value.qualifier ?? card.qualifiers![0].v) === q.v} onClick={() => onChange({ qualifier: q.v })}>
              {q.label}
            </Chip>
          ))}
          {card.approx && (
            <Chip on={!!value.approx} onClick={() => onChange({ approx: !value.approx })}>
              Environ
            </Chip>
          )}
        </div>
      )}
    </div>
  );
}

function FieldsInput({ card, value, onChange }: Props & { card: Extract<Card, { kind: "fields" }> }) {
  const fields = value.fields ?? {};
  return (
    <div className="space-y-4">
      {card.fields.map((f, i) => (
        <label key={f.key} className="block">
          <span className="mb-1.5 block text-sm font-semibold">{f.label}</span>
          <input
            autoFocus={i === 0}
            value={fields[f.key] ?? ""}
            onChange={(e) => onChange({ fields: { ...fields, [f.key]: e.target.value } })}
            placeholder={f.ph}
            className={inputCls}
          />
        </label>
      ))}
    </div>
  );
}

function LongInput({ card, value, onChange }: Props & { card: Extract<Card, { kind: "long" }> }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const start = (s: string) => {
    const cur = value.value ?? "";
    const next = cur.trim() ? `${cur.trimEnd()}\n${s} ` : `${s} `;
    onChange({ value: next });
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        el.focus();
        el.setSelectionRange(next.length, next.length);
      }
    });
  };
  return (
    <div className="space-y-3">
      {card.starters && (
        <div className="flex flex-wrap gap-2">
          {card.starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => start(s)}
              className="border-2 border-dashed border-rw-black px-3 py-2 text-sm hover:border-solid hover:bg-rw-paper-subtle"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={ref}
        rows={6}
        value={value.value ?? ""}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder={card.ph ?? "Écris comme tu parles."}
        className={cn(inputCls, "min-h-40 leading-relaxed")}
      />
      <p className="flex items-center gap-2 text-sm text-rw-muted">
        <Mic className="size-4 shrink-0" aria-hidden />
        Sur téléphone, le micro du clavier permet de dicter : c'est plus rapide.
      </p>
    </div>
  );
}

function ListInput({ card, value, onChange }: Props & { card: Extract<Card, { kind: "list" }> }) {
  const items = value.items?.length ? value.items : ["", ""];
  const set = (i: number, s: string) => onChange({ items: items.map((x, j) => (j === i ? s : x)) });
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <input
          key={i}
          autoFocus={i === 0}
          value={it}
          onChange={(e) => set(i, e.target.value)}
          placeholder={card.itemPh}
          className={inputCls}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange({ items: [...items, ""] })}
        className="inline-flex items-center gap-2 py-2 text-sm font-semibold underline-offset-4 hover:underline"
      >
        <Plus className="size-4" aria-hidden /> Une ligne de plus
      </button>
    </div>
  );
}

export function CardInput(props: Props) {
  const { card } = props;
  switch (card.kind) {
    case "confirm":
      return <ConfirmInput {...props} card={card} />;
    case "choice":
      return <ChoiceInput {...props} card={card} />;
    case "multi":
      return <MultiInput {...props} card={card} />;
    case "grid":
      return <GridInput {...props} card={card} />;
    case "number":
      return <NumberInput {...props} card={card} />;
    case "fields":
      return <FieldsInput {...props} card={card} />;
    case "long":
      return <LongInput {...props} card={card} />;
    case "list":
      return <ListInput {...props} card={card} />;
  }
}
