---
name: Bulaa — Clutch
description: Dark competitive FPS lobby UI — lime go-signals, tabular money gold, flat tactical surfaces.
colors:
  void: "#070809"
  base: "#0C0E12"
  raised: "#14181F"
  overlay: "#1C222C"
  border: "#2A3140"
  border-strong: "#3D4658"
  text: "#F4F6F8"
  text-muted: "#8B93A7"
  text-faint: "#5C6578"
  primary: "#C8F542"
  primary-hover: "#D6FF66"
  primary-pressed: "#A8D12E"
  primary-muted: "#C8F54226"
  on-primary: "#0A0C08"
  accent: "#6B9BFF"
  success: "#C8F542"
  warning: "#FFC53D"
  danger: "#FF3D4A"
  info: "#6B9BFF"
  money: "#FFE66B"
  tier-pro: "#C8F542"
  tier-mid: "#6B9BFF"
  tier-low: "#8B93A7"
typography:
  display:
    fontFamily: '"Chakra Petch", sans-serif'
    fontSize: "clamp(2rem, 5vw, 2.5rem)"
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Chakra Petch", sans-serif'
    fontSize: "2rem"
    fontWeight: "600"
    lineHeight: "1.1875"
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Chakra Petch", sans-serif'
    fontSize: "1.125rem"
    fontWeight: "600"
    lineHeight: "1.333"
  body:
    fontFamily: '"IBM Plex Sans", sans-serif'
    fontSize: "0.9375rem"
    fontWeight: "400"
    lineHeight: "1.467"
  label:
    fontFamily: '"IBM Plex Sans", sans-serif'
    fontSize: "0.75rem"
    fontWeight: "500"
    lineHeight: "1.333"
    letterSpacing: "0.14em"
  mono:
    fontFamily: '"IBM Plex Mono", monospace'
    fontSize: "0.8125rem"
    fontWeight: "400"
    lineHeight: "1.25"
rounded:
  sm: "4px"
  md: "5px"
  lg: "6px"
spacing:
  page-x: "1rem"
  page-x-sm: "1.5rem"
  header-h: "3.5rem"
  section-gap: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
---

# Design System: Bulaa (Clutch)

## Overview

**Creative North Star: "The Clutch Terminal"**

Bulaa looks like a night-shift ops desk for paid CS2 lobbies: void-black canvas, flat raised panels, and a single lime channel for actions that move money or match state forward. The UI is competitive and impatient—short labels, mono for counts and IDs, gold tabular figures for MNT—not a casino floor with neon stacks or jackpot theatrics.

Implementation tokens live in `@bulaa/design` (`packages/design/src/tokens.ts`, `tokens.css`). Import tokens in code; do not invent parallel palettes or radii. Dark mode only for MVP.

**Key Characteristics:**

- Flat depth via background steps (`void` → `base` → `raised` → `overlay`), not drop shadows
- Lime `primary` for the one primary CTA per view; blue `accent` for links and secondary emphasis
- `money` color reserved for wallet and prize amounts with tabular numerals
- Sharp 4–6px radii; tier badges use a left accent bar, not pill chips
- MN + EN copy; Chakra Petch display + IBM Plex body/mono

## Colors

A cold blue-gray stack with one high-chroma lime accent and a separate gold money lane.

### Primary

- **Signal Lime** (`#C8F542`): Primary buttons, Ready state, positive go-actions. Rare enough to read as “do this now.”
- **Signal Lime Hover** (`#D6FF66`): Primary hover only.
- **Signal Lime Pressed** (`#A8D12E`): Primary active/pressed.
- **Signal Lime Muted** (`#C8F54226`): Soft selection fills (e.g. highlighted rows).

### Secondary

- **Link Blue** (`#6B9BFF`): Text links, secondary actions, mid-tier accent, info notices. Not a second primary button color.

### Tertiary

- **Payout / Win reuse** (`#C8F542` as `success`): Wins and payout credit—same hue as primary but semantic role is outcome, not CTA.

### Neutral

- **Void** (`#070809`): Deepest backdrop, hero void, dialog scrim.
- **Base** (`#0C0E12`): Default page canvas (`body`).
- **Raised** (`#14181F`): Panels, modals, cards—use sparingly.
- **Overlay** (`#1C222C`): Hover strips, empty seat segments, subtle elevation.
- **Border** (`#2A3140`): Hairlines, inputs, dividers.
- **Border Strong** (`#3D4658`): Focus rings, wizard modal outline.
- **Text** (`#F4F6F8`): Primary copy.
- **Text Muted** (`#8B93A7`): Labels, secondary lines, joined-but-not-ready seat meter segments.
- **Text Faint** (`#5C6578`): Placeholders, disabled, meta labels.
- **On Primary** (`#0A0C08`): Label color on lime buttons.

### Semantic & domain

- **Money Gold** (`#FFE66B`): MNT amounts only (`.tabular-money`).
- **Warning Amber** (`#FFC53D`): Countdowns (vote kick), escrow hold emphasis.
- **Danger Red** (`#FF3D4A`): Loss, ban, destructive actions.
- **Tier Pro / Mid / Low** (`#C8F542` / `#6B9BFF` / `#8B93A7`): Left bar on tier badges and filters.

**The One Primary Rule.** At most one lime primary CTA per view (Join on browser, Ready in room, Continue in wizard step). Create lobby and secondary flows use `secondary` or `outline`.

