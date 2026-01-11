# Architecture Overview
> This document is authoritative. Implementation must strictly conform to it.

Understanding the Trading AI platform's technical architecture and data flow.

## System Overview

Trading AI is built on a modern, full-stack TypeScript architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Layer                         │
│  Next.js 14 App Router + React 19 + TypeScript + Tailwind   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                    API Routes Layer                          │
│         39 API endpoints (REST + Server-Sent Events)         │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
│   Database   │ │  AI APIs  │ │  External   │
│ Prisma+SQLite│ │ Claude+GPT│ │ Pinecone    │
│              │ │           │ │ Polygon     │
└──────────────┘ └───────────┘ └─────────────┘
```

## Frontend Architecture

### Next.js App Router

The application uses Next.js 14 App Router with the following structure:

```
src/app/
├── (auth)/              # Authentication pages (login, signup)
│   ├── layout.tsx       # Auth layout wrapper
│   ├── login/
│   └── signup/
│
├── (dashboard)/         # Protected dashboard pages
│   └── dashboard/
│       ├── layout.tsx   # Dashboard shell with sidebar
│       ├── page.tsx     # Chat interface (default)
│       ├── journal/
│       ├── charts/
│       ├── strategies/
│       ├── tools/
│       ├── playbooks/
│       ├── knowledge/
│       └── settings/
│
└── api/                 # API route handlers
    ├── auth/            # NextAuth endpoints
    ├── chat/            # AI chat with streaming
    ├── conversations/   # Conversation CRUD
    ├── journal/         # Journal entry CRUD
    ├── strategies/      # Strategy management
    ├── knowledge/       # Knowledge base
    └── ...
```

### Component Architecture

Components are organized by feature:

```
src/components/
├── ui/                  # Reusable UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── toast.tsx
│   ├── error-boundary.tsx
│   └── empty-state.tsx
│
├── layout/              # Layout components
│   ├── sidebar.tsx
│   └── dashboard-shell.tsx
│
├── chat/                # Chat-specific components
│   ├── chat-interface.tsx
│   ├── chat-message.tsx
│   ├── chat-input.tsx
│   └── conversation-sidebar.tsx
│
├── journal/             # Journal components
├── charts/              # Chart components
├── knowledge/           # Knowledge base components
└── ...
```

### State Management

- **React State** for local component state
- **React Context** for global state (Toast, Error Boundaries)
- **Server State** via API routes (no client-side cache)
- **URL State** for shareable state (filters, search)

## Backend Architecture

### API Routes

All API routes follow REST conventions:

```typescript
// Example: /api/journal/route.ts
export async function GET(request: Request) {
  // Fetch journal entries
}

export async function POST(request: Request) {
  // Create new entry
}
```

**Authentication:**
- All dashboard API routes check `await getServerSession()`
- Returns 401 if not authenticated
- User context available via session

**Error Handling:**
- Try-catch blocks wrap all async operations
- Return JSON errors with appropriate status codes
- Client displays via toast notifications

### Server-Sent Events (SSE)

The chat endpoint uses SSE for streaming responses:

```typescript
// /api/chat/route.ts
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of aiStream) {
      controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
    }
    controller.close();
  },
});

return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' },
});
```

## Database Design

### Prisma ORM

Using Prisma for type-safe database access:

```typescript
// Example query
const entries = await prisma.journalEntry.findMany({
  where: { userId },
  orderBy: { tradeDate: 'desc' },
  include: { tags: true },
});
```

### Schema Overview

```
User
├── conversations (1-to-many)
├── journalEntries (1-to-many)
├── strategies (1-to-many)
├── tools (1-to-many)
├── playbooks (1-to-many)
└── settings (1-to-1)

Conversation
└── messages (JSON array)

JournalEntry
├── entry type (Trade, Analysis, Note)
├── trade data (JSON)
├── emotional data (JSON)
└── tags (string array)

Strategy
├── market & timeframe
├── risk level
└── linked playbooks

Playbook
├── steps (JSON array)
└── execution tracking (JSON)
```

### Data Flow Example: Creating a Journal Entry

```
1. User fills form → Submit
2. Frontend: POST /api/journal
3. API Route:
   - Validate session
   - Validate input
   - Create entry via Prisma
   - Return new entry
4. Frontend: Update UI + show toast
```

## External Integrations

### 1. Anthropic Claude

**SDK:** `@anthropic-ai/sdk`

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const stream = await anthropic.messages.stream({
  model: 'claude-3-sonnet-20240229',
  messages: [{ role: 'user', content: 'Hello' }],
  max_tokens: 1024,
});
```

**Used for:**
- Chat conversations with streaming
- Knowledge base context injection
- Trade analysis

### 2. OpenAI GPT

**SDK:** `openai`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
});
```

**Used for:**
- Alternative chat provider
- Text embeddings (text-embedding-3-small)
- Knowledge base embeddings

### 3. Pinecone Vector Database

**SDK:** `@pinecone-database/pinecone`

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

// Upsert embeddings
await index.namespace('conversations').upsert([{
  id: messageId,
  values: embedding, // 1536-dim vector
  metadata: { content, userId },
}]);

// Query for similar content
const results = await index.namespace('conversations').query({
  vector: queryEmbedding,
  topK: 5,
  includeMetadata: true,
});
```

