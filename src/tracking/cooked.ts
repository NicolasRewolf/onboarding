/**
 * COOKED — traceur first-party, cookieless, RGPD-exempt.
 *
 * Port du traceur jplouton (github.com/NicolasRewolf/cooked · wix/tracker.html,
 * Sprint 38) vers l'app onboarding (Vite / React 19 / Vercel).
 *
 * Différences clés avec la version Wix d'origine :
 *  - Endpoint     : POST /api/track (route Vercel) au lieu du proxy Velo
 *                   /_functions/track.
 *  - Stockage     : fichiers JSON dans un repo GitHub de données (PAS Supabase) —
 *                   cf. api/track.ts.
 *  - Flush        : UNE fois par page (au départ de la page), pas toutes les 30 s.
 *                   Chaque flush = une écriture GitHub → on garde ~1 écriture par
 *                   page vue. Le temps réel est sacrifié (sans intérêt pour de la
 *                   mesure marketing) au profit d'un volume de commits tenable.
 *  - Navigation   : pilotée par react-router (CookedTracker.tsx) au lieu du
 *                   monkeypatch history.pushState/replaceState.
 *  - Attribution  : capturée au PREMIER contact de la session (utm_*, gclid,
 *                   referrer, landing) puis persistée → reste disponible à la
 *                   conversion même après une navigation interne qui efface la
 *                   query. cookedContext() la renvoie pour le formulaire de devis.
 *  - Retiré (spécifique Wix) : exposeIds()/replaceState, fallbacks anchor-menu
 *                   Wix (§4b/§4c), garde anti-Cookiebot.
 *
 * Vie privée : anonymous_id = UUID aléatoire local (localStorage), jamais une
 * donnée personnelle — modèle « mesure d'audience exemptée » CNIL, comme
 * Plausible/Fathom. Aucun cookie, aucun bandeau.
 */

declare global {
  interface Window {
    __cookedLoaded?: boolean;
  }
}

const ENDPOINT = "/api/track";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min d'inactivité → nouvelle session
const ENGAGEMENT_TICK_MS = 10 * 1000; // agrège le temps actif toutes les 10 s
const IDLE_THRESHOLD_MS = 30 * 1000; // 30 s sans input = inactif
const SCROLL_DEBOUNCE_MS = 200;
const COOKED_VERSION = "rewolf-onboarding-v1";

type Props = Record<string, unknown>;

interface Attribution {
  sid: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  referrer: string | null;
  landing_path: string;
  landing_url: string;
  ts: string;
}

function rid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Identité : anonymous_id stable (localStorage → sessionStorage → volatile) ──
let _cachedAid: string | null = null;
function getAnonymousId(): string {
  if (_cachedAid) return _cachedAid;
  try {
    const KEY = "_ckd_aid";
    let aid = localStorage.getItem(KEY);
    if (!aid || aid.length < 8) {
      aid = rid() + rid();
      localStorage.setItem(KEY, aid);
    }
    _cachedAid = aid;
    return aid;
  } catch {
    try {
      let aid2 = sessionStorage.getItem("_ckd_aid");
      if (!aid2 || aid2.length < 8) {
        aid2 = rid() + rid();
        sessionStorage.setItem("_ckd_aid", aid2);
      }
      _cachedAid = aid2;
    } catch {
      _cachedAid = rid() + rid();
    }
    return _cachedAid;
  }
}

// ── Session : id persistant, fenêtre glissante de 30 min ──
let _sessionLastWrite = 0;
function getSessionId(): string {
  try {
    const KEY = "_ckd";
    const now = Date.now();
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as { id: string; start: number; last: number };
      if (s && s.id && now - s.last < SESSION_TIMEOUT_MS) {
        s.last = now;
        if (now - _sessionLastWrite > 5000) {
          localStorage.setItem(KEY, JSON.stringify(s));
          _sessionLastWrite = now;
        }
        return s.id;
      }
    }
    const ns = { id: rid(), start: now, last: now };
    localStorage.setItem(KEY, JSON.stringify(ns));
    _sessionLastWrite = now;
    return ns.id;
  } catch {
    try {
      const raw2 = sessionStorage.getItem("_ckd");
      const now2 = Date.now();
      if (raw2) {
        const s2 = JSON.parse(raw2) as { id: string; last: number };
        if (s2 && s2.id && now2 - s2.last < SESSION_TIMEOUT_MS) {
          s2.last = now2;
          sessionStorage.setItem("_ckd", JSON.stringify({ ...s2, last: now2 }));
          return s2.id;
        }
      }
      const ns2 = { id: rid(), start: now2, last: now2 };
      sessionStorage.setItem("_ckd", JSON.stringify(ns2));
      return ns2.id;
    } catch {
      return rid();
    }
  }
}

