import { decrypt } from './encryption.js';

const CACHE_TTL = 5 * 60 * 1000;
const marketDataCache = new Map();

function getCached(key) {
  const cached = marketDataCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  marketDataCache.set(key, { data, timestamp: Date.now() });
}

const timeframeMap = {
  '1m': { multiplier: 1, timespan: 'minute', alphaInterval: '1min', twelveInterval: '1min' },
  '5m': { multiplier: 5, timespan: 'minute', alphaInterval: '5min', twelveInterval: '5min' },
  '15m': { multiplier: 15, timespan: 'minute', alphaInterval: '15min', twelveInterval: '15min' },
  '30m': { multiplier: 30, timespan: 'minute', alphaInterval: '30min', twelveInterval: '30min' },
  '1h': { multiplier: 1, timespan: 'hour', alphaInterval: '60min', twelveInterval: '1h' },
  '4h': { multiplier: 4, timespan: 'hour', alphaInterval: '60min', twelveInterval: '4h' },
  '1d': { multiplier: 1, timespan: 'day', alphaInterval: 'daily', twelveInterval: '1day' },
};

function formatDateForPolygon(date) {
  if (!date) return null;
  if (typeof date === 'string') {
    // If already a string, check if it's YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // Otherwise parse and format
    return new Date(date).toISOString().split('T')[0];
  }
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return new Date(date).toISOString().split('T')[0];
}

async function fetchPolygonCandles(symbol, timeframe, from, to, apiKey) {
  const tf = timeframeMap[timeframe] || timeframeMap['1h'];
  const toDate = formatDateForPolygon(to) || new Date().toISOString().split('T')[0];
  const fromDate = formatDateForPolygon(from) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${tf.multiplier}/${tf.timespan}/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=5000&apiKey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === 'ERROR' || !data.results) {
    throw new Error(data.error || 'Polygon API error');
  }
  
  return (data.results || []).map(bar => ({
    time: bar.t / 1000,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));
}

async function fetchPolygonSymbols(search, market, apiKey) {
  let url = `https://api.polygon.io/v3/reference/tickers?active=true&limit=20&apiKey=${apiKey}`;
  
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  if (market === 'crypto') {
    url += '&market=crypto';
  } else if (market === 'forex') {
    url += '&market=fx';
  } else if (market === 'stocks') {
    url += '&market=stocks';
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  return (data.results || []).map(t => ({
    symbol: t.ticker,
    name: t.name,
    market: t.market,
    type: t.type,
  }));
}

async function fetchAlphaVantageCandles(symbol, timeframe, apiKey) {
  const tf = timeframeMap[timeframe] || timeframeMap['1h'];
  
  let func = 'TIME_SERIES_INTRADAY';
  let params = `&interval=${tf.alphaInterval}&outputsize=full`;
  
  if (tf.alphaInterval === 'daily') {
    func = 'TIME_SERIES_DAILY';
    params = '&outputsize=full';
  }
  
  const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}${params}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message'] || data['Note']) {
    throw new Error(data['Error Message'] || 'Alpha Vantage API rate limit');
  }
  
  const seriesKey = Object.keys(data).find(k => k.includes('Time Series'));
  if (!seriesKey) {
    throw new Error('No data returned from Alpha Vantage');
  }
  
  const series = data[seriesKey];
  const candles = Object.entries(series).map(([dateStr, values]) => ({
    time: Math.floor(new Date(dateStr).getTime() / 1000),
    open: parseFloat(values['1. open']),
    high: parseFloat(values['2. high']),
    low: parseFloat(values['3. low']),
    close: parseFloat(values['4. close']),
    volume: parseFloat(values['5. volume'] || 0),
  }));
  
  return candles.sort((a, b) => a.time - b.time);
}

async function fetchAlphaVantageSymbols(search, apiKey) {
  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(search)}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  
  return (data.bestMatches || []).map(match => ({
    symbol: match['1. symbol'],
    name: match['2. name'],
    type: match['3. type'],
    region: match['4. region'],
    market: 'stocks',
  }));
}

