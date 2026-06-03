import {
  type Question,
  type Section,
  SECTIONS,
  ALL_Q,
  TOTAL_Q,
  ESSENTIAL_IDS,
} from "./questionnaire";

export type Answers = Record<string, string | string[]>;

export function isAnswered(q: Question, a: Answers): boolean {
  const v = a[q.id];
  const hasFiles = !!q.file && Array.isArray(a[q.id + "_files"]) && (a[q.id + "_files"] as string[]).length > 0;
  switch (q.type) {
    case "boolean":
    case "booleanDetail":
    case "logo":
      return v === "Oui" || v === "Non";
    case "multi":
      return (Array.isArray(v) && v.length > 0) || !!a[q.id + "_other"] || hasFiles;
    case "choice":
    case "budget":
      return !!v;
    default:
      return (typeof v === "string" && v.trim().length > 0) || hasFiles;
  }
}

export function formatAnswer(q: Question, a: Answers): string {
  let out = "";
  const v = a[q.id];
  if (q.type === "multi") {
    const arr = Array.isArray(v) ? [...v] : [];
    const other = a[q.id + "_other"];
    if (typeof other === "string" && other.trim()) arr.push(other.trim());
    out = arr.join(" · ");
  } else if (q.type === "choice") {
    out = (typeof v === "string" ? v : "") || "";
    const prec = a[q.id + "_precision"];
    if (typeof prec === "string" && prec.trim()) out += (out ? " — " : "") + prec.trim();
  } else if (q.type === "booleanDetail") {
    out = (typeof v === "string" ? v : "") || "";
    const det = a[q.id + "_detail"];
    if (v === "Oui" && typeof det === "string" && det.trim()) out += " — " + det.trim();
  } else if (q.type === "logo") {
    if (v === "Oui") {
      out = "Oui — possède déjà une identité visuelle";
      const files = a[q.id + "_files"];
      if (Array.isArray(files) && files.length) out += "\n📎 " + files.join(", ");
      const link = a[q.id + "_link"];
      if (typeof link === "string" && link.trim()) out += "\n🔗 " + link.trim();
    } else if (v === "Non") {
      const branding = a[q.id + "_branding"];
      out = "Non — " + (typeof branding === "string" && branding.trim() ? branding.trim() : "souhaite que REWOLF crée son identité");
    }
  } else {
    out = typeof v === "string" ? v : "";
  }
  const files = a[q.id + "_files"];
  if (q.file && Array.isArray(files) && files.length) {
    out += (out ? "\n" : "") + "📎 " + files.join(", ");
  }
  return out.trim();
}

export const answeredCount = (a: Answers): number => ALL_Q.filter((q) => isAnswered(q, a)).length;
export const sectionAnswered = (s: Section, a: Answers): number => s.qs.filter((q) => isAnswered(q, a)).length;
export const sectionComplete = (s: Section, a: Answers): boolean =>
  sectionAnswered(s, a) > 0 && s.qs.filter((q) => q.p === "E").every((q) => isAnswered(q, a));
export const missingEssentials = (a: Answers): Question[] =>
  ESSENTIAL_IDS.map((id) => ALL_Q.find((q) => q.id === id)!).filter((q) => !isAnswered(q, a));

export { SECTIONS, ALL_Q, TOTAL_Q, ESSENTIAL_IDS };
