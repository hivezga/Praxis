# Praxis — Claude Code Context

Companion tracker for **Hegemony: Lead Your Class to Victory** (base game + Crisis & Control expansion). Eliminates arithmetic at the table by tracking resources, taxes, VP, policies, and end-of-round calculations for all four factions.

## Project status

Currently in **Step 2: UI redesign**. Rust core and WASM integration are complete. Now designing and implementing polished UI directly in code (Phase 3 Claude Design spike is skipped — design and implementation are combined).

## Build sequence

| Step | Tool | Work |
|---|---|---|
| 1 ✅ | Claude Code | Migrate game logic to `hegemony-core` Rust crate + WASM integration |
| 2 (current) | Claude Code + frontend-design | Design and implement polished UI directly into Next.js (web) + Expo (mobile) |
| 3 | Claude Code | WebRTC party mode, AdMob, one-time IAP |

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
- **Party mode**: WebRTC via PeerJS — host generates room code, P2P, no server
- **Monetization**: Google AdMob (free tier) + one-time IAP to remove ads
- **Monorepo**: pnpm workspaces

## Key domain files (current codebase)

All game logic now lives in Rust. TypeScript files are UI-only:

- `apps/web/lib/types/game.ts` — TypeScript mirror of Rust GameState (for type safety in TS)
- `apps/web/lib/types/mutations.ts` — TypeScript discriminated union mirroring Rust Mutation enum
- `apps/web/lib/store/index.ts` — Zustand store; all mutations delegate to `wasm().apply_mutation_wasm()`
- `apps/web/lib/wasm.ts` — WASM bootstrap and accessor
- `crates/hegemony-core/src/` — All game rules live here (Rust)

## Game domain summary

**Four factions**: Working Class, Middle Class, Capitalist Class, State

**7 policy tracks** (A/B/C): Fiscal Policy, Labor Market, Taxation, Health & Benefits, Education Welfare, Foreign Trade, Immigration

**Game flow**: 5 rounds × 5 phases (Preparation → Action → Production → Elections → Scoring)

**Party mode**: One device per player, host creates room, others join via 6-character code. Players can see each other's public resources in real time.

**Solo mode**: Single device, one player tracks all factions (or their own faction only).

## Communication

User is not a developer. Explain technical decisions in plain language before implementing. Never introduce complexity beyond what the current build step requires.
