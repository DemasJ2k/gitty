export const preloadedStrategies = [
  {
    name: "ICT London Killzone",
    description: "Capitalize on high volatility during London session open using ICT order blocks and fair value gaps",
    category: "Scalping",
    market: "Forex",
    timeframe: "15m",
    riskLevel: "Medium",
    rules: {
      entry: [
        "Wait for London killzone (7:00-10:00 GMT)",
        "Identify previous day's high/low and overnight range",
        "Look for displacement (strong impulsive move) creating FVG",
        "Wait for price to return to order block or FVG",
        "Confirm with market structure shift (break of recent swing high/low)",
        "Enter on tap of OB/FVG with tight stop"
      ],
      exit: [
        "Target 1: Previous session high/low",
        "Target 2: 2R from entry",
        "Close partial at 1R and move stop to breakeven",
        "Exit all positions before NY session overlap if not at target"
      ],
      risk: [
        "Risk 1% per trade maximum",
        "Stop loss behind order block or FVG extreme",
        "No trading during high-impact news within 30 minutes",
        "Maximum 2 trades per London session"
      ]
    },
    tags: ["ICT", "killzone", "order-blocks", "FVG"]
  },
  {
    name: "ICT NY Session Judas Swing",
    description: "Trade the classic stop hunt pattern during NY session open",
    category: "Trend Following",
    market: "Forex",
    timeframe: "5m",
    riskLevel: "Medium",
    rules: {
      entry: [
        "Wait for NY session open (8:00-9:00 EST)",
        "Identify previous session high and low",
        "Watch for initial push taking out one side's liquidity",
        "Wait for reversal showing market structure shift",
        "Enter on the reversal with stop behind swing extreme",
        "Look for displacement and FVG as confirmation"
      ],
      exit: [
        "Target 1: Opposite session extreme",
        "Target 2: Next significant liquidity pool",
        "Trail stop using 15-minute swing structure",
        "Close all by 11:00 EST if not at targets"
      ],
      risk: [
        "Risk 0.5-1% per trade",
        "Stop loss 5-10 pips behind Judas swing extreme",
        "Avoid FOMC days and NFP releases",
        "One trade per NY session"
      ]
    },
    tags: ["ICT", "judas-swing", "stop-hunt", "NY-session"]
  },
  {
    name: "Scalping MA Crossover",
    description: "Quick momentum trades using 8/21 EMA crossover on lower timeframes",
    category: "Scalping",
    market: "All",
    timeframe: "5m",
    riskLevel: "Low",
    rules: {
      entry: [
        "8 EMA crosses above 21 EMA for long entries",
        "8 EMA crosses below 21 EMA for short entries",
        "Price must be above/below both EMAs after cross",
        "Wait for pullback to 8 EMA for entry",
        "Confirm with RSI not in overbought/oversold territory"
      ],
      exit: [
        "Take profit at 1.5R from entry",
        "Stop loss at recent swing high/low",
        "Exit if price closes on wrong side of 21 EMA",
        "Maximum hold time: 30 minutes"
      ],
      risk: [
        "Risk 0.5% per trade (tight stops)",
        "Only trade during high-volume sessions",
        "Maximum 5 trades per day",
        "Stop trading after 3 consecutive losses"
      ]
    },
    tags: ["scalping", "EMA", "crossover", "momentum"]
  },
  {
    name: "Swing Trading 4H Trend",
    description: "Multi-day trend following using 4-hour chart structure",
    category: "Trend Following",
    market: "All",
    timeframe: "4h",
    riskLevel: "Medium",
    rules: {
      entry: [
        "Identify higher timeframe trend on daily chart",
        "Wait for 4H pullback to key support/resistance",
        "Look for bullish/bearish engulfing or pin bar",
        "Enter on break of pullback candle high/low",
        "Confirm with 50 SMA as dynamic support/resistance"
      ],
      exit: [
        "Target 1: Previous swing high/low (50% position)",
        "Target 2: 3R from entry (remaining position)",
        "Trail stop using 4H swing structure",
        "Maximum hold time: 5 days"
      ],
      risk: [
        "Risk 2% per trade",
        "Stop loss below/above pullback structure",
        "No new entries during major news events",
        "Maximum 3 swing trades open simultaneously"
      ]
    },
    tags: ["swing", "4H", "trend-following", "multi-day"]
  },
  {
    name: "Breakout Trading",
    description: "Trade strong moves from consolidation using volume confirmation",
    category: "Breakout",
    market: "Stocks",
    timeframe: "1h",
    riskLevel: "Medium",
    rules: {
      entry: [
        "Identify tight consolidation (range < 3% of price)",
        "Wait for at least 4 touches of support/resistance",
        "Enter on candle close outside range with increased volume",
        "Volume must be 1.5x average or higher",
        "Confirm breakout direction aligns with higher timeframe trend"
      ],
      exit: [
        "Target: Measure consolidation range and project from breakout",
        "Stop loss: Inside consolidation range (opposite side)",
        "Trail stop once 1R is reached",
        "Exit immediately on volume reversal candle"
      ],
      risk: [
        "Risk 1.5% per trade",
        "Avoid breakouts during first 15 minutes of session",
        "No entries within 30 minutes of market close",
        "Maximum 2 breakout trades per day"
      ]
    },
    tags: ["breakout", "consolidation", "volume", "stocks"]
  },
  {
    name: "RSI Divergence Reversal",
    description: "Counter-trend trades using RSI divergence at key levels",
    category: "Counter-Trend",
    market: "All",
    timeframe: "1h",
    riskLevel: "High",
    rules: {
      entry: [
        "Price makes new high/low at key support/resistance",
        "RSI shows opposite pattern (divergence)",
        "Wait for candle pattern confirmation (engulfing, hammer)",
        "Enter on break of confirmation candle",
        "Check for confluence with Fibonacci levels"
      ],
      exit: [
        "Target 1: Previous swing point (50% position)",
        "Target 2: 2R from entry",
        "Stop loss beyond the extreme that created divergence",
        "Exit if RSI moves back to extreme readings"
      ],
      risk: [
        "Risk 1% per trade (higher risk strategy)",
        "Only trade at strong horizontal levels",
        "Avoid during strong trending markets",
        "Maximum 1 counter-trend trade per day"
      ]
    },
    tags: ["RSI", "divergence", "reversal", "counter-trend"]
  },
  {
    name: "Crypto Pullback Strategy",
    description: "Trend continuation trades on crypto during pullbacks to key levels",
    category: "Trend Following",
    market: "Crypto",
    timeframe: "1h",
    riskLevel: "Medium",
    rules: {
      entry: [
        "Confirm uptrend on 4H chart (higher highs and higher lows)",
        "Wait for pullback to 21 or 50 EMA on 1H",
        "Look for bullish candle at EMA (hammer, engulfing)",
        "Volume should decrease during pullback",
        "Enter on break of pullback high"
      ],
      exit: [
        "Target 1: Previous high (50% position)",
        "Target 2: 1.618 Fibonacci extension",
        "Trail stop using 1H swing lows",
        "Exit all on 4H close below 50 EMA"
      ],
      risk: [
        "Risk 1-2% per trade",
        "Stop loss below pullback low",
        "Account for crypto volatility - wider stops needed",
        "No leverage above 3x for swing trades"
      ]
    },
    tags: ["crypto", "pullback", "EMA", "trend-continuation"]
  },
  {
    name: "Gold Mean Reversion",
    description: "Trade gold pullbacks to moving averages during trending sessions",
    category: "Counter-Trend",
    market: "Metals",
    timeframe: "15m",
    riskLevel: "Medium",
    rules: {
      entry: [
        "Identify daily trend direction",
        "Wait for price extension from 20 SMA (>2 ATR)",
        "Look for reversal candle pattern at extension",
        "Enter on break of reversal candle",
        "RSI in overbought/oversold confirms extension"
      ],
      exit: [
        "Target: 20 SMA (mean reversion target)",
        "Stop loss: Beyond recent swing extreme",
        "Close half position at 1R",
        "Exit if price shows renewed momentum in extension direction"
      ],
      risk: [
        "Risk 1% per trade",
        "Only trade during London or NY session",
        "Avoid during Fed announcements",
        "Gold spreads can be wide - factor into R calculation"
      ]
    },
    tags: ["gold", "metals", "mean-reversion", "SMA"]
  },
  {
    name: "Stock Opening Range Breakout",
    description: "Trade the first hour range breakout on liquid stocks",
    category: "Breakout",
    market: "Stocks",
    timeframe: "15m",
    riskLevel: "Medium",
    rules: {
      entry: [
        "Mark the high and low of first 30 minutes",
        "Wait for breakout on increased volume",
        "Price must close outside the range",
        "Pre-market trend should align with breakout direction",
        "Enter on pullback to range or immediate break"
      ],
      exit: [
        "Target: Opening range projected from breakout",
        "Stop loss: Opposite side of opening range",
        "Exit by 12:00 noon if not at target",
        "Close all positions by 3:30 PM"
      ],
      risk: [
        "Risk 1% per trade",
        "Only trade stocks with >$5M average daily volume",
        "Avoid on earnings days for the stock",
        "Maximum 2 ORB trades per day"
      ]
    },
    tags: ["ORB", "opening-range", "stocks", "breakout"]
  },
  {
    name: "Index Momentum Trading",
    description: "Trade major index futures during high momentum moves",
    category: "Trend Following",
    market: "Indices",
    timeframe: "5m",
    riskLevel: "High",
    rules: {
      entry: [
        "Identify strong directional move (>0.5% in first hour)",
        "Wait for consolidation flag pattern",
        "Enter on break of flag in direction of momentum",
        "VWAP should support trade direction",
        "VIX alignment - low VIX for longs, high VIX for shorts"
      ],
      exit: [
        "Target 1: Flag pole projection",
        "Target 2: Next psychological level (round number)",
        "Trail stop under 5-minute swing structure",
        "Exit on VWAP cross against position"
      ],
      risk: [
        "Risk 0.5-1% (indices are volatile)",
        "Stop loss: Opposite side of flag",
        "No trading during FOMC or major economic data",
        "Close positions 30 minutes before close"
      ]
    },
    tags: ["indices", "momentum", "VWAP", "futures"]
  },
  {
    name: "Commodity Seasonal Play",
    description: "Trade agricultural commodities based on seasonal patterns",
    category: "Trend Following",
    market: "Commodities",
    timeframe: "1d",
    riskLevel: "Medium",
    rules: {
      entry: [
        "Research seasonal tendency for the commodity",
        "Wait for technical confirmation of seasonal move",
        "Daily close above/below 20 SMA in seasonal direction",
        "Fundamentals should support (weather, reports)",
        "Enter on pullback to 20 SMA or break of consolidation"
      ],
      exit: [
        "Target: Seasonal historical average move",
        "Stop loss: Below/above pre-seasonal swing",
        "Hold through seasonal period unless stopped",
        "Exit on seasonal tendency end date"
      ],
      risk: [
        "Risk 1-2% per position",
        "Account for potential gap risk in commodities",
        "Check USDA report calendar before entry",
        "Reduce size during extreme weather events"
      ]
    },
    tags: ["commodities", "seasonal", "agriculture", "position"]
  },
  {
    name: "Simple Price Action",
    description: "Clean chart trading using only price action and key levels",
    category: "Trend Following",
    market: "All",
    timeframe: "1h",
    riskLevel: "Low",
    rules: {
      entry: [
        "Identify key horizontal support/resistance levels",
        "Wait for price to approach level with clear trend",
        "Look for rejection candle at level (pin bar, engulfing)",
        "Enter on break of rejection candle in trend direction",
        "No indicators - pure price action reading"
      ],
      exit: [
        "Target: Next key horizontal level",
        "Stop loss: Beyond the rejection candle wick",
        "Partial profit at 1R, trail remainder",
        "Exit if price spends 4 candles at level without moving"
      ],
      risk: [
        "Risk 1% per trade",
        "Only trade at significant levels (multi-touch preferred)",
        "Avoid choppy, ranging markets",
        "Maximum 3 active trades at once"
      ]
    },
    tags: ["price-action", "support-resistance", "naked-charts", "simple"]
  }
];

export const seedStrategies = async (storage, userId) => {
  const existingStrategies = await storage.getUserStrategies(userId);
  const existingNames = new Set(existingStrategies.map(s => s.name.toLowerCase()));
  
  const newStrategies = [];
  for (const strategy of preloadedStrategies) {
    if (!existingNames.has(strategy.name.toLowerCase())) {
      newStrategies.push(strategy);
    }
  }
  
  const results = [];
  for (const strategy of newStrategies) {
    try {
      const created = await storage.createStrategy({
        ...strategy,
        userId,
      });
      results.push({ name: strategy.name, success: true, id: created.id });
    } catch (error) {
      console.error(`Failed to seed strategy "${strategy.name}":`, error);
      results.push({ name: strategy.name, success: false, error: error.message });
    }
  }
  
  return {
    total: preloadedStrategies.length,
    added: results.filter(r => r.success).length,
    skipped: preloadedStrategies.length - newStrategies.length,
    failed: results.filter(r => !r.success).length,
    results,
  };
};
