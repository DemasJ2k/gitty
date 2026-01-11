# Trading Journal
> This document is authoritative. Implementation must strictly conform to it.

Track your trades, analysis, and notes with emotional tracking and analytics.

## Overview

The Trading Journal provides:
- **Trade Logging**: Record entries, exits, P/L, and trade details
- **Analysis Notes**: Document market analysis without trade execution
- **General Notes**: Quick thoughts and observations
- **Emotional Tracking**: Monitor pre-trade confidence and post-trade emotions
- **Tags & Categories**: Organize entries with custom tags
- **Analytics Dashboard**: Visualize performance metrics
- **Filtering & Search**: Find entries quickly

## Entry Types

### 1. Trade Entry

Complete trade documentation with financial metrics.

**Required Fields:**
- Title
- Trade Date & Time
- Market (Forex, Crypto, Stocks, Metals)
- Symbol (e.g., EUR/USD, BTC/USD, AAPL)
- Direction (Long/Short)
- Entry Price
- Exit Price

**Optional Fields:**
- Stop Loss
- Take Profit
- Position Size
- Risk/Reward Ratio
- Profit/Loss
- Content (markdown notes)
- Emotional data
- Tags

**Example:**
```
Title: EUR/USD Long - Order Block Entry
Trade Date: 2024-01-15 14:30
Market: Forex
Symbol: EUR/USD
Direction: Long
Entry: 1.0850
Exit: 1.0920
Stop Loss: 1.0800
Take Profit: 1.0950
P/L: $70
Tags: ICT, Order Block, Win
```

### 2. Analysis Entry

Market analysis and trading ideas without execution.

**Use For:**
- Pre-market analysis
- Chart pattern identification
- Strategy development
- Learning notes

**Fields:**
- Title
- Content (markdown)
- Market & Symbol (optional)
- Tags

**Example:**
```
Title: EUR/USD Weekly Structure Analysis
Content:
# Market Structure
- Higher highs on 4H
- Bullish order block at 1.0800
- FVG unfilled at 1.0880

# Bias: Long above 1.0850

Tags: ICT, Market Structure, EUR/USD
```

### 3. Note Entry

Quick thoughts, reminders, and observations.

**Use For:**
- Trading rules reminders
- Psychological observations
- Questions to research
- Lessons learned

**Example:**
```
Title: Reminder - Don't Trade Before News
Content: Lost $50 today trading 5 min before NFP.
Remember to check economic calendar first!

Tags: Lesson, Psychology
```

## Creating Entries

### Manual Entry Creation

1. Go to Journal page
2. Click "New Entry" button
3. Select entry type (Trade/Analysis/Note)
4. Fill in fields
5. Add tags (optional)
6. Click "Save Entry"

### From Chat Conversation

1. Have a conversation in Chat
2. Click "Save to Journal" button
3. Conversation saved as Analysis entry
4. Title: "Trading Discussion - [Date]"

### Quick Trade Entry

1. After closing a trade
2. Click "Quick Entry" (future feature)
3. Pre-filled with symbol from active chart
4. Add details and save

## Emotional Tracking

### Pre-Trade Confidence

Rate your confidence before entering a trade (1-10):

- **1-3**: Low confidence, uncertain
- **4-6**: Moderate confidence, some doubts
- **7-8**: High confidence, setup confirmed
- **9-10**: Very high confidence, all criteria met

**Benefits:**
- Correlate confidence with outcomes
- Identify patterns in decision quality
- Improve trade selection

### Post-Trade Emotions

Select emotions after trade closes:

**Positive:**
- Satisfied
- Excited
- Focused
- Confident
- Proud

**Negative:**
- Frustrated
- Anxious
- Regretful
- Impatient
- Disappointed

**Neutral:**
- Calm
- Neutral
- Tired

**Benefits:**
- Track emotional patterns
- Identify triggers
- Improve psychology

**Example Correlation:**
```
High Confidence + Satisfied = Win (good setup)
Low Confidence + Regretful = Loss (revenge trading)
High Confidence + Frustrated = Loss (overconfidence)
```

## Tags & Organization

### Using Tags

**Purpose:**
- Categorize entries
- Filter by strategy
- Track patterns
- Analyze performance by category

**Common Tags:**
- **Strategy**: ICT, Scalping, Swing, Breakout
- **Pattern**: Order Block, FVG, Liquidity Grab
- **Outcome**: Win, Loss, Break-even
- **Session**: London, New York, Asian
- **Setup Quality**: A-Setup, B-Setup, C-Setup

**Adding Tags:**
1. Type in "Tags" field
2. Comma-separated
3. Auto-suggest from existing tags
4. Case-insensitive

**Example Tagging:**
```
Entry 1: ICT, Order Block, Win, London
Entry 2: ICT, FVG, Loss, Revenge Trade
Entry 3: Scalping, RSI, Win, New York
```

### Filtering by Tags

1. Go to Journal page
2. Click "Filter" button
3. Select tags
4. View filtered entries

**Multi-Tag Filtering:**
- Select multiple tags
- Shows entries with ALL selected tags (AND logic)
- Clear filters to see all

## Analytics Dashboard

### Key Metrics

**Performance Stats:**
- Total Trades
- Win Rate (%)
- Total Profit/Loss
- Average Win
- Average Loss
- Largest Win
- Largest Loss
- Profit Factor

**Example Display:**
```
Total Trades: 47
Win Rate: 63.8% (30 wins / 17 losses)
Total P/L: +$1,240
Average Win: $65
Average Loss: -$42
Profit Factor: 1.55
```

### Visualizations

**P/L Chart:**
- Cumulative profit/loss over time
- Line chart
- Identify streaks and drawdowns

