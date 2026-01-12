export function parseRulesToConfig(strategy) {
  const rules = strategy.rules || {};
  const entryRules = (rules.entry || []).join(' ').toLowerCase();
  const exitRules = (rules.exit || []).join(' ').toLowerCase();
  const riskRules = (rules.risk || []).join(' ').toLowerCase();
  
  let entryIndicator = null;
  let exitIndicator = null;
  let stopMultiplier = 2;
  let rrRatio = 2;
  let riskPerTrade = 0.02;
  
  if (entryRules.includes('rsi') || entryRules.includes('oversold') || entryRules.includes('overbought')) {
    const periodMatch = entryRules.match(/rsi\s*\(?(\d+)/);
    const period = periodMatch ? parseInt(periodMatch[1]) : 14;
    const oversoldMatch = entryRules.match(/oversold.*?(\d+)|below\s*(\d+)/);
    const overboughtMatch = entryRules.match(/overbought.*?(\d+)|above\s*(\d+)/);
    entryIndicator = {
      type: 'rsi',
      period: period,
      oversold: oversoldMatch ? parseInt(oversoldMatch[1] || oversoldMatch[2]) : 30,
      overbought: overboughtMatch ? parseInt(overboughtMatch[1] || overboughtMatch[2]) : 70
    };
  } else if (entryRules.includes('breakout') || entryRules.includes('break out') || entryRules.includes('break above') || entryRules.includes('break below')) {
    const periodMatch = entryRules.match(/(\d+)\s*(day|candle|bar|period)/);
    entryIndicator = {
      type: 'breakout',
      period: periodMatch ? parseInt(periodMatch[1]) : 20
    };
  } else if (entryRules.includes('moving average') || entryRules.includes('ma cross') || entryRules.includes('ema') || entryRules.includes('sma')) {
    const numbers = entryRules.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      entryIndicator = {
        type: 'ma_crossover',
        fastPeriod: parseInt(numbers[0]),
        slowPeriod: parseInt(numbers[1])
      };
    } else {
      entryIndicator = { type: 'ma_crossover', fastPeriod: 9, slowPeriod: 21 };
    }
  } else if (entryRules.includes('pullback') || entryRules.includes('retracement') || entryRules.includes('fib')) {
    entryIndicator = { type: 'ma_crossover', fastPeriod: 9, slowPeriod: 21 };
  } else if (entryRules.includes('candle') || entryRules.includes('engulf') || entryRules.includes('pin bar') || entryRules.includes('hammer') || entryRules.includes('doji')) {
    entryIndicator = null;
  }
  
  if (exitRules.includes('rsi')) {
    exitIndicator = { type: 'rsi', period: 14, overbought: 70, oversold: 30 };
  } else if (exitRules.includes('moving average') || exitRules.includes('ma cross')) {
    exitIndicator = { type: 'ma_crossover', fastPeriod: 9, slowPeriod: 21 };
  }
  
  if (riskRules.includes('1%') || riskRules.includes('1 %') || riskRules.includes('one percent')) {
    riskPerTrade = 0.01;
  } else if (riskRules.includes('0.5%') || riskRules.includes('half percent')) {
    riskPerTrade = 0.005;
  } else if (riskRules.includes('2%') || riskRules.includes('two percent')) {
    riskPerTrade = 0.02;
  } else if (riskRules.includes('3%')) {
    riskPerTrade = 0.03;
  }
  
  const combinedRules = [entryRules, exitRules, riskRules].join(' ');
  const rrMatch = combinedRules.match(/(\d+)\s*:\s*1|(\d+)r\b|risk.?reward.*?(\d+)|(\d+)\s*to\s*1|target.*?(\d+)/i);
  if (rrMatch) {
    const parsed = parseInt(rrMatch[1] || rrMatch[2] || rrMatch[3] || rrMatch[4] || rrMatch[5]);
    if (parsed && parsed >= 1 && parsed <= 10) {
      rrRatio = parsed;
    }
  }
  
  if (strategy.riskLevel === 'High') {
    riskPerTrade *= 1.5;
    stopMultiplier = 1.5;
  } else if (strategy.riskLevel === 'Low') {
    riskPerTrade *= 0.5;
    stopMultiplier = 2.5;
  }
  
  return {
    name: strategy.name || 'Parsed Strategy',
    entryIndicator,
    exitIndicator,
    stopMultiplier,
    rrRatio,
    riskPerTrade,
    parsedFrom: 'user_rules'
  };
}