async function fetchTwelveDataCandles(symbol, timeframe, apiKey) {
  if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
    throw new Error('Invalid symbol provided');
  }
  
  // Clean and format the symbol - Twelve Data uses forward slashes for forex pairs
  let cleanSymbol = symbol.trim().toUpperCase();
  
  // Convert common crypto formats (e.g., BTCUSDT -> BTC/USD)
  if (cleanSymbol.endsWith('USDT') || cleanSymbol.endsWith('USD')) {
    const base = cleanSymbol.replace(/USD[T]?$/, '');
    cleanSymbol = `${base}/USD`;
  }
  
  const tf = timeframeMap[timeframe] || timeframeMap['1h'];
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(cleanSymbol)}&interval=${tf.twelveInterval}&outputsize=500&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.message || 'Twelve Data API error');
  }
  
  const values = data.values || [];
  const candles = values.map(bar => ({
    time: Math.floor(new Date(bar.datetime).getTime() / 1000),
    open: parseFloat(bar.open),
    high: parseFloat(bar.high),
    low: parseFloat(bar.low),
    close: parseFloat(bar.close),
    volume: parseFloat(bar.volume || 0),
  }));
  
  return candles.sort((a, b) => a.time - b.time);
}

async function fetchTwelveDataSymbols(search, market, apiKey) {
  let url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(search)}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.message || 'Twelve Data API error');
  }
  
  return (data.data || []).slice(0, 20).map(s => ({
    symbol: s.symbol,
    name: s.instrument_name,
    market: s.instrument_type?.toLowerCase() || 'unknown',
    exchange: s.exchange,
  }));
}

const coinIdMap = {
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'usdt': 'tether',
  'usdc': 'usd-coin',
  'bnb': 'binancecoin',
  'xrp': 'ripple',
  'ada': 'cardano',
  'doge': 'dogecoin',
  'sol': 'solana',
  'dot': 'polkadot',
  'matic': 'matic-network',
  'ltc': 'litecoin',
  'shib': 'shiba-inu',
  'trx': 'tron',
  'avax': 'avalanche-2',
  'link': 'chainlink',
  'atom': 'cosmos',
  'xlm': 'stellar',
  'etc': 'ethereum-classic',
  'xmr': 'monero',
};

function symbolToCoinGeckoId(symbol) {
  const cleaned = symbol.toLowerCase()
    .replace(/usdt$/i, '')
    .replace(/usd$/i, '')
    .replace(/busd$/i, '')
    .replace(/\/.*$/, '')
    .trim();
  
  return coinIdMap[cleaned] || cleaned;
}

function symbolToBinancePair(symbol) {
  const upper = symbol.toUpperCase();
  if (upper.includes('/')) {
    return upper.replace('/', '');
  }
  if (upper.endsWith('USDT') || upper.endsWith('BUSD') || upper.endsWith('BTC')) {
    return upper;
  }
  return upper + 'USDT';
}

async function fetchCoinGeckoCandles(symbol, timeframe) {
  const coinId = symbolToCoinGeckoId(symbol);
  
  let days = 30;
  if (timeframe === '1d' || timeframe === '4h') {
    days = 90;
  } else if (timeframe === '1h') {
    days = 30;
  } else {
    days = 7;
  }
  
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`CoinGecko: coin '${coinId}' not found or rate limited`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    throw new Error('Invalid response from CoinGecko');
  }
  
  return data.map(candle => ({
    time: candle[0] / 1000,
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: 0,
  }));
}

async function fetchCoinGeckoSymbols(search) {
  const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(search)}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return (data.coins || []).slice(0, 20).map(coin => ({
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    market: 'crypto',
    coingeckoId: coin.id,
    binanceSymbol: coin.symbol.toUpperCase() + 'USDT',
  }));
}

