import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-rw-black text-rw-white">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Wordmark className="h-5 text-rw-orange" />
        <a
          href="https://www.rewolf.studio/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-rw-white/60 transition-colors hover:text-rw-orange"
        >
          Espace studio <ArrowUpRight className="size-3.5" />
        </a>
      </header>

      <main className="flex flex-1 flex-col justify-center px-6 py-20 sm:px-10">
        <p className="rw-eyebrow text-rw-orange">REWOLF · Espace client</p>
        <h1 className="mt-6 max-w-5xl text-[clamp(2.8rem,11vw,8rem)] leading-[0.88]">
          Bienvenue dans le back de la <span className="text-rw-orange">tanière</span>.
        </h1>
        <p className="mt-8 max-w-xl text-[16px] leading-relaxed text-rw-white/70">
          Ici, on cadre, on propose, on crée. C'est l'atelier où vivent les supports clients REWOLF —
          questionnaires de cadrage, présentations d'offres… — chacun derrière son lien personnel.
        </p>
        <p className="mt-10 font-mono text-[12px] text-rw-white/40">
          Vous avez reçu un lien personnel ? Ouvrez-le pour commencer.
        </p>
      </main>

      <footer className="border-t border-rw-white/10 px-6 py-5 font-mono text-[11px] text-rw-white/40 sm:px-10">
        onboarding.rewolf.studio
      </footer>
    </div>
  );
}
