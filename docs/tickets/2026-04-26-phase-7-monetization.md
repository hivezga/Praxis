# [Feature] Phase 7: Monetization — AdMob ads + one-time IAP

## Context
The app is free with Google AdMob ads. A one-time in-app purchase ("Remove Ads") permanently removes them. No subscription, no account required. Ad placements must be unobtrusive — they appear only on non-gameplay screens so they never interrupt a session at the table.

## User story
As a free user, I want to use the full app with occasional ads so that I don't have to pay upfront. As a paying user, I want to pay once to remove ads permanently.

## Acceptance criteria
- [ ] Ads appear on the Home screen (banner, footer) and the Saved Games list (banner, footer)
- [ ] No ads appear on any gameplay screen (board, faction panels, end-of-round wizard, rules cheatsheet)
- [ ] No ads appear after the "Remove Ads" purchase is confirmed
- [ ] The "Remove Ads" purchase is a one-time non-consumable product on the Play Store
- [ ] Tapping "Restore Purchase" recovers the ad-free state on a reinstall or new device (Play Store account-linked)
- [ ] Ad-free state persists across app restarts
- [ ] The app builds and runs correctly with no AdMob API key in development (test ads shown)

## Tasks

### 7.1 — Ads
- [ ] Create Google AdMob account and register the Praxis Android app
- [ ] Add `react-native-google-mobile-ads` to `apps/mobile/`
- [ ] Configure AdMob App ID in `app.json` / native build config
- [ ] Create `AdBanner` component: renders an AdMob banner in production, a placeholder in development
- [ ] Add `AdBanner` to the bottom of the Home screen
- [ ] Add `AdBanner` to the bottom of the Saved Games list
- [ ] Implement `useAdFree()` hook: reads `isAdFree` from AsyncStorage, returns boolean
- [ ] Gate all `AdBanner` renders behind `!isAdFree`

### 7.2 — One-time IAP
- [ ] Create `praxis_remove_ads` as a one-time (non-consumable) product in the Play Store console
- [ ] Add `expo-in-app-purchases` to `apps/mobile/`
- [ ] Implement `PurchaseService`:
  - `getProduct()` — fetch product info (price, title) from Play Store
  - `purchase()` — initiate purchase flow
  - `onPurchaseConfirmed()` — set `isAdFree = true` in AsyncStorage
  - `restorePurchases()` — query Play Store for prior purchases, re-apply ad-free if found
- [ ] Add "Remove Ads" button on Home screen (visible only when not ad-free) showing live price from Play Store
- [ ] Add "Restore Purchase" link in a Settings or About screen
- [ ] Test complete purchase flow in a closed testing track before production

## Technical notes
- AdMob test ads must be shown during development to avoid policy violations (use test device IDs)
- The `praxis_remove_ads` product must be created in Play Console before building the production APK — the product ID is hardcoded in the app
- `expo-in-app-purchases` handles Play Store receipt verification client-side — no server needed for a simple one-time purchase
- `isAdFree` is stored in AsyncStorage (key: `praxis.adFree`) — boolean, not encrypted (no payment data stored locally)
- Do not show ads to users who have an active purchase even before they tap "Restore" — call `restorePurchases()` on app launch silently

## Metadata
- **Type**: Feature
- **Priority**: Medium
- **Effort**: M (half day)
- **Blocked by**: Phase 5 (Expo mobile app)
- **Blocks**: Phase 8 (Play Store release — IAP product must exist before submission)
