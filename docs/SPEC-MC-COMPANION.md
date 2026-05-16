# Middle Class Companion — Design Spec

**Route:** `/tools/middle-class`
**Status:** Design (not yet implemented)
**Motivation:** Calculator-first companion for MC players. The physical
board stays the source of truth for company placement and resource
tokens. The app handles only the math the rulebook makes hard: dual
taxes, mandatory food bill, optional prosperity-action bundles, and
end-of-game policy VP.

Same shape as the WC companion (`/tools/working-class`) — stateless
per-session, inputs in `useReducer`, persisted to `localStorage`.

---

## 1. Scope

MC-only iteration. Pattern from
[`/tools/working-class`](./SPEC-WC-COMPANION.md) is reused but the
calculation engine and UI sections diverge significantly because MC is
both an employer (own companies + employment tax) and an employee
(income tax for outside companies).

The full emulator at `/play/[gameId]` continues to track everything.
This tool is for groups playing with the physical board.

---

## 2. Route & Integration

| Item | Detail |
|---|---|
| Route | `/tools/middle-class` |
| Nav entry | Existing "Tools" section on home page — add second card |
| WASM | **None.** Tax formulas duplicated from `crates/hegemony-core/src/rules/taxes.rs` (same as WC) |
| Storage key | `mc-companion-inputs-v1` |
| R1 banner key | `mc-r1-banner-dismissed` |

---

## 3. Input Schema

### 3.1 Demographics

| Field | Type | R1 Default | Notes |
|---|---|---|---|
| Population | int ≥ 1 | 10 | from `make_middle()` in Rust starting state |
| Current Prosperity | 0–5 | 0 | rulebook says "Drop Prosperity by 2" each Preparation phase — starts low |
| Cash in bank | int ≥ 0 | 40 | from `make_middle()` |
| Revenue (collected this round) | int ≥ 0 | 0 | sum of `revenue` from operational owned companies — user-entered each round |

### 3.2 Companies

| Field | Type | R1 Default | Notes |
|---|---|---|---|
| Operational own companies | int 0–8 | 2 | Convenience Store + Doctor's Office at start |
| Companies-employed-elsewhere | int 0–10 | 0 | count of OTHER companies (CC + Public) where MC has workers — drives income tax |

> The Rust core tracks per-slot worker class as a future TODO; the
> companion stays at the rulebook abstraction: "number of OTHER
> companies where you have workers" (page 25).

### 3.3 Goods Prices (per unit, ¥)

Five goods. Sources differ from WC's table — MC also produces, and
buying from oneself is free (transfer-only).

| Good | CC | MC-self | Foreign | State |
|---|---|---|---|---|
| Food | ✓ | ✓ (free) | ✓ | ✗ |
| Luxury | ✓ | ✓ (free) | ✓ | ✗ |
| Health | ✓ | ✓ (free) | ✗ | ✓ |
| Education | ✓ | ✓ (free) | ✗ | ✓ |
| Influence | ✗ | ✗ | ✗ | ✓ |

User enters per-cell prices. App picks the cheapest source per good.
"MC-self" is a 0¥ transfer cost when the player has the good in storage.

Foreign prices: published on the board's import area; tariffs from
Policy 6 add to the listed price. Spec doesn't model tariff arithmetic
— user enters the post-tariff foreign price directly.

### 3.4 Storage on hand (for prosperity actions + EOG VP)

| Field | Type | R1 Default | Notes |
|---|---|---|---|
| Food | int ≥ 0 | 1 | |
| Luxury | int ≥ 0 | 0 | |
| Health | int ≥ 0 | 1 | |
| Education | int ≥ 0 | 0 | |
| Influence | int ≥ 0 | 1 | EOG: not counted (influence has no storage VP) |

### 3.5 Policy Positions

7 policies, A/B/C. R1 defaults match the base game.

| # | Policy | R1 Default |
|---|---|---|
| 1 | Fiscal Policy | C |
| 2 | Labor Market | B |
| 3 | Taxation | A |
| 4 | Health & Benefits | B |
| 5 | Education Welfare | C |
| 6 | Foreign Trade | B |
| 7 | Immigration | B |

---

## 4. Calculation Engine

All values derive live from input state. Types in
`apps/web/lib/tools/mc-companion.ts`.

### 4.A — Tax & Bills

