import { Check } from "lucide-react";
import { type Questionnaire } from "@/lib/questionnaire";
import { answeredCount, sectionComplete, type Answers } from "@/lib/answers";
import { cn } from "@/lib/utils";

interface Props {
  qn: Questionnaire;
  current: number | "review";
  answers: Answers;
  go: (i: number) => void;
}

export function ProgressRail({ qn, current, answers, go }: Props) {
  const answered = answeredCount(qn, answers);
  const pct = Math.round((answered / qn.total) * 100);

  return (
    <aside className="hidden w-[300px] shrink-0 border-r-2 border-rw-black lg:block">
      <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col overflow-y-auto px-7 py-8">
        {/* Progression */}
        <div className="mb-8">
          <div className="flex items-end justify-between">
            <span className="rw-eyebrow text-rw-muted">Progression</span>
            <span className="font-mono text-sm font-semibold tabular-nums">{pct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tabular-nums leading-none">{answered}</span>
            <span className="font-mono text-sm text-rw-tertiary">/ {qn.total}</span>
          </div>
          <div className="mt-3 h-2.5 border-2 border-rw-black">
            <div className="h-full bg-rw-orange transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Sections */}
        <nav className="flex flex-col gap-1">
          {qn.sections.map((s, i) => {
            const active = current === i;
            const done = sectionComplete(s, answers);
            return (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  active ? "bg-rw-black text-rw-white" : "hover:bg-rw-paper-subtle",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[11px] font-semibold tabular-nums",
                    active ? "text-rw-orange" : "text-rw-tertiary",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-[13.5px] leading-tight">{s.t}</span>
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center border",
                    done ? "border-rw-orange bg-rw-orange" : active ? "border-rw-white/40" : "border-rw-line-subtle",
                  )}
                >
                  {done && <Check className="size-2.5 text-rw-black" strokeWidth={3.5} />}
                </span>
              </button>
            );
          })}
        </nav>

        <p className="mt-auto pt-6 font-mono text-[11px] leading-relaxed text-rw-tertiary">
          Brouillon enregistré
          <br />
          automatiquement sur cet appareil.
        </p>
      </div>
    </aside>
  );
}