export class BacktestEngine {
  constructor(candles, strategy) {
    this.candles = candles;
    this.strategy = strategy;
    this.trades = [];
    this.equity = [];
    this.initialCapital = 10000;
    this.capital = this.initialCapital;
    this.position = null;
    this.riskPerTrade = strategy.riskPerTrade || 0.02;
  }

  run() {
    if (!this.candles || this.candles.length < 50) {
      throw new Error('Insufficient data for backtesting (need at least 50 candles)');
    }

    const lookback = Math.max(
      this.strategy.entryIndicator?.period || 20,
      this.strategy.exitIndicator?.period || 20,
      50
    );

    this.equity.push({
      time: this.candles[lookback - 1].time,
      value: this.capital
    });

    for (let i = lookback; i < this.candles.length; i++) {
      const candle = this.candles[i];
      const history = this.candles.slice(0, i + 1);

      if (this.position) {
        const exitSignal = this.checkExit(history, i);
        if (exitSignal) {
          this.closePosition(candle, exitSignal.reason);
        }
      }

      if (!this.position) {
        const entrySignal = this.checkEntry(history, i);
        if (entrySignal) {
          this.openPosition(candle, entrySignal);
        }
      }

      this.equity.push({
        time: candle.time,
        value: this.position 
          ? this.capital + this.getUnrealizedPnL(candle) 
          : this.capital
      });
    }

    if (this.position) {
      this.closePosition(this.candles[this.candles.length - 1], 'end_of_data');
    }

    return this.calculateMetrics();
  }

  checkEntry(history, index) {
    const candle = history[index];
    const indicator = this.strategy.entryIndicator;

    if (!indicator) {
      return this.checkPriceAction(history, index);
    }

    switch (indicator.type) {
      case 'ma_crossover':
        return this.checkMACrossover(history, indicator);
      case 'rsi':
        return this.checkRSI(history, indicator);
      case 'breakout':
        return this.checkBreakout(history, indicator);
      default:
        return this.checkPriceAction(history, index);
    }
  }

  checkExit(history, index) {
    const candle = history[index];
    
    if (this.position) {
      if (this.position.stopLoss && candle.low <= this.position.stopLoss && this.position.direction === 'long') {
        return { reason: 'stop_loss' };
      }
      if (this.position.stopLoss && candle.high >= this.position.stopLoss && this.position.direction === 'short') {
        return { reason: 'stop_loss' };
      }
      if (this.position.takeProfit && candle.high >= this.position.takeProfit && this.position.direction === 'long') {
        return { reason: 'take_profit' };
      }
      if (this.position.takeProfit && candle.low <= this.position.takeProfit && this.position.direction === 'short') {
        return { reason: 'take_profit' };
      }
    }

    const indicator = this.strategy.exitIndicator;
    if (!indicator) return null;

    switch (indicator.type) {
      case 'ma_crossover':
        const signal = this.checkMACrossover(history, indicator);
        if (signal && this.position && signal.direction !== this.position.direction) {
          return { reason: 'signal_reversal' };
        }
        break;
      case 'rsi':
        const rsi = this.calculateRSI(history, indicator.period || 14);
        if (this.position?.direction === 'long' && rsi > (indicator.overbought || 70)) {
          return { reason: 'rsi_overbought' };
        }
        if (this.position?.direction === 'short' && rsi < (indicator.oversold || 30)) {
          return { reason: 'rsi_oversold' };
        }
        break;
    }

    return null;
  }

