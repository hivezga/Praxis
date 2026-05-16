# Working Class Companion — Design Spec

**Route:** `/tools/working-class`  
**Status:** Design (not yet implemented)  
**Motivation:** Calculator-first companion for WC players. The physical board
stays the source of truth for all resource tokens and worker placement.
The app provides only the math the rulebook makes hard: taxes, wages needed,
bundle cost, action alerts, and policy scoring.

No game session required. Stateless per-session — inputs are held in local
component state (or `localStorage` keyed to the route) so they survive a
page refresh.

---

## 1. Scope

This screen is WC-only for the first iteration. The same pattern will be
replicated for Middle Class, Capitalist, and State in subsequent specs.

The full emulator (`/play/[gameId]`) continues to exist for groups who want
complete party-mode tracking. This tool is for groups playing with the
physical board who only want the arithmetic handled.

---

## 2. Route & Integration

| Item | Detail |
|---|---|
| Route | `/tools/working-class` |
| Nav entry | New "Tools" section in the home page nav, alongside "New Game" |
| No auth / session required | Inputs are ephemeral; no WASM game state created |
| WASM dependency | **Partial.** Tax multiplier and income tax lookups re-use the Rust functions exposed via WASM. Other calculations are pure TS in this screen. |

### WASM calls used

```ts
// Already exported — no new Rust code needed
wasm().compute_tax_multiplier_wasm(policies: PolicyInput): number
wasm().income_tax_per_unit_wasm(labor_market: string, taxation: string): number
```

If WASM hasn't loaded yet, fall back to the identical lookup tables in TS
(copy the 9-cell income tax table and the multiplier formula — they're small
and deterministic). Never block the calculator on WASM initialisation.

---

## 3. Input Schema

All inputs are controlled form fields. Every change triggers immediate
recalculation (no Submit button).

### 3.1 Demographics

| Field | Type | Round 1 Default | Notes |
|---|---|---|---|
| Population | integer ≥ 1 | 15 | Workers in play |
| Current Prosperity | 0–5 | 2 | From the prosperity track |

### 3.2 Financials

| Field | Type | Round 1 Default | Notes |
|---|---|---|---|
| Cash in Bank | integer ≥ 0 | 0 | WC treasury before production |
| Wages Received | integer ≥ 0 | 0 | Actual wages received this round; used to compute surplus/shortfall |
| Coop Farm Count | integer ≥ 0 | 0 | Food coops — each offsets 1 food unit purchased |
| Health Coop Count *(C&C only)* | integer ≥ 0 | 0 | Visible when Crisis & Control toggle is on |
| Education Coop Count *(C&C only)* | integer ≥ 0 | 0 | Visible when Crisis & Control toggle is on |

### 3.3 Goods Prices (per unit)

Three sources — CC (Capitalist), MC (Middle), State. Each good tracked
separately so the app can auto-identify cheapest source.

| Good | CC Price | MC Price | State Price |
|---|---|---|---|
| Food | number | number | number |
| Health | — | number | number |
| Education | — | number | number |
| Luxury | number | — | — |

> Luxury is part of the WC bundle requirement alongside food, health, and
> education. CC is the only seller of Luxury; no cheapest-source comparison
> needed for it.
>
> Health and Education are sold by MC and State only. If a source doesn't
> sell a good, disable that input cell and treat it as ∞ for comparison.

### 3.4 Workforce

| Field | Type | Notes |
|---|---|---|
| Unemployed | integer ≥ 0 | Workers not placed on any company |
| Employed per colour | integer per industry colour | Red / Blue / Yellow / Green / Purple |
| Vacancies per colour | integer per industry colour | Open slots across all companies of that colour |
| Lowest wage level | 1 / 2 / 3 | Lowest wage level on any company the WC currently works in; drives the Strike alert |

Industry colours: Red (industrial), Blue (service), Yellow (agriculture),
Green (health/edu), Purple (luxury). These map to the coloured industry
track on the board.

### 3.5 Trade Unions

For each of the 5 industry colours, one of three states:
- **Not eligible** — employed < 4 in this colour
- **Eligible** — employed ≥ 4 but union not yet formed
- **Formed** — union marker on the board

