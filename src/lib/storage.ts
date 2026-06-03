import { type Answers } from "./answers";

const key = (slug: string) => `rewolf_onboarding_${slug}_v1`;

export function loadDraft(slug: string): Answers {
  try {
    const raw = localStorage.getItem(key(slug));
    return raw ? (JSON.parse(raw) as Answers) : {};
  } catch {
    return {};
  }
}

export function saveDraft(slug: string, answers: Answers): void {
  try {
    localStorage.setItem(key(slug), JSON.stringify(answers));
  } catch {
    /* quota / private mode — on ignore silencieusement */
  }
}

export function clearDraft(slug: string): void {
  try {
    localStorage.removeItem(key(slug));
  } catch {
    /* noop */
  }
}
