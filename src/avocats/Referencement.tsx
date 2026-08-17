import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Mail, Phone } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ouvrirReglagesCookies } from "@/consent/consent";
import Formulaire from "./Formulaire";
import { CHIFFRES, CONTACT, TARIF, TRAJECTOIRE, formatNombre, formatPosition } from "./data";
import { LIMITES, LIVRAISON, QUESTIONS, REQUETES, RYTHME } from "./referencementData";

/**
 * Page « Référencement et contenu juridique » — destination du groupe
 * d'annonces « Référencement ». Voir l'en-tête de `referencementData.ts` pour
 * la raison mesurée de son existence.
 *
 * Deux principes, hérités des pages sœurs :
 *  1. la preuve avant l'offre — c'est la seule page où la trajectoire Plouton
 *     démontre exactement ce qu'on vend, il serait absurde de l'enterrer ;
 *  2. une section entière consacrée à ce que l'abonnement NE fait PAS. Ce
 *     lectorat repère une promesse excessive plus vite qu'un autre.
 */

const NAV = [
  { id: "preuve", label: "La preuve" },
  { id: "livraison", label: "Ce qu'on écrit" },
  { id: "prix", label: "Le prix" },
  { id: "limites", label: "Ce que ça ne fait pas" },
];

const MAILTO = (email: string) =>
  `mailto:${email}?subject=${encodeURIComponent("Référencement de mon cabinet | REWOLF")}`;

// Compte AW-11144920628. L'action « Contact avocats » appartient au seul envoi
// du formulaire (Formulaire.tsx) : ouvrir un client mail n'est pas une prise de
// contact, et un `tel:` sur ordinateur n'appelle personne.
const CONVERSION_APPEL = "AW-11144920628/vx34COKEmd4cELT8p8Ip";

function peutAppeler() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: none) and (pointer: coarse)").matches === true
  );
}

function cta(name: string, section: string) {
  const appel = name.startsWith("tel_");
  return () => {
    if (appel && peutAppeler()) {
      window.gtag?.("event", "conversion", {
        send_to: CONVERSION_APPEL,
        value: 1.0,
        currency: "EUR",
      });
    }
    window.gtag?.("event", "generate_lead", { method: name, section });
  };
}

export default function Referencement() {
  useEffect(() => {
    document.title = "Référencement et contenu juridique pour avocats — REWOLF, Bordeaux";
    const desc =
      `Référencement de cabinet d'avocats : ${TARIF.articlesParMois} articles juridiques par mois, ` +
      `${TARIF.mensuel} € HT par mois, premier mois sans engagement. Un cabinet pénaliste passé de la ` +
      `18e à la 7e place Google en cinq trimestres — chiffres Search Console vérifiables.`;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = desc;
  }, []);

  return (
    <div className="min-h-dvh bg-rw-white text-rw-black">
      <TopBar />
      <Hero />
      <Preuve />
      <Requetes />
      <Livraison />
      <Prix />
      <VotreTemps />
      <Limites />
      <Deontologie />
      <Questions />
      <Socle />
      <Contact />
      <Footer />
      <BarreMobile />
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
            Référencement d'avocats
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
    <section id="top" className="border-b-2 border-rw-black bg-rw-black text-rw-white">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
        <p className="rw-eyebrow text-rw-orange">REWOLF · Référencement de cabinets d'avocats</p>

        <h1 className="mt-5 max-w-4xl text-rw-white text-[clamp(2rem,4.8vw,3.9rem)] leading-[0.98]">
          Vos futurs clients ne cherchent pas votre nom.{" "}
          <span className="text-rw-orange">Ils cherchent une réponse.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-rw-white/70 sm:text-[17px]">
          Nous écrivons chaque mois les articles juridiques qui répondent aux questions que vos futurs
          clients posent réellement à Google. Vous relisez, vous validez, nous publions. Ils traitent de la
          règle — jamais de vos dossiers, jamais de vous.
        </p>

        <div className="mt-9 grid gap-px border-2 border-rw-white/25 bg-rw-white/25 sm:grid-cols-3">
          <Fait valeur={`${TARIF.mensuel} € HT`} libelle="par mois, tout compris" />
          <Fait valeur={`${TARIF.articlesParMois} articles`} libelle="par mois, écrits et publiés" />
          <Fait valeur="1er mois" libelle="sans engagement, arrêt quand vous voulez" />
        </div>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button variant="rw" size="lg" asChild>
            <a href="#contact">
              Parler de votre cabinet <ArrowRight className="size-5" />
            </a>
          </Button>
          <Button variant="rw" size="lg" asChild>
            <a href={`tel:${CONTACT.nicolas.telHref}`} onClick={cta("tel_nicolas", "hero")}>
              Appeler Nicolas — {CONTACT.nicolas.tel}
            </a>
          </Button>
        </div>

        <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-rw-white/55">
          Un cabinet par barreau et par matière. Écrire pour deux confrères qui se disputent les mêmes
          requêtes, c'est les faire perdre tous les deux.
        </p>
      </div>
    </section>
  );
}