**Win Rate by Tag:**
- Bar chart
- Compare performance across strategies
- Example: ICT (68%), Scalping (55%)

**Emotional Analysis:**
- Confidence vs. Outcome correlation
- Emotion frequency distribution

**Market Performance:**
- P/L by market (Forex, Crypto, Stocks)
- Best/worst performing symbols

### Time-Based Analysis

**Filters:**
- Last 7 days
- Last 30 days
- Last 90 days
- Year to date
- All time
- Custom date range

**Session Analysis:**
- Best performing time of day
- Avoid low-performance sessions

## Filtering & Search

### Filter Options

**By Type:**
- All entries
- Trades only
- Analysis only
- Notes only

**By Date Range:**
- Custom start/end dates
- Quick filters (today, this week, this month)

**By Market:**
- Forex
- Crypto
- Stocks
- Metals

**By Direction:**
- Long only
- Short only

**By Outcome:**
- Wins only
- Losses only
- Break-even

**By Tags:**
- Multi-select tags
- Combine with other filters

### Text Search

Search across:
- Entry titles
- Content (markdown)
- Symbols
- Tags

**Example Searches:**
- "EUR/USD" - Find all EUR/USD trades
- "order block" - Find entries mentioning order blocks
- "frustrated" - Find emotionally challenging trades

## Configuration

### Default Settings

Configure in Settings → Trading Preferences:

- Default Market: Forex/Crypto/Stocks/Metals
- Default Risk per Trade: 1-2%
- Default Position Size calculation

### Journal Display

**Entry List View:**
- Card layout (default)
- Table layout (future)
- Compact list (future)

**Sort Options:**
- Most recent first (default)
- Oldest first
- Highest P/L
- Lowest P/L

## API Integration

### Create Entry

```typescript
const response = await fetch('/api/journal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'Trade',
    title: 'EUR/USD Long',
    content: 'Markdown content...',
    tradeDate: new Date().toISOString(),
    market: 'Forex',
    symbol: 'EUR/USD',
    direction: 'Long',
    entryPrice: 1.0850,
    exitPrice: 1.0920,
    stopLoss: 1.0800,
    takeProfit: 1.0950,
    profitLoss: 70,
    emotions: {
      preTradeConfidence: 8,
      postTradeEmotions: ['satisfied', 'focused']
    },
    tags: ['ICT', 'Order Block', 'Win']
  }),
});

const entry = await response.json();
```

### Get Entries

```typescript
const response = await fetch('/api/journal?type=Trade&tags=ICT');
const { entries } = await response.json();
```

See [API Reference](../api-reference.md) for complete documentation.

## Tips & Best Practices

### Consistent Logging

**Log Every Trade:**
- Don't cherry-pick wins
- Loss analysis more valuable than win analysis
- Honest logging improves performance

**Log Immediately:**
- Right after trade closes
- Emotions and details fresh
- More accurate emotional tracking

### Detailed Notes

**What to Include:**
- Why you entered (setup checklist)
- What you saw (patterns, confirmations)
- How you felt (emotions, confidence)
- What you learned (mistakes, insights)

**Example Good Notes:**
```markdown
# Setup
- Bullish order block at 1.0850
- Price tapped block with long wick
- Higher timeframe bullish structure
- Confirmed on 5m chart

# Execution
- Entry: 1.0850 (exact block touch)
- Stop: 1.0800 (below block)
- Target: 1.0920 (next resistance)

# Outcome
- Hit target in 2 hours
- Felt confident throughout
- Good patience waiting for entry

# Lessons
- Order block entries work well in trending markets
- 5m confirmation adds accuracy
```

### Tag Systematically

**Create Tag Categories:**
- Strategy tags: ICT, Scalping, Swing
- Pattern tags: OB, FVG, Liquidity
- Quality tags: A-Setup, B-Setup
- Outcome tags: Win, Loss
- Emotional tags: Revenge, FOMO, Patient

**Be Consistent:**
- Use same tag spellings
- Don't create duplicates (ICT vs ict)
- Review and merge similar tags

### Review Regularly

**Weekly Review:**
- Review all trades from the week
- Calculate win rate and P/L
- Identify patterns (good and bad)
- Adjust strategy if needed

**Monthly Review:**
- Deeper performance analysis
- Strategy effectiveness comparison
- Emotional pattern identification
- Set goals for next month

### Use Analytics

**Questions to Answer:**
- Which strategy has highest win rate?
- Which market am I best at trading?
- Do confident trades outperform uncertain ones?
- Which emotions correlate with losses?
- What time of day do I trade best?

## Troubleshooting

### Entry Not Saving

**Check:**
1. Required fields filled?
2. Dates in valid format?
3. Numbers in correct format?
4. Browser console for errors?

**Solution:**
- Fill all required fields (marked with *)
- Use date picker for dates
- Enter numbers without currency symbols

### Analytics Not Updating

**Refresh:**
- Navigate away and back
- Refresh browser
- Check if recent entries included

**Calculation Issues:**
- Verify P/L values entered correctly
- Check date filters applied

### Can't Find Entry

**Search Tips:**
- Check filters applied
- Expand date range
- Search by symbol or tag
- Try text search

## Related Features

- [Chat](./chat.md) - Save conversations to journal
- [Strategies](./strategies.md) - Link strategies to trades
- [Charts](./charts.md) - View charts while journaling

## Future Enhancements

- **Image Uploads**: Attach chart screenshots
- **Voice Notes**: Record audio observations
- **PDF Export**: Export journal as PDF report
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: Log trades on mobile
- **Broker Integration**: Auto-import trades
