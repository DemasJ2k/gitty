# AI Chat
> This document is authoritative. Implementation must strictly conform to it.

AI-powered trading conversations with context-aware responses using Claude and GPT.

## Overview

The Chat feature provides:
- **Dual AI Providers**: Switch between Anthropic Claude and OpenAI GPT
- **Streaming Responses**: Real-time token-by-token replies
- **Vector Memory**: Context-aware conversations using past interactions
- **Conversation History**: Save and resume previous chats
- **Knowledge Integration**: Automatic retrieval from trading knowledge base
- **Save to Journal**: Convert conversations into journal entries

## Getting Started

### Starting a Conversation

1. Navigate to the Chat page (default dashboard view)
2. Type your message in the input box
3. Select AI provider (Claude or GPT)
4. Press Enter or click Send

**Example Prompts:**
- "Explain order blocks in ICT trading"
- "What's the best timeframe for scalping?"
- "Analyze EUR/USD market structure"
- "How do I identify fair value gaps?"

### First Message Auto-Title

The first message in a conversation automatically becomes the conversation title (truncated to 50 characters).

Example:
- Message: "Explain order blocks in ICT trading"
- Title: "Explain order blocks in ICT trading"

## Features & Usage

### AI Provider Selection

Switch between two AI providers on-the-fly:

**Anthropic Claude:**
- Models: Opus, Sonnet, Haiku
- Best for: Detailed explanations, nuanced analysis
- Default: Sonnet (balanced quality/speed)

**OpenAI GPT:**
- Models: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- Best for: Quick responses, code examples
- Default: GPT-4 Turbo

**How to Switch:**
1. Click provider dropdown in chat input
2. Select "Claude (Anthropic)" or "GPT (OpenAI)"
3. Next message uses selected provider

**Model Selection:**
- Configure in Settings → AI Preferences
- Choose default model for each provider
- Applied to all conversations

### Conversation Management

**Create New Conversation:**
- Click "New Chat" button in sidebar
- Or click logo in sidebar
- Starts fresh conversation

**Resume Conversation:**
- Click any conversation in sidebar
- Full message history loads
- Continue where you left off

**View Conversation List:**
- Sidebar shows all conversations
- Sorted by most recent
- Shows conversation title and timestamp

**Delete Conversation:**
- Hover over conversation in sidebar
- Click delete icon (trash)
- Confirm deletion

### Vector Memory System

The chat integrates with Pinecone for context-aware responses:

**How It Works:**
1. Your message is converted to a vector embedding
2. System searches past conversations for similar context
3. Top 5 relevant snippets retrieved
4. Context injected into AI prompt
5. AI responds with awareness of past discussions

**Example:**

```
You (3 days ago): "What are order blocks?"
AI: "Order blocks are institutional footprints..."

You (today): "How do I trade them?"
AI: "Based on our previous discussion about order blocks,
     here's how to trade them: ..."
```

**Without Pinecone:**
- Chat still works normally
- No context from past conversations
- Each conversation independent

### Knowledge Base Integration

Chat automatically searches the knowledge base for relevant content:

**Automatic Retrieval:**
- Mention trading concepts (order blocks, FVG, etc.)
- System searches knowledge base
- Relevant content added to context
- AI references documentation in response

**Example:**

```
You: "Explain fair value gaps"
System: [Retrieves FVG knowledge base article]
AI: "Based on the ICT documentation, fair value gaps are..."
```

**Manual Search:**
- Type "/kb [search term]" (future feature)
- Browse knowledge base separately

### Streaming Responses

Responses appear token-by-token in real-time:

**Benefits:**
- See AI "thinking" process
- Faster perceived response time
- Stop generation if answer complete

**Indicators:**
- Typing animation while streaming
- Input disabled during generation
- Can't send new message until complete

### Save to Journal

Convert conversations into journal entries:

**How to Save:**
1. Click "Save to Journal" button in chat header
2. Conversation exported as markdown
3. Saved as "Analysis" type journal entry
4. Title: "Trading Discussion - [Date]"

**Journal Entry Format:**
```markdown
# Conversation

**User:** [Your message]

**AI:** [AI response]

**User:** [Next message]

...
```

**Use Cases:**
- Save important trading insights
- Document learning sessions
- Create reference material
- Track AI-assisted analysis

## Configuration

### Default Provider

Set your preferred AI provider:

1. Go to Settings → AI Preferences
2. Select "Default AI Provider"
3. Choose Anthropic or OpenAI
4. Applies to all new conversations

### Model Selection

