import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { HEBERGEUR, LEGAL, MAJ, TRACEURS } from "./data";
import { ouvrirReglagesCookies } from "@/consent/consent";

/* ────────────────────────── Coquille commune ────────────────────────── */

function Page({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-rw-white text-rw-black">
      <header className="border-b-2 border-rw-black">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link to="/avocats" className="flex items-center gap-3">
            <Wordmark className="h-4 text-rw-black" />
          </Link>
          <Link
            to="/avocats"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-rw-muted transition-colors hover:text-rw-black"
          >
            <ArrowLeft className="size-3.5" /> Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-16">
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] leading-[1]">{titre}</h1>
        <p className="rw-eyebrow mt-4 text-rw-tertiary">Mise à jour : {MAJ}</p>
        <div className="mt-10 space-y-8">{children}</div>
      </main>

      <footer className="border-t-2 border-rw-black bg-rw-black text-rw-white">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-4 px-5 py-6 sm:px-8">
          <Link to="/mentions-legales" className="font-mono text-[10px] uppercase tracking-[0.14em] hover:text-rw-orange">
            Mentions légales
          </Link>
          <Link to="/confidentialite" className="font-mono text-[10px] uppercase tracking-[0.14em] hover:text-rw-orange">
            Données personnelles
          </Link>
          <button
            type="button"
            onClick={ouvrirReglagesCookies}
            className="font-mono text-[10px] uppercase tracking-[0.14em] hover:text-rw-orange"
          >
            Gérer les cookies
          </button>
        </div>
      </footer>
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[1.15rem] leading-none">{titre}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-rw-muted">{children}</div>
    </section>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b-2 border-rw-line-subtle py-2.5 sm:flex-row sm:gap-4">
      <span className="w-56 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-rw-tertiary">
        {label}
      </span>
      <span className="text-[15px] text-rw-black">{valeur}</span>
    </div>
  );
}

/* ───────────────────────── Mentions légales ─────────────────────────── */

export function MentionsLegales() {
  useEffect(() => {
    document.title = "Mentions légales | REWOLF";
  }, []);

  return (
    <Page titre="Mentions légales">
      <Bloc titre="Éditeur du site">
        <div className="mt-1">
          <Ligne label="Dénomination" valeur={LEGAL.denomination} />
          <Ligne label="Forme juridique" valeur={LEGAL.formeJuridique} />
          <Ligne label="Siège" valeur={LEGAL.adresse} />
          <Ligne label="SIRET" valeur={LEGAL.siret} />
          <Ligne label="RCS" valeur={LEGAL.rcs} />
          <Ligne label="TVA intracommunautaire" valeur={LEGAL.tvaIntra} />
          <Ligne label="Code APE" valeur={LEGAL.ape} />
          <Ligne label="Immatriculation" valeur={LEGAL.immatriculation} />
          <Ligne label="Directeur de la publication" valeur={LEGAL.directeurPublication} />
          <Ligne label="Contact" valeur={`${LEGAL.email} — ${LEGAL.telephone}`} />
        </div>
      </Bloc>

      <Bloc titre="Hébergeur">
        <p>
          {HEBERGEUR.nom}, {HEBERGEUR.adresse} —{" "}
          <a href={HEBERGEUR.site} className="underline decoration-rw-orange decoration-2 underline-offset-4">
            {HEBERGEUR.site}
          </a>
        </p>
      </Bloc>

      <Bloc titre="Propriété intellectuelle">
        <p>
          L'ensemble des contenus de ce site — textes, mises en page, graphismes, photographies, code —
          est la propriété de son éditeur, sauf mention contraire. Toute reproduction ou représentation,
          totale ou partielle, sans autorisation écrite préalable est interdite.
        </p>
        <p>
          Les chiffres relatifs au cabinet Plouton sont publiés avec l'accord du cabinet. Les marques et
          logos cités appartiennent à leurs titulaires respectifs et sont mentionnés à titre de références
          de travaux réalisés.
        </p>
      </Bloc>

      <Bloc titre="Responsabilité">
        <p>
          Les informations présentées sont fournies à titre indicatif. Les résultats obtenus pour un client
          ne constituent ni un engagement ni une garantie de résultat comparable pour un autre. Aucune
          prestation n'est engagée sans devis accepté.
        </p>
      </Bloc>

      <Bloc titre="Données personnelles">
        <p>
          Le traitement de vos données et les traceurs déposés par ce site sont décrits sur la page{" "}
          <Link
            to="/confidentialite"
            className="underline decoration-rw-orange decoration-2 underline-offset-4"
          >
            données personnelles
          </Link>
          .
        </p>
      </Bloc>
    </Page>
  );
}

