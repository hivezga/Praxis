# [Feature] Phase 1: Rust core — `hegemony-core` crate

## Context
All game logic currently lives in TypeScript across `lib/types/`, `lib/game-rules/`, and `lib/data/`. Moving it to a Rust crate makes it the single source of truth for both the web app (via WASM) and the Android app (via UniFFI). This ensures rules are correct, testable, and never duplicated across platforms.

## User story
As a developer, I want all Hegemony game rules in a single Rust crate so that any rule change is automatically reflected on both web and mobile with no risk of platforms diverging.

## Acceptance criteria
- [ ] All TypeScript types in `lib/types/` have exact Rust equivalents with serde derive
- [ ] `create_starting_state(input)` produces a `GameState` matching the current `createStartingState()` output for all faction combinations
- [ ] `compute_tax_multiplier` returns values in the range [1, 7] for all valid policy inputs
- [ ] `suggest_taxes` output matches current TypeScript implementation for known inputs
- [ ] All four VP functions (`working_vp`, `middle_vp`, `capitalist_vp`, `state_vp`) match current TS output — except `capitalist_vp` which replaces the `floor(capital/30)` approximation with the real Hegemony wealth step table
- [ ] `compute_round_suggestion` matches current TS output for known game states
- [ ] `apply_mutation` is pure: given the same state and mutation, always returns the same new state
- [ ] `undo` on a state with history restores exactly the prior state
- [ ] `wasm-pack build --target bundler` succeeds and generates TypeScript `.d.ts` files in `packages/hegemony-wasm/`
- [ ] `cargo test` passes with ≥ 20 unit tests covering all rules functions and edge cases
- [ ] `proptest` property tests: tax multiplier always in [1,7]; VP total never negative; undo always recovers prior state

## Tasks

### 1.1 — Types
- [ ] Define `ClassId`, `GameMode`, `Phase`, `PolicyId`, `PolicySection` as Rust enums
- [ ] Define `PolicyState`, `MarketState`, `PublicServices`, `PopulationPools`, `Bill`, `BusinessDeal`, `ExpansionFlags`, `HistoryEntry`, `GameMeta`, `GameState`, `AutomaState` as Rust structs
- [ ] Define `WorkingClassState`, `MiddleClassState`, `CapitalistState`, `StateClassState` as structs
- [ ] Define sub-types: `TradeUnion`, `WorkingCooperative`, `MiddleCompany`, `CapitalistCompany`, `PublicCompany`, `CrisisCard`, `Bond`, `AutomaOpponent`
- [ ] Define storage structs: `WorkingStorage`, `MiddleStorage` (with `prices`), `CapitalistStorage` (with `prices` + `freeTradeZone`)
- [ ] All types: `#[derive(Clone, Debug, Serialize, Deserialize)]`

### 1.2 — Starting state factory
- [ ] `pub fn create_starting_state(input: NewGameInput) -> GameState`
- [ ] Per-faction initializers: `make_working()`, `make_middle()`, `make_capitalist()`, `make_state()`
- [ ] Policy defaults: Taxation→A, Foreign Trade→C, Immigration→A, all others→C
- [ ] Conditional Crisis & Control initialization (only when expansion enabled)
- [ ] IDs via `uuid` crate (v4)

### 1.3 — Rules engine
- [ ] `pub fn compute_tax_multiplier(policies: &Policies) -> u32`
- [ ] `pub fn suggest_taxes(state: &GameState) -> TaxSuggestion`
- [ ] `pub fn working_vp(state: &GameState) -> VpBreakdown`
- [ ] `pub fn middle_vp(state: &GameState) -> VpBreakdown`
- [ ] `pub fn capitalist_vp(state: &GameState) -> VpBreakdown` — implement real wealth table from the Hegemony rulebook (step thresholds, not linear approximation)
- [ ] `pub fn state_vp(state: &GameState) -> VpBreakdown`
- [ ] `pub fn vp_for(class_id: ClassId, state: &GameState) -> VpBreakdown`
- [ ] `pub fn compute_round_suggestion(state: &GameState) -> RoundSuggestion`
- [ ] `pub fn apply_round_suggestion(state: &GameState, suggestion: &RoundSuggestion) -> GameState`

### 1.4 — State mutations
- [ ] Define `Mutation` enum with one variant per logical operation (SetPolicy, AdvancePhase, SetPhase, SetRound, ProposeBill, RemoveBill, AdjustMoney, AdjustPopulation, etc.)
- [ ] `pub fn apply_mutation(state: &GameState, mutation: Mutation, label: &str) -> GameState`
- [ ] History: prepend snapshot, cap at 30 entries
- [ ] `pub fn undo(state: &GameState) -> Option<GameState>`

### 1.5 — WASM bindings
- [ ] Add `wasm-bindgen` and `serde-wasm-bindgen` to `Cargo.toml`
- [ ] Annotate public functions with `#[wasm_bindgen]`
- [ ] Use `serde-wasm-bindgen` for passing `GameState` as plain JS objects
- [ ] `wasm-pack build --target bundler --out-dir ../../packages/hegemony-wasm`
- [ ] Verify generated `.d.ts` types are correct

### 1.6 — Tests
- [ ] Unit tests: `compute_tax_multiplier` for all 9 policy combinations (taxation × health+education)
- [ ] Unit tests: `suggest_taxes` with known starting state
- [ ] Unit tests: all four VP functions with known states
- [ ] Unit tests: `apply_mutation` — each mutation variant
- [ ] Unit tests: `undo` restores state; `undo` on empty history returns `None`
- [ ] `proptest` tests: tax multiplier range, VP non-negative, undo idempotency

## Technical notes
- Reference `lib/types/game.ts` and `lib/types/classes/*.ts` for exact field names and defaults
- Reference `lib/data/startingState.ts` for exact starting values — do not deviate
- Reference `lib/game-rules/taxes.ts` for tax formula; `lib/game-rules/vp.ts` for VP formulas
- Capitalist wealth table: look up the actual thresholds in `docs/Hegemony-Rulebook-v1.2.pdf` (page references the capital→VP step table)
- The `apply()` function in `lib/store/index.ts` uses JSON deep-clone — Rust's `Clone` is the equivalent
- `serde_json` for history snapshots (same serialization format as the current TS localStorage state, so saves remain compatible)

## Metadata
- **Type**: Feature
- **Priority**: High
- **Effort**: XL (> 2 days)
- **Blocked by**: Phase 0 (monorepo foundation)
- **Blocks**: Phase 2 (WASM integration), Phase 5 (Expo mobile)
