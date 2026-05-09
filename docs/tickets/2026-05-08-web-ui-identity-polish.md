# [Feature] Web UI identity polish + responsive overhaul

## Context
Current `apps/web` UI is functional but reads as generic — tokens and editorial typography exist (`apps/web/app/globals.css`, `apps/web/tailwind.config.ts`) yet the surface treatment, button states, and layout density don't carry Hegemony's political-serious tone. Buttons also overflow or wrap awkwardly at narrow widths and at browser zoom > 125 %, breaking the table-side experience this app is meant for. This ticket pulls the existing token system into a coherent civic-poster identity and makes every interactive surface fully responsive across phone, tablet, desktop, and zoomed states.

## User story
As a player tracking a Hegemony game on a phone, tablet, or laptop, I want the app to feel like an extension of the game's political theme and to remain legible and tappable at any zoom level or screen size, so that I can focus on play instead of fighting the UI.

## Acceptance criteria
- [ ] Every button label fits its container without truncation, ellipsis, or overflow at viewport widths 320 / 375 / 414 / 768 / 1024 / 1440 px.
- [ ] Every button label fits at browser zoom levels 80 %, 100 %, 125 %, 150 %, 200 % on a 1280 × 800 viewport.
- [ ] No horizontal scroll appears on any route at viewport widths ≥ 320 px.
- [ ] All interactive targets meet minimum 44 × 44 CSS px tap area on touch viewports.
- [ ] Color-contrast ratio ≥ 4.5 : 1 for body text and ≥ 3 : 1 for large text and UI components in both `:root` (dark) and `.theme-light` themes — verified with axe DevTools.
- [ ] Every interactive element has a visible focus ring distinct from hover state.
- [ ] Full keyboard navigation: Tab order is logical, no traps, all actions reachable without mouse.
- [ ] Screen-reader labels (`aria-label` / `aria-describedby`) on icon-only buttons, faction selectors, and resource counters.
- [ ] Identity pass establishes a documented visual language: civic-poster aesthetic — bold sans display type, strong color blocks, propaganda-inspired accent treatment — applied consistently across home, `/play`, `/party-test`, `/rules-cheatsheet`.
- [ ] Faction colors (`working` / `middle` / `capitalist` / `state`) are used as identity anchors, not just decoration — each faction's panel reads as "owned" by that color at a glance.
- [ ] Typography scale uses `clamp()` for fluid sizing between breakpoints; no fixed `text-Xxl` on body copy.
- [ ] Layouts use container queries (`@container`) where component width — not viewport width — should drive layout (e.g. faction cards inside multi-column boards).
- [ ] No raw hex colors, raw pixel font sizes, or raw `px` spacing introduced in components — everything routes through tokens or the Tailwind scale.
- [ ] Dark and light themes both pass all criteria above (theme toggle exists; this ticket does not redesign the toggle, only ensures both states are polished).
- [ ] Non-goal: no changes to game rules, mutations, or Rust core. UI/CSS/copy only.
- [ ] Non-goal: mobile (`apps/mobile`) is out of scope — handled separately once mobile rehab lands.

## Tasks
- [ ] Audit current state: screenshot every route at 375 / 768 / 1440 and at 100 % / 200 % zoom; catalogue overflow, wrapping, and identity-flat issues into a single audit doc in `docs/audits/`.
- [ ] Define identity guide: pick display typeface (consider a free condensed grotesque such as Archivo / Bebas / Inter Tight Display), define poster-style heading treatment, define button shape language (sharp corners vs current `rounded-lg`), document in `docs/design/identity.md`.
- [ ] Update `apps/web/app/globals.css` and `apps/web/tailwind.config.ts`: add `clamp()`-based font scale tokens, container-query plugin, any new identity tokens (block-shadow, poster-stripe, etc).
- [ ] Refactor shared button + control primitives in `apps/web/components/shared/` to use new identity tokens, fluid sizing, and guaranteed text-fit (use `min-w-0`, `flex-wrap`, `text-balance`, or icon-only collapse at narrow widths).
- [ ] Apply identity pass to faction surfaces in `apps/web/components/classes/` — each faction's panel anchored by its color, poster-style header treatment, faction symbol/icon if practical.
- [ ] Apply identity pass to board surfaces in `apps/web/components/board/`.
- [ ] Apply identity pass to scoring + end-round surfaces in `apps/web/components/scoring/`, `apps/web/components/endRound/`.
- [ ] Apply identity pass to party surfaces in `apps/web/components/party/` and `apps/web/app/party-test/`.
- [ ] Apply identity pass to `apps/web/app/page.tsx` (home/setup) and `apps/web/app/rules-cheatsheet/`.
- [ ] Run a11y pass: axe DevTools on every route, fix all serious + critical issues, add missing ARIA labels.
- [ ] Run responsive pass: Playwright script that snapshots every route at the 6 widths × 5 zoom levels listed above; review snapshots, fix any clipped buttons or overflow.
- [ ] Run keyboard pass: Tab through every route, fix focus-ring gaps and any missing skip-links.
- [ ] Manual cross-browser smoke: Chrome, Safari, Firefox at 100 % and 150 % zoom on a real laptop.

## Technical notes
- Token system already in place — extend, do not replace. See `apps/web/app/globals.css` `:root` + `.theme-light` blocks and `apps/web/tailwind.config.ts` `theme.extend.colors`.
- Existing component primitives `panel`, `panel-quiet`, `editorial-h1/h2/h3` already define an editorial direction; this ticket pivots that toward civic-poster (heavier weights, stronger color blocks) without throwing the system away.
- For fluid typography use `clamp(min, preferred, max)` directly in the Tailwind theme via arbitrary values or a plugin — avoid hand-rolling `text-` classes per breakpoint.
- For component-driven layouts use Tailwind's `@tailwindcss/container-queries` plugin (add to `tailwind.config.ts` plugins).
- For text-fit guarantees prefer CSS-only solutions (`min-w-0` + `flex-wrap`, `text-balance`, `text-pretty`, responsive truncation) over JS-measured fitting.
- Faction tokens `working` / `middle` / `capitalist` / `state` (red / green / blue / purple) are doctrinal — do NOT change hex values, only how they're applied.
- Game-state code lives in Rust (`crates/hegemony-core/`); this ticket must not touch `apps/web/lib/store/`, `apps/web/lib/wasm.ts`, or any mutation logic.
- Reference: Phase 4 (`docs/tickets/2026-04-26-phase-4-web-ui-refresh.md`) and Phase 9 (`docs/tickets/2026-04-26-phase-9-launch-polish.md`) for prior intent and what's already shipped.
- A11y target: WCAG 2.2 AA. Use axe DevTools browser extension for verification.
- Risk: identity pivot may surface regressions in dense screens (board, scoring) — keep a feature branch and review side-by-side with current `main` before merge.

## Metadata
- **Type**: Feature
- **Priority**: High
- **Effort**: XL (> 2 days)
- **Blocked by**: none
- **Blocks**: none
