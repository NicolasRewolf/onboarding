# REWOLF · Onboarding

App de **supports clients** REWOLF sur `onboarding.rewolf.studio` — questionnaires de cadrage
aujourd'hui, autres supports (p. ex. présentations d'offres) demain. Briques & DA partagées,
une feature = un dossier. Orientation complète pour reprendre le projet : [`CLAUDE.md`](CLAUDE.md).

> 👋 **Nouvelle/nouveau dans l'équipe ?** Démarre ici → [`GETTING-STARTED.md`](GETTING-STARTED.md) (GitHub ↔ Claude Code ↔ mise en ligne).

Le support « questionnaire » : un prospect ouvre son lien → remplit un questionnaire soigné aux
couleurs REWOLF → à la validation, son **rapport Markdown** atterrit dans un dépôt GitHub privé
(et une issue te notifie). Tu lis, tu fais ton devis.

**Stack** — Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Geist (conventions `rewolf-starter`).
Aucune base de données : le stockage, c'est GitHub.

## Routes

| Route | Rôle |
|-------|------|
| `/` | Vitrine interne (« back ») — `noindex`, lien vers rewolf.studio |
| `/c/:slug` | Onboarding d'un client (ex. `/c/derieux`) |

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173
```

## Ajouter un client

- **À la volée** (sans redéploiement) : `/c/<slug>?n=Nom%20du%20client&t=Titre&q=<questionnaire>`
- **Client stable** : ajoute une entrée dans [`src/onboarding/clients.ts`](src/onboarding/clients.ts).
- **Nouveau questionnaire** : recette pas-à-pas dans [`CLAUDE.md`](CLAUDE.md) (« Ajouter un nouvel onboarding »).

## Stockage des réponses

À l'envoi, la fonction `api/submit.ts` (serverless Vercel) écrit dans le dépôt **privé**
[`onboarding-responses`](https://github.com/NicolasRewolf/onboarding-responses) :

```
responses/<slug>/report.md      ← le rapport lisible (pour ton devis)
responses/<slug>/data.json      ← les réponses structurées
responses/<slug>/attachments/   ← pièces jointes éventuelles (≤ 6 Mo)
```

Une **issue GitHub** est ouverte à la première soumission → tu reçois une notification.

## Déploiement (Vercel)

Projet statique (Vite) + une fonction serverless (`/api`). Variables d'environnement :

| Variable | Valeur | Secret |
|----------|--------|:------:|
| `GITHUB_TOKEN` | PAT fine-grained, accès **Contents + Issues (RW)** au dépôt `onboarding-responses` | ✅ |
| `RESPONSES_REPO` | `NicolasRewolf/onboarding-responses` | |
| `RESPONSES_BRANCH` | `main` | |

Domaine : `onboarding.rewolf.studio`.

---

*REWOLF Studio — Bordeaux*
