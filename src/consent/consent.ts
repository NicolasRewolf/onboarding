/**
 * Consentement aux traceurs — Consent Mode v2.
 *
 * Le refus est posé par défaut dans `index.html`, AVANT le chargement de gtag :
 * aucun cookie de mesure n'est déposé tant que le visiteur n'a pas accepté.
 * Ce module ne fait que mémoriser le choix et le transmettre à Google.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const CLE = "rw_consent";

export type Choix = "granted" | "denied";

/** Événement interne : demande de réouverture du bandeau depuis un lien « gérer les cookies ». */
const EVT_OUVRIR = "rw:consent:open";

export function lireChoix(): Choix | null {
  try {
    const v = localStorage.getItem(CLE);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function enregistrerChoix(choix: Choix): void {
  try {
    localStorage.setItem(CLE, choix);
  } catch {
    /* navigation privée ou stockage bloqué : le choix vaut pour la session */
  }
  appliquer(choix);
}

/** Transmet le choix à Google. Sans acceptation, tout reste refusé. */
function appliquer(choix: Choix): void {
  const accorde = choix === "granted" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: accorde,
    ad_user_data: accorde,
    ad_personalization: accorde,
    analytics_storage: accorde,
  });
}

/** Rouvre le bandeau — utilisé par les liens « gérer les cookies » du pied de page. */
export function ouvrirReglagesCookies(): void {
  window.dispatchEvent(new CustomEvent(EVT_OUVRIR));
}

export function ecouterOuverture(handler: () => void): () => void {
  window.addEventListener(EVT_OUVRIR, handler);
  return () => window.removeEventListener(EVT_OUVRIR, handler);
}
