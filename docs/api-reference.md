# API Reference
> This document is authoritative. Implementation must strictly conform to it.

Complete documentation for all 39 API endpoints in the Trading AI platform.

## Base URL

```
Development: http://localhost:3006/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication via NextAuth session cookie.

**Authentication Header:** Not required (session cookie automatically sent)

**Unauthorized Response:**
```json
{
  "error": "Unauthorized"
}
```
Status: `401 Unauthorized`

---

## Chat & Conversations

### POST /api/chat

Stream AI responses with optional memory context.

**Authentication:** Required

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Explain order blocks" },
    { "role": "assistant", "content": "Order blocks are..." }
  ],
  "provider": "anthropic",
  "conversationId": "clx123abc"
}
```

**Parameters:**
- `messages` (array, required) - Conversation history
- `provider` (string, optional) - "anthropic" or "openai", defaults to user setting
- `conversationId` (string, optional) - For saving to conversation

**Response:**
Server-Sent Events stream

```
data: Order
data:  blocks
data:  are
data:  price
...
```

**Example:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }],
    provider: 'anthropic',
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  console.log(chunk); // Process stream
}
```

### GET /api/conversations

List all conversations for authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "conversations": [
    {
      "id": "clx123abc",
      "title": "Order Blocks Discussion",
      "messages": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### POST /api/conversations

Create a new conversation.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "New Trading Strategy Discussion"
}
```

**Response:**
```json
{
  "id": "clx456def",
  "title": "New Trading Strategy Discussion",
  "messages": [],
  "createdAt": "2024-01-15T11:00:00Z"
}
```

### GET /api/conversations/[id]

Get a specific conversation.

**Authentication:** Required

**Response:**
```json
{
  "id": "clx123abc",
  "title": "Order Blocks Discussion",
  "messages": [
    { "role": "user", "content": "Explain order blocks" },
    { "role": "assistant", "content": "Order blocks are..." }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

### PUT /api/conversations/[id]

Update conversation (title or messages).

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Updated Title",
  "messages": [
    { "role": "user", "content": "New message" }
  ]
}
```

### DELETE /api/conversations/[id]

Delete a conversation.

**Authentication:** Required

**Response:**
```json
{
  "success": true
}
```

---

## Journal

### GET /api/journal

Get all journal entries for authenticated user.

**Authentication:** Required

**Query Parameters:**
- `type` (optional) - Filter by entry type: "Trade", "Analysis", "Note"
- `tags` (optional) - Comma-separated tag filter
- `from` (optional) - Start date (ISO 8601)
- `to` (optional) - End date (ISO 8601)

**Response:**
```json
{
  "entries": [
    {
      "id": "clx789ghi",
      "type": "Trade",
      "title": "EUR/USD Long Entry",
      "content": "Entered long position based on...",
      "tradeDate": "2024-01-15T14:30:00Z",
      "market": "Forex",
      "symbol": "EUR/USD",
      "direction": "Long",
      "entryPrice": 1.0850,
      "exitPrice": 1.0920,
      "profitLoss": 70,
      "emotions": {
        "preTradeConfidence": 8,
        "postTradeEmotions": ["satisfied", "focused"]
      },
      "tags": ["ICT", "Order Block"],
      "createdAt": "2024-01-15T15:00:00Z"
    }
  ]
}
```

### POST /api/journal

Create a new journal entry.

**Authentication:** Required

**Request Body:**
```json
{
  "type": "Trade",
  "title": "EUR/USD Long Entry",
  "content": "Markdown content...",
  "tradeDate": "2024-01-15T14:30:00Z",
  "market": "Forex",
  "symbol": "EUR/USD",
  "direction": "Long",
  "entryPrice": 1.0850,
  "exitPrice": 1.0920,
  "stopLoss": 1.0800,
  "takeProfit": 1.0950,
  "profitLoss": 70,
  "emotions": {
    "preTradeConfidence": 8,
    "postTradeEmotions": ["satisfied"]
  },
  "tags": ["ICT", "Order Block"]
}
```

**Response:**
```json
{
  "id": "clx789ghi",
  "type": "Trade",
  "title": "EUR/USD Long Entry",
  ...
}
```

### PUT /api/journal/[id]

Update a journal entry.

**Authentication:** Required (must be entry owner)

**Request Body:** Same as POST

### DELETE /api/journal/[id]

Delete a journal entry.

**Authentication:** Required (must be entry owner)

**Response:**
```json
{
  "success": true
}
```

### POST /api/journal/from-conversation

Create journal entry from chat conversation.

**Authentication:** Required

**Request Body:**
```json
{
  "conversationId": "clx123abc"
}
```

**Response:**
```json
{
  "id": "clx999jkl",
  "title": "Trading Discussion - Jan 15",
  "content": "# Conversation\n\n**User:** ...\n\n**AI:** ...",
  "type": "Analysis"
}
```

