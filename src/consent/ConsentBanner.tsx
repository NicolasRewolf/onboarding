import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ecouterOuverture, enregistrerChoix, lireChoix } from "./consent";

/**
 * Bandeau de consentement CNIL.
 * Refuser doit être aussi simple qu'accepter : deux boutons de même poids visuel,
 * même niveau, aucun pré-cochage. Le bandeau ne bloque pas la lecture de la page.
 */
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lireChoix() === null) setVisible(true);
    return ecouterOuverture(() => setVisible(true));
  }, []);

  function decider(choix: "granted" | "denied") {
    enregistrerChoix(choix);
    setVisible(false);
  }

  // Démontage franc plutôt qu'animation de sortie : une bannière restée dans le DOM
  // à opacité nulle intercepte les clics du bloc de contact, en bas de page.
  if (!visible) return null;

  return (
    <>
      {
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-label="Consentement aux cookies de mesure"
          className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-rw-black bg-rw-white p-4 sm:p-5"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-2xl text-[14px] leading-relaxed text-rw-muted">
              Nous utilisons des cookies de mesure pour savoir quelles annonces mènent à une prise de
              contact. Rien n'est déposé sans votre accord, et refuser ne change rien à votre navigation.{" "}
              <Link
                to="/confidentialite"
                className="text-rw-black underline decoration-rw-orange decoration-2 underline-offset-4"
              >
                En savoir plus
              </Link>
            </p>

            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => decider("denied")}
                className="border-2 border-rw-black bg-rw-white px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rw-black shadow-[var(--shadow-hard-sm)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={() => decider("granted")}
                className="border-2 border-rw-black bg-rw-orange px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rw-black shadow-[var(--shadow-hard-sm)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
              >
                Accepter
              </button>
            </div>
          </div>
        </motion.div>
      }
    </>
  );
}
