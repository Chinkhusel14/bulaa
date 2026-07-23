# Bulaa

Paid CS2 5v5 matchmaking for Mongolia.

## Monorepo

```
apps/
  front/               Next.js — player-facing UI
  backend/             Fastify — HTTP API + WebSockets
    src/
      config/          env
      plugins/         cors, websocket, …
      modules/         auth, users, wallet, payments, match, queue, draft, admin
      realtime/        /ws/queue, /ws/draft
      lib/             shared server helpers
packages/
  design/              Clutch tokens (@bulaa/design)
  ui/                  shadcn + Phosphor + cn/tailwind-merge
  shared/              Zod schemas + domain constants
  db/                  Drizzle + Postgres schema
  eslint-config/
  typescript-config/
docs/
  PRD.md
  design/DESIGN.md
```

## Stack


| Layer   | Choice                                           |
| ------- | ------------------------------------------------ |
| Front   | Next.js 15, React 19, Tailwind 4                 |
| Backend | Fastify (REST under `/api` + WS under `/ws`)     |
| UI      | shadcn (new-york), Phosphor, React Bits registry |
| Data    | TanStack Query / Table / Form, Zod               |
| DB      | Postgres + Drizzle, Redis (queue/pubsub)         |


## Setup

```bash
pnpm install
docker compose up -d
cp apps/front/.env.example apps/front/.env.local
cp apps/backend/.env.example apps/backend/.env
pnpm dev
```

- Front: http://localhost:3100
- Backend health: http://localhost:3101/health
- API prefix: http://localhost:3101/api/*

## UI components

```bash
pnpm ui:add button
pnpm ui:add @react-bits/blur-text
```

