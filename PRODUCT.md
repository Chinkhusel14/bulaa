# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Mongolian CS2 players who play solo or with friends and want paid 5v5 matches without manual money handling between players.

**Secondary (operations):** Match, finance, skill, and support admins who confirm results, allocate servers, handle edge-case payouts, and enforce fairness. Admin workflows matter for MVP launch but are not the primary design audience for the player app.

## Product Purpose

Bulaa is a web platform where players browse and create paid CS2 lobbies, fill ten seats, coordinate teams, play on low-latency Mongolia-hosted servers, and receive winnings through an in-app MNT wallet.

**Near-term success (8–12 weeks):** A player can complete the full path—fund wallet → create or join a lobby → ready and start → play → receive payout—without off-platform money transfers. Admin steps remain acceptable for match result confirmation and server allocation in this phase.

## Positioning

Bulaa is a **new competitor** in paid CS2 lobbies for Mongolia—not a patch on an existing Discord-and-admin-transfer workflow owned by someone else. The product must stand on its own: trustworthy wallet and escrow, live lobby discovery with skill context, and a lobby room that replaces ad-hoc coordination elsewhere.

What neighbors should not be able to copy without building the same stack: integrated MNT ledger + per-seat escrow, player-created lobbies with live occupancy and tier signals, and operations tooling tied to the same ledger and match record.

## Operating Context

- **Monorepo:** `apps/front` (Next.js player UI), `apps/backend` (Fastify HTTP + WebSockets), shared packages under `packages/`.
- **Local dev:** `docker compose`, `pnpm dev` — front at `http://localhost:3100`, API at `http://localhost:3101/api`.
- **Spec material:** `docs/PRD.md` and `docs/design/DESIGN.md` exist in-repo. Product truth for Impeccable is **this file and explicit stakeholder answers**, not automatic adoption of the full PRD.
- **Incumbent community workflow:** Manual Discord coordination and admin transfers are the market context, not the product Bulaa extends.

## Capabilities and Constraints

**In scope for the current MVP intent**

- Steam sign-in, phone verification, account eligibility checks (VAC/game ban, account age, CS2 hours).
- MNT wallet with deposits (QPay-oriented), per-player lobby cost, escrow hold/release/capture, payout on confirmed result.
- Lobby browser: list, create, join, leave, live updates, occupancy and tier signals.
- Lobby room (planned): sides, Ready, host Start when rules satisfied, member chat, vote kick.
- Match lifecycle with **admin-confirmed results** and **manual server allocation** in MVP.
- Skill display via admin-assigned tier + internal MMR; tier shown in lobby context.
- Tiered admin panel and audit logging (directionally in PRD; build order follows engineering roadmap).

**Geography and money**

- Mongolia only; MNT only for this phase.

**Explicit non-goals for this phase (unless reopened)**

- Multi-country / multi-currency.
- Native mobile apps.
- Fully automated result verification at launch (target post-MVP).
- In-platform voice chat (players may use external voice).

**Open product decisions**

- Legal classification, KYC depth, age gate, and tax treatment in Mongolia (must be resolved before public launch).
- CS2 server operator contracts and automation path.
- Exact payment provider mix beyond QPay primary.
- Public brand voice details beyond what stakeholders supply (see Brand Commitments).
- Whether internal MMR becomes visible to players post-MVP.

**Terminology (player-facing)**

- Prefer: lobby, seat, host, prize pool, payout, escrow, ready, join.
- Avoid casino framing and primary verbs like “bet” or “jackpot.”
- “Seat” as a noun is fine; do not describe players as “seated” (use joined / in the lobby).

## Brand Commitments

- **Working product name:** Bulaa (repository and UI today).
- **Visual system:** Clutch dark-mode design system is documented in `docs/design/DESIGN.md` and implemented in `@bulaa/design`. Visual recipes belong in DESIGN.md, not here.
- **Voice and identity:** Stakeholder indicated **custom** brand/voice constraints; **not yet captured in this file.** Future init or stakeholder input should replace this bullet with binding copy rules (tone, MN/EN balance, words to avoid).
- **Domain / final brand lock:** Not confirmed.

## Evidence on Hand

| Asset | Location | Notes |
| ----- | -------- | ----- |
| Product requirements draft | `docs/PRD.md` | Reference material; not sole authority per stakeholder |
| Design system spec | `docs/design/DESIGN.md` | Clutch tokens, copy personality, UI rules |
| Runnable app | `apps/front`, `apps/backend` | Partial MVP implementation |
| Marketing / legal proofs | — | **Do not fabricate** testimonials, customer logos, licensing claims, or launch dates |

## Product Principles

1. **End-to-end money path first.** If lobby → payout is not credible, nothing else ships.
2. **Players create demand.** Lobbies are player-made; the platform provides trust, visibility, and rules—not a hidden matchmaker queue.
3. **Compete as a product.** Design and position for standalone use, not as an accessory to someone else’s community stack.
4. **Automate the routine; gate the risky.** Escrow, lobby state, and payouts automate; results and server assignment stay admin-assisted until infra and legal allow otherwise.
5. **Fairness is visible.** Tier and lobby averages inform choice; enforcement (VAC, phone uniqueness, behavior score) is part of the same promise.

## Accessibility & Inclusion

- **Languages:** Mongolian and English in the player UI; Cyrillic must render correctly.
- **Standard:** No product-specific WCAG target recorded yet; treat keyboard access, contrast (via Clutch tokens), and readable money figures as baseline engineering requirements.
