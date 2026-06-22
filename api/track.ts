import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/**
 * COOKED — ingestion des events du traceur first-party (cf. src/tracking/cooked.ts).
 *
 * Reçoit un batch { anonymous_id, session_id, attribution, events:[...] } et
 * l'écrit en UN fichier JSON dans un repo de DONNÉES GitHub.
 *
 * ⚠️ Jamais le repo de code (onboarding) : un push sur le repo connecté à Vercel
 * redéploierait le site à chaque visite. On vise donc le repo de données, comme
 * les leads de forfaits-flash-lead.ts.
 *
 * Variables d'environnement (Vercel) :
 *   GITHUB_TOKEN          — PAT fine-grained, accès Contents (RW) au repo de données
 *   TRACKING_REPO         — "owner/repo"  (défaut : NicolasRewolf/onboarding-responses)
 *   TRACKING_BRANCH       — branche       (défaut : main)
 *   TRACK_ALLOWED_ORIGINS — origines autorisées en plus du same-origin (CSV, facultatif)
 *
 * Note : stockage GitHub = pas de couche SQL/RPC. Pour la mesure cooked complète
 * (requêtes ad-hoc, CPI…), il faudra ingérer ces fichiers dans une base.
 */

const REPO = process.env.TRACKING_REPO || "NicolasRewolf/onboarding-responses";
const BRANCH = process.env.TRACKING_BRANCH || "main";
const API = "https://api.github.com";
const MAX_EVENTS = 100;

const EventSchema = z.object({}).passthrough();
const BatchSchema = z.object({
  anonymous_id: z.string().max(128).optional(),
  session_id: z.string().max(128).optional(),
  attribution: z.record(z.unknown()).nullable().optional(),
  events: z.array(EventSchema).optional().default([]),
});

const b64utf8 = (s: string) => Buffer.from(s, "utf-8").toString("base64");
const safeSlug = (s: string) =>
  (s || "anon").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 48) || "anon";

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function originAllowed(req: VercelRequest): boolean {
  const origin = (req.headers.origin as string) || "";
  if (!origin) return true; // beacon same-origin sans en-tête Origin
  const host = (req.headers.host as string) || "";
  try {
    if (new URL(origin).host === host) return true;
  } catch {
    /* ignore */
  }
  const allow = (process.env.TRACK_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allow.includes(origin);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = (req.headers.origin as string) || "";
  for (const [k, v] of Object.entries(corsHeaders(origin))) res.setHeader(k, v);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  if (!originAllowed(req)) return res.status(403).json({ ok: false, error: "forbidden_origin" });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ ok: false, error: "missing_github_token" });

  try {
    const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const parsed = BatchSchema.safeParse(raw);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_body" });

    const batch = parsed.data;
    const events = batch.events.slice(0, MAX_EVENTS);
    if (!events.length) return res.status(200).json({ ok: true, stored: 0 });

    const now = new Date();
    const day = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const stamp = now.toISOString().replace(/[:.]/g, "-");
    const sid = safeSlug(batch.session_id || "");
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `tracking/forfaits-flash/${day}/${stamp}-${sid}-${rand}.json`;

    const record = {
      received_at: now.toISOString(),
      ip_country: (req.headers["x-vercel-ip-country"] as string) || null,
      user_agent: (req.headers["user-agent"] as string) || null,
      anonymous_id: batch.anonymous_id || null,
      session_id: batch.session_id || null,
      attribution: batch.attribution || null,
      events,
    };

    const r = await fetch(`${API}/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "rewolf-onboarding",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `track: ${events.length} events (${sid})`,
        content: b64utf8(JSON.stringify(record, null, 2)),
        branch: BRANCH,
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ ok: false, error: `github_${r.status}`, detail: text.slice(0, 200) });
    }
    return res.status(200).json({ ok: true, stored: events.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "server_error" });
  }
}