function Fait({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div className="bg-rw-black p-5">
      <p className="font-sans text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-none tracking-tight text-rw-orange">
        {valeur}
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-rw-white/55">
        {libelle}
      </p>
    </div>
  );
}

/* ───────────────────────────── Preuve ─────────────────────────── */

/** La preuve vient en premier : c'est la seule page dont elle démontre
 *  exactement l'offre. Sur la page « site internet » elle est un argument ;
 *  ici, elle est le sujet. */
function Preuve() {
  const maxClics = Math.max(...TRAJECTOIRE.map((t) => t.clics));

  return (
    <Section
      id="preuve"
      eyebrow="01 — La preuve"
      titre={
        <>
          De la 18<sup className="text-[0.45em] normal-case">e</sup> à la 7
          <sup className="text-[0.45em] normal-case">e</sup> place sur Google. En cinq trimestres, et sans
          une exception.
        </>
      }
    >
      <p className="max-w-2xl text-[16px] leading-relaxed text-rw-muted">
        Le <b className="text-rw-black">cabinet Plouton</b>, pénalistes à Bordeaux, publie avec nous depuis{" "}
        {CHIFFRES.repriseAnnee}. <b className="text-rw-black">{formatNombre(CHIFFRES.articles)} articles</b>{" "}
        plus tard, sa position moyenne s'améliore à chaque trimestre. C'est un seul cabinet : nous ne
        prétendons pas en avoir dix, et vous pouvez l'appeler.
      </p>

      <div className="mt-10 border-2 border-rw-black">
        <div className="hidden grid-cols-12 gap-4 border-b-2 border-rw-black bg-rw-paper-subtle px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-rw-muted sm:grid">
          <span className="col-span-3">Période</span>
          <span className="col-span-5">Visites depuis Google</span>
          <span className="col-span-2 text-right">Clics</span>
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
              <p className="text-[15px] font-extrabold uppercase leading-none tracking-tight">{t.label}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-rw-tertiary">
                {t.periode}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-5">
              <div className="h-2.5 w-full border border-rw-black bg-rw-white">
                <div
                  className="h-full bg-rw-orange"
                  style={{ width: `${Math.round((t.clics / maxClics) * 100)}%` }}
                />
              </div>
            </div>
            <p className="col-span-1 text-right font-mono text-[13px] font-bold sm:col-span-2">
              {formatNombre(t.clics)}
            </p>
            <p className="col-span-1 text-right font-mono text-[13px] font-bold text-rw-orange sm:col-span-2">
              {formatPosition(t.position)}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-px border-2 border-rw-black bg-rw-line-subtle sm:grid-cols-3">
        <Chiffre valeur={formatNombre(CHIFFRES.clics16Mois)} libelle="visites depuis Google en 16 mois" />
        <Chiffre valeur={`+${CHIFFRES.yoy.clics} %`} libelle="de clics en un an, à saisonnalité égale" />
        <Chiffre valeur={formatNombre(CHIFFRES.articles)} libelle="articles écrits et publiés" />
      </div>

      <p className="mt-5 max-w-2xl text-[13px] leading-relaxed text-rw-tertiary">
        Chiffres issus de la Google Search Console du cabinet, relevés le 6 août 2026 et publiés avec son
        accord. Nous ne publierons jamais son nombre de dossiers ni son chiffre d'affaires : ce sont ses
        affaires, pas nos arguments.
      </p>
    </Section>
  );
}

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div className="bg-rw-white p-5">
      <p className="font-sans text-[clamp(1.3rem,2.6vw,1.8rem)] font-extrabold leading-none tracking-tight text-rw-orange">
        {valeur}
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-rw-muted">
        {libelle}
      </p>
    </div>
  );
}

