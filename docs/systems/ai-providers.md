# AI Providers
> This document is authoritative. Implementation must strictly conform to it.

Dual AI provider configuration with Anthropic Claude and OpenAI GPT integration.

## Overview

The platform supports two AI providers:
- **Anthropic Claude**: Detailed analysis, nuanced responses
- **OpenAI GPT**: Fast responses, code generation, embeddings

Both providers offer:
- Streaming responses
- Multiple model tiers
- Configurable defaults
- Per-conversation switching

## Anthropic Claude

### Models

**Claude 3 Opus:**
- **ID**: `claude-3-opus-20240229`
- **Context**: 200K tokens
- **Capabilities**: Most intelligent, best for complex analysis
- **Use Cases**: Deep strategy analysis, learning complex concepts
- **Cost**: ~$15/$75 per 1M tokens (input/output)
- **Speed**: Slower

**Claude 3 Sonnet (Recommended):**
- **ID**: `claude-3-sonnet-20240229`
- **Context**: 200K tokens
- **Capabilities**: Balanced intelligence and speed
- **Use Cases**: General trading questions, daily analysis
- **Cost**: ~$3/$15 per 1M tokens
- **Speed**: Medium

**Claude 3 Haiku:**
- **ID**: `claude-3-haiku-20240307`
- **Context**: 200K tokens
- **Capabilities**: Fast responses, simpler tasks
- **Use Cases**: Quick questions, simple lookups
- **Cost**: ~$0.25/$1.25 per 1M tokens
- **Speed**: Fastest

### Setup

**API Key:**
1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Navigate to Settings → API Keys
3. Create new API key
4. Copy key (starts with `sk-ant-api03-`)
5. Add to `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

**Default Model:**
- Configure in Settings → AI Preferences
- Select from Opus, Sonnet, Haiku
- Applies to all new conversations

### SDK Integration

**Package**: `@anthropic-ai/sdk`

**Streaming Example:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const stream = await anthropic.messages.stream({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Explain order blocks' }
  ],
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    process.stdout.write(chunk.delta.text);
  }
}
```

**Implementation:** [src/lib/ai/anthropic.ts](../src/lib/ai/anthropic.ts)

### Features

**Streaming:**
- Token-by-token responses
- Real-time updates
- Server-Sent Events (SSE)
- Cancelable

**System Prompts:**
- Persona configuration
- Trading knowledge injection
- Response format instructions

**Tool Use:**
- Function calling (future)
- Chart analysis (future)
- Calculator integration (future)

### Rate Limits

**Free Tier:**
- Not available
- Must add payment method

**Paid:**
- Tier 1: 50 requests/min
- Tier 2: 100 requests/min
- Tier 3: 200 requests/min
- Tier 4: 400 requests/min

**Tiers increase with usage over time.**

## OpenAI GPT

### Models

**GPT-4 Turbo (Recommended):**
- **ID**: `gpt-4-turbo-preview`
- **Context**: 128K tokens
- **Capabilities**: Latest GPT-4, fast and capable
- **Use Cases**: General questions, quick analysis
- **Cost**: ~$10/$30 per 1M tokens
- **Speed**: Fast

**GPT-4:**
- **ID**: `gpt-4`
- **Context**: 8K tokens
- **Capabilities**: Stable, proven model
- **Use Cases**: Reliable responses, code generation
- **Cost**: ~$30/$60 per 1M tokens
- **Speed**: Medium

**GPT-3.5 Turbo:**
- **ID**: `gpt-3.5-turbo`
- **Context**: 16K tokens
- **Capabilities**: Fast, economical
- **Use Cases**: Simple questions, high volume
- **Cost**: ~$0.50/$1.50 per 1M tokens
- **Speed**: Very fast

### Setup

**API Key:**
1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Navigate to API Keys
3. Create new secret key
4. Copy key (starts with `sk-`)
5. Add to `.env`:
   ```env
   OPENAI_API_KEY=sk-...
   ```

**Default Model:**
- Configure in Settings → AI Preferences
- Select from GPT-4 Turbo, GPT-4, GPT-3.5
- Applies to all new conversations

### SDK Integration

**Package**: `openai`

**Streaming Example:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stream = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    { role: 'user', content: 'Explain order blocks' }
  ],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

**Implementation:** [src/lib/ai/openai.ts](../src/lib/ai/openai.ts)

### Additional Uses

**Embeddings:**
- Model: `text-embedding-3-small`
- Dimensions: 1536
- Used for vector memory
- Cost: ~$0.00002 per 1K tokens

**Embeddings Example:**
```typescript
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Order blocks are institutional levels',
});

const embedding = response.data[0].embedding; // 1536-dim vector
```

### Rate Limits

**Free Tier:**
- 3 requests/min (very limited)
- Recommend adding payment

**Tier 1 (Paid):**
- 500 requests/min
- 200,000 tokens/min

**Higher Tiers:**
- Increase with usage
- Up to 10,000 requests/min

## Choosing a Provider

### When to Use Claude

**Best For:**
- Learning trading concepts
- Complex strategy analysis
- Detailed explanations
- Nuanced market analysis
- Long-form content

**Advantages:**
- Larger context window
- More detailed responses
- Better at reasoning
- Safer responses (less hallucination)

**Disadvantages:**
- Slightly slower
- Can be verbose
- Higher cost (Opus)

### When to Use GPT

**Best For:**
- Quick questions
- Code examples
- Calculations
- Concise answers
- High-volume queries

