# Onboarding REWOLF

App de **supports clients** REWOLF, déployée sur **`onboarding.rewolf.studio`**. Une même base, plusieurs
supports : aujourd'hui des **questionnaires de cadrage** (onboarding prospect) ; et d'autres supports
client à venir — p. ex. des **présentations d'offres / de prestations**. Chaque support = une ou des
route(s) + une page, habillées de la DA REWOLF.

Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Geist. DA brutaliste REWOLF (orange `#ff4f04`).
Pas de base de données : si un support collecte des réponses, elles partent sur GitHub (cf. Écosystème).

Vocabulaire & seams de la feature questionnaire : **`CONTEXT.md`**. Mise en route : **`README.md`**.

## Écosystème

- **GitHub**
  - `NicolasRewolf/onboarding` (ce dépôt, public) — **le code**. Tout le dev se fait ici.
  - `NicolasRewolf/onboarding-responses` (privé) — **les réponses** des supports qui collectent des données (les questionnaires). Écrit par la fonction serverless, jamais à la main. Confidentiel.
- **Vercel** — le projet est connecté à ce dépôt : **`git push` sur `main` ⇒ déploiement auto en prod**. Domaine `onboarding.rewolf.studio`. Les secrets (`GITHUB_TOKEN`…) sont gérés côté Vercel par Nicolas — pas besoin d'y toucher pour déployer.
- **Routing** — `src/App.tsx` (React Router) : `/` (accueil), `/c/:slug` (questionnaire client), `/admin` (générateur de liens). Ajouter un support = ajouter une route ici + une page.

## Structure

- **Briques partagées — réutilisables par tout support**
  - `src/components/brand` (logo `Wordmark`…) · `src/components/ui` (shadcn) · `src/styles/globals.css` (tokens DA) · `src/lib/utils.ts`. `src/pages/` = une page par route.
- **Feature « questionnaire » — un type de support** : `src/onboarding/`
  - `questionnaire/` — **un fichier par questionnaire** (`cadrage.ts`, `horloger.ts`) + `types.ts` + `index.ts` (registre + numérotation auto).
  - `components/`, et `answers · fieldTypes · report · storage · submit · attachments · attachmentLimits · clients · useCadrageSession`.
- `api/submit.ts` — fonction serverless Vercel (écrit les réponses dans le dépôt privé). **Concerne uniquement les supports qui collectent des données.**

## Ajouter un support

**A. Un autre type de support (ex. présentation d'offre)** — garder le réflexe « une feature = un dossier » :
1. Nouveau dossier de feature `src/<feature>/` (p. ex. `src/offres/`), isolé comme `src/onboarding/`.
2. Une page `src/pages/<Nom>.tsx` qui réutilise la DA (composants `brand`/`ui`, tokens) — **pas besoin** du flux questionnaire / `api/submit` / dépôt des réponses si le support ne collecte rien.
3. Une route dans `src/App.tsx` (p. ex. `/o/:slug`).
4. `npm run build`, vérifier en preview, `git push` sur `main`.

**B. Un nouveau questionnaire** (réutiliser la feature existante) :
1. `src/onboarding/questionnaire/<nom>.ts` → `export const <NOM>_RAW: RawSection[]` (s'inspirer de `horloger.ts`).
2. L'enregistrer dans `questionnaire/index.ts` → `QUESTIONNAIRES` via `buildQuestionnaire("<nom>", <NOM>_RAW, "tu"|"vous", "accroche d'intro")`. Numérotation auto (par position).
3. Brancher un client dans `clients.ts` (`/c/<slug>`), ou à la volée `/c/<slug>?n=Nom&t=Titre&q=<nom>`.
4. Nouveau type de champ ? l'ajouter aux DEUX registres exhaustifs : `QType` + `FIELD_VALUE` (`fieldTypes.ts`) et `FIELD_RENDERER` (`components/Field.tsx`) ; police → famille dans `index.html`.
5. `build` + preview (sans régresser l'existant) + `push`.

## Collaboration (Nicolas & Élise)

Plusieurs auteurs poussent sur `main` (même app, même domaine). Changements **additifs** — un nouveau support = de nouveaux fichiers (idéalement sa propre feature + sa route), pas une refonte de l'existant. Commits petits et ciblés. **Ne jamais régresser** les supports en ligne (`/c/derieux`, `/c/gmt`). Dans le doute, preview avant push.

## Invariants (à ne pas casser)

- **`api/submit.ts` reste autonome** — aucun import hors de `/api` (un `../src/lib/...` a déjà provoqué un `FUNCTION_INVOCATION_FAILED` en prod). Dupliquer une constante plutôt qu'importer.
- **Dépôt des réponses = privé** (`onboarding-responses`) — données prospects confidentielles. Ne jamais l'exposer, ne jamais y committer de secret, ne jamais y ouvrir d'issue de travail (cf. `docs/agents/issue-tracker.md`).
- **Multi-support** : ne jamais régresser les supports en ligne — `/c/derieux` (« vous ») et `/c/gmt` (« tu »). Le ton (`tone`) et l'accroche d'intro (`tagline`) sont portés par chaque questionnaire.
- **Design tokens uniquement** : pas de couleur en dur, on passe par les tokens REWOLF.
- **Déploiement** : push sur `main` → Vercel auto-déploie en production. Pas de secrets saisis par l'agent (le `GITHUB_TOKEN` est géré côté Vercel par Nicolas).

## Agent skills

### Issue tracker

Issues de travail sur GitHub (`NicolasRewolf/onboarding`, via `gh`) — distinct du dépôt privé des réponses. See `docs/agents/issue-tracker.md`.

### Triage labels

Vocabulaire canonique : `needs-triage` · `needs-info` · `ready-for-agent` · `ready-for-human` · `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Contexte unique : `CONTEXT.md` + `docs/adr/` à la racine. See `docs/agents/domain.md`.