The app auto-sets eligibility from workforce inputs; the player manually
toggles Eligible → Formed when they spend the action to form it.

TU VP points per union (end-of-game, rulebook page 30):
| Union formed | VP |
|---|---|
| 1st | 1 |
| 2nd | 2 |
| 3rd | 3 |
| 4th | 4 |
| 5th | 5 |
Total possible: 15 VP from unions.

### 3.6 Policy Positions

7 sliders/toggles, each A / B / C:

| # | Policy Name | Round 1 Default | WC Sentiment |
|---|---|---|---|
| 1 | Fiscal Policy | C | Neutral |
| 2 | Labor Market | B | Neutral |
| 3 | Taxation | A | Good |
| 4 | Health & Benefits | B | Neutral |
| 5 | Education Welfare | C | Trouble |
| 6 | Foreign Trade | B | Neutral |
| 7 | Immigration | B | Neutral |

WC Sentiment is pre-computed from the rulebook and displayed as the
stoplight colour for each policy (see §4.C below).

---

## 4. Calculation Engine

All values are derived live from the input state above. The TypeScript
types that back this are kept in a new file:
`apps/web/lib/tools/wc-companion.ts`

### 4.A — Financials Table

```
Tax Multiplier       = compute_tax_multiplier(Policy 3, Policy 4, Policy 5)
                       Formula (from taxes.rs):
                         Tax=A: 3 + 2*(H_mod + E_mod)
                         Tax=B: 2 + (H_mod + E_mod)
                         Tax=C: 1
                       where mod: A→2, B→1, C→0

Income Tax Per Unit  = income_tax_per_unit(Policy 2, Policy 3)
                       Lookup table (from taxes.rs):
                         LM\Tax  A   B   C
                         A       7   6   5
                         B       4   4   4
                         C       1   2   3

WC Income Tax        = Population × Income Tax Per Unit

Cheapest Food Price  = min(CC Food, MC Food, State Food)  [ignoring ∞ sources]
Cheapest Health      = min(MC Health, State Health)
Cheapest Edu         = min(MC Edu, State Edu)
Luxury Price         = CC Luxury (only source)

Food Bill            = (Population − Food Coop Count − Health Coop Count*
                        − Edu Coop Count*) × Cheapest Food Price
                       (* C&C expansion coops only, visible when toggle enabled)

Health Bill          = (Population − Health Coop Count*) × Cheapest Health
Edu Bill             = (Population − Edu Coop Count*)   × Cheapest Edu
Luxury Bill          = Population × Luxury Price

Bundle Cost          = Food Bill + Health Bill + Edu Bill + Luxury Bill

Cover Needs          = WC Income Tax + Food Bill
                       (minimum survival threshold — just food + taxes)

Wages Needed         = WC Income Tax + Bundle Cost
                       (amount needed to cover taxes + full bundles with no loans)

Wages Shortfall      = max(0, Wages Needed − Wages Received)
Wages Surplus        = max(0, Wages Received − Wages Needed)
                       (displayed as green "+X¥ surplus" or red "−X¥ shortfall")

Treasury After Tax   = Cash in Bank + Wages Received − WC Income Tax
Excess Wealth Points = floor(Treasury After Tax / 10)
                       (displayed as "+N VP" if positive, greyed out if 0)

Bundle Price         = Cheapest Food Price + Cheapest Health + Cheapest Edu
                        + Luxury Price
Max Bundles          = floor(Treasury After Tax / Bundle Price)
                       (how many full need-sets WC can afford after taxes)

Prosperity Potential = Current Prosperity + Max Bundles
                       (capped at 5; shown as "X → Y" if bundles would push it up)
```

### 4.B — Worker / Action Alerts

```
Demonstration Alert  = Unemployed > (Total Vacancies + 2)
                       [Total Vacancies = sum across all colours]

Strike Alert         = Lowest Wage Level (input field) < 3
                       (player enters 1, 2, or 3 — the lowest wage level on any
                        company they currently work in. Alert fires if 1 or 2.)

TU Eligibility       = per colour: employed_in_colour ≥ 4
TU Points (current)  = sum of VP for each Formed union (1+2+3... by count)
TU Points (potential)= sum of VP if all Eligible unions also formed
```

