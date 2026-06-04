# Trading AI Documentation
> Authoritative project context lives in `/CLAUDE.md` and `/replit.md`. Parts of
> this `docs/` folder were written ahead of implementation and describe planned
> behavior. Where a doc disagrees with the code, trust `shared/schema.ts`,
> `server/routes.js`, and `/CLAUDE.md`.

Welcome to the Trading AI Analysis Platform documentation. This guide will help you understand, set up, and use all features of the platform.

## Quick Navigation

### Getting Started
- [Installation & Setup Guide](./getting-started.md) - Get the platform running in 5 minutes
- [Architecture Overview](./architecture.md) - Understand how the system works
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

### Features Documentation
- [AI Chat](./features/chat.md) - AI-powered trading conversations with Claude & GPT
- [Trading Journal](./features/journal.md) - Track your trades and analyze performance
- [Market Charts](./features/charts.md) - Real-time data with ICT pattern detection
- [Strategies](./features/strategies.md) - Create and manage trading strategies
- [Tools](./features/tools.md) - Trading tools and calculators
- [Playbooks](./features/playbooks.md) - Step-by-step trading execution plans
- [Knowledge Base](./features/knowledge-base.md) - ICT and Scalping concepts library
- [Settings](./features/settings.md) - Customize your experience

### System Documentation
- [Vector Memory System](./systems/memory-system.md) - Pinecone-powered context memory
- [AI Providers](./systems/ai-providers.md) - Configure Claude and GPT
- [Market Data](./systems/market-data.md) - Polygon API integration

### Database Documentation
- [Database Schema](./database/schema.md) - Models and relationships
- [Migrations](./database/migrations.md) - Database setup and updates

### API Reference
- [Complete API Documentation](./api-reference.md) - All 39 endpoints documented

## What is Trading AI?

Trading AI is a comprehensive platform that combines:
- **Dual AI Providers** (Anthropic Claude + OpenAI GPT) for intelligent analysis
- **Vector Memory** for context-aware conversations
- **Real-time Market Data** across Forex, Crypto, Stocks, and Metals
- **ICT Pattern Detection** on charts (Order Blocks, Fair Value Gaps, Market Structure)
- **Trading Journal** with emotional tracking and analytics
- **Knowledge Base** with semantic search across trading concepts

## Documentation Structure

This documentation is organized into three main sections:

1. **Features** - End-user functionality and how to use each page
2. **Systems** - Technical integrations (AI, Memory, Market Data)
3. **Database** - Data models and schema information

## Common Tasks

- **First time setup?** → [Getting Started Guide](./getting-started.md)
- **API integration?** → [API Reference](./api-reference.md)
- **Understanding the architecture?** → [Architecture Overview](./architecture.md)
- **Something not working?** → [Troubleshooting Guide](./troubleshooting.md)

## Tech Stack

- Vite + React 19 + TypeScript + Tailwind CSS v4 (routing via Wouter)
- Express 5 on Node, run with `tsx` (single process serves API + Vite)
- PostgreSQL + Drizzle ORM, with the `pgvector` extension for semantic search
- bcrypt + session-token auth (sessions are in-memory)
- Anthropic Claude & OpenAI GPT (user-provided API keys, encrypted in the DB)
- TradingView Lightweight Charts v5
- Market data: Binance/Coinbase/CoinGecko (free) plus Polygon/Alpha Vantage/
  Twelve Data (key required)

## Need Help?

If you encounter issues not covered in this documentation:
1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review relevant feature documentation
3. Check API endpoint documentation for integration issues