```
Tax Multiplier       = same formula as WC (taxes.rs)
Income Tax / Unit    = same 9-cell lookup as WC

MC Income Tax        = companiesEmployedElsewhere × incomeTaxPerUnit
                       (per OUTSIDE company, not per worker — rulebook p.25)

MC Employment Tax    = operationalOwnCompanies × taxMultiplier
                       (rulebook p.25)

Total Taxes          = MC Income Tax + MC Employment Tax

Cheapest Food        = min(CC, MC-self, Foreign)   [State usually absent for food]
Cheapest Luxury      = min(CC, MC-self, Foreign)
Cheapest Health      = min(CC, MC-self, State)
Cheapest Edu         = min(CC, MC-self, State)
Influence Price      = State (only source)

Food Bill (mandatory)= population × cheapestFood
                       — MC MUST cover this each round (or take a loan)

Prosperity Action Costs (each optional, max 1 per round):
  Health Bundle      = population × cheapestHealth   (+1 prosperity, +2 VP, +1 worker)
  Edu Bundle         = population × cheapestEdu      (+1 prosperity, upgrades worker)
  Luxury Bundle      = population × cheapestLuxury   (+1 prosperity)

Mandatory Outlay     = Total Taxes + Food Bill

Net Cash After Mand. = cash + revenue + wagesReceived − Mandatory Outlay
Excess Wealth Points = floor(NetCashAfterMand / 15)    [NB: MC divides by 15, not 10]

Max Prosperity Boosts = how many of the 3 free actions can be afforded
                        from NetCashAfterMand (greedy: cheapest first)
Scoring Boost        = 1 if currentProsperity < operationalOwnCompanies else 0
Prosperity Potential = min(5, currentProsperity + scoringBoost + maxBoostsAfforded)
```

### 4.B — Action Alerts (MC has different concerns vs WC)

```
Loan Risk            = (cash + revenue + wagesReceived) < Mandatory Outlay
                       — flag: must take a loan to cover food

Scoring Boost Lost   = operationalOwnCompanies <= currentProsperity
                       — prosperity already meets/exceeds ops; no free boost

(No strike or demonstration concerns for MC.)
```

### 4.C — Policy Stoplight (MC, centrist preferences)

Section B (middle) maximizes game-end VP per rulebook page 25.
Foreign trade and immigration use situational analysis.

| Policy | A | B | C |
|---|---|---|---|
| 1 Fiscal Policy | 🔴 Trouble | 🟢 Good | 🔴 Trouble |
| 2 Labor Market | 🔴 Trouble | 🟢 Good | 🔴 Trouble |
| 3 Taxation | 🔴 Trouble | 🟢 Good | 🔴 Trouble |
| 4 Health & Benefits | 🔴 Trouble | 🟢 Good | 🔴 Trouble |
| 5 Education Welfare | 🔴 Trouble | 🟢 Good | 🔴 Trouble |
| 6 Foreign Trade | 🟢 Good | 🟡 Neutral | 🔴 Trouble |
| 7 Immigration | 🟡 Neutral | 🟡 Neutral | 🟡 Neutral |

> Policies 6/7 are not counted in MC's Section-B game-end VP (only 1–5
> are). They still affect round-by-round operations: A on Foreign Trade
> tariffs imports (favors local MC sales); C floods the market.
> Immigration's impact is genuinely mixed for MC.

### 4.D — Game-end VP estimate (authoritative, not directional)

Unlike the WC EOG estimate (heuristic), the MC formula is in the
rulebook page 25:

```
Section B Count        = # of policies 1..5 currently in section B
EOG Policy VP          = sectionBCount * (sectionBCount + 1) / 2
                         — triangular: 1→1, 2→3, 3→6, 4→10, 5→15

EOG Storage VP         = floor(food / 2)
                       + floor(luxury / 3)
                       + floor(health / 3)
                       + floor(education / 3)
                       (Influence not counted)

EOG Cash VP            = floor(cash / 15)

Total EOG VP estimate  = Policy + Storage + Cash
```

UI labels this as "EOG VP" without the ⚠ caveat that WC needed —
formula is rulebook-grounded.

---

## 5. Round 1 Strategy Note

Dismissable banner (`mc-r1-banner-dismissed` in localStorage):

> **Round 1 tip:** Middle Class scoring rewards Section B policies at
> game end (triangular VP: 1/3/6/10/15). Focus your influence and bills
> on holding policies 1–5 in section B. Food is mandatory — make sure
> revenue + cash covers `population × cheapest food`.

---

## 6. UI Layout

Same two-column layout as WC, single-column on `<768px`.

```
┌─────────────────────────────────────────────────┐
│  Middle Class Companion          [ R1 defaults ] │
├─────────────────┬───────────────────────────────┤
│  INPUTS         │  FINANCIALS                    │
│  Demographics   │  Tax mult: 5                   │
│  Companies      │  Income tax: 40¥               │
│  Goods prices   │  Employment tax: 10¥           │
│  Storage        │  Food bill: 120¥ (mandatory)   │
│  Policies       │                                │
│                 │  Revenue [input]               │
│                 │  Wages received [input]        │
│                 │  Net cash: 200¥ → EWP +13      │
│                 │                                │
│                 │  Prosperity actions:           │
│                 │    Health bundle:    80¥       │
│                 │    Education bundle: 80¥       │
│                 │    Luxury bundle:    80¥       │
│                 │    → 3 boosts affordable       │
│                 │  Prosperity: 0 → 4 potential   │
│                 │                                │
│                 │  ALERTS                        │
│                 │  ✓ No loan risk                │
│                 │  ⚠ Boost lost (ops ≤ prosp)    │
│                 │                                │
│                 │  POLICY MAP                    │
│                 │  🟢 N · 🟡 N · 🔴 N            │
│                 │  EOG Policy VP: N              │
│                 │  EOG Storage VP: N             │
│                 │  EOG Cash VP: N                │
│                 │  EOG Total: N                  │
└─────────────────┴───────────────────────────────┘
```