### 4.C — Policy Stoplight

Each policy maps to a WC sentiment based on its current position.
Sentiment is pre-baked from the rulebook WC chapter:

| Policy | A | B | C |
|---|---|---|---|
| 1 Fiscal | 🟡 Neutral | 🟡 Neutral | 🟡 Neutral |
| 2 Labor Market | 🟢 Good | 🟡 Neutral | 🔴 Trouble |
| 3 Taxation | 🟢 Good | 🟡 Neutral | 🔴 Trouble |
| 4 Health & Benefits | 🟢 Good | 🟡 Neutral | 🔴 Trouble |
| 5 Education Welfare | 🟢 Good | 🟡 Neutral | 🔴 Trouble |
| 6 Foreign Trade | 🔴 Trouble | 🟡 Neutral | 🟢 Good |
| 7 Immigration | 🔴 Trouble | 🟡 Neutral | 🟢 Good |

> Policies 6 and 7 are inverted from the others for WC — A is bad
> (cheap imports undercut wages; immigration increases labour supply).

**Summary counts** displayed at the top of the policy section:
```
🟢 Good:    N policies
🟡 Neutral: N policies
🔴 Trouble: N policies
```

**EOG Score estimate** — VP from policy map at end of game.
The rulebook assigns VP to WC based on how many policies end in their
preferred section. Display as an estimate, not a guarantee:

```
EOG Policy VP = (count of 🟢 Good policies × 3)
                − (count of 🔴 Trouble policies × 2)
```

*(Exact formula pending rulebook cross-check — use as a direction
indicator, not a precise forecast.)*

---

## 5. Round 1 Strategy Note

Display as a dismissable banner below the policy section (local storage
remembers dismissal):

> **Round 1 tip:** Working Class should generally ignore Policy 1 (Fiscal)
> unless wages are constrained. Focus action points on Labor Market and
> Taxation first.

---

## 6. UI Layout

```
┌─────────────────────────────────────────────────┐
│  Working Class Companion          [ R1 defaults ] │
├─────────────────┬───────────────────────────────┤
│  INPUTS         │  FINANCIALS                    │
│                 │  Tax Multiplier:  5            │
│  Population 15  │  Income Tax:     60¥           │
│  Prosperity  2  │  Food Bill:      39¥           │
│  Cash        0  │  Bundle Cost:    90¥  ──────── │
│  Coops       0  │  Wages Needed:  150¥  ← target │
│                 │  Excess VP:       0            │
│  GOODS PRICES   │  Prosperity: 2 → 2 (0 bundles) │
│  Food  CC MC St │                                │
│  Hlth  MC  St   ├───────────────────────────────┤
│  Edu   MC  St   │  ACTION ALERTS                 │
│                 │  ⚠ STRIKE — wage level < 3     │
│  WORKFORCE      │  ✓ No Demonstration            │
│  Unemployed  3  │                                │
│  [colour grid]  ├───────────────────────────────┤
│                 │  TRADE UNIONS                  │
│  TRADE UNIONS   │  Red:  Eligible (4 employed)   │
│  [per colour]   │  Blue: Not eligible            │
│                 │  TU VP now: 0 / potential: 3   │
│  POLICIES       ├───────────────────────────────┤
│  [A/B/C toggle] │  POLICY MAP                    │
│                 │  🟢×1  🟡×4  🔴×2             │
│                 │  EOG estimate: -1 VP            │
└─────────────────┴───────────────────────────────┘
```

Two-column layout on desktop (≥ 768 px). Single column stack on mobile
(inputs top, outputs below).

---

## 7. Component Breakdown

New components in `apps/web/app/tools/working-class/`:

