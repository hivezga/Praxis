# Praxis

A companion tracker for the tabletop game *Hegemony: Lead Your Class to
Victory* (base game + *Crisis & Control* expansion). Tracks resources,
taxes, payments, population, prosperity, legitimacy, policies, bills and
VP — so you spend the evening playing instead of doing arithmetic.

> Praxis is an unofficial fan project. *Hegemony* is © Hegemonic Project Games.

## Features

- **Party mode** — each player on their own device, joined via a 6-char
  room code over WebRTC (PeerJS). No accounts, no server-side state.
- **Solo mode** — single device, one player tracks all four factions
  (or only their own).
- **Assisted bookkeeping** — at end-of-round, the app suggests taxes,
  wages, welfare costs, and prosperity gains; the table confirms or
  overrides before applying.
- **Live VP totals** for all classes.
- **PWA** — installable, works offline.

## Tech stack

- **Game logic** — Rust crate (`crates/hegemony-core`). Single source of
  truth for every rule. Never duplicate rules in TypeScript.
- **Web** — Next.js 15 (App Router) · TypeScript · Tailwind · Zustand
  (UI state only). Game logic crosses to the browser via `wasm-pack`.
- **Mobile** — Expo (bare workflow), React Native. Game logic crosses
  via UniFFI / JNI.
- **Party mode** — WebRTC via PeerJS. Host generates room code, peers
  connect P2P over the public PeerJS broker.
- **Monorepo** — pnpm workspaces.

## Layout

```
crates/
  hegemony-core/     Rust: types, rules engine, mutations
packages/
  hegemony-wasm/     wasm-pack output, consumed by web
  party/             WebRTC transport (host + peer + room codes)
apps/
  web/               Next.js app
  mobile/            Expo app (Android first; iOS not yet active)
.github/workflows/   CI: rust, android-target, wasm, web, mobile, audit
```

## Running locally

Prereqs: Node 20 (`.nvmrc`), pnpm 10, Rust stable, `wasm-pack`.

```bash
pnpm install                                  # workspace bootstrap

# Rust core
cd crates/hegemony-core
cargo test                                    # 100+ unit + property tests

# Web
cd ../..
wasm-pack build crates/hegemony-core --target web --out-dir packages/hegemony-wasm
pnpm --filter web dev                         # http://localhost:3000
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build

# Mobile (Android — see apps/mobile/README for prereqs)
pnpm --filter praxis-mobile typecheck
bash apps/mobile/scripts/build-rust-android.sh
pnpm --filter praxis-mobile start
```

## Rulebooks

The rulebook PDFs are bundled in `docs/` for convenience — see
`docs/README.md` for sources and versions.
