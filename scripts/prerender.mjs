/**
 * Pré-rendu des deux pages publicitaires, exécuté après `vite build`.
 *
 * Problème résolu — mesuré le 17 août 2026 : un robot sans JavaScript recevait
 * 30 caractères sur `/avocats/site-internet` (titre « Cadrage projet · REWOLF
 * Studio », aucune description, corps vide) alors que l'annonce Google Ads
 * promet « site internet pour avocats, 7 500 € HT ». Google évalue la
 * « convivialité de la page de destination » sur la pertinence et la cohérence
 * annonce → page : la composante était notée « inférieure à la moyenne » sur
 * 100 % des mots clés depuis le lancement, sans jamais bouger.
 *
 * Ce que fait ce script, et rien de plus :
 *   · rend les deux routes en HTML réel avec React côté serveur ;
 *   · écrit le titre et la meta description propres à chaque page ;
 *   · retire `noindex, nofollow` SUR CES DEUX FICHIERS UNIQUEMENT ;
 *   · ajoute un canonical.
 *
 * Ce qu'il ne fait pas : toucher `index.html`, donc toutes les autres routes
 * (questionnaires clients `/c/:slug`, plaquettes, crémaillère) restent servies
 * en SPA avec `noindex` par défaut. C'est un fail-safe, pas un fail-open.
 *
 * Non bloquant par conception : si le rendu échoue, le build reste valide et
 * le site continue de fonctionner en SPA. On préfère une page non pré-rendue
 * à un déploiement cassé.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DIST = resolve("dist");
const TEMPLATE = resolve(DIST, "index.html");

/** Une entrée par page publicitaire. Le `titre` et la `description` doivent
 *  refléter la promesse de l'annonce qui pointe dessus — c'est tout l'objet. */
const PAGES = [
  {
    route: "/avocats/site-internet",
    fichier: "avocats/site-internet/index.html",
    titre: "Création de site internet pour avocats — REWOLF, Bordeaux",
    description:
      "Site internet de cabinet d'avocats : 7 500 € HT prix ferme, six semaines, " +
      "environ quatre heures de votre temps. Pages de matières, blog, formulaire " +
      "qualifiant, référencement. Studio à Bordeaux, cabinets partout en France.",
  },
  {
    route: "/avocats/referencement",
    fichier: "avocats/referencement/index.html",
    titre: "Référencement et contenu juridique pour avocats — REWOLF, Bordeaux",
    description:
      "Référencement de cabinet d'avocats : quatre articles juridiques par mois, 600 € HT " +
      "par mois, premier mois sans engagement. Un cabinet pénaliste passé de la 18e à la 7e " +
      "place Google en cinq trimestres — chiffres Search Console vérifiables.",
  },
  {
    route: "/avocats",
    fichier: "avocats/index.html",
    titre: "Communication et référencement pour cabinets d'avocats — REWOLF",
    description:
      "Marque, site, contenu juridique et photographie pour cabinets d'avocats. " +
      "600 € HT par mois, premier mois sans engagement, un cabinet par barreau. " +
      "Résultats vérifiables en Search Console.",
  },
];

const echappe = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function main() {
  if (!existsSync(TEMPLATE)) {
    console.warn("[prerender] dist/index.html introuvable — étape ignorée.");
    return;
  }

  let render;
  try {
    ({ render } = await import(resolve("dist-ssr/entry-server.js")));
  } catch (e) {
    console.warn(`[prerender] bundle serveur illisible, étape ignorée : ${e.message}`);
    return;
  }

  const template = readFileSync(TEMPLATE, "utf8");
  let ok = 0;

  for (const page of PAGES) {
    try {
      const corps = render(page.route);
      if (!corps || corps.length < 500) {
        console.warn(`[prerender] ${page.route} : rendu vide ou trop court, ignoré.`);
        continue;
      }

      const canonical = `https://onboarding.rewolf.studio${page.route}`;
      const html = template
        // Le titre générique du questionnaire n'a rien à faire sur une page d'annonce.
        .replace(/<title>.*?<\/title>/, `<title>${echappe(page.titre)}</title>`)
        // `noindex` reste le défaut du site ; on ne l'ouvre que sur ces deux fichiers.
        .replace(
          /<meta name="robots" content="noindex, nofollow" \/>/,
          `<meta name="robots" content="index, follow" />\n    ` +
            `<meta name="description" content="${echappe(page.description)}" />\n    ` +
            `<link rel="canonical" href="${canonical}" />`,
        )
        .replace('<div id="root"></div>', `<div id="root">${corps}</div>`);

      const cible = resolve(DIST, page.fichier);
      mkdirSync(dirname(cible), { recursive: true });
      writeFileSync(cible, html, "utf8");
      console.log(`[prerender] ${page.route} → ${page.fichier} (${corps.length} caractères)`);
      ok++;
    } catch (e) {
      console.warn(`[prerender] ${page.route} a échoué, ignoré : ${e.message}`);
    }
  }

  console.log(`[prerender] ${ok}/${PAGES.length} page(s) pré-rendue(s).`);
}

main().catch((e) => {
  console.warn(`[prerender] échec global, build conservé : ${e.message}`);
});
