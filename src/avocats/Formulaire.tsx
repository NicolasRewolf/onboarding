import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Formulaire de prise de contact de la plaquette /avocats.
 *
 * Cinq champs obligatoires, pas un de plus : c'est exactement la promesse faite
 * un peu plus haut sur la page (« dites-nous votre barreau et votre matière »).
 * L'audit des dix personas a montré que ces lecteurs abandonnent au moindre
 * formulaire long — chaque champ supplémentaire doit se justifier.
 */

// Action « Contact avocats (formulaire + e-mail) » — 700 €, une seule par clic.
const CONVERSION_ID = "AW-11144920628/mBTHCM-XrN4cELT8p8Ip";

type Etat =
  | { kind: "idle" }
  | { kind: "envoi" }
  | { kind: "ok" }
  | { kind: "erreur"; message: string };

/** Attribution publicitaire lue dans l'URL, sans cookie ni stockage. */
function attribution() {
  if (typeof window === "undefined") return undefined;
  const q = new URLSearchParams(window.location.search);
  return {
    utm_source: q.get("utm_source"),
    utm_medium: q.get("utm_medium"),
    utm_campaign: q.get("utm_campaign"),
    utm_content: q.get("utm_content"),
    utm_term: q.get("utm_term"),
    gclid: q.get("gclid"),
    referrer: document.referrer || null,
    landing_url: window.location.href,
  };
}

export default function Formulaire() {
  const [etat, setEtat] = useState<Etat>({ kind: "idle" });

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setEtat({ kind: "envoi" });

    try {
      const r = await fetch("/api/avocats-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: String(fd.get("nom") || ""),
          cabinet: String(fd.get("cabinet") || ""),
          barreau: String(fd.get("barreau") || ""),
          domaine: String(fd.get("domaine") || ""),
          email: String(fd.get("email") || ""),
          telephone: String(fd.get("telephone") || ""),
          message: String(fd.get("message") || ""),
          website: String(fd.get("website") || ""),
          attribution: attribution(),
        }),
      });

      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Erreur ${r.status}`);
      }

      // Conversion Google Ads — c'est elle qui pilote la campagne.
      window.gtag?.("event", "conversion", { send_to: CONVERSION_ID });
      window.gtag?.("event", "generate_lead", { method: "formulaire", section: "contact" });
      setEtat({ kind: "ok" });
    } catch (err) {
      setEtat({
        kind: "erreur",
        message: err instanceof Error ? err.message : "Envoi impossible",
      });
    }
  }

  if (etat.kind === "ok") {
    return (
      <div className="border-2 border-rw-black bg-rw-white p-8">
        <Check className="size-8 text-rw-orange" strokeWidth={2.5} />
        <p className="mt-4 text-[1.3rem] font-extrabold uppercase leading-none tracking-tight">
          C'est reçu.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-rw-muted">
          Nous vous répondons sous 48 heures ouvrées, et nous commencerons par vous dire si votre barreau
          et votre matière sont libres. Si ce n'est pas le cas, vous le saurez dès le premier message.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="border-2 border-rw-black bg-rw-white p-6 sm:p-8">
      <p className="rw-eyebrow text-rw-tertiary">Écrivez-nous</p>
      <p className="mt-3 text-[15px] leading-relaxed text-rw-muted">
        Cinq champs. Nous répondons sous 48 heures ouvrées.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Champ nom="nom" label="Votre nom" requis autoComplete="name" />
        <Champ nom="cabinet" label="Cabinet" requis autoComplete="organization" />
        <Champ nom="barreau" label="Barreau" requis placeholder="Bordeaux" />
        <Champ nom="domaine" label="Domaine principal" requis placeholder="Droit pénal" />
        <Champ nom="email" label="E-mail" requis type="email" autoComplete="email" />
        <Champ nom="telephone" label="Téléphone (facultatif)" type="tel" autoComplete="tel" />
      </div>

      <div className="mt-4">
        <label htmlFor="message" className="rw-eyebrow text-rw-tertiary">
          Votre situation (facultatif)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="mt-2 w-full border-2 border-rw-black bg-rw-white p-3 text-[15px] leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-rw-orange"
        />
      </div>

      {/* Leurre anti-robot : hors écran, jamais atteint au clavier. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] size-px opacity-0"
      />

      {etat.kind === "erreur" && (
        <p className="mt-5 border-2 border-rw-danger bg-rw-white p-3 text-[14px] leading-relaxed text-rw-danger">
          {etat.message}. Vous pouvez aussi écrire directement à{" "}
          <a href="mailto:nicolas@rewolf.studio" className="underline">
            nicolas@rewolf.studio
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={etat.kind === "envoi"}
        className={cn(
          "mt-6 inline-flex items-center gap-2 border-2 border-rw-black bg-rw-orange px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-wider text-rw-black shadow-[var(--shadow-hard)] transition-transform",
          etat.kind === "envoi"
            ? "cursor-wait opacity-70"
            : "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-hard-sm)]",
        )}
      >
        {etat.kind === "envoi" ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Envoi…
          </>
        ) : (
          <>
            Envoyer <ArrowRight className="size-4" />
          </>
        )}
      </button>

      <p className="mt-4 text-[12px] leading-relaxed text-rw-tertiary">
        Vos informations servent uniquement à vous répondre. Elles ne sont ni revendues ni cédées.
      </p>
    </form>
  );
}

function Champ({
  nom,
  label,
  requis,
  ...rest
}: {
  nom: string;
  label: string;
  requis?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={nom} className="rw-eyebrow text-rw-tertiary">
        {label}
      </label>
      <input
        id={nom}
        name={nom}
        required={requis}
        className="mt-2 w-full border-2 border-rw-black bg-rw-white px-3 py-2.5 text-[15px] outline-none focus-visible:outline-2 focus-visible:outline-rw-orange"
        {...rest}
      />
    </div>
  );
}
