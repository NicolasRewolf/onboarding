# Onboarding REWOLF

Outil de **cadrage** client : un prospect ouvre un lien personnel, remplit un questionnaire,
et ses réponses partent en rapport Markdown dans un dépôt GitHub privé. Réutilisable d'un client
à l'autre, et multi-questionnaires (avocat, horloger…). Toute la feature vit sous `src/onboarding/`.

## Language

**Cadrage**:
Le questionnaire de cadrage projet qu'un prospect remplit avant tout devis.
_Avoid_: formulaire, sondage, onboarding (réservé au nom du produit).

**Questionnaire**:
Un questionnaire nommé (`cadrage`, `horloger`…) : ses sections, un ton (`vous` / `tu`) et ses dérivés numérotés. Résolu par `resolveQuestionnaire(id)` depuis le registre `QUESTIONNAIRES`. Un fichier par questionnaire dans `src/onboarding/questionnaire/` ; la numérotation des `Question` est calculée à la construction (`index.ts`), aucune renumérotation manuelle.
_Avoid_: template, formulaire.

**Client**:
Le prospect pour qui un cadrage est préparé (slug, nom, titre, projet), résolu depuis le registre ou les paramètres d'URL.
_Avoid_: utilisateur, prospect (dans le code), lead.

**Question**:
Un item du cadrage : un `type` (texte, choix, budget, logo, `font` = sélecteur de polices rendues dans leur vraie fonte…), une priorité (Essentiel / Confort) et des indications de rendu.
_Avoid_: champ, item.

**Answer**:
La valeur donnée par un client à une question. Stockée dans la map `Answers` à plat.
_Avoid_: réponse (dans le code), valeur.

**Essentiel / Confort**:
La priorité d'une question : Essentiel = attendu pour un devis juste ; Confort = facultatif.
_Avoid_: required/optional, obligatoire.

**Report**:
Le livrable Markdown lisible (un par client) committé dans le dépôt des réponses — la base du devis.
_Avoid_: rapport (dans le code), export, sortie.

**Submission**:
L'envoi d'un cadrage complété vers le stockage (commit GitHub + issue de notification).
_Avoid_: envoi, post.

**Responses repo**:
Le dépôt GitHub **privé** où atterrissent les `report.md` / `data.json` — jamais le dépôt de code (public).
_Avoid_: base de données, stockage.

## Architecture seams

**Cadrage session**:
La logique d'un cadrage en cours pour un client : answers, progression, autosave, navigation d'écran, submission. Vit derrière une petite interface (`src/onboarding/useCadrageSession.ts`), pas dans la page React — la page n'est qu'un adapter de présentation par-dessus.
_Avoid_: state, store, contexte.

**FieldType**:
La connaissance d'un type de question, concentrée derrière un seam et scindée en deux registres exhaustifs indexés par `QType` :
le **field value contract** (`src/onboarding/fieldTypes.ts`, pur, sans React) et le **field renderer** (`src/onboarding/components/Field.tsx`, React).
_Avoid_: widget, control, input handler.

**Field value contract**:
Logique de valeur d'un type, sans React (`src/onboarding/fieldTypes.ts`) : `isAnswered`, `format`, et le vocabulaire d'encodage (clés auxiliaires `aux()` à suffixe `_other` / `_precision` / `_detail` / `_branding` / `_link` / `_files`). Testable seul.
_Avoid_: validator, schema.

**Field renderer**:
Le composant React qui rend un type de question (`src/onboarding/components/Field.tsx`). Consomme le `field value contract`, n'en détient pas la logique.
_Avoid_: composant de champ, widget.
