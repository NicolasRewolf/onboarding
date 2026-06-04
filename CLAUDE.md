# Onboarding REWOLF

Outil de **cadrage** client réutilisable : un prospect ouvre un lien personnel (`/c/:slug`),
remplit un questionnaire, ses réponses partent en `report.md` dans un dépôt GitHub privé.
Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui, DA brutaliste REWOLF (orange `#ff4f04`).

Vocabulaire du domaine et seams d'architecture : voir **`CONTEXT.md`**. Mise en route : **`README.md`**.

## Structure

- `src/onboarding/` — **toute la feature** au même endroit.
  - `questionnaire/` — **un fichier par onboarding** (`cadrage.ts` = avocat « vous », `horloger.ts` = GMT « tu »), plus `types.ts` et `index.ts` (registre + numérotation auto). Ajouter un client = un fichier ici + l'enregistrer dans `index.ts`.
  - `components/`, puis `answers · fieldTypes · report · storage · submit · attachments · attachmentLimits · clients · useCadrageSession`.
- `src/lib/utils.ts`, `src/components/{brand,ui}`, `src/pages` — génériques, hors feature.
- `api/submit.ts` — fonction serverless Vercel (écrit dans le dépôt des réponses).

## Invariants (à ne pas casser)

- **`api/submit.ts` reste autonome** — aucun import hors de `/api` (un `../src/lib/...` a déjà provoqué un `FUNCTION_INVOCATION_FAILED` en prod). Dupliquer une constante plutôt qu'importer.
- **Dépôt des réponses = privé** (`onboarding-responses`) — données prospects confidentielles. Ne jamais l'exposer, ne jamais y committer de secret, ne jamais y ouvrir d'issue de travail (cf. `docs/agents/issue-tracker.md`).
- **Multi-client** : ne jamais régresser le cadrage en ligne de Me Derieux (`/c/derieux`, « vous », 49 q / 9 sections). Le ton (`tone: "vous" | "tu"`) est porté par chaque questionnaire.
- **Design tokens uniquement** : pas de couleur en dur, on passe par les tokens REWOLF.
- **Déploiement** : push sur `main` → Vercel auto-déploie en production. Pas de secrets saisis par l'agent (le `GITHUB_TOKEN` est géré côté Vercel par Nicolas).

## Agent skills

### Issue tracker

Issues de travail sur GitHub (`NicolasRewolf/onboarding`, via `gh`) — distinct du dépôt privé des réponses. See `docs/agents/issue-tracker.md`.

### Triage labels

Vocabulaire canonique : `needs-triage` · `needs-info` · `ready-for-agent` · `ready-for-human` · `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Contexte unique : `CONTEXT.md` + `docs/adr/` à la racine. See `docs/agents/domain.md`.
