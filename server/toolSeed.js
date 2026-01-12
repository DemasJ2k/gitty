export const preloadedTools = [
  {
    name: 'TradingView',
    description: 'Professional charting platform with advanced technical analysis tools, social trading features, and multi-asset coverage',
    category: 'Analysis',
    url: 'https://www.tradingview.com',
    tags: ['charting', 'technical analysis', 'screening', 'free tier'],
  },
  {
    name: 'Forex Factory Calendar',
    description: 'Comprehensive economic calendar tracking high-impact news events, central bank meetings, and market-moving data releases',
    category: 'News',
    url: 'https://www.forexfactory.com/calendar',
    tags: ['forex', 'economic calendar', 'news', 'free'],
  },
  {
    name: 'Myfxbook Position Size Calculator',
    description: 'Calculate optimal position size based on account balance, risk percentage, and stop loss distance',
    category: 'Calculators',
    url: 'https://www.myfxbook.com/forex-calculators/position-size',
    tags: ['risk management', 'forex', 'position sizing', 'free'],
  },
  {
    name: 'Finviz Stock Screener',
    description: 'Powerful stock screener with technical and fundamental filters, heatmaps, and sector analysis',
    category: 'Screeners',
    url: 'https://finviz.com/screener.ashx',
    tags: ['stocks', 'screening', 'fundamentals', 'free tier'],
  },
  {
    name: 'CoinGecko',
    description: 'Comprehensive cryptocurrency data platform with price tracking, market caps, and detailed coin analytics',
    category: 'Analysis',
    url: 'https://www.coingecko.com',
    tags: ['crypto', 'price tracking', 'research', 'free'],
  },
  {
    name: 'Investing.com Pip Calculator',
    description: 'Calculate pip value for any currency pair based on trade size and account currency',
    category: 'Calculators',
    url: 'https://www.investing.com/tools/forex-pip-calculator',
    tags: ['forex', 'pip value', 'calculations', 'free'],
  },
  {
    name: 'BabyPips School',
    description: 'Complete forex trading education from beginner to advanced, covering technical analysis, fundamentals, and psychology',
    category: 'Education',
    url: 'https://www.babypips.com/learn/forex',
    tags: ['forex', 'education', 'beginner', 'free'],
  },
  {
    name: 'Stock Analysis',
    description: 'Free fundamental analysis platform with financial statements, valuation metrics, and dividend history',
    category: 'Analysis',
    url: 'https://stockanalysis.com',
    tags: ['stocks', 'fundamentals', 'valuation', 'free'],
  },
  {
    name: 'TradingEconomics',
    description: 'Global economic indicators, forecasts, and historical data for all major economies',
    category: 'News',
    url: 'https://tradingeconomics.com',
    tags: ['macro', 'economics', 'data', 'free tier'],
  },
  {
    name: 'Profit/Loss Calculator',
    description: 'Calculate potential profit and loss for trades including spread, commission, and swap costs',
    category: 'Calculators',
    url: 'https://www.myfxbook.com/forex-calculators/profit-calculator',
    tags: ['risk management', 'P&L', 'planning', 'free'],
  },
  {
    name: 'Fear & Greed Index',
    description: 'CNN market sentiment indicator measuring investor fear and greed levels in the stock market',
    category: 'Analysis',
    url: 'https://www.cnn.com/markets/fear-and-greed',
    tags: ['sentiment', 'stocks', 'psychology', 'free'],
  },
  {
    name: 'Crypto Fear & Greed',
    description: 'Alternative.me index measuring crypto market sentiment from extreme fear to extreme greed',
    category: 'Analysis',
    url: 'https://alternative.me/crypto/fear-and-greed-index/',
    tags: ['crypto', 'sentiment', 'psychology', 'free'],
  },
  {
    name: 'MarketWatch',
    description: 'Financial news, market data, and analysis covering stocks, bonds, currencies, and commodities',
    category: 'News',
    url: 'https://www.marketwatch.com',
    tags: ['news', 'stocks', 'market data', 'free'],
  },
  {
    name: 'ICT YouTube Channel',
    description: 'Inner Circle Trader official channel with mentorship content, market structure, and order flow concepts',
    category: 'Education',
    url: 'https://www.youtube.com/@InnerCircleTrader',
    tags: ['ICT', 'education', 'smart money', 'free'],
  },
  {
    name: 'TradingView Economic Calendar',
    description: 'Economic calendar integrated with charting showing upcoming events and their potential market impact',
    category: 'News',
    url: 'https://www.tradingview.com/economic-calendar/',
    tags: ['calendar', 'events', 'multi-asset', 'free'],
  },
];

export const seedTools = async (storage, userId) => {
  let added = 0;
  let skipped = 0;

  for (const tool of preloadedTools) {
    const existing = await storage.getToolsByName(userId, tool.name);
    if (existing.length === 0) {
      await storage.createTool(userId, tool);
      added++;
    } else {
      skipped++;
    }
  }

  return { added, skipped, total: preloadedTools.length };
};
