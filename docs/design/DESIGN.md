# Bulaa Design System — Clutch

> **For AI agents:** Before any UI, page, email, Discord embed, or marketing surface, read this file and import tokens from `tokens.ts` / `tokens.css`. Do not invent alternate palettes, fonts, or radii.

## Locked brand

| Field | Value |
|---|---|
| Brand system | Clutch |
| Product name | Bulaa |
| Mode | Dark only (no light theme in MVP) |
| Tone | Competitive FPS, paid 5v5 lobbies. Fierce, not casino. |

## Source of truth

| File | Use |
|---|---|
| [`packages/design`](../../packages/design) | Runtime tokens — `@bulaa/design` |
| [`tokens.ts`](../../packages/design/src/tokens.ts) | Colors, fonts, radii, motion, Tailwind theme helper |
| [`tokens.css`](../../packages/design/src/tokens.css) | CSS custom properties — import in app root |

```ts
import { colors, fonts, radius, tailwindTheme } from "@bulaa/design";
```

```ts
import "@bulaa/design/tokens.css";
```

## Personality (copy & UI)

- Short, imperative: "Play." "Join." "Ready." "Start." "Server ready."
- Prefer: lobby, seat, host, entry, prize pool, payout, escrow, vote kick
- Do not use as primary verbs: Find Match, Your pick, draft
- Avoid casino words: jackpot, bet, spin, odds
- MN + EN; Cyrillic must render correctly (IBM Plex / Chakra Petch)

## Color roles

| Token | Hex | Use for |
|---|---|---|
| `bgVoid` | `#070809` | Deepest background / hero void |
| `bgBase` | `#0C0E12` | Default page canvas |
| `bgRaised` | `#14181F` | Panels, modals, cards (sparingly) |
| `bgOverlay` | `#1C222C` | Hover / elevated strips |
| `border` | `#2A3140` | Hairlines, inputs |
| `borderStrong` | `#3D4658` | Focus / strong dividers |
| `text` | `#F4F6F8` | Primary copy |
| `textMuted` | `#8B93A7` | Labels, secondary |
| `textFaint` | `#5C6578` | Placeholders, disabled |
| `primary` | `#C8F542` | CTA, Ready state, brand accent |
| `primaryHover` | `#D6FF66` | Primary hover |
| `primaryPressed` | `#A8D12E` | Primary active |
| `primaryMuted` | `#C8F54226` | Soft selection fills |
| `onPrimary` | `#0A0C08` | Text/icons on primary buttons |
| `accent` | `#6B9BFF` | Links, secondary actions |
| `success` | `#C8F542` | Win, payout credit |
| `warning` | `#FFC53D` | Vote-kick countdown, escrow hold |
| `danger` | `#FF3D4A` | Loss, ban, destructive |
| `info` | `#6B9BFF` | Neutral system notices |
| `money` | `#FFE66B` | Wallet / MNT amounts only |
| `tierPro` | `#C8F542` | Pro / top tiers |
| `tierMid` | `#6B9BFF` | Mid tiers |
| `tierLow` | `#8B93A7` | Lower tiers |

## Typography

| Role | Font | Weight |
|---|---|---|
| Display / brand / H1 | Chakra Petch | 600–700 |
| Body / UI | IBM Plex Sans | 400–600 |
| Mono (IDs, connect, ledger) | IBM Plex Mono | 400–500 |

Google Fonts query (in `tokens.ts` as `fonts.googleFamilies`):

`Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500`

**Scale (desktop):** Display 40/44 · H1 32/38 · H2 24/30 · H3 18/24 · Body 15/22 · Caption 12/16 · Money 20/24 medium tabular

## Radii & chrome

- Radii: `4px` / `5px` / `6px` only — sharp, not pills
- Primary button: solid lime + `onPrimary` label — no glow, no gradients on CTAs
- Tier badges: left accent bar preferred over rounded chips
- One primary CTA per view

## Motion

| Token | ms | Use |
|---|---|---|
| `pickSnap` | 120 | Seat and side selection snap |
| `pickFlash` | 200 | Lime flash on Ready |
| `fade` | 150 | Generic fade |

Countdowns such as the 30s vote-kick window use `warning` at 10s or less and `danger` at 5s or less (`timer` in `tokens.ts`).

## Hard rules (do not break)

1. **Dark only** — no cream/light default theme.
2. **No purple brand accents.** No Inter/Roboto/Arial as primary UI fonts.
3. **Money always** `money` color + tabular nums — never lime text on yellow chips.
4. **Win/loss** use `success` / `danger`, not primary alone for loss states.
5. **Do not invent new brand colors** — extend via opacity of existing tokens if needed.
6. **Cards sparingly** — prefer flat raised panels; no card chrome in heroes.
7. **No casino visual language** — no neon glow stacks, no jackpot gold explosions.

## Product surfaces to style with these tokens

In play order: auth, wallet and deposit, the Play lobby browser, the lobby room (roster, chat, Ready, vote kick), match and server info, result and payout, leaderboard and profile, admin panel, Discord bot embeds (map embed accent to `primary`).

Lobby browser specifics:

- Average rank on a lobby card is a tier badge with a left accent bar, using `tierPro` / `tierMid` / `tierLow`
- Occupancy and ready counts are mono with tabular nums, same treatment as IDs
- One primary CTA per view. Join on the browser, Ready in the room, Start for the host only.
