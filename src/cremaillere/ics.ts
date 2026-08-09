// Génération de l'événement calendrier (fichier .ics + lien Google Agenda)
// une fois la date verrouillée (PARTY_CONFIG.confirmedDate).

import { PARTY_CONFIG, formatDateFr } from "./data";

const TITLE = "Crémaillère ✕ PACS 🏠🧡";
const DESCRIPTION =
  "Deux fêtes pour le prix d'une : on pend la crémaillère ET on célèbre le PACS. Kids friendly (deux chambres à l'étage). Détails : https://onboarding.rewolf.studio/cremaillere";

const location = () => `${PARTY_CONFIG.address.street}, ${PARTY_CONFIG.address.city}`;

/** "2026-10-17" + "19:00" → "20261017T190000" (heure locale Europe/Paris). */
function stamp(dateIso: string, time: string): string {
  return `${dateIso.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

/** Fin de soirée : endTime < startTime ⇒ on déborde sur le lendemain. */
function endStamp(dateIso: string): string {
  const crossesMidnight = PARTY_CONFIG.endTime < PARTY_CONFIG.startTime;
  const d = new Date(`${dateIso}T12:00:00`);
  if (crossesMidnight) d.setDate(d.getDate() + 1);
  const iso = d.toISOString().slice(0, 10);
  return stamp(iso, PARTY_CONFIG.endTime);
}

export function buildIcs(dateIso: string): string {
  const uid = `cremaillere-${dateIso}@onboarding.rewolf.studio`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//REWOLF//Cremaillere//FR",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;TZID=Europe/Paris:${stamp(dateIso, PARTY_CONFIG.startTime)}`,
    `DTEND;TZID=Europe/Paris:${endStamp(dateIso)}`,
    `SUMMARY:${TITLE}`,
    `DESCRIPTION:${DESCRIPTION.replace(/,/g, "\\,")}`,
    `LOCATION:${location().replace(/,/g, "\\,")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(dateIso: string) {
  const blob = new Blob([buildIcs(dateIso)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cremaillere-${formatDateFr(dateIso).replace(/\s+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(dateIso: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${stamp(dateIso, PARTY_CONFIG.startTime)}/${endStamp(dateIso)}`,
    ctz: "Europe/Paris",
    details: DESCRIPTION,
    location: location(),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
