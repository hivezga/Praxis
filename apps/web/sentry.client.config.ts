import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const env = process.env.NEXT_PUBLIC_VERCEL_ENV;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: env ?? "development",
    // Capture preview deployments + production; suppress in local dev.
    enabled: env !== "development" && !!dsn,
    beforeSend(event) {
      // Defense in depth: never ship game-state snapshots or mutation
      // payloads to Sentry. The shapes can include nicknames + future
      // private data; nothing here is needed to reproduce a bug.
      if (event.extra) {
        delete (event.extra as Record<string, unknown>).state;
        delete (event.extra as Record<string, unknown>).payload;
      }
      if (event.contexts) {
        delete (event.contexts as Record<string, unknown>).state;
      }
      return event;
    },
  });
}
