"use client";

import Link from "next/link";

interface Props {
  error: Error;
  onRetry: () => void;
}

export function WasmFallback({ error, onRetry }: Props) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="wasm-fallback-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-bg/95 p-6 backdrop-blur"
    >
      <div className="max-w-md rounded-lg border border-danger/40 bg-bg-elev p-6 shadow-xl">
        <h2 id="wasm-fallback-title" className="font-display text-xl text-fg">
          Couldn&rsquo;t load the game engine
        </h2>
        <p className="mt-3 text-sm text-fg-muted">
          The Rust/WASM module failed to load. Without it the tracker
          can&rsquo;t apply mutations or compute scoring.
        </p>
        <pre className="mt-4 max-h-32 overflow-auto rounded bg-bg-sunken p-3 text-xs text-danger">
          {error.message}
        </pre>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn" onClick={onRetry}>
            Retry
          </button>
          <Link href="/play/import" className="btn">
            Export saved games
          </Link>
        </div>
      </div>
    </div>
  );
}
