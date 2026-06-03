import { type SubmissionPayload } from "./report";

export interface Attachment {
  name: string;
  qid: string;
  b64: string; // contenu encodé base64 (sans préfixe data:)
}

export interface SubmitResult {
  ok: boolean;
  url?: string; // lien vers le rapport committé
  error?: string;
}

export async function submitOnboarding(
  payload: SubmissionPayload,
  attachments: Attachment[] = [],
): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, attachments }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, url: data.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

/** Lit un File en base64 (sans le préfixe data:…;base64,). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
