# Web UI cross-browser smoke — 2026-05-09

Manual companion to the automated axe + snapshot grid for ticket
`2026-05-08-web-ui-identity-polish.md`. Snapshots verify layout in headless
chromium across widths/zooms; axe verifies WCAG AA. This checklist closes the
remaining gap: real Safari, real Firefox, real laptop, real user zoom.

## Setup

- Real laptop, 1280 × 800 minimum.
- Run `pnpm --filter web build && pnpm --filter web start`.
- Open http://localhost:3000.
- Test under both system theme prefs — toggle in the home-page footer (Auto / Dark / Day) covers it without touching system settings.
- Browser zoom: keyboard shortcut `Cmd +` / `Cmd 0`.

## Per-cell walk-through (~5 min)

For each cell of the matrix below, run this script and tick the box if no
finding. If a finding, log it under "Findings" with a one-liner.

1. **/** — masthead: faction stripe row visible, "PRAXIS" in Archivo Black not
   clipped. Mode cards render side-by-side at desktop, stacked at narrow.
   Onboarding modal opens on first visit, dismisses on Skip / Begin, focus
   returns to body.
2. **/play/setup** — fill name, toggle classes (selected state shows solid
   faction colour band, unselected shows neutral), change player count
   (selected button uses amber accent), "Start game" CTA is the loud
   stone-near-black poster button. Click Start.
3. **/play/[id]** (after Start) — Round/Phase header sticky at top. Counter
   `+`/`−` works on every panel. Tab through panel: focus rings visible.
   Press End round → wizard modal opens, Tab cycles within modal,
   Escape closes it and focus returns to End-round button.
4. **/rules-cheatsheet** — tables don't horizontally overflow at any width.
   Faction tag colour swatches render solid colour blocks.
5. **/play/join** — code input: 6 boxes fill row, no overflow, paste of a
   6-char code distributes to all boxes, focus lands on last box.
6. **Theme toggle** — Auto / Dark / Day cycles. No FOUC. Both themes pass the
   above without finding.

## Matrix

|             | 100 % zoom | 150 % zoom |
| ----------- | ---------- | ---------- |
| **Chrome**  | [ ]        | [ ]        |
| **Safari**  | [ ]        | [ ]        |
| **Firefox** | [ ]        | [ ]        |

## Browser-specific risks (watch for these first)

- **Safari** — `text-balance` (Safari 17.4+): poster headlines should not
  overshoot card width. `backdrop-blur-sm` on Modal: confirm not too heavy on
  older Safari.
- **Firefox** — `@container` queries (Firefox 110+ Feb 2023): faction panels
  should respond to *panel width*, not viewport. Open Solo mode, toggle to
  show one class only — its grid should re-flow as the panel expands to fill
  the column.
- **All** — `clamp()` fluid type is widely supported but verify no fallback
  ever paints a `text-Xxl` static fallback.

## Findings

_(none yet)_

## Acceptance

Every cell ticked or every cell has a logged + resolved finding. Then mark
ticket `2026-05-08-web-ui-identity-polish.md` complete.
