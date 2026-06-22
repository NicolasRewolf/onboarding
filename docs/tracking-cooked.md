# Tracking « cooked » — forfaits-flash

Mesure first-party **cookieless / RGPD-exempt** (modèle « mesure d'audience exemptée »
CNIL, comme Plausible/Fathom), portée depuis le système [`cooked`](https://github.com/NicolasRewolf/cooked)
de jplouton-avocat.fr. Sert à répondre à **« quelle source amène réellement des
demandes de devis ? »** — en particulier pour la campagne Google Ads.

## Architecture

```
src/tracking/cooked.ts        traceur (anonymous_id + session_id en localStorage,
   │                          pageview/scroll/web_vitals/clics + UTM + gclid)
src/tracking/CookedTracker.tsx  monte le traceur + 1 pageview par route SPA (dans App)
   │  flush UNE fois par page (pagehide / onglet caché) via sendBeacon
   ▼
POST /api/track               route Vercel → écrit 1 fichier JSON par flush
   │                          dans le repo de DONNÉES GitHub (clé service côté serveur)
   ▼
GitHub  TRACKING_REPO/tracking/forfaits-flash/<jour>/<horodatage>-<session>-<rand>.json

Conversion (form_submit) :
   /api/forfaits-flash-lead.ts  écrit déjà le lead côté serveur (infalsifiable).
   → enrichi d'un bloc « Attribution (cooked) » : canal, campagne, gclid,
     referrer, page d'entrée, anonymous_id, session_id.
```

> ⚠️ **Pourquoi un repo de données séparé** (et pas `onboarding`) : tout push sur le
> repo connecté à Vercel redéclenche un déploiement. Les events vont donc dans le
> repo de données (comme les leads), jamais dans le repo de code.

## Variables d'environnement (Vercel)

| Variable | Rôle | Défaut |
|---|---|---|
| `GITHUB_TOKEN` | PAT fine-grained, Contents RW sur le repo de données | *(déjà utilisé par les leads)* |
| `TRACKING_REPO` | `owner/repo` où écrire les events | `NicolasRewolf/onboarding-responses` |
| `TRACKING_BRANCH` | branche | `main` |
| `TRACK_ALLOWED_ORIGINS` | origines autorisées en plus du same-origin (CSV) | *(vide)* |

Aucune nouvelle infra : on réutilise le `GITHUB_TOKEN` des leads. Pour un autre dépôt,
régler `TRACKING_REPO`.

## Côté Google Ads

Renseigner le **suffixe d'URL finale** de la campagne pour que le canal payant soit
attribué nativement (le traceur lit `utm_*` + `gclid`) :

```
utm_source=google&utm_medium=cpc&utm_campaign=branding_occ_na&utm_content={adgroupid}
```

`utm_medium=cpc` (ou la présence d'un `gclid`) ⇒ le lead est étiqueté « Google Ads (payant) ».

## Format de stockage & requêtage

Un fichier JSON par flush : `{ received_at, ip_country, user_agent, anonymous_id,
session_id, attribution, events: [...] }`. Chaque event porte `name`, `path`, `url`,
`referrer`, `utm_*`, `gclid`, `props`, `occurred_at`.

Events émis : `pageview`, `scroll_depth`, `engagement_tick`, `web_vitals`,
`page_exit`, `cta_phone_click`, `cta_anchor_click`, `click_internal`,
`click_outbound`, `form_submit`.

> **Limite assumée** : GitHub = stockage, pas de couche SQL/RPC ni de CPI comme le
> cooked complet. Pour des requêtes ad-hoc, ingérer ces fichiers JSON dans une base
> (DuckDB/SQLite en local, ou Supabase si on veut l'expérience cooked entière).
> Le flush 1×/page limite le volume de commits ; à fort trafic, repasser sur une base.

## Vie privée

`anonymous_id` = identifiant aléatoire local (localStorage), jamais une donnée
personnelle. Aucun cookie, aucun bandeau de consentement. Le formulaire de devis
reste la seule collecte de données personnelles (et il est explicite).