function parseQuery(): Record<string, string> {
  const out: Record<string, string> = {};
  const q = location.search.replace(/^\?/, "");
  if (!q) return out;
  q.split("&").forEach((kv) => {
    const i = kv.indexOf("=");
    if (i < 0) return;
    try {
      out[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
    } catch {
      /* ignore */
    }
  });
  return out;
}

// ── Attribution premier-contact, persistée par session ──
function getAttribution(): Attribution {
  const sid = getSessionId();
  try {
    const raw = localStorage.getItem("_ckd_attr");
    if (raw) {
      const a = JSON.parse(raw) as Attribution;
      if (a && a.sid === sid) return a;
    }
  } catch {
    /* ignore */
  }
  const qp = parseQuery();
  const attr: Attribution = {
    sid,
    utm_source: qp.utm_source || null,
    utm_medium: qp.utm_medium || null,
    utm_campaign: qp.utm_campaign || null,
    utm_term: qp.utm_term || null,
    utm_content: qp.utm_content || null,
    gclid: qp.gclid || null,
    gbraid: qp.gbraid || null,
    wbraid: qp.wbraid || null,
    referrer: document.referrer || null,
    landing_path: location.pathname || "/",
    landing_url: location.href,
    ts: new Date().toISOString(),
  };
  try {
    localStorage.setItem("_ckd_attr", JSON.stringify(attr));
  } catch {
    /* ignore */
  }
  return attr;
}

function basePayload(): Props {
  const qp = parseQuery();
  return {
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    url: location.href,
    path: location.pathname || "/",
    title: document.title || null,
    referrer: document.referrer || null,
    utm_source: qp.utm_source || null,
    utm_medium: qp.utm_medium || null,
    utm_campaign: qp.utm_campaign || null,
    utm_term: qp.utm_term || null,
    utm_content: qp.utm_content || null,
    gclid: qp.gclid || null,
    viewport_width: window.innerWidth || 0,
    viewport_height: window.innerHeight || 0,
    occurred_at: new Date().toISOString(),
  };
}

// ── File d'événements : flush 1×/page (départ de page) ou conversion immédiate ──
const queue: Props[] = [];

function transmit(body: string): void {
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    } catch {
      /* fallthrough vers fetch */
    }
  }
  try {
    void fetch(ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body,
    });
  } catch {
    /* best-effort */
  }
}

function flush(): void {
  if (!queue.length) return;
  const batch = queue.splice(0, 50);
  transmit(
    JSON.stringify({
      anonymous_id: getAnonymousId(),
      session_id: getSessionId(),
      attribution: getAttribution(),
      events: batch,
    }),
  );
  if (queue.length) flush();
}

/** Force l'envoi immédiat de la file (ex. juste après une conversion). */
export function flushNow(): void {
  flush();
}

function enqueue(name: string, props?: Props, immediate = false): void {
  const p = basePayload();
  p.name = name;
  p.props = { ...(props || {}), _v: COOKED_VERSION };
  queue.push(p);
  if (immediate || queue.length >= 50) flush();
}

/** Événement manuel (ex. form_submit côté client). `immediate` flush tout de suite. */
export function trackEvent(name: string, props?: Props, immediate = false): void {
  enqueue(name, props, immediate);
}

/**
 * Contexte d'attribution à joindre à la conversion (formulaire de devis).
 * Lisible à tout moment, y compris après navigation interne.
 */
export function cookedContext() {
  const a = getAttribution();
  return {
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    utm_source: a.utm_source,
    utm_medium: a.utm_medium,
    utm_campaign: a.utm_campaign,
    utm_term: a.utm_term,
    utm_content: a.utm_content,
    gclid: a.gclid,
    gbraid: a.gbraid,
    wbraid: a.wbraid,
    referrer: a.referrer,
    landing_path: a.landing_path,
    landing_url: a.landing_url,
  };
}

