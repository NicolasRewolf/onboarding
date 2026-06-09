import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Mail,
  PackageCheck,
  Phone,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  COMPARATIF,
  CONTACT,
  EXTRAS,
  FORFAITS,
  PORTFOLIO,
  PROCESS,
  formatPrice,
  type Forfait,
} from "./data";

const NAV: { id: string; label: string }[] = [
  { id: "approche", label: "Approche" },
  { id: "forfaits", label: "Forfaits" },
  { id: "comparatif", label: "Comparatif" },
  { id: "extras", label: "Devis" },
  { id: "process", label: "Process" },
];

export default function OffreStarter() {
  return (
    <div className="min-h-dvh bg-rw-white text-rw-black">
      <TopBar />
      <Hero />
      <Approche />
      <Forfaits />
      <DevisBuilder />
      <Process />
      <Portfolio />
      <FinalSection />
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
            Forfaits flash
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
          Discuter <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </header>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-rw-black text-rw-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-12 lg:gap-14 lg:py-20">
        {/* Texte */}
        <div className="lg:col-span-7">
          <p className="rw-eyebrow text-rw-orange">REWOLF · Studio d'identité de marque</p>
          <h1 className="mt-5 text-rw-white text-[clamp(2.4rem,6.2vw,5rem)] leading-[0.92]">
            Construire <br className="hidden sm:inline" />
            une marque qui <span className="text-rw-orange">dure</span>.
          </h1>

          <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-rw-white/70 sm:text-[17px]">
            <b className="text-rw-white">Deux forfaits</b> mêlant stratégie et direction artistique, pensés pour les{" "}
            <b className="text-rw-white">fondateurs d'entreprises food, lifestyle et bien-être</b> qui veulent une
            identité à la hauteur de leurs ambitions.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="rw" size="lg" asChild>
              <a href="#forfaits">
                Voir les forfaits <ArrowRight className="size-5" />
              </a>
            </Button>
            <Button variant="rw" size="lg" asChild>
              <a href="#contact">Nous contacter</a>
            </Button>
          </div>
        </div>

        {/* Cartes forfait, à droite */}
        <aside className="grid gap-5 lg:col-span-5">
          <ForfaitTease
            number="01"
            name="Origine"
            price={800}
            delay="1 mois"
            tagline="L'essentiel du branding, structuré et prêt à l'emploi."
          />
          <ForfaitTease
            number="02"
            name="Signature"
            price={1600}
            delay="2 mois"
            tagline="Une identité complète, pensée pour durer et se déployer."
          />
        </aside>
      </div>
    </section>
  );
}

function ForfaitTease({
  number,
  name,
  price,
  delay,
  tagline,
}: {
  number: string;
  name: string;
  price: number;
  delay: string;
  tagline: string;
}) {
  return (
    <a
      href="#forfaits"
      className="group relative block border-2 border-rw-white bg-rw-black p-7 text-rw-white transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-hard-orange)] sm:p-8"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-rw-white/60">
          Forfait {number}
        </span>
        <ArrowUpRight
          aria-hidden
          className="size-4 text-rw-white/40 transition-colors group-hover:text-rw-orange"
        />
      </div>

      <p className="mt-7 text-rw-white text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        {name}
      </p>
      <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-rw-white/70">
        {tagline}
      </p>

      <div className="mt-8 flex items-baseline justify-between gap-3 border-t border-rw-white/20 pt-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-rw-white/60">
          {delay}
        </span>
        <span className="flex items-baseline gap-1">
          <span className="text-rw-orange text-[28px] font-extrabold leading-none tracking-tight">
            {formatPrice(price)}
          </span>
          <span className="text-xs font-bold text-rw-white">€ TTC</span>
        </span>
      </div>
    </a>
  );
}

/* ─────────────────────────── Approche ─────────────────────────── */

