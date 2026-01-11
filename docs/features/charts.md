# Market Charts
> This document is authoritative. Implementation must strictly conform to it.

Real-time market data with automated ICT pattern detection across Forex, Crypto, Stocks, and Metals.

## Overview

The Charts feature provides:
- **Real-Time Data**: Live OHLCV data via Polygon API
- **Multiple Markets**: Forex, Cryptocurrency, Stocks, Metals
- **ICT Pattern Detection**: Automated identification of Order Blocks, Fair Value Gaps, Market Structure
- **Multiple Timeframes**: 1m, 5m, 15m, 1h, 4h, 1d
- **Symbol Search**: Quick search across all markets
- **TradingView Charts**: Professional candlestick visualization
- **Pattern Toggles**: Show/hide specific ICT patterns

## Supported Markets

### Forex

**Major Pairs:**
- EUR/USD, GBP/USD, USD/JPY
- AUD/USD, NZD/USD, USD/CAD, USD/CHF

**Cross Pairs:**
- EUR/GBP, EUR/JPY, GBP/JPY
- AUD/JPY, EUR/AUD, GBP/AUD

**Symbol Format:** `C:EURUSD` (Polygon format with `C:` prefix)

### Cryptocurrency

**Major Coins:**
- BTC/USD, ETH/USD
- SOL/USD, ADA/USD
- MATIC/USD, AVAX/USD

**Symbol Format:** `X:BTCUSD` (Polygon format with `X:` prefix)

### Stocks

**Indices:**
- SPY, QQQ, DIA
- IWM, VTI

**Popular Stocks:**
- AAPL, MSFT, GOOGL, AMZN
- TSLA, NVDA, META

**Symbol Format:** `AAPL` (standard ticker)

### Metals

**Precious Metals:**
- Gold: `GC=F` or `XAUUSD`
- Silver: `SI=F` or `XAGUSD`

**Symbol Format:** Varies by data provider

## Getting Started

### Opening a Chart

1. Go to Charts page
2. Click symbol search box
3. Type symbol name or ticker
4. Select from results
5. Chart loads automatically

**Quick Search:**
- Type partial name: "eur" shows EUR/USD, EUR/GBP, etc.
- Use ticker: "AAPL" for Apple stock
- Market filter: Select specific market before searching

### Changing Timeframe

Click timeframe buttons:
- **1m**: 1-minute candles (scalping)
- **5m**: 5-minute candles (scalping/day trading)
- **15m**: 15-minute candles (day trading)
- **1h**: 1-hour candles (swing trading)
- **4h**: 4-hour candles (position trading)
- **1d**: Daily candles (long-term analysis)

**Default:** Set in Settings → Trading Preferences

### Date Range

Charts load data based on timeframe:

| Timeframe | Data Range |
|-----------|------------|
| 1m | Last 24 hours |
| 5m | Last 3 days |
| 15m | Last 7 days |
| 1h | Last 30 days |
| 4h | Last 90 days |
| 1d | Last 365 days |

**Custom Range:** Not currently supported (future feature)

## ICT Pattern Detection

Automated detection of key ICT concepts:

### Order Blocks

**What They Are:**
- Last bullish/bearish candle before impulse move
- Institutional footprint
- High-probability reversal zones

**Detection Logic:**
```
Bullish Order Block:
1. Down candle (close < open)
2. Followed by strong up move (>3 consecutive up candles)
3. Price doesn't return to block (yet)

Bearish Order Block:
1. Up candle (close > open)
2. Followed by strong down move (>3 consecutive down candles)
3. Price doesn't return to block (yet)
```

**Visual Representation:**
- **Bullish OB**: Green rectangle
- **Bearish OB**: Red rectangle
- Height: High to low of order block candle
- Width: Single candle duration

**Toggle:** Click "Order Blocks" button to show/hide

### Fair Value Gaps (FVG)

**What They Are:**
- 3-candle pattern with price gap
- Imbalance in price action
- Often filled before continuation