// ── 2. Scroll depth (25/50/75/100 %) ──
let scrollHits: Record<number, boolean> = { 25: false, 50: false, 75: false, 100: false };
let maxScroll = 0;

function computeScrollPct(): number {
  const doc = document.documentElement;
  const body = document.body;
  const scrolled = (window.scrollY || doc.scrollTop || 0) + window.innerHeight;
  const height = Math.max(
    doc.scrollHeight,
    doc.offsetHeight,
    body ? body.scrollHeight : 0,
    body ? body.offsetHeight : 0,
  );
  if (!height) return 0;
  return Math.min(100, Math.round((scrolled / height) * 100));
}

function onScroll(): void {
  const pct = computeScrollPct();
  if (pct > maxScroll) maxScroll = pct;
  [25, 50, 75, 100].forEach((t) => {
    if (!scrollHits[t] && pct >= t) {
      scrollHits[t] = true;
      enqueue("scroll_depth", { percent: t });
    }
  });
}

// ── 3. Engagement (temps actif seulement) ──
let lastActivity = Date.now();
let lastTick = Date.now();
let activeMs = 0;
let totActiveMs = 0;

// ── 5. Core Web Vitals (LCP, CLS, INP, TTFB) ──
const vitals = { lcp: 0, cls: 0, inp: 0, ttfb: 0 };
let vitEmitted: Record<string, boolean> = { LCP: false, CLS: false, INP: false, TTFB: false };
let lcpObs: PerformanceObserver | null = null;
let clsObs: PerformanceObserver | null = null;
let inpObs: PerformanceObserver | null = null;
let clsValue = 0;
let clsEntries: PerformanceEntry[] = [];

function emitVital(metric: string, value: number): void {
  if (vitEmitted[metric]) return;
  vitEmitted[metric] = true;
  enqueue("web_vitals", { metric, value: Math.round(value * 100) / 100 });
}

function attachVitals(): void {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) vitals.lcp = entries[entries.length - 1].startTime;
    });
    lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    /* ignore */
  }
  clsValue = 0;
  clsEntries = [];
  try {
    clsObs = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (e.hadRecentInput) return;
        const first = clsEntries[0];
        const last = clsEntries[clsEntries.length - 1];
        if (
          clsValue &&
          last &&
          first &&
          entry.startTime - last.startTime < 1000 &&
          entry.startTime - first.startTime < 5000
        ) {
          clsValue += e.value || 0;
          clsEntries.push(entry);
        } else {
          clsValue = e.value || 0;
          clsEntries = [entry];
        }
        if (clsValue > vitals.cls) vitals.cls = clsValue;
      });
    });
    clsObs.observe({ type: "layout-shift", buffered: true });
  } catch {
    /* ignore */
  }
  try {
    inpObs = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const dur = (entry as PerformanceEntry & { duration: number }).duration;
        if (dur > vitals.inp) vitals.inp = dur;
      });
    });
    inpObs.observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
  } catch {
    /* ignore */
  }
}

function disconnectVitals(): void {
  try {
    lcpObs?.disconnect();
  } catch {
    /* ignore */
  }
  try {
    clsObs?.disconnect();
  } catch {
    /* ignore */
  }
  try {
    inpObs?.disconnect();
  } catch {
    /* ignore */
  }
  lcpObs = clsObs = inpObs = null;
}

function flushVitals(): void {
  if (vitals.lcp) emitVital("LCP", vitals.lcp);
  if (vitals.cls) emitVital("CLS", vitals.cls);
  if (vitals.inp) emitVital("INP", vitals.inp);
}

// ── 6. Page exit ──
let exitSent = false;
function flushExit(): void {
  if (exitSent) return;
  exitSent = true;
  if (activeMs > 0) {
    enqueue("engagement_tick", { active_ms: activeMs });
    activeMs = 0;
  }
  flushVitals();
  const now = Date.now();
  if (!document.hidden && now - lastActivity < IDLE_THRESHOLD_MS) {
    totActiveMs += now - lastTick;
  }
  lastTick = now;
  enqueue("page_exit", { duration_seconds: Math.round(totActiveMs / 1000), max_scroll: maxScroll });
  flush();
}

