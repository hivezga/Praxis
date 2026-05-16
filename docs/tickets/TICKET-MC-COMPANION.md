# Ticket: Middle Class Companion Screen

**For:** Claude Code planning & implementation
**Spec:** `docs/SPEC-MC-COMPANION.md` — read this first, it is the source of truth
**Reference:** `docs/SPEC-WC-COMPANION.md` + the shipped `/tools/working-class` — same pattern, different math
**Branch suggestion:** `feature/mc-companion`

---

## Context

Praxis ships a companion calculator at `/tools/working-class` for WC
players. This ticket adds the Middle Class equivalent at
`/tools/middle-class`. Same overall pattern (no game session, no WASM,
no mutations, localStorage-persisted) — but the calculation engine and
UI diverge because MC is both an employer (own companies + employment
tax) and an employee (income tax for outside companies), with no trade
unions, no strike/demonstration alerts, and an authoritative game-end
VP formula instead of WC's directional estimate.

---

## Goal

Build the route `/tools/middle-class`. Stateless per-session,
`useReducer` for inputs, `localStorage` under
`mc-companion-inputs-v1`. No store, no WASM. Add a second card to the
"Tools" section on the home page.

---

## What to plan

### 1. New route

`apps/web/app/middle-class/page.tsx` — *wait, mirror WC* — actually:
`apps/web/app/tools/middle-class/page.tsx`

- Client component
- Reducer-driven state per spec §8
- localStorage key `mc-companion-inputs-v1`, hydration effect gated by
  `hydrated` flag like the WC tool
- `[ Reset to Round 1 defaults ]` button restores R1 values per spec §3
- Two-column desktop (`md:grid-cols-2`), single-column mobile

### 2. New TS module

`apps/web/lib/tools/mc-companion.ts`

Pure functions:

```ts
// Re-use formulas (don't re-derive — match Rust core / WC module)
export function taxMultiplier(tax, h, e): number      // same as wc-companion.ts
export function incomeTaxPerUnit(lm, tax): number     // same 9-cell

// MC-specific helpers
export function cheapestSource<S extends string>(prices: Partial<Record<S, number>>): { price: number; source: S | '' }
export function mcPolicyStoplight(id: PolicyId, position: PolicyPosition): 'good' | 'neutral' | 'trouble'
export function triangular(n: number): number          // n*(n+1)/2, clamped 0..5

export function computeMC(inputs: MCInputs): MCOutputs
```

**Key MC formulas** (see spec §4.A for full):

```
mcIncomeTax       = companiesEmployedElsewhere × incomeTaxPerUnit
mcEmploymentTax   = operationalOwnCompanies × taxMultiplier
foodBill          = population × cheapestFood
mandatoryOutlay   = totalTaxes + foodBill
netCashAfterMand  = cash + revenue + wagesReceived − mandatoryOutlay
ewp               = floor(netCashAfterMand / 15)            // /15 not /10
maxBoostsAfforded = greedy fit of 3 prosperity bundles into netCashAfterMand
scoringBoost      = (prosperity < operationalOwnCompanies) ? 1 : 0
prosperityPotential = min(5, prosperity + scoringBoost + maxBoostsAfforded)

loanRisk          = (cash + revenue + wagesReceived) < mandatoryOutlay
scoringBoostLost  = operationalOwnCompanies <= prosperity
```

**EOG VP** (spec §4.D, all rulebook-grounded):

```
sectionBCount = count of policies 1..5 in position 'B'
eogPolicyVp   = triangular(sectionBCount)             // 1,3,6,10,15
eogStorageVp  = floor(food/2) + floor(lux/3) + floor(health/3) + floor(edu/3)
eogCashVp     = floor(cash/15)
eogTotalVp    = sum
```

### 3. Unit tests

`apps/web/lib/tools/__tests__/mc-companion.test.ts` — vitest.

