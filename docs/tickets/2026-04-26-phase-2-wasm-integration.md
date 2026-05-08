# [Feature] Phase 2: Web app — WASM integration

## Context
The web app currently calls TypeScript game logic in `lib/game-rules/` and `lib/types/`. After Phase 1, all that logic lives in the Rust crate. This ticket wires the existing Next.js app to the WASM output — the UI components stay unchanged, only the data layer swaps underneath them.

## User story
As a developer, I want the web app to call the Rust core via WASM so that there is no TypeScript game logic left to maintain or diverge from the mobile app.

## Acceptance criteria
- [ ] The app loads and plays correctly — all existing features work identically to before this change
- [ ] `lib/game-rules/taxes.ts`, `lib/game-rules/vp.ts`, `lib/game-rules/endOfRound.ts` are deleted
- [ ] `lib/types/` directory is deleted — types come from the WASM-generated `.d.ts` only
- [ ] `lib/data/startingState.ts` is deleted — `create_starting_state` is called from WASM
- [ ] The Zustand store's `apply()` accepts a typed `Mutation` object (not a mutator function) and delegates to WASM `apply_mutation`
- [ ] `localStorage` persistence is unchanged — existing saved games still load correctly
- [ ] `cargo test` and existing Vitest tests both pass

## Tasks
- [ ] Add `packages/hegemony-wasm` as a dependency in `apps/web/package.json`
- [ ] Create `apps/web/lib/wasm.ts` — async WASM init wrapper (one-time init on app load)
- [ ] Update `apps/web/app/layout.tsx` to await WASM init before rendering
- [ ] Replace `lib/data/startingState.ts` usage in `SetupClient.tsx` with `create_starting_state` from WASM
- [ ] Rewrite Zustand `apply()`: accepts `Mutation` object, calls `apply_mutation(state, mutation)` from WASM, stores result
- [ ] Update all store call sites (components) to use the new typed `Mutation` objects instead of mutator lambdas
- [ ] Remove `lib/game-rules/` directory
- [ ] Remove `lib/types/` directory
- [ ] Update `lib/store/index.ts` types to reference wasm-generated types
- [ ] Update Vitest config to handle WASM imports (use `vite-plugin-wasm` or a mock)
- [ ] Run full manual test: new game → play all phases → end round wizard → undo → reload from localStorage

## Technical notes
- WASM must be initialized asynchronously before any function call — use a singleton promise pattern in `lib/wasm.ts`
- `serde-wasm-bindgen` passes `GameState` as a plain JS object across the WASM boundary — it remains JSON-serializable for localStorage
- The `apply()` mutation refactor changes the Zustand store's public API; all 12+ components that call `adjustClassNumber`, `setClassNumber`, etc. need updating to the new `Mutation` enum variants
- The history snapshot format in localStorage must remain compatible — `GameState` JSON shape from Rust must match the current TS shape exactly (verify field names match during Phase 1)
- `lib/store/persistence/` is untouched — `localStorageAdapter` continues to work as-is

## Metadata
- **Type**: Feature
- **Priority**: High
- **Effort**: L (1–2 days)
- **Blocked by**: Phase 1 (Rust core)
- **Blocks**: Phase 4 (web UI refresh — can only polish after the foundation is solid)
