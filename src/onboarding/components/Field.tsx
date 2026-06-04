import { type ReactNode } from "react";
import { Check, Paperclip, Upload, X } from "lucide-react";
import { type Question, type QType } from "@/onboarding/questionnaire";
import { type Answers } from "@/onboarding/answers";
import { YES, NO, aux } from "@/onboarding/fieldTypes";
import { cn } from "@/lib/utils";

const INPUT =
  "w-full border-2 border-rw-black bg-white px-4 py-3 text-[15px] leading-relaxed placeholder:text-rw-tertiary focus:outline-none focus-visible:outline-none focus:border-rw-orange focus:ring-2 focus:ring-rw-orange/30";

const sv = (v: unknown): string => (typeof v === "string" ? v : "");

export interface RendererProps {
  q: Question;
  answers: Answers;
  files: File[];
  set: (key: string, value: string | string[]) => void;
  addFiles: (qid: string, list: FileList | null) => void;
  removeFile: (qid: string, idx: number) => void;
}
type Renderer = (p: RendererProps) => ReactNode;

/* ── Renderers par type ── */

const TextField: Renderer = ({ q, answers, set }) => (
  <input className={INPUT} value={sv(answers[q.id])} placeholder={q.ph} onChange={(e) => set(q.id, e.target.value)} />
);

const TextareaField: Renderer = ({ q, answers, set }) => (
  <>
    <textarea
      className={cn(INPUT, "min-h-[112px] resize-y")}
      rows={4}
      value={sv(answers[q.id])}
      placeholder={q.ph}
      onChange={(e) => set(q.id, e.target.value)}
    />
    {q.type === "ranked" && <Hint>↕ Du plus important au moins important — un par ligne.</Hint>}
    {q.type === "links" && <Hint>↗ Un lien ou un nom par ligne.</Hint>}
  </>
);

const BooleanField: Renderer = ({ q, answers, set }) => {
  const v = sv(answers[q.id]);
  return (
    <>
      <Seg value={v} onPick={(opt) => set(q.id, v === opt ? "" : opt)} />
      {q.type === "booleanDetail" && v === YES && (
        <textarea
          className={cn(INPUT, "min-h-[88px] resize-y")}
          value={sv(answers[aux(q.id, "detail")])}
          placeholder={q.detailPh}
          onChange={(e) => set(aux(q.id, "detail"), e.target.value)}
        />
      )}
    </>
  );
};

const ChoiceField: Renderer = ({ q, answers, set }) => {
  const v = sv(answers[q.id]);
  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {q.options?.map((opt) => (
          <Chip key={opt} on={v === opt} accent onClick={() => set(q.id, v === opt ? "" : opt)}>
            {opt}
          </Chip>
        ))}
      </div>
      {q.precision && (
        <input
          className={INPUT}
          placeholder={q.precision}
          value={sv(answers[aux(q.id, "precision")])}
          onChange={(e) => set(aux(q.id, "precision"), e.target.value)}
        />
      )}
    </>
  );
};

const MultiField: Renderer = ({ q, answers, set }) => {
  const arr = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {q.options?.map((opt) => {
          const on = arr.includes(opt);
          return (
            <Chip key={opt} on={on} onClick={() => set(q.id, on ? arr.filter((x) => x !== opt) : [...arr, opt])}>
              {opt}
            </Chip>
          );
        })}
      </div>
      {q.allowOther && (
        <input
          className={INPUT}
          placeholder="Autre / précisions…"
          value={sv(answers[aux(q.id, "other")])}
          onChange={(e) => set(aux(q.id, "other"), e.target.value)}
        />
      )}
    </>
  );
};

const BudgetField: Renderer = ({ q, answers, set }) => {
  const v = sv(answers[q.id]);
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {q.budgetOptions?.map(([main, sub]) => {
        const on = v === main;
        return (
          <button
            key={main}
            type="button"
            aria-pressed={on}
            onClick={() => set(q.id, on ? "" : main)}
            className={cn(
              "border-2 border-rw-black p-4 text-left transition-all",
              on
                ? "bg-rw-orange text-rw-black shadow-[var(--shadow-hard-sm)]"
                : "bg-white hover:translate-x-[1px] hover:translate-y-[1px]",
            )}
          >
            <span className="block text-[15px] font-bold tracking-tight">{main}</span>
            <span className={cn("mt-0.5 block text-xs", on ? "text-rw-black/70" : "text-rw-muted")}>{sub}</span>
          </button>
        );
      })}
    </div>
  );
};

