# Market Data Integration
> This document is authoritative. Implementation must strictly conform to it.

Real-time market data via Polygon API with caching and multi-market support.

## Overview

Market data integration provides:
- **Polygon API**: Professional-grade market data
- **Multiple Markets**: Forex, Crypto, Stocks, Metals
- **OHLCV Data**: Open, High, Low, Close, Volume candles
- **Multiple Timeframes**: 1m to 1d
- **Symbol Search**: Find instruments across markets
- **Data Caching**: In-memory cache for performance
- **Rate Limit Handling**: Respect API limits

## Supported Markets

### Forex (FX)

**Data Source:** Polygon Forex API

**Symbol Format:** `C:EURUSD` (prefix with `C:`)

**Available Pairs:**
- Majors: EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, NZD/USD, USD/CAD
- Crosses: EUR/GBP, EUR/JPY, GBP/JPY, EUR/AUD, GBP/AUD, AUD/JPY
- Exotics: USD/TRY, USD/ZAR, USD/MXN, etc.

**Data Quality:**
- Tick-level data
- Spreads included
- 24/5 coverage
- Major pairs most reliable

### Cryptocurrency

**Data Source:** Polygon Crypto API

**Symbol Format:** `X:BTCUSD` (prefix with `X:`)

**Available Pairs:**
- Majors: BTC/USD, ETH/USD
- Altcoins: SOL/USD, ADA/USD, MATIC/USD, AVAX/USD
- Stable pairs: USDT/USD, USDC/USD

**Data Quality:**
- Exchange aggregated
- 24/7 coverage
- High volume pairs most reliable

### Stocks

**Data Source:** Polygon Stocks API

**Symbol Format:** `AAPL` (standard ticker)

**Available:**
- All US stocks
- ETFs
- Indices (SPY, QQQ, DIA)

**Data Quality:**
- Real-time (paid) or delayed (free)
- Regular trading hours (9:30 AM - 4:00 PM ET)
- Pre/post market (limited)

### Metals (Future Support)

**Planned:**
- Gold (XAUUSD)
- Silver (XAGUSD)
- Copper, Platinum, Palladium

**Current Status:**
- Limited support
- May require specific symbols
- Test before relying on

## Polygon API Setup

### Getting API Key