/** Émet un pageview et réinitialise l'état par page (à appeler à chaque route SPA). */
export function trackPageview(): void {
  // Clôture la page précédente (page_exit) avant de réinitialiser.
  flushExit();
  exitSent = false;
  scrollHits = { 25: false, 50: false, 75: false, 100: false };
  maxScroll = 0;
  activeMs = 0;
  totActiveMs = 0;
  lastTick = Date.now();
  lastActivity = Date.now();
  vitals.lcp = vitals.cls = vitals.inp = vitals.ttfb = 0;
  vitEmitted = { LCP: false, CLS: false, INP: false, TTFB: false };
  try {
    disconnectVitals();
  } catch {
    /* ignore */
  }
  try {
    attachVitals();
  } catch {
    /* ignore */
  }
  enqueue("pageview", {});
}

let _listenersAttached = false;
/** Met en place les écouteurs globaux (idempotent). N'émet PAS de pageview. */
export function initCooked(): void {
  if (typeof window === "undefined") return;
  if (window.__cookedLoaded) return;
  window.__cookedLoaded = true;

  // Capture l'attribution premier-contact dès le chargement.
  getAttribution();

  if (_listenersAttached) return;
  _listenersAttached = true;

  // Scroll (debouncé)
  let scrollTimer: ReturnType<typeof setTimeout>;
  window.addEventListener(
    "scroll",
    () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(onScroll, SCROLL_DEBOUNCE_MS);
    },
    { passive: true },
  );

  // Engagement : activité + ticks
  ["mousemove", "keydown", "scroll", "touchstart", "click"].forEach((ev) => {
    window.addEventListener(ev, () => {
      lastActivity = Date.now();
    }, { passive: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      lastActivity = Date.now();
      lastTick = Date.now();
    }
  });
  setInterval(() => {
    const now = Date.now();
    if (!document.hidden && now - lastActivity < IDLE_THRESHOLD_MS) {
      activeMs += now - lastTick;
      totActiveMs += now - lastTick;
    }
    lastTick = now;
  }, 1000);
  setInterval(() => {
    if (activeMs > 0) {
      enqueue("engagement_tick", { active_ms: activeMs });
      activeMs = 0;
    }
  }, ENGAGEMENT_TICK_MS);

  // TTFB (one-shot)
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav && nav.responseStart > 0) {
      vitals.ttfb = nav.responseStart;
      emitVital("TTFB", vitals.ttfb);
    }
  } catch {
    /* ignore */
  }
  attachVitals();

  // Clics : tel / ancre interne / nav interne / sortant
  document.addEventListener(
    "click",
    (e) => {
      let el = e.target as HTMLElement | null;
      while (el && el.nodeType === 1 && el.tagName !== "A") el = el.parentElement;
      const a = el as HTMLAnchorElement | null;
      if (!a || !a.href) return;
      const rawHref = a.getAttribute("href") || "";
      const anchor = (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 100);

      if (rawHref.indexOf("tel:") === 0) {
        enqueue("cta_phone_click", { phone: rawHref.slice(4).replace(/\s+/g, ""), anchor }, true);
        return;
      }
      if (rawHref.charAt(0) === "#" && rawHref.length > 1) {
        enqueue("cta_anchor_click", { target_section: rawHref.slice(1).slice(0, 200), anchor });
        return;
      }
      try {
        const u = new URL(a.href);
        if (u.hostname === location.hostname) {
          if (u.pathname !== location.pathname) {
            enqueue("click_internal", { target_path: u.pathname, anchor, href: a.href }, true);
          }
          return;
        }
        if (u.hostname) {
          enqueue("click_outbound", { href: a.href, hostname: u.hostname, anchor }, true);
        }
      } catch {
        /* ignore */
      }
    },
    true,
  );

  // Sortie de page → flush unique
  window.addEventListener("pagehide", flushExit);
  window.addEventListener("beforeunload", flushExit);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushExit();
  });
  window.addEventListener("pageshow", (e) => {
    if ((e as PageTransitionEvent).persisted) {
      exitSent = false;
      lastTick = Date.now();
      lastActivity = Date.now();
    }
  });
}