  checkMACrossover(history, indicator) {
    const fast = indicator.fastPeriod || 9;
    const slow = indicator.slowPeriod || 21;

    if (history.length < slow + 2) return null;

    const fastMA = this.calculateSMA(history.slice(-fast - 1, -1).map(c => c.close));
    const slowMA = this.calculateSMA(history.slice(-slow - 1, -1).map(c => c.close));
    const prevFastMA = this.calculateSMA(history.slice(-fast - 2, -2).map(c => c.close));
    const prevSlowMA = this.calculateSMA(history.slice(-slow - 2, -2).map(c => c.close));

    if (prevFastMA <= prevSlowMA && fastMA > slowMA) {
      return { direction: 'long', reason: 'ma_bullish_crossover' };
    }
    if (prevFastMA >= prevSlowMA && fastMA < slowMA) {
      return { direction: 'short', reason: 'ma_bearish_crossover' };
    }

    return null;
  }

  checkRSI(history, indicator) {
    const period = indicator.period || 14;
    const oversold = indicator.oversold || 30;
    const overbought = indicator.overbought || 70;

    if (history.length < period + 2) return null;

    const rsi = this.calculateRSI(history, period);
    const prevRSI = this.calculateRSI(history.slice(0, -1), period);

    if (prevRSI <= oversold && rsi > oversold) {
      return { direction: 'long', reason: 'rsi_oversold_bounce' };
    }
    if (prevRSI >= overbought && rsi < overbought) {
      return { direction: 'short', reason: 'rsi_overbought_reversal' };
    }

    return null;
  }

  checkBreakout(history, indicator) {
    const period = indicator.period || 20;

    if (history.length < period + 1) return null;

    const recentCandles = history.slice(-period - 1, -1);
    const highestHigh = Math.max(...recentCandles.map(c => c.high));
    const lowestLow = Math.min(...recentCandles.map(c => c.low));
    const currentCandle = history[history.length - 1];

    if (currentCandle.close > highestHigh) {
      return { direction: 'long', reason: 'breakout_high' };
    }
    if (currentCandle.close < lowestLow) {
      return { direction: 'short', reason: 'breakout_low' };
    }

    return null;
  }

  checkPriceAction(history, index) {
    if (history.length < 3) return null;

    const candle = history[index];
    const prev = history[index - 1];
    const prev2 = history[index - 2];

    if (prev.close < prev.open && candle.close > candle.open && candle.close > prev.open) {
      return { direction: 'long', reason: 'bullish_engulfing' };
    }
    if (prev.close > prev.open && candle.close < candle.open && candle.close < prev.open) {
      return { direction: 'short', reason: 'bearish_engulfing' };
    }

    return null;
  }

  openPosition(candle, signal) {
    const atr = this.calculateATR(this.candles.slice(0, this.candles.indexOf(candle) + 1), 14);
    const stopDistance = atr * (this.strategy.stopMultiplier || 2);
    const riskAmount = this.capital * this.riskPerTrade;
    const positionSize = riskAmount / stopDistance;

    this.position = {
      direction: signal.direction,
      entryPrice: candle.close,
      entryTime: candle.time,
      size: positionSize,
      stopLoss: signal.direction === 'long' 
        ? candle.close - stopDistance 
        : candle.close + stopDistance,
      takeProfit: signal.direction === 'long'
        ? candle.close + stopDistance * (this.strategy.rrRatio || 2)
        : candle.close - stopDistance * (this.strategy.rrRatio || 2),
      reason: signal.reason
    };
  }

  closePosition(candle, reason) {
    if (!this.position) return;

    let exitPrice = candle.close;
    
    if (reason === 'stop_loss') {
      exitPrice = this.position.stopLoss;
    } else if (reason === 'take_profit') {
      exitPrice = this.position.takeProfit;
    }

    const pnl = this.position.direction === 'long'
      ? (exitPrice - this.position.entryPrice) * this.position.size
      : (this.position.entryPrice - exitPrice) * this.position.size;

    this.capital += pnl;

    this.trades.push({
      direction: this.position.direction,
      entryPrice: this.position.entryPrice,
      exitPrice: exitPrice,
      entryTime: this.position.entryTime,
      exitTime: candle.time,
      pnl: pnl,
      pnlPercent: (pnl / this.initialCapital) * 100,
      reason: this.position.reason,
      exitReason: reason
    });

    this.position = null;
  }

