# Getting Started
> This document is authoritative. Implementation must strictly conform to it.

Complete setup guide to get Trading AI running on your machine.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.17 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **API Keys** (see below)

### Required API Keys

1. **Anthropic API Key** - For Claude AI
   - Sign up at [console.anthropic.com](https://console.anthropic.com/)
   - Create API key in Settings

2. **OpenAI API Key** - For GPT models
   - Sign up at [platform.openai.com](https://platform.openai.com/)
   - Create API key in API Keys section

### Optional API Keys

3. **Pinecone API Key** - For vector memory (optional but recommended)
   - Sign up at [pinecone.io](https://www.pinecone.io/)
   - Create a new index with:
     - Dimensions: 1536
     - Metric: cosine
     - Pod type: Starter (free tier)

4. **Polygon API Key** - For market data (optional)
   - Sign up at [polygon.io](https://polygon.io/)
   - Free tier available for limited requests

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/DemasJ2k/Flow-Agent.git
cd Flow-Agent
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js, React, TypeScript
- Prisma ORM
- Anthropic SDK, OpenAI SDK
- Pinecone client
- TradingView charts
- And more...

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env  # If example exists, otherwise create manually
```

Add the following configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication (generate a random secret)
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_SECRET=your-random-secret-here

# AI Providers (Required)
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Vector Memory (Optional)
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=trading-ai

# Market Data (Optional)
POLYGON_API_KEY=your-polygon-key
```

**Generating NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Set Up Database

Generate Prisma client and create database:

```bash
npx prisma generate
npx prisma db push
```

This creates:
- SQLite database at `prisma/dev.db`
- All tables (User, Conversation, JournalEntry, Strategy, etc.)
- Prisma Client for database access

### 5. Run Development Server

```bash
npm run dev
```

The application will start on [http://localhost:3006](http://localhost:3006)

## First Use

### 1. Create Your Account

1. Navigate to [http://localhost:3006](http://localhost:3006)
2. Click "Sign Up"
3. Enter your email and password
4. Click "Create Account"

### 2. Configure Settings

1. Click on your profile icon → Settings
2. Set your preferred AI provider (Claude or GPT)
3. Configure trading preferences:
   - Default market (Forex, Crypto, Stocks, Metals)
   - Default chart timeframe
   - Risk per trade percentage
   - Timezone

### 3. Explore Features

Try these initial actions:

**Start a Conversation:**
- Go to Chat page
- Ask: "Explain order blocks in ICT"
- Watch streaming AI response with context from knowledge base

**Browse Knowledge Base:**
- Go to Knowledge page
- Click "Reindex" to index all trading concepts
- Search for "fair value gaps"
- Read detailed explanations

**Add a Journal Entry:**
- Go to Journal page
- Click "New Entry"
- Document a trade with entry/exit, emotions, tags

**View Market Charts:**
- Go to Charts page
- Search for a symbol (e.g., "EUR/USD")
- Toggle ICT patterns (Order Blocks, Fair Value Gaps)

## Verify Installation

### Check Build

Ensure everything compiles:

```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
Route (app)                                Size
...
○ (Static)  prerendered as static content
```

### Check Database

Verify Prisma connection:

```bash
npx prisma studio
```

This opens a GUI at [http://localhost:5555](http://localhost:5555) to view database tables.

### Check API Routes

Test a simple endpoint:

```bash
curl http://localhost:3006/api/health
```

## Common Setup Issues

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Prisma errors

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

### Issue: Port 3006 already in use

**Solution:**
```bash
# Use a different port
PORT=3007 npm run dev
```

Or update `NEXTAUTH_URL` in `.env` to match the new port.

### Issue: API keys not working

**Verification:**
1. Check `.env` file exists in project root
2. Verify no extra spaces in API keys
3. Restart dev server after changing `.env`
4. Test API key directly:

```bash
# Test Anthropic
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01"

# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

## Next Steps

- [Architecture Overview](./architecture.md) - Understand how it works
- [AI Chat Documentation](./features/chat.md) - Master the chat interface
- [Knowledge Base Guide](./features/knowledge-base.md) - Index and search trading concepts
- [API Reference](./api-reference.md) - Build integrations

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use PostgreSQL instead of SQLite
3. Set secure `NEXTAUTH_SECRET`
4. Configure proper NEXTAUTH_URL
5. Enable rate limiting on API routes
6. Set up monitoring and logging

See deployment platforms:
- [Vercel](https://vercel.com/) - Recommended for Next.js
- [Railway](https://railway.app/) - Easy database hosting
- [AWS/GCP/Azure](https://aws.amazon.com/) - Full control

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | file:./dev.db | Database connection |
| `NEXTAUTH_URL` | Yes | - | App URL |
| `NEXTAUTH_SECRET` | Yes | - | Auth secret |
| `ANTHROPIC_API_KEY` | Yes | - | Claude API key |
| `OPENAI_API_KEY` | Yes | - | GPT API key |
| `PINECONE_API_KEY` | No | - | Vector DB key |
| `PINECONE_INDEX_NAME` | No | - | Pinecone index |
| `POLYGON_API_KEY` | No | - | Market data key |
