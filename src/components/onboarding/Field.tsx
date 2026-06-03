import { Check, Paperclip, Upload, X } from "lucide-react";
import { type Question } from "@/lib/questionnaire";
import { type Answers } from "@/lib/answers";
import { cn } from "@/lib/utils";

const INPUT =
  "w-full border-2 border-rw-black bg-white px-4 py-3 text-[15px] leading-relaxed placeholder:text-rw-tertiary focus:outline-none focus-visible:outline-none focus:border-rw-orange focus:ring-2 focus:ring-rw-orange/30";

interface FieldProps {
  q: Question;
  answers: Answers;
  files: File[];
  set: (key: string, value: string | string[]) => void;
  addFiles: (qid: string, list: FileList | null) => void;
  removeFile: (qid: string, idx: number) => void;
}

export function Field({ q, answers, files, set, addFiles, removeFile }: FieldProps) {
  const v = answers[q.id];
  const str = typeof v === "string" ? v : "";
  const arr = Array.isArray(v) ? v : [];

  return (
    <div className="space-y-3">
      {/* ── Texte court ── */}
      {q.type === "text" && (
        <input className={INPUT} value={str} placeholder={q.ph} onChange={(e) => set(q.id, e.target.value)} />
      )}

      {/* ── Textes longs / listes ── */}
      {(q.type === "textarea" || q.type === "list" || q.type === "ranked" || q.type === "links") && (
        <>
          <textarea
            className={cn(INPUT, "min-h-[112px] resize-y")}
            rows={q.type === "ranked" ? 4 : 4}
            value={str}
            placeholder={q.ph}
            onChange={(e) => set(q.id, e.target.value)}
          />
          {q.type === "ranked" && <Hint>↕ Du plus important au moins important — un par ligne.</Hint>}
          {q.type === "links" && <Hint>↗ Un lien ou un nom par ligne.</Hint>}
        </>
      )}

      {/* ── Oui / Non (+ détail) ── */}
      {(q.type === "boolean" || q.type === "booleanDetail") && (
        <>
          <div className="inline-flex border-2 border-rw-black">
            {["Oui", "Non"].map((opt, i) => {
              const on = str === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set(q.id, on ? "" : opt)}
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
          {q.type === "booleanDetail" && str === "Oui" && (
            <textarea
              className={cn(INPUT, "min-h-[88px] resize-y")}
              value={typeof answers[q.id + "_detail"] === "string" ? (answers[q.id + "_detail"] as string) : ""}
              placeholder={q.detailPh}
              onChange={(e) => set(q.id + "_detail", e.target.value)}
            />
          )}
        </>
      )}

      {/* ── Choix unique ── */}
      {q.type === "choice" && q.options && (
        <>
          <div className="flex flex-wrap gap-2.5">
            {q.options.map((opt) => {
              const on = str === opt;
              return (
                <Chip key={opt} on={on} accent onClick={() => set(q.id, on ? "" : opt)}>
                  {opt}
                </Chip>
              );
            })}
          </div>
          {q.precision && (
            <input
              className={INPUT}
              placeholder={q.precision}
              value={typeof answers[q.id + "_precision"] === "string" ? (answers[q.id + "_precision"] as string) : ""}
              onChange={(e) => set(q.id + "_precision", e.target.value)}
            />
          )}
        </>
      )}

      {/* ── Choix multiple ── */}
      {q.type === "multi" && q.options && (
        <>
          <div className="flex flex-wrap gap-2.5">
            {q.options.map((opt) => {
              const on = arr.includes(opt);
              return (
                <Chip
                  key={opt}
                  on={on}
                  onClick={() => set(q.id, on ? arr.filter((x) => x !== opt) : [...arr, opt])}
                >
                  {opt}
                </Chip>
              );
            })}
          </div>
          {q.allowOther && (
            <input
              className={INPUT}
              placeholder="Autre / précisions…"
              value={typeof answers[q.id + "_other"] === "string" ? (answers[q.id + "_other"] as string) : ""}
              onChange={(e) => set(q.id + "_other", e.target.value)}
            />
          )}
        </>
      )}

      {/* ── Budget ── */}
      {q.type === "budget" && q.budgetOptions && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {q.budgetOptions.map(([main, sub]) => {
            const on = str === main;
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
      )}

      {/* ── Logo / identité (branchement Oui / Non) ── */}
      {q.type === "logo" && (
        <>
          <div className="inline-flex border-2 border-rw-black">
            {["Oui", "Non"].map((opt, i) => {
              const on = str === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set(q.id, on ? "" : opt)}
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

          {str === "Oui" && (
            <div className="space-y-2">
              <p className="font-mono text-xs text-rw-tertiary">Partagez votre logo / charte — joignez le fichier ou collez un lien.</p>
              <input
                className={INPUT}
                placeholder="Lien vers votre logo / charte (optionnel)"
                value={typeof answers[q.id + "_link"] === "string" ? (answers[q.id + "_link"] as string) : ""}
                onChange={(e) => set(q.id + "_link", e.target.value)}
              />
              <FileZone qid={q.id} files={files} addFiles={addFiles} removeFile={removeFile} />
            </div>
          )}

          {str === "Non" && (
            <div className="space-y-3 border-l-4 border-rw-orange bg-rw-orange/5 p-4">
              <p className="text-[15px] text-rw-black">Parfait — c'est notre métier. On peut créer votre identité de A à Z.</p>
              <div className="flex flex-wrap gap-2.5">
                {["Oui, créez mon identité", "On en parle ensemble"].map((opt) => {
                  const on = answers[q.id + "_branding"] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set(q.id + "_branding", on ? "" : opt)}
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
      )}

      {/* ── Pièces jointes ── */}
      {q.file && <FileZone qid={q.id} files={files} addFiles={addFiles} removeFile={removeFile} />}
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
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 border-2 border-rw-black px-4 py-2.5 text-sm font-medium transition-colors",
        on
          ? accent
            ? "bg-rw-orange text-rw-black"
            : "bg-rw-black text-rw-white"
          : "bg-white text-rw-black hover:bg-rw-paper-subtle",
      )}
    >
      {on && <Check className="size-3.5 shrink-0" />}
      {children}
    </button>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs text-rw-tertiary">{children}</p>;
}
