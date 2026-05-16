// Shared helpers for snapshot-grid.mjs and axe-sweep.mjs.
// Conventions:
// - BASE_URL env (default http://localhost:3000) — caller must run `pnpm start`
//   or `pnpm dev` separately.
// - Fixture: visits /play/setup once, clicks "Start game", reads localStorage
//   so all subsequent snapshots have a real /play/[id] route plus persisted
//   defaults (theme override, onboarding-dismissed, etc).

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export const ROUTES = [
  { path: "/",                       label: "home",              needsState: false },
  { path: "/play/setup",             label: "play-setup",        needsState: false },
  { path: "/play/join",              label: "play-join",         needsState: false },
  { path: "/play/{id}",              label: "play-game",         needsState: true  },
  { path: "/rules-cheatsheet",       label: "rules-cheatsheet",  needsState: false },
  { path: "/tools/working-class",    label: "wc-companion",      needsState: false },
  { path: "/tools/middle-class",     label: "mc-companion",      needsState: false },
];

// /play/lobby + /play/room intentionally skipped — they require an active
// WebRTC party connection and bounce home otherwise. Snapshot manually if
// surfaces change there.

/**
 * Boot a context with onboarding dismissed and a forced theme. Returns the
 * configured context — caller closes it.
 */
export async function newContext(browser, { theme = "dark", fixture = null } = {}) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  await ctx.addInitScript(({ t, fix }) => {
    try {
      window.localStorage.setItem("praxis.onboarding.dismissed", String(Date.now()));
      window.localStorage.setItem("praxis.theme", t);
      if (fix) {
        for (const [k, v] of Object.entries(fix)) {
          window.localStorage.setItem(k, v);
        }
      }
    } catch {
      /* SSR-safe no-op */
    }
  }, { t: theme, fix: fixture?.storage ?? null });
  return ctx;
}

/**
 * Visit /play/setup, click "Start game", capture localStorage + the new game
 * id so /play/[id] can be snapshotted with real state. Run once per session.
 */
export async function captureFixture(browser) {
  const ctx = await newContext(browser, { theme: "dark" });
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/play/setup`, { waitUntil: "networkidle" });

  // Wait for WASM bootstrap; "Start game" stays disabled until classes hydrate
  // and `wasm()` throws if called before init resolves. Loop click + nav-wait up
  // to 10 attempts — if WASM isn't ready, click is a no-op and URL stays at
  // /play/setup.
  const startBtn = page.getByRole("button", { name: /start game/i });
  await startBtn.waitFor({ state: "visible", timeout: 15_000 });
  let id = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      await startBtn.click();
      await page.waitForURL(
        (url) => /\/play\/[A-Za-z0-9-]+$/.test(url.pathname) && !url.pathname.endsWith("/setup"),
        { timeout: 1_500 },
      );
      id = page.url().split("/").pop();
      break;
    } catch {
      await page.waitForTimeout(400);
    }
  }
  if (!id) {
    throw new Error("captureFixture: navigation to /play/<id> never happened — WASM may not have loaded");
  }
  const storage = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k != null) out[k] = window.localStorage.getItem(k) ?? "";
    }
    return out;
  });
  await ctx.close();
  return { id, storage };
}

/**
 * Apply a CSS-zoom factor to the document. Chromium supports the non-standard
 * `zoom` property and treats it like browser-level zoom for layout purposes,
 * which is the closest scriptable equivalent to user Ctrl+/-.
 */
export async function setZoom(page, zoom) {
  await page.evaluate((z) => {
    document.documentElement.style.zoom = String(z);
  }, zoom);
}

export function resolveRoutePath(route, fixture) {
  return route.path.replace("{id}", fixture?.id ?? "");
}
