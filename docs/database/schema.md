# Database Schema
> This document is authoritative. Implementation must strictly conform to it.

Complete reference for all database models, relationships, and field definitions.

## Overview

The application uses:
- **ORM**: Prisma
- **Database**: SQLite (development), PostgreSQL (production recommended)
- **Models**: 8 core models
- **Relationships**: One-to-many, one-to-one
- **JSON Fields**: Flexible data storage

## Models

### User

**Purpose:** User accounts and authentication

**Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String | Yes | cuid() | Unique identifier |
| `email` | String | Yes | - | Login email (unique) |
| `password` | String | Yes | - | Bcrypt hashed password |
| `name` | String | No | null | Display name |
| `createdAt` | DateTime | Yes | now() | Account creation timestamp |
| `updatedAt` | DateTime | Yes | auto | Last update timestamp |

**Relationships:**
- `conversations` → Conversation[] (one-to-many)
- `journalEntries` → JournalEntry[] (one-to-many)
- `strategies` → Strategy[] (one-to-many)
- `tools` → Tool[] (one-to-many)
- `playbooks` → Playbook[] (one-to-many)
- `settings` → UserSettings (one-to-one)

**Indexes:**
- `email` (unique)

**Example:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  conversations  Conversation[]
  journalEntries JournalEntry[]
  strategies     Strategy[]
  tools          Tool[]
  playbooks      Playbook[]
  settings       UserSettings?
}
```

---

### Conversation

**Purpose:** Store chat conversations with AI

**Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String | Yes | cuid() | Unique identifier |
| `userId` | String | Yes | - | Owner user ID |
| `title` | String | Yes | - | Conversation title |
| `messages` | JSON | Yes | [] | Array of message objects |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | auto | Last update timestamp |

**Relationships:**
- `user` → User (many-to-one)

**Messages JSON Structure:**
```typescript
[
  {
    role: 'user' | 'assistant',
    content: string
  },
  ...
]
```

**Example:**
```prisma
model Conversation {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  messages  Json     @default("[]")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

---

### JournalEntry

**Purpose:** Trading journal entries (trades, analysis, notes)

**Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String | Yes | cuid() | Unique identifier |
| `userId` | String | Yes | - | Owner user ID |
| `type` | String | Yes | - | "Trade", "Analysis", "Note" |
| `title` | String | Yes | - | Entry title |
| `content` | String | No | null | Markdown content |
| `tradeDate` | DateTime | No | null | Trade execution date |
| `market` | String | No | null | Forex, Crypto, Stocks, Metals |
| `symbol` | String | No | null | Trading symbol (EUR/USD, BTC, AAPL) |
| `direction` | String | No | null | "Long" or "Short" |
| `entryPrice` | Float | No | null | Entry price |
| `exitPrice` | Float | No | null | Exit price |
| `stopLoss` | Float | No | null | Stop loss price |
| `takeProfit` | Float | No | null | Take profit price |
| `profitLoss` | Float | No | null | P/L in currency |
| `emotions` | JSON | No | null | Emotional data object |
| `tags` | String[] | Yes | [] | Array of tag strings |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | auto | Last update timestamp |

**Relationships:**
- `user` → User (many-to-one)

**Emotions JSON Structure:**
```typescript
{
  preTradeConfidence?: number, // 1-10
  postTradeEmotions?: string[] // ["satisfied", "focused", ...]
}
```

**Example:**
```prisma
model JournalEntry {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  type      String    // "Trade" | "Analysis" | "Note"
  title     String
  content   String?

  // Trade-specific fields
  tradeDate   DateTime?
  market      String?
  symbol      String?
  direction   String?
  entryPrice  Float?
  exitPrice   Float?
  stopLoss    Float?
  takeProfit  Float?
  profitLoss  Float?

  emotions  Json?
  tags      String[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
  @@index([type])
  @@index([tradeDate])
}
```

---

### Strategy

**Purpose:** Trading strategy documentation

**Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String | Yes | cuid() | Unique identifier |
| `userId` | String | Yes | - | Owner user ID |
| `name` | String | Yes | - | Strategy name |
| `description` | String | No | null | Strategy description |
| `category` | String | No | null | Scalping, Day Trading, Swing, etc. |
| `market` | String | No | null | Forex, Crypto, Stocks, Metals |
| `timeframe` | String | No | null | 5m, 1h, 4h, 1d, etc. |
| `riskLevel` | String | No | null | "Low", "Medium", "High" |
| `rules` | JSON | No | null | Entry, exit, risk rules |
| `tags` | String[] | Yes | [] | Array of tag strings |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | auto | Last update timestamp |

**Relationships:**
- `user` → User (many-to-one)

**Rules JSON Structure:**
```typescript
{
  entry?: string[],    // Entry rule checklist
  exit?: string[],     // Exit rule checklist
  risk?: string[]      // Risk management rules
}
```

**Example:**
```prisma
model Strategy {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name        String
  description String?
  category    String?
  market      String?
  timeframe   String?
  riskLevel   String?
  rules       Json?
  tags        String[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([category])
}
```

---

### Tool

**Purpose:** External trading tool references

**Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String | Yes | cuid() | Unique identifier |
| `userId` | String | Yes | - | Owner user ID |
| `name` | String | Yes | - | Tool name |
| `description` | String | No | null | Tool description |
| `category` | String | No | null | Calculators, Screeners, Analysis, etc. |
| `url` | String | No | null | Tool URL |
| `tags` | String[] | Yes | [] | Array of tag strings |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | auto | Last update timestamp |

**Relationships:**
- `user` → User (many-to-one)

**Example:**
```prisma
model Tool {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name        String
  description String?
  category    String?
  url         String?
  tags        String[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([category])
}
```

---

### Playbook

**Purpose:** Step-by-step trading procedures

**Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String | Yes | cuid() | Unique identifier |
| `userId` | String | Yes | - | Owner user ID |
| `name` | String | Yes | - | Playbook name |
| `description` | String | No | null | Playbook description |
| `steps` | JSON | Yes | [] | Array of step objects |
| `tags` | String[] | Yes | [] | Array of tag strings |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | auto | Last update timestamp |

**Relationships:**
- `user` → User (many-to-one)

**Steps JSON Structure:**
```typescript
[
  {
    id: string,          // Unique step ID
    title: string,       // Step title
    description: string, // Step details
    order: number        // Step sequence
  },
  ...
]
```

**Example:**
```prisma
model Playbook {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name        String
  description String?
  steps       Json     @default("[]")
  tags        String[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

---

### UserSettings

**Purpose:** User preferences and configuration

**Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String | Yes | cuid() | Unique identifier |
| `userId` | String | Yes | - | Owner user ID (unique) |
| `preferredProvider` | String | Yes | "anthropic" | AI provider: "anthropic" or "openai" |
| `anthropicModel` | String | Yes | "claude-3-sonnet-20240229" | Claude model ID |
| `openaiModel` | String | Yes | "gpt-4-turbo-preview" | GPT model ID |
| `theme` | String | Yes | "system" | "light", "dark", or "system" |
| `timezone` | String | Yes | "UTC" | User timezone |
| `defaultMarket` | String | Yes | "forex" | Default market selection |
| `defaultTimeframe` | String | Yes | "1h" | Default chart timeframe |
| `riskPerTrade` | Float | Yes | 1.0 | Default risk % per trade |
| `emailNotifications` | Boolean | Yes | true | Email notification preference |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | auto | Last update timestamp |

**Relationships:**
- `user` → User (one-to-one)

**Example:**
```prisma
model UserSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  preferredProvider String   @default("anthropic")
  anthropicModel    String   @default("claude-3-sonnet-20240229")
  openaiModel       String   @default("gpt-4-turbo-preview")
  theme             String   @default("system")
  timezone          String   @default("UTC")
  defaultMarket     String   @default("forex")
  defaultTimeframe  String   @default("1h")
  riskPerTrade      Float    @default(1.0)
  emailNotifications Boolean @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

## Relationships Diagram

```
User (1) ←──→ (1) UserSettings
  │
  ├──→ (many) Conversation
  ├──→ (many) JournalEntry
  ├──→ (many) Strategy
  ├──→ (many) Tool
  └──→ (many) Playbook
```

## Indexes

**User:**
- `email` (unique) - Login lookup

**Conversation:**
- `userId` - User's conversations

**JournalEntry:**
- `userId` - User's entries
- `type` - Filter by entry type
- `tradeDate` - Sort/filter by date

**Strategy:**
- `userId` - User's strategies
- `category` - Filter by category

**Tool:**
- `userId` - User's tools
- `category` - Filter by category

**Playbook:**
- `userId` - User's playbooks

**UserSettings:**
- `userId` (unique) - One setting per user

## Cascade Deletes

When a User is deleted:
- All Conversations deleted
- All JournalEntries deleted
- All Strategies deleted
- All Tools deleted
- All Playbooks deleted
- UserSettings deleted

**Implemented via:** `onDelete: Cascade`

## JSON Field Schemas

### Conversation.messages

```typescript
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Messages = Message[];
```

### JournalEntry.emotions

```typescript
type Emotions = {
  preTradeConfidence?: number;     // 1-10 scale
  postTradeEmotions?: string[];    // Array of emotion keywords
};
```

### Strategy.rules

```typescript
type Rules = {
  entry?: string[];   // Entry rule checklist
  exit?: string[];    // Exit rule checklist
  risk?: string[];    // Risk management rules
};
```

### Playbook.steps

```typescript
type Step = {
  id: string;
  title: string;
  description: string;
  order: number;
};

type Steps = Step[];
```

## Database File

**Development:**
- Location: `prisma/dev.db`
- Type: SQLite
- Created by: `npx prisma db push`

**Production:**
- Recommended: PostgreSQL
- Update DATABASE_URL in .env
- Run migrations

## Schema File

**Location:** `prisma/schema.prisma`

**Structure:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User { ... }
model Conversation { ... }
// ... other models
```

## Prisma Client Usage

### Create
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: hashedPassword,
    name: 'John Doe'
  }
});
```

### Read
```typescript
const entries = await prisma.journalEntry.findMany({
  where: { userId: user.id, type: 'Trade' },
  orderBy: { tradeDate: 'desc' },
  include: { user: true }
});
```

### Update
```typescript
const updated = await prisma.strategy.update({
  where: { id: strategyId },
  data: { name: 'New Name', tags: ['ICT', 'Scalping'] }
});
```

### Delete
```typescript
await prisma.conversation.delete({
  where: { id: conversationId }
});
```

### Upsert (UserSettings)
```typescript
const settings = await prisma.userSettings.upsert({
  where: { userId: user.id },
  create: {
    userId: user.id,
    preferredProvider: 'anthropic'
  },
  update: {
    preferredProvider: 'openai'
  }
});
```

## Best Practices

### IDs
- Use `cuid()` for globally unique IDs
- Never expose internal IDs to URLs (use slugs)
- Verify ownership before updates/deletes

### Timestamps
- Always include `createdAt` and `updatedAt`
- Use for sorting, filtering, auditing
- Never modify `createdAt` manually

### JSON Fields
- Validate structure before saving
- Use TypeScript types for consistency
- Consider separate tables for frequently queried data

### Relationships
- Use `onDelete: Cascade` for owned data
- Use indexes on foreign keys
- Eager load with `include` when needed

### Array Fields (tags)
- Store as `String[]`
- Case-sensitive searches
- Consider normalization for large datasets

## Migration from SQLite to PostgreSQL

**For Production:**

1. **Update DATABASE_URL:**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

2. **Update schema.prisma:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Generate migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Apply migration:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Data migration:**
   - Export from SQLite
   - Transform if needed
   - Import to PostgreSQL

## Related Documentation

- [Migrations Guide](./migrations.md) - Database setup and updates
- [API Reference](../api-reference.md) - API endpoints using these models
- [Prisma Documentation](https://www.prisma.io/docs/)
