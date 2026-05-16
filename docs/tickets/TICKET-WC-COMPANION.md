# Ticket: Working Class Companion Screen

**For:** Claude Code planning & implementation  
**Spec:** `docs/SPEC-WC-COMPANION.md` — read this first, it is the source of truth  
**Branch suggestion:** `feature/wc-companion`

---

## Context

Praxis is a companion app for the board game *Hegemony: Lead Your Class to Victory*.
It currently operates as a full game-state emulator (tracking every resource for all
four factions). This ticket introduces a **new, separate product direction**: a
lightweight **calculator screen** for the Working Class player that requires no game
session and no synchronisation with the physical board.

The physical board stays the source of truth for token positions. The app only handles
the arithmetic the rulebook makes hard: taxes, bundle cost, wages vs. needs, action
alerts, and policy scoring.

---

## Goal

Build the route `/tools/working-class` — a stateless, single-page calculator for the
WC player. All inputs are held in React state (persisted to `localStorage` so a page
refresh doesn't lose them). No WASM game session is created. No mutations are
dispatched. This screen is independent of `/play/[gameId]`.

---

## What to plan (scope of this ticket)

### 1. New route

`apps/web/app/tools/working-class/page.tsx`

- Client component (`"use client"`)
- Holds all input state via `useState` (or `useReducer` for the full inputs object)
- Persists inputs to `localStorage` under key `wc-companion-inputs-v1`
- Renders `<InputPanel>` (left) and output cards (right) in a two-column layout
  on desktop, single-column stack on mobile
- A `[ Reset to Round 1 defaults ]` button restores the Round 1 initial values
  defined in the spec

### 2. New TypeScript module

`apps/web/lib/tools/wc-companion.ts`

Pure functions only — no side effects, no imports from the store.

**Types to define:**
- `WCInputs` — full input schema (see spec §3)
- `WCOutputs` — full computed outputs (see spec §4)
- `IndustryColour` — `'red' | 'blue' | 'yellow' | 'green' | 'purple'`
- `PolicyPosition` — `'A' | 'B' | 'C'`
- `TUStatus` — `'none' | 'eligible' | 'formed'`

**Functions to implement:**

```ts
// Main entry point — called on every input change
export function computeWC(inputs: WCInputs): WCOutputs

// Internal helpers (export for testing)
export function taxMultiplier(taxation: PolicyPosition, health: PolicyPosition, edu: PolicyPosition): number
export function incomeTaxPerUnit(laborMarket: PolicyPosition, taxation: PolicyPosition): number
export function cheapestSource(prices: Partial<Record<string, number>>): { price: number; source: string }
export function tuVp(formedCount: number): number          // 1+2+3... up to formedCount
export function policyStoplight(id: PolicyId, position: PolicyPosition): 'good' | 'neutral' | 'trouble'
export function eogPolicyVpEstimate(outputs: WCOutputs): number
```

**Tax multiplier formula** (from `crates/hegemony-core/src/rules/taxes.rs`):
```
Tax=A: 3 + 2*(H_mod + E_mod)
Tax=B: 2 + (H_mod + E_mod)
Tax=C: 1
mod: A→2, B→1, C→0
```

**Income tax per unit lookup** (9-cell table, same file):
```
LM\Tax   A  B  C
A        7  6  5
B        4  4  4
C        1  2  3
```

Do NOT call WASM for these — they are small enough to duplicate in TS and
the calculator must work before WASM finishes initialising.

**Key computed fields** (see spec §4.A for full formulas):
- `wcIncomeTax = population × incomeTaxPerUnit`
- `foodBill = (population − foodCoops − healthCoops* − eduCoops*) × cheapestFoodPrice`
- `bundleCost = foodBill + healthBill + eduBill + luxuryBill`
- `wagesNeeded = wcIncomeTax + bundleCost`
- `wagesShortfall = max(0, wagesNeeded − wagesReceived)`
- `wagesSurplus  = max(0, wagesReceived − wagesNeeded)`
- `treasuryAfterTax = cashInBank + wagesReceived − wcIncomeTax`
- `excessWealthPoints = floor(treasuryAfterTax / 10)`
- `prosperityPotential = min(5, currentProsperity + maxBundles)`

*C&C coops only active when `inputs.crisisAndControl === true`*

**Demonstration alert:** `unemployed > (totalVacancies + 2)`  
**Strike alert:** `lowestWageLevel < 3`  
**TU eligibility:** per colour: `employedInColour >= 4`  
**TU VP:** sum 1+2+…+n for each formed union (1st=1VP, 2nd=2VP, …5th=5VP)

**Policy stoplight** (pre-baked from rulebook, spec §4.C):

| Policy | A | B | C |
|---|---|---|---|
| Fiscal (1) | neutral | neutral | neutral |
| Labor Market (2) | good | neutral | trouble |
| Taxation (3) | good | neutral | trouble |
| Health & Benefits (4) | good | neutral | trouble |
| Education Welfare (5) | good | neutral | trouble |
| Foreign Trade (6) | trouble | neutral | good |
| Immigration (7) | trouble | neutral | good |

**EOG policy VP estimate** *(directional only, formula unconfirmed)*:
`goodCount × 3 − troubleCount × 2`

### 3. Unit tests

`apps/web/lib/tools/__tests__/wc-companion.test.ts`

Use Vitest (already configured). Cover:
- All 9 cells of `incomeTaxPerUnit`
- All valid `taxMultiplier` combinations (matches the 9 values: `{1,2,3,4,5,6,7,9,11}`)
- `cheapestSource` picks the minimum and returns the correct source label
- `bundleCost` correctly offsets for C&C coops when flag is on, ignores them when off
- `wagesShortfall` / `wagesSurplus` are never both non-zero simultaneously
- `prosperityPotential` is capped at 5
- `demonstrationAlert` boundary: exactly `vacancies + 2` unemployed → false; `+3` → true
- `tuVp` for 0–5 formed unions

### 4. UI components

All in `apps/web/app/tools/working-class/_components/`.

**`InputPanel.tsx`**
- Sections: Demographics, Financials, Goods Prices, Workforce, Trade Unions, Policies
- Every field triggers an `onChange(newInputs)` callback to the page — no local state
  in this component
- Policy positions rendered as a 3-button toggle (A / B / C) per policy, not a dropdown
- Goods prices: a compact grid — rows = goods (Food, Health, Edu, Luxury), columns =
  sources (CC, MC, State). Cells that don't apply to a source are shown as `—` (disabled)
- C&C expansion toggle at the top of the Financials section; hides/shows the three
  coop count fields
- "Reset to R1 defaults" button at the top

**`FinancialsCard.tsx`**
- Displays: Tax Multiplier, Income Tax, Food Bill, Bundle Cost, Wages Needed
- A prominent row: `Wages Received [input] vs Wages Needed [computed]`
  with a green surplus badge or red shortfall badge
- Excess Wealth Points (greyed out if 0)
- Prosperity row: `Current: N → Potential: N` (only shown if potential > current)

**`ActionAlerts.tsx`**
- Two alert rows: STRIKE and DEMONSTRATION
- When `TRUE`: high-contrast red badge with icon + short explanation
- When `FALSE`: muted green checkmark row

**`TradeUnionPanel.tsx`**
- One row per industry colour (Red/Blue/Yellow/Green/Purple)
- Each row shows: colour name, employed count, status badge (Not eligible / Eligible /
  Formed), a toggle button to flip Eligible → Formed (disabled if not eligible)
- Footer: `TU VP now: N | Potential (if all eligible formed): N`

**`PolicyMap.tsx`**
- Grid: 7 policy rows, each with a stoplight colour dot, policy name, A/B/C position
- Summary chips at the top: 🟢 N Good · 🟡 N Neutral · 🔴 N Trouble
- EOG estimate line: `Policy VP estimate: +N` (with ⚠ caveat "unconfirmed formula")

**`RoundOneBanner.tsx`**
- Dismissable yellow info banner
- Text: *"Round 1 tip: Working Class should generally ignore Policy 1 (Fiscal) unless
  wages are constrained. Focus action points on Labor Market and Taxation first."*
- Dismissed state stored in `localStorage` key `wc-r1-banner-dismissed`

### 5. Navigation entry

Add a **"Tools"** section to the home page (`apps/web/app/page.tsx`) with a card linking
to `/tools/working-class`. Use the same card style as the existing "New Game" / saved
games list. Label: *"Working Class Calculator"*. One-line description: *"Tax, wages, and
policy helper — no game session needed."*

---

## Files to create

```
apps/web/app/tools/working-class/
  page.tsx
  _components/
    InputPanel.tsx
    FinancialsCard.tsx
    ActionAlerts.tsx
    TradeUnionPanel.tsx
    PolicyMap.tsx
    RoundOneBanner.tsx

apps/web/lib/tools/
  wc-companion.ts
  __tests__/
    wc-companion.test.ts
```

## Files to modify

```
apps/web/app/page.tsx          — add Tools nav section
```

---

## Constraints

- **No new Rust code required.** All formulas are re-implemented in TS from the lookup
  tables already verified in `crates/hegemony-core/src/rules/taxes.rs`.
- **No WASM dependency.** The screen must be fully functional before WASM loads.
- **No mutations, no store.** Do not import from `apps/web/lib/store/`.
- **Tailwind only** for styling — no new CSS files.
- **Mobile-first.** The two-column desktop layout collapses to a single column at
  `< 768px`. Input panel stacks above output cards.
- **Existing shared components** (Counter, Modal, StatBadge) in
  `apps/web/app/_components/shared/` may be reused if they fit.

---

## Definition of done

- [ ] `computeWC` is a pure function with no side effects
- [ ] All unit tests pass (`pnpm test`)
- [ ] Route `/tools/working-class` renders without errors in dev (`pnpm dev`)
- [ ] All output fields update immediately on every input change (no Submit button)
- [ ] C&C toggle correctly shows/hides expansion coop fields and recalculates
- [ ] Strike and Demonstration alerts render correctly at boundary conditions
- [ ] Inputs survive a page refresh (localStorage persistence)
- [ ] Reset button restores Round 1 defaults
- [ ] TypeScript strict mode — no `any`, no type errors (`pnpm tsc --noEmit`)
- [ ] Responsive: usable on a phone screen held in portrait orientation
