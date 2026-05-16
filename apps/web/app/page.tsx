import Link from "next/link";

import { OnboardingModal } from "./_components/OnboardingModal";
import { SavedGamesList } from "./_components/SavedGamesList";
import { ThemeToggle } from "./_components/ThemeToggle";

export default function HomePage() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <main id="main" className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16">
      <OnboardingModal />

      {/* Masthead — broadsheet drop folio with hairline strip + italic byline */}
      <header className="relative mb-12 sm:mb-16">
        {/* Strip: descriptor · date · disclaimer */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-rule/40 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-inkMute">
          <span>Companion tracker</span>
          <span className="hidden sm:inline">{today}</span>
          <span className="sm:text-right">An unaffiliated fan project</span>
        </div>

        <h1 className="poster-h1 mt-3 text-center sm:mt-4">Praxis</h1>

        <hr className="mt-2 border-0 border-t-2 border-rule/60" />

        <p className="mx-auto mt-4 max-w-2xl text-center font-serif text-fluid-base italic leading-relaxed text-inkSoft text-pretty sm:mt-5 sm:text-fluid-lg">
          A bookkeeper for{" "}
          <em className="not-italic text-ink">Hegemony — Lead Your Class to Victory</em>.
          Resources, taxes, payments and policies — kept in order so the evening
          is spent playing.
        </p>

        {/* Four-bar palette ribbon */}
        <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
          <span className="h-2 w-12 bg-working sm:w-14" />
          <span className="h-2 w-12 bg-middle sm:w-14" />
          <span className="h-2 w-12 bg-capitalist sm:w-14" />
          <span className="h-2 w-12 bg-state sm:w-14" />
        </div>
      </header>

      {/* Two starting paths */}
      <section className="mb-14 sm:mb-20">
        <p className="poster-eyebrow mb-4">Begin a session</p>
        <div className="grid gap-px overflow-hidden rounded-md border border-rule/60 bg-surfaceSoft/40 sm:grid-cols-2">
          <ModeCard
            href="/play/setup?mode=party"
            tag="Party mode"
            title="Around one screen"
            description="Two to four players share a tablet or laptop. Hidden information receives a privacy curtain."
            accentClass="bg-working"
            tagClass="text-working"
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
            accentClass="bg-capitalist"
            tagClass="text-capitalist"
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

      {/* Tools — standalone calculators that don't need a game session */}
      <section className="mb-12">
        <p className="poster-eyebrow mb-4">Tools</p>
        <div className="grid gap-px overflow-hidden rounded-md border border-rule/60 bg-surfaceSoft/40 sm:grid-cols-2">
          <ModeCard
            href="/tools/working-class"
            tag="Working Class"
            title="Calculator companion"
            description="Tax, wages, and policy helper — no game session needed. Inputs persist locally."
            accentClass="bg-working"
            tagClass="text-working"
            footer={
              <span className="font-serif text-fluid-xs italic text-inkMute">
                Round 1 defaults ready · base game &amp; C&amp;C
              </span>
            }
          />
          <ModeCard
            href="/tools/middle-class"
            tag="Middle Class"
            title="Calculator companion"
            description="Dual taxes, mandatory food bill, Section-B scoring tracker. Both employer and employee."
            accentClass="bg-middle"
            tagClass="text-middle"
            footer={
              <span className="font-serif text-fluid-xs italic text-inkMute">
                EOG VP from rulebook page 25
              </span>
            }
          />
        </div>
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
  accentClass,
  tagClass,
  footer,
}: {
  href: string;
  tag: string;
  title: string;
  description: string;
  accentClass: string;
  tagClass: string;
  footer: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-w-0 flex-col justify-between gap-6 bg-paper/60 p-6 transition-colors hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:p-8"
    >
      <span aria-hidden className={`absolute left-0 top-0 h-1.5 w-full ${accentClass}`} />
      <div className="min-w-0">
        <p className={`poster-eyebrow ${tagClass}`}>{tag}</p>
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
  return <span className={`h-1.5 w-10 rounded-sm opacity-90 ${className}`} />;
}
