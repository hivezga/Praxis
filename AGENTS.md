# Praxis — Agent Instructions

Companion tracker for *Hegemony: Lead Your Class to Victory*. Read
`CLAUDE.md` first for project context.

## Hard rules

- **Game logic lives in Rust only.** New rules go in `crates/hegemony-core`,
  not TypeScript. The TS layer is UI + transport only.
- **`apply_mutation` returns `Result`.** Never `unwrap()` it in production
  code paths; surface errors via Sentry / `WasmFallback` / toast.
- **No secrets in git.** `.env*` is ignored. Never commit `*.keystore`,
  `*.jks`, signing config, or anything in `apps/mobile/modules/*/android/build/`.
- **No background daemons.** State is `localStorage` (web) /
  AsyncStorage (mobile) only. There is no server.
- **Party mode is untrusted P2P.** Validate every inbound peer message
  through `isKnownMutationShape()` before WASM. Project state via
  `stateForPeer()` so future private fields don't leak.

## Build commands

| Task | Command |
|---|---|
| Rust tests | `cd crates/hegemony-core && cargo test` |
| Rust + Android target check | `cargo check --target aarch64-linux-android` |
| Rebuild WASM | `wasm-pack build crates/hegemony-core --target web --out-dir packages/hegemony-wasm` |
| Web typecheck | `pnpm --filter web typecheck` |
| Web tests | `pnpm --filter web test` |
| Web build | `pnpm --filter web build` |
| Mobile typecheck | `pnpm --filter praxis-mobile typecheck` |
| Mobile Rust .so | `bash apps/mobile/scripts/build-rust-android.sh` |

## Triggers

- After **adding/changing a Rust mutation or rule**: `cargo test` and
  `wasm-pack build` (committed artifacts in `packages/hegemony-wasm` are
  what Vercel ships).
- After **changing protocol in `packages/party`**: bump callers in
  `apps/web/lib/store/index.ts` and re-run `pnpm --filter web test`.
- Before **committing release-track mobile changes**: confirm the four
  `MYAPP_UPLOAD_*` env vars are wired (or EAS secrets exist) — release
  builds will hard-fail without them.

## Communication

User is not a developer. Explain technical decisions in plain language
before implementing. Don't introduce complexity beyond what the current
build step requires.
