# CLAUDE.md

Authoritative project memory for AI agents. Read this first every session. If
anything here conflicts with files under `docs/`, this file and `replit.md`
win — large parts of `docs/` are aspirational and describe a stack that was
never built (see "Doc accuracy" below).

## What this is

A full-stack **Trading AI Analysis Platform**: AI chat for traders, a trading
journal, strategies, playbooks, backtesting, market charts, price alerts, and a
pgvector knowledge base. Users bring their own AI API keys (stored encrypted in
the database); the app ships no built-in model credentials.

## Stack (verified against the code)

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4, routed with
  Wouter. Source in `client/src`, entry `client/index.html`.
- **Backend**: Express 5 on Node, run with `tsx`. Entry `server/index.js`.
- **Database**: PostgreSQL + Drizzle ORM. Schema in `shared/schema.ts`,
  config in `drizzle.config.ts`. `pgvector` for embeddings/semantic search.
- **Auth**: bcrypt + session tokens. Sessions are an in-memory `Map` in
  `server/auth.js` (they do NOT survive a restart — treat as ephemeral).
- **Encryption**: AES-256-GCM for user API keys (`server/encryption.js`).
- **Charts**: TradingView Lightweight Charts v5.
- One process serves both: in dev, Express mounts Vite as middleware; in prod
  it serves `dist/`. Everything runs on `PORT` (default **5000**).

> Not Next.js. Not Prisma. Not SQLite. Not NextAuth. If a doc says otherwise,
> the doc is wrong.

## Layout

```
client/src/        React app — pages/, components/, contexts/, hooks/, lib/
server/            Express — index.js, routes.js, auth.js, storage.js, db.js,
                   encryption.js, marketData.js, backtesting.js, *Seed.js
shared/schema.ts   Drizzle schema (single source of truth for DB models)
docs/              Reference docs — PARTIALLY STALE, see below
.claude/           Agent setup: skills/, agents/, settings.json
```

## Commands

```bash
npm install          # install deps (no node_modules is committed)
npm run dev          # start server + Vite on PORT (default 5000)
npm run db:push      # apply schema.ts to the database (drizzle-kit push)
node --test server/  # run the *.test.js files (e.g. backtesting.test.js)
```

There is no real `test` script in package.json yet (it just errors). Use
`node --test` for the existing Node test files.

## Environment

Copy `.env.example` to `.env`. Variables the code actually reads:

- `DATABASE_URL` (required) — Postgres connection string.
- `ENCRYPTION_KEY` (set in prod) — 64 hex chars preferred. Without it, a key
  is derived from `DATABASE_URL`, so rotating the DB URL would orphan all
  encrypted API keys. Set this explicitly before storing real secrets.
- `PORT` (default 5000), `NODE_ENV`.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — optional, web push notifications.

Model and market-data keys (Anthropic, OpenAI, Polygon, etc.) are **not** env
vars — users enter them in Settings and they are stored encrypted in the DB.

## Conventions

- ES modules everywhere (`"type": "module"`). Use `import`, not `require`.
- Path aliases: `@` → `client/src`, `@shared` → `shared` (see vite.config.ts).
- Server files are `.js` with ESM; `shared/schema.ts` and configs are `.ts`.
- Match the style of the file you are editing. Keep comments at the existing
  density. Do not add a license header or reformat untouched code.
- Never commit `.env`, `node_modules`, or `dist` (see `.gitignore`).
- API keys must stay encrypted at rest and must never be returned to the
  client — endpoints expose only boolean "isSet" flags.

## Working agreement for agents

- **Branch**: develop on the feature branch you were assigned; never push to
  `main` without explicit permission.
- **Verify before claiming done**: run `npm run dev` and/or the relevant
  `node --test` file. Report failures with output; don't paper over them.
- **No PRs unless asked.**

## Skills installed (`.claude/skills/`)

- **llm-council** — convene a multi-perspective "council" for hard calls
  (architecture, risky refactors, ambiguous trade-offs) and code review. It
  fans work out to role-based subagents, has them critique each other, then a
  chairman synthesizes one answer. Invoke for decisions worth more than one
  opinion. See `docs/llm-council.md`.
- **stop-slop** — strip AI writing tells from any prose you produce
  (READMEs, docs, PR descriptions, user-facing copy, commit bodies). Apply it
  before delivering written content.

Council member roles live in `.claude/agents/`. Reach for the council when a
choice is hard to reverse or spans the whole architecture; for a one-line fix,
just do it.

## Doc accuracy

`docs/` was written ahead of implementation and still references Next.js,
Prisma, and SQLite — none of which exist here. `getting-started.md`,
`README.md`, and `architecture.md` have been corrected and carry a banner.
Deeper feature docs may still describe planned behavior. When a doc and the
code disagree, trust `shared/schema.ts`, `server/routes.js`, and this file.
