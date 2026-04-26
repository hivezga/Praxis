# Praxis

A web-based companion tracker for the tabletop game *Hegemony: Lead Your Class to Victory* (with the *Crisis & Control* expansion). Tracks resources, taxes, payments, population, prosperity, legitimacy, policies, bills and VP — so you spend the evening playing instead of doing arithmetic.

> Praxis is an unofficial fan project. *Hegemony* is © Hegemonic Project Games.

## Features

- **Party mode** — 2–4 players share one screen; hidden info gets a curtain.
- **Solo mode** — track your class plus simplified opponent state for the *Crisis & Control* automa.
- **Assisted bookkeeping** — at end-of-round, the app suggests taxes, wages, welfare costs, and prosperity gains; you confirm or override before applying.
- **Live VP totals** for all classes.
- **Browser-only** — game state lives in `localStorage`, no account or server needed. State shape is engineered so a Supabase sync adapter can plug in later.

## Running locally

```bash
npm install
npm run dev      # → http://localhost:3000
npm run typecheck
npm run test     # vitest suite for the rules engine
```

## Project structure

```
app/                 Next.js App Router pages
components/          UI: shared, board, classes, endRound
lib/
  data/              Static configs (policies, starting state)
  game-rules/        Pure rules engine (taxes, vp, end-of-round)
  store/             Zustand store + persistence adapters
  types/             GameState + per-class type definitions
docs/                Bundled rulebook PDFs + disclaimer
```

## Rulebooks

The rulebook PDFs are bundled in `docs/` for convenience — see `docs/README.md` for sources and versions.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Zustand · Vitest.
