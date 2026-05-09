"use client";

import * as Sentry from "@sentry/nextjs";
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
    Sentry.captureException(error);
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  // global-error bypasses the root layout, so we must render our own
  // <html> and <body>. Keep this minimal — it must not depend on any
  // provider, font, or stylesheet that lives in the root layout, since
  // those may have been the cause of the crash.
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <main
          id="main"
          style={{
            margin: "0 auto",
            display: "flex",
            minHeight: "100vh",
            maxWidth: "32rem",
            flexDirection: "column",
            justifyContent: "center",
            padding: "4rem 1.5rem",
          }}
        >
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            An unexpected error
          </p>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.75rem" }}>
            Something didn&rsquo;t go to plan.
          </h1>
          <p style={{ marginTop: "1rem", fontStyle: "italic", lineHeight: 1.6 }}>
            Praxis hit an error rendering this page. Your saved games are stored locally
            and should be untouched.
          </p>
          {error.digest ? (
            <p style={{ marginTop: "0.75rem", fontFamily: "ui-monospace, monospace", fontSize: "0.7rem" }}>
              digest: {error.digest}
            </p>
          ) : null}
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{ padding: "0.5rem 1rem", border: "1px solid currentColor", background: "transparent", cursor: "pointer" }}
            >
              Try again
            </button>
            <Link href="/" style={{ padding: "0.5rem 1rem", border: "1px solid currentColor", textDecoration: "none", color: "inherit" }}>
              Back to home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
