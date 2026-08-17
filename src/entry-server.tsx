import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Routes, Route, Navigate } from "react-router-dom";
import "./styles/globals.css";
import Avocats from "./avocats/Avocats";
import SiteInternet from "./avocats/SiteInternet";
import Referencement from "./avocats/Referencement";

/**
 * Entrée de rendu serveur — utilisée UNIQUEMENT par `scripts/prerender.mjs`
 * à la compilation, jamais à l'exécution.
 *
 * Pourquoi elle existe : la campagne Google Ads envoie sur `/avocats` et
 * `/avocats/site-internet`, et le HTML servi était une coquille vide
 * (`<div id="root"></div>`) au titre générique « Cadrage projet · REWOLF Studio ».
 * Un évaluateur qui n'exécute pas le JavaScript voyait 30 caractères là où
 * l'annonce promet « site internet pour avocats, 7 500 € HT ». C'est exactement
 * l'incohérence annonce → page que Google pénalise dans la composante
 * « convivialité de la page de destination ».
 *
 * On ne rend ici que les deux pages publicitaires. Le reste de l'application —
 * questionnaires clients, plaquettes, crémaillère — continue d'être servi en SPA
 * pure, avec son `noindex` par défaut. Rien de leur comportement ne change.
 *
 * Le bandeau de consentement est volontairement absent du rendu serveur : il
 * dépend de `localStorage`, et le HTML pré-rendu est identique pour tout le monde.
 * Il s'affiche normalement dès l'hydratation.
 */
export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <Routes>
          <Route path="/avocats" element={<Avocats />} />
          <Route path="/avocats/site-internet" element={<SiteInternet />} />
          <Route path="/avocats/referencement" element={<Referencement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StaticRouter>
    </StrictMode>,
  );
}