async function fetchBinanceCandles(binanceSymbol, timeframe) {
  const intervalMap = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
  };
  
  const interval = intervalMap[timeframe] || '1h';
  
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Binance: ${errorData.msg || 'symbol not found'}`);
  }
  
  const data = await response.json();
  
  return data.map(candle => ({
    time: candle[0] / 1000,
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
}

export async function getCandles(settings, symbol, timeframe, from, to, options = {}) {
  const { coingeckoId, binanceSymbol, market: providedMarket, polygonSymbol, alphaVantageSymbol, twelveDataSymbol } = options;
  const cacheKey = `candles-${symbol}-${timeframe}-${from}-${to}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const provider = settings?.preferredMarketDataProvider || 'polygon';
  const market = providedMarket || detectMarket(symbol);
  
  let candles = null;
  let usedProvider = provider;
  let lastError = null;
  
  try {
    if (market === 'crypto') {
      const binancePair = binanceSymbol || symbolToBinancePair(symbol);
      
      // Respect provider preference for crypto
      if (provider === 'coinbase') {
        try {
          candles = await fetchCoinbaseCandles(symbol, timeframe);
          usedProvider = 'coinbase';
        } catch (coinbaseError) {
          // Fall back to Binance
          try {
            candles = await fetchBinanceCandles(binancePair, timeframe);
            usedProvider = 'binance';
          } catch (binanceError) {
            throw new Error(`Coinbase: ${coinbaseError.message}; Binance: ${binanceError.message}`);
          }
        }
      } else if (provider === 'coingecko' && coingeckoId) {
        try {
          candles = await fetchCoinGeckoCandlesById(coingeckoId, timeframe);
          usedProvider = 'coingecko';
        } catch (cgError) {
          // Fall back to Binance
          try {
            candles = await fetchBinanceCandles(binancePair, timeframe);
            usedProvider = 'binance';
          } catch (binanceError) {
            throw new Error(`CoinGecko: ${cgError.message}; Binance: ${binanceError.message}`);
          }
        }
      } else {
        // Default: try Binance first, then Coinbase, then CoinGecko
        try {
          candles = await fetchBinanceCandles(binancePair, timeframe);
          usedProvider = 'binance';
        } catch (binanceError) {
          lastError = binanceError;
          try {
            candles = await fetchCoinbaseCandles(symbol, timeframe);
            usedProvider = 'coinbase';
          } catch (coinbaseError) {
            if (coingeckoId) {
              try {
                candles = await fetchCoinGeckoCandlesById(coingeckoId, timeframe);
                usedProvider = 'coingecko';
              } catch (cgError) {
                throw new Error(`Binance: ${binanceError.message}; Coinbase: ${coinbaseError.message}; CoinGecko: ${cgError.message}`);
              }
            } else {
              throw new Error(`Binance: ${binanceError.message}; Coinbase: ${coinbaseError.message}`);
            }
          }
        }
      }
    } else if (market === 'metals' || polygonSymbol?.startsWith('C:X')) {
      if (!settings?.polygonApiKey) {
        throw new Error('Metals charts require a Polygon API key. Please configure it in Settings.');
      }
      const apiKey = decrypt(settings.polygonApiKey);
      const effectiveSymbol = polygonSymbol || symbol;
      candles = await fetchPolygonCandles(effectiveSymbol, timeframe, from, to, apiKey);
      usedProvider = 'polygon';
    } else {
      const effectivePolygonSymbol = polygonSymbol || symbol;
      const effectiveAlphaVantageSymbol = alphaVantageSymbol || symbol;
      const effectiveTwelveDataSymbol = twelveDataSymbol || symbol;
      
      if (provider === 'polygon' && settings?.polygonApiKey) {
        const apiKey = decrypt(settings.polygonApiKey);
        candles = await fetchPolygonCandles(effectivePolygonSymbol, timeframe, from, to, apiKey);
      } else if (provider === 'alphaVantage' && settings?.alphaVantageApiKey) {
        const apiKey = decrypt(settings.alphaVantageApiKey);
        candles = await fetchAlphaVantageCandles(effectiveAlphaVantageSymbol, timeframe, apiKey);
      } else if (provider === 'twelveData' && settings?.twelveDataApiKey) {
        const apiKey = decrypt(settings.twelveDataApiKey);
        candles = await fetchTwelveDataCandles(effectiveTwelveDataSymbol, timeframe, apiKey);
      } else {
        const providers = ['polygon', 'alphaVantage', 'twelveData'];
        for (const p of providers) {
          const keyField = `${p === 'alphaVantage' ? 'alphaVantage' : p}ApiKey`;
          if (settings?.[keyField]) {
            const apiKey = decrypt(settings[keyField]);
            if (p === 'polygon') {
              candles = await fetchPolygonCandles(effectivePolygonSymbol, timeframe, from, to, apiKey);
            } else if (p === 'alphaVantage') {
              candles = await fetchAlphaVantageCandles(effectiveAlphaVantageSymbol, timeframe, apiKey);
            } else if (p === 'twelveData') {
              candles = await fetchTwelveDataCandles(effectiveTwelveDataSymbol, timeframe, apiKey);
            }
            usedProvider = p;
            break;
          }
        }
      }
    }
  } catch (error) {
    throw new Error(`${usedProvider}: ${error.message}`);
  }
  
  if (!candles) {
    if (market === 'crypto') {
      throw new Error('Failed to fetch crypto data. Please try a different symbol.');
    }
    throw new Error('No market data provider configured. Please add an API key in Settings.');
  }
  
  setCache(cacheKey, candles);
  return candles;
}

