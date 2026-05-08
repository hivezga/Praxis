# [Chore] Phase 0: Monorepo foundation

## Context
The current repo is a single Next.js app at the root. To support a Rust crate, a WASM package, and an Expo mobile app alongside the web app, the repo needs to be restructured as a pnpm workspace monorepo. This is the prerequisite for every other phase — nothing else can be built until this layout exists.

## Acceptance criteria
- [ ] `pnpm --filter web dev` starts the existing Next.js app with no errors and no behavior change
- [ ] `cargo test` runs (with zero tests) inside `crates/hegemony-core/`
- [ ] `packages/hegemony-wasm/` directory exists as the designated wasm-pack output target
- [ ] `apps/mobile/` directory exists as a stub (empty Expo bare skeleton)
- [ ] GitHub Actions CI runs on every push: Rust `cargo test` + Next.js `pnpm build`
- [ ] No TypeScript import paths are broken after the move

## Tasks
- [ ] Add `pnpm-workspace.yaml` at repo root listing `apps/*`, `packages/*`, `crates/*`
- [ ] Move all current Next.js files into `apps/web/` and update all internal `@/*` import aliases
- [ ] Update root `package.json` to remove Next.js scripts; add workspace-level `dev`, `build`, `test` scripts
- [ ] Create `crates/hegemony-core/Cargo.toml` (lib crate, edition 2021)
- [ ] Create `crates/hegemony-core/src/lib.rs` with a single placeholder test
- [ ] Create `packages/hegemony-wasm/` with a `.gitkeep` and a `package.json` stub
- [ ] Create `apps/mobile/` with a minimal `package.json` stub
- [ ] Add `.cargo/config.toml` at repo root with `wasm32-unknown-unknown` as a build target
- [ ] Add `.github/workflows/ci.yml`: two jobs — `rust` (cargo test) and `web` (pnpm build)
- [ ] Verify `eslintrc`, `tailwind.config.ts`, `tsconfig.json` paths still resolve correctly from `apps/web/`

## Technical notes
- The existing `@/*` alias in `tsconfig.json` maps to `./` — after the move it must map to `apps/web/`
- `next.config.mjs` does not need changes (it stays inside `apps/web/`)
- Do not touch `lib/`, `components/`, or `app/` contents — only the directory structure changes
- wasm-pack build will later write into `packages/hegemony-wasm/` via `--out-dir`

## Metadata
- **Type**: Chore
- **Priority**: High
- **Effort**: M (half day)
- **Blocked by**: none
- **Blocks**: Phase 1 (Rust core), Phase 5 (Expo mobile)
