# Praxis Audit Remediation Plan — 2026-05-09

Detailed phased plan to address all findings in `docs/AUDIT-2026-05-09.md`.
Phases ordered by **dependency + risk**, not by audit-table severity alone:
- Earlier phases unblock later ones (e.g. Rust panic-to-Result is a prerequisite for the WASM bootstrap fix).
- CVE-critical Next.js upgrade is fast-tracked because it changes lockfile shape; later phases assume the post-upgrade tree.
- Mobile work is grouped because the toolchain is half-broken until PostCSS lands.

Each step lists: **Files** • **Change** • **Validation** • **Why this step here**.

Branch strategy: one branch per phase. Land in order. Tag a `pre-audit-baseline` tag on `main` first.

---

## Phase 0 — Baseline + Safety Net (1 hour)

Goal: be able to revert. Lock down current state before any change.

### 0.1 Tag baseline
- **Files:** none
- **Change:** `git tag pre-audit-baseline-2026-05-09 && git push origin pre-audit-baseline-2026-05-09`
- **Validation:** `git tag -l "pre-audit*"` lists the tag.
- **Why:** every later phase needs a quick rollback target.

### 0.2 Commit `Cargo.lock`
- **Files:** `crates/hegemony-core/Cargo.lock` (new), `.gitignore` (verify it doesn't exclude Cargo.lock)
- **Change:** Generate via `cargo generate-lockfile` (already done in audit); commit it.
- **Validation:** `git ls-files crates/hegemony-core/Cargo.lock` shows the file.
- **Why:** reproducible builds + reproducible `cargo audit`. Rust crate produces `cdylib` consumed by mobile + WASM, so it behaves like a binary — lock is correct here.

### 0.3 Snapshot CI green-state
- **Files:** none
- **Change:** Note current passing CI run URL in PR description for Phase 0; capture timing baseline.
- **Validation:** screenshot/url archived.
- **Why:** later we'll add jobs; need to know which ones are new vs flaky.

---

## Phase A — Stop the Bleed (4–6 hours)

Game-breaking bugs + CVE-critical patches. Nothing else is safe to ship until this lands.

### A.1 Fix VP scoring compound bug — **C2**
- **File:** `crates/hegemony-core/src/rules/phases.rs:251-252`
- **Change:** `apply_scoring_phase` currently sets `working.vp = vp_for(...).total`, but `vp_for(...).total` already includes `working.vp` as the `base` field. Fix by computing the **delta**: `working.vp = working.vp.saturating_add(round_delta)` where `round_delta = vp_breakdown_excluding_base(...)`. Add a `vp_round_delta_for(class, state)` helper that returns only the round-incremental components (capital VP, prosperity VP, etc., **not** the running `base`).
- **Validation:**
  - Add a Rust unit test in `phases.rs::tests`: simulate 5 rounds with deterministic state, assert final VP totals match a hand-computed table from the rulebook.
  - Add a proptest: VP must be monotonically non-decreasing across `apply_scoring_phase` calls and must equal the sum of per-round deltas.
- **Why:** Without this fix, every game produces wrong totals from Round 2 — the entire app is unusable for actual scoring. This is the single highest-impact fix.

### A.2 Convert all `panic!()` in `apply_mutation` to `Result` — **C1**
- **Files:** `crates/hegemony-core/src/mutations.rs` (lines 59, 186-190, 213-214, 244-246, 258-260, 364-365, 378-380, 395-397, 456-458, 471-472, 583-584); `crates/hegemony-core/src/wasm.rs`; `crates/hegemony-core/src/jni_exports.rs`; `apps/web/lib/store/index.ts`; `apps/mobile/modules/hegemony/src/HegemonyModule.ts`.
- **Change:**
  - Make `apply_mutation` return `Result<GameState, MutationError>`. Define `MutationError` as `enum { InvalidClass(ClassId, &'static str), SerializationFailed(String), HistoryCorrupt(String), ... }` deriving `Serialize` + `Display`.
  - Replace every `panic!()` arm with `Err(MutationError::InvalidClass(...))`.
  - Replace `.expect("snapshot serialisation failed")` with `.map_err(MutationError::SerializationFailed)?`.
  - Replace undo's `.expect("undo: failed to deserialise prev_snapshot")` with proper error.
  - Update `apply_mutation_wasm` to return `Result<JsValue, JsValue>` — JS sees a thrown `Error` with the `MutationError` Display string instead of `RuntimeError: unreachable`.
  - Update `apply_mutation_jni` similarly (return error JSON or throw Java exception).
  - Update TS `commitMutation` in `lib/store/index.ts:131` to catch the thrown error, route to `ErrorBoundary` via `Sentry.captureException`, and surface a toast "Action rejected: {message}".
- **Validation:**
  - Existing Rust tests still pass.
  - New Rust test: `AdjustMoney { class: Capitalist, .. }` returns `Err(InvalidClass)`, does **not** panic.
  - New web test (Vitest): committing an invalid mutation triggers the error boundary fallback, not a blank screen.
- **Why:** Prerequisite for A.4 (WASM bootstrap surfacing failures cleanly). Without this, every recovery path the audit calls out is just papering over panics.

### A.3 Add `console_error_panic_hook`
- **File:** `crates/hegemony-core/Cargo.toml`, `crates/hegemony-core/src/wasm.rs`
- **Change:**
  - Add `[target.'cfg(target_arch = "wasm32")'.dependencies] console_error_panic_hook = "0.1"`.
  - In `wasm.rs::init()`, call `console_error_panic_hook::set_once()` as the first statement.
- **Validation:** Force a panic in a debug-only test mutation; confirm the browser DevTools console shows a Rust source location instead of `RuntimeError: unreachable`.
- **Why:** Even with A.2 done, future panics (e.g. arithmetic overflow in a new rule) need to be debuggable. Tiny dep, zero overhead in non-panicking paths.

### A.4 Surface WASM bootstrap failures
- **File:** `apps/web/app/_components/WasmBootstrap.tsx:8`, plus a new `apps/web/components/shared/WasmFallback.tsx`.
- **Change:** Replace `.catch(console.error)` with `.catch((err) => setBootstrapError(err))`. Render a top-level fallback with: error message, retry button, link to `/play/import` so the user can at least export their game from `localStorage`. Wire to Sentry in production.
- **Validation:** Force a 404 on the WASM chunk via DevTools network tab; user sees fallback, not silent panel cascade.
- **Why:** A.2 makes errors readable, but the bootstrap path runs **before** any component-level boundary. Has to be handled explicitly.

### A.5 Next.js 14.2.15 → 15.5.14+ — **CVE critical**
- **Files:** `apps/web/package.json` (next, eslint-config-next), `apps/web/next.config.mjs`, possibly `apps/web/app/sw.ts`, `apps/web/sentry.*.config.ts`, all server components in `apps/web/app/**`.
- **Change:**
  - Run `pnpm --filter web up next@^15 eslint-config-next@^15`.
  - Run the Next 15 codemods: `npx @next/codemod@latest upgrade`. Specific transforms expected: `next-async-request-api`, `next-og-import`, `metadata-to-viewport-export`, `app-dir-runtime-config-experimental-ppr`.
  - Manually review breaking changes:
    - `cookies()`, `headers()`, `params`, `searchParams` are now async — every server component and route handler that uses them must `await`.
    - `fetch` no longer caches by default — review every `fetch` call in server components, add `cache: 'force-cache'` where caching was intended.
    - `geo` and `ip` removed from `NextRequest` — not currently used (verify with grep).
    - React 19 is the recommended pair; React 18.3 still works on Next 15. **Stay on React 18 for now** to keep the testing-library + Sentry SDK matrix stable; revisit React 19 after Phase D.
  - Update `serwist`/`@serwist/next` if needed for Next 15 compat (check `serwist@^9.5.11` against current Next-15-compatible release).
  - Re-test PWA: install, offline, update flow.
- **Validation:**
  - `pnpm --filter web build` succeeds.
  - `pnpm --filter web typecheck` passes (will surface the async-API breaking changes loudly).
  - `pnpm audit --prod` reports zero `next` advisories.
  - Manual smoke: dev server, `/play`, `/play/lobby`, `/play/join?code=…`, `/play/import`, Sentry test event.
  - Snapshot regression: `pnpm --filter web snapshots` and visual diff vs the pre-upgrade artifacts in `.playwright-mcp/`.
- **Why:** This is the CVE-critical fix. Doing it in Phase A means later phases (party-mode hardening, store refactor) sit on the patched base, not on patched-twice churn. **Pin to exact `next@15.x.y`**, not `^15` — Next minor releases sometimes ship breaking type changes.

### A.6 Remove committed debug keystore + stale binaries — **C6**
- **Files:** `apps/mobile/android/app/debug.keystore` (delete), `apps/mobile/modules/hegemony/android/build/` (delete), `apps/mobile/modules/hegemony/android/src/main/jniLibs/*.so` (delete), new `apps/mobile/android/.gitignore` (add `*.keystore`, `*.jks`), new `apps/mobile/modules/hegemony/android/.gitignore` (add `build/`, `src/main/jniLibs/`).
- **Change:**
  - `git rm --cached apps/mobile/android/app/debug.keystore`.
  - `git rm -rf --cached apps/mobile/modules/hegemony/android/build/`.
  - `git rm --cached apps/mobile/modules/hegemony/android/src/main/jniLibs/*.so`.
  - Add ignore rules.
  - Document local regeneration: `keytool -genkey ...` for debug keystore (one-line in mobile README).
- **Validation:** `git ls-files | grep -E '\.(keystore|jks|so)$'` returns nothing. Fresh `pnpm --filter praxis-mobile run build:rust` produces fresh `.so` files.
- **Why:** Phase A landing zone. Doing it later means a release-track build could ship a debug-signed APK before we notice.

### A.7 Fix Android release signing — **C5**
- **File:** `apps/mobile/android/app/build.gradle:112`, `apps/mobile/eas.json` (env), local `apps/mobile/android/local.properties.example` (new).
- **Change:**
  - Add a `release` `signingConfig` block reading `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_KEY_ALIAS`, `MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_PASSWORD` env vars (Expo / RN convention).
  - In `buildTypes.release { signingConfig signingConfigs.release }`.
  - For EAS: configure `eas secret:create` for the four env vars; **do not commit secrets**.
  - Add `local.properties.example` documenting expected vars.
- **Validation:** A debug build still signs with debug keystore. A release build via `eas build --platform android --profile production` produces an AAB signed with the release key and passes `bundletool validate`.
- **Why:** Pairs with A.6. Keystore gone → must add the env-driven path before next mobile build attempt.

**Phase A exit criteria:**
- All Rust tests green incl. new VP-scoring test.
- `pnpm audit --prod`: zero critical, zero `next` advisories.
- Android debug build still works locally.
- Web app loads, can complete one full 5-round game with correct VP.

---

## Phase B — Party-Mode Hardening (3–4 hours)

WebRTC trust boundary fixes. Required before next public-facing party-mode demo.

### B.1 Faction-squat prevention — **C3**
- **File:** `apps/web/lib/store/index.ts:457-466`, plus `packages/party/src/types.ts` (add reject reason).
- **Change:**
  - On `select_faction` (host side): check `lobby.players.find(p => p.faction === faction && p.peerId !== peerId)`. If taken, send `select_faction_rejected` reply to the requesting peer with `reason: "taken"`.
  - On the peer (`packages/party/src/room-peer.ts`): handle `select_faction_rejected` by surfacing a toast and clearing the local pending faction selection.
  - Add a guard so the host's own faction is reserved at lobby init.
- **Validation:**
  - Unit test in `packages/party/__tests__/host.test.ts`: two peers send `select_faction` for same faction; second one receives rejection.
  - Manual: open two browser tabs, both pick Working Class, second tab sees rejection toast.
- **Why:** Clean fix needs no protocol break — adds one new message type. Do this before B.2 so the validator there can trust `peerFaction`.

### B.2 Payload size + rate limiting — **C4**
- **File:** `packages/party/src/room-host.ts:62-65`, new `packages/party/src/rate-limiter.ts`.
- **Change:**
  - Add `MAX_MESSAGE_BYTES = 32_768` (32 KB — generous for any real Mutation payload). Reject + log + close connection on exceed.
  - Add a token-bucket rate limiter per peer: `MAX_RATE = 20 msg/sec`, burst 40. Implement as `class RateLimiter { tryConsume(peerId): boolean }`.
  - Add `MAX_PEERS = 8` (M2). Reject inbound `connection` events when over cap.
  - Auto-close connection on 3 consecutive rate-limit hits.
- **Validation:**
  - Vitest: simulate 50 messages in 1 second from one peer; assert <= burst+rate are accepted.
  - Vitest: send a 64KB payload; assert connection closed.
- **Why:** Independent of B.1; can land in same PR if test surface allows.

### B.3 Validate inbound `mutation_request` shape — **H4**
- **Files:** `apps/web/lib/store/index.ts:467-478`, new `apps/web/lib/types/mutation-validator.ts` (or use `zod` if already present — currently not in deps; prefer hand-rolled to avoid 13KB dep for one validator).
- **Change:** Whitelist of known `Mutation.type` strings derived from the discriminated union in `apps/web/lib/types/mutations.ts`. On inbound peer mutation, validate `payload.mutation.type` is in the whitelist before forwarding to WASM. Reject + log if not.
- **Validation:** Vitest: inject `{ type: "DropTable" }` over the data channel; assert WASM never called and host emits `mutation_rejected`.
- **Why:** Even with A.2 (Rust returns Result for unknown variants), keeping bad input out of WASM cuts attack surface and avoids per-mutation Rust round-trips.

### B.4 Per-peer state projection — **H1**
- **Files:** `apps/web/lib/store/index.ts:136-137,483`, new `apps/web/lib/party/state-projection.ts`.
- **Change:**
  - Add `function stateForPeer(state: GameState, faction: ClassId | null): GameState` that strips fields tagged private — currently no private fields exist, so this is **scaffolding** that returns a clone unchanged but is the only place adding private fields to `GameState` is safe.
  - Replace `hostInstance.broadcastState(next)` with per-peer `host.send(peerId, "state", stateForPeer(next, lobby.faction(peerId)))`.
  - Document in the file header that any new private field on `GameState` must be redacted in `stateForPeer`.
- **Validation:** No behaviour change today (no private fields exist). Add a test that asserts a `_test_only_private` field is stripped when added; pin to ensure the projection is wired.
- **Why:** Cheap to add now; impossible to retrofit safely after the first private-field is shipped (legacy clients would already have it).

### B.5 Room-code modulo bias fix — **H2**
- **File:** `packages/party/src/room-code.ts:13-15`
- **Change:** Replace `buf[i] % ALPHABET.length` with rejection sampling: regenerate any byte ≥ `Math.floor(256 / ALPHABET.length) * ALPHABET.length` (i.e. ≥ 248 for 31-char alphabet).
- **Validation:** Statistical test: generate 100k codes, assert each char's frequency is within ±0.5% of 1/31.
- **Why:** Trivial change; do alongside B.2 in same `packages/party` PR.

### B.6 Verify host identity on data-channel messages — **H3**
- **File:** `packages/party/src/room-peer.ts:81-88`, `packages/party/src/types.ts`.
- **Change:** When the peer joins, record the host's PeerJS ID from the initial `LobbySnapshot` payload. On `host_leaving` or any control message, verify `conn.peer === knownHostId`. Log + ignore otherwise.
- **Validation:** Vitest: simulate a non-host peer sending `host_leaving`; assert peer's lobby state unchanged.
- **Why:** Same file as B.5; bundle.

### B.7 Move room code to URL fragment — **M1**
- **File:** `apps/web/app/play/lobby/page.tsx:46-49`, `apps/web/app/play/join/page.tsx`.
- **Change:** Switch share URL from `/play/join?code=ABCDEF` to `/play/join#code=ABCDEF`. Update join page to read `window.location.hash` (client-only). Provide redirect from old `?code=` form for one release for backward compat.
- **Validation:** Manual: share link, paste in browser, code prefilled. Network tab: outbound requests from `/play/join` page do not contain code in Referer header.
- **Why:** Pure client-side change; no protocol impact.

### B.8 Block lobby messages after game start — **M3**
- **File:** `apps/web/lib/store/index.ts:457-463`
- **Change:** Gate `hello` and `select_faction` handlers on `!get().party.gameStarted`. Return `lobby_locked` reply.
- **Why:** One-liner. Pairs with B.1.

### B.9 Hide debug page in production — **M4**
- **File:** `apps/web/app/party-test/page.tsx`
- **Change:** Top of file: `import { notFound } from "next/navigation"; if (process.env.NODE_ENV === "production") notFound();`. Better: move under `app/(dev)/party-test/page.tsx` and gate the entire `(dev)` segment with a layout that calls `notFound()` in prod.
- **Validation:** `pnpm --filter web build` + `next start`; visit `/party-test` → 404. Dev mode still works.
- **Why:** Trivial; ship with B.7.

**Phase B exit criteria:**
- Two browser tabs cannot both claim same faction.
- Flooding host with messages doesn't freeze tab.
- Unknown mutation types are rejected before WASM.
- `/party-test` returns 404 in production build.

---

## Phase C — Mobile Rehab Unblock (2–3 hours)

Goal: get JS bundle building again so Phase 5 can resume.

### C.1 Add PostCSS config for NativeWind — **HIGH (root cause of Phase 5 stall)**
- **Files:** new `apps/mobile/postcss.config.js`, `apps/mobile/package.json` (add `autoprefixer`).
- **Change:**
  ```js
  // apps/mobile/postcss.config.js
  module.exports = {
    plugins: { tailwindcss: {}, autoprefixer: {} },
  };
  ```
  Add `autoprefixer: "^10.4"` to devDeps.
- **Validation:** `pnpm --filter praxis-mobile start` — Metro bundles without the nativewind error.
- **Why:** Phase 5 cannot proceed until this lands. Per audit, this is the *direct cause* of the bundle failure documented in `project_phase5_mobile_status.md`.

### C.2 Add `apps/mobile/modules/*` to workspace
- **File:** `pnpm-workspace.yaml`
- **Change:** Add line `- 'apps/mobile/modules/*'` so `praxis-hegemony-module` is symlinked in CI.
- **Validation:** `pnpm install --frozen-lockfile` from a clean checkout works; `apps/mobile/node_modules/praxis-hegemony-module` is a symlink.
- **Why:** Required before C.3 and before mobile CI in Phase D.

### C.3 Drop unneeded Android permissions
- **File:** `apps/mobile/android/app/src/main/AndroidManifest.xml:5-6`
- **Change:** Remove `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`.
- **Validation:** Android Lint (`./gradlew lint`) clean. App still runs (it doesn't read files).
- **Why:** Android 13+ rejects these. Trivial fix.

### C.4 Add `cargo-ndk` install guard to local script
- **File:** `apps/mobile/scripts/build-rust-android.sh`
- **Change:** Mirror the guard from `eas-build-rust.sh`:
  ```bash
  command -v cargo-ndk >/dev/null 2>&1 || { echo "cargo-ndk required: cargo install cargo-ndk"; exit 1; }
  ```
- **Why:** Better DX on fresh machines.

### C.5 Fix `eas.json` cache path
- **File:** `apps/mobile/eas.json`
- **Change:** Remove the `../../crates/hegemony-core/target` cache entry. Keep `~/.cargo/registry` and `~/.cargo/git`.
- **Validation:** Next EAS build runs without cache-path warning.
- **Why:** EAS clones into a temp dir; relative `..` traversal isn't reliable.

**Phase C exit criteria:**
- Local Metro bundles without error.
- Local Gradle build → installable APK on device/emulator.
- App launches past splash screen (which was the Phase 5 last-known failure point).

---

## Phase D — Web App Cleanup (4–5 hours)

Quality + correctness fixes for the now-stable Next 15 web app.

### D.1 Move `passBill` rule into Rust — **#1 project sin**
- **Files:** `apps/web/lib/store/index.ts:300-309` (remove TS rule), `crates/hegemony-core/src/mutations.rs` (add `Mutation::PassBill { class, bill_id }` variant), `crates/hegemony-core/src/rules/policy.rs` or similar (add `pass_bill` rule that performs the bill pass + applies +3 VP atomically).
- **Change:** TS calls `applyMutation({ type: "PassBill", class, bill_id })` only. Rust performs the three sub-mutations atomically. Update `apps/web/lib/types/mutations.ts` discriminated union.
- **Validation:** Existing UI tests for "Pass" button still pass. New Rust test: PassBill produces correct VP delta.
- **Why:** CLAUDE.md explicitly forbids TS-side game logic; this is the most flagrant case.

### D.2 Rename `error.tsx` → `global-error.tsx`
- **File:** `apps/web/app/error.tsx` → `apps/web/app/global-error.tsx`
- **Change:** Rename. Add `<html><body>` since global-error bypasses root layout. Verify import paths still resolve.
- **Validation:** Manual: `throw new Error()` from `app/page.tsx` server component; verify the global error UI renders fully (not blank).
- **Why:** Pairs cleanly with A.4 (WASM bootstrap surfacing). Both involve top-level error UX.

### D.3 Fix base64 round-trip for share/import — **HIGH**
- **Files:** `apps/web/app/play/import/page.tsx:17`, `apps/web/app/_components/SavedGamesList.tsx:36`. Extract a shared util `apps/web/lib/util/base64-utf8.ts`.
- **Change:**
  ```ts
  // base64-utf8.ts
  export function encode(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }
  export function decode(b64: string): string {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  ```
  Replace deprecated `escape`/`unescape` in both call sites.
- **Validation:** Vitest: round-trip a string with `🎲`, `é`, `中`, an apostrophe, and a newline. Assert exact equality.
- **Why:** Save-share is a real user-facing path; current code corrupts non-ASCII silently.

### D.4 Validate WASM return shape
- **File:** `apps/web/lib/store/index.ts:131`
- **Change:** Add a `assertGameState(value: unknown): asserts value is GameState` helper that checks `value?.meta?.id`, `value?.classes?.working`, etc. Throw `Error("WASM returned invalid state")` on mismatch.
- **Validation:** Vitest: pass a malformed payload through the helper; assert throws.
- **Why:** Defense in depth; pairs with A.2's error surfacing.

### D.5 Stabilize `Modal` `onClose` effect
- **File:** `apps/web/components/shared/Modal.tsx:21-56`
- **Change:** Capture `onClose` in a `useRef` updated each render; effect references the ref, not the prop directly. Remove `onClose` from effect deps.
- **Validation:** React Testing Library: spy on focus management; assert focus is set once on mount, not on every parent re-render.
- **Why:** Quietly causes focus jumps; fix is mechanical.

### D.6 Make party state selector reactive
- **File:** `apps/web/lib/store/index.ts:685`
- **Change:** Add `hostPeerId: string | null` to the Zustand `party` slice. Set it in `startHosting` / clear in `stopHosting`. Selector reads from Zustand state, not module-level vars.
- **Validation:** Component re-renders on host start/stop without manual refresh.

### D.7 Memoize `compute_vp_wasm` per panel
- **File:** `apps/web/components/classes/ClassPanelShell.tsx:63`
- **Change:** Wrap in `useMemo([state, classId])`.
- **Validation:** React DevTools profiler: 4 panels, single state mutation → 4 VP calls, not 16.

### D.8 Sentry config polish — **M**
- **File:** `apps/web/sentry.client.config.ts`
- **Change:**
  - `enabled: process.env.NEXT_PUBLIC_VERCEL_ENV !== "development" && !!dsn` (capture preview deployments).
  - Add `beforeSend` hook stripping `event.extra.state`, `event.extra.payload`, `event.contexts.state` (defense vs L1).
- **Validation:** Trigger a test exception in a preview deployment; appears in Sentry. Trigger a state-related error; assert no `state` field in the captured event.

### D.9 PWA cache invalidation for WASM
- **File:** `apps/web/app/sw.ts`, `apps/web/next.config.mjs`
- **Change:** Verify `hegemony_core_bg.wasm` filename includes a content hash. If not, add a custom Serwist runtime cache rule for `*.wasm` URLs using `StaleWhileRevalidate` with a versioned cache name (`wasm-v${BUILD_ID}`).
- **Validation:** Deploy to preview, force a WASM rebuild, refresh — new WASM is fetched within one navigation cycle, not stuck on old cache.

### D.10 Remaining MEDIUMs
Bundle into one mechanical-cleanup PR:
- `EndRoundWizard.tsx:20-22` — guard `wasm()` call inside `useMemo` with init check.
- `lib/store/index.ts:325-333` — drop TS-side bounds clamping; let Rust enforce.
- `app/manifest.ts:22-26` — audit `apple-icon` for safe-zone padding.
- `components/shared/HideCurtain.tsx:17` — add comment that it is not a security boundary.
- `app/play/[gameId]/page.tsx:47-51` — narrow effect deps to `[params.gameId, load]`.

**Phase D exit criteria:**
- All web HIGHs and MEDIUMs from audit closed.
- `pnpm --filter web typecheck` + `pnpm --filter web test` + `pnpm --filter web axe` all green.

---

## Phase E — CI + Toolchain (2–3 hours)

CI is currently a no-op for mobile and Android-target Rust. Fix that.

### E.1 Add mobile typecheck job
- **File:** `.github/workflows/ci.yml`
- **Change:** New job `mobile-typecheck`: checkout → install pnpm → `pnpm install --frozen-lockfile` → `pnpm --filter praxis-mobile typecheck`.
- **Validation:** Push a TS error in `apps/mobile/app`; CI fails.

### E.2 Add Android-target Rust check
- **File:** `.github/workflows/ci.yml`
- **Change:** New job `cargo-check-android`: install `aarch64-linux-android` rustup target → `cargo check --target aarch64-linux-android --manifest-path crates/hegemony-core/Cargo.toml`. NDK install via `nttld/setup-ndk@v1` (current best practice for GitHub Actions).
- **Validation:** Push a JNI signature drift; CI fails.

### E.3 Build WASM in CI; verify checked-in artifact matches
- **File:** `.github/workflows/ci.yml`, `packages/hegemony-wasm/.gitignore` (decision required).
- **Two options:**
  - **Option A (recommended):** Stop committing WASM artifacts. Add a `wasm-build` job that runs `wasm-pack build crates/hegemony-core --target web --out-dir packages/hegemony-wasm`. Web deploy depends on this artifact (upload + download). `packages/hegemony-wasm/.gitignore` ignores `*.wasm`, `*.js`, `*.d.ts`.
  - **Option B:** Keep checked-in artifacts, add a CI check that rebuilds and `git diff --exit-code` fails if drifted.
- **Recommendation:** Option A. Smaller repo, clean source-of-truth, no chance of drift. Vercel build already runs Node tooling — adding `wasm-pack` is one more step.
- **Validation:** Edit a Rust file, push without re-running wasm-pack locally; CI rebuilds and the deploy succeeds.

### E.4 Add `cargo audit` + `pnpm audit` to CI
- **File:** `.github/workflows/ci.yml`
- **Change:** New job `security-audit`: `cargo audit` and `pnpm audit --prod --audit-level=high`. Run nightly (cron) and on PRs that touch lockfiles. Soft-fail on PRs (annotation only); hard-fail on nightly to alert on new CVEs.
- **Validation:** Manually inject a known-bad pin; CI flags it.

### E.5 Lock Node version
- **Files:** new `.nvmrc` at repo root, `apps/web/package.json` (`"engines": { "node": ">=20 <23" }`).
- **Change:** Pin to Node 20 LTS. Set CI to read `.nvmrc`.
- **Validation:** CI uses Node 20. Local `nvm use` picks it up.

### E.6 CI path filters
- **File:** `.github/workflows/ci.yml`
- **Change:** Use `paths` / `paths-ignore` so doc-only PRs skip Rust + Next builds.
- **Validation:** Push a README-only change; only doc lint runs.

**Phase E exit criteria:**
- CI runs on PRs in roughly the same wall time as today, but exercises mobile + Android-target Rust + audits.
- Future JNI drift caught in PR.

---

## Phase F — Hygiene + Docs (1–2 hours)

LOWs and stale docs. Land last because they touch many files but no behavior.

### F.1 Rust hygiene
- `cards/data.rs:110-120` — remove dead `P_FOOD_*` statics or wire to actual cards.
- `Cargo.toml:25` — pin `proptest = "1.4"`.
- `crates/hegemony-core/tests/proptest_tests.rs:131-163` — add `prop_oneof!` strategy covering all `Mutation` variants.
- `rules/mod.rs:8-13` — remove blanket `pub use *`; export only what crosses module boundaries.
- Extract shared `now_ms()` to `crate::time`.
- `Cargo.toml:7` — leave `cdylib` for now (changing requires build.rs gymnastics; cost > benefit at current build times).
- `packages/hegemony-wasm/hegemony_core.d.ts` — add `typescript_custom_section` in `wasm.rs` so generated `.d.ts` types `GameState`/`Mutation` properly. (Or post-process the `.d.ts` in the Phase E.3 CI build step.)

### F.2 Web hygiene
- `app/_components/OnboardingModal.tsx:55-63` — use `role="group"` not `role="tablist"` for non-interactive step indicator.
- `lib/types/game.ts` — consolidate `VpBreakdown` interface; delete duplicates.
- `SavedGamesList.tsx:55` — drop redundant regex `i` flag.
- `app/play/room/page.tsx:111-121` — `React.memo` the `PeerObserverBanner`.
- Audit ESLint v8 → v9 flat-config migration. **Defer to a separate effort** if the eslint-config-next maintainers haven't shipped flat-config support cleanly yet.

### F.3 Docs sync
- `README.md` — full rewrite reflecting pnpm + monorepo + Rust + WASM + Expo.
- `CLAUDE.md` — update Step 2 to "complete (web)"; add Step 2.5 "mobile rehab"; update key domain files now that `apps/mobile/lib` exists.
- `AGENTS.md` — replace Vercel-only boilerplate with Praxis-specific agent instructions (build commands, WASM rebuild trigger, mobile prereqs).

### F.4 .gitignore belt-and-suspenders
- `apps/web/.gitignore` — add `.env*` plus `!.env.example`.
- Update `.gitignore` at repo root to exclude `.playwright-mcp/` if it's runtime-generated (currently untracked but visible in `git status`).

### F.5 Memory updates
After each phase lands, update the auto-memory:
- `project_phase5_mobile_status.md` — flip to "unblocked" once Phase C lands.
- `project_phase_6_9_web_status.md` — update once Phase B + Phase D land.
- New memory: `project_audit_2026_05_09.md` pointing to `docs/AUDIT-2026-05-09.md` and this plan.

---

## Total estimate

| Phase | Effort | Risk if skipped |
|---|---|---|
| 0 | 1h | Hard to roll back later |
| A | 4–6h | Game broken (C2), CVE critical, no debug-able errors |
| B | 3–4h | Party mode unsafe for public |
| C | 2–3h | Mobile build still red |
| D | 4–5h | Quality drift continues |
| E | 2–3h | Future regressions ship silently |
| F | 1–2h | Docs stay stale |
| **Total** | **17–24h** | |

## Sequencing rules

- **Don't reorder A.5 (Next 15) earlier than A.1/A.2.** The Rust changes are mechanical; the Next 15 upgrade is the bigger churn — landing scoring fixes first means we ship correct VP even if Next upgrade gets stuck.
- **B before D.** Party-mode trust fixes touch `lib/store/index.ts` heavily; D's store cleanup conflicts unless B lands first.
- **C in parallel with B** is fine — different files entirely.
- **E.3 (WASM in CI) only after Phase D ships once.** First we must trust the current artifact path; then we can move artifacts to CI and gitignore them.

## Out of scope for this plan

- React 19 upgrade — defer until after F.
- ESLint 9 flat config — defer.
- License + compliance review.
- Performance profiling.
- Replacing PeerJS public broker (architectural; not in current Phase 6 scope).
- Adding auth or any real backend — explicitly forbidden by project goals.
