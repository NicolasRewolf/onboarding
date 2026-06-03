import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import { KNOWN_CLIENTS } from "@/lib/clients";
import { cn } from "@/lib/utils";

const RESPONSES_REPO = "https://github.com/NicolasRewolf/onboarding-responses";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^me\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Admin() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://onboarding.rewolf.studio";
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const slug = useMemo(() => slugify(name) || "client", [name]);

  const link = useMemo(() => {
    const p = new URLSearchParams();
    if (name) p.set("n", name);
    if (title) p.set("t", title);
    if (project) p.set("p", project);
    const qs = p.toString();
    return `${origin}/c/${slug}${qs ? `?${qs}` : ""}`;
  }, [origin, slug, name, title, project]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b-2 border-rw-black bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Wordmark className="h-4 text-rw-black sm:h-[18px]" />
          <span className="hidden h-4 w-px bg-rw-line-subtle sm:block" />
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-rw-muted sm:block">
            Espace studio
          </span>
        </div>
        <a
          href={RESPONSES_REPO}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-rw-muted hover:text-rw-orange"
        >
          Réponses <ExternalLink className="size-3.5" />
        </a>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-14 sm:px-8">
        <p className="rw-eyebrow text-rw-orange">Générateur de liens</p>
        <h1 className="mt-4 text-[clamp(2.2rem,6vw,3.4rem)]">Nouveau cadrage client</h1>
        <p className="mt-4 max-w-lg text-[15px] text-rw-muted">
          Renseigne le client, copie le lien, partage-le. À la validation, son rapport arrive dans le dépôt privé{" "}
          <code className="bg-rw-paper-subtle px-1 text-[13px]">onboarding-responses</code> — et tu reçois une notif.
        </p>

        {/* Form */}
        <div className="mt-10 space-y-5 border-2 border-rw-black bg-white p-6 shadow-[var(--shadow-hard)]">
          <LabeledInput label="Nom du client" value={name} onChange={setName} placeholder="Me Jacques Derieux" autoFocus />
          <div className="grid gap-5 sm:grid-cols-2">
            <LabeledInput label="Titre (optionnel)" value={title} onChange={setTitle} placeholder="Avocat" />
            <LabeledInput label="Slug" value={slug} onChange={() => {}} placeholder="derieux" readOnly mono />
          </div>
          <LabeledInput
            label="Projet (optionnel)"
            value={project}
            onChange={setProject}
            placeholder="Identité · site · blog"
          />
          <LinkOutput link={link} />
        </div>

        {/* Connus */}
        <h2 className="mt-14 text-lg">Clients enregistrés</h2>
        <p className="mt-1 text-[13px] text-rw-muted">
          Liens stables (définis dans le code). Les liens ad-hoc ci-dessus n'ont pas besoin de redéploiement.
        </p>
        <div className="mt-5 space-y-3">
          {KNOWN_CLIENTS.map((c) => (
            <div key={c.slug} className="flex flex-wrap items-center justify-between gap-3 border-2 border-rw-black bg-white p-4">
              <div>
                <p className="font-bold uppercase tracking-tight">{c.name}</p>
                <p className="font-mono text-[12px] text-rw-muted">/c/{c.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="rwOutline" size="sm" asChild>
                  <a href={`/c/${c.slug}`} target="_blank" rel="noreferrer">
                    Ouvrir <ExternalLink className="size-3.5" />
                  </a>
                </Button>
                <Button variant="rwOutline" size="sm" asChild>
                  <a href={`${RESPONSES_REPO}/blob/main/responses/${c.slug}/report.md`} target="_blank" rel="noreferrer">
                    Rapport
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
  mono,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  mono?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="rw-eyebrow text-rw-muted">{label}</span>
      <input
        className={cn(
          "mt-2 w-full border-2 border-rw-black bg-white px-4 py-3 text-[15px] placeholder:text-rw-tertiary focus:border-rw-orange focus:outline-none focus:ring-2 focus:ring-rw-orange/30",
          mono && "font-mono",
          readOnly && "bg-rw-paper-subtle text-rw-muted",
        )}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LinkOutput({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="border-2 border-rw-black bg-rw-black p-4">
      <span className="rw-eyebrow flex items-center gap-1.5 text-rw-orange">
        <Link2 className="size-3.5" /> Lien à partager
      </span>
      <div className="mt-2 flex items-center gap-3">
        <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-rw-white">{link}</code>
        <Button variant="rw" size="sm" onClick={copy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copié" : "Copier"}
        </Button>
      </div>
    </div>
  );
}
