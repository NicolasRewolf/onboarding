// Politique de taille des pièces jointes — un seul foyer, partagé client + serveur.
// La limite de corps des fonctions Vercel est ~4,5 Mo. On garde une marge.
// Ce module ne contient QUE des nombres (aucun type DOM) → importable côté serveur (api/).

export const MAX_PER_FILE_BYTES = 3 * 1024 * 1024; // 3 Mo / fichier (taille brute)
export const MAX_TOTAL_BYTES = 3 * 1024 * 1024; // ~3 Mo cumulés (taille brute)

// base64 gonfle d'environ +33 % ; ~3 Mo brut ≈ ~4 Mo encodés. On borne le corps
// reçu côté serveur juste sous la limite Vercel (4,5 Mo).
export const MAX_BODY_B64 = 4_200_000;
