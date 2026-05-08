import { Suspense } from "react";

import { SetupClient } from "./SetupClient";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Loading…</main>}>
      <SetupClient />
    </Suspense>
  );
}
