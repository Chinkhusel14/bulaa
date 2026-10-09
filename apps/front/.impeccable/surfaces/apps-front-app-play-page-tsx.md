---
version: 1
slug: "apps-front-app-play-page-tsx"
primary_target: "apps/front/app/play/page.tsx"
related_targets: ["apps/front/app/play/[lobbyId]/page.tsx"]
---

# Play hub — surface brief

**Target:** `apps/front/app/play/page.tsx` (browser); related `apps/front/app/play/[lobbyId]/page.tsx`, Play header, create wizard, dev session API.

**Visitor mode:** Operate

**Seed key:** `8ee9a4e3` (surface operate roll); **locked composition:** Scout evolved (user choice overrides dealt index 6).

---

## 1. Job and audience

- **Who:** Active Mongolian CS2 players (MN+EN), post–phone-verify, with wallet balance relevant to join/create cost.
- **Context:** Deciding which paid lobby to enter or whether to create one; may switch dev personas locally; may already be in a lobby and need the room.
- **Primary job:** Pick a fair lobby (tier + prize + fill), understand cost in MNT, join or create, then continue in the room—without leaving the product for money or coordination.
- **Success:** User joins or creates a lobby with confidence in cost and skill context; low-balance and account blockers are obvious; live list updates without refresh; dev personas enable multi-tab testing.

## 2. Outcome and proof

- **Primary action:** Join (lime primary on detail) or Create lobby (secondary → wizard); when `viewer.lobbyId` set, **Open room** is the path to `/play/[id]`.
- **Proof on screen:** Prize pool and join cost in **money** color; tier badge with accent bar; **SeatMeter** + ready count; host name (lobbies have no title); wallet balance in header.
- **Product truth:** Player-created lobbies; one lobby at a time; no matchmaker queue; no casino copy; “joined” / “in the lobby” wording only.

## 3. Selected direction

- **Visual authority:** Clutch / **The Clutch Terminal** (`DESIGN.md`, `@bulaa/design`)—unchanged tokens; composition may evolve.
- **Structural thesis:** **Scout evolved**—filterable list stays left (or top on narrow); detail pane becomes a **mission card** that concentrates decision data (prize, share + fee = total, balance after join, tier, age, seat/ready meters) before the single Join primary.
- **Signature move:** Live lobby row **highlights the row that changed** on WebSocket snapshot (occupancy/ready tick)—subtle primary-muted fill or border pulse, not casino flash.
- **Dev hub:** Header **persona menu** (dev only): list `GET /api/dev/users`, switch via `POST /api/dev/session`, reload auth—never in production UI.
- **Build path:** Comp-first (`.impeccable/config.json`).
- **Approved comp:** `.impeccable/mocks/play-comp-a-scout-evolved.html` (HTML reference; sidecar `play-comp-a-scout-evolved.html.json`, `"approved": true`).

## 4. Scope and boundaries

**In scope**

- `/play` browser: Scout filters, sort, detail mission card, create wizard, error/loading/blocker states.
- Wallet gates: insufficient balance, banned/restricted, already in lobby—reuse `lobby-kit` blockers.
- Deposit / low balance: **empty or below-cost state** with clear next step (link or CTA to deposit when API exists; until then honest “add funds” stub pointing to future wallet route—no fake QPay).
- Mobile: detail as **bottom sheet** over list (per design spec).
- Play header: balance, avatar, logout, **dev persona control** (development only).
- `/play/[id]` room: inherit same header/shell; room layout out of scope for *first* comp unless user expands—brief includes room as **linked destination**, not redesigned in pass 1.

**Untouched**

- Marketing home `/`.
- Auth flows except redirects into Play.
- Admin panel.
- Clutch token values, fonts, radii.

**Anti-goals**

- No purple accents, light theme, casino visuals, “Find Match,” draft-as-primary-verb.
- No second lime primary on one view.
- No “seated” / суусан copy.

## 5. States and ranges

| State | Behavior |
| ----- | -------- |
| Loading | Skeleton or existing `LobbiesLoading`; header may show balance null. |
| Empty list | Copy: no open lobbies + secondary Create; not a dead end. |
| Filter empty | “No lobby matches filters” with reset affordance. |
| Low / zero balance | Block join/create with balance blocker; mission card shows shortfall in money. |
| Account blockers | `pending_phone` redirect; banned/restricted via `BlockerNotice`. |
| In lobby | Highlight user’s lobby in list; Open room secondary; Join hidden on own lobby. |
| WS update | List reorder/reflow; changed row signature pulse. |
| Dev personas | 10 players, funded; switch without Steam. |

**Data ranges:** 0–20 open lobbies typical; 1–10 occupancy; prize pools 30k–500k MNT presets in wizard.

## 6. Interaction and layout

**Desktop first viewport**

- **Header (56px):** Bulaa → home; Play label; **money balance**; dev persona dropdown (dev); avatar; logout ghost.
- **Title row:** MN+EN title; open count mono; **Create lobby** secondary; **Open room** when applicable.
- **Filter band:** Host search; tier band filters (accent bars); hide-full checkbox; sort select.
- **Main:** List (~45%) + **mission card** detail (~55%) on `lg+`; selected row uses `primary-muted` border/background.
- **Mission card:** Host + tier; prize in money; cost breakdown; SeatMeter; ready count; age; soft tier warning if applicable; **one Join** primary or Leave when in that lobby.
- **Mobile:** List full width; tapping row opens **sheet** with same mission card content.

**Create wizard:** Native `<dialog>`, two steps, server fee read-only; primary Continue/Create only in dialog (counts as view’s primary while open).

**Room:** Navigate to `/play/[id]` after join or Open room—Ready/sides/chat per PRD in later build.

## 7. Constraints and open decisions

- **Platform:** Web, Next.js app router, TanStack Query + WS for lobbies.
- **i18n:** MN + EN paired labels where incumbent does today.
- **a11y:** Keyboard list selection, sheet focus trap, radiogroup for tier filters, live region optional for WS updates.
- **Open:** Deposit route/API when wallet module ships; exact copy for low-balance CTA; whether mission card shows winner payout preview (wizard already does—optional on detail).

---

## Direction contract (development only)

**THESIS:** Play is a **lobby command desk**—scan live opportunities, read one mission card, commit with a single lime action—never a generic game launcher grid.

**OWN-WORLD:** Clutch void/base/raised, lime primary once, money gold tabular, tier bars, seat meter, flat borders—recognizable with all copy removed.

**STORY:** “I see prize, rank, fill, and what it costs me; I join or I create; my balance and blocks are honest; the list moves live.”

**FIRST VIEWPORT:** Header with balance → filter band → split list + mission card with Join; Create secondary in title row; one lobby row selected showing 7/10 + tier + ₮ prize.

**FORM:** Scout evolved (composition lock); seed `8ee9a4e3`; explore comp-first variants of list/detail weighting and mission card hierarchy only.

**FINISH:** Unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md update if system changes, and every shipping raster carrying its provenance.
