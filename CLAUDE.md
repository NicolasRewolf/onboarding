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

## Ajouter un nouvel onboarding (recette)

Un onboarding = **un fichier** dans `src/onboarding/questionnaire/` + son enregistrement.

1. **Créer** `src/onboarding/questionnaire/<nom>.ts` exportant `export const <NOM>_RAW: RawSection[] = [...]` (sections → questions). S'inspirer de `horloger.ts` ; les types de champ sont dans `types.ts`.
2. **Enregistrer** dans `questionnaire/index.ts` : `import { <NOM>_RAW } from "./<nom>";` puis l'ajouter à `QUESTIONNAIRES` → `<nom>: buildQuestionnaire("<nom>", <NOM>_RAW, "tu" | "vous", "accroche d'intro")`. La numérotation des questions est **automatique** (par position).
3. **Brancher un client** dans `clients.ts` (`REGISTRY`) : `{ slug, name, title, project, questionnaire: "<nom>" }` → dispo sur `/c/<slug>`. (Ou à la volée, sans redéploiement : `/c/<slug>?n=Nom&t=Titre&q=<nom>`.)
4. **Nouveau type de champ ?** l'ajouter aux DEUX registres exhaustifs (le compilateur l'exige) : `QType` + `FIELD_VALUE` (`fieldTypes.ts`) et `FIELD_RENDERER` (`components/Field.tsx`). Pour une police (`font`), ajouter la famille dans `index.html`.
5. **Vérifier puis déployer** : `npm run build`, tester `/c/<slug>` en preview **sans régresser** l'existant, puis `git push` sur `main` (Vercel déploie tout seul).

## Collaboration (Nicolas & Élise)

Plusieurs auteurs poussent sur `main` (même app, même domaine `onboarding.rewolf.studio`). Garder les changements **additifs** — un nouvel onboarding = de nouveaux fichiers, pas une refonte de l'existant — des commits petits et ciblés, et **ne jamais régresser** les questionnaires en ligne (`/c/derieux`, `/c/gmt`). Dans le doute, vérifier en preview avant de pousser.

## Invariants (à ne pas casser)

- **`api/submit.ts` reste autonome** — aucun import hors de `/api` (un `../src/lib/...` a déjà provoqué un `FUNCTION_INVOCATION_FAILED` en prod). Dupliquer une constante plutôt qu'importer.
- **Dépôt des réponses = privé** (`onboarding-responses`) — données prospects confidentielles. Ne jamais l'exposer, ne jamais y committer de secret, ne jamais y ouvrir d'issue de travail (cf. `docs/agents/issue-tracker.md`).
- **Multi-onboarding** : ne jamais régresser les questionnaires en ligne — `/c/derieux` (« vous ») et `/c/gmt` (« tu »). Le ton (`tone`) et l'accroche d'intro (`tagline`) sont portés par chaque questionnaire.
- **Design tokens uniquement** : pas de couleur en dur, on passe par les tokens REWOLF.
- **Déploiement** : push sur `main` → Vercel auto-déploie en production. Pas de secrets saisis par l'agent (le `GITHUB_TOKEN` est géré côté Vercel par Nicolas).

## Agent skills

### Issue tracker

Issues de travail sur GitHub (`NicolasRewolf/onboarding`, via `gh`) — distinct du dépôt privé des réponses. See `docs/agents/issue-tracker.md`.

### Triage labels

Vocabulaire canonique : `needs-triage` · `needs-info` · `ready-for-agent` · `ready-for-human` · `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Contexte unique : `CONTEXT.md` + `docs/adr/` à la racine. See `docs/agents/domain.md`.