1. Sign up at [polygon.io](https://polygon.io/)
2. Choose plan:
   - **Starter (Free)**: 5 requests/min, delayed data
   - **Developer ($99/mo)**: 100 requests/min, real-time
   - **Advanced ($249/mo)**: 300 requests/min, websockets
3. Copy API key from dashboard
4. Add to `.env`:
   ```env
   POLYGON_API_KEY=your-polygon-api-key
   ```

### Plan Comparison

| Feature | Starter (Free) | Developer | Advanced |
|---------|----------------|-----------|----------|
| Requests/min | 5 | 100 | 300 |
| Data delay | 15 min | Real-time | Real-time |
| Markets | All | All | All |
| Websockets | No | No | Yes |
| Historical | 2 years | 5 years | Unlimited |

**Recommendation:**
- Testing/Development: Starter (free)
- Active Trading: Developer
- High-Frequency: Advanced

## Timeframes

### Supported Intervals

**Intraday:**
- `1m`: 1-minute candles (last 24 hours)
- `5m`: 5-minute candles (last 3 days)
- `15m`: 15-minute candles (last 7 days)

**Higher Timeframes:**
- `1h`: 1-hour candles (last 30 days)
- `4h`: 4-hour candles (last 90 days)
- `1d`: Daily candles (last 365 days)

### Timeframe to Polygon Multiplier

```typescript
const timeframeMap = {
  '1m': { multiplier: 1, timespan: 'minute' },
  '5m': { multiplier: 5, timespan: 'minute' },
  '15m': { multiplier: 15, timespan: 'minute' },
  '1h': { multiplier: 1, timespan: 'hour' },
  '4h': { multiplier: 4, timespan: 'hour' },
  '1d': { multiplier: 1, timespan: 'day' },
};
```

## Data Caching

### Cache Strategy

**In-Memory Cache:**
- Stores recent candle data
- 5-minute TTL (time-to-live)
- Per-symbol, per-timeframe
- Reduces API calls

**Cache Key Format:**
```
market:chart:{symbol}:{timeframe}:{from}:{to}
```

**Example:**
```
market:chart:C:EURUSD:1h:1705320000:1705406400
```

### Cache Behavior

**Cache Hit:**
1. Request for EUR/USD 1h chart
2. Check cache
3. Found (less than 5 min old)
4. Return cached data
5. No API call

**Cache Miss:**
1. Request for EUR/USD 1h chart
2. Check cache
3. Not found or expired
4. Fetch from Polygon API
5. Store in cache (5 min TTL)
6. Return data

**Benefits:**
- Faster response times
- Reduced API usage
- Stay under rate limits
- Lower costs

### Cache Invalidation

**Automatic:**
- Expires after 5 minutes
- Cleared on server restart

**Manual (Future):**
- Clear cache button
- Force refresh
- Per-symbol clearing

## API Endpoints

### Get Chart Data

**Endpoint:** `GET /api/market/chart`

**Parameters:**
- `symbol` (required): Trading symbol
- `timeframe` (required): 1m, 5m, 15m, 1h, 4h, 1d
- `from` (optional): Start timestamp (Unix ms)
- `to` (optional): End timestamp (Unix ms)

**Example:**
```bash
curl "http://localhost:3006/api/market/chart?symbol=C:EURUSD&timeframe=1h&from=1705320000000&to=1705406400000"
```

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
    },
    ...
  ],
  "symbol": "C:EURUSD",
  "timeframe": "1h"
}
```

### Search Symbols

**Endpoint:** `GET /api/market/symbols`

**Parameters:**
- `q` (required): Search query
- `market` (optional): forex, crypto, stocks, metals

**Example:**
```bash
curl "http://localhost:3006/api/market/symbols?q=EUR&market=forex"
```

**Response:**
```json
{
  "symbols": [
    {
      "symbol": "C:EURUSD",
      "name": "Euro / US Dollar",
      "market": "forex",
      "exchange": "FX"
    },
    {
      "symbol": "C:EURGBP",
      "name": "Euro / British Pound",
      "market": "forex",
      "exchange": "FX"
    }
  ]
}
```

## Polygon API Structure

### Aggregates (Candles) Endpoint

**URL Pattern:**
```
https://api.polygon.io/v2/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{from}/{to}
```

**Example:**
```
https://api.polygon.io/v2/aggs/ticker/C:EURUSD/range/1/hour/2024-01-01/2024-01-15?apiKey=YOUR_KEY
```

**Response:**
```json
{
  "ticker": "C:EURUSD",
  "results": [
    {
      "v": 125000,        // volume
      "vw": 1.0865,       // volume weighted price
      "o": 1.0850,        // open
      "c": 1.0870,        // close
      "h": 1.0880,        // high
      "l": 1.0840,        // low
      "t": 1705320000000, // timestamp (ms)
      "n": 1500           // number of transactions
    }
  ]
}
```

### Symbol Search Endpoint

**URL Pattern:**
```
https://api.polygon.io/v3/reference/tickers?search={query}&market={market}&active=true&limit=10
```

**Example:**
```
https://api.polygon.io/v3/reference/tickers?search=EUR&market=fx&active=true&limit=10&apiKey=YOUR_KEY
```

## Rate Limiting

### Current Implementation

**Client-Side:**
- 5-minute data cache
- Reduces requests naturally
- No explicit throttling

**Server-Side:**
- No rate limiting implemented
- Relies on cache to stay under limits
- Future: Implement request queue

### Handling Rate Limits

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded. Retry in 60 seconds."
}
```

**Response:**
1. Wait specified time
2. Retry request
3. Or use cached data
4. Inform user

**Prevention:**
- Use cache effectively
- Batch requests when possible
- Upgrade Polygon plan if needed
- Implement request queue (future)

## Data Quality

### Real-Time vs Delayed

**Starter Plan (Free):**
- 15-minute delayed data
- Suitable for learning/backtesting
- Not for live trading