function Approche() {
  return (
    <section id="approche" className="bg-rw-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="rw-eyebrow text-rw-orange">Notre approche</p>
        <h2 className="mt-4 max-w-5xl text-[clamp(1.8rem,4vw,3rem)]">
          Une offre complète mêlant <span className="text-rw-orange">stratégie</span> et{" "}
          <span className="text-rw-orange">direction artistique</span>.
        </h2>

        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
          <Pillar
            Icon={Target}
            title="Pour qui"
            kicker="Fondateurs d'entreprises food, lifestyle & bien-être · 0–5 personnes"
            body="Vous lancez votre activité ou souhaitez professionnaliser une image bricolée. Vous avez besoin d'une marque qui inspire confiance immédiatement."
          />
          <Pillar
            Icon={Sparkles}
            title="La différence"
            kicker="Stratégie + DA, en une seule main"
            body="Pas de traduction à faire entre consultant et graphiste. La vision et l'exécution naissent au même endroit."
          />
          <Pillar
            Icon={PackageCheck}
            title="Le résultat"
            kicker="Une identité cohérente, prête à l'emploi"
            body="Un brand book livré, des fichiers prêts, une charte claire. Vous pouvez utiliser votre identité dès sa livraison."
          />
        </div>
      </div>
    </section>
  );
}

function Pillar({
  Icon,
  title,
  kicker,
  body,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  kicker: string;
  body: string;
}) {
  return (
    <div>
      <Icon className="size-7 text-rw-orange" strokeWidth={1.75} />
      <h3 className="mt-5 text-xl">{title}</h3>
      <p className="mt-2 text-[13px] font-bold uppercase tracking-tight text-rw-orange">{kicker}</p>
      <p className="mt-4 text-[14.5px] leading-relaxed text-rw-muted">{body}</p>
    </div>
  );
}

/* ─────────────────────────── Forfaits (tabs interactifs) ─────────────────────────── */

function Forfaits() {
  const [active, setActive] = useState<Forfait["id"]>("origine");
  const current = useMemo(() => FORFAITS.find((f) => f.id === active)!, [active]);

  return (
    <section id="forfaits" className="bg-rw-white">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rw-eyebrow text-rw-orange">Deux forfaits</p>
            <AnimatedHeadline
              words={["Choisissez", "votre", "formule."]}
              className="mt-4 text-[clamp(2rem,5vw,3.6rem)]"
            />
          </div>
          <div role="tablist" aria-label="Forfaits" className="flex border-2 border-rw-black shadow-[var(--shadow-hard-sm)]">
            {FORFAITS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={active === f.id}
                onClick={() => setActive(f.id)}
                className={cn(
                  "px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors sm:px-5 sm:text-[12px]",
                  active === f.id
                    ? "bg-rw-orange text-rw-black"
                    : "bg-rw-white text-rw-black hover:bg-rw-paper-subtle",
                )}
              >
                {f.number} · {f.name}
              </button>
            ))}
          </div>
        </div>

        <ForfaitCard forfait={current} />

        {/* Comparatif rapide — intégré à la section Forfaits, pas une section séparée */}
        <CompactComparatif />
      </div>
    </section>
  );
}

/** Titre dont chaque mot apparaît à la suite à l'entrée en viewport, pour accompagner la lecture. */
function AnimatedHeadline({ words, className }: { words: string[]; className?: string }) {
  return (
    <h2 className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
          className="inline-block"
        >
          {w}
          {i < words.length - 1 && " "}
        </motion.span>
      ))}
    </h2>
  );
}

