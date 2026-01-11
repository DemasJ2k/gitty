# Knowledge Base
> This document is authoritative. Implementation must strictly conform to it.

Searchable library of trading concepts with ICT and Scalping documentation.

## Overview

The Knowledge Base provides:
- **ICT Concepts**: Inner Circle Trader methodology documentation
- **Scalping Techniques**: Fast-paced trading strategies
- **Semantic Search**: AI-powered search using Pinecone
- **Keyword Search**: Fallback text-based search
- **Categories & Subcategories**: Organized content structure
- **Markdown Content**: Rich, formatted documentation
- **Auto-Indexing**: Vector embeddings for better search

## Content Categories

### ICT (Inner Circle Trader)

**Price Action:**
- Order Blocks
- Fair Value Gaps (FVG)
- Breaker Blocks
- Mitigation Blocks

**Market Structure:**
- Higher Highs/Higher Lows
- Lower Highs/Lower Lows
- Structure Breaks (BOS)
- Change of Character (ChoCh)

**Liquidity:**
- Liquidity Pools
- Liquidity Sweeps
- Stop Hunts
- Equal Highs/Lows

**Time:**
- Killzones (London, New York, Asian)
- True Day
- Optimal Trade Entry (OTE)

**Advanced:**
- Market Maker Models
- Smart Money Concepts
- Institutional Order Flow

### Scalping

**Entry Techniques:**
- Quick entry setups
- Scalping patterns
- Confirmation signals
- Entry timing

**Risk Management:**
- Position sizing for scalping
- Stop loss placement
- Profit targets
- Risk-reward ratios

**Market Conditions:**
- Best times to scalp
- Avoid low liquidity
- News impact
- Market volatility

**Technical Indicators:**
- Moving averages
- RSI scalping
- MACD signals
- Volume analysis

**Psychology:**
- Scalping mindset
- Managing emotions
- Discipline
- Avoiding overtrading

**Position Sizing:**
- Lot size calculation
- Risk per trade
- Account management
- Scaling strategies

## Browsing Knowledge

### Category View

**Access:**
1. Go to Knowledge page
2. Click category card (All/ICT/Scalping)
3. View documents in category

**Layout:**
- Card grid display
- Shows title, summary, tags
- Click card to view full document

### Document View

**Content Display:**
- Markdown formatted
- Code blocks for examples
- Images (if included)
- Clean, readable layout

**Navigation:**
- Back to list button
- Close modal
- Next/previous documents (future)

## Searching Knowledge

### Semantic Search

**How It Works:**
1. Enter search query
2. Query converted to vector embedding
3. Pinecone searches for similar content
4. Results ranked by relevance
5. Top results displayed

**Benefits:**
- Understands meaning, not just keywords
- Finds related concepts
- Better than exact match
- Learns from trading terminology

**Example:**
```
Query: "institutional footprint"
Finds: Order Blocks, Smart Money, Liquidity Pools
(Even if exact phrase not in documents)
```

**Requirements:**
- Pinecone API key configured
- Knowledge base indexed
- OpenAI API for embeddings

### Keyword Search

**Fallback Mode:**
- Activated if Pinecone not configured
- Traditional text search
- Searches titles, content, tags
- Less accurate than semantic search

**How It Works:**
1. Enter search query
2. Searches document text for keywords
3. Returns documents containing keywords
4. Sorted by relevance

**Example:**
```
Query: "order block"
Finds: Documents containing "order" and "block"
May miss related concepts
```

### Search Tips

**Be Specific:**
```
❌ "trading"
✅ "how to identify order blocks"
```

**Use Concepts:**
```
❌ "make money"
✅ "fair value gap entry technique"
```

**Ask Questions:**
```
✅ "what are liquidity pools?"
✅ "when to trade killzones?"
✅ "how to manage risk in scalping?"
```

**Related Terms:**
- Order Block → OB, institutional level, smart money
- Fair Value Gap → FVG, imbalance, inefficiency
- Killzone → optimal entry time, London open, NY session

## Indexing System

### What is Indexing?

**Purpose:**
- Converts markdown documents to vector embeddings
- Stores in Pinecone for semantic search
- Enables AI-powered search
- Improves search relevance

**Process:**
1. Read all markdown files
2. Chunk documents into sections (~1000 chars)
3. Generate embeddings via OpenAI
4. Upload to Pinecone
5. Store metadata (title, category, tags)

### Manual Indexing

**When to Reindex:**
- After adding new documents
- After editing existing documents
- If search results seem outdated
- First-time setup

**How to Reindex:**
1. Go to Knowledge page
2. Click "Reindex" button
3. Wait for completion (15-30 seconds)
4. Success toast notification

**What Gets Indexed:**
- All files in `/knowledge-base/ict/`
- All files in `/knowledge-base/scalping/`
- Total: ~150 chunks from 13 documents

### Index Status

**Check Status:**
- View index status indicator in header
- Green checkmark: Indexed
- Yellow warning: Not indexed
- Number shows total chunks

**Status Info:**
- Total chunks indexed
- Last indexed timestamp
- Per-document chunk counts

### Clearing Index

**When to Clear:**
- Troubleshooting search issues
- Starting fresh
- Testing changes

**How to Clear:**
- Currently via API only:
```bash
curl -X DELETE http://localhost:3006/api/knowledge/index
```

## Knowledge Documents

### Current Documents (13 total)

**ICT (7 documents):**
1. Order Blocks
2. Fair Value Gaps
3. Liquidity Pools
4. Market Structure
5. Killzones
6. Optimal Trade Entry (OTE)
7. Breaker Blocks

