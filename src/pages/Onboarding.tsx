import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Download, Loader2 } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { ProgressRail } from "@/onboarding/components/ProgressRail";
import { QuestionBlock } from "@/onboarding/components/QuestionBlock";
import { Button } from "@/components/ui/button";
import { formatAnswer, isAnswered, sectionAnswered, type Answers } from "@/onboarding/answers";
import { resolveQuestionnaire, type Question, type Questionnaire } from "@/onboarding/questionnaire";
import { resolveClient, type ClientInfo } from "@/onboarding/clients";
import { useCadrageSession } from "@/onboarding/useCadrageSession";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const { slug = "client" } = useParams();
  const [params] = useSearchParams();
  const client = useMemo(() => resolveClient(slug, params), [slug, params]);
  const qn = useMemo(() => resolveQuestionnaire(client.questionnaire), [client.questionnaire]);
  const s = useCadrageSession(client, qn);
  const inStep = typeof s.screen === "number";
  const step = s.screen as number;
  const nbSections = qn.sections.length;

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
        <SavePill saved={s.saved} answered={s.answered} />
      </header>

      {/* Mobile progress */}
      {inStep && (
        <div className="border-b-2 border-rw-black bg-white px-5 py-3 lg:hidden">
          <div className="h-2 border-2 border-rw-black">
            <div
              className="h-full bg-rw-orange transition-[width] duration-500"
              style={{ width: `${Math.round((s.answered / qn.total) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-rw-muted">
            <span>{qn.sections[step].t}</span>
            <span className="text-rw-black">
              Section {step + 1} / {nbSections}
            </span>
          </div>
        </div>
      )}

      <div className="flex">
        {(inStep || s.screen === "review") && (
          <ProgressRail qn={qn} current={inStep ? step : "review"} answers={s.answers} go={(i) => s.goTo(i)} />
        )}

        <main className="min-w-0 flex-1">
          {s.screen === "intro" && (
            <Intro qn={qn} client={client} hasDraft={s.answered > 0} onStart={() => s.goTo(0)} answered={s.answered} />
          )}

          {inStep && (
            <Step
              qn={qn}
              index={step}
              answers={s.answers}
              files={s.files}
              set={s.set}
              addFiles={s.addFiles}
              removeFile={s.removeFile}
            />
          )}

          {s.screen === "review" && (
            <Review
              qn={qn}
              answers={s.answers}
              missing={s.missing}
              onEdit={(i) => s.goTo(i)}
              onBack={() => s.goTo(nbSections - 1)}
              onSubmit={s.submit}
              onDownload={s.downloadReport}
              submitting={s.submitting}
              error={s.error}
            />
          )}

          {s.screen === "done" && <Done client={client} tone={qn.tone} onDownload={s.downloadReport} />}
        </main>
      </div>

      {/* Bottom nav (étapes) */}
      {inStep && (
        <div className="fixed inset-x-0 bottom-0 left-0 z-30 flex items-center justify-between gap-3 border-t-2 border-rw-black bg-white px-5 py-3 sm:px-8 lg:left-[300px]">
          <Button variant="rwOutline" onClick={() => (step === 0 ? s.goTo("intro") : s.goTo(step - 1))}>
            <ArrowLeft className="size-4" /> Retour
          </Button>
          <span className="hidden font-mono text-xs text-rw-muted sm:block">
            Section <b className="text-rw-black">{step + 1}</b> / {nbSections} ·{" "}
            {sectionAnswered(qn.sections[step], s.answers)}/{qn.sections[step].qs.length}
          </span>
          <Button variant="rw" onClick={() => (step === nbSections - 1 ? s.goTo("review") : s.goTo(step + 1))}>
            {step === nbSections - 1 ? "Vérifier" : "Continuer"} <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Présentation ─────────────────────────── */

/** "Me Jacques Derieux" → "Maître Derieux" ; sinon le nom tel quel. */
function salutation(name: string): string {
  const m = name.match(/^M(?:e|aître)\.?\s+(.+)$/i);
  if (m) {
    const parts = m[1].trim().split(/\s+/).filter(Boolean);
    return "Maître " + parts[parts.length - 1];
  }
  return name;
}

/** Choisit la formulation selon le ton du questionnaire (vouvoiement / tutoiement). */
const T = (tone: "vous" | "tu", vous: string, tu: string): string => (tone === "tu" ? tu : vous);

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
  qn,
  client,
  hasDraft,
  onStart,
  answered,
}: {
  qn: Questionnaire;
  client: ClientInfo;
  hasDraft: boolean;
  onStart: () => void;
  answered: number;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col justify-center px-6 py-10 sm:px-8">
      <p className="rw-eyebrow text-rw-orange">Questionnaire de cadrage</p>
      <h1 className="mt-4 text-[clamp(2.1rem,6vw,3.9rem)] leading-[0.94]">
        <span className="text-rw-orange">{salutation(client.name)}</span>, {qn.tagline}
      </h1>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-rw-muted">
        {T(
          qn.tone,
          "Avant de dessiner la moindre piste, on prend le temps de vous comprendre. Répondez librement — ce qui est marqué « facultatif » peut tout à fait attendre. Vos réponses nous permettent un devis juste et précis.",
          "Avant de dessiner la moindre piste, on prend le temps de te comprendre. Réponds librement — ce qui est marqué « facultatif » peut tout à fait attendre. Tes réponses nous permettent un devis juste et précis.",
        )}
      </p>

      <div className="mt-6 flex max-w-md items-center gap-4 border-2 border-rw-black bg-white p-4 shadow-[var(--shadow-hard)]">
        <div className="grid size-12 shrink-0 place-items-center bg-rw-orange font-bold text-rw-black">
          {client.name.replace(/^Me\s+/i, "").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold uppercase tracking-tight">{client.name}</p>
          <p className="text-[13px] text-rw-muted">{client.title ? `${client.title} · ` : ""}préparé par REWOLF Studio</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-rw-muted">
        <span>≈ 15–25 MIN</span>
        <span>
          {qn.total} QUESTIONS · {qn.sections.length} THÈMES
        </span>
        <span>ENREGISTREMENT AUTO</span>
      </div>

      <div className="mt-8">
        <Button variant="rw" size="lg" onClick={onStart}>
          {hasDraft ? `Reprendre (${answered}/${qn.total})` : "Commencer le questionnaire"} <ArrowRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}

function Step({
  qn,
  index,
  answers,
  files,
  set,
  addFiles,
  removeFile,
}: {
  qn: Questionnaire;
  index: number;
  answers: Answers;
  files: Record<string, File[]>;
  set: (key: string, value: string | string[]) => void;
  addFiles: (qid: string, list: FileList | null) => void;
  removeFile: (qid: string, idx: number) => void;
}) {
  const sec = qn.sections[index];
  return (
    <div className="mx-auto max-w-2xl px-6 pb-32 pt-12 sm:px-8 sm:pt-16">
      <p className="rw-eyebrow text-rw-orange">
        Section {String(index + 1).padStart(2, "0")} — sur {String(qn.sections.length).padStart(2, "0")}
      </p>
      <h2 className="mt-3 text-[clamp(1.9rem,4.5vw,2.8rem)]">{sec.t}</h2>
      <p className="mt-3 max-w-lg text-[15px] text-rw-muted">{sec.d}</p>

      <div className="mt-10 space-y-7">
        {sec.qs.map((q) => (
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
  qn,
  answers,
  missing,
  onEdit,
  onBack,
  onSubmit,
  onDownload,
  submitting,
  error,
}: {
  qn: Questionnaire;
  answers: Answers;
  missing: Question[];
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
        {T(
          qn.tone,
          "Voici la synthèse de vos réponses. Vous pouvez encore modifier chaque section avant de nous l'envoyer.",
          "Voici la synthèse de tes réponses. Tu peux encore modifier chaque section avant de nous l'envoyer.",
        )}
      </p>

      <div className="mt-10 space-y-8">
        {qn.sections.map((sec, i) => (
          <section key={i} className="border-2 border-rw-black">
            <div className="flex items-center justify-between border-b-2 border-rw-black bg-rw-paper-subtle px-5 py-3">
              <h3 className="text-sm">
                {String(i + 1).padStart(2, "0")} · {sec.t}
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
              {sec.qs.map((q) => {
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
              {T(
                qn.tone,
                "Vous pouvez tout de même envoyer — mais ces réponses nous aident à établir un devis plus précis.",
                "Tu peux tout de même envoyer — mais ces réponses nous aident à établir un devis plus précis.",
              )}
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-6 border-2 border-rw-danger bg-rw-danger/5 px-4 py-3 text-sm text-rw-danger">
          L'envoi a échoué : {error}.{" "}
          {T(qn.tone, "Vos réponses restent enregistrées sur cet appareil.", "Tes réponses restent enregistrées sur cet appareil.")}
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

function Done({ client, tone, onDownload }: { client: ClientInfo; tone: "vous" | "tu"; onDownload: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center sm:py-32">
      <div className="mx-auto grid size-20 place-items-center border-2 border-rw-black bg-rw-orange shadow-[var(--shadow-hard)]">
        <Check className="size-10 text-rw-black" strokeWidth={3} />
      </div>
      <h1 className="mt-8 text-[clamp(2.2rem,6vw,3.4rem)]">
        Merci, <span className="text-rw-orange">infiniment</span>.
      </h1>
      <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-rw-muted">
        {T(
          tone,
          "Vos réponses nous sont parvenues. C'est exactement ce qu'il nous faut pour vous préparer une proposition sur-mesure et un devis précis. Nous revenons vers vous très vite.",
          "Tes réponses nous sont parvenues. C'est exactement ce qu'il nous faut pour te préparer une proposition sur-mesure et un devis précis. On revient vers toi très vite.",
        )}
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
