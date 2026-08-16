import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Mail, Phone, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ouvrirReglagesCookies } from "@/consent/consent";
import Formulaire from "./Formulaire";
import {
  BLOCS,
  CHIFFRES,
  CONTACT,
  PROCESS,
  REFERENCES,
  TARIF,
  TRAJECTOIRE,
  formatNombre,
  formatPosition,
} from "./data";

const NAV = [
  { id: "preuve", label: "Le cas Plouton" },
  { id: "methode", label: "Ce qu'on fait" },
  { id: "deontologie", label: "Déontologie" },
  { id: "process", label: "Process" },
] as const;

const MAILTO = (email: string) =>
  `mailto:${email}?subject=${encodeURIComponent("Visibilité de mon cabinet | REWOLF")}`;

/**
 * Conversions Google Ads — compte AW-11144920628. Deux actions dédiées à la
 * plaquette avocats, pour que le rapport dise qui a appelé et qui a écrit :
 *  - formulaire et e-mails → « Contact avocats (formulaire + e-mail) », 700 €
 *  - téléphones → « Annonce Appel Direct », 1 €
 */
// L'action « Contact avocats » (mBTHCM-XrN4cELT8p8Ip) n'est plus déclenchée ici :
// elle appartient au seul envoi du formulaire, dans Formulaire.tsx.
const CONVERSION_APPEL = "AW-11144920628/vx34COKEmd4cELT8p8Ip";

/**
 * Signale la conversion au clic sur un e-mail ou un téléphone.
 * On ne bloque pas la navigation : `mailto:` et `tel:` ouvrent une application
 * externe sans décharger la page, la requête a donc le temps de partir.
 */
/** Vrai seulement sur un appareil qui sait passer un appel : un `tel:` cliqué sur
 *  un ordinateur n'appelle personne. */
function peutAppeler() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: none) and (pointer: coarse)").matches === true
  );
}

function cta(name: string, section: string) {
  const appel = name.startsWith("tel_");
  return () => {
    // Google Ads — une conversion ne se déclenche que pour un acte de contact réel :
    // un appel depuis un mobile. Ouvrir son client mail n'est pas écrire, et un `tel:`
    // sur ordinateur n'appelle personne : ces deux cas ne comptent plus.
    if (appel && peutAppeler()) {
      window.gtag?.("event", "conversion", {
        send_to: CONVERSION_APPEL,
        value: 1.0,
        currency: "EUR",
      });
    }
    // GA4 — même événement partout ; `method` garde le canal exact
    // (tel_nicolas, tel_elise, email_nicolas, email_elise).
    window.gtag?.("event", "generate_lead", { method: name, section });
  };
}

export default function Avocats() {
  useEffect(() => {
    document.title = "Visibilité des cabinets d'avocats | REWOLF";
  }, []);

  return (
    <div className="min-h-dvh bg-rw-white text-rw-black">
      <TopBar />
      <Hero />
      <Preuve />
      <Methode />
      <Deontologie />
      <References />
      <Exclusivite />
      <Process />
      <Tarif />
      <Contact />
      <Footer />
    </div>
  );
}