**Detection Logic:**
```
Bullish FVG:
- Candle 1: Any direction
- Candle 2: Strong up candle
- Candle 3: Continuation up
- Gap: Candle 1 high < Candle 3 low

Bearish FVG:
- Candle 1: Any direction
- Candle 2: Strong down candle
- Candle 3: Continuation down
- Gap: Candle 1 low > Candle 3 high
```

**Visual Representation:**
- **Bullish FVG**: Light green zone
- **Bearish FVG**: Light red zone
- Height: Size of imbalance/gap
- Transparency: 50% to see price through it

**Toggle:** Click "Fair Value Gaps" button to show/hide

### Market Structure

**What It Is:**
- Higher highs (HH) and higher lows (HL) = Uptrend
- Lower highs (LH) and lower lows (LL) = Downtrend
- Structure break = Potential reversal

**Detection Logic:**
```
Higher High:
- Current high > Previous swing high
- Marked with "HH" label

Higher Low:
- Current low > Previous swing low
- Marked with "HL" label

Lower High:
- Current high < Previous swing high
- Marked with "LH" label

Lower Low:
- Current low < Previous swing low
- Marked with "LL" label
```

**Visual Representation:**
- **Labels**: HH, HL, LH, LL on swing points
- **Trend Lines**: Connect swing points (future)
- **Colors**: Blue (bullish), Red (bearish)

**Toggle:** Click "Market Structure" button to show/hide

## Chart Features

### Candlestick Display

Using TradingView Lightweight Charts:

**Candle Colors:**
- **Green/Up**: Close > Open (bullish)
- **Red/Down**: Close < Open (bearish)

**Candle Parts:**
- **Body**: Open to Close
- **Wicks**: High/Low extensions
- **Thick body**: Large price movement
- **Thin body**: Small price movement (doji)

### Zoom & Pan

**Zoom:**
- Scroll wheel: Zoom in/out
- Pinch gesture: Mobile zoom
- +/- buttons (future)

**Pan:**
- Click and drag: Move left/right
- Touch and drag: Mobile pan
- Arrow keys (future)

### Price Scale

**Right Axis:**
- Current price levels
- Automatic scaling
- Grid lines for reference

**Price Line:**
- Horizontal line at latest close
- Updates in real-time

### Volume Display

**Bottom Panel:**
- Volume bars below price chart
- Green: Up volume
- Red: Down volume
- Height: Relative volume

**Toggle:** Show/hide volume panel (future)

### Crosshair

**Features:**
- Hover over chart to activate
- Shows OHLCV values for candle
- Displays exact timestamp
- Useful for pattern analysis

## Symbol Search

### Search Interface

**How to Search:**
1. Type in search box
2. Results appear as you type
3. Click result to load chart

**Search Capabilities:**
- Partial name matching
- Case-insensitive
- All markets searchable
- Instant results

**Examples:**
```
Search "eur" → EUR/USD, EUR/GBP, EUR/JPY
Search "btc" → BTC/USD, BTC/EUR
Search "apple" → AAPL
Search "gold" → GC=F, XAUUSD
```

### Market Filtering

**Filter Before Search:**
1. Select market tab (Forex/Crypto/Stocks/Metals)
2. Search within that market only
3. Faster, more relevant results

### Recently Viewed

**Quick Access:**
- Recent symbols appear in dropdown
- Click to reload chart
- Cleared on logout

## Configuration

### Default Market

Set in Settings → Trading Preferences:
- Default market when opening Charts page
- Auto-loads last viewed symbol

### Default Timeframe

Configure preferred timeframe:
- 1h recommended for swing trading
- 5m recommended for scalping

### Pattern Display

**Default Visibility:**
- Order Blocks: ON
- Fair Value Gaps: ON
- Market Structure: ON

**Persistence:**
- Toggle states saved in browser
- Maintained across sessions
- Per-user preference (future)

## API Integration

### Get Chart Data

```typescript
const response = await fetch(
  `/api/market/chart?symbol=C:EURUSD&timeframe=1h&from=${startMs}&to=${endMs}`
);

const { candles, symbol, timeframe } = await response.json();

// candles format:
[
  {
    time: 1705320000, // Unix timestamp (seconds)
    open: 1.0850,
    high: 1.0880,
    low: 1.0840,
    close: 1.0870,
    volume: 125000
  },
  ...
]
```