Cover:
- `triangular` over 0..5 → [0,1,3,6,10,15]
- mcIncomeTax: companies × perUnit (3 companies, LM=A/Tax=C → 3×5=15)
- mcEmploymentTax: ops × multiplier
- `mandatoryOutlay` matches taxes + food
- `loanRisk` true when treasury < mandatoryOutlay, false otherwise
- `scoringBoostLost` boundary: ops==prosperity → true; ops>prosperity → false
- `maxBoostsAfforded`: greedy ordering — cheapest-first; verify 3 of 3, 0 of 3, partial
- `prosperityPotential` cap at 5
- `mcPolicyStoplight`: policies 1–5 with B → good, A/C → trouble; 6 with A → good, C → trouble; 7 all neutral
- `eogPolicyVp` R1 defaults: only Health=B is in section B (laborMarket=B too actually) — verify count
- `eogStorageVp` per spec divisors

### 4. UI components

`apps/web/app/tools/middle-class/_components/`

- `InputPanel.tsx` — sections: Demographics (pop/prosperity/cash), Companies (ops + employed-elsewhere), Goods Prices (5-good grid), Storage (5 inputs), Policies (7 rows A/B/C)
- `FinancialsCard.tsx` — tax breakdown, food bill (mandatory badge), revenue + wages received inputs, prosperity actions table, prosperity potential
- `ActionAlerts.tsx` — loan risk + scoring-boost-lost rows (red ⚠ on TRUE; muted ✓ when not)
- `PolicyMap.tsx` — stoplight grid + chips + EOG VP breakdown (Policy, Storage, Cash, Total)
- `RoundOneBanner.tsx` — yellow tip about Section B scoring

No `TradeUnionPanel.tsx`.

### 5. Navigation entry

Add second card to the "Tools" `<section>` in `apps/web/app/page.tsx`.
Accent: `bg-middle` (ochre), `text-middle`. Label: *"Middle Class
Calculator"*. Description: *"Income tax + employment tax, food bill,
and Section-B scoring tracker — no game session needed."*

### 6. e2e smoke

`apps/web/scripts/mc-companion-smoke.mjs` mirroring
`wc-companion-smoke.mjs`. New npm script `mc-smoke`. Add route to
`ROUTES` in `_lib.mjs` for axe + snapshot coverage.

---

## Files to create

```
apps/web/app/tools/middle-class/
  page.tsx
  _components/InputPanel.tsx
  _components/FinancialsCard.tsx
  _components/ActionAlerts.tsx
  _components/PolicyMap.tsx
  _components/RoundOneBanner.tsx

apps/web/lib/tools/
  mc-companion.ts
  __tests__/mc-companion.test.ts

apps/web/scripts/
  mc-companion-smoke.mjs
```

## Files to modify

```
apps/web/app/page.tsx          — add MC card to Tools section
apps/web/scripts/_lib.mjs      — add /tools/middle-class to ROUTES
apps/web/package.json          — add mc-smoke script
```

---

## Constraints

- **Reuse WC formulas where identical.** `taxMultiplier` and
  `incomeTaxPerUnit` are byte-for-byte identical. Re-export from
  `wc-companion.ts` if cross-module imports stay clean, or duplicate
  with a comment pointing at the source of truth.
- **No new Rust code.** All formulas come from `taxes.rs` and
  rulebook page 25 (already encoded).
- **No WASM dependency.**
- **No mutations, no store.**
- **Tailwind only**, mobile-first single-column under 768px.

---

## Definition of done

- [ ] `computeMC` is a pure function
- [ ] Vitest passes
- [ ] Route renders cleanly in dev
- [ ] All outputs recompute on every input change (no submit)
- [ ] Loan risk + scoring-boost-lost alerts at boundaries
- [ ] Inputs survive page refresh
- [ ] Reset button restores R1 defaults
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm wc-smoke` still passes (no regression)
- [ ] `pnpm mc-smoke` passes with full assertion sweep
- [ ] Responsive on phone portrait