/* ─────────────────────────── Header ─────────────────────────── */

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-rw-black bg-rw-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-3">
          <Wordmark className="h-4 text-rw-black sm:h-[18px]" />
          <span className="hidden h-4 w-px bg-rw-line-subtle sm:block" />
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-rw-muted sm:block">
            Cabinets d'avocats
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-rw-muted transition-colors hover:text-rw-black"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <a
          href="#contact"
          className="inline-flex items-center gap-1.5 border-2 border-rw-black bg-rw-orange px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rw-black shadow-[var(--shadow-hard-sm)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          Nous écrire <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </header>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-rw-black text-rw-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-12 lg:gap-14 lg:py-24">
        <div className="lg:col-span-7">
          <p className="rw-eyebrow text-rw-orange">REWOLF · Cabinets d'avocats</p>

          <h1 className="mt-5 text-rw-white text-[clamp(2.2rem,5.4vw,4.4rem)] leading-[0.94]">
            De la 18<sup className="text-[0.45em] normal-case">e</sup> à la{" "}
            <span className="text-rw-orange">
              7<sup className="text-[0.45em] normal-case">e</sup> place
            </span>{" "}
            sur Google.<br className="hidden sm:inline" /> En cinq trimestres.
          </h1>

          <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-rw-white/70 sm:text-[17px]">
            Nous avons repris le site du <b className="text-rw-white">cabinet Plouton</b>, pénaliste, en{" "}
            {CHIFFRES.repriseAnnee}. Il a reçu depuis{" "}
            <b className="text-rw-white">{formatNombre(CHIFFRES.clics16Mois)} visites</b> venues de la
            recherche Google. Ces visites ne sont pas des dossiers : nous répondons des positions et du
            trafic, c'est-à-dire de ce que nous maîtrisons. Ce qui se joue ensuite au téléphone et au premier
            rendez-vous vous appartient.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button variant="rw" size="lg" asChild>
              <a href="#preuve">
                Voir les chiffres <ArrowRight className="size-5" />
              </a>
            </Button>
            <Button variant="rw" size="lg" asChild>
              <a href="#contact">Parler de votre cabinet</a>
            </Button>
          </div>
        </div>

        {/* Trois compteurs, à droite */}
        <aside className="grid gap-4 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
          <Compteur
            valeur={formatNombre(CHIFFRES.impressions16Mois)}
            libelle="apparitions dans Google sur 16 mois"
          />
          <Compteur valeur={`+${String(CHIFFRES.yoy.clics).replace(".", ",")} %`} libelle="de visites en un an, à saison comparable" />
          <Compteur valeur="5" libelle="trimestres de progression, sans exception" />
        </aside>
      </div>
    </section>
  );
}

function Compteur({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div className="border-2 border-rw-white/25 bg-rw-white/[0.03] p-5">
      <p className="font-sans text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-none tracking-tight text-rw-orange">
        {valeur}
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-rw-white/55">
        {libelle}
      </p>
    </div>
  );
}

/* ──────────────────────────── Preuve ──────────────────────────── */

