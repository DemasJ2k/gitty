# Trading AI Analysis Platform

> Full-stack trading analysis application with dual AI providers, pgvector semantic search, and real-time market data

## Project Status

**Backend Infrastructure**: ✅ Complete
- Express.js server running on port 5000
- PostgreSQL database with Drizzle ORM + pgvector extension
- 10 database models implemented (User, Conversation, JournalEntry, Strategy, Playbook, Tool, UserSettings, KnowledgeDocument, PriceAlert, PushSubscription, Embeddings)
- Authentication system with bcrypt and session management
- Full CRUD API routes for all entities

**AI Integration**: ✅ User-Provided API Keys Only
- No built-in AI integration - users provide their own API keys
- Anthropic Claude: claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5
- OpenAI GPT: gpt-4o, gpt-4o-mini
- API keys stored encrypted (AES-256-GCM) in database
- Streaming chat endpoint with dual provider support

**Vector Search**: ✅ Complete (pgvector)
- PostgreSQL pgvector extension for embeddings
- OpenAI text-embedding-3-small (1536 dimensions)
- Cosine similarity search via <=> operator
- Indexes documents, conversations, and journal entries

**API Key Security**: ✅ Complete
- All API keys encrypted with AES-256-GCM before storage
- Keys never returned to client (only boolean "isSet" flags)
- Secure clear/update workflow with double confirmation

**Frontend**: ✅ Complete
- Vite + React 19 + TypeScript setup complete
- Tailwind CSS v4 configured with @tailwindcss/postcss
- Routing with Wouter
- Dark mode toggle with system preference detection
- Responsive sidebar with mobile hamburger menu
- All pages: Dashboard, Chat, Journal, Charts, Strategies, Backtest, Alerts, Tools, Playbooks, Knowledge, Settings

**Real-Time Features**: ✅ Complete
- WebSocket streaming for crypto charts (Binance)
- Live candlestick updates with visual indicators
- Price alerts with push notification support

**Market Data Providers**: ✅ Complete
- Polygon (requires API key): Stocks, Forex, Crypto
- Alpha Vantage (requires API key): Stocks, Forex
- Twelve Data (requires API key): Stocks, Forex, Crypto
- Coinbase (free): Crypto only - Exchange API for historical candles
- CoinGecko (free): Crypto only
- Binance (free): Crypto only - primary for crypto charts

**Pending External API Keys**:
- ❌ OpenAI API Key (for embeddings and GPT models)
- ❌ Polygon API Key (for real-time stock/forex data)
- ❌ VAPID Keys (for push notifications)

Note: Users must configure their own API keys in Settings to use AI chat features. Crypto charts work without API keys using free Binance/Coinbase/CoinGecko providers.

## Architecture

### Tech Stack
- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4
- **Backend**: Express.js + Node.js (running via tsx)
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: bcrypt + session-based auth with httpOnly cookies
- **AI**: Anthropic Claude + OpenAI (user-provided API keys)
- **Charts**: TradingView Lightweight Charts v5
- **Encryption**: AES-256-GCM for API key storage
- **Future**: Pinecone (vector DB)

### Architecture Decisions
- **Stack Choice**: Using Vite + Express instead of Next.js (documented in /docs) for rapid prototyping
- **Database**: PostgreSQL + Drizzle ORM instead of Prisma + SQLite for production scalability
- **Authentication**: Custom bcrypt + session auth instead of NextAuth.js for simplicity

### Project Structure
```
├── client/                  # Frontend (Vite + React)
│   ├── src/
│   │   ├── App.tsx         # Main app component with routing
│   │   ├── main.tsx        # Entry point
│   │   ├── index.css       # Tailwind CSS v4 styles
│   │   ├── pages/          # Page components
│   │   └── components/     # Reusable UI components
│   └── index.html
├── server/                  # Backend (Express.js)
│   ├── index.js            # Server entry point
│   ├── routes.js           # All API routes
│   ├── auth.js             # Authentication logic
│   ├── storage.js          # Database operations
│   └── db.js               # Database connection
├── shared/                  # Shared code
│   └── schema.ts           # Drizzle database schema
└── docs/                    # Documentation (reference)
```