const LogoField: Renderer = ({ q, answers, files, set, addFiles, removeFile }) => {
  const v = sv(answers[q.id]);
  return (
    <>
      <Seg value={v} onPick={(opt) => set(q.id, v === opt ? "" : opt)} />
      {v === YES && (
        <div className="space-y-2">
          <p className="font-mono text-xs text-rw-tertiary">Partagez votre logo / charte — joignez le fichier ou collez un lien.</p>
          <input
            className={INPUT}
            placeholder="Lien vers votre logo / charte (optionnel)"
            value={sv(answers[aux(q.id, "link")])}
            onChange={(e) => set(aux(q.id, "link"), e.target.value)}
          />
          <FileZone qid={q.id} files={files} addFiles={addFiles} removeFile={removeFile} />
        </div>
      )}
      {v === NO && (
        <div className="space-y-3 border-l-4 border-rw-orange bg-rw-orange/5 p-4">
          <p className="text-[15px] text-rw-black">Parfait — c'est notre métier. On peut créer votre identité de A à Z.</p>
          <div className="flex flex-wrap gap-2.5">
            {["Oui, créez mon identité", "On en parle ensemble"].map((opt) => {
              const on = answers[aux(q.id, "branding")] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set(aux(q.id, "branding"), on ? "" : opt)}
                  className={cn(
                    "inline-flex items-center gap-2 border-2 border-rw-black px-4 py-2.5 text-sm font-medium transition-colors",
                    on ? "bg-rw-orange text-rw-black" : "bg-white text-rw-black hover:bg-rw-paper-subtle",
                  )}
                >
                  {on && <Check className="size-3.5 shrink-0" />}
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

const FontField: Renderer = ({ q, answers, set }) => {
  const v = sv(answers[q.id]);
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {q.fontOptions?.map((f) => {
        const on = v === f.name;
        return (
          <button
            key={f.name}
            type="button"
            aria-pressed={on}
            onClick={() => set(q.id, on ? "" : f.name)}
            className={cn(
              "border-2 border-rw-black p-4 text-left transition-all",
              on
                ? "bg-rw-orange/10 shadow-[var(--shadow-hard-sm)] ring-2 ring-rw-orange"
                : "bg-white hover:translate-x-[1px] hover:translate-y-[1px]",
            )}
          >
            <span className="block text-[26px] leading-tight text-rw-black" style={{ fontFamily: f.stack }}>
              GMT Bordeaux
            </span>
            <span className="mt-1.5 flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-rw-muted">
              {f.name}
              {on && <Check className="size-3 text-rw-orange" />}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// Registre exhaustif : ajouter un membre à QType force une entrée ici (erreur TS sinon).
const FIELD_RENDERER: Record<QType, Renderer> = {
  text: TextField,
  textarea: TextareaField,
  list: TextareaField,
  ranked: TextareaField,
  links: TextareaField,
  boolean: BooleanField,
  booleanDetail: BooleanField,
  choice: ChoiceField,
  multi: MultiField,
  budget: BudgetField,
  logo: LogoField,
  font: FontField,
};

export function Field(props: RendererProps) {
  const Render = FIELD_RENDERER[props.q.type];
  return (
    <div className="space-y-3">
      <Render {...props} />
      {props.q.file && (
        <FileZone qid={props.q.id} files={props.files} addFiles={props.addFiles} removeFile={props.removeFile} />
      )}
    </div>
  );
}

/* ── Primitives partagées ── */

function Seg({ value, onPick }: { value: string; onPick: (opt: string) => void }) {
  return (
    <div className="inline-flex border-2 border-rw-black">
      {[YES, NO].map((opt, i) => {
        const on = value === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(opt)}
            className={cn(
              "px-7 py-2.5 text-sm font-bold uppercase tracking-tight transition-colors",
              i === 0 && "border-r-2 border-rw-black",
              on ? "bg-rw-orange text-rw-black" : "bg-white text-rw-muted hover:bg-rw-paper-subtle",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FileZone({
  qid,
  files,
  addFiles,
  removeFile,
}: {
  qid: string;
  files: File[];
  addFiles: (qid: string, list: FileList | null) => void;
  removeFile: (qid: string, idx: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center gap-3 border-2 border-dashed border-rw-black bg-white px-4 py-3 text-sm text-rw-muted transition-colors hover:bg-rw-paper-subtle hover:text-rw-black">
        <Upload className="size-4 shrink-0 text-rw-orange" />
        <span className="font-medium">Joindre un fichier (logo, photo, document…)</span>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(qid, e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </label>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 border border-rw-line-subtle bg-rw-paper-subtle px-3 py-2 text-[13px]">
              <Paperclip className="size-3.5 shrink-0 text-rw-muted" />
              <span className="truncate">{f.name}</span>
              <span className="ml-1 shrink-0 text-xs text-rw-tertiary">{Math.ceil(f.size / 1024)} Ko</span>
              <button
                type="button"
                onClick={() => removeFile(qid, i)}
                className="ml-auto shrink-0 text-rw-tertiary hover:text-rw-danger"
                aria-label="Retirer"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  on,
  accent,
  onClick,
  children,
}: {
  on: boolean;
  accent?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 border-2 border-rw-black px-4 py-2.5 text-sm font-medium transition-colors",
        on ? (accent ? "bg-rw-orange text-rw-black" : "bg-rw-black text-rw-white") : "bg-white text-rw-black hover:bg-rw-paper-subtle",
      )}
    >
      {on && <Check className="size-3.5 shrink-0" />}
      {children}
    </button>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs text-rw-tertiary">{children}</p>;
}
