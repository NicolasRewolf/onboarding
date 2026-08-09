// Seam réseau de la feature crémaillère. Le front ne parle qu'à /api/cremaillere ;
// le token GitHub et le dépôt privé restent côté serveur (cf. api/cremaillere.ts).
// En dev (vite), les fonctions Vercel ne tournent pas : on bascule sur un état
// simulé en mémoire vive pour que la page reste entièrement jouable en preview.

import type { VoteCategory } from "./data";

export interface PartyGuest {
  id: string;
  firstName: string;
  astro: string;
  avatar?: string;
}

export interface PartyState {
  updatedAt: string;
  guests: PartyGuest[];
  declineCount: number;
  kidsTotal: number;
  votes: Record<VoteCategory, Record<string, number>>;
  bring: { chaises: number; tableBasse: number; autres: string[] };
}

export interface RsvpInput {
  kind: "rsvp";
  id: string;
  firstName: string;
  lastName: string;
  astro: string;
  email?: string;
  avatar?: string;
  kids: number;
  bring: { chaises: number; tableBasse: number; autre: string };
  votes: Record<VoteCategory, string[]>;
  par?: string;
}

export interface ApiResult {
  ok: boolean;
  state?: PartyState;
  error?: string;
}

export const emptyPartyState = (): PartyState => ({
  updatedAt: new Date().toISOString(),
  guests: [],
  declineCount: 0,
  kidsTotal: 0,
  votes: { dates: {}, drinks: {}, apero: {}, entrees: {}, plats: {}, desserts: {} },
  bring: { chaises: 0, tableBasse: 0, autres: [] },
});

/* ── Mock dev : trois invités fictifs pour voir le mur et les jauges vivre ── */

const DEV = import.meta.env.DEV;

const mockAvatar = (initial: string, bg: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${bg}"/><text x="48" y="62" font-family="sans-serif" font-size="44" font-weight="800" fill="#0A0A0A" text-anchor="middle">${initial}</text></svg>`,
  )}`;

function seedMock(): PartyState {
  return {
    updatedAt: new Date().toISOString(),
    guests: [
      { id: "manon-demo", firstName: "Manon", astro: "scorpion", avatar: mockAvatar("M", "#FF4F04") },
      { id: "theo-demo", firstName: "Théo", astro: "lion", avatar: mockAvatar("T", "#F4F2EC") },
      { id: "ines-demo", firstName: "Inès", astro: "poissons", avatar: mockAvatar("I", "#FF4F04") },
    ],
    declineCount: 2,
    kidsTotal: 1,
    votes: {
      dates: { "2026-10-17": 3, "2026-10-24": 2, "2026-10-31": 1, "2026-12-05": 1 },
      drinks: { biere: 2, spritz: 3, "rhum-arrange": 1, "sans-alcool": 1 },
      apero: { planches: 3, houmous: 1, tapas: 2 },
      entrees: { burrata: 2, "tarte-fine": 2, ceviche: 1 },
      plats: { lasagnes: 2, raclette: 3, curry: 1 },
      desserts: { fondant: 3, tiramisu: 2, pavlova: 1 },
    },
    bring: { chaises: 6, tableBasse: 1, autres: ["Théo : une enceinte qui envoie"] },
  };
}

let mockState: PartyState | null = null;
const getMock = () => (mockState ??= seedMock());

function mockApplyRsvp(input: RsvpInput): PartyState {
  const s = getMock();
  const prev = s.guests.find((g) => g.id === input.id);
  const already = Boolean(prev);
  const next: PartyState = {
    ...s,
    updatedAt: new Date().toISOString(),
    guests: already
      ? s.guests.map((g) =>
          g.id === input.id ? { id: input.id, firstName: input.firstName, astro: input.astro, avatar: input.avatar } : g,
        )
      : [...s.guests, { id: input.id, firstName: input.firstName, astro: input.astro, avatar: input.avatar }],
    votes: { ...s.votes },
  };
  // En mock on ne stocke pas les fiches : on incrémente naïvement (suffisant pour la démo).
  if (!already) {
    for (const cat of Object.keys(input.votes) as VoteCategory[]) {
      next.votes[cat] = { ...next.votes[cat] };
      for (const slug of input.votes[cat]) next.votes[cat][slug] = (next.votes[cat][slug] || 0) + 1;
    }
    next.kidsTotal += input.kids;
    next.bring = {
      chaises: next.bring.chaises + input.bring.chaises,
      tableBasse: next.bring.tableBasse + input.bring.tableBasse,
      autres: input.bring.autre ? [...next.bring.autres, `${input.firstName} : ${input.bring.autre}`] : next.bring.autres,
    };
  }
  mockState = next;
  return next;
}

/* ── API publique du seam ── */

export async function fetchPartyState(): Promise<PartyState | null> {
  if (DEV) return getMock();
  try {
    const res = await fetch("/api/cremaillere");
    if (!res.ok) return null;
    const data = (await res.json()) as { state?: PartyState };
    return data.state ?? null;
  } catch {
    return null;
  }
}

export async function submitRsvp(input: RsvpInput): Promise<ApiResult> {
  if (DEV) return { ok: true, state: mockApplyRsvp(input) };
  try {
    const res = await fetch("/api/cremaillere", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as { state?: PartyState; error?: string };
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, state: data.state };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

export async function submitDecline(): Promise<ApiResult> {
  if (DEV) {
    const s = getMock();
    mockState = { ...s, declineCount: s.declineCount + 1, updatedAt: new Date().toISOString() };
    return { ok: true, state: mockState };
  }
  try {
    const res = await fetch("/api/cremaillere", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "decline" }),
    });
    const data = (await res.json().catch(() => ({}))) as { state?: PartyState; error?: string };
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, state: data.state };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}
