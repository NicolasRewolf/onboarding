// Feature « dispos » — collecte des disponibilités agenda d'une équipe pour caler
// un créneau commun (ici : shooting photo du Cabinet Plouton). Support autonome,
// isolé du questionnaire et des offres. Granularité : demi-journées (matin / après-midi).
//
// Un événement = une entrée dans REGISTRY (slug stable + liste des membres + fenêtre
// de dates). La fenêtre peut être ajustée sans redéploiement via les paramètres d'URL
// `?from=YYYY-MM-DD&to=YYYY-MM-DD` (repli sur les dates du registre).

export type Part = "am" | "pm";
export const PARTS: readonly Part[] = ["am", "pm"] as const;
export const PART_LABEL: Record<Part, string> = { am: "Matin", pm: "Après-midi" };
export const PART_SHORT: Record<Part, string> = { am: "Mat", pm: "A-m" };

export interface Member {
  id: string;
  name: string;
  role: string;
}

export interface DispoEvent {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  start: string; // "YYYY-MM-DD" inclus
  end: string; // "YYYY-MM-DD" inclus
  members: Member[];
}

const PLOUTON: DispoEvent = {
  slug: "plouton",
  title: "Shooting équipe · Cabinet Plouton",
  subtitle: "Trouvons le créneau où tout le monde est là",
  intro:
    "On va refaire les photos individuelles et d'équipe pour cette année 2026-2027, dans les nouveaux bureaux. Merci de signifier vos dispos afin de faire ça sur une seule demi-journée. :)",
  start: "2026-08-01",
  end: "2026-09-30",
  members: [
    { id: "julien", name: "Julien Plouton", role: "Avocat fondateur" },
    { id: "mathilde", name: "Mathilde Manson", role: "Avocate associée" },
    { id: "andeol", name: "Andéol Brachanet", role: "Avocat collaborateur" },
    { id: "jade", name: "Jade Adil", role: "Avocate collaboratrice" },
    { id: "axelle", name: "Axelle Fesneau", role: "Avocate collaboratrice" },
    { id: "alexia", name: "Alexia Simonini", role: "Assistante juridique" },
  ],
};

const REGISTRY: Record<string, DispoEvent> = { plouton: PLOUTON };

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Résout un événement par slug, en appliquant d'éventuelles bornes d'URL. */
export function resolveEvent(slug: string, params: URLSearchParams): DispoEvent | null {
  const base = REGISTRY[slug.toLowerCase()];
  if (!base) return null;
  const from = params.get("from");
  const to = params.get("to");
  const start = from && ISO_RE.test(from) ? from : base.start;
  const end = to && ISO_RE.test(to) ? to : base.end;
  // Garde-fou : bornes cohérentes, sinon on retombe sur le registre.
  if (end < start) return { ...base };
  return { ...base, start, end };
}

/* ───────────────────────── Créneaux (slots) ───────────────────────── */

export const slotId = (date: string, part: Part) => `${date}|${part}`;

export function parseSlot(id: string): { date: string; part: Part } {
  const [date, part] = id.split("|");
  return { date, part: (part === "pm" ? "pm" : "am") as Part };
}

/* ───────────────────────── Calendrier (dates) ───────────────────────── */

// On ancre chaque date à midi UTC pour éviter tout décalage de jour lié au fuseau.
function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}
const toISO = (d: Date) => d.toISOString().slice(0, 10);
/** Lundi = 0 … Dimanche = 6 (semaine à la française). */
const mondayIndex = (d: Date) => (d.getUTCDay() + 6) % 7;

export interface DayCell {
  date: string; // "YYYY-MM-DD"
  day: number; // n° du jour dans le mois
  weekday: number; // 0 = lundi
  isWeekend: boolean;
  inRange: boolean; // dans la fenêtre [start, end]
}

export interface MonthGrid {
  key: string; // "2026-08"
  label: string; // "Août 2026"
  leadingBlanks: number; // cases vides avant le 1er (alignement lundi)
  days: DayCell[];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function buildMonth(year: number, month: number, start: string, end: string): MonthGrid {
  const first = parseISO(`${year}-${String(month + 1).padStart(2, "0")}-01`);
  const leadingBlanks = mondayIndex(first);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const label = cap(
    new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(first),
  );
  const days: DayCell[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(year, month, d, 12));
    const date = toISO(dt);
    const weekday = mondayIndex(dt);
    days.push({
      date,
      day: d,
      weekday,
      isWeekend: weekday >= 5,
      inRange: date >= start && date <= end,
    });
  }
  return { key: `${year}-${String(month + 1).padStart(2, "0")}`, label, leadingBlanks, days };
}

/** Grilles mensuelles couvrant la fenêtre [start, end] (mois entiers, jours hors fenêtre marqués). */
export function buildMonths(start: string, end: string): MonthGrid[] {
  const s = parseISO(start);
  const e = parseISO(end);
  const months: MonthGrid[] = [];
  let y = s.getUTCFullYear();
  let m = s.getUTCMonth();
  const endY = e.getUTCFullYear();
  const endM = e.getUTCMonth();
  // Garde-fou anti-boucle : 24 mois max.
  for (let guard = 0; guard < 24; guard++) {
    months.push(buildMonth(y, m, start, end));
    if (y === endY && m === endM) break;
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return months;
}

/** Tous les créneaux dans la fenêtre (optionnellement jours ouvrés uniquement). */
export function allSlots(start: string, end: string, weekdaysOnly = false): string[] {
  const out: string[] = [];
  for (const month of buildMonths(start, end)) {
    for (const cell of month.days) {
      if (!cell.inRange) continue;
      if (weekdaysOnly && cell.isWeekend) continue;
      out.push(slotId(cell.date, "am"), slotId(cell.date, "pm"));
    }
  }
  return out;
}

/** Libellé lisible d'un créneau : "Lun 4 août · Matin". */
export function formatSlot(id: string): string {
  const { date, part } = parseSlot(id);
  const dt = parseISO(date);
  const day = cap(
    new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(dt),
  );
  return `${day} · ${PART_LABEL[part]}`;
}

/** Slug ASCII stable à partir d'un nom libre (pour un invité hors liste). */
export function slugifyName(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "invite"
  );
}