**Advantages:**
- Faster responses
- More concise
- Lower cost (GPT-3.5)
- Good at structured output

**Disadvantages:**
- Smaller context (GPT-4)
- Can hallucinate more
- Less nuanced

### Recommendation

**Start with:**
- Claude Sonnet for most tasks
- GPT-4 Turbo for quick questions

**Experiment:**
- Try same question on both
- Compare quality
- Find your preference
- Use per-conversation switching

## Provider Switching

### Per-Conversation

**In Chat Interface:**
1. Open chat
2. Click provider dropdown
3. Select "Claude (Anthropic)" or "GPT (OpenAI)"
4. Next message uses selected provider
5. Can switch mid-conversation

**API:**
```typescript
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: [...],
    provider: 'anthropic' // or 'openai'
  })
});
```

### Default Provider

**In Settings:**
1. Go to Settings → AI Preferences
2. Select "Default AI Provider"
3. Choose Anthropic or OpenAI
4. Save settings

**Effect:**
- New conversations use this provider
- Existing conversations unchanged
- Can override per-conversation

## Cost Management

### Estimating Costs

**Average Chat Message:**
- Input: ~500 tokens
- Output: ~500 tokens
- Total: ~1000 tokens per exchange

**Monthly Estimates:**

| Usage | Claude Sonnet | GPT-4 Turbo | GPT-3.5 |
|-------|---------------|-------------|---------|
| 100 messages | $1.80 | $4.00 | $0.20 |
| 500 messages | $9.00 | $20.00 | $1.00 |
| 1000 messages | $18.00 | $40.00 | $2.00 |

**Embeddings (for memory):**
- 1000 messages: ~$0.002 (negligible)

### Cost Optimization

**Strategies:**
1. Use lower-tier models for simple questions
2. Keep prompts concise
3. Use GPT-3.5 for high-volume tasks
4. Monitor usage in provider dashboards
5. Set billing alerts

**Model Selection:**
- Haiku/GPT-3.5: Routine questions
- Sonnet/GPT-4 Turbo: Important analysis
- Opus/GPT-4: Critical decisions only

### Monitoring Usage

**Anthropic Console:**
- [console.anthropic.com](https://console.anthropic.com/)
- View API usage
- Check spending
- Set budgets (future)

**OpenAI Dashboard:**
- [platform.openai.com/usage](https://platform.openai.com/usage)
- Detailed usage stats
- Cost breakdown
- Billing alerts

## Error Handling

### Common Errors

**Invalid API Key:**
```json
{
  "error": {
    "type": "authentication_error",
    "message": "Invalid API key"
  }
}
```
**Solution:** Verify API key in .env, restart server

**Rate Limit Exceeded:**
```json
{
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded"
  }
}
```
**Solution:** Wait and retry, upgrade tier, use different model

**Context Length Exceeded:**
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Maximum context length exceeded"
  }
}
```
**Solution:** Shorten conversation history, use higher-context model

### Graceful Degradation

**If Anthropic Unavailable:**
- Fall back to OpenAI
- Show warning to user
- Continue functionality

**If OpenAI Unavailable:**
- Fall back to Anthropic
- Embeddings fail (use keyword search)
- Show warning

**If Both Unavailable:**
- Chat disabled
- Show error message
- Other features unaffected

## Configuration

### Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...

# Optional (defaults shown)
ANTHROPIC_MODEL=claude-3-sonnet-20240229
OPENAI_MODEL=gpt-4-turbo-preview
```

### System Prompts

**Trading-Specific:**
```typescript
const systemPrompt = `You are a trading assistant specializing in ICT concepts and scalping techniques. Provide detailed, accurate information about trading strategies, risk management, and market analysis. Reference concepts from the knowledge base when relevant.`;
```

**Customization:**
- Edit in [src/lib/ai/chat.ts](../src/lib/ai/chat.ts)
- Add persona details
- Include trading rules
- Format response style

## API Implementation

### Chat Endpoint

**File:** [src/app/api/chat/route.ts](../src/app/api/chat/route.ts)

**Flow:**
1. Receive request with messages + provider
2. Retrieve memory context (if Pinecone configured)
3. Call selected AI provider
4. Stream response to client
5. Save conversation to memory

**Provider Selection:**
```typescript
if (provider === 'anthropic') {
  stream = await generateAnthropicResponse(messages);
} else {
  stream = await generateOpenAIResponse(messages);
}
```

## Troubleshooting

### Provider Not Responding

**Check:**
1. API key configured correctly?
2. Internet connection active?
3. Provider status page (outage?)
4. Rate limits exceeded?

**Solutions:**
- Verify .env variables
- Test API key with curl
- Check provider status page
- Wait and retry

### Responses Seem Off

**Quality Issues:**
- Wrong model selected?
- System prompt needs tuning?
- Context too long/short?

**Solutions:**
- Check model in Settings
- Review system prompt
- Adjust conversation history length
- Try different provider

## Related Systems

- [Memory System](./memory-system.md) - Uses OpenAI for embeddings
- [Chat Feature](../features/chat.md) - Primary AI provider consumer
- [Knowledge Base](../features/knowledge-base.md) - Provides context to AI

## Further Reading

- [Anthropic Documentation](https://docs.anthropic.com/)
- [OpenAI Documentation](https://platform.openai.com/docs/)
- [Anthropic Model Comparison](https://docs.anthropic.com/claude/docs/models-overview)
- [OpenAI Model Comparison](https://platform.openai.com/docs/models)
