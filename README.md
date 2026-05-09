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
  connect P2P. Defaults to the public PeerJS broker + Open Relay free
  TURN; both env-swappable for self-hosting (see *Party-mode env vars*
  below). Vercel only serves the static SPA — peer connections never
  touch Vercel and `vercel logs` will not show peer-side failures.
- **Monorepo** — pnpm workspaces. Root `package.json` declares
  `packageManager: pnpm@10.33.0` (Corepack-hydrated in CI) and
  `pnpm.overrides` pinning patched `@xmldom/xmldom` and `tar` for the
  Expo dep chain.

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

Prereqs: Node 20–22 (`.nvmrc` pins exact version), pnpm 10, Rust stable,
`wasm-pack 0.13.1` (CI pins this; bumps must update both `.cargo/config.toml`
and `.github/workflows/ci.yml::WASM_PACK_VERSION`).

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

## Party-mode env vars

All optional, all `NEXT_PUBLIC_*` (client-side). Without any of these,
Praxis uses the public PeerJS broker + Open Relay free TURN.

| Variable | Default | Effect |
|---|---|---|
| `NEXT_PUBLIC_PEERJS_HOST` | `0.peerjs.com` | Self-hosted PeerJS broker hostname |
| `NEXT_PUBLIC_PEERJS_PORT` | (broker default) | Broker port |
| `NEXT_PUBLIC_PEERJS_PATH` | `/` | Broker path prefix |
| `NEXT_PUBLIC_PEERJS_SECURE` | (broker default) | `true`/`false` for HTTPS broker |
| `NEXT_PUBLIC_TURN_URL` | Open Relay TURN | Override TURN URL (paid Twilio/Metered) |
| `NEXT_PUBLIC_TURN_USERNAME` | `openrelayproject` | TURN auth user |
| `NEXT_PUBLIC_TURN_PASSWORD` | `openrelayproject` | TURN credential |

Long-term reliability requires a self-hosted broker + paid TURN — the
public broker throttles and Open Relay is best-effort. See
`packages/party/src/peer-options.ts` for the merge logic.

## Important: rebuild WASM after Rust changes

Edits to `crates/hegemony-core/src/` only ship to the browser when you
rebuild the wasm bundle and commit it:

```bash
wasm-pack build crates/hegemony-core --target web --out-dir packages/hegemony-wasm
git add packages/hegemony-wasm
```

CI enforces this: the `WASM — wasm-pack build + freshness check` job
extracts every `Mutation` enum variant from `mutations.rs` and verifies
each appears as a literal discriminator string in the committed
`hegemony_core_bg.wasm`. Missing strings ⇒ stale wasm ⇒ CI fails with
a rebuild instruction.

## Rulebooks

The rulebook PDFs are bundled in `docs/` for convenience — see
`docs/README.md` for sources and versions.
