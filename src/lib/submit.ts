import { type SubmissionPayload } from "./report";
import { type Attachment } from "./attachments";

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
