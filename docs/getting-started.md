# Getting Started
> Authoritative context is `/CLAUDE.md`. This guide matches the real stack:
> Vite + Express + Drizzle/Postgres. Earlier revisions described a
> Next.js/Prisma/SQLite setup that was never built.

Set up the Trading AI platform locally.

## Prerequisites

- **Node.js** 18+ (the repo is developed on Node 22)
- **npm** (ships with Node)
- **PostgreSQL** with the `pgvector` extension (local install or a hosted
  Postgres such as Neon/Supabase that supports pgvector)
- **Git**

You do **not** need any AI provider keys to start the server. Users enter their
Anthropic/OpenAI/market-data keys in the app's Settings page, and they are
stored encrypted in the database.

## 1. Clone and install

```bash
git clone <your-fork-url> gitty
cd gitty
npm install
```

## 2. Configure environment

Copy the example and fill in your database URL:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/trading_ai
ENCRYPTION_KEY=        # openssl rand -hex 32  (set before storing real keys)
PORT=5000
```

`ENCRYPTION_KEY` is optional for local dev — if unset, a key is derived from
`DATABASE_URL`. Set it explicitly before you store any real user API keys, and
keep it stable (changing it orphans previously encrypted data).

## 3. Create the database schema

Drizzle pushes the schema in `shared/schema.ts` straight to your database:

```bash
npm run db:push
```

Make sure the `pgvector` extension is available. On a local Postgres:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 4. Run the dev server

```bash
npm run dev
```

This starts Express with Vite mounted as middleware — one process, both the API
and the client. Open **http://localhost:5000**.

## First use

1. Open http://localhost:5000 and sign up (email + password).
2. Go to **Settings** and add the API keys you want to use (Anthropic and/or
   OpenAI for chat; a market-data key only if you need stocks/forex — crypto
   charts work for free via Binance/Coinbase/CoinGecko).
3. Try the **Chat** page, add a **Journal** entry, or open **Charts**.

## Verify

```bash
# Run the existing Node test files
node --test server/

# Hit the server (after npm run dev)
curl http://localhost:5000/api/market/providers
```

## Common issues

**Port 5000 in use** — start on another port:
```bash
PORT=5001 npm run dev
```

**`db:push` fails** — confirm `DATABASE_URL` is reachable and the `vector`
extension is installed. Re-run `npm run db:push`.

**npm install fails** — clear and reinstall:
```bash
rm -rf node_modules package-lock.json && npm install
```

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | – | Postgres connection string (pgvector) |
| `ENCRYPTION_KEY` | Prod | derived | AES-256-GCM key for stored API keys |
| `PORT` | No | 5000 | Server port |
| `VAPID_PUBLIC_KEY` | No | – | Web push (optional) |
| `VAPID_PRIVATE_KEY` | No | – | Web push (optional) |

AI and market-data provider keys are entered in-app, not via env vars.

## Next steps

- [Architecture Overview](./architecture.md)
- [LLM Council](./llm-council.md) — the decision tool for this repo
- [API Reference](./api-reference.md)
