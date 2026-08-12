import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Mail, Phone } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ouvrirReglagesCookies } from "@/consent/consent";
import Formulaire from "./Formulaire";
import { CHIFFRES, CONTACT, TRAJECTOIRE, formatNombre, formatPosition } from "./data";
import { FAQ, PIECES, PRIX, TEMPS, VERIFICATIONS } from "./siteData";

/**
 * Page « Création de site internet pour avocats » — destination du groupe
 * d'annonces « Site internet ». Voir l'en-tête de `siteData.ts` pour la raison
 * mesurée de son existence.
 *
 * Deux principes tenus de bout en bout, hérités de l'audit des dix personas :
 *  1. le prix est ferme et arrive avant la preuve (le flou fait renoncer) ;
 *  2. aucune affirmation sans source — une seule phrase invérifiable
 *     contaminerait toutes les autres auprès de ce lectorat.
 */

const NAV = [
  { id: "livrable", label: "Ce qu'il y a dedans" },
  { id: "prix", label: "Le prix" },
  { id: "preuve", label: "La preuve" },
  { id: "temps", label: "Votre temps" },
] as const;

const MAILTO = (email: string) =>
  `mailto:${email}?subject=${encodeURIComponent("Site internet de mon cabinet | REWOLF")}`;

// Mêmes actions de conversion que la plaquette /avocats — compte AW-11144920628.
const CONVERSION_FORMULAIRE = "AW-11144920628/mBTHCM-XrN4cELT8p8Ip";
const CONVERSION_APPEL = "AW-11144920628/vx34COKEmd4cELT8p8Ip";

function cta(name: string, section: string) {
  const appel = name.startsWith("tel_");
  return () => {
    window.gtag?.(
      "event",
      "conversion",
      appel
        ? { send_to: CONVERSION_APPEL, value: 1.0, currency: "EUR" }
        : { send_to: CONVERSION_FORMULAIRE },
    );
    window.gtag?.("event", "generate_lead", { method: name, section });
  };
}

const euros = (n: number) => formatNombre(n);

