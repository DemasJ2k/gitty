# Strategies
> This document is authoritative. Implementation must strictly conform to it.

Create, manage, and organize your trading strategies with detailed rules and categorization.

## Overview

The Strategies feature provides:
- **Strategy Library**: Store all your trading strategies
- **Detailed Rules**: Entry, exit, and risk management rules
- **Categorization**: Organize by category, market, timeframe
- **Risk Levels**: Classify by risk tolerance
- **Tags**: Flexible organization system
- **Search & Filter**: Find strategies quickly
- **Playbook Linking**: Connect strategies to step-by-step playbooks

## Creating a Strategy

### Basic Information

**Required Fields:**
- **Name**: Descriptive strategy name
- **Description**: Brief overview of strategy purpose
- **Category**: Type of strategy (Scalping, Day Trading, Swing, etc.)

**Optional Fields:**
- Market (Forex, Crypto, Stocks, Metals)
- Timeframe (5m, 15m, 1h, 4h, 1d)
- Risk Level (Low, Medium, High)
- Tags

**Example:**
```
Name: ICT Order Block Scalping
Description: Quick scalps using ICT order blocks
           on 5-minute timeframe for high R:R setups
Category: Scalping
Market: Forex
Timeframe: 5m
Risk Level: Medium
Tags: ICT, Order Block, Intraday
```

### Strategy Rules

Define your strategy with structured rules:

**Entry Rules:**
- Conditions that must be met to enter trade
- Numbered list for clarity
- Include confirmations

**Exit Rules:**
- Take profit criteria
- Stop loss placement
- Trailing stop rules
- Partial profit taking

**Risk Management:**
- Position sizing rules
- Maximum risk per trade
- Daily loss limits
- Correlation rules

**Example Entry Rules:**
```
1. Identify bullish order block on 1h chart
2. Wait for price to return to order block
3. Switch to 5m chart for confirmation
4. Look for long-wick rejection at order block
5. Enter long on close of confirmation candle
6. Stop loss: 5 pips below order block
7. Take profit: 1:2 or 1:3 risk-reward
```

### JSON Rule Structure

Rules stored as JSON for flexibility:

```json
{
  "entry": [
    "Identify bullish order block on 1h chart",
    "Wait for price to return to order block",
    "Look for 5m confirmation candle",
    "Enter long on close of confirmation"
  ],
  "exit": [
    "Take profit at 1:2 R:R minimum",
    "Move SL to breakeven at 1:1",
    "Consider trailing stop after 1:1"
  ],
  "risk": [
    "Max 1% risk per trade",
    "Position size based on SL distance",
    "No more than 3 concurrent positions"
  ]
}
```

## Strategy Categories

### Predefined Categories

**Scalping:**
- Quick in/out trades
- Small profits, high frequency
- Intraday focus

**Day Trading:**
- Positions held within trading day
- No overnight exposure
- Multiple trades per day

**Swing Trading:**
- Positions held days to weeks
- Fewer trades, larger moves
- Less time intensive

**Position Trading:**
- Long-term positions
- Weeks to months
- Fundamental-driven

**Breakout:**
- Trade support/resistance breaks
- High momentum focus
- Clear invalidation

**Reversal:**
- Counter-trend entries
- Higher risk/reward
- Requires strong confirmation

**Custom:**
- Your own categories
- Flexible classification

### Creating Custom Categories

1. Go to Strategies page
2. Click "New Strategy"
3. Type custom category name
4. Saved for future use

## Risk Levels

Classify strategies by risk profile:

**Low Risk:**
- Conservative position sizing
- Tight stop losses
- High win rate focus
- Example: Slow trend following

**Medium Risk:**
- Balanced approach
- Standard position sizing
- Good risk-reward
- Example: Order block trading

**High Risk:**
- Aggressive position sizing
- Wider stops
- Lower win rate, high R:R
- Example: Breakout trading

**Benefits:**
- Filter strategies by risk tolerance
- Match strategies to market conditions
- Portfolio diversification

## Markets & Timeframes

### Market Assignment

Specify which markets strategy applies to:

**Single Market:**
- Forex only
- Crypto only
- Stocks only

**Multiple Markets:**
- Leave blank for universal
- Add market-specific notes in description

**Market-Specific Strategies:**
- Crypto: High volatility, 24/7
- Forex: Specific sessions (London, NY)
- Stocks: Regular trading hours
- Metals: Different fundamentals

### Timeframe Assignment

**Single Timeframe:**
- 5m scalping strategy
- 1h swing entry strategy
- 1d position trading

**Multi-Timeframe:**
- Leave blank if applicable to multiple
- Note in description which TFs work best

**Example:**
```
Strategy: ICT Order Block
Timeframe: 5m (entry), 1h (bias)
Notes: Use 1h for directional bias,
       5m for precise entry timing
```

## Tags & Organization

### Using Tags Effectively

**Strategy Type Tags:**
- ICT, SMC, Price Action
- Technical, Fundamental
- Breakout, Reversal, Continuation

**Market Tags:**
- Forex, Crypto, Stocks
- Major Pairs, Exotics
- Large Cap, Small Cap

**Session Tags:**
- London, New York, Asian
- Pre-Market, After-Hours

**Setup Quality Tags:**
- A-Setup, B-Setup, C-Setup
- High-Conviction, Medium-Conviction

**Performance Tags:**
- Tested, Backtested, Live
- Profitable, Under-Review, Retired

### Tag Best Practices

1. **Be Consistent**: Use same spellings/case
2. **Don't Over-Tag**: 3-5 tags per strategy
3. **Hierarchical**: Category > Subcategory tags
4. **Review Periodically**: Merge similar tags