### Search Symbols

```typescript
const response = await fetch(
  `/api/market/symbols?q=EUR&market=forex`
);

const { symbols } = await response.json();

// symbols format:
[
  {
    symbol: 'C:EURUSD',
    name: 'Euro / US Dollar',
    market: 'forex',
    exchange: 'FX'
  },
  ...
]
```

See [API Reference](../api-reference.md) for complete documentation.

## Tips & Best Practices

### Multi-Timeframe Analysis

**Top-Down Approach:**
1. Start with daily (1d) for overall trend
2. Drop to 4h for structure
3. Drop to 1h for entry zones
4. Use 5m/15m for precise entries

**Example Workflow:**
```
1d: Uptrend, bullish structure
4h: Pullback to support zone
1h: Order block formation
5m: Entry on retest of order block
```

### Pattern Confluence

**Combine Patterns:**
- Order Block + FVG = High probability zone
- Market Structure break + Order Block = Reversal setup
- Multiple timeframe OBs aligned = Strong support/resistance

**Example:**
```
1h Order Block at 1.0850
+ 5m Fair Value Gap at 1.0855
+ Market Structure HL forming
= High-confidence long entry zone
```

### Using Patterns for Entries

**Order Block Entry:**
1. Identify order block on higher timeframe
2. Wait for price to return to block
3. Look for 5m confirmation (rejection wick)
4. Enter on retest

**Fair Value Gap Entry:**
1. FVG forms on impulse move
2. Price pulls back toward FVG
3. Enter on first touch of FVG
4. Stop below/above FVG

### Chart Analysis Workflow

**Pre-Trade Checklist:**
1. Identify trend (market structure)
2. Mark order blocks (support/resistance)
3. Identify unfilled FVGs
4. Combine with higher timeframe
5. Wait for entry confirmation

**Document in Journal:**
- Take mental note of patterns seen
- Save to journal after trade
- Reference in post-trade analysis

## Troubleshooting

### Chart Not Loading

**Check:**
1. Symbol format correct?
2. Polygon API key configured?
3. Internet connection active?
4. Browser console for errors?

**Solutions:**
- Verify symbol format (C:EURUSD for forex)
- Check .env for POLYGON_API_KEY
- Try different symbol
- Refresh page

### No Data Displayed

**Symptoms:**
- Chart area blank
- "No data available" message

**Causes:**
- Symbol not supported by Polygon
- Timeframe data not available
- Weekend/market closed
- API rate limit reached

**Solutions:**
- Try popular symbol (EUR/USD, BTC/USD)
- Check if market is open
- Wait a moment and retry
- Verify Polygon subscription level

### Patterns Not Showing

**Check:**
1. Pattern toggle button enabled?
2. Enough candles loaded?
3. Patterns actually exist in data?

**Solutions:**
- Click pattern toggle buttons to enable
- Load more data (wider date range)
- Try different symbol/timeframe
- Check pattern detection logic

### Slow Chart Performance

**Symptoms:**
- Laggy zooming/panning
- Delayed updates
- Browser freezing

**Solutions:**
- Close other tabs
- Use lighter timeframes (higher TF = fewer candles)
- Disable unused patterns
- Clear browser cache

## Related Features

- [Knowledge Base](./knowledge-base.md) - Learn about ICT patterns
- [Journal](./journal.md) - Document chart analysis
- [Chat](./chat.md) - Ask AI about chart patterns

## Advanced Usage

### Custom Indicators (Future)

Not currently supported. Future features:
- RSI, MACD, Moving Averages
- Custom indicator combinations
- Indicator alerts

### Pattern Alerts (Future)

Not currently supported. Future features:
- Alert when new order block forms
- Notify on FVG fill
- Structure break notifications

### Drawing Tools (Future)

Not currently supported. Future features:
- Trend lines
- Horizontal levels
- Fibonacci retracements
- Rectangle zones
- Save drawings

### Multi-Chart Layout (Future)

Not currently supported. Future features:
- 2x2 grid layout
- Different symbols simultaneously
- Same symbol, different timeframes
- Synchronized crosshairs