### Database Schema (8 Models)

1. **users**: User accounts (email, password, name)
2. **conversations**: AI chat conversations with message history (JSON array)
3. **journalEntries**: Trading journal with type, content, tags, emotional tracking
4. **strategies**: Trading strategies with category, market, rules
5. **tools**: External trading tool references with URL and category
6. **playbooks**: Step-by-step trading procedures with ordered steps
7. **userSettings**: User preferences (AI provider, theme, defaults)
8. **knowledgeDocument**: (planned) ICT and scalping concepts for semantic search

### Implemented API Endpoints

**Authentication** (4 endpoints):
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and create session
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/auth/me` - Get current user (requires auth)

**User Settings** (2 endpoints):
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

**User Profile** (1 endpoint):
- `PUT /api/user/profile` - Update user name/email

**Conversations** (5 endpoints):
- `GET /api/conversations` - List all user conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get single conversation
- `PUT /api/conversations/:id` - Update conversation title
- `DELETE /api/conversations/:id` - Delete conversation

**Chat** (1 endpoint):
- `POST /api/chat` - Send message and stream AI response (SSE)

**Journal** (6 endpoints):
- `GET /api/journal` - List journal entries (filterable by type, tags)
- `POST /api/journal` - Create journal entry
- `GET /api/journal/:id` - Get single entry
- `PUT /api/journal/:id` - Update entry
- `DELETE /api/journal/:id` - Delete entry
- `POST /api/journal/from-conversation` - Create journal from chat

**Strategies** (5 endpoints):
- `GET /api/strategies` - List strategies (filterable by market, category)
- `POST /api/strategies` - Create strategy
- `GET /api/strategies/:id` - Get single strategy
- `PUT /api/strategies/:id` - Update strategy
- `DELETE /api/strategies/:id` - Delete strategy

**Tools** (5 endpoints):
- `GET /api/tools` - List tools (filterable by category)
- `POST /api/tools` - Create tool
- `GET /api/tools/:id` - Get single tool
- `PUT /api/tools/:id` - Update tool
- `DELETE /api/tools/:id` - Delete tool

**Playbooks** (5 endpoints):
- `GET /api/playbooks` - List playbooks
- `POST /api/playbooks` - Create playbook
- `GET /api/playbooks/:id` - Get single playbook
- `PUT /api/playbooks/:id` - Update playbook
- `DELETE /api/playbooks/:id` - Delete playbook

**Market Data** (3 endpoints - Multi-Provider):
- `GET /api/market/symbols` - Search symbols (uses configured provider or free CoinGecko for crypto)
- `GET /api/market/candles` - Get OHLCV candles (with provider-specific identifiers)
- `GET /api/market/providers` - List available data providers based on user's API keys

Market Data Providers:
- **Polygon** (requires API key): Stocks, Forex, Crypto
- **Alpha Vantage** (requires API key): Stocks, Forex
- **Twelve Data** (requires API key): Stocks, Forex, Crypto
- **Coinbase** (optional API key): Crypto only - free public data works without key
- **CoinGecko** (free): Crypto only
- **Binance** (free): Crypto only (primary for crypto)

**Notifications** (2 endpoints):
- `POST /api/notifications/test` - Send test notification to Discord/Telegram
- `POST /api/notifications/send` - Send custom notification to configured channels

**News API** (2 endpoints):
- `GET /api/news` - Search market news (requires NewsAPI.org key)
- `GET /api/news/headlines` - Get top business headlines

**TradingView Webhook** (2 endpoints):
- `POST /api/webhook/tradingview` - Receive alerts from TradingView (no auth required, uses secret)
- `GET /api/webhook/tradingview/info` - Get webhook configuration instructions

**Memory System** (2 endpoints):
- `GET /api/memory/status` - Check if vector memory is available
- `GET /api/memory/search` - Search vector memory (requires Pinecone)

**Knowledge Base** (4 endpoints):
- `GET /api/knowledge` - List knowledge documents
- `GET /api/knowledge/search` - Semantic search (requires Pinecone)
- `GET /api/knowledge/index` - Get indexing status
- `POST /api/knowledge/index` - Reindex knowledge base

## Features

### Implemented
- ✅ User authentication (signup, login, logout)
- ✅ Session management with httpOnly cookies
- ✅ AI chat with Anthropic Claude (streaming responses)
- ✅ Dual AI provider support (Anthropic/OpenAI selectable)
- ✅ Conversation history storage and management
- ✅ Trading Journal CRUD with emotional tracking
- ✅ Strategies CRUD with market/category filtering and inline backtesting
- ✅ Tools CRUD with category filtering
- ✅ Playbooks CRUD with ordered steps
- ✅ User settings management
- ✅ Charts page with TradingView Lightweight Charts v5
- ✅ Database persistence with PostgreSQL
- ✅ Discord webhook notifications for trade alerts
- ✅ Telegram bot notifications for trade alerts
- ✅ News API integration for market news and sentiment
- ✅ TradingView webhook receiver for chart signals
- ✅ Coinbase Exchange API integration for crypto data

### Graceful Degradation
- Crypto charts work without API keys (uses free Binance/CoinGecko)
- Stocks/Forex charts require configured API key (Polygon, Alpha Vantage, or Twelve Data)
- Vector memory works without Pinecone (returns empty results)
- Knowledge search works without Pinecone (returns empty results)
- OpenAI provider works without API key (falls back to Anthropic)

### Planned (Requires External APIs)
- ⏳ Real-time market data (requires Polygon API)
- ⏳ ICT pattern detection on charts
- ⏳ Vector memory for context-aware conversations (requires Pinecone + OpenAI)
- ⏳ Knowledge base with semantic search (requires Pinecone + OpenAI)
- ⏳ Journal analytics and emotional tracking insights

## Required API Keys

To enable all features, provide these environment variables:

1. **OpenAI API Key** (for embeddings and GPT models)
   - Set as `OPENAI_API_KEY` secret
   - Used for: Text embeddings, alternative chat provider

2. **Pinecone API Key** (for vector database)
   - Set as `PINECONE_API_KEY` secret
   - Also need: `PINECONE_INDEX_NAME` env var
   - Used for: Semantic search, conversation memory, knowledge base

3. **Polygon API Key** (for market data)
   - Set as `POLYGON_API_KEY` secret
   - Used for: Real-time OHLCV data, market symbol search

## Development

**Start the application**:
```bash
npm run dev
```

**Push database schema changes**:
```bash
npm run db:push
```

**Server**: http://localhost:5000
**Vite Dev Server**: Integrated via middleware

## Technical Notes

### TailwindCSS v4 Configuration
- Uses `@tailwindcss/postcss` plugin in postcss.config.js
- CSS uses `@import "tailwindcss"` and `@theme` directives
- No tailwind.config.ts needed for basic setup

### Lightweight Charts v5 API
- Import `CandlestickSeries` from 'lightweight-charts'
- Use `chart.addSeries(CandlestickSeries, options)` not `addCandlestickSeries()`

### Wouter Routing
- `<Link>` component renders anchor tag directly
- Don't nest additional `<a>` tags inside Link

## User Preferences

The platform remembers user preferences:
- Preferred AI provider (Anthropic/OpenAI)
- AI model selection (claude-sonnet-4-5, gpt-5, etc.)
- Theme (light/dark/system)
- Default market (Forex/Crypto/Stocks/Metals)
- Default timeframe (1m, 5m, 1h, 4h, 1d)
- Risk per trade percentage
