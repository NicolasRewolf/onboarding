# Onboarding REWOLF

Outil de **cadrage** client : un prospect ouvre un lien personnel, remplit un questionnaire,
et ses réponses partent en rapport Markdown dans un dépôt GitHub privé. Réutilisable d'un client à l'autre.

## Language

**Cadrage**:
Le questionnaire de cadrage projet qu'un prospect remplit avant tout devis.
_Avoid_: formulaire, sondage, onboarding (réservé au nom du produit).

**Client**:
Le prospect pour qui un cadrage est préparé (slug, nom, titre, projet), résolu depuis le registre ou les paramètres d'URL.
_Avoid_: utilisateur, prospect (dans le code), lead.

**Question**:
Un item du cadrage : un `type`, une priorité (Essentiel / Confort) et des indications de rendu.
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
La logique d'un cadrage en cours pour un client : answers, progression, autosave, navigation d'écran, submission. Destinée à vivre derrière une petite interface (`useCadrageSession`), pas dans la page React.
_Avoid_: state, store, contexte.

**FieldType**:
La connaissance d'un type de question, concentrée derrière un seam et scindée en deux registres indexés par `QType` :
le **field value contract** (pur, sans React) et le **field renderer** (React).
_Avoid_: widget, control, input handler.

**Field value contract**:
Logique de valeur d'un type, sans React : `isAnswered`, `format`, encode/décode (les conventions de suffixe `_other` / `_precision` / `_detail` / `_branding` / `_link` / `_files`). Testable seul.
_Avoid_: validator, schema.

**Field renderer**:
Le composant React qui rend un type de question. Lit le `field value contract`, n'en détient pas la logique.
_Avoid_: composant de champ, widget.
