import { type Question } from "@/lib/questionnaire";
import { type Answers } from "@/lib/answers";
import { Field } from "./Field";
import { cn } from "@/lib/utils";

interface Props {
  q: Question;
  answers: Answers;
  files: File[];
  set: (key: string, value: string | string[]) => void;
  addFiles: (qid: string, list: FileList | null) => void;
  removeFile: (qid: string, idx: number) => void;
}

export function QuestionBlock({ q, answers, files, set, addFiles, removeFile }: Props) {
  return (
    <div className="border-t-2 border-rw-line-subtle pt-7">
      <div className="flex gap-4">
        <span className="min-w-[30px] shrink-0 pt-1 font-mono text-sm font-semibold tabular-nums text-rw-orange">
          {String(q.n).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <label className="text-[17px] font-medium leading-snug text-rw-black">{q.label}</label>
            <span
              className={cn(
                "shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider",
                q.p === "E" ? "bg-rw-orange px-2 py-0.5 text-rw-black" : "text-rw-tertiary",
              )}
            >
              {q.p === "E" ? "Essentiel" : "Facultatif"}
            </span>
          </div>
          {q.why && (
            <p className="mt-2 flex gap-2 text-[13px] leading-relaxed text-rw-muted">
              <span className="shrink-0 translate-y-px text-rw-orange">◆</span>
              <span>{q.why}</span>
            </p>
          )}
          <div className="mt-4">
            <Field q={q} answers={answers} files={files} set={set} addFiles={addFiles} removeFile={removeFile} />
          </div>
        </div>
      </div>
    </div>
  );
}
