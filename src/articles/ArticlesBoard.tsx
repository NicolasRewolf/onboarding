import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Copy, Loader2, Mail, PenLine, Send, Star } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CHOICES,
  CHOICE_BY_KEY,
  MAX_COEURS,
  SERIES,
  SUJETS,
  formatVolume,
  resolveArticlesClient,
  salutation,
  sujetsDeSerie,
  type ArticleChoice,
  type ArticlesClient,
  type Serie,
  type Sujet,
} from "./data";
import { clearSession, loadSession, saveSession, type ArticlesSession } from "./storage";
import { buildMailtoBody, buildRecapMarkdown, buildSelectionLines, selectionStats } from "./report";

const NICOLAS_EMAIL = "nicolas@rewolf.studio";

type Phase = "board" | "done";

/* ─────────────────────────── Page ─────────────────────────── */

export default function ArticlesBoard() {
  const { slug = "plouton" } = useParams();
  const [params] = useSearchParams();
  const client = useMemo(() => resolveArticlesClient(slug, params), [slug, params]);

  const [session, setSession] = useState<ArticlesSession>(() => loadSession(slug));
  const [phase, setPhase] = useState<Phase>(() => (loadSession(slug).sent ? "done" : "board"));
  const [open, setOpen] = useState<Set<number>>(new Set());

  useEffect(() => {
    saveSession(slug, session);
  }, [slug, session]);

  useEffect(() => {
    document.title = `Sujets d'articles · ${salutation(client.name)}`;
  }, [client.name]);

  const stats = useMemo(() => selectionStats(session), [session]);

  const choisir = useCallback((id: number, choice: ArticleChoice) => {
    setSession((s) => {
      const dejaCeChoix = s.choix[id] === choice;
      const choix = { ...s.choix };
      if (dejaCeChoix) delete choix[id];
      else choix[id] = choice;
      // Un sujet écarté ou dé-tranché ne peut pas rester en priorité.
      const coeurs = choice === "oui" && !dejaCeChoix ? s.coeurs : s.coeurs.filter((c) => c !== id);
      return { ...s, choix, coeurs };
    });
  }, []);

  const basculerCoeur = useCallback((id: number) => {
    setSession((s) => {
      if (s.coeurs.includes(id)) return { ...s, coeurs: s.coeurs.filter((c) => c !== id) };
      if (s.coeurs.length >= MAX_COEURS) return s;
      // Épingler vaut retenir.
      return { ...s, coeurs: [...s.coeurs, id], choix: { ...s.choix, [id]: "oui" } };
    });
  }, []);

  const basculerDetail = useCallback((id: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (phase === "done") {
    return (
      <Shell client={client} compteur={`${stats.oui} sujet${stats.oui > 1 ? "s" : ""} retenu${stats.oui > 1 ? "s" : ""}`}>
        <EcranFin
          client={client}
          session={session}
          onReprendre={() => {
            setSession((s) => ({ ...s, sent: false }));
            setPhase("board");
          }}
          onRecommencer={() => {
            clearSession(slug);
            setSession(loadSession(slug));
            setPhase("board");
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell client={client} compteur={`${stats.tranches}/${stats.total}`}>
      <div className="mx-auto max-w-5xl px-5 pb-40 pt-8 sm:px-8">
        <Intro />

        {SERIES.map((serie) => {
          const sujets = sujetsDeSerie(serie.key);
          if (!sujets.length) return null;
          return (
            <BlocSerie key={serie.key} serie={serie}>
              <div className="grid gap-4 sm:grid-cols-2">
                {sujets.map((sujet) => (
                  <CarteSujet
                    key={sujet.id}
                    sujet={sujet}
                    choix={session.choix[sujet.id]}
                    coeur={session.coeurs.includes(sujet.id)}
                    coeursPleins={session.coeurs.length >= MAX_COEURS}
                    ouvert={open.has(sujet.id)}
                    onChoisir={choisir}
                    onCoeur={basculerCoeur}
                    onDetail={basculerDetail}
                  />
                ))}
              </div>
            </BlocSerie>
          );
        })}

        <MotLibre note={session.note} onChange={(note) => setSession((s) => ({ ...s, note }))} />
      </div>

      <BarreBasse
        client={client}
        session={session}
        stats={stats}
        onSent={() => {
          setSession((s) => ({ ...s, sent: true }));
          setPhase("done");
          window.scrollTo({ top: 0 });
        }}
      />
    </Shell>
  );
}

/* ─────────────────────────── Chrome ─────────────────────────── */

function Shell({
  client,
  compteur,
  children,
}: {
  client: ArticlesClient;
  compteur: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b-2 border-rw-black bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Wordmark className="h-4 text-rw-black sm:h-[18px]" />
          {client.isTest && (
            <span className="border-2 border-rw-black bg-rw-black px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-rw-white">
              Démo
            </span>
          )}
          <span className="hidden h-4 w-px bg-rw-line-subtle sm:block" />
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-rw-muted sm:block">
            Sujets d'articles · {salutation(client.name)}
          </span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wider tabular-nums text-rw-muted">{compteur}</span>
      </header>
      {children}
    </div>
  );
}

function Intro() {
  return (
    <section className="border-2 border-rw-black bg-white p-6 shadow-[var(--shadow-hard)] sm:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-rw-muted">Le prochain trimestre</p>
      <h1 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
        {SUJETS.length} sujets.
        <br />
        Dis-moi lesquels te parlent.
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-rw-muted">
        Tous sont cherchés sur Google, aucun confrère ne les traite côté victime, et chacun pousse vers une de tes
        pages.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {CHOICES.slice()
          .reverse()
          .map((c) => (
            <div
              key={c.key}
              className="flex items-center gap-3 border-2 border-rw-black bg-white p-3 shadow-[var(--shadow-hard-sm)]"
            >
              <span aria-hidden className="text-xl">
                {c.emoji}
              </span>
              <span className="font-bold uppercase tracking-tight">{c.label}</span>
            </div>
          ))}
      </div>

      <p className="mt-4 flex items-start gap-2 text-[14px] leading-relaxed text-rw-muted">
        <Star aria-hidden className="mt-0.5 size-4 shrink-0 fill-rw-orange text-rw-black" />
        <span>
          L'étoile = tes <strong className="text-rw-black">{MAX_COEURS} priorités</strong>, celles que j'écris en
          premier. Rien ne part tant que tu n'as pas cliqué en bas.
        </span>
      </p>
    </section>
  );
}

function BlocSerie({ serie, children }: { serie: Serie; children: React.ReactNode }) {
  const estSerie = serie.key === "A" || serie.key === "B" || serie.key === "C";
  return (
    <section className="mt-12">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center border-2 border-rw-black font-mono text-[15px] font-bold shadow-[var(--shadow-hard-sm)]",
            estSerie ? "bg-rw-orange text-rw-black" : "bg-rw-black text-rw-white",
          )}
        >
          {estSerie ? serie.key : "•"}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
            {estSerie && <span className="font-mono text-[13px] uppercase tracking-[0.18em] text-rw-muted">Série {serie.key} — </span>}
            {serie.titre}
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-rw-muted">{serie.promesse}</p>
        </div>
      </div>

      {serie.effet && (
        <p className="mt-4 border-2 border-dashed border-rw-black bg-rw-paper-subtle p-4 text-[14px] leading-relaxed text-rw-muted">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rw-black">Pourquoi les publier à la suite — </span>
          {serie.effet}
        </p>
      )}

      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ─────────────────────────── Carte ─────────────────────────── */

function CarteSujet({
  sujet,
  choix,
  coeur,
  coeursPleins,
  ouvert,
  onChoisir,
  onCoeur,
  onDetail,
}: {
  sujet: Sujet;
  choix?: ArticleChoice;
  coeur: boolean;
  coeursPleins: boolean;
  ouvert: boolean;
  onChoisir: (id: number, c: ArticleChoice) => void;
  onCoeur: (id: number) => void;
  onDetail: (id: number) => void;
}) {
  const reduce = useReducedMotion();
  const ecarte = choix === "non";
  const coeurBloque = !coeur && coeursPleins;

  return (
    <article
      className={cn(
        "flex flex-col border-2 border-rw-black bg-white shadow-[var(--shadow-hard)] transition-opacity",
        ecarte && "opacity-55",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-rw-black px-4 py-2.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rw-black">
          {formatVolume(sujet.volume)} rech./mois
        </span>
        <span className="h-3 w-px bg-rw-line-subtle" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rw-muted">{sujet.periode}</span>
        {sujet.urgent && (
          <span className="border-2 border-rw-black bg-rw-orange px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-rw-black">
            Fenêtre courte
          </span>
        )}
        <button
          type="button"
          onClick={() => onCoeur(sujet.id)}
          disabled={coeurBloque}
          aria-pressed={coeur}
          aria-label={coeur ? "Retirer des priorités" : "Épingler dans les priorités"}
          title={coeurBloque ? `${MAX_COEURS} priorités maximum` : "Épingler dans les priorités"}
          className={cn(
            "ml-auto flex size-7 items-center justify-center border-2 border-rw-black transition-colors",
            coeur ? "bg-rw-orange" : "bg-white hover:bg-rw-paper-subtle",
            coeurBloque && "cursor-not-allowed opacity-35 hover:bg-white",
          )}
        >
          <Star aria-hidden className={cn("size-3.5", coeur && "fill-rw-black")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[17px] font-bold leading-snug tracking-tight">{sujet.titre}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-rw-muted">{sujet.accroche}</p>

        <div className="mt-4 border-2 border-rw-black bg-rw-paper-subtle p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rw-muted">L'angle qu'on prend</p>
          <p className="mt-1.5 text-[14px] leading-relaxed">{sujet.angle}</p>
        </div>

        <button
          type="button"
          onClick={() => onDetail(sujet.id)}
          aria-expanded={ouvert}
          className="mt-3 flex items-center gap-1.5 self-start font-mono text-[10px] uppercase tracking-[0.16em] text-rw-muted transition-colors hover:text-rw-black"
        >
          {ouvert ? "Masquer le détail" : "Voir le détail"}
          <ChevronDown aria-hidden className={cn("size-3.5 transition-transform", ouvert && "rotate-180")} />
        </button>

        <AnimatePresence initial={false}>
          {ouvert && (
            <motion.div
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <dl className="mt-3 space-y-3 border-t-2 border-rw-line-subtle pt-3 text-[13px] leading-relaxed">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-rw-muted">
                    Ce que Google ne propose pas encore
                  </dt>
                  <dd className="mt-1">{sujet.gap}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-rw-muted">Renvoie vers</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {sujet.maillage.map((m) => (
                      <span key={m} className="border border-rw-line-subtle bg-white px-1.5 py-0.5 text-[12px]">
                        {m}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-rw-muted">Point de vigilance</dt>
                  <dd className="mt-1 text-rw-muted">{sujet.vigilance}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-rw-muted">Pousse vers</dt>
                  <dd className="mt-1 font-medium">{sujet.pageCibleLabel}</dd>
                </div>
                {sujet.volumeNote && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-rw-muted">Précision</dt>
                    <dd className="mt-1 text-rw-muted">{sujet.volumeNote}</dd>
                  </div>
                )}
              </dl>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 grid grid-cols-3 gap-2 pt-1">
          {CHOICES.map((c) => {
            const actif = choix === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onChoisir(sujet.id, c.key)}
                aria-pressed={actif}
                aria-label={c.aria}
                className={cn(
                  "flex flex-col items-center gap-1 border-2 border-rw-black px-1 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-all",
                  actif
                    ? "bg-rw-black text-rw-white shadow-none"
                    : "bg-white text-rw-black shadow-[var(--shadow-hard-sm)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none",
                )}
              >
                <span aria-hidden className="text-base leading-none">
                  {c.emoji}
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────── Mot libre ─────────────────────────── */

function MotLibre({ note, onChange }: { note: string; onChange: (v: string) => void }) {
  return (
    <section className="mt-12 border-2 border-rw-black bg-white p-5 shadow-[var(--shadow-hard)] sm:p-6">
      <label htmlFor="mot" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-rw-muted">
        <PenLine aria-hidden className="size-3.5" />
        Un sujet te manque ? Une remarque ?
      </label>
      <textarea
        id="mot"
        value={note}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={3000}
        placeholder="Un dossier récent qui ferait un bon article, une question qui revient en rendez-vous…"
        className="mt-3 w-full resize-y border-2 border-rw-black bg-white p-3 text-[15px] leading-relaxed outline-none placeholder:text-rw-tertiary focus:shadow-[var(--shadow-hard-sm)]"
      />
    </section>
  );
}

/* ─────────────────────────── Barre basse ─────────────────────────── */

function BarreBasse({
  client,
  session,
  stats,
  onSent,
}: {
  client: ArticlesClient;
  session: ArticlesSession;
  stats: ReturnType<typeof selectionStats>;
  onSent: () => void;
}) {
  const [status, setStatus] = useState<{ k: "idle" | "sending" | "error"; msg?: string }>({ k: "idle" });
  const rienChoisi = stats.oui === 0;

  const envoyer = async () => {
    setStatus({ k: "sending" });
    const payload = {
      client: { slug: client.slug, name: client.name, title: client.title ?? null },
      choix: buildSelectionLines(session).map((l) => ({ id: l.id, titre: l.titre, choice: l.choice })),
      coeurs: session.coeurs,
      note: session.note,
      stats,
      recapMarkdown: buildRecapMarkdown(client, session),
      submittedAt: new Date().toISOString(),
    };
    try {
      const r = await fetch("/api/articles-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Erreur ${r.status}`);
      }
      onSent();
    } catch (e) {
      setStatus({ k: "error", msg: e instanceof Error ? e.message : "Envoi impossible" });
    }
  };

  const mailto = `mailto:${NICOLAS_EMAIL}?subject=${encodeURIComponent(
    `Sujets retenus — ${salutation(client.name)}`,
  )}&body=${encodeURIComponent(buildMailtoBody(client, session))}`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 pb-5 sm:px-8">
      <div className="pointer-events-auto mx-auto max-w-5xl border-2 border-rw-black bg-white p-3 shadow-[var(--shadow-hard)] sm:p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider">
            <Chip emoji={CHOICE_BY_KEY.oui.emoji} n={stats.oui} label="retenus" fort />
            <Chip emoji={CHOICE_BY_KEY.peutetre.emoji} n={stats.peutetre} label="en réserve" />
            <Chip emoji="⭐" n={stats.coeurs} label="priorités" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {status.k === "error" && (
              <a
                href={mailto}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-rw-danger underline underline-offset-4"
              >
                <Mail aria-hidden className="size-3.5" />
                Envoyer par mail
              </a>
            )}
            <Button
              variant="rw"
              onClick={envoyer}
              disabled={rienChoisi || status.k === "sending"}
              className="disabled:cursor-not-allowed disabled:opacity-45"
            >
              {status.k === "sending" ? (
                <>
                  <Loader2 aria-hidden className="mr-2 size-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                <>
                  <Send aria-hidden className="mr-2 size-4" />
                  Envoyer ma sélection
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-rw-tertiary">
          {status.k === "error"
            ? status.msg
            : rienChoisi
              ? "Retiens au moins un sujet pour envoyer"
              : `${stats.tranches}/${stats.total} tranchés — tu peux revenir plus tard, tout est gardé`}
        </p>
      </div>
    </div>
  );
}

function Chip({ emoji, n, label, fort }: { emoji: string; n: number; label: string; fort?: boolean }) {
  return (
    <span className={cn("flex items-center gap-1.5", n === 0 && "text-rw-tertiary")}>
      <span aria-hidden>{emoji}</span>
      <span className={cn("tabular-nums", fort && n > 0 && "font-bold text-rw-black")}>{n}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

/* ─────────────────────────── Écran de fin ─────────────────────────── */

function EcranFin({
  client,
  session,
  onReprendre,
  onRecommencer,
}: {
  client: ArticlesClient;
  session: ArticlesSession;
  onReprendre: () => void;
  onRecommencer: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const lignes = buildSelectionLines(session).filter((l) => l.choice === "oui");
  const stats = selectionStats(session);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(buildRecapMarkdown(client, session));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* presse-papier indisponible : le récap reste lisible à l'écran */
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <div className="border-2 border-rw-black bg-white p-7 shadow-[var(--shadow-hard)] sm:p-9">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-rw-muted">C'est envoyé</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight">Merci {salutation(client.name)}.</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-rw-muted">
          J'ai tes {stats.oui} sujet{stats.oui > 1 ? "s" : ""}
          {stats.coeurs > 0 && <>, dont {stats.coeurs} en priorité</>}. Je m'occupe du fond et de la rédaction, tu
          reliras avant publication.
        </p>

        <ul className="mt-7 space-y-2">
          {lignes.map((l) => (
            <li key={l.id} className="flex items-start gap-2.5 border-2 border-rw-black bg-white p-3 text-[15px] leading-snug">
              <span aria-hidden className="shrink-0">
                {l.coeur ? "⭐" : "✍️"}
              </span>
              <span>{l.titre}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="rwDark" onClick={copier}>
            {copied ? <Check aria-hidden className="mr-2 size-4" /> : <Copy aria-hidden className="mr-2 size-4" />}
            {copied ? "Copié" : "Copier le récap"}
          </Button>
          <button
            onClick={onReprendre}
            className="font-mono text-[11px] uppercase tracking-wider text-rw-muted underline underline-offset-4 transition-colors hover:text-rw-black"
          >
            Modifier ma sélection
          </button>
          <button
            onClick={onRecommencer}
            className="font-mono text-[11px] uppercase tracking-wider text-rw-tertiary underline underline-offset-4 transition-colors hover:text-rw-black"
          >
            Tout recommencer
          </button>
        </div>
      </div>
    </div>
  );
}