**Claude Models:**
- **Opus**: Most capable, slowest, highest cost
- **Sonnet**: Balanced (recommended)
- **Haiku**: Fastest, lowest cost

**GPT Models:**
- **GPT-4 Turbo**: Latest, most capable
- **GPT-4**: Stable, reliable
- **GPT-3.5 Turbo**: Fast, economical

Configure in Settings → AI Preferences

### Memory Settings

**Enable/Disable Memory:**
- Configure Pinecone in .env
- Leave blank to disable
- No UI toggle currently

**Clear Memory:**
- Not currently supported
- Future: Clear all past context

## API Integration

### Send Message

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Your message' }
    ],
    provider: 'anthropic',
    conversationId: 'optional-id'
  }),
});

// Handle streaming response
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const text = line.slice(6);
      console.log(text); // Process token
    }
  }
}
```

### List Conversations

```typescript
const response = await fetch('/api/conversations');
const { conversations } = await response.json();
```

### Get Conversation

```typescript
const response = await fetch(`/api/conversations/${id}`);
const conversation = await response.json();
```

See [API Reference](../api-reference.md) for complete documentation.

## Tips & Best Practices

### Writing Effective Prompts

**Be Specific:**
```
❌ "Tell me about trading"
✅ "Explain how to identify order blocks on a 5-minute EUR/USD chart"
```

**Provide Context:**
```
❌ "What should I do?"
✅ "I'm scalping EUR/USD and see a bullish order block at 1.0850.
    Price just tapped it. What's my confirmation checklist?"
```

**Ask Follow-ups:**
```
You: "Explain fair value gaps"
AI: [Detailed explanation]
You: "How do I differentiate between entry FVGs and continuation FVGs?"
```

### Using Multiple Providers

**Strategy:**
- Use Claude for: Deep analysis, learning concepts, strategy development
- Use GPT for: Quick answers, calculations, technical questions

**Example Workflow:**
1. Ask Claude: "Explain the full ICT trading framework"
2. Ask GPT: "Give me a 3-step checklist for ICT entries"

### Conversation Organization

**One Topic Per Conversation:**
- Create separate conversations for different topics
- Easier to find later
- Better context retention

**Descriptive First Message:**
- First message becomes title
- Make it descriptive and searchable
- Example: "EUR/USD Swing Trading Strategy Development"

### Memory Optimization

**With Pinecone Enabled:**
- Similar questions get better answers over time
- AI learns your trading style
- Consistent terminology across conversations

**Without Pinecone:**
- Provide full context in each conversation
- Reference previous topics explicitly
- Expect some repetition

## Troubleshooting

### Chat Not Responding

**Check:**
1. API keys configured in .env
2. Selected provider has valid API key
3. Browser console for errors
4. Network connectivity

**Solution:**
- Try switching providers
- Check Settings → AI Preferences
- Verify API keys in .env
- Restart dev server

### Streaming Interrupted

**Symptoms:**
- Response stops mid-sentence
- Incomplete answer

**Causes:**
- Network disconnection
- API timeout
- Rate limit reached

**Solution:**
- Refresh page
- Ask question again
- Check API usage/limits
- Wait a moment before retrying

### No Context from Past Conversations

**Symptoms:**
- AI doesn't remember previous topics
- Repeated explanations

**Check:**
1. Pinecone configured in .env?
2. Memory system status: `/api/memory/status`
3. Vectors stored in Pinecone console

**Solution:**
- Configure Pinecone API key
- Restart server
- Check Pinecone console for vectors

### Save to Journal Fails

**Error:** "No conversation to save"

**Solution:**
- Ensure conversation exists
- Send at least one message
- Check authentication

**Error:** "Failed to save to journal"

**Solution:**
- Check browser console
- Verify database connection
- Check server logs

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line in message |
| `Ctrl+K` | Focus input (future) |
| `Ctrl+N` | New conversation (future) |

## Related Features

- [Knowledge Base](./knowledge-base.md) - Browse trading concepts
- [Journal](./journal.md) - Save conversations as entries
- [Settings](./settings.md) - Configure AI providers

## Advanced Usage

### Custom System Prompts (Future)

Not currently supported. Future feature:
- Define trading style
- Set preferred terminology
- Configure response format

### Voice Input (Future)

Not currently supported. Future feature:
- Speak questions
- Hands-free trading analysis
- Mobile-friendly

### Multi-modal Analysis (Future)

Not currently supported. Future feature:
- Upload chart screenshots
- AI analyzes images
- Annotated pattern recognition
