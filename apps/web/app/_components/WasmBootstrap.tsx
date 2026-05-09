"use client";

import { useEffect, useState } from "react";
import { initWasm } from "@/lib/wasm";
import { WasmFallback } from "@/components/shared/WasmFallback";

export function WasmBootstrap() {
  const [error, setError] = useState<Error | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    initWasm()
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        if (typeof window !== "undefined") {
          const sentry = (
            window as unknown as { Sentry?: { captureException: (e: unknown) => void } }
          ).Sentry;
          sentry?.captureException(e);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  if (!error) return null;
  return <WasmFallback error={error} onRetry={() => setRetryToken((n) => n + 1)} />;
}
