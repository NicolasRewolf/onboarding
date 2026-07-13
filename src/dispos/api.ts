// Seam réseau de la feature dispos. Le front ne parle qu'à /api/dispos ; le token
// GitHub et le dépôt privé restent côté serveur (cf. api/dispos.ts).

export interface DispoRecord {
  personId: string;
  person: string;
  role?: string;
  slots: string[];
  note?: string;
  updatedAt?: string;
}

export interface SubmitDispoInput {
  event: string;
  personId: string;
  person: string;
  role?: string;
  slots: string[];
  note?: string;
  expectedTotal?: number;
}

export interface SubmitResult {
  ok: boolean;
  responded?: number;
  error?: string;
}

export async function submitDispos(input: SubmitDispoInput): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/dispos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as { responded?: number; error?: string };
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, responded: data.responded };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

/** Récupère la réponse d'une seule personne (pré-remplissage à la ré-ouverture du lien). */
export async function fetchMyDispos(event: string, personId: string): Promise<DispoRecord | null> {
  try {
    const res = await fetch(
      `/api/dispos?event=${encodeURIComponent(event)}&person=${encodeURIComponent(personId)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { record?: DispoRecord | null };
    return data.record ?? null;
  } catch {
    return null;
  }
}

export interface RecapResult {
  ok: boolean;
  responses?: DispoRecord[];
  error?: string;
  needsKey?: boolean;
}

/** Agrégat de toutes les réponses (page récap). `key` = clé facultative si le récap est protégé. */
export async function fetchRecap(event: string, key?: string): Promise<RecapResult> {
  try {
    const qs = new URLSearchParams({ event });
    if (key) qs.set("k", key);
    const res = await fetch(`/api/dispos?${qs.toString()}`);
    const data = (await res.json().catch(() => ({}))) as {
      responses?: DispoRecord[];
      error?: string;
    };
    if (res.status === 401) return { ok: false, needsKey: true, error: data.error };
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, responses: data.responses ?? [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}
