# [Feature] Phase 4: Web UI refresh

## Context
After Phase 2 the app runs on the Rust core. After Phase 3 we have precise visual specs from Claude Design. This ticket implements those designs into the Next.js app, replacing the current hand-built components with the polished versions.

## User story
As a player, I want the web app to look and feel polished so that it is pleasant to use at the table on a laptop or tablet.

## Acceptance criteria
- [ ] Every screen matches its Claude Design export (verified visually at 1440px and 768px widths)
- [ ] No fixed-width layouts — all panels reflow correctly between 375px and 1440px
- [ ] All interactive elements (counters, policy tracks, bill proposals) are keyboard-navigable with visible focus rings
- [ ] ARIA labels on all `Counter` +/− buttons and `PolicyTrack` A/B/C selectors
- [ ] Dark theme is consistent — no light backgrounds, no hardcoded hex values outside the Tailwind token layer
- [ ] End-of-round wizard scrolls correctly on small viewports without clipping edit fields
- [ ] `pnpm build` produces no TypeScript errors and no Next.js warnings

## Tasks
- [ ] Implement Home screen from `docs/design/home.html`
- [ ] Implement New game setup from `docs/design/setup.html`
- [ ] Implement Main board desktop layout from `docs/design/board-desktop.html`
- [ ] Implement Policy tracks panel from `docs/design/policy-tracks.html`
- [ ] Implement Market + pools panel from `docs/design/market-pools.html`
- [ ] Implement Bills panel from `docs/design/bills.html`
- [ ] Implement End-of-round wizard from `docs/design/end-round-wizard.html`
- [ ] Implement Rules cheatsheet from `docs/design/rules-cheatsheet.html`
- [ ] Implement Working class panel from `docs/design/panel-working.html`
- [ ] Implement Middle class panel from `docs/design/panel-middle.html`
- [ ] Implement Capitalist class panel from `docs/design/panel-capitalist.html`
- [ ] Implement State panel from `docs/design/panel-state.html`
- [ ] Update Tailwind tokens in `tailwind.config.ts` to match design system
- [ ] Add ARIA labels and keyboard handlers to `Counter` and `PolicyTrack` shared components
- [ ] Verify mobile viewport (375px) — all panels usable without horizontal scroll

## Technical notes
- Do not change any store API or game logic — pure UI layer work
- `globals.css` component layer (`.panel`, `.btn`, `.input`, etc.) should be updated to match the new design tokens rather than deleted
- The `HideCurtain` blur overlay must still work on the Capitalist panel in party mode
- Claude Design exports will be HTML — extract JSX/Tailwind classes from them rather than embedding raw HTML

## Metadata
- **Type**: Feature
- **Priority**: High
- **Effort**: L (1–2 days)
- **Blocked by**: Phase 2 (WASM integration), Phase 3 (UI design)
- **Blocks**: Phase 5.5 (mobile UI — shares design tokens)
