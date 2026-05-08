"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useGame } from "@/lib/store";
import { localStorageAdapter } from "@/lib/store/persistence/localStorage";
import type { GameState } from "@/lib/types/game";

function decodePayload(hash: string): GameState {
  const trimmed = hash.replace(/^#/, "");
  if (!trimmed) throw new Error("No save data in URL.");
  // Decode base64 → URL-encoded UTF-8 → string
  const binary = atob(trimmed);
  const json = decodeURIComponent(escape(binary));
  const state = JSON.parse(json) as GameState;
  if (!state?.meta?.id || !state?.classes) {
    throw new Error("This link doesn’t contain a valid Praxis save.");
  }
  return state;
}

export default function ImportPage() {
  const router = useRouter();
  const hydrate = useGame((s) => s.hydrate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const state = decodePayload(window.location.hash);
      void localStorageAdapter.save(state).then(() => {
        hydrate(state);
        router.replace(`/play/${state.meta.id}`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t parse share link.");
    }
  }, [hydrate, router]);

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="editorial-eyebrow">Importing a shared game</p>
      {error ? (
        <>
          <h1 className="editorial-h2">That link didn’t work.</h1>
          <p className="font-serif text-sm italic text-rose-300">{error}</p>
          <Link href="/" className="btn">
            Back to home
          </Link>
        </>
      ) : (
        <h1 className="editorial-h2">One moment…</h1>
      )}
    </main>
  );
}