/* ──────────────────────── Données personnelles ──────────────────────── */

export function Confidentialite() {
  useEffect(() => {
    document.title = "Données personnelles et cookies | REWOLF";
  }, []);

  return (
    <Page titre="Données personnelles et cookies">
      <Bloc titre="Responsable de traitement">
        <p>
          {LEGAL.denomination}, {LEGAL.adresse}. Contact :{" "}
          <a
            href={`mailto:${LEGAL.email}`}
            className="underline decoration-rw-orange decoration-2 underline-offset-4"
          >
            {LEGAL.email}
          </a>
          .
        </p>
      </Bloc>

      <Bloc titre="Ce que nous collectons">
        <p>
          <b className="text-rw-black">Si vous nous écrivez ou nous appelez</b> : les informations que vous
          nous transmettez (nom, cabinet, coordonnées, contexte). Base légale : l'exécution de mesures
          précontractuelles à votre demande. Conservation : trois ans à compter du dernier contact.
        </p>
        <p>
          <b className="text-rw-black">Si vous acceptez les cookies de mesure</b> : des données de navigation
          anonymes (pages consultées, provenance, appareil), traitées par Google. Base légale : votre
          consentement, révocable à tout moment.
        </p>
        <p>
          Aucune donnée n'est vendue ni cédée. Nous n'utilisons pas de profilage publicitaire au-delà de la
          mesure de nos propres annonces.
        </p>
      </Bloc>

      <Bloc titre="Traceurs déposés">
        <p>
          Aucun traceur soumis à consentement n'est déposé tant que vous n'avez pas accepté. Le refus est la
          position par défaut, y compris si vous ignorez le bandeau.
        </p>
        <div className="mt-4 space-y-3">
          {TRACEURS.map((t) => (
            <div key={t.nom} className="rw-hard rw-shadow-sm p-4">
              <p className="text-[14px] font-bold">{t.nom}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-rw-tertiary">
                {t.editeur} · conservation {t.duree} · soumis à consentement
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-rw-muted">{t.finalite}</p>
            </div>
          ))}
        </div>
        <p className="pt-2">
          Ces services sont édités par Google Ireland Limited. Des transferts hors Union européenne peuvent
          intervenir, encadrés par le cadre de protection des données UE–États-Unis.
        </p>
        <button
          type="button"
          onClick={ouvrirReglagesCookies}
          className="mt-2 inline-flex items-center gap-2 border-2 border-rw-black bg-rw-orange px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-rw-black shadow-[var(--shadow-hard-sm)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          Modifier mon choix
        </button>
      </Bloc>

      <Bloc titre="Vos droits">
        <p>
          Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de
          portabilité. Écrivez à{" "}
          <a
            href={`mailto:${LEGAL.email}`}
            className="underline decoration-rw-orange decoration-2 underline-offset-4"
          >
            {LEGAL.email}
          </a>
          . Vous pouvez également introduire une réclamation auprès de la CNIL —{" "}
          <a
            href="https://www.cnil.fr"
            className="underline decoration-rw-orange decoration-2 underline-offset-4"
          >
            cnil.fr
          </a>
          .
        </p>
      </Bloc>
    </Page>
  );
}