**Paid Plans:**
- Real-time data
- < 1 second latency
- Required for live trading

### Data Accuracy

**Forex:**
- High accuracy on majors
- Some spreads on exotics
- 24/5 coverage
- Gaps over weekends

**Crypto:**
- Exchange aggregated
- Slight variations vs specific exchange
- 24/7 coverage
- Usually accurate

**Stocks:**
- Official exchange data
- Highly accurate
- Regular hours only
- Corporate actions included

## Error Handling

### Common Errors

**Invalid Symbol:**
```json
{
  "error": "Symbol not found"
}
```
**Solution:** Verify symbol format, try search endpoint

**No Data Available:**
```json
{
  "error": "No data for this time range"
}
```
**Solution:** Adjust date range, check market hours

**API Key Invalid:**
```json
{
  "error": "Unauthorized"
}
```
**Solution:** Verify API key in .env, restart server

**Rate Limit:**
```json
{
  "error": "Rate limit exceeded"
}
```
**Solution:** Wait and retry, check cache, upgrade plan

### Fallback Strategies

**If Polygon Unavailable:**
- Show cached data with warning
- Disable chart features temporarily
- Suggest checking back later
- Other features unaffected

**If Symbol Not Found:**
- Suggest alternative symbols
- Show similar tickers
- Link to symbol search

## Configuration

### Environment Variables

```env
# Required for chart functionality
POLYGON_API_KEY=your-polygon-api-key

# Optional overrides
POLYGON_API_URL=https://api.polygon.io
```

### Cache Configuration

**File:** [src/lib/market-data/cache.ts](../src/lib/market-data/cache.ts)

**Settings:**
```typescript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Max cached entries
```

**Customization:**
- Increase TTL for less frequent updates
- Decrease TTL for fresher data
- Adjust size based on memory constraints

## Best Practices

### Efficient Data Fetching

**Load Once:**
- Fetch when chart opens
- Cache for 5 minutes
- Don't refetch on zoom/pan

**Appropriate Ranges:**
- 1m/5m: Last 1-3 days
- 1h/4h: Last 7-30 days
- 1d: Last 90-365 days

**Batch Operations:**
- Load multiple timeframes together (future)
- Prefetch next likely requests
- Smart caching based on usage

### Symbol Management

**Favorites:**
- Save frequently-used symbols
- Quick access to preferred pairs
- Reduce search needs

**Recent Symbols:**
- Track recently viewed
- Quick reload
- Browser localStorage (future)

## Troubleshooting

### Charts Not Loading

**Check:**
1. Polygon API key configured?
2. Symbol format correct?
3. Internet connection?
4. Rate limit reached?

**Solutions:**
- Add POLYGON_API_KEY to .env
- Verify symbol format (C:EURUSD, X:BTCUSD)
- Test API key directly
- Wait if rate limited

### Data Seems Outdated

**Check:**
- Plan type (delayed vs real-time)?
- Cache age?
- Market closed?

**Solutions:**
- Upgrade to paid plan for real-time
- Wait for cache to expire (5 min)
- Check market hours

### Missing Candles

**Causes:**
- Market closed (weekends, holidays)
- Low volume period
- Data gap from Polygon

**Solutions:**
- Verify market hours
- Try different timeframe
- Check Polygon status page

## Related Features

- [Charts Feature](../features/charts.md) - Primary consumer of market data
- [Journal](../features/journal.md) - Logs symbol and price data

## Future Enhancements

- **Websocket Streaming**: Real-time updates
- **More Markets**: Commodities, bonds, options
- **Advanced Caching**: Redis for multi-instance
- **Data Export**: Download historical data
- **Custom Timeframes**: User-defined intervals
- **Multiple Data Providers**: Fallback to other APIs
- **News Integration**: Related news for symbols

## Further Reading

- [Polygon Documentation](https://polygon.io/docs/)
- [Polygon API Reference](https://polygon.io/docs/stocks/getting-started)
- [Forex Data Guide](https://polygon.io/docs/forex/getting-started)
- [Crypto Data Guide](https://polygon.io/docs/crypto/getting-started)
