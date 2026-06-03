import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Download, Loader2 } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { ProgressRail } from "@/components/onboarding/ProgressRail";
import { QuestionBlock } from "@/components/onboarding/QuestionBlock";
import { Button } from "@/components/ui/button";
import {
  SECTIONS,
  TOTAL_Q,
  answeredCount,
  formatAnswer,
  isAnswered,
  missingEssentials,
  sectionAnswered,
  type Answers,
} from "@/lib/answers";
import { resolveClient } from "@/lib/clients";
import { clearDraft, loadDraft, saveDraft } from "@/lib/storage";
import { buildPayload } from "@/lib/report";
import { fileToBase64, submitOnboarding, type Attachment } from "@/lib/submit";
import { cn } from "@/lib/utils";

type Screen = "intro" | number | "review" | "done";
const MAX_FILE = 6 * 1024 * 1024;

export default function Onboarding() {
  const { slug = "client" } = useParams();
  const [params] = useSearchParams();
  const client = useMemo(() => resolveClient(slug, params), [slug, params]);

  const [answers, setAnswers] = useState<Answers>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [screen, setScreen] = useState<Screen>("intro");
  const [saved, setSaved] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Hydrate le brouillon
  useEffect(() => {
    setAnswers(loadDraft(client.slug));
    hydrated.current = true;
  }, [client.slug]);

  // Autosave (debounce)
  useEffect(() => {
    if (!hydrated.current) return;
    setSaved(false);
    const t = setTimeout(() => {
      saveDraft(client.slug, answers);
      setSaved(true);
    }, 400);
    return () => clearTimeout(t);
  }, [answers, client.slug]);

  const goTo = (s: Screen) => {
    setScreen(s);
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  };

  const set = (key: string, value: string | string[]) =>
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === "" || (Array.isArray(value) && value.length === 0)) delete next[key];
      else next[key] = value;
      return next;
    });

  const addFiles = (qid: string, list: FileList | null) => {
    if (!list?.length) return;
    setFiles((prev) => {
      const next = { ...prev, [qid]: [...(prev[qid] ?? []), ...Array.from(list)] };
      set(qid + "_files", next[qid].map((f) => f.name));
      return next;
    });
  };
  const removeFile = (qid: string, idx: number) =>
    setFiles((prev) => {
      const arr = [...(prev[qid] ?? [])];
      arr.splice(idx, 1);
      const next = { ...prev, [qid]: arr };
      set(qid + "_files", arr.map((f) => f.name));
      return next;
    });

  const answered = answeredCount(answers);
  const missing = missingEssentials(answers);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const attachments: Attachment[] = [];
      for (const [qid, list] of Object.entries(files)) {
        for (const f of list) {
          if (f.size <= MAX_FILE) attachments.push({ qid, name: f.name, b64: await fileToBase64(f) });
        }
      }
      const payload = buildPayload(client, answers, new Date().toLocaleString("fr-FR"));
      const res = await submitOnboarding(payload, attachments);
      if (!res.ok) throw new Error(res.error || "Échec de l'envoi");
      clearDraft(client.slug);
      goTo("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  function downloadReport() {
    const payload = buildPayload(client, answers, new Date().toLocaleString("fr-FR"));
    const blob = new Blob([payload.reportMarkdown], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cadrage-${client.slug}.md`;
    a.click();
  }

  const inStep = typeof screen === "number";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-rw-black bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Wordmark className="h-4 text-rw-black sm:h-[18px]" />
          <span className="hidden h-4 w-px bg-rw-line-subtle sm:block" />
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-rw-muted sm:block">
            Cadrage projet
          </span>
        </div>
        <SavePill saved={saved} answered={answered} />
      </header>

      {/* Mobile progress */}
      {inStep && (
        <div className="border-b-2 border-rw-black bg-white px-5 py-3 lg:hidden">
          <div className="h-2 border-2 border-rw-black">
            <div
              className="h-full bg-rw-orange transition-[width] duration-500"
              style={{ width: `${Math.round((answered / TOTAL_Q) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-rw-muted">
            <span>{SECTIONS[screen as number].t}</span>
            <span className="text-rw-black">Section {(screen as number) + 1} / 9</span>
          </div>
        </div>
      )}

      <div className="flex">
        {(inStep || screen === "review") && (
          <ProgressRail current={inStep ? (screen as number) : "review"} answers={answers} go={(i) => goTo(i)} />
        )}

        <main className="min-w-0 flex-1">
          {screen === "intro" && <Intro client={client} hasDraft={answered > 0} onStart={() => goTo(0)} answered={answered} />}

          {inStep && (
            <Step
              index={screen as number}
              answers={answers}
              files={files}
              set={set}
              addFiles={addFiles}
              removeFile={removeFile}
            />
          )}

          {screen === "review" && (
            <Review
              answers={answers}
              missing={missing}
              onEdit={(i) => goTo(i)}
              onBack={() => goTo(SECTIONS.length - 1)}
              onSubmit={submit}
              onDownload={downloadReport}
              submitting={submitting}
              error={error}
            />
          )}

          {screen === "done" && <Done client={client} onDownload={downloadReport} />}
        </main>
      </div>

      {/* Bottom nav (étapes) */}
      {inStep && (
        <div className="fixed inset-x-0 bottom-0 left-0 z-30 flex items-center justify-between gap-3 border-t-2 border-rw-black bg-white px-5 py-3 sm:px-8 lg:left-[300px]">
          <Button variant="rwOutline" onClick={() => ((screen as number) === 0 ? goTo("intro") : goTo((screen as number) - 1))}>
            <ArrowLeft className="size-4" /> Retour
          </Button>
          <span className="hidden font-mono text-xs text-rw-muted sm:block">
            Section <b className="text-rw-black">{(screen as number) + 1}</b> / 9 ·{" "}
            {sectionAnswered(SECTIONS[screen as number], answers)}/{SECTIONS[screen as number].qs.length}
          </span>
          <Button
            variant="rw"
            onClick={() => ((screen as number) === SECTIONS.length - 1 ? goTo("review") : goTo((screen as number) + 1))}
          >
            {(screen as number) === SECTIONS.length - 1 ? "Vérifier" : "Continuer"} <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Sous-écrans ─────────────────────────── */

function SavePill({ saved, answered }: { saved: boolean; answered: number }) {
  if (answered === 0) return <span className="font-mono text-[11px] text-rw-tertiary">Prêt</span>;
  return (
    <span className="flex items-center gap-2 font-mono text-[11px] text-rw-muted">
      <span className={cn("size-1.5", saved ? "bg-rw-success" : "bg-rw-orange")} />
      {saved ? "Enregistré" : "Enregistrement…"}
    </span>
  );
}

function Intro({
  client,
  hasDraft,
  onStart,
  answered,
}: {
  client: ReturnType<typeof resolveClient>;
  hasDraft: boolean;
  onStart: () => void;
  answered: number;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-24">
      <p className="rw-eyebrow text-rw-orange">Questionnaire de cadrage</p>
      <h1 className="mt-5 text-[clamp(2.6rem,7vw,4.5rem)] leading-[0.92]">
        Donnons à votre cabinet une présence à la&nbsp;<span className="text-rw-orange">hauteur</span>.
      </h1>
      <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-rw-muted">
        Avant de dessiner la moindre piste, on prend le temps de vous comprendre — votre cabinet, vos ambitions, votre
        clientèle, vos goûts. Vos réponses nous permettent de bâtir une proposition juste et un devis précis.
      </p>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-rw-tertiary">
        Répondez librement. Aucune question n'est piégée : ce qui est marqué « facultatif » peut tout à fait attendre.
      </p>

      <div className="mt-9 flex max-w-md items-center gap-4 border-2 border-rw-black bg-white p-4 shadow-[var(--shadow-hard)]">
        <div className="grid size-12 shrink-0 place-items-center bg-rw-orange font-bold text-rw-black">
          {client.name.replace(/^Me\s+/i, "").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold uppercase tracking-tight">{client.name}</p>
          <p className="text-[13px] text-rw-muted">
            {client.title ? `${client.title} · ` : ""}préparé par REWOLF Studio
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-rw-muted">
        <span>≈ 20–30 MIN</span>
        <span>52 QUESTIONS · 9 THÈMES</span>
        <span>ENREGISTREMENT AUTO</span>
      </div>

      <div className="mt-10">
        <Button variant="rw" size="lg" onClick={onStart}>
          {hasDraft ? `Reprendre (${answered}/${TOTAL_Q})` : "Commencer le questionnaire"} <ArrowRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}

function Step({
  index,
  answers,
  files,
  set,
  addFiles,
  removeFile,
}: {
  index: number;
  answers: Answers;
  files: Record<string, File[]>;
  set: (key: string, value: string | string[]) => void;
  addFiles: (qid: string, list: FileList | null) => void;
  removeFile: (qid: string, idx: number) => void;
}) {
  const s = SECTIONS[index];
  return (
    <div className="mx-auto max-w-2xl px-6 pb-32 pt-12 sm:px-8 sm:pt-16">
      <p className="rw-eyebrow text-rw-orange">
        Section {String(index + 1).padStart(2, "0")} — sur 09
      </p>
      <h2 className="mt-3 text-[clamp(1.9rem,4.5vw,2.8rem)]">{s.t}</h2>
      <p className="mt-3 max-w-lg text-[15px] text-rw-muted">{s.d}</p>

      <div className="mt-10 space-y-7">
        {s.qs.map((q) => (
          <QuestionBlock
            key={q.id}
            q={q}
            answers={answers}
            files={files[q.id] ?? []}
            set={set}
            addFiles={addFiles}
            removeFile={removeFile}
          />
        ))}
      </div>
    </div>
  );
}

function Review({
  answers,
  missing,
  onEdit,
  onBack,
  onSubmit,
  onDownload,
  submitting,
  error,
}: {
  answers: Answers;
  missing: ReturnType<typeof missingEssentials>;
  onEdit: (i: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  onDownload: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-12 sm:px-8 sm:pt-16">
      <p className="rw-eyebrow text-rw-orange">Dernière étape</p>
      <h2 className="mt-3 text-[clamp(2rem,5vw,3rem)]">Relisez, ajustez, envoyez.</h2>
      <p className="mt-3 max-w-lg text-[15px] text-rw-muted">
        Voici la synthèse de vos réponses. Vous pouvez encore modifier chaque section avant de nous l'envoyer.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s, i) => (
          <section key={i} className="border-2 border-rw-black">
            <div className="flex items-center justify-between border-b-2 border-rw-black bg-rw-paper-subtle px-5 py-3">
              <h3 className="text-sm">
                {String(i + 1).padStart(2, "0")} · {s.t}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="font-mono text-[11px] uppercase tracking-wider text-rw-orange hover:underline"
              >
                Modifier
              </button>
            </div>
            <dl>
              {s.qs.map((q) => {
                const empty = !isAnswered(q, answers);
                return (
                  <div key={q.id} className="border-b border-rw-line-subtle px-5 py-3.5 last:border-b-0">
                    <dt className="text-[12px] text-rw-muted">
                      {q.n}. {q.label}
                    </dt>
                    <dd
                      className={cn(
                        "mt-1 whitespace-pre-wrap break-words text-[15px]",
                        empty && (q.p === "E" ? "italic text-rw-danger" : "italic text-rw-tertiary"),
                      )}
                    >
                      {empty ? (q.p === "E" ? "À compléter (essentiel)" : "Non renseigné") : formatAnswer(q, answers)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>

      {missing.length > 0 && (
        <div className="mt-8 flex gap-3 border-2 border-rw-orange bg-rw-orange/10 p-4">
          <AlertTriangle className="size-5 shrink-0 text-rw-orange" />
          <div>
            <p className="font-bold uppercase tracking-tight">
              {missing.length} question{missing.length > 1 ? "s" : ""} essentielle{missing.length > 1 ? "s" : ""} à compléter
            </p>
            <p className="mt-1 text-[14px] text-rw-muted">
              Vous pouvez tout de même envoyer — mais ces réponses nous aident à établir un devis plus précis.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-6 border-2 border-rw-danger bg-rw-danger/5 px-4 py-3 text-sm text-rw-danger">
          L'envoi a échoué : {error}. Vos réponses restent enregistrées sur cet appareil.
        </p>
      )}

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Button variant="rw" size="lg" onClick={onSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
          {submitting ? "Envoi…" : "Envoyer à REWOLF"}
        </Button>
        <Button variant="rwOutline" onClick={onBack}>
          Revenir au questionnaire
        </Button>
        <Button variant="ghost" onClick={onDownload}>
          <Download className="size-4" /> Télécharger
        </Button>
      </div>
    </div>
  );
}

function Done({ client, onDownload }: { client: ReturnType<typeof resolveClient>; onDownload: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center sm:py-32">
      <div className="mx-auto grid size-20 place-items-center border-2 border-rw-black bg-rw-orange shadow-[var(--shadow-hard)]">
        <Check className="size-10 text-rw-black" strokeWidth={3} />
      </div>
      <h1 className="mt-8 text-[clamp(2.2rem,6vw,3.4rem)]">
        Merci, <span className="text-rw-orange">Maître</span>.
      </h1>
      <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-rw-muted">
        Vos réponses nous sont parvenues. C'est exactement ce qu'il nous faut pour vous préparer une proposition
        sur-mesure et un devis précis. Nous revenons vers vous très vite.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button variant="rwOutline" onClick={onDownload}>
          <Download className="size-4" /> Télécharger une copie
        </Button>
        <Button variant="rwDark" asChild>
          <a href={`mailto:nicolas@rewolf.studio?subject=${encodeURIComponent(`Cadrage — ${client.name}`)}`}>
            Écrire à REWOLF
          </a>
        </Button>
      </div>
    </div>
  );
}
