# Playbooks
> This document is authoritative. Implementation must strictly conform to it.

Step-by-step execution guides for systematic trading workflows.

## Overview

Playbooks provide:
- **Step-by-Step Guides**: Sequential execution process
- **Checklist Format**: Ensure nothing is missed
- **Repeatable Workflows**: Consistent trade execution
- **Progress Tracking**: Mark steps as complete
- **Strategy Integration**: Link to trading strategies
- **Tags & Organization**: Easy categorization

## What are Playbooks?

**Playbooks vs Strategies:**

| Strategy | Playbook |
|----------|----------|
| WHAT to do | HOW to do it |
| Trading rules | Execution steps |
| Entry/exit conditions | Pre-trade checklist |
| Theory | Practice |

**Example:**
```
Strategy: ICT Order Block Trading
- Entry: When price reaches 1h order block with 5m confirmation
- Exit: 1:2 R:R or higher
- Risk: 1% per trade

Playbook: ICT Morning Session Execution
1. Review Asian session range (2:00 AM)
2. Mark London killzone (3:00-5:00 AM)
3. Identify order blocks within range
4. Set alerts for OB price levels
5. Wait for London open spike
6. Check for 5m confirmation on OB touch
7. Calculate position size (1% risk)
8. Execute trade
9. Set SL/TP levels
10. Monitor and manage
```

## Creating a Playbook

### Basic Information

**Required:**
- **Name**: Descriptive playbook title
- **Description**: What this playbook covers

**Optional:**
- Tags for organization
- Linked strategy reference

**Example:**
```
Name: Pre-Market Forex Analysis Routine
Description: Daily routine for analyzing forex
           markets before London/NY sessions
Tags: Routine, Forex, Analysis
```

### Adding Steps

**Step Structure:**
- **Title**: Short step name
- **Description**: Detailed instructions
- **Order**: Sequence number (auto-assigned)

**Step Best Practices:**
1. One action per step
2. Clear, specific instructions
3. Include tools/resources needed
4. Mention time estimates
5. Note optional vs required steps

**Example Steps:**
```json
[
  {
    "id": "step1",
    "title": "Check Economic Calendar",
    "description": "Review today's news events on Investing.com. Mark high-impact events (red flag). Avoid trading 30 min before/after.",
    "order": 1
  },
  {
    "id": "step2",
    "title": "Analyze HTF Structure",
    "description": "Open daily and 4H charts. Identify trend direction using market structure (HH/HL or LH/LL). Mark key levels.",
    "order": 2
  },
  {
    "id": "step3",
    "title": "Mark Order Blocks",
    "description": "Identify order blocks on 1H chart. Highlight blocks aligned with HTF trend. Set alerts at block levels.",
    "order": 3
  }
]
```

### Checkpoint System

**Track Progress:**
- Mark steps complete as you execute
- Visual progress indicator
- Resume where you left off

**Execution Modes:**
- **Practice Mode**: Step through without live trading
- **Live Mode**: Execute with real trades
- **Review Mode**: Post-trade analysis (future)

## Playbook Types

### Pre-Trade Routines

**Morning Analysis:**
1. Review economic calendar
2. Check overnight news
3. Analyze HTF charts
4. Identify key levels
5. Set alerts
6. Plan potential setups

**Session Preparation:**
1. Define trading session (London/NY/Asian)
2. Review relevant pairs
3. Mark killzones
4. Set entry criteria
5. Prepare risk management

### Trade Execution

**Setup Confirmation:**
1. Verify all entry criteria met
2. Check higher timeframe alignment
3. Confirm with multiple indicators
4. Calculate position size
5. Set SL/TP levels
6. Execute trade
7. Document in journal

**Position Management:**
1. Monitor price action
2. Move SL to breakeven at X:X
3. Check for partial profit taking
4. Trail stop if applicable
5. Exit at target or SL
6. Log final outcome

### Post-Trade Review

**Trade Analysis:**
1. Screenshot entry chart
2. Note what went right/wrong
3. Check if rules followed
4. Update journal entry
5. Calculate statistics
6. Identify lessons learned

**Session Review:**
1. Review all trades from session
2. Calculate P/L
3. Check emotional state
4. Note market conditions
5. Plan improvements

### Strategy Development

**Backtesting Process:**
1. Define strategy rules
2. Open historical charts
3. Identify setups (50+)
4. Document each setup
5. Calculate win rate and R:R
6. Refine rules if needed
7. Forward test on demo

## Using Playbooks

### Execution Workflow

**Before Trading:**
1. Select relevant playbook
2. Read through all steps
3. Gather required tools
4. Set aside dedicated time

**During Execution:**
1. Complete steps in order
2. Check off each step
3. Don't skip steps
4. Take notes if needed
5. Pause if uncertain

**After Completion:**
1. Review marked checkpoints
2. Note any deviations
3. Document results
4. Reset for next use

### Best Practices

**Consistency:**
- Use same playbook for same scenario
- Follow steps exactly
- Don't improvise
- Track compliance

**Refinement:**
- Update based on experience
- Add/remove steps as needed
- Include lessons learned
- Version your changes

**Documentation:**
- Note when playbooks used
- Link to journal entries
- Track which playbooks work best
- Retire ineffective playbooks

## Linking to Strategies

### Strategy-Playbook Connection

**One Strategy, Multiple Playbooks:**

```
Strategy: ICT Order Block Scalping

Playbooks:
1. London Session Execution
2. New York Session Execution
3. Pre-Market Setup Identification
4. Post-Trade Review Process
```

