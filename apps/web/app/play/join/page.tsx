"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useGame } from "@/lib/store";

export default function JoinPage() {
  const router = useRouter();
  const joinRoom = useGame((s) => s.joinRoom);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function attempt() {
    setError(null);
    setBusy(true);
    try {
      await joinRoom(code);
      router.push("/play/room");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t join the room.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="mx-auto max-w-md px-6 py-16">
      <Link
        href="/"
        className="font-serif text-xs italic text-inkMute transition-colors hover:text-inkSoft"
      >
        ← Back to home
      </Link>

      <header className="mb-10 mt-6 border-b border-rule/40 pb-8">
        <p className="editorial-eyebrow">A friend has invited you</p>
        <h1 className="editorial-h2 mt-3">Join a party room</h1>
        <p className="mt-3 font-serif text-sm italic leading-relaxed text-inkMute">
          Enter the six-character code your host shared. You’ll see the game live as
          changes happen — only the host can edit values.
        </p>
      </header>

      <div className="space-y-5">
        <div>
          <p className="editorial-eyebrow mb-3">Room code</p>
          <input
            className="input text-center font-mono text-2xl uppercase tracking-[0.4em]"
            placeholder="ABC234"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && code.length === 6 && !busy) attempt();
            }}
            autoFocus
          />
        </div>

        {error ? (
          <p className="rounded-md border border-danger/30 bg-danger/20 px-4 py-3 font-serif text-sm italic text-danger">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="btn btn-primary w-full px-6 py-3 font-serif text-base"
          onClick={attempt}
          disabled={code.length !== 6 || busy}
        >
          {busy ? "Connecting…" : "Join room"}
        </button>

        <p className="text-center font-serif text-xs italic text-inkMute">
          Codes are six letters and digits — no zeroes, ones, I, L or O.
        </p>
      </div>
    </main>
  );
}