function Preuve() {
  const maxClics = Math.max(...TRAJECTOIRE.map((t) => t.clics));

  return (
    <Section id="preuve" eyebrow="01 — La preuve" titre={<>Un cabinet, cinq trimestres, aucune exception.</>}>
      <p className="max-w-2xl text-[16px] leading-relaxed text-rw-muted">
        Le cabinet Plouton nous a confié son site en {CHIFFRES.repriseAnnee}. Depuis, sa position moyenne sur
        Google s'améliore <b className="text-rw-black">à chaque trimestre, sans exception</b>. Les chiffres
        ci-dessous sortent de sa Google Search Console, pas d'un outil maison — le cabinet les a autorisés à la
        publication.
      </p>

      <div className="mt-10 border-2 border-rw-black">
        {/* En-tête */}
        <div className="hidden grid-cols-12 gap-4 border-b-2 border-rw-black bg-rw-paper-subtle px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-rw-muted sm:grid">
          <span className="col-span-3">Période</span>
          <span className="col-span-5">Visites depuis Google</span>
          <span className="col-span-2 text-right">Apparitions</span>
          <span className="col-span-2 text-right">Position moy.</span>
        </div>

        {TRAJECTOIRE.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className={cn(
              "grid grid-cols-2 gap-x-4 gap-y-2 px-5 py-4 sm:grid-cols-12 sm:items-center",
              i < TRAJECTOIRE.length - 1 && "border-b-2 border-rw-line-subtle",
              i === TRAJECTOIRE.length - 1 && "bg-rw-paper-subtle",
            )}
          >
            <div className="col-span-2 sm:col-span-3">
              <p className="font-mono text-[12px] font-bold uppercase tracking-wider">{t.label}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-rw-tertiary">{t.periode}</p>
            </div>

            <div className="col-span-2 sm:col-span-5">
              <div className="flex items-center gap-3">
                <div className="h-3 flex-1 border-2 border-rw-black bg-rw-white">
                  <div
                    className="h-full bg-rw-orange"
                    style={{ width: `${Math.round((t.clics / maxClics) * 100)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-[12px] font-bold tabular-nums">
                  {formatNombre(t.clics)}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 sm:text-right">
              <span className="font-mono text-[10px] uppercase tracking-wider text-rw-tertiary sm:hidden">
                Apparitions{" "}
              </span>
              <span className="font-mono text-[12px] tabular-nums text-rw-muted">
                {formatNombre(t.impressions)}
              </span>
            </div>

            <div className="sm:col-span-2 sm:text-right">
              <span className="font-mono text-[10px] uppercase tracking-wider text-rw-tertiary sm:hidden">
                Position{" "}
              </span>
              <span
                className={cn(
                  "font-sans text-[18px] font-extrabold tabular-nums tracking-tight",
                  i === TRAJECTOIRE.length - 1 ? "text-rw-orange" : "text-rw-black",
                )}
              >
                {formatPosition(t.position)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Fait
          chiffre={`+${String(CHIFFRES.yoy.impressions).replace(".", ",")} %`}
          texte="d'apparitions dans Google entre le 2ᵉ trimestre 2025 et le 2ᵉ trimestre 2026 — même saison, donc comparable."
        />
        <Fait
          chiffre={`+${String(CHIFFRES.yoy.clics).replace(".", ",")} %`}
          texte="de visites sur la même comparaison. Le trafic a plus que doublé en un an."
        />
        <Fait
          chiffre="÷ 2,5"
          texte={`la position moyenne, passée de ${formatPosition(CHIFFRES.positionDepart)} à ${formatPosition(CHIFFRES.positionActuelle)}. De la deuxième page à la première.`}
        />
      </div>

      <div className="mt-8 max-w-2xl space-y-4 border-l-2 border-rw-orange pl-5 text-[15px] leading-relaxed text-rw-muted">
        <p>
          <b className="text-rw-black">Le dernier trimestre baisse, et nous n'allons pas faire semblant de
          ne pas le voir.</b>{" "}
          Avril-juin 2026 recule de 19 % en visites par rapport au trimestre précédent. C'est saisonnier : le
          droit se cherche en janvier et à la rentrée, pas en juillet. La preuve est dans la comparaison à
          saison égale — avril-juin 2026 contre avril-juin 2025 : +92,8 %. Et la position moyenne, elle, a
          continué de progresser ce trimestre-là.
        </p>
        <p>
          Ce résultat ne vient pas d'une astuce technique. Il vient d'une{" "}
          <b className="text-rw-black">centaine d'articles écrits</b> — ressources juridiques et actualité du
          cabinet — sur les questions que se posent réellement les justiciables. Et d'un travail beaucoup
          moins visible : <b className="text-rw-black">les anciens articles du site, repris un par un</b>,
          restructurés, rebalisés, réécrits quand le style ne tenait pas.
        </p>
        <p>
          C'est souvent là que se trouve le premier gain. Un cabinet qui publie depuis dix ans a déjà un
          patrimoine éditorial ; il est simplement invisible parce que personne ne l'a jamais structuré pour
          Google. Nous ne promettons jamais de résultat en trois mois, mais nous commençons rarement de zéro.
        </p>
        <p>
          <b className="text-rw-black">Et c'est un seul cabinet.</b> Nous n'allons pas prétendre qu'un cas
          fait une jurisprudence. Nous travaillons pour des marques depuis des années, pour des cabinets
          d'avocats depuis dix-huit mois. Si vous cherchez un prestataire qui aligne vingt références dans votre
          matière, ce n'est pas nous — et vous avez raison de le demander.
        </p>
      </div>
    </Section>
  );
}

function Fait({ chiffre, texte }: { chiffre: string; texte: string }) {
  return (
    <div className="rw-hard rw-shadow-sm p-5">
      <p className="font-sans text-[1.9rem] font-extrabold leading-none tracking-tight text-rw-orange">
        {chiffre}
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-rw-muted">{texte}</p>
    </div>
  );
}

/* ──────────────────────────── Méthode ─────────────────────────── */

function Methode() {
  return (
    <Section
      id="methode"
      eyebrow="02 — Ce qu'on fait"
      titre={<>Cinq métiers, deux interlocuteurs. Ce n'est pas un détail d'organisation.</>}
      variant="subtle"
    >
      <p className="max-w-2xl text-[16px] leading-relaxed text-rw-muted">
        Coordonner un graphiste, un développeur, un rédacteur, un référenceur et un photographe est un
        travail à part entière. Il n'est pas facturable, et il vous revient. Nous sommes deux et nous tenons
        les cinq rôles : un site qui gagne des places mais donne de votre cabinet une image fausse ne vous
        sert pas, il vous dessert.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {BLOCS.map((b, i) => (
          <motion.article
            key={b.num}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="rw-hard rw-shadow flex flex-col p-6"
          >
            <span className="rw-tag self-start">{b.num}</span>
            <h3 className="mt-4 text-[1.35rem] leading-none">{b.titre}</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-rw-muted">{b.chapo}</p>
            <ul className="mt-5 space-y-2 border-t-2 border-rw-line-subtle pt-4">
              {b.items.map((it) => (
                <li key={it} className="flex gap-2.5 text-[13px] leading-snug">
                  <Check className="mt-[3px] size-3.5 shrink-0 text-rw-orange" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>

      <div className="mt-10 border-l-2 border-rw-orange pl-6">
        <p className="max-w-2xl text-[16px] leading-relaxed text-rw-black">
          Être bien placé attire aussi ce que vous ne cherchez pas : des appels hors de votre matière, des
          dossiers sans moyens, des demandes de consultation gratuite. Un site doit donc trier autant qu'il
          attire.
        </p>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-rw-muted">
          Matière, ressort, mode de saisine et principe de facturation sont annoncés avant l'appel, pas
          pendant. Un formulaire qui écarte coûte moins cher qu'un rendez-vous qui n'aboutit pas.
        </p>
      </div>
    </Section>
  );
}

/* ─────────────────────────── Déontologie ──────────────────────── */

function Deontologie() {
  return (
    <section className="border-y-2 border-rw-black bg-rw-black text-rw-white">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16" id="deontologie">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <ShieldCheck className="size-8 text-rw-orange" strokeWidth={1.5} />
            <p className="rw-eyebrow mt-5 text-rw-orange">03 — Déontologie</p>
            <h2 className="mt-4 text-rw-white text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1]">
              Nous connaissons les règles qui s'appliquent à vous.
            </h2>
          </div>

          <div className="space-y-5 text-[15px] leading-relaxed text-rw-white/70 lg:col-span-7">
            <p>
              Le site d'un avocat relève de la publicité personnelle. Il obéit à l'article 10 du Règlement
              Intérieur National : mentions valorisantes ou comparatives proscrites, titre de spécialiste
              réservé aux titulaires du certificat, information du conseil de l'Ordre en cas de modification
              substantielle.
            </p>
            <p>
              Ces règles sont mal connues des prestataires. « Meilleur avocat de Bordeaux » tombe sous
              l'interdiction de tout élément comparatif posée par l'article 10 ; « spécialiste » et
              « spécialisé » supposent un certificat de spécialisation, alors qu'on peut nommer ses domaines
              d'activité sans jamais les employer. Google récompense ces deux formules ; votre Ordre les
              sanctionne. En cas de difficulté, ce n'est pas l'agence qui répond — c'est vous.
            </p>
            <p>
              Reste la question que personne ne pose à voix haute : que dira le confrère qui vous voit passer
              devant lui ? Nous n'écrivons jamais contre un cabinet nommé, nous ne comparons pas, nous ne
              commentons pas une décision où un confrère reste identifiable. Votre visibilité doit pouvoir se
              justifier devant votre bâtonnier sans que vous ayez à la défendre.
            </p>
            <p className="border-l-2 border-rw-orange pl-5 text-rw-white">
              Nous travaillons dans le cadre, pas contre lui. Chaque texte publié vous est soumis avant mise en
              ligne, et rien n'est jamais mis en ligne sans votre validation écrite.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Références ───────────────────────── */

function References() {
  return (
    <section className="border-b-2 border-rw-line-subtle">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <p className="rw-eyebrow text-rw-tertiary">Le studio, en dehors du droit</p>
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          {REFERENCES.map((r) => (
            <span key={r} className="text-[15px] font-extrabold uppercase tracking-tight text-rw-black">
              {r}
            </span>
          ))}
        </div>
        <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-rw-muted">
          Marque, direction artistique, photographie, packaging. Ce sont des travaux de studio, pas des
          missions d'acquisition — nous les citons pour ce qu'ils disent de notre exigence graphique, pas
          pour laisser croire que nous référençons des avionneurs.
        </p>
        <a
          href="https://www.rewolf.studio"
          target="_blank"
          rel="noopener"
          className="mt-5 inline-flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-tight underline decoration-rw-orange decoration-2 underline-offset-4 hover:text-rw-orange"
        >
          Voir ces travaux sur rewolf.studio ↗
        </a>
      </div>
    </section>
  );
}

/* ────────────────────────── Exclusivité ───────────────────────── */

function Exclusivite() {
  return (
    <Section eyebrow="04 — Une règle" titre={<>Un cabinet par barreau et par matière.</>}>
      <div className="grid gap-8 lg:grid-cols-2">
        <p className="text-[16px] leading-relaxed text-rw-muted">
          Nous ne travaillons pas pour deux cabinets qui se disputent les mêmes justiciables dans le même
          ressort. Ce serait vous vendre une visibilité que nous construirions simultanément contre vous.
        </p>
        <p className="text-[16px] leading-relaxed text-rw-muted">
          C'est une contrainte commerciale que nous nous imposons, et la raison pour laquelle nous ne
          travaillons qu'avec un petit nombre de cabinets. Si votre barreau et votre matière sont déjà pris,
          nous vous le disons dès le premier échange.
        </p>
      </div>
    </Section>
  );
}

/* ──────────────────────────── Process ─────────────────────────── */

function Process() {
  return (
    <Section id="process" eyebrow="05 — Comment ça se passe" titre={<>Quatre temps, dont un seul compte vraiment.</>} variant="subtle">
      <div className="mt-2 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PROCESS.map((e, i) => (
          <motion.div
            key={e.num}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="rw-hard rw-shadow-sm flex flex-col p-5"
          >
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-rw-orange">
              {e.num}
            </span>
            <h3 className="mt-3 text-[1.05rem] leading-none">{e.titre}</h3>
            <p className="mt-3 flex-1 text-[13px] leading-relaxed text-rw-muted">{e.texte}</p>
            <p className="mt-4 border-t-2 border-rw-line-subtle pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-rw-tertiary">
              {e.duree}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────────── Tarif ──────────────────────────── */

function Tarif() {
  return (
    <Section id="tarif" eyebrow="06 — Ce que ça coûte" titre={<>Six cents euros par mois. Sans engagement.</>}>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="rw-hard rw-shadow p-7">
            <p className="rw-eyebrow text-rw-tertiary">Production éditoriale</p>
            <p className="mt-4 font-sans text-[3rem] font-extrabold leading-none tracking-tight">
              {TARIF.mensuel} €
              <span className="ml-2 align-middle font-mono text-[13px] font-medium tracking-normal text-rw-muted">
                HT / mois
              </span>
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-rw-muted">
              {TARIF.articlesParMois} articles juridiques par mois, écrits, relus par vous, publiés et suivis.
              Soit {TARIF.prixArticle} € l'article.
            </p>
            <p className="mt-5 border-t-2 border-rw-line-subtle pt-4 text-[14px] font-bold leading-snug">
              Vous arrêtez à la fin du mois de votre choix, le premier compris. Vous jugez sur pièces, pas sur
              promesse.
            </p>
          </div>
        </div>

        <div className="space-y-5 text-[15px] leading-relaxed text-rw-muted lg:col-span-7">
          <p>
            Ensuite, si ça vous convient, des forfaits de 3, 6 ou 12 mois — le nôtre avec le cabinet Plouton
            tourne par blocs de six. Si le site est à refaire, c'est{" "}
            <b className="text-rw-black">{formatNombre(TARIF.site)} € HT</b>, prix ferme, payable en plusieurs
            fois —{" "}
            <Link
              to="/avocats/site-internet"
              className="font-bold text-rw-black underline decoration-rw-orange decoration-2 underline-offset-4"
            >
              le détail est ici
            </Link>
            .
          </p>
          <p>
            <b className="text-rw-black">Ce que le dispositif vous coûte en temps</b>, puisque personne ne le
            chiffre jamais : quatre articles par mois représentent environ une heure de relecture. Rien n'est
            publié sans votre validation écrite : cette heure n'est donc pas facultative. Elle ne tombera
            jamais au bon moment — nous travaillons avec un mois d'avance et vous relisez par lots, pour
            qu'une semaine d'audiences n'arrête pas le dispositif. Si vous ne l'avez pas, le dispositif ne
            fonctionne pas et nous préférons vous le dire maintenant.
          </p>
          <p className="border-l-2 border-rw-orange pl-5 text-rw-black">
            Nous n'avons pas de tarif caché ni de devis à géométrie variable. C'est le prix que paie le
            cabinet dont vous venez de lire les chiffres.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ──────────────────────────── Contact ─────────────────────────── */

function Contact() {
  return (
    <section id="contact" className="border-t-2 border-rw-black bg-rw-orange text-rw-black">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <p className="rw-eyebrow">07 — Parlons-en</p>
        <h2 className="mt-4 max-w-3xl text-[clamp(1.9rem,4.2vw,3rem)] leading-[1]">
          Dites-nous votre barreau et votre matière. Nous vous dirons si la place est prenable — y compris
          quand elle ne l'est pas.
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-rw-black/75">
          Premier échange sans engagement, trente minutes. Si votre marché est saturé ou si le volume de
          recherche ne le justifie pas, nous vous le dirons — c'est arrivé, et ça nous évite à tous les deux de
          perdre un an.
        </p>

        <div className="mt-10">
          <Formulaire />
        </div>

        <p className="mt-10 rw-eyebrow text-rw-black/60">Ou directement</p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {[CONTACT.nicolas, CONTACT.elise].map((p) => (
            <div key={p.email} className="border-2 border-rw-black bg-rw-white p-6">
              <p className="text-[1.15rem] font-extrabold uppercase leading-none tracking-tight">{p.nom}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-rw-muted">{p.role}</p>
              <div className="mt-5 space-y-2.5">
                <a
                  href={MAILTO(p.email)}
                  onClick={cta(`email_${p.email.split("@")[0]}`, "contact")}
                  className="flex items-center gap-2.5 text-[14px] font-medium underline decoration-rw-orange decoration-2 underline-offset-4 hover:text-rw-orange"
                >
                  <Mail className="size-4 shrink-0" /> {p.email}
                </a>
                <a
                  href={`tel:${p.telHref}`}
                  onClick={cta(`tel_${p.email.split("@")[0]}`, "contact")}
                  className="flex items-center gap-2.5 text-[14px] font-medium hover:text-rw-orange"
                >
                  <Phone className="size-4 shrink-0" /> {p.tel}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Footer ──────────────────────────── */

function Footer() {
  return (
    <footer className="border-t-2 border-rw-black bg-rw-black text-rw-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark className="h-4 text-rw-white" />
          <p className="max-w-md font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-rw-white/45">
            Agence REWOLF · Bordeaux · Chiffres Search Console relevés le 6 août 2026, publiés avec l'accord
            du cabinet Plouton
          </p>
          <a
            href="https://www.rewolf.studio"
            target="_blank"
            rel="noopener"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-rw-orange hover:underline"
          >
            rewolf.studio ↗
          </a>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-rw-white/15 pt-5">
          <Link
            to="/mentions-legales"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-rw-white/55 hover:text-rw-orange"
          >
            Mentions légales
          </Link>
          <Link
            to="/confidentialite"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-rw-white/55 hover:text-rw-orange"
          >
            Données personnelles
          </Link>
          <button
            type="button"
            onClick={ouvrirReglagesCookies}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-rw-white/55 hover:text-rw-orange"
          >
            Gérer les cookies
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────── Primitive de section ─────────────────── */

function Section({
  id,
  eyebrow,
  titre,
  children,
  variant = "default",
}: {
  id?: string;
  eyebrow: string;
  titre: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "subtle";
}) {
  return (
    <section
      id={id}
      className={cn(
        "border-b-2 border-rw-line-subtle",
        variant === "subtle" ? "bg-rw-paper-subtle" : "bg-rw-white",
      )}
    >
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <p className="rw-eyebrow text-rw-tertiary">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl text-[clamp(1.8rem,3.8vw,2.8rem)] leading-[1]">{titre}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