**Benefits:**
- Consistent execution of strategy
- Reduce decision fatigue
- Improve discipline
- Easier to teach/share

### Creating Linked Playbooks

1. Create strategy with rules
2. Break down into execution steps
3. Create playbook for each phase
4. Reference strategy in playbook
5. Use together during trading

## Tags & Organization

### Common Tags

**Session:**
- London, New York, Asian
- Pre-Market, During-Market, Post-Market

**Activity:**
- Analysis, Execution, Review
- Setup, Entry, Exit, Management

**Skill Level:**
- Beginner, Intermediate, Advanced

**Frequency:**
- Daily, Weekly, Monthly
- As-Needed, Situational

### Finding Playbooks

**Filter by Tag:**
- Quick access to relevant playbooks
- Combine tags for specificity
- Example: "London" + "Execution"

**Search:**
- Find by keywords
- Search in step descriptions
- Locate specific procedures

## API Integration

### Create Playbook

```typescript
const response = await fetch('/api/playbooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'ICT Morning Session Execution',
    description: 'Step-by-step for London killzone trading',
    steps: [
      {
        id: 'step1',
        title: 'Check Asian Range',
        description: 'Identify high and low from Asian session',
        order: 1
      },
      {
        id: 'step2',
        title: 'Mark London Killzone',
        description: 'Highlight 3:00-5:00 AM EST on chart',
        order: 2
      }
    ],
    tags: ['ICT', 'London', 'Execution']
  }),
});

const playbook = await response.json();
```

### Get Playbooks

```typescript
const response = await fetch('/api/playbooks?tags=Execution');
const { playbooks } = await response.json();
```

See [API Reference](../api-reference.md) for complete documentation.

## Example Playbooks

### Morning Forex Routine

```
Name: Daily Forex Morning Routine
Description: Pre-market analysis for London/NY sessions

Steps:
1. Economic Calendar Check (5 min)
   - Review Investing.com calendar
   - Mark high-impact events
   - Note times in your timezone

2. Overnight News Review (5 min)
   - Check ForexFactory headlines
   - Review major geopolitical news
   - Note sentiment shifts

3. Daily Chart Analysis (10 min)
   - Review 5 major pairs
   - Identify daily trend direction
   - Mark key S/R levels

4. 4H Chart Analysis (10 min)
   - Check for structure breaks
   - Identify order blocks
   - Mark FVGs

5. Setup Identification (10 min)
   - Find 1H OB setups
   - Set price alerts
   - Document in trading plan

6. Risk Management (5 min)
   - Calculate position sizes
   - Verify max daily risk not exceeded
   - Review correlation between pairs
```

### Trade Entry Checklist

```
Name: ICT Order Block Entry Checklist
Description: Confirm all criteria before executing trade

Steps:
1. HTF Trend Aligned
   □ Daily trend identified
   □ 4H structure supports direction
   □ Not counter-trend

2. Order Block Identified
   □ Clear OB candle on 1H
   □ Price returned to OB
   □ OB not previously violated

3. Confirmation Present
   □ 5M rejection wick at OB
   □ Volume spike on confirmation
   □ Candle close in direction

4. Risk Management
   □ Position size calculated
   □ SL distance acceptable (<50 pips)
   □ Target at minimum 1:2 R:R

5. No Conflicts
   □ No major news in next 30 min
   □ Not at major S/R from HTF
   □ Other positions not correlated

6. Execution
   □ Market order entered
   □ SL set correctly
   □ TP set correctly
   □ Trade logged in journal
```

### Weekly Review Process

```
Name: Weekly Trading Review
Description: End-of-week performance analysis

Steps:
1. Compile Trade Data (15 min)
   - Export all trades from broker
   - Review journal entries
   - Gather statistics

2. Calculate Metrics (10 min)
   - Total trades
   - Win rate
   - Average R:R
   - Largest win/loss
   - P/L

3. Strategy Performance (15 min)
   - Group trades by strategy
   - Calculate per-strategy win rate
   - Identify best/worst performers

4. Rule Compliance (15 min)
   - Review each trade
   - Mark rule violations
   - Calculate compliance percentage

5. Emotional Analysis (10 min)
   - Review emotional tags
   - Identify patterns
   - Note psychological challenges

6. Lessons Learned (10 min)
   - Document key insights
   - Note mistakes to avoid
   - Identify improvements

7. Next Week Plan (10 min)
   - Set goals
   - Choose focus strategies
   - Identify market conditions to watch
```

## Troubleshooting

### Steps Not Saving

**Check:**
- All required fields filled?
- Valid JSON structure?
- Unique step IDs?

**Solution:**
- Verify step structure
- Check browser console
- Refresh page and retry

### Playbook Execution Issues

**Can't Track Progress:**
- Checkbox state not persisting
- Browser refresh loses progress

**Workaround:**
- Use external checklist temporarily
- Complete playbook in one session
- Print and use paper checklist

## Related Features

- [Strategies](./strategies.md) - Define WHAT to trade
- [Journal](./journal.md) - Document execution
- [Tools](./tools.md) - Reference tools in steps

## Future Enhancements

- **Progress Persistence**: Save checkpoint state across sessions
- **Time Tracking**: How long each step takes
- **Templates**: Pre-built playbook templates
- **Sharing**: Export/import playbooks
- **Playbook Analytics**: Track completion rates and outcomes
- **Mobile App**: Execute playbooks on mobile
- **Voice Commands**: Hands-free step execution