/** Comparatif rapide — version épurée : juste les lignes et les coches, en-tête minimal. */
function CompactComparatif() {
  return (
    <div id="comparatif" className="mt-10">
      <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 border-b-2 border-rw-black pb-2 sm:pb-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rw-muted">
          Comparatif rapide
        </p>
        <span className="w-14 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-rw-muted sm:w-20">
          Origine
        </span>
        <span className="w-14 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-rw-muted sm:w-20">
          Signature
        </span>
      </div>
      <ul>
        {COMPARATIF.map((row, i) => (
          <li
            key={row.label}
            className={cn(
              "grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-1.5 text-[13px]",
              i > 0 && "border-t border-rw-line-subtle",
            )}
          >
            <span>{row.label}</span>
            <span className="w-14 text-center sm:w-20">
              <Tick on={row.origine} />
            </span>
            <span className="w-14 text-center sm:w-20">
              <Tick on={row.signature} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ForfaitCard({ forfait }: { forfait: Forfait }) {
  return (
    <div className="mt-10 border-2 border-rw-black bg-rw-white shadow-[var(--shadow-hard)]">
      {/* En-tête forfait */}
      <div className="grid border-b-2 border-rw-black md:grid-cols-12">
        <div className="border-rw-black p-6 sm:p-8 md:col-span-7 md:border-r-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-rw-orange">
            Forfait {forfait.number}
          </p>
          <h3 className="mt-3 text-[clamp(2.4rem,6vw,4.2rem)]">{forfait.name}</h3>
          <p className="mt-3 max-w-md text-[15px] text-rw-muted">{forfait.tagline}</p>
        </div>
        <div className="grid grid-cols-2 md:col-span-5 md:grid-cols-1">
          <div className="border-b-2 border-rw-black bg-rw-orange p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rw-black/60">Tarif</p>
            <p className="mt-2 text-[44px] font-extrabold leading-none tracking-tight">
              {formatPrice(forfait.price)}
              <span className="ml-1 text-base font-bold">€ TTC</span>
            </p>
          </div>
          <div className="border-rw-black bg-rw-paper-subtle p-5 text-[13px] sm:p-6">
            <ul className="space-y-1.5 font-mono text-[11px] uppercase tracking-wider text-rw-muted">
              <li>· {forfait.delay}</li>
              <li>· {forfait.rounds}</li>
              <li>· {forfait.payment}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contenu détaillé */}
      <div className="grid divide-rw-black md:grid-cols-3 md:divide-x-2">
        {forfait.blocks.map((b) => (
          <div key={b.title} className="border-b-2 border-rw-black p-6 last:border-b-0 md:border-b-0 sm:p-7">
            <h4 className="text-[13px]">{b.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {b.items.map((it) => (
                <li key={it} className="flex gap-2.5 text-[14.5px] text-rw-muted">
                  <Check className="mt-0.5 size-4 shrink-0 text-rw-orange" strokeWidth={3} />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Pour qui */}
      <div className="border-t-2 border-rw-black bg-rw-paper-subtle p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rw-muted">Pour qui ?</p>
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {forfait.forWho.map((f) => (
            <li key={f} className="text-[14.5px] text-rw-black">
              · {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────────── Comparatif ─────────────────────────── */


function Tick({ on }: { on: boolean }) {
  if (on) return <Check className="mx-auto size-4 text-rw-success" strokeWidth={3} />;
  return <X className="mx-auto size-3.5 text-rw-tertiary/60" strokeWidth={2.5} />;
}

/* ─────────────────────── Devis interactif (calculateur) ─────────────────────── */

function DevisBuilder() {
  const [forfaitId, setForfaitId] = useState<Forfait["id"] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const forfait = FORFAITS.find((f) => f.id === forfaitId) ?? null;
  const extrasTotal = EXTRAS.filter((e) => picked.has(e.id)).reduce((s, e) => s + e.price, 0);
  const total = (forfait?.price ?? 0) + extrasTotal;
  const hasSelection = forfait !== null || picked.size > 0;

  const toggleForfait = (id: Forfait["id"]) => setForfaitId((prev) => (prev === id ? null : id));
  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section id="extras" className="bg-rw-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="rw-eyebrow text-rw-orange">Extras à la carte</p>
        <h2 className="mt-4 max-w-3xl text-[clamp(2rem,5vw,3.6rem)]">
          Composez votre <span className="text-rw-orange">devis</span>.
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] text-rw-muted">
          Estimation indicative TTC. Le devis final est confirmé après l'appel découverte.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* Sélection */}
          <div className="lg:col-span-2">
            {/* Forfaits */}
            <div className="border-2 border-rw-black bg-rw-white shadow-[var(--shadow-hard-sm)]">
              <p className="border-b-2 border-rw-black bg-rw-paper-subtle px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-rw-muted">
                1 · Choisir un forfait (facultatif)
              </p>
              <div className="grid sm:grid-cols-2">
                {FORFAITS.map((f, i) => {
                  const on = forfaitId === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleForfait(f.id)}
                      aria-pressed={on}
                      className={cn(
                        "flex items-start justify-between gap-4 border-rw-black p-5 text-left transition-colors",
                        i === 0 && "border-b-2 sm:border-b-0 sm:border-r-2",
                        on ? "bg-rw-orange" : "hover:bg-rw-paper-subtle",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rw-black/60">
                          Forfait {f.number}
                        </p>
                        <p className="mt-1 text-lg font-extrabold uppercase tracking-tight">{f.name}</p>
                        <p className="mt-1 text-[12.5px] text-rw-muted">{f.delay}</p>
                      </div>
                      <span className="font-mono text-sm font-bold">{formatPrice(f.price)} €</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Extras */}
            <div className="mt-5 border-2 border-rw-black bg-rw-white shadow-[var(--shadow-hard-sm)]">
              <p className="border-b-2 border-rw-black bg-rw-paper-subtle px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-rw-muted">
                2 · Ajouter des extras (facultatif)
              </p>
              <ul>
                {EXTRAS.map((e, i) => {
                  const on = picked.has(e.id);
                  return (
                    <li key={e.id} className={cn(i > 0 && "border-t border-rw-line-subtle")}>
                      <button
                        onClick={() => toggle(e.id)}
                        aria-pressed={on}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-rw-paper-subtle"
                      >
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center border-2 border-rw-black transition-colors",
                            on ? "bg-rw-orange" : "bg-rw-white",
                          )}
                          aria-hidden
                        >
                          {on && <Check className="size-4 text-rw-black" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold uppercase tracking-tight">{e.name}</span>
                          <span className="block text-[13px] text-rw-muted">{e.detail}</span>
                        </span>
                        <span className="shrink-0 font-mono text-sm font-bold">{e.priceLabel}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Total sticky */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 border-2 border-rw-black bg-rw-white p-6 shadow-[var(--shadow-hard)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rw-orange">Estimation</p>
              <h3 className="mt-3">Votre devis</h3>

              <dl className="mt-6 space-y-2.5 border-y-2 border-rw-black/15 py-5 font-mono text-[12.5px]">
                {forfait && (
                  <div className="flex justify-between text-rw-muted">
                    <dt>Forfait {forfait.name}</dt>
                    <dd className="font-bold text-rw-black">{formatPrice(forfait.price)} €</dd>
                  </div>
                )}
                {EXTRAS.filter((e) => picked.has(e.id)).map((e) => (
                  <div key={e.id} className="flex justify-between text-rw-muted">
                    <dt>+ {e.name}</dt>
                    <dd className="font-bold text-rw-black">{formatPrice(e.price)} €</dd>
                  </div>
                ))}
                {!hasSelection && (
                  <p className="text-rw-tertiary">Sélectionnez un forfait et/ou des extras.</p>
                )}
              </dl>

              <div className="mt-5 flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-rw-muted">Total TTC</span>
                <span className="text-[38px] font-extrabold tracking-tight text-rw-orange">
                  {formatPrice(total)}
                  <span className="ml-1 text-base font-bold text-rw-black">€</span>
                </span>
              </div>

              <Button variant="rw" size="lg" asChild className={cn("mt-6 w-full", !hasSelection && "pointer-events-none opacity-40")}>
                <a
                  href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
                    forfait ? `Demande de devis, forfait ${forfait.name}` : "Demande de devis sur-mesure",
                  )}&body=${encodeURIComponent(devisMailBody(forfait, picked, total))}`}
                >
                  Envoyer ce devis <ArrowRight className="size-5" />
                </a>
              </Button>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-rw-tertiary">
                Estimation indicative · ajusté après l'appel
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function devisMailBody(forfait: Forfait | null, picked: Set<string>, total: number): string {
  const lines = ["Bonjour,", ""];
  if (forfait) {
    lines.push(`Je souhaite un devis pour le forfait ${forfait.name} (${formatPrice(forfait.price)} € TTC).`);
  } else {
    lines.push("Je souhaite un devis sur-mesure.");
  }
  const extras = EXTRAS.filter((e) => picked.has(e.id));
  if (extras.length) {
    lines.push("Extras souhaités :");
    extras.forEach((e) => lines.push(`  · ${e.name} · ${e.priceLabel}`));
  }
  lines.push("", `Total estimé : ${formatPrice(total)} € TTC.`, "", "À très vite,");
  return lines.join("\n");
}

/* ─────────────────────────── Process ─────────────────────────── */

function Process() {
  return (
    <section id="process" className="bg-rw-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="rw-eyebrow text-rw-orange">Le process</p>
        <h2 className="mt-4 max-w-3xl text-[clamp(2rem,5vw,3.6rem)]">
          Simple. Cadré. <span className="text-rw-orange">Sans surprise.</span>
        </h2>

        {/* Parcours horizontal — empilé en colonne sur mobile */}
        <ol className="mt-16 grid gap-12 md:grid-cols-6 md:gap-6">
          {PROCESS.map((s, i) => (
            <li key={s.n} className="relative">
              <div className="flex items-center gap-4 md:block">
                <span className="relative z-10 grid size-10 shrink-0 place-items-center border-2 border-rw-black bg-rw-white font-mono text-[12px] font-bold">
                  {s.n}
                </span>
                {/* Connecteur ligne — pas après le dernier */}
                {i < PROCESS.length - 1 && (
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-rw-black/20 md:absolute md:left-[2.75rem] md:right-[-1.5rem] md:top-[1.25rem]"
                  />
                )}
              </div>
              <div className="mt-4 md:pr-2">
                <h3 className="flex flex-wrap items-center gap-2 text-base">
                  {s.title}
                  {s.tag && (
                    <span className="bg-rw-orange px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-rw-black">
                      {s.tag}
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-rw-muted">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────── Portfolio ─────────────────────────── */

function Portfolio() {
  return (
    <section className="bg-rw-black text-rw-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rw-eyebrow text-rw-orange">Portfolio</p>
            <h2 className="mt-4 max-w-3xl text-rw-white text-[clamp(1.8rem,4.5vw,3rem)]">
              Griffés <span className="text-rw-orange">REWOLF</span>.
            </h2>
          </div>
          <a
            href="https://rewolf.studio"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-wider text-rw-orange hover:underline"
          >
            Voir tout le portfolio <ArrowUpRight className="size-3.5" />
          </a>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PORTFOLIO.map((p) => (
            <a
              key={p.slug}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="group block"
            >
              <div
                className="aspect-[4/5] border-2 border-rw-white bg-rw-black bg-cover bg-center transition-transform group-hover:-translate-y-1"
                style={{ backgroundImage: `url('/projects/${p.slug}.jpg')` }}
                role="img"
                aria-label={`Aperçu de l'identité ${p.name}`}
              />
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <h3 className="text-base text-rw-white">{p.name}</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-rw-orange">
                  {p.tag}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] text-rw-white/60">{p.detail}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Contact ─────────────────────────── */

/* ─────────────────────────── Section finale (contact + portfolio) ─────────────────────────── */

function FinalSection() {
  return (
    <section id="contact" className="bg-rw-orange">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="rw-eyebrow text-rw-black/70">Prêt·e à poser les bases ?</p>
        <h2 className="mt-5 text-rw-black text-[clamp(2.4rem,7vw,5rem)] leading-[0.92]">
          On a hâte d'entendre parler <span className="underline decoration-[6px] underline-offset-[10px]">de vous</span>.
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-rw-black/80 sm:text-[17px]">
          Et de vous montrer ce qu'on sait faire. Découvrez tous nos projets sur rewolf.studio.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button variant="rwDark" size="lg" asChild>
            <a href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("Premier contact, REWOLF")}`}>
              <Mail className="size-5" /> Nous écrire
            </a>
          </Button>
          <Button variant="rwDark" size="lg" asChild>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
              <Phone className="size-5" /> {CONTACT.phone}
            </a>
          </Button>
          <Button variant="rwDark" size="lg" asChild>
            <a href="https://rewolf.studio" target="_blank" rel="noreferrer">
              <ArrowUpRight className="size-5" /> Voir notre travail
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Footer ─────────────────────────── */

function Footer() {
  return (
    <footer className="bg-rw-white px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider text-rw-muted">
        <span>REWOLF Studio · 2025</span>
        <span>onboarding.rewolf.studio/forfaits-flash</span>
      </div>
    </footer>
  );
}