## Filtering & Search

### Filter Strategies

**By Category:**
- Click category filter
- Shows matching strategies only

**By Market:**
- Select Forex, Crypto, Stocks, or Metals
- Narrows to market-specific strategies

**By Risk Level:**
- Low, Medium, or High
- Useful for risk management

**By Tags:**
- Multi-select tags
- AND logic (all selected tags required)

### Text Search

Search across:
- Strategy names
- Descriptions
- Rule text
- Tags

**Example Searches:**
- "order block" - Find all OB strategies
- "scalping" - Find all scalping strategies
- "EUR/USD" - Find pair-specific strategies

## Linking to Playbooks

### What are Playbooks?

Playbooks are step-by-step execution guides for strategies.

**Strategy ↔ Playbook Relationship:**
- Strategy = WHAT to do (rules, conditions)
- Playbook = HOW to do it (step-by-step process)

### Linking Process

1. Create strategy with rules
2. Create playbook with execution steps
3. Link playbook to strategy
4. Reference during trading

**Example:**
```
Strategy: ICT Order Block Scalping
↓
Playbook: ICT Morning Session Execution
Steps:
1. Review Asian session high/low
2. Mark London open killzone
3. Identify order blocks in range
4. Wait for price to reach OB
5. Check 5m confirmation
6. Execute trade
7. Manage position
```

## Strategy Performance Tracking

### Linking to Journal

Track which strategies actually work:

**Process:**
1. Execute trade using strategy
2. Log trade in Journal
3. Tag with strategy name
4. Review performance by strategy tag

**Analysis:**
- Win rate by strategy
- Average R:R by strategy
- Best performing strategies
- Strategies needing improvement

### Strategy Refinement

**Review Cycle:**
1. Trade strategy for 20+ trades
2. Analyze journal entries tagged with strategy
3. Identify rule violations or edge cases
4. Update strategy rules
5. Repeat

**Metrics to Track:**
- Win rate
- Average R:R
- Maximum drawdown
- Consistency

## API Integration

### Create Strategy

```typescript
const response = await fetch('/api/strategies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'ICT Order Block Scalping',
    description: 'Quick scalps using order blocks...',
    category: 'Scalping',
    market: 'Forex',
    timeframe: '5m',
    riskLevel: 'Medium',
    rules: {
      entry: [
        'Identify bullish order block on 1h',
        'Wait for price return',
        'Confirm on 5m chart'
      ],
      exit: [
        'Target 1:2 R:R',
        'Move SL to BE at 1:1'
      ],
      risk: [
        'Max 1% per trade',
        'No more than 3 positions'
      ]
    },
    tags: ['ICT', 'Order Block', 'Scalping']
  }),
});

const strategy = await response.json();
```

### Get Strategies

```typescript
const response = await fetch('/api/strategies?category=Scalping');
const { strategies } = await response.json();
```

See [API Reference](../api-reference.md) for complete documentation.

## Tips & Best Practices

### Writing Clear Rules

**Be Specific:**
```
❌ "Wait for good setup"
✅ "Wait for price to reach 1h order block with 5m rejection wick"
```

**Measurable Criteria:**
```
❌ "Large volume"
✅ "Volume > 150% of 20-period average"
```

**Sequential Steps:**
```
1. First do this
2. Then check this
3. Finally execute this
```

### Strategy Development Process

**1. Hypothesis:**
- "I believe order blocks provide high R:R setups"

**2. Rule Definition:**
- Define exact entry/exit conditions
- Write them down clearly

**3. Backtesting:**
- Manual chart review
- Test 50+ historical setups
- Document results

**4. Forward Testing:**
- Paper trade strategy
- Log every setup (taken or not)
- Minimum 20 trades

**5. Live Trading:**
- Start with small size
- Refine rules based on results
- Scale up gradually

### Strategy Documentation

**Include in Description:**
- Market conditions where strategy works best
- Conditions where it fails
- Time of day considerations
- Typical win rate and R:R
- Psychological notes

**Example:**
```
Name: London Open Breakout
Description: Trade breakout of Asian range during
           London killzone (3-5 AM EST).

Works Best: High-volatility pairs (GBP/JPY, GBP/USD)
Avoid: Low-liquidity days, major news events
Win Rate: ~60%
R:R: 1:2 minimum
Psychology: Requires patience - wait for clear break
```

### Strategy Maintenance

**Regular Review:**
- Monthly performance review
- Update rules based on learnings
- Archive underperforming strategies
- Document why strategies stopped working

**Version Control:**
- Keep old versions when updating rules
- Note date and reason for changes
- Compare performance across versions

## Troubleshooting

### Can't Save Strategy

**Check:**
- Name field filled?
- Description provided?
- Category selected?
- Valid JSON in rules field?

**Solution:**
- Fill all required fields
- Verify JSON syntax if editing raw
- Check browser console for errors

### Strategy Not Appearing in List

**Check:**
- Filters applied?
- Search query active?
- Saved successfully?

**Solution:**
- Clear all filters
- Empty search box
- Refresh page
- Verify in database (Prisma Studio)

## Related Features

- [Playbooks](./playbooks.md) - Step-by-step execution guides
- [Journal](./journal.md) - Track strategy performance
- [Knowledge Base](./knowledge-base.md) - Learn trading concepts

## Future Enhancements

- **Strategy Templates**: Pre-built strategy frameworks
- **Backtesting Integration**: Automated backtesting
- **Performance Dashboard**: Auto-track via journal tags
- **Strategy Sharing**: Share/import strategies with community
- **AI Strategy Generation**: Generate strategies from chat conversations