**Namespaces:**
- `conversations` - Chat history
- `journal` - Journal entries
- `strategies` - Strategy documents
- `knowledge-base` - Trading concepts

### 4. Polygon Market Data

**REST API** via `fetch`

```typescript
const response = await fetch(
  `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/hour/${from}/${to}?apiKey=${apiKey}`
);

const data = await response.json();
// Returns OHLCV candles
```

**Data cached** in memory for 5 minutes to respect rate limits.

## Data Flow Patterns

### Pattern 1: Chat with Memory (RAG)

```
1. User sends message
2. Generate embedding of message
3. Query Pinecone for similar past conversations
4. Retrieve relevant context (top 5 results)
5. Inject context into AI prompt
6. Stream AI response to client
7. Save conversation + embedding to Pinecone
```

Implementation: [src/app/api/chat/route.ts](../src/app/api/chat/route.ts)

### Pattern 2: Knowledge Base Search

```
1. User enters search query
2. IF Pinecone configured:
   - Generate query embedding
   - Search vector DB for similar chunks
   - Return ranked results
3. ELSE:
   - Keyword search in markdown files
   - Return matching documents
```

Implementation: [src/lib/knowledge/embedding.ts](../src/lib/knowledge/embedding.ts)

### Pattern 3: Real-time Chart Data

```
1. User selects symbol + timeframe
2. Check memory cache (5 min TTL)
3. IF cache miss:
   - Fetch from Polygon API
   - Parse OHLCV data
   - Cache in memory
4. Return candles to frontend
5. TradingView chart renders
6. ICT pattern detection runs client-side
```

Implementation: [src/lib/market-data/polygon.ts](../src/lib/market-data/polygon.ts)

## Authentication Flow

Using NextAuth.js with credentials provider:

```
1. User submits login form
2. NextAuth calls authorize() function
3. Query user from database by email
4. Compare password hash (bcrypt)
5. IF valid:
   - Create session token
   - Set httpOnly cookie
   - Redirect to dashboard
6. IF invalid:
   - Return error
```

**Session management:**
- JWT strategy (stateless)
- 30-day expiration
- Cookies: `next-auth.session-token`

**Protected routes:**
```typescript
const session = await getServerSession(authOptions);
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
```

## Performance Optimizations

### 1. Server Components

Most dashboard pages use React Server Components:
- Data fetched on server
- No client-side JavaScript for static content
- Reduced bundle size

### 2. Streaming

- AI responses stream via SSE
- Charts load progressively
- Reduces perceived latency

### 3. Caching

- Market data cached in memory (5 min)
- Static assets cached by Next.js
- Prisma query results not cached (always fresh)

### 4. Code Splitting

- Automatic route-based splitting
- Dynamic imports for heavy components
- TradingView chart loaded on-demand

## Security Considerations

### API Keys

- Stored in `.env` (never committed)
- Accessed via `process.env` (server-side only)
- Not exposed to client

### Authentication

- Passwords hashed with bcrypt (salt rounds: 10)
- Session tokens in httpOnly cookies
- CSRF protection via NextAuth

### Input Validation

- Server-side validation on all API routes
- Type checking via TypeScript
- Prisma schema constraints

### Database

- SQLite for development (file-based)
- Use PostgreSQL for production
- Prepared statements prevent SQL injection

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 + React 19 | UI framework |
| Styling | Tailwind CSS | Utility-first CSS |
| Language | TypeScript | Type safety |
| Database | Prisma + SQLite | ORM + database |
| Auth | NextAuth.js | Authentication |
| AI | Anthropic + OpenAI | Chat & embeddings |
| Vector DB | Pinecone | Semantic search |
| Charts | TradingView Lightweight | Candlestick charts |
| Market Data | Polygon API | Real-time prices |

## Deployment Architecture

### Development
```
localhost:3006
├── Next.js dev server (with HMR)
├── SQLite database (file)
└── API routes (same process)
```

### Production (Recommended)
```
Vercel (Frontend + API)
├── Next.js production build
├── Serverless functions for API routes
└── Edge caching

Railway/Supabase (Database)
└── PostgreSQL instance

External Services
├── Anthropic API
├── OpenAI API
├── Pinecone (managed)
└── Polygon API
```

## File Structure

```
trading-ai/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/              # Business logic
│   │   ├── ai/           # AI providers
│   │   ├── memory/       # Vector memory
│   │   ├── knowledge/    # Knowledge base
│   │   └── market-data/  # Polygon integration
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
│
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db            # SQLite database (dev)
│
├── knowledge-base/
│   ├── ict/              # ICT markdown docs
│   └── scalping/         # Scalping markdown docs
│
├── public/               # Static assets
├── docs/                 # This documentation
└── [config files]
```

## Next Steps

- [API Reference](./api-reference.md) - Detailed endpoint documentation
- [Database Schema](./database/schema.md) - Complete data model
- [Memory System](./systems/memory-system.md) - Vector memory deep dive