async function fetchCoinGeckoCandlesById(coinId, timeframe) {
  let days = 30;
  if (timeframe === '1d' || timeframe === '4h') {
    days = 90;
  } else if (timeframe === '1h') {
    days = 30;
  } else {
    days = 7;
  }
  
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`coin '${coinId}' not found or rate limited`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    throw new Error('Invalid response from CoinGecko');
  }
  
  return data.map(candle => ({
    time: candle[0] / 1000,
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: 0,
  }));
}

export async function searchSymbols(settings, search, market) {
  const provider = settings?.preferredMarketDataProvider || 'polygon';
  
  if (market === 'crypto') {
    // Use preferred provider for crypto symbol search
    if (provider === 'coinbase') {
      try {
        return await fetchCoinbaseSymbols(search);
      } catch (e) {
        // Fall back to CoinGecko
        return await fetchCoinGeckoSymbols(search);
      }
    }
    return await fetchCoinGeckoSymbols(search);
  }
  
  if (provider === 'polygon' && settings?.polygonApiKey) {
    const apiKey = decrypt(settings.polygonApiKey);
    return await fetchPolygonSymbols(search, market, apiKey);
  } else if (provider === 'alphaVantage' && settings?.alphaVantageApiKey) {
    const apiKey = decrypt(settings.alphaVantageApiKey);
    return await fetchAlphaVantageSymbols(search, apiKey);
  } else if (provider === 'twelveData' && settings?.twelveDataApiKey) {
    const apiKey = decrypt(settings.twelveDataApiKey);
    return await fetchTwelveDataSymbols(search, market, apiKey);
  }
  
  const providers = ['polygon', 'alphaVantage', 'twelveData'];
  for (const p of providers) {
    const keyField = `${p === 'alphaVantage' ? 'alphaVantage' : p}ApiKey`;
    if (settings?.[keyField]) {
      const apiKey = decrypt(settings[keyField]);
      if (p === 'polygon') {
        return await fetchPolygonSymbols(search, market, apiKey);
      } else if (p === 'alphaVantage') {
        return await fetchAlphaVantageSymbols(search, apiKey);
      } else if (p === 'twelveData') {
        return await fetchTwelveDataSymbols(search, market, apiKey);
      }
    }
  }
  
  throw new Error('No market data provider configured. Please add an API key in Settings.');
}

