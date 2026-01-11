# Vector Memory System
> This document is authoritative. Implementation must strictly conform to it.

Context-aware AI conversations using Pinecone vector database and RAG (Retrieval Augmented Generation).

## Overview

The Vector Memory System provides:
- **Semantic Memory**: AI remembers past conversations
- **Context Retrieval**: Relevant history automatically recalled
- **RAG Implementation**: Retrieval Augmented Generation
- **Multiple Namespaces**: Organized memory stores
- **OpenAI Embeddings**: Text-to-vector conversion
- **Pinecone Storage**: Scalable vector database

## How It Works

### Basic Flow

```
1. User sends message
2. Message converted to vector embedding (OpenAI)
3. Similar past messages retrieved (Pinecone)
4. Context injected into AI prompt
5. AI responds with awareness of history
6. New message + response stored as vectors
```

### RAG (Retrieval Augmented Generation)

**Traditional Chat:**
```
User: "How do I trade order blocks?"
AI: [Answers from training data only]
```

**With RAG:**
```
User: "How do I trade order blocks?"
System: [Searches memory, finds related past conversations]
System: [Retrieves "You discussed OB entries 3 days ago..."]
AI: "Based on our previous discussion about order blocks,
     where we covered identification, here's how to trade them..."
```

**Benefits:**
- Personalized responses
- Consistent terminology
- Learns your trading style
- Reduces repetition

## Architecture

### Components

**1. Embedding Service** (`src/lib/memory/embeddings.ts`)
- Converts text to 1536-dimensional vectors
- Uses OpenAI `text-embedding-3-small`
- Fast and cost-effective

**2. Pinecone Client** (`src/lib/memory/pinecone.ts`)
- Wrapper around Pinecone SDK
- Manages connections
- Handles upserts and queries

**3. Memory Service** (`src/lib/memory/index.ts`)
- High-level memory operations
- Stores conversations
- Retrieves context
- Manages namespaces

### Namespaces

Memories organized into namespaces:

**`conversations`:**
- User messages and AI responses
- Chat history
- Trading discussions
- Largest namespace

**`journal`:**
- Journal entries
- Trade logs
- Analysis notes
- Performance data

**`strategies`:**
- Trading strategies
- Rule sets
- Setup descriptions
- Strategy refinements

**`knowledge-base`:**
- ICT documentation
- Scalping guides
- Trading concepts
- Educational content

**`tools`:**
- Tool descriptions
- Use cases
- References

**`playbooks`:**
- Execution steps
- Procedures
- Checklists

## Configuration

### Required Environment Variables

```env
# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=trading-ai

# OpenAI (for embeddings)
OPENAI_API_KEY=your-openai-api-key
```

### Pinecone Index Setup

**Index Configuration:**
```
Name: trading-ai
Dimensions: 1536
Metric: cosine
Pod Type: Starter (free tier) or Performance
```

**Creating Index:**

