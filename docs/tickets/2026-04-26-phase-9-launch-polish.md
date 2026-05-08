# [Feature] Phase 9: Launch polish

## Context
Before promoting to the Production track, the app needs to be robust enough for players who have never seen it before and for network edge cases in party mode. This phase adds crash reporting, onboarding, deep links, and basic performance safeguards.

## User story
As a first-time user, I want to understand what Praxis does within 30 seconds of opening it so that I can start tracking my game without reading a manual.

## Acceptance criteria
- [ ] A first-time user can navigate from Home → Setup → Board → End-of-round wizard without any external help
- [ ] Crash rate is below 1% across 7 days of Closed Testing
- [ ] A party invite link (`praxis://join/XXXXXX`) opens the Join Room screen with the code pre-filled
- [ ] Tapping the share button on the Create Room screen produces a shareable Android intent with the deep link
- [ ] The board renders in under 100ms on a mid-range device (Snapdragon 665 class)
- [ ] When a party peer loses network, they see a "Reconnecting…" banner — not a crash or a blank screen
- [ ] Onboarding is shown only on first launch and is skippable

## Tasks

### Crash reporting
- [ ] Add Sentry React Native SDK (`@sentry/react-native`)
- [ ] Wrap the root layout in a Sentry error boundary
- [ ] Wrap each faction panel in an individual error boundary with a fallback ("This panel crashed — tap to reload")
- [ ] Configure Sentry DSN via EAS environment variable (never hardcoded)

### Onboarding
- [ ] 3-screen swipeable walkthrough shown on first launch only:
  1. "Praxis tracks Hegemony so you don't have to do the math"
  2. "Solo mode — one device, all factions. Party mode — one device per player."
  3. "Tap + and − to adjust any value. Everything saves automatically."
- [ ] "Skip" button on every screen; "Get started" on the last screen
- [ ] Store `hasSeenOnboarding = true` in AsyncStorage on completion or skip

### Deep links
- [ ] Register `praxis://` URI scheme in the Expo bare app manifest
- [ ] Handle `praxis://join/{roomCode}` — navigate to Join Room screen with code pre-filled
- [ ] "Share invite" button on Create Room screen uses Android `Share` API to share `praxis://join/{roomCode}`
- [ ] Test deep link from a messaging app (WhatsApp, SMS)

### Performance
- [ ] Profile faction panel render time with React Native's `Systrace` or `react-native-performance`
- [ ] Ensure no faction panel re-renders when an unrelated faction's state changes (verify Zustand selectors are scoped)
- [ ] Lazy-load the end-of-round wizard (do not include in the initial bundle)

### Offline / network handling
- [ ] Detect network loss via `@react-native-community/netinfo`
- [ ] In party mode: show persistent amber banner "Reconnecting…" when disconnected; auto-dismiss on reconnect
- [ ] Solo mode is fully offline — no banner needed

## Technical notes
- Sentry free tier (5,000 errors/month) is sufficient for the initial user base
- Expo Router handles deep links natively — register the scheme in `app.json` under `expo.scheme`
- Zustand selectors: each panel should select only its own class state (e.g., `useGame(s => s.state?.classes.working)`) — not the full `GameState` — to prevent cross-panel re-renders
- The onboarding walkthrough does not need animation — a simple `FlatList` with `pagingEnabled` is sufficient

## Metadata
- **Type**: Feature
- **Priority**: Medium
- **Effort**: L (1–2 days)
- **Blocked by**: Phase 5 (Expo mobile app), Phase 6 (party mode)
- **Blocks**: none (final phase before production promotion)
