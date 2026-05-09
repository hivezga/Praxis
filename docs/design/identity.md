# Praxis — Visual Identity (civic-poster)

Status: established 2026-05-09 as part of `2026-05-08-web-ui-identity-polish.md`.

## Tone

Praxis is a companion tracker for *Hegemony — Lead Your Class to Victory*, a game about class struggle, policy, and political rhetoric. The UI carries a **civic-poster** tone: flat blocks of color, condensed slogans, hard edges, propaganda restraint. Not a news app, not a productivity app. Closer to a campaign printout pinned to a school corkboard.

## Type system

Three families, each with one purpose. Never mix purposes.

| Family | Font | Weight | Purpose |
|---|---|---|---|
| Display | **Archivo Black** | 900 | Posters: page titles, faction headers, "STRIKE", "ELECT". Always tracked; almost always uppercase. |
| Body | **IBM Plex Sans** | 300–600 | UI labels, button text, descriptions, prose. |
| Serif | **Crimson Pro** | 300–500 (italic OK) | Editorial commentary: eyebrows, hints, marginalia, voice asides. |
| Mono | **IBM Plex Mono** | 400–600 | Numbers (tabular figures). VP, money, counts. |

Display is the new entrant. Crimson Pro stays — its italic is the "voice in the margin" that contrasts the slab Archivo blocks.

### Fluid scale

Everything routes through `clamp()` tokens. No fixed `text-Xxl` on body copy. Tailwind exposes:

| Token | Min | Pref | Max | Use |
|---|---|---|---|---|
| `text-poster-xl` | 2.5rem | 8vw | 5rem | hero / page titles |
| `text-poster-lg` | 1.875rem | 5vw | 3.5rem | section banners |
| `text-poster-md` | 1.25rem | 3vw | 1.875rem | faction headers |
| `text-fluid-lg` | 1rem | 1.5vw | 1.25rem | body lede |
| `text-fluid-base` | 0.875rem | 1vw | 1rem | normal body |
| `text-fluid-sm` | 0.75rem | 0.85vw | 0.875rem | secondary |

## Color

Tokens stay as defined in `globals.css` `:root` and `.theme-light`. **Do not introduce raw hex.** Faction colors stay doctrinal:

| Faction | Hex | Role |
|---|---|---|
| Working | `#dc2626` | Labor / red banner |
| Middle | `#16a34a` | Companies / green |
| Capitalist | `#2563eb` | Capital / blue |
| State | `#9333ea` | Treasury / purple |

Faction colors are **identity anchors**, not just borders:
- Each faction panel gets a left **colored rail** (4–6 px wide) plus a **heavy color band** at the top with the faction display label in Archivo Black.
- Selected faction buttons use `bg-{faction}/15` + `text-{faction}` + 2 px `border-{faction}`.
- Use `bg-{faction}/[0.06]` as a panel tint, not a full-bleed fill.

Two new semantic tokens:

| Token | Use |
|---|---|
| `--positive` | Net cash gain, "passed" bills. Replaces `emerald-400`. |
| `--positive-soft` | Hover/tint of positive. |

## Shape language

- **Buttons & chips**: `rounded-sm` (2 px). Sharper than today's `rounded-md`. Carries the pamphlet feel.
- **Cards / panels**: `rounded-md` (4 px). Slightly softer for surface restraint.
- **Modals**: `rounded-md`. No deep blur — a hard 1 px outline + heavy shadow.
- **Tap targets**: every button at least **44 × 44** CSS px. Use `min-h-11 min-w-11` (which equals 44 px in default Tailwind).

## Surface treatments

- **Poster header**: `bg-{faction}` block, padded, uppercase Archivo Black title, white-on-color. Replaces today's faction panel header.
- **Stripe**: a 2 px `bg-{faction}` rail down the left edge of every faction panel.
- **Eyebrows**: italic Crimson, all caps, 0.3em tracking. Already in use; keep.
- **Block-shadow**: a flat offset shadow `shadow-poster` for primary CTAs (no blur, just an offset block — `2px 2px 0 currentColor` style). Used sparingly: hero CTA, "Start game", "Begin".

## Button states

| State | Treatment |
|---|---|
| Default | Surface bg, 1 px rule border, body weight 500. |
| Hover | Surface darkens, border strengthens. |
| Active | Slightly inset (use `active:translate-y-px`). |
| Focus-visible | 2 px accent ring, 1 px offset, distinct from hover. |
| Disabled | 40% opacity, not-allowed cursor. |
| Primary | Accent fill, accent-ink text, optional `shadow-poster`. |
| Danger | Danger fill (15%), danger border, danger ink. |
| Faction-anchored | `bg-{faction}/15`, `text-{faction}`, `border-{faction}/40`. |

## Layout

- **Container queries** on faction panels (`@container`). Their internal grid responds to *their own width*, not viewport — important when one panel is rendered solo (Solo mode) vs. side-by-side.
- **No fixed `px` spacing in components.** Use Tailwind's spacing scale.
- **Min-w-0** on every flex child whose content can be long, plus `flex-wrap` on toolbars. No truncation as the default — wrap before clip.
- **Text-balance** on poster titles.

## Accessibility

WCAG 2.2 AA target.
- Body text contrast ≥ 4.5:1 in both themes.
- Focus rings always visible, never suppressed.
- Icon-only buttons get `aria-label`.
- Color is never the *only* signal of state — always pair with text or shape.

## Out of scope (this guide)

- Mobile (`apps/mobile`) — separate identity pass once mobile rehab lands.
- Game rules, mutations, Rust core. UI/CSS/copy only.