Via Pinecone Console:
1. Go to [console.pinecone.io](https://console.pinecone.io/)
2. Click "Create Index"
3. Name: `trading-ai`
4. Dimensions: `1536`
5. Metric: `cosine`
6. Create

Via API:
```bash
curl -X POST https://api.pinecone.io/indexes \
  -H "Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "trading-ai",
    "dimension": 1536,
    "metric": "cosine",
    "pod_type": "starter"
  }'
```

### Without Pinecone

**Graceful Degradation:**
- Chat still works
- No memory/context retrieval
- Each conversation independent
- Knowledge base uses keyword search
- All features functional, just less intelligent

## Chat Integration

### Storing Conversations

**When:**
- After each user message
- After each AI response
- Automatic, no user action needed

**What's Stored:**
```typescript
{
  id: 'msg_abc123',
  values: [0.123, -0.456, ...], // 1536-dim vector
  metadata: {
    content: 'Explain order blocks',
    role: 'user',
    userId: 'user_123',
    conversationId: 'conv_456',
    timestamp: '2024-01-15T10:30:00Z'
  }
}
```

**Namespace:** `conversations`

### Retrieving Context

**When:**
- Before generating AI response
- For each user message
- Automatic retrieval

**Query:**
1. Convert user message to vector
2. Search Pinecone for top 5 similar messages
3. Filter by userId (privacy)
4. Sort by similarity score
5. Return matching contexts

**Injected into Prompt:**
```
System: Here are some relevant past conversations:

[Previous discussion 1: About order blocks]
[Previous discussion 2: About entry timing]
[Previous discussion 3: About risk management]

Now answer the user's current question with awareness of these past topics.

User: [Current question]
```

**Result:**
- AI aware of past discussions
- Builds on previous topics
- Maintains consistency
- Personalized responses

## Knowledge Base Integration

### Indexing Documents

**Process:**
1. Read all markdown files
2. Split into chunks (~1000 chars, 200 overlap)
3. Generate embeddings for each chunk
4. Upload to Pinecone with metadata
5. Namespace: `knowledge-base`

**Chunk Example:**
```typescript
{
  id: 'kb_ict_ob_chunk1',
  values: [embedding vector],
  metadata: {
    content: 'Order blocks are institutional...',
    title: 'Order Blocks',
    category: 'ict',
    subcategory: 'price-action',
    section: 'What are Order Blocks?',
    tags: ['ict', 'smart money']
  }
}
```

### Searching Knowledge

**Semantic Search:**
1. User searches "institutional footprint"
2. Convert query to vector
3. Search `knowledge-base` namespace
4. Return top 10 most similar chunks
5. Display with titles, excerpts, scores

**Benefits over Keyword Search:**
- Understands meaning
- Finds related concepts
- Language flexible
- Better results

## Journal Integration

**Future Feature:**
- Store journal entries as vectors
- Search past trades by description
- Find similar trading scenarios
- Pattern recognition in outcomes

**Example:**
```
Query: "EUR/USD long at order block"
Finds: All past EUR/USD trades with OB entries
Analyze: Win rate, common mistakes, improvements
```

## Performance & Costs

### Embedding Costs

**OpenAI Pricing:**
- Model: `text-embedding-3-small`
- Cost: ~$0.00002 per 1K tokens
- Average message: ~100 tokens = $0.000002

**Monthly Estimate:**
- 1000 chat messages: ~$0.002
- Negligible cost

### Pinecone Costs

**Starter (Free Tier):**
- 100K vectors
- Up to 1 index
- 5 namespaces
- Free forever

**Capacity:**
- ~20K-50K chat messages
- 13 knowledge docs (~150 vectors)
- Sufficient for most users

**Paid Tiers:**
- Standard: $70/month (5M vectors)
- Enterprise: Custom pricing

### Query Performance

**Latency:**
- Embedding generation: ~100ms
- Pinecone query: ~50-200ms
- Total overhead: ~150-300ms
- Minimal impact on response time

**Optimization:**
- Parallel embedding + Pinecone query
- Cache frequent queries (future)
- Batch operations where possible

## API Endpoints

### Check Memory Status

```bash
GET /api/memory/status
```

**Response:**
```json
{
  "connected": true,
  "indexName": "trading-ai",
  "dimension": 1536,
  "namespaces": [
    "conversations",
    "journal",
    "knowledge-base"
  ]
}
```

### Search Memory

```bash
GET /api/memory/search?query=order blocks&namespace=conversations&limit=5
```

**Response:**
```json
{
  "results": [
    {
      "id": "msg_123",
      "score": 0.89,
      "metadata": {
        "content": "Order blocks are institutional levels...",
        "userId": "user_456",
        "timestamp": "2024-01-15T10:00:00Z"
      }
    }
  ]
}
```

See [API Reference](../api-reference.md) for complete documentation.

## Troubleshooting

### Memory Not Working

**Symptoms:**
- AI doesn't remember past conversations
- Chat works but no context

**Check:**
1. Pinecone API key in .env?
2. Index name correct?
3. OpenAI API key configured?
4. Check `/api/memory/status`

**Solutions:**
- Add PINECONE_API_KEY to .env
- Verify index exists in Pinecone console
- Restart dev server
- Check browser console for errors

### Search Returns No Results

**Possible Causes:**
- No data indexed yet
- Namespace empty
- Query too specific
- Index recently created (needs time)

**Solutions:**
- Have some chat conversations first
- Index knowledge base
- Try broader queries
- Check Pinecone console for vector counts

### High Latency

**Symptoms:**
- Chat responses slow
- Long wait times

**Causes:**
- Pinecone in different region
- Free tier throttling
- Large result sets

**Solutions:**
- Use same region for Pinecone and app
- Reduce limit parameter
- Upgrade Pinecone tier if needed
- Cache frequent queries

## Privacy & Security

### Data Isolation

**User Filtering:**
- All queries filter by userId
- Can't access other users' memories
- Database-level isolation

**Metadata:**
- No sensitive data in vectors
- Content stored as metadata (searchable)
- Encrypted in transit

### Data Retention

**Current:**
- Indefinite storage
- No auto-deletion
- Accumulates over time

**Future:**
- Configurable retention period
- Manual delete options
- Selective memory clearing

### API Key Security

**Best Practices:**
- Never commit API keys
- Use .env files
- Rotate keys periodically
- Monitor usage in Pinecone console

## Advanced Usage

### Custom Namespaces

**Creating:**
```typescript
await index.namespace('my-custom-namespace').upsert([
  {
    id: 'custom_1',
    values: embedding,
    metadata: { ... }
  }
]);
```

### Metadata Filtering

**Filter by User:**
```typescript
const results = await index.namespace('conversations').query({
  vector: queryEmbedding,
  topK: 5,
  filter: {
    userId: { $eq: 'user_123' }
  }
});
```

**Filter by Date:**
```typescript
const results = await index.namespace('conversations').query({
  vector: queryEmbedding,
  topK: 5,
  filter: {
    timestamp: { $gte: '2024-01-01T00:00:00Z' }
  }
});
```

### Hybrid Search (Future)

Combine vector search with keyword filters:
```typescript
const results = await index.namespace('conversations').query({
  vector: queryEmbedding,
  topK: 5,
  filter: {
    userId: 'user_123',
    tags: { $in: ['ICT', 'Order Block'] }
  }
});
```

## Monitoring & Maintenance

### Monitor Usage

**Pinecone Console:**
- Vector count by namespace
- Query volume
- Storage used
- API calls

**Check Status Endpoint:**
```bash
curl http://localhost:3006/api/memory/status
```

### Maintenance Tasks

**Regular:**
- Monitor vector counts
- Check query performance
- Review API usage

**Occasional:**
- Clean up old conversations (future)
- Reindex knowledge base after updates
- Optimize metadata structure

## Related Systems

- [AI Providers](./ai-providers.md) - Generate embeddings via OpenAI
- [Knowledge Base](../features/knowledge-base.md) - Uses memory for search
- [Chat](../features/chat.md) - Primary memory consumer

## Further Reading

- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [RAG Explained](https://www.anthropic.com/index/contextual-retrieval)