---

## Strategies

### GET /api/strategies

List all strategies for authenticated user.

**Authentication:** Required

**Query Parameters:**
- `market` (optional) - Filter by market
- `category` (optional) - Filter by category

**Response:**
```json
{
  "strategies": [
    {
      "id": "clxabc123",
      "name": "ICT Order Block Scalping",
      "description": "Quick scalps using order blocks...",
      "category": "Scalping",
      "market": "Forex",
      "timeframe": "5m",
      "riskLevel": "Medium",
      "rules": {
        "entry": ["Wait for order block formation", "..."],
        "exit": ["Target 1:2 RR", "..."]
      },
      "tags": ["ICT", "Scalping"],
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

### POST /api/strategies

Create a new strategy.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "ICT Order Block Scalping",
  "description": "Quick scalps using order blocks...",
  "category": "Scalping",
  "market": "Forex",
  "timeframe": "5m",
  "riskLevel": "Medium",
  "rules": {
    "entry": ["Rule 1", "Rule 2"],
    "exit": ["Rule 1", "Rule 2"]
  },
  "tags": ["ICT", "Scalping"]
}
```

### PUT /api/strategies/[id]

Update a strategy.

### DELETE /api/strategies/[id]

Delete a strategy.

---

## Tools

### GET /api/tools

List all tools for authenticated user.

**Response:**
```json
{
  "tools": [
    {
      "id": "clxdef456",
      "name": "Position Size Calculator",
      "description": "Calculate position size based on risk",
      "category": "Calculators",
      "url": "https://example.com/calculator",
      "tags": ["Risk Management"],
      "createdAt": "2024-01-05T10:00:00Z"
    }
  ]
}
```

### POST /api/tools

Create a new tool.

**Request Body:**
```json
{
  "name": "Position Size Calculator",
  "description": "Calculate position size...",
  "category": "Calculators",
  "url": "https://example.com/calculator",
  "tags": ["Risk Management"]
}
```

### PUT /api/tools/[id]

Update a tool.

### DELETE /api/tools/[id]

Delete a tool.

---

## Playbooks

### GET /api/playbooks

List all playbooks.

**Response:**
```json
{
  "playbooks": [
    {
      "id": "clxghi789",
      "name": "ICT Morning Session Playbook",
      "description": "Step-by-step for London open",
      "steps": [
        {
          "id": "step1",
          "title": "Check Asian Range",
          "description": "Identify high and low",
          "order": 1
        }
      ],
      "tags": ["ICT", "Killzone"],
      "createdAt": "2024-01-08T09:00:00Z"
    }
  ]
}
```

### POST /api/playbooks

Create a new playbook.

**Request Body:**
```json
{
  "name": "ICT Morning Session Playbook",
  "description": "Step-by-step for London open",
  "steps": [
    {
      "id": "step1",
      "title": "Check Asian Range",
      "description": "Identify high and low",
      "order": 1
    }
  ],
  "tags": ["ICT", "Killzone"]
}
```

### PUT /api/playbooks/[id]

Update a playbook.

### DELETE /api/playbooks/[id]

Delete a playbook.

---

## Knowledge Base

### GET /api/knowledge

List knowledge base documents.

**Query Parameters:**
- `category` (optional) - "ict" or "scalping"