**Scalping (6 documents):**
1. Entry Techniques
2. Risk Management
3. Market Conditions
4. Technical Indicators
5. Trading Psychology
6. Position Sizing

### Document Structure

**Markdown Format:**
```markdown
# Title

## Overview
Brief introduction to concept

## What is [Concept]?
Detailed explanation

## How to Identify
Step-by-step identification

## Trading Strategy
How to trade this concept

## Examples
Real-world examples

## Common Mistakes
What to avoid

## Tips & Best Practices
Pro tips
```

### Adding New Documents

**File Location:**
- ICT: `/knowledge-base/ict/filename.md`
- Scalping: `/knowledge-base/scalping/filename.md`

**File Naming:**
- Lowercase with hyphens
- Example: `order-blocks.md`
- Example: `entry-techniques.md`

**Frontmatter (Optional):**
```markdown
---
title: Order Blocks
category: ict
subcategory: price-action
tags: [ict, smart money, institutional]
---

# Order Blocks
Content here...
```

**After Adding:**
1. Restart dev server
2. Go to Knowledge page
3. Click "Reindex"
4. New document searchable

## Integration with Chat

### Automatic Context Retrieval

**How It Works:**
1. You ask question in Chat
2. System searches knowledge base
3. Relevant content retrieved
4. Added to AI prompt context
5. AI answers with knowledge base info

**Example:**
```
You: "Explain order blocks"
System: [Retrieves order-blocks.md content]
AI: "Based on the ICT documentation, order blocks are
     institutional footprints in the market where..."
```

**Benefits:**
- Consistent answers
- References documentation
- Reduces hallucination
- Teaches ICT/Scalping concepts

## Configuration

### Pinecone Setup

**Required:**
```env
PINECONE_API_KEY=your-key
PINECONE_INDEX_NAME=trading-ai
```

**Index Configuration:**
- Dimensions: 1536 (OpenAI embedding size)
- Metric: cosine
- Namespace: `knowledge-base`

**Without Pinecone:**
- Keyword search still works
- No semantic search
- No chat integration
- Browse and read still functional

### OpenAI Embeddings

**Model:** `text-embedding-3-small`

**Cost:** Very low (~$0.00002 per 1K tokens)

**Required for:**
- Semantic search
- Knowledge indexing
- Chat integration

## API Integration

### Search Knowledge

```typescript
const response = await fetch(
  '/api/knowledge/search?q=order blocks&limit=5'
);
const { results } = await response.json();

// Results format:
[
  {
    id: 'ict-order-blocks',
    title: 'Order Blocks',
    category: 'ict',
    subcategory: 'price-action',
    excerpt: '...institutional footprint...',
    score: 0.92
  }
]
```

### Get Document

```typescript
const response = await fetch(
  '/api/knowledge/ict/order-blocks'
);
const document = await response.json();

// Document format:
{
  id: 'ict-order-blocks',
  title: 'Order Blocks',
  category: 'ict',
  content: '# Order Blocks\n\nOrder blocks are...',
  tags: ['ict', 'smart money']
}
```

See [API Reference](../api-reference.md) for complete documentation.

## Tips & Best Practices

### Effective Searching

**Start Broad:**
1. Search general term
2. Review results
3. Refine search if needed

**Use Full Questions:**
- "what are order blocks?"
- "how to trade fair value gaps?"
- "when to use killzones?"

**Combine Terms:**
- "order block entry"
- "FVG scalping"
- "London killzone strategy"

### Learning Path

**Beginner:**
1. Browse all ICT documents
2. Read in order: Order Blocks → FVG → Market Structure
3. Practice identifying on charts
4. Ask Chat for clarifications

**Intermediate:**
1. Study Killzones and OTE
2. Combine multiple concepts
3. Develop personal strategy
4. Document in Strategies

**Advanced:**
1. Breaker Blocks and advanced concepts
2. Multi-timeframe analysis
3. Create detailed playbooks
4. Teach others via documentation

### Content Maintenance

**Keep Updated:**
- Add new concepts as you learn
- Update documents with new insights
- Remove outdated information
- Reindex after changes

**Quality Standards:**
- Clear explanations
- Visual examples (future: image support)
- Step-by-step instructions
- Real-world applications

## Troubleshooting

### Search Returns No Results

**Check:**
1. Is knowledge base indexed?
2. Pinecone configured?
3. Query too specific?

**Solutions:**
- Click "Reindex" button
- Try broader search terms
- Check Pinecone connection
- Use Browse mode instead

### Reindex Fails

**Error:** "Failed to index knowledge base"

**Causes:**
- Pinecone not configured
- OpenAI API key missing
- Rate limit reached
- Network issues

**Solutions:**
- Verify API keys in .env
- Check Pinecone quota
- Wait and retry
- Check server logs

### Document Not Showing

**Check:**
- File in correct directory?
- Markdown format valid?
- Server restarted after adding?

**Solution:**
- Verify file location
- Check markdown syntax
- Restart dev server
- Reindex knowledge base

## Related Features

- [Chat](./chat.md) - Ask questions, get answers from knowledge base
- [Strategies](./strategies.md) - Apply learned concepts
- [Journal](./journal.md) - Document your learning

## Future Enhancements

- **User-Added Documents**: Add your own notes and concepts
- **Image Support**: Charts and diagrams in documents
- **Video Embeds**: Tutorial videos within documentation
- **Interactive Examples**: Live chart examples
- **Community Knowledge**: Share documents with other users
- **Versioning**: Track document changes over time
- **Translations**: Multi-language support
- **PDF Export**: Download documents as PDF