/* ──────────────────────────── Requêtes ────────────────────────── */

function Requetes() {
  return (
    <Section
      id="requetes"
      eyebrow="02 — Le mécanisme"
      titre={<>On ne vous cherche pas. On cherche ce que vous savez.</>}
      variant="subtle"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {REQUETES.map((r, i) => (
          <motion.div
            key={r.num}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rw-hard rw-shadow-sm flex flex-col bg-rw-white p-5"
          >
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-rw-orange">
              {r.num}
            </span>
            <h3 className="mt-3 text-[1.05rem] leading-none">{r.titre}</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-rw-muted">{r.texte}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ─────────────────────────── Livraison ────────────────────────── */

function Livraison() {
  return (
    <Section
      id="livraison"
      eyebrow="03 — Ce qu'on écrit"
      titre={<>Six pièces par mois, et vous n'en tenez qu'une : la relecture.</>}
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {LIVRAISON.map((p, i) => (
          <motion.div
            key={p.num}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: Math.min(i, 5) * 0.04 }}
            className="rw-hard rw-shadow-sm flex flex-col p-5"
          >
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-rw-orange">
              {p.num}
            </span>
            <h3 className="mt-3 text-[1.05rem] leading-none">{p.titre}</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-rw-muted">{p.texte}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ────────────────────────────── Prix ──────────────────────────── */

function Prix() {
  return (
    <Section
      id="prix"
      eyebrow="04 — Le prix"
      titre={
        <>
          {TARIF.mensuel} € HT par mois. Un prix, pas une fourchette — et le premier mois ne vous engage à
          rien.
        </>
      }
      variant="subtle"
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="rw-hard rw-shadow bg-rw-white p-7">
          <p className="font-sans text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold leading-none tracking-tight text-rw-orange">
            {TARIF.mensuel} € HT
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rw-muted">
            par mois · {TARIF.articlesParMois} articles · {TARIF.prixArticle} € l'article
          </p>
          <p className="mt-6 text-[15px] leading-relaxed text-rw-muted">
            Recherche, rédaction, structure, maillage, publication et rapport mensuel compris. Il n'y a pas
            de frais de mise en route, pas de palier caché, et le tarif ne bouge pas si un mois demande plus
            de travail qu'un autre.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-rw-muted">
            <b className="text-rw-black">Vous arrêtez à la fin du mois de votre choix, le premier compris.</b>{" "}
            Les articles publiés restent les vôtres et les droits vous sont cédés par écrit.
          </p>
        </div>

        <div className="rw-hard bg-rw-white p-7">
          <p className="rw-eyebrow text-rw-tertiary">Ce qui n'est pas dedans</p>
          <ul className="mt-5 space-y-4 text-[14px] leading-relaxed text-rw-muted">
            <li>
              <b className="text-rw-black">La création du site.</b> Si vous n'en avez pas, ou s'il ne peut
              pas accueillir un blog structuré, c'est le sujet d'avant.{" "}
              <Link
                to="/avocats/site-internet"
                className="underline decoration-rw-orange decoration-2 underline-offset-4 hover:text-rw-orange"
              >
                Voir la page consacrée au site
              </Link>
              .
            </li>
            <li>
              <b className="text-rw-black">La publicité payante.</b> Nous n'achetons pas de mots clés pour
              vous — l'abonnement construit une position que vous ne louez pas.
            </li>
            <li>
              <b className="text-rw-black">L'identité visuelle et la photographie.</b> Elles existent chez
              nous, elles se facturent à part, et elles ne sont pas nécessaires pour commencer à écrire.
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ───────────────────────── Votre temps ────────────────────────── */

function VotreTemps() {
  return (
    <Section
      id="temps"
      eyebrow="05 — Votre temps"
      titre={<>Une heure par mois. C'est tout ce que ça vous coûte.</>}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rw-hard rw-shadow-sm p-6">
          <p className="font-sans text-[2rem] font-extrabold leading-none tracking-tight text-rw-orange">
            ≈ {RYTHME.relectureHeures} heure
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-rw-muted">
            Vous relisez les quatre articles par lots, vous corrigez ce qui doit l'être, vous validez. Vous
            ne rédigez pas et vous ne cherchez pas les sujets. Si le cabinet compte plusieurs associés,
            désignez celui qui tranche : un texte relu par quatre confrères n'est jamais publié, et ce n'est
            pas le texte qui est en cause.
          </p>
        </div>
        <div className="rw-hard rw-shadow-sm p-6">
          <p className="rw-eyebrow text-rw-tertiary">Pourquoi vous, et pas nous</p>
          <p className="mt-4 text-[14px] leading-relaxed text-rw-muted">
            Vous êtes le seul à pouvoir valider un texte de droit signé de votre nom. Nous savons écrire et
            structurer ; nous ne sommes pas avocats, et nous ne ferons jamais semblant de l'être. Cette
            heure est la contrepartie de votre signature.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ──────────────────────────── Limites ─────────────────────────── */

function Limites() {
  return (
    <Section
      id="limites"
      eyebrow="06 — Ce que ça ne fait pas"
      titre={<>Trois choses que nous ne vous promettrons pas.</>}
      variant="subtle"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {LIMITES.map((l, i) => (
          <motion.div
            key={l.num}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="border-l-[3px] border-rw-orange bg-rw-white p-5"
          >
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-rw-tertiary">
              {l.num}
            </span>
            <h3 className="mt-3 text-[1.05rem] leading-none">{l.titre}</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-rw-muted">{l.texte}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────── Déontologie ────────────────────────── */

function Deontologie() {
  return (
    <Section
      id="deontologie"
      eyebrow="07 — Déontologie"
      titre={<>Un article de droit n'est pas une publicité personnelle.</>}
    >
      <div className="max-w-3xl space-y-5 text-[15px] leading-relaxed text-rw-muted">
        <p>
          L'article 10 du Règlement intérieur national autorise l'information professionnelle et encadre la
          publicité personnelle : elle doit être sincère, ne pas comporter de mention comparative ou
          dénigrante, et ne pas solliciter un client déterminé. Un article qui explique une règle de droit
          reste du côté de l'information.
        </p>
        <p>
          Concrètement : nous n'écrivons pas « le meilleur pénaliste de Bordeaux », nous n'inventons pas de
          témoignage, et nous ne parlons ni de vos dossiers ni de vos résultats. Un texte qui vous semble
          limite ne sort pas — vous tranchez, sans avoir à vous justifier.
        </p>
        <p>
          Si votre bâtonnier ou un confrère vous interroge sur ce qui est publié, vous pouvez répondre en
          une phrase : ce sont des fiches de droit signées de votre nom, validées par vous avant mise en
          ligne. Nous vous fournissons la liste complète sur demande.
        </p>
      </div>
    </Section>
  );
}

/* ──────────────────────────── Questions ───────────────────────── */

function Questions() {
  return (
    <Section id="questions" eyebrow="08 — Questions" titre={<>Ce qu'on nous demande.</>} variant="subtle">
      <div className="grid gap-px border-2 border-rw-black bg-rw-line-subtle md:grid-cols-2">
        {QUESTIONS.map((q) => (
          <div key={q.q} className="bg-rw-white p-6">
            <h3 className="text-[1rem] leading-tight">{q.q}</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-rw-muted">{q.r}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────────── Socle ──────────────────────────── */

/** Renvoi explicite vers la page sœur. Le contenu ne sert à rien sur un site
 *  qui ne peut pas l'accueillir : autant le dire, et pointer où il faut. */
function Socle() {
  return (
    <section className="border-b-2 border-rw-line-subtle bg-rw-black text-rw-white">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="rw-eyebrow text-rw-orange">Avant le contenu, le socle</p>
            <h2 className="mt-4 text-rw-white text-[clamp(1.5rem,3vw,2.2rem)] leading-[1.05]">
              Pas de site, ou un site qui ne suit pas ?
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-rw-white/70">
              Écrire pour un site lent, illisible sur téléphone ou incapable de porter un blog structuré,
              c'est payer un contenu que personne ne lira. Dans ce cas on commence par là — {TARIF.site} € HT,
              six semaines, prix ferme.
            </p>
          </div>
          <Button variant="rw" size="lg" asChild>
            <Link to="/avocats/site-internet">
              Voir la création de site <ArrowUpRight className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Contact ─────────────────────────── */

function Contact() {
  return (
    <section id="contact" className="border-t-2 border-rw-black bg-rw-orange text-rw-black">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <p className="rw-eyebrow">09 — Parlons-en</p>
        <h2 className="mt-4 max-w-3xl text-[clamp(1.9rem,4.2vw,3rem)] leading-[1]">
          Dites-nous votre barreau et votre matière. Nous vous dirons si la place est prenable — y compris
          quand elle ne l'est pas.
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-rw-black/75">
          Premier échange sans engagement, trente minutes. Si vos requêtes sont déjà tenues par un confrère
          que nous accompagnons, ou si votre site ne peut pas porter le contenu, nous vous le dirons au
          premier message plutôt qu'au troisième rendez-vous.
        </p>

        <div className="mt-10">
          <Formulaire />
        </div>

        <p className="mt-10 rw-eyebrow text-rw-black/60">Ou directement</p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {[CONTACT.nicolas, CONTACT.elise].map((p) => (
            <div key={p.email} className="border-2 border-rw-black bg-rw-white p-6">
              <p className="text-[1.15rem] font-extrabold uppercase leading-none tracking-tight">{p.nom}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-rw-muted">{p.role}</p>
              <div className="mt-4 space-y-2.5">
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

/* ────────────────────── Barre d'appel mobile ──────────────────── */

function BarreMobile() {
  return (
    <div
      style={{ bottom: "var(--rw-consent-h, 0px)" }}
      className="sticky z-40 border-t-2 border-rw-black bg-rw-white md:hidden"
    >
      <div className="grid grid-cols-2 gap-px bg-rw-black">
        <a
          href={`tel:${CONTACT.nicolas.telHref}`}
          onClick={cta("tel_nicolas", "barre_mobile")}
          className="flex items-center justify-center gap-2 bg-rw-white px-4 py-3.5 font-mono text-[11px] font-bold uppercase tracking-wider"
        >
          <Phone className="size-4" /> Appeler
        </a>
        <a
          href="#contact"
          className="flex items-center justify-center gap-2 bg-rw-orange px-4 py-3.5 font-mono text-[11px] font-bold uppercase tracking-wider"
        >
          <Mail className="size-4" /> Écrire
        </a>
      </div>
    </div>
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
            to="/avocats/site-internet"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-rw-white/55 hover:text-rw-orange"
          >
            Création de site
          </Link>
          <Link
            to="/avocats"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-rw-white/55 hover:text-rw-orange"
          >
            Tous les métiers
          </Link>
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
