# Praxis — Claude Code Context

Companion tracker for **Hegemony: Lead Your Class to Victory** (base game + Crisis & Control expansion). Eliminates arithmetic at the table by tracking resources, taxes, VP, policies, and end-of-round calculations for all four factions.

## Project status

Web complete through party mode + launch polish (Phases 1–9). Mobile (Expo)
rehab finished the audit-2026-05-09 unblock pass: PostCSS wired, workspace
includes the native module, release signing config switched off the debug
keystore. Mobile bundle and on-device verification still pending — see
`memory/project_phase5_mobile_status.md`.

The audit remediation plan (`docs/AUDIT-PLAN-2026-05-09.md`) landed in full:
VP scoring fix, Rust panic→Result, Next.js 15 upgrade, party-mode hardening,
`passBill` moved into Rust, base64-utf8 share-link util, CI for host +
Android-target Rust + WASM + web + mobile + dep audits.

**Post-audit work (2026-05-09 afternoon)** — see
`memory/project_post_audit_2026_05_09.md` for the full rundown:
8 rulebook conformance fixes (`crates/hegemony-core`), party-mode
ownership-lock toast + foreign-panel dim, ICE/TURN config + clearer
PeerJS errors + env-swappable broker, semantic WASM-freshness CI check,
pnpm overrides for the Expo dep CVEs, `packageManager` field for CI
pnpm hydration, `rename_all_fields = "camelCase"` on the Mutation enum
(serde silent-failure that broke every `class_id`/`policy_id` mutation
since project start — caught only via Playwright e2e on prod).

## Build sequence

| Step | Tool | Work |
|---|---|---|
| 1 ✅ | Claude Code | Migrate game logic to `hegemony-core` Rust crate + WASM integration |
| 2 ✅ (web) | Claude Code + frontend-design | Polished UI in Next.js |
| 2.5 (mobile, in progress) | Claude Code | Expo rehab — bundle, on-device verify, release signing |
| 3 | Claude Code | AdMob, one-time IAP |

## Architecture

```
/
├── crates/
│   └── hegemony-core/     # Rust: types, rules engine, state mutations
├── packages/
│   └── hegemony-wasm/     # wasm-pack output → consumed by web app
├── apps/
│   ├── web/               # Next.js (evolved from current root)
│   └── mobile/            # Expo React Native (bare workflow, EAS Build)
└── pnpm-workspace.yaml
```

**Game logic lives in Rust only.** Never duplicate rules in TypeScript.

## Tech stack

- **Game logic**: Rust (`hegemony-core` crate)
- **Web bindings**: `wasm-pack` + `wasm-bindgen`
- **Android bindings**: UniFFI → Kotlin → Expo native module
- **Web app**: Next.js, Tailwind CSS, Zustand (UI state only)
- **Android app**: Expo React Native, bare workflow, EAS Build → Play Store
- **Party mode**: WebRTC via PeerJS — host generates room code, P2P, no
  server-side state. **Vercel only serves the static SPA.** Peer
  connections never touch Vercel; `vercel logs` will only ever show
  build logs and SSR for the few dynamic routes (`/play/[gameId]`,
  `/play/setup`, `/opengraph-image`). Don't go looking in Vercel logs
  for "connection rejected" — those failures live in the browser.
  Signaling defaults to the public PeerJS broker (`0.peerjs.com`) +
  Open Relay free TURN; both are env-swappable
  (`NEXT_PUBLIC_PEERJS_HOST/PORT/PATH/SECURE`,
  `NEXT_PUBLIC_TURN_URL/USERNAME/PASSWORD`) for self-hosting.
- **Monetization**: Google AdMob (free tier) + one-time IAP to remove ads
- **Monorepo**: pnpm workspaces

## Key domain files

All game logic lives in Rust. TS files are UI-only:

- `crates/hegemony-core/src/` — game rules (Rust). `mutations.rs` returns
  `Result<GameState, MutationError>`; `rules/phases.rs` per-round VP delta;
  `rules/vp.rs` includes `vp_round_delta_for`. `error.rs` defines the
  serde-friendly `MutationError` enum surfaced to JS.
- `packages/party/` — WebRTC transport. Host enforces `MAX_PEERS=8`,
  payload size cap (`MAX_MESSAGE_BYTES=32_768`), token-bucket rate limit
  (20 msg/sec, 40 burst). Peer pins host-id on first message.
  `peer-options.ts` builds the PeerJS config (broker host + ICE servers)
  consumed by both `RoomHost` and `RoomPeer` — change broker / TURN here.
- `apps/web/lib/types/game.ts` — TS mirror of Rust GameState.
- `apps/web/lib/types/mutations.ts` — discriminated union mirroring Rust
  `Mutation` enum (incl. `passBill`, `failBill`).
- `apps/web/lib/types/mutation-validator.ts` — host-side allow-list of
  known mutation `type` discriminators (defense before WASM).
- `apps/web/lib/store/index.ts` — Zustand store; mutations delegate to
  `wasm().apply_mutation_wasm()` and pass through `assertGameState()`.
  Party-mode ownership lock: when `party.localFaction` is set, mutations
  targeting other factions surface a transient `notice` toast instead of
  silent drop. `useIsClassLocked(classId)` drives the visual lock badge.
- `apps/web/lib/party/state-projection.ts` — host→peer state redaction
  seam. Today no fields are private; future hidden info redacts here.
- `apps/web/lib/util/base64-utf8.ts` — UTF-8-safe share-link encoder.
- `apps/web/lib/wasm.ts` — WASM bootstrap and accessor.
- `apps/web/app/_components/WasmBootstrap.tsx` — surfaces init failures
  via `WasmFallback` instead of swallowing them.
- `apps/web/app/global-error.tsx` — root-layout-bypass error page.
- `apps/mobile/modules/hegemony/` — Expo native module wrapping Rust
  via JNI (`crates/hegemony-core/src/jni_exports.rs`).

## Game domain summary

**Four factions**: Working Class, Middle Class, Capitalist Class, State

**7 policy tracks** (A/B/C): Fiscal Policy, Labor Market, Taxation, Health & Benefits, Education Welfare, Foreign Trade, Immigration

**Game flow**: 5 rounds × 5 phases (Preparation → Action → Production → Elections → Scoring)

**Party mode**: One device per player, host creates room, others join via 6-character code. Players can see each other's public resources in real time.

**Solo mode**: Single device, one player tracks all factions (or their own faction only).

## Communication

User is not a developer. Explain technical decisions in plain language before implementing. Never introduce complexity beyond what the current build step requires.