**Response:**
```json
{
  "documents": [
    {
      "id": "ict-order-blocks",
      "title": "Order Blocks",
      "category": "ict",
      "subcategory": "price-action",
      "summary": "Order blocks are institutional...",
      "tags": ["price-action", "ict"],
      "lastModified": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/knowledge/[category]/[subcategory]

Get specific knowledge document content.

**Response:**
```json
{
  "id": "ict-order-blocks",
  "title": "Order Blocks",
  "category": "ict",
  "subcategory": "price-action",
  "content": "# Order Blocks\n\nOrder blocks are...",
  "summary": "Order blocks are institutional...",
  "tags": ["price-action", "ict"]
}
```

### GET /api/knowledge/search

Search knowledge base.

**Query Parameters:**
- `q` (required) - Search query
- `category` (optional) - Filter by category
- `limit` (optional) - Max results (default: 10)

**Response:**
```json
{
  "results": [
    {
      "id": "ict-order-blocks",
      "title": "Order Blocks",
      "category": "ict",
      "subcategory": "price-action",
      "excerpt": "...institutional footprint...",
      "section": "What are Order Blocks?",
      "score": 0.92,
      "highlights": ["institutional footprint in the market"]
    }
  ]
}
```

### GET /api/knowledge/index

Get knowledge base indexing status.

**Response:**
```json
{
  "status": [
    {
      "category": "ict",
      "subcategory": "order-blocks",
      "totalChunks": 15,
      "lastIndexed": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/knowledge/index

Reindex knowledge base to Pinecone.

**Response:**
```json
{
  "success": true,
  "documentsIndexed": 13,
  "chunksIndexed": 156
}
```

### DELETE /api/knowledge/index

Clear knowledge base index from Pinecone.

**Response:**
```json
{
  "success": true,
  "message": "Knowledge base cleared"
}
```

---

## Market Data

### GET /api/market/symbols

Search for trading symbols.

**Query Parameters:**
- `q` (required) - Search query (e.g., "EUR/USD")
- `market` (optional) - "forex", "crypto", "stocks", "metals"

**Response:**
```json
{
  "symbols": [
    {
      "symbol": "EUR/USD",
      "name": "Euro / US Dollar",
      "market": "forex",
      "exchange": "FX"
    }
  ]
}
```

### GET /api/market/chart

Get OHLCV chart data.

**Query Parameters:**
- `symbol` (required) - Trading symbol
- `timeframe` (required) - "1m", "5m", "15m", "1h", "4h", "1d"
- `from` (optional) - Start timestamp (Unix ms)
- `to` (optional) - End timestamp (Unix ms)

**Response:**
```json
{
  "candles": [
    {
      "time": 1705320000,
      "open": 1.0850,
      "high": 1.0880,
      "low": 1.0840,
      "close": 1.0870,
      "volume": 125000
    }
  ],
  "symbol": "EUR/USD",
  "timeframe": "1h"
}
```

---

## Memory System

### GET /api/memory/status

Check Pinecone connection status.

**Response:**
```json
{
  "connected": true,
  "indexName": "trading-ai",
  "dimension": 1536,
  "namespaces": ["conversations", "journal", "knowledge-base"]
}
```

### GET /api/memory/search

Search vector memory across namespaces.

**Query Parameters:**
- `query` (required) - Search text
- `namespace` (optional) - Specific namespace
- `limit` (optional) - Max results (default: 5)

**Response:**
```json
{
  "results": [
    {
      "id": "msg_123",
      "score": 0.89,
      "metadata": {
        "content": "Order blocks are institutional...",
        "userId": "user_456",
        "timestamp": "2024-01-15T10:00:00Z"
      }
    }
  ]
}
```

---

## Settings

### GET /api/settings

Get user settings and profile.

**Authentication:** Required

**Response:**
```json
{
  "settings": {
    "preferredProvider": "anthropic",
    "anthropicModel": "claude-3-sonnet-20240229",
    "openaiModel": "gpt-4-turbo-preview",
    "theme": "system",
    "timezone": "UTC",
    "defaultMarket": "forex",
    "defaultTimeframe": "1h",
    "riskPerTrade": 1.0,
    "emailNotifications": true
  },
  "profile": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### PUT /api/settings

Update user settings.

**Authentication:** Required

**Request Body:**
```json
{
  "preferredProvider": "anthropic",
  "anthropicModel": "claude-3-sonnet-20240229",
  "defaultMarket": "crypto",
  "riskPerTrade": 2.0
}
```

**Validation:**
- `preferredProvider`: "anthropic" or "openai"
- `theme`: "light", "dark", or "system"
- `riskPerTrade`: 0.1 to 10.0

**Response:**
```json
{
  "settings": { ... }
}
```

### PUT /api/user/profile

Update user profile (name, password).

**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Doe",
  "currentPassword": "old-password",
  "newPassword": "new-secure-password"
}
```

**Password Change Requirements:**
- Must provide `currentPassword`
- `newPassword` min 8 characters
- Current password must match

**Response:**
```json
{
  "success": true,
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message description"
}
```

### Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized for resource |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

**Current Status:** No rate limiting implemented

**Future:** Consider adding rate limits for:
- Chat endpoints: 60 requests/minute
- Market data: 100 requests/minute
- All others: 300 requests/minute

---

## Webhooks

**Current Status:** Not implemented

**Future:** Possible webhooks for:
- New trade alerts
- Strategy performance updates
- Market condition changes

---

## SDK / Client Libraries

**Current Status:** No official SDK

**Usage:** Use standard fetch or HTTP client

**Example TypeScript Client:**

```typescript
class TradingAIClient {
  constructor(private baseUrl: string) {}

  async chat(messages: Message[], provider = 'anthropic') {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send cookies
      body: JSON.stringify({ messages, provider }),
    });
    return response.body;
  }

  async getJournalEntries(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${this.baseUrl}/api/journal?${params}`,
      { credentials: 'include' }
    );
    return response.json();
  }
}

const client = new TradingAIClient('http://localhost:3006');
```

---

## Next Steps

- [Chat Feature Guide](./features/chat.md)
- [Journal API Usage](./features/journal.md)
- [Knowledge Base Integration](./features/knowledge-base.md)
