import Link from "next/link";

import { SavedGamesList } from "./_components/SavedGamesList";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">Praxis</h1>
        <p className="mt-2 max-w-xl text-slate-400">
          A companion tracker for <em>Hegemony: Lead Your Class to Victory</em> — keeps your
          resources, taxes, payments, population and policies in order so you can spend the
          evening playing instead of doing arithmetic.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Unofficial fan project. Not affiliated with Hegemonic Project Games.
        </p>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/play/setup?mode=party"
          className="group rounded-xl border border-slate-700 bg-slate-900/60 p-6 transition hover:border-indigo-500"
        >
          <div className="text-xs uppercase tracking-wider text-indigo-300">Party mode</div>
          <h2 className="mt-1 text-2xl font-semibold text-slate-100">Around one screen</h2>
          <p className="mt-2 text-sm text-slate-400">
            2–4 humans share a tablet or laptop. Hidden info gets a curtain.
          </p>
        </Link>
        <Link
          href="/play/setup?mode=solo"
          className="group rounded-xl border border-slate-700 bg-slate-900/60 p-6 transition hover:border-indigo-500"
        >
          <div className="text-xs uppercase tracking-wider text-indigo-300">Solo mode</div>
          <h2 className="mt-1 text-2xl font-semibold text-slate-100">Just me + automa</h2>
          <p className="mt-2 text-sm text-slate-400">
            Track your class plus simplified opponent state for Crisis &amp; Control automa play.
          </p>
        </Link>
      </section>

      <SavedGamesList />

      <footer className="mt-16 border-t border-slate-800 pt-6 text-xs text-slate-500">
        <p>
          Rulebooks are bundled in <code>/docs/</code>. Source: official Hegemonic Project Games PDFs
          (Hegemony Rulebook v1.2, Crisis &amp; Control v1.1).
        </p>
        <p className="mt-1">
          <Link href="/rules-cheatsheet" className="text-indigo-300 hover:text-indigo-200">
            Open the quick rules reference →
          </Link>
        </p>
      </footer>
    </main>
  );
}
