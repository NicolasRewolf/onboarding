# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is **single-context**: one `CONTEXT.md` at the root, one (future) `docs/adr/`.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the domain glossary (Cadrage, Client, Question, Answer, Report, Submission, Responses repo) and the architecture seams (Cadrage session, FieldType, Field value contract, Field renderer).
- **`docs/adr/`** — read ADRs that touch the area you're about to work in (none yet; created lazily).

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (this repo):

```
/
├── CONTEXT.md
├── docs/adr/                          ← created lazily, none yet
│   ├── 0001-stockage-github-pas-de-bdd.md
│   └── 0002-fonction-serverless-isolee-de-src.md
└── src/
    └── onboarding/                    ← toute la feature (un fichier par questionnaire dans questionnaire/)
```

Multi-context repo (presence of `CONTEXT-MAP.md` at the root):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md` — and respect its `_Avoid_` lists (e.g. say **Cadrage**, not "formulaire/sondage"; **Report**, not "export"; **Responses repo**, not "base de données").

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
