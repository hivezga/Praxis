# [Feature] Phase 5: Expo mobile app (Android)

## Context
The Android app shares the same Rust game logic as the web app but needs a native shell for Play Store distribution, AdMob, and in-app purchases. Expo (bare workflow) with EAS Build provides the Play Store pipeline without requiring a local Android Studio setup on macOS.

## User story
As a player, I want to install Praxis on my Android phone from the Play Store so that I can use it at the table without opening a browser.

## Acceptance criteria
- [ ] `apps/mobile/` is a working Expo bare workflow project
- [ ] EAS development build installs on a physical Android device
- [ ] All four faction panels are playable end-to-end on the device
- [ ] End-of-round wizard opens and applies correctly on a 390px-wide screen
- [ ] Game state persists across app restarts via AsyncStorage
- [ ] `eas build --platform android --profile production` produces a signed AAB
- [ ] The AAB can be uploaded to Play Store internal testing track

## Tasks

### 5.1 — Scaffold
- [ ] `expo init apps/mobile --template bare-minimum`
- [ ] Add Expo Router (`expo-router`) and configure file-based navigation
- [ ] Add NativeWind (Tailwind for React Native) and mirror the web design tokens
- [ ] Create `eas.json` with `development`, `preview`, and `production` build profiles
- [ ] Wire `apps/mobile` into pnpm workspace

### 5.2 — Rust native module (UniFFI)
- [ ] Add `uniffi` and `uniffi_macros` to `crates/hegemony-core/Cargo.toml`
- [ ] Annotate the public API with `#[uniffi::export]`
- [ ] Run `cargo uniffi-bindgen generate` to produce Kotlin bindings
- [ ] Create `apps/mobile/modules/hegemony/` as an Expo native module
- [ ] Implement the Kotlin side of the Expo module wrapping the UniFFI Kotlin API
- [ ] Add EAS custom build plugin to compile `hegemony-core` as `libhegemony.so` for `arm64-v8a` and `x86_64`
- [ ] Verify the module is callable from TypeScript in a development build

### 5.3 — State management
- [ ] Extract Zustand store logic to `packages/store/` (shared between web and mobile)
- [ ] Create `apps/mobile/lib/persistence/asyncStorage.ts` implementing `PersistenceAdapter`
- [ ] Wire `asyncStorageAdapter` as the default adapter in the mobile store
- [ ] Verify game state survives app kill + reopen

### 5.4 — Navigation
- [ ] `/` — Home screen (mode selector + saved games)
- [ ] `/play/setup` — New game setup
- [ ] `/play/[gameId]` — Game board (bottom tab navigator: Global, Working, Middle, Capitalist, State — only show active factions)
- [ ] `/rules` — Rules cheatsheet (static scroll view)

### 5.5 — UI implementation
- [ ] Implement all screens from `docs/design/` exports using NativeWind
- [ ] Working Class panel — full feature parity with web
- [ ] Middle Class panel — full feature parity with web
- [ ] Capitalist Class panel — full feature parity with web (HideCurtain as blur overlay)
- [ ] State panel — full feature parity with web
- [ ] Global Board tab — policy tracks, market, pools, bills
- [ ] End-of-round wizard as a bottom sheet modal (`@gorhom/bottom-sheet`)
- [ ] Round/phase header as a sticky top bar

## Technical notes
- Bare workflow (not Expo Go managed) is required because UniFFI native modules cannot run in Expo Go
- EAS Build cloud compiles the Android native code — no local Android SDK needed
- NativeWind v4 uses the same Tailwind config as the web app — share `tailwind.config.ts` via the pnpm workspace
- `AsyncStorage` is the React Native equivalent of `localStorage`; the `PersistenceAdapter` interface in `lib/store/persistence/adapter.ts` makes this a one-file swap
- UniFFI Kotlin bindings are generated once per Rust API change, not on every build

## Metadata
- **Type**: Feature
- **Priority**: High
- **Effort**: XL (> 2 days)
- **Blocked by**: Phase 1 (Rust core), Phase 3 (UI design)
- **Blocks**: Phase 6 (party mode), Phase 7 (monetization), Phase 8 (Play Store release)
