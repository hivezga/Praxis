import Link from "next/link";

import { OnboardingModal } from "./_components/OnboardingModal";
import { SavedGamesList } from "./_components/SavedGamesList";
import { ThemeToggle } from "./_components/ThemeToggle";

export default function HomePage() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-20">
      <OnboardingModal />

      {/* Masthead — civic-poster */}
      <header className="relative mb-12 border-b-2 border-rule/60 pb-10 sm:mb-16 sm:pb-12">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="h-2 w-10 bg-working" aria-hidden />
          <span className="h-2 w-10 bg-middle" aria-hidden />
          <span className="h-2 w-10 bg-capitalist" aria-hidden />
          <span className="h-2 w-10 bg-state" aria-hidden />
          <span className="poster-eyebrow ml-2">Companion tracker</span>
        </div>
        <h1 className="poster-h1">Praxis</h1>
        <p className="editorial-lede mt-5 max-w-2xl">
          For{" "}
          <em className="text-ink">Hegemony — Lead Your Class to Victory</em>.
          Resources, taxes, payments, population and policies — kept in order so the
          evening is spent playing, not doing arithmetic.
        </p>
        <p className="mt-4 font-serif text-fluid-xs italic text-inkMute">
          An unaffiliated fan project — not associated with Hegemonic Project Games.
        </p>
      </header>

      {/* Two starting paths */}
      <section className="mb-16 sm:mb-20">
        <p className="poster-eyebrow mb-6">Begin a session</p>
        <div className="grid gap-px overflow-hidden rounded-md border border-rule/60 bg-surfaceSoft/40 sm:grid-cols-2">
          <ModeCard
            href="/play/setup?mode=party"
            tag="Party mode"
            title="Around one screen"
            description="Two to four players share a tablet or laptop. Hidden information receives a privacy curtain."
            accent="bg-accent"
            footer={
              <div className="flex gap-1" aria-hidden>
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
            accent="bg-accentSoft"
            footer={
              <span className="font-serif text-fluid-xs italic text-inkMute">
                Crisis &amp; Control expansion supported
              </span>
            }
          />
        </div>
      </section>

      {/* Join an existing room */}
      <section className="mb-12">
        <Link
          href="/play/join"
          className="group flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-rule/60 bg-surface/30 px-5 py-5 transition-colors hover:border-accent hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:px-6"
        >
          <div className="min-w-0">
            <p className="poster-eyebrow">Joining a friend</p>
            <p className="mt-2 font-display text-fluid-lg uppercase tracking-tight text-ink">
              Enter a 6-character room code →
            </p>
          </div>
          <span className="font-display text-fluid-sm uppercase tracking-wider text-inkMute group-hover:text-accent">
            Join room
          </span>
        </Link>
      </section>

      <SavedGamesList />

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-rule/40 pt-8 font-serif text-fluid-xs italic text-inkMute">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/rules-cheatsheet"
            className="min-h-tap inline-flex items-center text-inkMute transition-colors hover:text-inkSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Quick rules reference →
          </Link>
          <span aria-hidden className="text-inkSubtle">
            ◆
          </span>
          <span>Rulebooks bundled in /docs/ — base v1.2 &amp; Crisis &amp; Control v1.1</span>
        </div>
        <ThemeToggle />
      </footer>
    </main>
  );
}

function ModeCard({
  href,
  tag,
  title,
  description,
  accent,
  footer,
}: {
  href: string;
  tag: string;
  title: string;
  description: string;
  accent: string;
  footer: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-w-0 flex-col justify-between gap-6 bg-paper/60 p-6 transition-colors hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:p-8"
    >
      <span aria-hidden className={`absolute left-0 top-0 h-1.5 w-full ${accent} opacity-90`} />
      <div className="min-w-0">
        <p className="poster-eyebrow text-accentInk">{tag}</p>
        <h2 className="poster-h2 mt-3 text-balance">{title}</h2>
        <p className="mt-4 max-w-md font-serif text-fluid-base leading-relaxed text-inkSoft text-pretty">
          {description}
        </p>
      </div>
      <div>{footer}</div>
    </Link>
  );
}

function FactionBar({ className }: { className: string }) {
  return <span className={`h-1.5 w-10 rounded-sm opacity-80 ${className}`} />;
}