| File | Purpose |
|---|---|
| `page.tsx` | Route entry; holds all state via `useState` |
| `_components/InputPanel.tsx` | Left column: all input fields |
| `_components/FinancialsCard.tsx` | Tax, bundle cost, wages needed, prosperity |
| `_components/ActionAlerts.tsx` | Strike / Demonstration alert badges |
| `_components/TradeUnionPanel.tsx` | Per-colour TU status + VP totals |
| `_components/PolicyMap.tsx` | Stoplight grid + stoplight summary + EOG estimate |
| `_components/RoundOneBanner.tsx` | Dismissable R1 strategy tip |

Shared components from `apps/web/app/_components/shared/` (Counter, etc.)
can be reused as-is.

---

## 8. New TypeScript Module

`apps/web/lib/tools/wc-companion.ts`

Exports a single pure function:

```ts
export interface WCInputs {
  population: number;
  prosperity: number;
  cashInBank: number;
  coopFarmCount: number;

  goods: {
    food:   { cc?: number; mc?: number; state?: number };
    health: {              mc?: number; state?: number };
    edu:    {              mc?: number; state?: number };
    luxury: { cc?: number                             };
  };

  workforce: {
    unemployed: number;
    lowestWageLevel: 1 | 2 | 3;  // player reports the lowest wage level on any company they're in
    byColour: Record<IndustryColour, { employed: number; vacancies: number; union: 'none' | 'eligible' | 'formed' }>;
  };

  policies: {
    fiscal:     'A' | 'B' | 'C';
    laborMarket:'A' | 'B' | 'C';
    taxation:   'A' | 'B' | 'C';
    health:     'A' | 'B' | 'C';
    education:  'A' | 'B' | 'C';
    foreignTrade:'A'| 'B' | 'C';
    immigration:'A' | 'B' | 'C';
  };
}

export interface WCOutputs {
  taxMultiplier: number;
  incomeTaxPerUnit: number;
  wcIncomeTax: number;

  cheapestFoodPrice: number;
  cheapestHealthPrice: number;
  cheapestEduPrice: number;
  cheapestFoodSource: 'cc' | 'mc' | 'state';
  cheapestHealthSource: 'mc' | 'state';
  cheapestEduSource: 'mc' | 'state';

  foodBill: number;
  bundleCost: number;
  coverNeeds: number;
  wagesNeeded: number;

  treasuryAfterTax: number;
  excessWealthPoints: number;
  maxBundles: number;
  prosperityPotential: number;

  demonstrationAlert: boolean;
  strikeAlert: boolean;

  tuByColour: Record<IndustryColour, 'none' | 'eligible' | 'formed'>;
  tuVpNow: number;
  tuVpPotential: number;

  policyStoplight: Record<PolicyId, 'good' | 'neutral' | 'trouble'>;
  goodCount: number;
  neutralCount: number;
  troubleCount: number;
  eogPolicyVpEstimate: number;
}

export function computeWC(inputs: WCInputs): WCOutputs { ... }
```

All logic is pure / no side effects. Easy to unit test with Vitest.

---

## 9. Open Questions

1. ✅ **Wages received** — Added. Shows surplus / shortfall vs. wages needed.

2. ✅ **Luxury bundles** — Required. Included in bundle cost alongside food,
   health, and education. CC is the only luxury source (no comparison needed).

3. ✅ **Coops producing health/edu** — Supported via Crisis & Control toggle.
   When enabled, health and education coop counts appear and offset their
   respective bills. Hidden in base game mode.

4. ⚠ **EOG policy VP formula** — Not coded in the existing Rust codebase
   (flagged as game-end only, not yet implemented). Current estimate:
   Good policies ×3 minus Trouble policies ×2. Needs cross-check against
   rulebook page 13 before treating this as authoritative.

5. ✅ **Strike detection** — Single field: "Lowest wage level in any company
   you work in" (1/2/3). Alert fires if < 3. Player sees which company
   on the physical board; no per-company entry needed.

---

## 10. Out of Scope for This Iteration

- Saving/loading inputs between sessions (v2)
- Sharing inputs with other players (belongs in party mode)
- MC / Capitalist / State companion screens (separate specs)
- Integration with an active `/play/[gameId]` session to auto-populate
  policy inputs from the live game state (v2 — nice to have once all four
  companions exist)
