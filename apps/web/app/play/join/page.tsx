"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { JoinCodeInput } from "@/components/party/JoinCodeInput";
import { useGame } from "@/lib/store";

function JoinPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const joinRoom = useGame((s) => s.joinRoom);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from /play/join#code=ABC234 (preferred — keeps code out of
  // Referer headers + access logs). Fall back to ?code=ABC234 for old
  // share URLs that haven't been refreshed yet.
  useEffect(() => {
    const hash = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const fromHash = hashParams.get("code");
    const fromQuery = params.get("code");
    const raw = fromHash ?? fromQuery;
    if (raw && raw.length > 0) {
      setCode(raw.toUpperCase().slice(0, 6));
    }
  }, [params]);

  async function attempt(submitted: string) {
    setError(null);
    setBusy(true);
    try {
      await joinRoom(submitted);
      router.push("/play/lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t join the room.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="mx-auto max-w-md px-5 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="inline-flex min-h-tap items-center font-serif text-fluid-sm italic text-inkMute transition-colors hover:text-inkSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ← Back to home
      </Link>

      <header className="mb-10 mt-6 border-b border-rule/40 pb-8">
        <p className="poster-eyebrow">A friend has invited you</p>
        <h1 className="poster-h2 mt-3">Join a party room</h1>
        <p className="mt-3 font-serif text-fluid-sm italic leading-relaxed text-inkMute">
          Enter the six-character code your host shared. You’ll see the game live as
          changes happen — only the host can edit values.
        </p>
      </header>

      <div className="space-y-5">
        <div>
          <p className="poster-eyebrow mb-3">Room code</p>
          <JoinCodeInput
            value={code}
            disabled={busy}
            onChange={setCode}
            onComplete={(c) => attempt(c)}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-sharp border border-danger/40 bg-danger/15 px-4 py-3 font-serif text-fluid-sm italic text-danger"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="btn btn-poster w-full px-6 py-3 font-display text-fluid-base"
          onClick={() => attempt(code)}
          disabled={code.length !== 6 || busy}
        >
          {busy ? "Connecting…" : "Join room"}
        </button>

        <p className="text-center font-serif text-fluid-xs italic text-inkMute">
          Codes are six letters and digits — no zeroes, ones, I, L or O.
        </p>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinPageInner />
    </Suspense>
  );
}
