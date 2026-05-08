import Link from "next/link";

import { OnboardingModal } from "./_components/OnboardingModal";
import { SavedGamesList } from "./_components/SavedGamesList";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <OnboardingModal />
      {/* Masthead */}
      <header className="mb-16 border-b border-slate-800/40 pb-12">
        <p className="editorial-eyebrow">A Companion Tracker</p>
        <h1 className="editorial-h1 mt-4">Praxis</h1>
        <p className="editorial-lede mt-6 max-w-2xl">
          For{" "}
          <em className="text-slate-200">Hegemony — Lead Your Class to Victory</em>.
          Resources, taxes, payments, population and policies — kept in order so the
          evening is spent playing, not doing arithmetic.
        </p>
        <p className="mt-4 font-serif text-xs italic text-slate-600">
          An unaffiliated fan project — not associated with Hegemonic Project Games.
        </p>
      </header>

      {/* Two starting paths */}
      <section className="mb-20">
        <p className="editorial-eyebrow mb-6">Begin a session</p>
        <div className="grid gap-px overflow-hidden rounded-lg border border-slate-800/60 bg-slate-800/40 sm:grid-cols-2">
          <ModeCard
            href="/play/setup?mode=party"
            tag="Party mode"
            title="Around one screen"
            description="Two to four players share a tablet or laptop. Hidden information receives a privacy curtain."
            footer={
              <div className="flex gap-1">
                <FactionBar className="bg-working" />
                <FactionBar className="bg-middle" />
                <FactionBar className="bg-capitalist" />
                <FactionBar className="bg-state" />
              </div>
            }
          />
          <ModeCard
            href="/play/setup?mode=solo"
            tag="Solo mode"
            title="Just me & the automa"
            description="Track your class plus a simplified opponent state for Crisis & Control automa play."
            footer={
              <span className="font-serif text-[11px] italic text-slate-500">
                Crisis &amp; Control expansion supported
              </span>
            }
          />
        </div>
      </section>

      {/* Saved games */}
      <SavedGamesList />

      {/* Footer */}
      <footer className="mt-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-800/40 pt-8 font-serif text-xs italic text-slate-600">
        <Link
          href="/rules-cheatsheet"
          className="text-slate-500 transition-colors hover:text-slate-300"
        >
          Quick rules reference →
        </Link>
        <span aria-hidden className="text-slate-700">
          ◆
        </span>
        <span>Rulebooks bundled in /docs/ — base v1.2 &amp; Crisis &amp; Control v1.1</span>
      </footer>
    </main>
  );
}

function ModeCard({
  href,
  tag,
  title,
  description,
  footer,
}: {
  href: string;
  tag: string;
  title: string;
  description: string;
  footer: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between gap-8 bg-slate-950/60 p-8 transition-colors hover:bg-slate-900/60"
    >
      <div>
        <p className="font-serif text-[11px] uppercase italic tracking-[0.3em] text-amber-200/70">
          {tag}
        </p>
        <h2 className="editorial-h2 mt-3">{title}</h2>
        <p className="mt-4 max-w-md font-serif text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
      <div>{footer}</div>
    </Link>
  );
}

function FactionBar({ className }: { className: string }) {
  return <span className={`h-1 w-10 rounded-full opacity-70 ${className}`} />;
}
