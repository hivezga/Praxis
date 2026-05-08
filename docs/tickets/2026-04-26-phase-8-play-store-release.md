# [Chore] Phase 8: Play Store release

## Context
Praxis needs to be submitted to the Google Play Store and pass review before it can reach public users. This ticket covers everything from signing the APK to getting the app into the Production track. The $25 Play Store developer account one-time fee must be paid before this phase can start.

## Acceptance criteria
- [ ] A signed AAB is produced by `eas submit --platform android --profile production`
- [ ] The AAB passes Play Store pre-launch report with no critical issues
- [ ] Store listing is complete: icon, feature graphic, 8 screenshots, short description, full description, privacy policy URL
- [ ] App is available to testers in the Internal Testing track
- [ ] App is promoted to Production track and publicly downloadable from the Play Store

## Tasks

### Signing
- [ ] Generate Android upload keystore (via EAS or locally with `keytool`)
- [ ] Store keystore credentials in EAS Secrets (never in git)
- [ ] Configure `eas.json` production profile to use the upload keystore

### Store listing assets
- [ ] App icon: 512×512 PNG, no alpha channel, no rounded corners (Play Store adds rounding)
- [ ] Feature graphic: 1024×500 PNG (shown on the store page header)
- [ ] Phone screenshots: 8 screenshots at 1080×1920 (or 9:16 ratio) — capture: Home, Setup, Board (global), Working panel, Capitalist panel, End-round wizard, Party lobby, Rules cheatsheet
- [ ] Short description: ≤80 characters — "Hegemony companion: track resources, taxes, and VP at the table."
- [ ] Full description: ≤4000 characters — include base game + expansion support, party mode, no ads after one-time purchase

### Compliance
- [ ] Create a Privacy Policy page (can be a static Next.js page at `/privacy` on the web app, hosted on Vercel)
- [ ] Enter the Privacy Policy URL in Play Console
- [ ] Complete the age rating questionnaire (target: PEGI 3 / Everyone — no violence, no user content)
- [ ] Complete the data safety form (no personal data collected; local storage only; optional P2P connection via WebRTC)

### Release
- [ ] Upload AAB to Internal Testing track; install on 2+ test devices
- [ ] Fix any issues surfaced by Play Store pre-launch report
- [ ] Promote to Closed Testing (invite 5–10 testers for 1 week)
- [ ] Promote to Open Testing (no invite required, public beta)
- [ ] Promote to Production

## Technical notes
- EAS Build must be run with `--profile production` to produce a release AAB (debug builds cannot be submitted)
- The upload keystore is separate from the app signing key — Play Store manages the signing key; you upload with the upload key
- Privacy policy is required even for apps with no user accounts — WebRTC connections constitute "data transmitted from the device"
- Pre-launch report runs the app on Firebase Test Lab devices — party mode will show as "untested" (P2P cannot be automated); this is acceptable
- App content rating questionnaire: answer "No" to violence, user-generated content, ads targeting children — this yields the lowest (Everyone) rating

## Metadata
- **Type**: Chore
- **Priority**: High
- **Effort**: M (half day, spread across a week for review cycles)
- **Blocked by**: Phase 5 (mobile app), Phase 6 (party mode), Phase 7 (monetization)
- **Blocks**: Phase 9 (launch polish — some polish items require a live store listing)
