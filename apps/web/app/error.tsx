"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="editorial-eyebrow">An unexpected error</p>
      <h1 className="editorial-h2 mt-3">Something didn’t go to plan.</h1>
      <p className="mt-4 font-serif text-sm italic leading-relaxed text-slate-400">
        Praxis hit an error rendering this page. Your saved games are stored locally and
        should be untouched.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[10px] text-slate-600">digest: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn">
          Back to home
        </Link>
      </div>
    </main>
  );
}