  getUnrealizedPnL(candle) {
    if (!this.position) return 0;
    return this.position.direction === 'long'
      ? (candle.close - this.position.entryPrice) * this.position.size
      : (this.position.entryPrice - candle.close) * this.position.size;
  }

  calculateMetrics() {
    if (this.trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        avgTradeDuration: 0,
        trades: [],
        equity: this.equity
      };
    }

    const winningTrades = this.trades.filter(t => t.pnl > 0);
    const losingTrades = this.trades.filter(t => t.pnl <= 0);

    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

    const returns = [];
    for (let i = 1; i < this.equity.length; i++) {
      returns.push((this.equity[i].value - this.equity[i-1].value) / this.equity[i-1].value);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdReturn = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );

    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peak = this.equity[0].value;
    for (const point of this.equity) {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdown = peak - point.value;
      const drawdownPercent = (drawdown / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    const tradeDurations = this.trades.map(t => {
      return new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime();
    });
    const avgDuration = tradeDurations.reduce((a, b) => a + b, 0) / tradeDurations.length;
    const avgDurationHours = avgDuration / (1000 * 60 * 60);

    return {
      totalTrades: this.trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / this.trades.length) * 100,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      sharpeRatio: stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0,
      maxDrawdown: maxDrawdown,
      maxDrawdownPercent: maxDrawdownPercent,
      totalReturn: this.capital - this.initialCapital,
      totalReturnPercent: ((this.capital - this.initialCapital) / this.initialCapital) * 100,
      finalCapital: this.capital,
      avgWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0,
      avgTradeDurationHours: avgDurationHours,
      trades: this.trades,
      equity: this.equity
    };
  }

  calculateSMA(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  calculateRSI(history, period) {
    if (history.length < period + 1) return 50;

    const closes = history.slice(-period - 1).map(c => c.close);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateATR(history, period) {
    if (history.length < period + 1) {
      const candle = history[history.length - 1];
      return candle.high - candle.low;
    }

    const trs = [];
    for (let i = 1; i < history.length; i++) {
      const candle = history[i];
      const prev = history[i - 1];
      const tr = Math.max(
        candle.high - candle.low,
        Math.abs(candle.high - prev.close),
        Math.abs(candle.low - prev.close)
      );
      trs.push(tr);
    }

    return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
  }
}

export const strategyTemplates = {
  ma_crossover: {
    name: 'Moving Average Crossover',
    entryIndicator: { type: 'ma_crossover', fastPeriod: 9, slowPeriod: 21 },
    exitIndicator: { type: 'ma_crossover', fastPeriod: 9, slowPeriod: 21 },
    stopMultiplier: 2,
    rrRatio: 2,
    riskPerTrade: 0.02
  },
  rsi_reversal: {
    name: 'RSI Reversal',
    entryIndicator: { type: 'rsi', period: 14, oversold: 30, overbought: 70 },
    exitIndicator: { type: 'rsi', period: 14, oversold: 30, overbought: 70 },
    stopMultiplier: 1.5,
    rrRatio: 2,
    riskPerTrade: 0.02
  },
  breakout: {
    name: 'Breakout Strategy',
    entryIndicator: { type: 'breakout', period: 20 },
    exitIndicator: null,
    stopMultiplier: 1.5,
    rrRatio: 3,
    riskPerTrade: 0.01
  },
  price_action: {
    name: 'Price Action',
    entryIndicator: null,
    exitIndicator: null,
    stopMultiplier: 2,
    rrRatio: 2,
    riskPerTrade: 0.02
  }
};