No Trade Unions panel — MC doesn't form unions.

---

## 7. Component Breakdown

New components in `apps/web/app/tools/middle-class/`:

| File | Purpose |
|---|---|
| `page.tsx` | Route entry; reducer + localStorage |
| `_components/InputPanel.tsx` | Inputs: demographics, companies, goods, storage, policies |
| `_components/FinancialsCard.tsx` | Taxes, food bill, revenue input, prosperity actions, EWP |
| `_components/ActionAlerts.tsx` | Loan risk + scoring-boost-lost alerts |
| `_components/PolicyMap.tsx` | Stoplight grid + chip summary + EOG VP breakdown |
| `_components/RoundOneBanner.tsx` | Dismissable Section-B strategy tip |

No TradeUnionPanel.

Shared components: reuse `Counter` from `apps/web/components/shared/`.

---

## 8. New TypeScript Module

`apps/web/lib/tools/mc-companion.ts` — pure functions, no side effects.

```ts
export type IndustryColour = 'red' | 'blue' | 'yellow' | 'green' | 'purple';
export type PolicyPosition = 'A' | 'B' | 'C';
export type PolicyId =
  | 'fiscal' | 'laborMarket' | 'taxation' | 'health' | 'education'
  | 'foreignTrade' | 'immigration';

export interface MCInputs {
  population: number;
  prosperity: number;            // 0..5
  cashInBank: number;
  revenue: number;               // collected this round from own companies
  wagesReceived: number;         // wages own workers received from elsewhere

  operationalOwnCompanies: number;       // 0..8
  companiesEmployedElsewhere: number;    // 0..10

  goods: {
    food:    { cc?: number; mcSelf?: number; foreign?: number };
    luxury:  { cc?: number; mcSelf?: number; foreign?: number };
    health:  { cc?: number; mcSelf?: number; state?: number };
    edu:     { cc?: number; mcSelf?: number; state?: number };
    influence: { state?: number };
  };

  storage: {
    food: number; luxury: number; health: number; education: number;
    influence: number;  // not counted in EOG VP but tracked
  };

  policies: Record<PolicyId, PolicyPosition>;
}

export interface MCOutputs {
  taxMultiplier: number;
  incomeTaxPerUnit: number;
  mcIncomeTax: number;
  mcEmploymentTax: number;
  totalTaxes: number;

  cheapestFoodPrice: number;
  cheapestLuxuryPrice: number;
  cheapestHealthPrice: number;
  cheapestEduPrice: number;
  influencePrice: number;
  cheapestFoodSource: 'cc' | 'mcSelf' | 'foreign';
  cheapestLuxurySource: 'cc' | 'mcSelf' | 'foreign';
  cheapestHealthSource: 'cc' | 'mcSelf' | 'state';
  cheapestEduSource: 'cc' | 'mcSelf' | 'state';

  foodBill: number;
  healthBundleCost: number;
  eduBundleCost: number;
  luxuryBundleCost: number;
  influenceBundleCost: number;

  mandatoryOutlay: number;
  netCashAfterMandatory: number;
  excessWealthPoints: number;

  scoringBoost: 0 | 1;
  maxBoostsAfforded: number;     // 0..3 (health/edu/luxury)
  prosperityPotential: number;   // capped at 5

  loanRisk: boolean;
  scoringBoostLost: boolean;

  policyStoplight: Record<PolicyId, 'good' | 'neutral' | 'trouble'>;
  goodCount: number;
  neutralCount: number;
  troubleCount: number;
  sectionBCount: number;         // among policies 1..5

  eogPolicyVp: number;           // triangular(sectionBCount)
  eogStorageVp: number;
  eogCashVp: number;
  eogTotalVp: number;
}

export function computeMC(inputs: MCInputs): MCOutputs;
```

---

## 9. Open Questions

1. ✅ **MC bundle composition** — Food mandatory; Health/Edu/Luxury/Influence optional per-action bundles, each pop × cheapest. Influence used for lobbying not prosperity.
2. ✅ **EOG VP formula** — Rulebook page 25; triangular by Section B count + storage thirds + cash/15. No caveat needed.
3. ✅ **Companies abstraction** — Two scalars (`operational own`, `employed elsewhere`); per-company tracking deferred.
4. ⚠ **Revenue input** — Currently a single user-entered scalar. v2 may model per-company revenue tables once card data is sourced.

---

## 10. Out of Scope

- Per-company revenue + slot tracking
- Capitalist / State companion screens (separate specs)
- Cross-faction integration with `/play/[gameId]`
- Foreign Trade tariff arithmetic (user enters post-tariff prices)
