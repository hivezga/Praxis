# [Spike] Phase 3: UI design — Claude Design

## Context
Before any UI is written or rewritten, every screen needs a precise visual spec. Claude Design (Anthropic Labs) produces HTML exports that Claude Code can implement directly — eliminating guesswork between design intent and implementation. This phase is done entirely in Claude Design, not in code.

## Acceptance criteria
- [ ] HTML export exists in `docs/design/` for every screen listed below
- [ ] Each design covers the dark theme (background #0b0f17, existing color tokens)
- [ ] Mobile and desktop layouts are designed separately where they differ
- [ ] The four faction colors match existing tokens: Working (red-700), Middle (green-700), Capitalist (blue-700), State (purple-700)
- [ ] All designs are handed off to Claude Code before Phase 4 or Phase 5 begins

## Screens to design

### Web (desktop + responsive mobile)
- [ ] Home — mode selector (solo / party cards) + saved games list
- [ ] New game setup — mode, expansion toggles, player count, faction selection grid
- [ ] Main board — desktop layout: sticky round/phase header + 4 faction panels in a responsive grid
- [ ] Policy tracks panel — 7 tracks, A/B/C selector, pending bill highlight
- [ ] Market + population pools panel — goods counters + pool counters
- [ ] Bills panel — proposed bills list with proposer badge
- [ ] End-of-round wizard — multi-section modal: taxes, wages, welfare, VP preview, editable fields
- [ ] Rules cheatsheet — static reference: taxes, wages, VP formulas, tariff table

### Mobile (full-screen tabs)
- [ ] Main board — tab navigation: Global tab + one tab per active faction
- [ ] Working Class panel — money, VP, population, trade unions, storage, notes
- [ ] Middle Class panel — money, capital, companies, storage, notes
- [ ] Capitalist Class panel — revenue, capital, companies, Free Trade Zone, notes
- [ ] State panel — treasury, legitimacy tracks, public services, notes
- [ ] Party mode: Create room screen — large room code + QR code
- [ ] Party mode: Join room screen — 6-char code input
- [ ] Party mode: Lobby — connected players with faction icons, Start Game (host only)
- [ ] Solo mode: Automa tracker panel — VP, money, influence per opponent faction

## Technical notes
- Export format: standalone HTML (not PDF) — Claude Code will implement from these exports
- Save all exports to `docs/design/<screen-slug>.html`
- Design system to maintain: dark bg, slate text ramp, Tailwind-compatible class tokens, `Counter` component pattern (+/− buttons flanking a number input)
- Reference the existing app at `apps/web/` for current layout — improve, don't redesign from scratch

## Metadata
- **Type**: Spike
- **Priority**: High
- **Effort**: L (1–2 days in Claude Design)
- **Blocked by**: none (can run in parallel with Phase 1 and 2)
- **Blocks**: Phase 4 (web UI refresh), Phase 5.5 (mobile UI implementation)