**The Money Lane Rule.** Wallet and prize pool amounts use `money` with tabular nums. Never lime text on yellow/gold chips.

## Typography

**Display Font:** Chakra Petch (600–700) — brand wordmark, section titles, Play chrome.

**Body Font:** IBM Plex Sans (400–600) — UI copy, buttons at 15px medium.

**Label/Mono Font:** IBM Plex Mono (400–500) — tier labels, occupancy/ready counts, IDs, connect strings.

**Character:** Tactical broadcast—tight display tracking, readable body at 15/22, mono for anything that counts.

### Hierarchy

- **Display** (700, 40/44px desktop, tight tracking): Marketing hero, design-system page title.
- **Headline** (600, 32/38px): Page-level headings inside app shells.
- **Title** (600, 18/24px): Panel titles, lobby detail headers.
- **Body** (400–500, 15/22px): Default UI; keep line length ~65–75ch in prose blocks.
- **Label** (500, 12/16px, uppercase tracking ~0.14em): Section eyebrows, filter group labels.
- **Mono** (400, 13px): Tier badges, seat meters, ledger-like figures.

**The Cyrillic Rule.** MN strings must render cleanly; do not substitute Inter, Roboto, or Arial as primary UI fonts.

## Layout

- **App shell:** Full-height `min-h-dvh`, `bg-void` or `bg-base`, horizontal padding `px-4 sm:px-6`, content `max-w-5xl mx-auto` on Play and design-system pages.
- **Play header:** Fixed 56px (`h-14`) bar, bottom border, wallet balance right-aligned in money style.
- **Lobby Scout:** Filterable list + detail pane; on narrow viewports the detail becomes a bottom sheet (per product spec in `docs/design/DESIGN.md`).
- **Spacing rhythm:** Section gaps ~32–48px (`py-8`, `gap-8`–`gap-12`); tight inline clusters `gap-2`–`gap-3`.
- **Responsive:** Mobile-first; sm breakpoint adjusts padding and shows/hides secondary identity text.

## Elevation & Depth

Flat-by-default. Depth is **tonal layering** across void/base/raised/overlay—not ambient drop shadows. Borders (`border`, `border-strong`) separate regions; hover states step background to `overlay`.

**The Flat Surface Rule.** No card chrome in heroes. No glow stacks on CTAs. Shadows are not part of the core vocabulary.

## Shapes

- **Radii:** Only `4px` (sm), `5px` (md), `6px` (lg)—sharp tactical corners, not pills.
- **Buttons:** `rounded-md` (5px) default; small controls `rounded-sm`.
- **Tier badge:** 3px × 16px left accent bar (`rounded-sm`), mono label beside it.
- **Seat meter:** Ten `w-1.5 h-3 rounded-sm` segments; ready = primary, joined = muted, open = overlay.
- **Avatars / chips:** Small `rounded-sm` squares, not circles, when bordered (e.g. Steam avatar in header).

## Components

### Buttons

- **Shape:** 5px radius (`rounded-md`), 40px default height, 15px medium IBM Plex Sans.
- **Primary:** Solid lime background, `on-primary` text; hover → `primary-hover`; no gradient, no outer glow.
- **Secondary:** `bg-raised`, `border-border`, hover → `overlay`.
- **Outline / Ghost:** Transparent or bordered; hover → `overlay`.
- **Danger:** Solid `danger` background, white text, slight opacity hover.
- **Link:** `accent` with underline on hover.

### Chips

Not used for tiers. Use **TierBadge** (accent bar + mono label) instead of rounded filter chips.

### Cards / Containers

- **Corner Style:** `rounded-md` when a border is needed.
- **Background:** `raised` on `base` or `void`; internal padding `p-4` typical.
- **Shadow Strategy:** None.
- **Border:** 1px `border` or `border-strong` for modals/wizards.

### Inputs / Fields

No shared Input primitive yet; follow border `border`, background `base` or transparent, focus `border-strong`, 5px radius when added.

### Navigation

- **Site header (marketing):** Display wordmark, sparse links.
- **Play header:** Product name link (hover → primary), “Play” muted label, balance in money, ghost icon logout.
- **Mobile:** Collapse nonessential identity text; keep balance and primary actions reachable.

### Signature: SeatMeter & TierBadge

- **SeatMeter:** Ten-segment occupancy/ready visualization; accessible `aria-label` with counts.
- **TierBadge:** Band-colored vertical bar + mono tier string; used on lobby cards and filters.

## Do's and Don'ts

### Do:

- **Do** import `@bulaa/design/tokens.css` once at app root and use Tailwind theme aliases from `@bulaa/ui/globals.css`.
- **Do** use `tabular-money` (or `colors.money` + `tabular-nums`) for all MNT displays.
- **Do** keep copy short and imperative: “Join.” “Ready.” “Create lobby.”
- **Do** use `success` / `danger` for win/loss; do not repurpose primary for loss states.
- **Do** say players **joined** or are **in the lobby** (not “seated” / суусан).

### Don't:

- **Don't** ship a light/cream theme or purple brand accents.
- **Don't** use casino language or visuals: jackpot, bet, spin, odds, neon gold explosions.
- **Don't** use “Find Match” or “draft” as primary product verbs.
- **Don't** invent new brand hex colors; extend existing tokens with opacity if needed.
- **Don't** stack multiple lime primary buttons on one screen.
