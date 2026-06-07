# 🐺 Bienvenue dans la meute, Élise

Ton terrain de jeu : créer des **plaquettes d'offres** (prospection REWOLF) qui se mettent en ligne
toutes seules sur **onboarding.rewolf.studio**. Ton binôme : **Claude Code**. Votre coffre commun : **GitHub**.

Pas besoin d'être développeuse. Ce guide t'explique comment les trois bossent ensemble. 🎯

---

## 🧠 Le principe en 30 secondes

Trois acolytes, une boucle :

```
   GitHub  ──clone / pull──▶  ton ordi  ◀──tu bosses avec──  Claude Code
     ▲                           │
     └──────────  push  ◀────────┘
                    │
                    ▼
            Vercel met en ligne 🚀  →  onboarding.rewolf.studio
```

- **GitHub** 🗄️ = le coffre-fort commun du code (la mémoire de l'équipe).
- **Claude Code** 🤖 = ton binôme dev dans le terminal : tu lui parles **en français**, il code.
- **Vercel** 🚀 = le livreur : dès que tu « pousses » sur GitHub, il met le site à jour tout seul.

Tu travailles sur une **copie locale**, puis tu **renvoies** (`push`) ton travail sur GitHub → ça part en ligne.

---

## 📦 Installation (une seule fois)

Pré-requis : **Node.js** et **Git** installés.

**1. Installe Claude Code**
```bash
curl -fsSL https://claude.ai/install.sh | bash
# …ou, si tu préfères npm :
npm install -g @anthropic-ai/claude-code
```

**2. Récupère le projet + ses dépendances**
```bash
git clone https://github.com/NicolasRewolf/onboarding.git
cd onboarding
npm install
```

> 🙅‍♀️ Tu ne clones **que ce repo**. Le dépôt `onboarding-responses` (réponses des clients) ne te concerne pas.

---

## ▶️ Lancer ton binôme

Dans le dossier `onboarding` :
```bash
claude
```
Au 1er lancement, connecte-toi (ton compte Claude). Et voilà : Claude Code lit tout seul le
`CLAUDE.md` du projet — **il sait déjà où sont les choses**. 🪄

---

## 🔁 Ta boucle de travail (à chaque session)

1. **Récupère les nouveautés** (Nicolas pousse aussi de son côté) :
   ```bash
   git pull
   ```
2. **Lance Claude** : `claude`
3. **Explique ce que tu veux**, en français. Exemple :
   > « Lis `CLAUDE.md`. Crée une plaquette d'offre sur la route `/offre-starter` dans `src/offres/`,
   > à la DA REWOLF, avec un petit calculateur de prix. »
4. **Regarde le rendu en local** :
   ```bash
   npm run dev        # → http://localhost:5173/offre-starter
   ```
   (ou demande simplement : « lance le serveur de dev et montre-moi le rendu »)
5. **Quand c'est bon, envoie sur GitHub** (Claude peut le faire pour toi) :
   ```bash
   git add -A && git commit -m "Plaquette offre Starter" && git push
   ```
6. ☕ Patiente ~1 min → c'est **en ligne** sur `onboarding.rewolf.studio/offre-starter`.

---

## 💬 Des prompts pour démarrer

- « Lis `CLAUDE.md` et résume-moi comment ajouter une plaquette d'offre. »
- « Crée `/offre-signature` : page de présentation de l'offre Signature, sections [intro · ce qui est inclus · prix · FAQ], CTA “Prendre rendez-vous”, à la DA REWOLF. »
- « Ajoute un calculateur : la personne choisit le nombre de pages et les options → ça affiche un prix estimé. »
- « Montre-moi le rendu mobile et corrige ce qui dépasse. »
- « Commit et pousse, avec un message clair. »

> Astuce : parle-lui comme à un binôme. S'il part dans la mauvaise direction, dis-le — il corrige.

---

## 🦴 Les règles de la meute

- **Reste additive** : tes plaquettes vivent dans **`src/offres/`** + leur route. Tu ne touches **pas**
  aux questionnaires clients de Nicolas (`src/onboarding/`, routes `/c/...`).
- **Vérifie avant de pousser** : `npm run dev`, et regarde que ça marche.
- **Ne casse pas l'existant** : si Claude propose de modifier des fichiers partagés, demande-lui pourquoi.
- **Secrets / Vercel** : rien à toucher, Nicolas gère. Un `git push` suffit à publier.
- Dans le doute : « est-ce que ce changement risque de casser quelque chose qui est déjà en ligne ? »

---

## 🧰 Aide-mémoire

| Je veux… | Commande |
|---|---|
| Récupérer les nouveautés | `git pull` |
| Lancer mon binôme | `claude` |
| Voir le site en local | `npm run dev` |
| Publier en ligne | `git add -A && git commit -m "..." && git push` |
| Voir l'historique | `git log --oneline` |

---

## 🆘 Si ça coince

- **`claude` : command not found** → refais l'étape Installation, puis rouvre le terminal.
- **`npm run dev` plante** → `npm install`, puis réessaie.
- **Conflit Git au `pull` / `push`** → dis à Claude : « j'ai un conflit git, aide-moi à le résoudre. »
- **Le site n'a pas bougé** → attends 1–2 min, recharge en vidant le cache. Toujours rien ? Vérifie que le `git push` est bien passé (`git log --oneline`).

---

Bienvenue dans la meute. Maintenant, à toi de chasser. 🐺🧡

*— REWOLF Studio · le détail qui tue, l'app dans `CLAUDE.md`*
