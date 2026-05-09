"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useGame } from "@/lib/store";
import { localStorageAdapter } from "@/lib/store/persistence/localStorage";
import type { GameState } from "@/lib/types/game";
import { decode as decodeBase64Utf8 } from "@/lib/util/base64-utf8";

function decodePayload(hash: string): GameState {
  const trimmed = hash.replace(/^#/, "");
  if (!trimmed) throw new Error("No save data in URL.");
  const json = decodeBase64Utf8(trimmed);
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
    <main
      id="main"
      className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-5 text-center"
    >
      <p className="poster-eyebrow">Importing a shared game</p>
      {error ? (
        <>
          <h1 className="poster-h2">That link didn’t work.</h1>
          <p
            role="alert"
            className="font-serif text-fluid-sm italic text-danger"
          >
            {error}
          </p>
          <Link href="/" className="btn">
            Back to home
          </Link>
        </>
      ) : (
        <h1 className="poster-h2">One moment…</h1>
      )}
    </main>
  );
}