function detectMarket(symbol) {
  const cryptoPatterns = [
    /BTC/i, /ETH/i, /USDT$/i, /USDC$/i, /^X:/i,
    /bitcoin/i, /ethereum/i, /dogecoin/i, /solana/i
  ];
  
  for (const pattern of cryptoPatterns) {
    if (pattern.test(symbol)) {
      return 'crypto';
    }
  }
  
  const forexPatterns = [
    /^EUR/i, /^USD/i, /^GBP/i, /^JPY/i, /^AUD/i, /^CAD/i,
    /^CHF/i, /^NZD/i, /^C:/i
  ];
  
  for (const pattern of forexPatterns) {
    if (pattern.test(symbol)) {
      return 'forex';
    }
  }
  
  return 'stocks';
}

// Coinbase Exchange API (free public data for crypto)
async function fetchCoinbaseCandles(symbol, timeframe) {
  // Convert symbol format (e.g., BTCUSDT -> BTC-USD, ETHUSDT -> ETH-USD)
  let productId = symbol.toUpperCase();
  if (productId.endsWith('USDT')) {
    productId = productId.replace('USDT', '-USD');
  } else if (!productId.includes('-')) {
    // Try to add -USD if no currency pair separator
    const base = productId.replace(/USD$/, '');
    productId = `${base}-USD`;
  }
  
  // Coinbase granularity in seconds
  const granularityMap = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };
  
  const granularity = granularityMap[timeframe] || 3600;
  
  // Coinbase returns max 300 candles per request
  const now = new Date();
  const end = now.toISOString();
  const start = new Date(now.getTime() - (300 * granularity * 1000)).toISOString();
  
  const url = `https://api.exchange.coinbase.com/products/${productId}/candles?granularity=${granularity}&start=${start}&end=${end}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TradingAI/1.0',
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Coinbase: ${errorText || response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Coinbase: No data found for ${productId}`);
  }
  
  // Coinbase returns [time, low, high, open, close, volume] in descending order
  const candles = data.map(candle => ({
    time: candle[0],
    open: parseFloat(candle[3]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[1]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
  
  return candles.sort((a, b) => a.time - b.time);
}

async function fetchCoinbaseSymbols(search) {
  const url = 'https://api.exchange.coinbase.com/products';
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TradingAI/1.0',
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch Coinbase products');
  }
  
  const products = await response.json();
  
  // Filter by search term and only include USD pairs
  const searchLower = search.toLowerCase();
  const filtered = products
    .filter(p => 
      p.quote_currency === 'USD' &&
      (p.id.toLowerCase().includes(searchLower) || 
       p.base_currency.toLowerCase().includes(searchLower))
    )
    .slice(0, 20);
  
  return filtered.map(p => ({
    symbol: p.id,
    name: `${p.base_currency}/${p.quote_currency}`,
    market: 'crypto',
    coinbaseProductId: p.id,
    exchange: 'Coinbase',
  }));
}

export function getAvailableProviders(settings) {
  const providers = [];
  
  if (settings?.polygonApiKey) {
    providers.push({ id: 'polygon', name: 'Polygon', markets: ['stocks', 'forex', 'crypto'] });
  }
  if (settings?.alphaVantageApiKey) {
    providers.push({ id: 'alphaVantage', name: 'Alpha Vantage', markets: ['stocks', 'forex'] });
  }
  if (settings?.twelveDataApiKey) {
    providers.push({ id: 'twelveData', name: 'Twelve Data', markets: ['stocks', 'forex', 'crypto'] });
  }
  
  // Free crypto providers (no API key required for public data)
  providers.push({ id: 'coinbase', name: 'Coinbase', markets: ['crypto'] });
  providers.push({ id: 'coingecko', name: 'CoinGecko', markets: ['crypto'] });
  providers.push({ id: 'binance', name: 'Binance', markets: ['crypto'] });
  
  return providers;
}