export default function SiteInternet() {
  useEffect(() => {
    document.title = "Création de site internet pour avocats — REWOLF, Bordeaux";
    const desc =
      `Création de site internet pour avocats : ${euros(PRIX.site)} € HT, six semaines, ` +
      `environ quatre heures de votre temps. Studio à Bordeaux, cabinets partout en France.`;
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
      <Livrable />
      <Prix />
      <Preuve />
      <Verifiez />
      <VotreTemps />
      <LaMain />
      <Deontologie />
      <Exclusivite />
      <Questions />
      <Suite />
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
            Sites d'avocats
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
        <p className="rw-eyebrow text-rw-orange">REWOLF · Création de sites d'avocats</p>

        <h1 className="mt-5 max-w-4xl text-rw-white text-[clamp(2rem,4.8vw,3.9rem)] leading-[0.98]">
          Un site d'avocat dessiné, écrit, développé et référencé{" "}
          <span className="text-rw-orange">sans un seul passage de main.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-rw-white/70 sm:text-[17px]">
          REWOLF, studio de design à Bordeaux. Nous créons des sites de cabinets d'avocats : pages de
          matières, ressources juridiques, blog, formulaires qualifiants, balisage, migration des anciennes
          adresses. Nous ne sommes pas une agence de trente personnes — nous sommes deux, et rien n'est
          sous-traité.
        </p>

        {/* Les trois faits que les personas cherchent avant tout : combien, combien de temps, quel effort. */}
        <div className="mt-9 grid gap-px border-2 border-rw-white/25 bg-rw-white/25 sm:grid-cols-3">
          <Fait valeur={`${euros(PRIX.site)} € HT`} libelle="le site complet, prix ferme" />
          <Fait valeur="6 semaines" libelle="de la première heure à la mise en ligne" />
          <Fait valeur="≈ 4 heures" libelle="de votre temps, en tout" />
        </div>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button variant="rw" size="lg" asChild>
            <a href="#contact">
              Parler de votre cabinet <ArrowRight className="size-5" />
            </a>
          </Button>
          <Button variant="rw" size="lg" asChild>
            <a
              href={`tel:${CONTACT.nicolas.telHref}`}
              onClick={cta("tel_nicolas", "hero")}
            >
              Appeler Nicolas — {CONTACT.nicolas.tel}
            </a>
          </Button>
        </div>

        <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-rw-white/55">
          Un cabinet par barreau et par matière. Si le vôtre est déjà pris, nous vous le disons au premier
          échange plutôt qu'au troisième rendez-vous.
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

/* ──────────────────────────── Livrable ────────────────────────── */

function Livrable() {
  return (
    <Section
      id="livrable"
      eyebrow="01 — Le livrable"
      titre={<>Ce qu'il y a dedans. Sept pièces, aucune décorative.</>}
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PIECES.map((p, i) => (
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
      eyebrow="02 — Le prix"
      titre={<>Sept mille cinq cents euros hors taxes. Un prix, pas une fourchette.</>}
      variant="subtle"
    >
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="rw-hard rw-shadow bg-rw-white p-7">
            <p className="rw-eyebrow text-rw-tertiary">Site complet</p>
            <p className="mt-4 font-sans text-[3rem] font-extrabold leading-none tracking-tight">
              {euros(PRIX.site)} €
              <span className="ml-2 align-middle font-mono text-[13px] font-medium tracking-normal text-rw-muted">
                HT
              </span>
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-rw-muted">
              Les sept pièces ci-dessus, mises en ligne. C'est le montant du dernier devis que nous avons
              remis.
            </p>
            <ul className="mt-5 space-y-2 border-t-2 border-rw-line-subtle pt-4 text-[14px] leading-relaxed">
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-rw-orange" strokeWidth={2.5} />
                {PRIX.acomptePourcent} % au lancement, le solde à la livraison
              </li>
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-rw-orange" strokeWidth={2.5} />
                Paiement en plusieurs fois possible, sans frais
              </li>
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-rw-orange" strokeWidth={2.5} />
                Aucun abonnement obligatoire
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-5 text-[15px] leading-relaxed text-rw-muted lg:col-span-7">
          <p>
            <b className="text-rw-black">Je n'ai pas encore de site du tout.</b> C'est plus simple, et c'est
            le même prix : il n'y a rien à migrer.
          </p>
          <p>
            <b className="text-rw-black">Trois éléments peuvent le déplacer</b>, autant les nommer avant
            qu'on nous le demande : le nombre de matières traitées, le nombre d'avocats à présenter,
            l'existence ou non d'un site à reprendre. Si votre projet sort du cadre — version bilingue, plus de vingt pages, espace client,
            reprise de plusieurs centaines d'articles — nous vous le disons avec le chiffre avant de
            commencer. Jamais après.
          </p>

          <div className="border-2 border-rw-black bg-rw-white p-5">
            <p className="rw-eyebrow text-rw-tertiary">En option, prix réels</p>
            <ul className="mt-3 space-y-1.5 text-[14px] text-rw-black">
              <li>Identité visuelle complète — {euros(PRIX.identiteVisuelle)} € HT</li>
              <li>Photographie du cabinet — {euros(PRIX.photographie)} € HT</li>
              <li>
                Production éditoriale — {euros(PRIX.editorialMensuel)} € HT par mois, quatre articles, sans
                engagement
              </li>
            </ul>
          </div>

          <p className="border-l-2 border-rw-orange pl-5 text-rw-black">
            <b>Ce qui n'est pas compris</b> dans les {euros(PRIX.site)} € : la production d'articles au mois,
            l'identité visuelle complète, les photographies. Dire ce qui n'est pas dans le prix vaut mieux que
            dix lignes sur ce qui y est.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ───────────────────────────── Preuve ─────────────────────────── */

function Preuve() {
  const maxClics = Math.max(...TRAJECTOIRE.map((t) => t.clics));

  return (
    <Section
      id="preuve"
      eyebrow="03 — La preuve"
      titre={
        <>
          De la 18<sup className="text-[0.45em] normal-case">e</sup> à la 7
          <sup className="text-[0.45em] normal-case">e</sup> place sur Google. En cinq trimestres.
        </>
      }
    >
      <p className="max-w-2xl text-[16px] leading-relaxed text-rw-muted">
        Nous avons repris et refait le site du <b className="text-rw-black">cabinet Plouton</b>, pénalistes, en{" "}
        {CHIFFRES.repriseAnnee}. Depuis, sa position moyenne dans Google s'améliore{" "}
        <b className="text-rw-black">à chaque trimestre, sans exception</b>. C'est un seul cabinet : nous ne
        prétendons pas en avoir dix.
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

      <p className="mt-5 max-w-2xl text-[13px] leading-relaxed text-rw-tertiary">
        Chiffres issus de la Google Search Console du cabinet, relevés le 6 août 2026 et publiés avec son
        accord. Nous ne publierons jamais son nombre de dossiers ni son chiffre d'affaires : ce sont ses
        affaires, pas nos arguments.
      </p>
    </Section>
  );
}

/* ────────────────────── Vérifiez vous-même ────────────────────── */

function Verifiez() {
  return (
    <Section
      eyebrow="04 — Vérifiez vous-même"
      titre={<>Trois vérifications. Deux minutes. Faites-les maintenant.</>}
      variant="subtle"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {VERIFICATIONS.map((v) => (
          <div key={v.num} className="rw-hard bg-rw-white p-5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-rw-orange">
              {v.num}
            </span>
            <h3 className="mt-3 text-[1.05rem] leading-none">{v.titre}</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-rw-muted">{v.texte}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-rw-muted">
        Si les trois réponses vous conviennent, votre site fait son travail et vous n'avez pas besoin de nous.
        Nous préférons vous le dire ici plutôt qu'au bout d'une heure de rendez-vous.
      </p>
    </Section>
  );
}

/* ───────────────────────── Votre temps ────────────────────────── */

function VotreTemps() {
  return (
    <Section
      id="temps"
      eyebrow="05 — Votre temps"
      titre={<>Quatre temps. Environ quatre heures de votre temps.</>}
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {TEMPS.map((t) => (
          <div key={t.num} className="rw-hard rw-shadow-sm flex flex-col p-5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-rw-orange">
              {t.num}
            </span>
            <h3 className="mt-3 text-[1.05rem] leading-none">{t.titre}</h3>
            <p className="mt-3 flex-1 text-[13px] leading-relaxed text-rw-muted">{t.texte}</p>
            <p className="mt-4 border-t-2 border-rw-line-subtle pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-rw-tertiary">
              {t.duree}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-rw-muted">
        <b className="text-rw-black">Vous n'écrivez rien.</b> Nous rédigeons, vous corrigez. Trois semaines
        sans réponse de votre part, trois semaines de retard à la livraison : c'est la seule conséquence, et
        elle joue dans les deux sens.
      </p>
    </Section>
  );
}

/* ───────────────────────────── La main ────────────────────────── */

function LaMain() {
  return (
    <Section eyebrow="06 — La main" titre={<>Aucun passage de main, du début à la fin.</>} variant="subtle">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-5 text-[15px] leading-relaxed text-rw-muted">
          <p>
            Dans une agence, votre site passe par un commercial, un chef de projet, un graphiste, un
            développeur et un rédacteur qui ne se parlent qu'en réunion. Chaque passage de main coûte une
            intention.
          </p>
          <p>
            Ici, <b className="text-rw-black">{CONTACT.nicolas.nom}</b> conçoit l'architecture, développe le
            site, écrit les textes et fait le référencement. <b className="text-rw-black">{CONTACT.elise.nom}</b>{" "}
            tient la marque et la direction artistique. Vous avez nos deux numéros de portable, pas un
            standard.
          </p>
        </div>
        <div className="rw-hard bg-rw-white p-6">
          <p className="rw-eyebrow text-rw-tertiary">Et si vous voulez nous quitter</p>
          <p className="mt-4 text-[15px] leading-relaxed text-rw-muted">
            Le nom de domaine, l'hébergement et les accès Google sont ouverts à votre nom dès le premier
            jour, et les droits sur les textes et les photographies vous sont cédés par écrit. Nous
            travaillons sur des outils que vous pouvez reprendre seul — c'est précisément pour cela que nous
            les choisissons. Le jour où vous arrêtez, rien ne se coupe et rien ne se renégocie.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ───────────────────────── Déontologie ────────────────────────── */

function Deontologie() {
  return (
    <Section eyebrow="07 — Déontologie" titre={<>Rien ne se publie sans votre validation.</>}>
      <div className="grid gap-8 lg:grid-cols-2">
        <p className="text-[16px] leading-relaxed text-rw-muted">
          La publicité et la sollicitation personnalisée des avocats sont autorisées et encadrées. Vous êtes
          le seul juge de ce qui peut être écrit sous votre nom : nous ne publions aucun texte, aucune page de
          matière et aucune mention de résultat sans votre accord écrit.
        </p>
        <p className="text-[16px] leading-relaxed text-rw-muted">
          Concrètement : pas de témoignage client, pas de taux de réussite, pas de comparaison avec un
          confrère. Si une formulation vous paraît douteuse au regard de vos obligations, nous la retirons.
          Sans débat et sans supplément.
        </p>
      </div>
    </Section>
  );
}

/* ──────────────────────── Exclusivité ─────────────────────────── */

function Exclusivite() {
  return (
    <Section eyebrow="08 — Une règle" titre={<>Un cabinet par barreau et par matière.</>} variant="subtle">
      <div className="grid gap-8 lg:grid-cols-2">
        <p className="text-[16px] leading-relaxed text-rw-muted">
          Nous ne travaillons pas pour deux cabinets qui se disputent les mêmes justiciables dans le même
          ressort. Ce serait vous vendre une visibilité que nous construirions simultanément contre vous.
        </p>
        <p className="text-[16px] leading-relaxed text-rw-muted">
          C'est une contrainte commerciale que nous nous imposons, et la raison pour laquelle nous ne
          travaillons qu'avec un petit nombre de cabinets. Si votre barreau et votre matière sont déjà pris,
          vous le saurez dès le premier message.
        </p>
      </div>
    </Section>
  );
}

/* ──────────────────────────── Questions ───────────────────────── */

function Questions() {
  return (
    <Section eyebrow="09 — Les questions" titre={<>Ce qu'on nous demande avant de signer.</>}>
      <div className="grid gap-px border-2 border-rw-black bg-rw-line-subtle md:grid-cols-2">
        {FAQ.map((f) => (
          <div key={f.q} className="bg-rw-white p-6">
            <p className="text-[1rem] font-extrabold uppercase leading-tight tracking-tight">{f.q}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-rw-muted">{f.r}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ────────────────────────────── Suite ─────────────────────────── */

function Suite() {
  return (
    <Section
      eyebrow="10 — Ensuite"
      titre={<>Le site vous rend trouvable. Les articles vous font monter.</>}
      variant="subtle"
    >
      <div className="max-w-2xl space-y-5 text-[15px] leading-relaxed text-rw-muted">
        <p>
          Un site bien construit vous rend lisible par Google. Il ne suffit pas à vous faire remonter : la
          trajectoire que vous avez lue plus haut a demandé plusieurs centaines d'articles publiés
          régulièrement, pendant cinq trimestres.
        </p>
        <p>
          Si vous voulez cette partie-là, elle existe et se facture{" "}
          {euros(PRIX.editorialMensuel)} € HT par mois, sans engagement. Mais elle n'a de sens qu'une fois le
          site en place, et nous ne vous la vendrons pas le même jour.{" "}
          <Link to="/avocats" className="font-bold text-rw-black underline decoration-rw-orange decoration-2 underline-offset-4">
            La page qui la détaille est ici
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}

/* ──────────────────────────── Contact ─────────────────────────── */

function Contact() {
  return (
    <section id="contact" className="border-t-2 border-rw-black bg-rw-orange text-rw-black">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <p className="rw-eyebrow">11 — Parlons-en</p>
        <h2 className="mt-4 max-w-3xl text-[clamp(1.9rem,4.2vw,3rem)] leading-[1]">
          Dites-nous votre barreau et votre matière. Nous vous dirons si la place est prenable — y compris
          quand elle ne l'est pas.
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-rw-black/75">
          Premier échange sans engagement, trente minutes. Si votre marché est saturé ou si votre site actuel
          remplit son office, nous vous le dirons — c'est arrivé, et cela nous évite à tous les deux de perdre
          six semaines.
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

/**
 * Sur téléphone, le numéro doit être atteignable en un geste depuis n'importe
 * quel écran : c'est le principal reproche fait aux sites de cabinets dans la
 * section « Vérifiez vous-même », on ne va pas le commettre nous-mêmes.
 */
function BarreMobile() {
  return (
    <div className="sticky bottom-0 z-40 border-t-2 border-rw-black bg-rw-white md:hidden">
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
            to="/avocats"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-rw-white/55 hover:text-rw-orange"
          >
            Référencement & contenu
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
