# Web UI audit — 2026-05-09

Companion to `docs/tickets/2026-05-08-web-ui-identity-polish.md`. Code-level catalogue of identity-flat issues and responsive risks per route, derived from reading the current `apps/web/` tree (not from screenshots — playwright snapshots can be added later if regressions appear).

## Identity-flat issues (apply across surfaces)

1. **No display typeface.** Headings rely on Crimson Pro `font-light`, which reads as editorial/elegant — not as the bold civic-poster tone the ticket asks for.
2. **Faction colors are decoration, not anchors.** `ClassPanelShell` uses a 2 px rail + colored text on a generic `bg-surface/30` background. Each faction panel reads identical at first glance; you have to look at the title text color to identify which is which.
3. **Buttons all use `rounded-md` + soft surface bg.** No "pamphlet" cue. Primary CTAs (`Start game`, `Begin`, `Apply & advance`) don't visually outweigh secondary ones.
4. **Raw color escapes the token system** — `text-emerald-400`, `text-amber-200`, `text-rose-400` in `ScoringPanel`, `EndRoundWizard`, `ReconnectingBanner`, `PartyBadge`. Should use semantic tokens.
5. **No fluid type.** Body copy uses fixed Tailwind classes (`text-sm`, `text-base`, `text-3xl`). Breaks at zoom > 125 %.

## Per-route responsive risks

### `/` (home)
- Mode cards drop from 2 columns to 1 at `sm` (640 px). Below 375 px, the `editorial-h2` title (`text-3xl`) starts to crowd at 200 % zoom.
- `SavedGamesList` action row: `Open / Share / Export / Delete` all at `text-xs` — at 200 % zoom they wrap awkwardly inside their `flex shrink-0`. Risk of overflow on narrow phones.
- Footer's `flex flex-wrap` works.

### `/play/setup`
- Mode buttons, player count buttons, class buttons all on fixed grids — at 320 px the grid still fits but `font-serif text-sm` labels truncate visually with `desc` lines wrapping.
- "Player count" `btn` row uses `[2,3,4] players` — at 200 % zoom, the buttons grow but the row stays single-line and risks overflow.
- "Start game →" CTA is a `.btn btn-primary` — fine but doesn't scream "this is the action".

### `/play/[gameId]` (game room)
- `RoundPhaseHeader` is the densest UI: round selectors (5), phase selectors (5), Undo, Next, End round, PartyBadge. At `lg` they collapse to a single row. Below `lg`, they stack — but the phase selector uses `flex-1` per item and `min-h-[36px]` (just under WCAG minimum target). At 320 px and 200 % zoom, the 5 phase buttons compete for ~4 px each. Real overflow risk.
- `AutoRunButtons` similar issue: the phase-button `text-[11px]` flex-wraps, but the `Auto / Manual` toggle on the right needs to stay readable.

### `/play/lobby`
- `RoomCodeCard` shows code at `text-5xl` (`tracking-[0.35em]`) — at 320 px wide this is on the edge of overflow. Tracking can push it past container edge.
- Faction picker `grid-cols-2 sm:grid-cols-4` — at 200 % zoom the 4-column desktop layout gets cramped.

### `/play/join`
- `JoinCodeInput`: 6 boxes at `h-14 w-12` with `gap-2`. Total width ≈ 84 px × 6 + 5 × 8 = 544 px + padding. **Will overflow** the `max-w-md` (448 px) container at 100 % zoom — currently held only by `flex justify-between` ad-hoc compression. At narrow viewports, boxes touch.

### `/rules-cheatsheet`
- Tables use `overflow-x-auto` — fine, but headers are `font-serif text-[11px] uppercase italic` which is barely readable in light theme.
- `editorial-h1` at `text-5xl sm:text-6xl` — overshoots on small phones.

### `/party-test`
- `text-5xl` room code with `tracking-[0.3em]` — same overflow risk as lobby.
- Functional only, not user-facing — lower priority for polish.

## A11y gaps

- Several icon-only/symbol buttons missing `aria-label`: BillsPanel `✕`, OnboardingModal page-dot `<span>` lacks role.
- Modal traps focus partially (Escape works) but does not return focus to opener on close, and does not scope tab cycle to modal children.
- Faction-color text on faction-tinted bg in `BillsPanel` proposed-by chips: contrast may fall below 4.5:1 in light theme (`text-working` `#dc2626` on `bg-working/15`).
- `PartyBadge` peer status uses `text-emerald-300/70` — opacity drops contrast below AA.
- `HideCurtain` reveal button is positioned over blurred content but doesn't announce blur state to screen readers.

## Action plan rollup

Mapped to ticket tasks:

| Ticket task | Audit findings addressed |
|---|---|
| Define identity guide | All identity-flat issues |
| Update tokens | Raw `emerald-400` / `amber-200` / `rose-400` escapes; no fluid type |
| Refactor button + control primitives | Tap target < 44 px, no shape language, no min-w-0 + flex-wrap |
| Faction surfaces | Faction colors used decoratively |
| Board surfaces | Round/phase header overflow risk |
| Scoring + end-round | Raw emerald, no semantic positive token |
| Party surfaces | JoinCodeInput overflow, RoomCodeCard tracking, raw amber/danger |
| Home + setup + cheatsheet | SavedGamesList action overflow, table header contrast |
| A11y pass | Missing aria-label, focus-return on modal close, contrast on opacity-tinted text |

Snapshot pass via Playwright is a follow-up — preferable after the identity tokens land so we're not re-snapshotting the in-flight surface.
