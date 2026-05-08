import Link from "next/link";

import { OnboardingModal } from "./_components/OnboardingModal";
import { SavedGamesList } from "./_components/SavedGamesList";
import { ThemeToggle } from "./_components/ThemeToggle";

export default function HomePage() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <OnboardingModal />
      {/* Masthead */}
      <header className="mb-16 border-b border-rule/40 pb-12">
        <p className="editorial-eyebrow">A Companion Tracker</p>
        <h1 className="editorial-h1 mt-4">Praxis</h1>
        <p className="editorial-lede mt-6 max-w-2xl">
          For{" "}
          <em className="text-ink">Hegemony — Lead Your Class to Victory</em>.
          Resources, taxes, payments, population and policies — kept in order so the
          evening is spent playing, not doing arithmetic.
        </p>
        <p className="mt-4 font-serif text-xs italic text-inkMute">
          An unaffiliated fan project — not associated with Hegemonic Project Games.
        </p>
      </header>

      {/* Two starting paths */}
      <section className="mb-20">
        <p className="editorial-eyebrow mb-6">Begin a session</p>
        <div className="grid gap-px overflow-hidden rounded-lg border border-rule/60 bg-surfaceSoft/40 sm:grid-cols-2">
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
              <span className="font-serif text-[11px] italic text-inkMute">
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
          className="group flex items-center justify-between rounded-lg border border-rule/60 bg-surface/30 px-6 py-5 transition-colors hover:border-rule hover:bg-surface/60"
        >
          <div>
            <p className="editorial-eyebrow">Joining a friend</p>
            <p className="mt-2 font-serif text-base text-ink">
              Enter a 6-character room code →
            </p>
          </div>
          <span className="font-serif text-sm italic text-inkMute group-hover:text-inkSoft">
            Join room
          </span>
        </Link>
      </section>

      {/* Saved games */}
      <SavedGamesList />

      {/* Footer */}
      <footer className="mt-20 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-rule/40 pt-8 font-serif text-xs italic text-inkMute">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/rules-cheatsheet"
            className="text-inkMute transition-colors hover:text-inkSoft"
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
      className="group flex flex-col justify-between gap-8 bg-paper/60 p-8 transition-colors hover:bg-surface/60"
    >
      <div>
        <p className="font-serif text-[11px] uppercase italic tracking-[0.3em] text-accentInk/70">
          {tag}
        </p>
        <h2 className="editorial-h2 mt-3">{title}</h2>
        <p className="mt-4 max-w-md font-serif text-sm leading-relaxed text-inkSoft">
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
