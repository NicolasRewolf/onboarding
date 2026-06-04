import { useEffect, useRef, useState } from "react";
import { type ClientInfo } from "./clients";
import { type Question, type Questionnaire } from "./questionnaire";
import { type Answers, answeredCount, missingEssentials } from "./answers";
import { aux } from "./fieldTypes";
import { clearDraft, loadDraft, saveDraft } from "./storage";
import { buildPayload } from "./report";
import { submitOnboarding } from "./submit";
import { prepareAttachments } from "./attachments";

export type Screen = "intro" | number | "review" | "done";

export interface CadrageSession {
  answers: Answers;
  files: Record<string, File[]>;
  screen: Screen;
  saved: boolean;
  submitting: boolean;
  error: string | null;
  answered: number;
  missing: Question[];
  set: (key: string, value: string | string[]) => void;
  addFiles: (qid: string, list: FileList | null) => void;
  removeFile: (qid: string, idx: number) => void;
  goTo: (s: Screen) => void;
  submit: () => Promise<void>;
  downloadReport: () => void;
}

/**
 * Toute la logique d'un cadrage en cours, derrière une petite interface — testable
 * sans rendre React. La page n'est plus qu'un adapter de présentation par-dessus.
 */
export function useCadrageSession(client: ClientInfo, qn: Questionnaire): CadrageSession {
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
      set(aux(qid, "files"), next[qid].map((f) => f.name));
      return next;
    });
  };
  const removeFile = (qid: string, idx: number) =>
    setFiles((prev) => {
      const arr = [...(prev[qid] ?? [])];
      arr.splice(idx, 1);
      const next = { ...prev, [qid]: arr };
      set(aux(qid, "files"), arr.map((f) => f.name));
      return next;
    });

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const { included, skipped } = await prepareAttachments(files);
      const payload = buildPayload(qn, client, answers, new Date().toLocaleString("fr-FR"), skipped);
      const res = await submitOnboarding(payload, included);
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
    const payload = buildPayload(qn, client, answers, new Date().toLocaleString("fr-FR"));
    const blob = new Blob([payload.reportMarkdown], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cadrage-${client.slug}.md`;
    a.click();
  }

  return {
    answers,
    files,
    screen,
    saved,
    submitting,
    error,
    answered: answeredCount(qn, answers),
    missing: missingEssentials(qn, answers),
    set,
    addFiles,
    removeFile,
    goTo,
    submit,
    downloadReport,
  };
}
