import Link from "next/link";

import { SavedGamesList } from "./_components/SavedGamesList";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-12">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Companion tracker
        </p>
        <h1 className="text-6xl font-light tracking-tight text-slate-100 sm:text-7xl">
          Praxis
        </h1>
        <p className="mt-4 max-w-lg leading-relaxed text-slate-400">
          For{" "}
          <em className="font-normal not-italic text-slate-300">
            Hegemony: Lead Your Class to Victory
          </em>{" "}
          — keeps resources, taxes, payments, population and policies in order so you can spend
          the evening playing instead of doing arithmetic.
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Unofficial fan project · not affiliated with Hegemonic Project Games
        </p>
      </header>

      <section className="mb-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/play/setup?mode=party"
          className="group rounded-xl border border-slate-700/60 bg-slate-900/60 p-6 transition-all hover:border-slate-600 hover:bg-slate-900/80"
        >
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Party mode
          </p>
          <h2 className="text-2xl font-semibold text-slate-100">Around one screen</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            2–4 players share a tablet or laptop. Hidden info gets a privacy curtain.
          </p>
          <div className="mt-5 flex gap-1.5">
            <span className="h-1 flex-1 rounded-full bg-working/50" />
            <span className="h-1 flex-1 rounded-full bg-middle/50" />
            <span className="h-1 flex-1 rounded-full bg-capitalist/50" />
            <span className="h-1 flex-1 rounded-full bg-state/50" />
          </div>
        </Link>
        <Link
          href="/play/setup?mode=solo"
          className="group rounded-xl border border-slate-700/60 bg-slate-900/60 p-6 transition-all hover:border-slate-600 hover:bg-slate-900/80"
        >
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Solo mode
          </p>
          <h2 className="text-2xl font-semibold text-slate-100">Just me + automa</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Track your class plus simplified opponent state for Crisis &amp; Control automa play.
          </p>
          <p className="mt-5 text-[10px] uppercase tracking-wider text-slate-600">
            Crisis &amp; Control expansion supported
          </p>
        </Link>
      </section>

      <SavedGamesList />

      <footer className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-800/60 pt-6 text-xs text-slate-600">
        <Link
          href="/rules-cheatsheet"
          className="text-slate-500 transition-colors hover:text-slate-300"
        >
          Quick rules reference →
        </Link>
        <span className="hidden text-slate-700 sm:inline">·</span>
        <span>Rulebooks bundled in /docs/ (v1.2 + C&amp;C v1.1)</span>
      </footer>
    </main>
  );
}
