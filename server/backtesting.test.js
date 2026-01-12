import { parseRulesToConfig } from './backtesting.js';

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    return false;
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

console.log('Testing parseRulesToConfig...\n');

let passed = 0;
let failed = 0;

if (test('RSI detection from entry rules', () => {
  const config = parseRulesToConfig({
    rules: { entry: ['Wait for RSI to drop below 30 (oversold)'], exit: [], risk: [] }
  });
  assertEquals(config.entryIndicator?.type, 'rsi', 'Entry indicator type');
  assertEquals(config.entryIndicator?.oversold, 30, 'RSI oversold level');
})) passed++; else failed++;

if (test('RSI with custom period', () => {
  const config = parseRulesToConfig({
    rules: { entry: ['RSI(7) below 25'], exit: [], risk: [] }
  });
  assertEquals(config.entryIndicator?.type, 'rsi', 'Entry indicator type');
  assertEquals(config.entryIndicator?.period, 7, 'RSI period');
})) passed++; else failed++;

if (test('MA crossover detection', () => {
  const config = parseRulesToConfig({
    rules: { entry: ['Wait for 9 EMA to cross above 21 EMA'], exit: [], risk: [] }
  });
  assertEquals(config.entryIndicator?.type, 'ma_crossover', 'Entry indicator type');
  assertEquals(config.entryIndicator?.fastPeriod, 9, 'Fast period');
  assertEquals(config.entryIndicator?.slowPeriod, 21, 'Slow period');
})) passed++; else failed++;

if (test('Breakout detection', () => {
  const config = parseRulesToConfig({
    rules: { entry: ['Wait for price to breakout above 20 day high'], exit: [], risk: [] }
  });
  assertEquals(config.entryIndicator?.type, 'breakout', 'Entry indicator type');
  assertEquals(config.entryIndicator?.period, 20, 'Breakout period');
})) passed++; else failed++;

if (test('Risk percentage 1%', () => {
  const config = parseRulesToConfig({
    rules: { entry: [], exit: [], risk: ['Risk 1% per trade'] }
  });
  assertEquals(config.riskPerTrade, 0.01, 'Risk per trade');
})) passed++; else failed++;

if (test('Risk percentage 2%', () => {
  const config = parseRulesToConfig({
    rules: { entry: [], exit: [], risk: ['Max 2% risk per position'] }
  });
  assertEquals(config.riskPerTrade, 0.02, 'Risk per trade');
})) passed++; else failed++;

if (test('R:R ratio 3:1', () => {
  const config = parseRulesToConfig({
    rules: { entry: [], exit: ['Target 3:1 risk reward'], risk: [] }
  });
  assertEquals(config.rrRatio, 3, 'R:R ratio');
})) passed++; else failed++;

if (test('R:R ratio 2R format', () => {
  const config = parseRulesToConfig({
    rules: { entry: [], exit: ['Take profit at 2R'], risk: [] }
  });
  assertEquals(config.rrRatio, 2, 'R:R ratio');
})) passed++; else failed++;

if (test('High risk level adjustment', () => {
  const config = parseRulesToConfig({
    rules: { entry: [], exit: [], risk: ['Risk 1% per trade'] },
    riskLevel: 'High'
  });
  assertEquals(config.riskPerTrade, 0.015, 'Risk per trade adjusted for High');
  assertEquals(config.stopMultiplier, 1.5, 'Stop multiplier for High');
})) passed++; else failed++;

if (test('Low risk level adjustment', () => {
  const config = parseRulesToConfig({
    rules: { entry: [], exit: [], risk: ['Risk 2% per trade'] },
    riskLevel: 'Low'
  });
  assertEquals(config.riskPerTrade, 0.01, 'Risk per trade adjusted for Low');
  assertEquals(config.stopMultiplier, 2.5, 'Stop multiplier for Low');
})) passed++; else failed++;

if (test('Price action (candlestick patterns)', () => {
  const config = parseRulesToConfig({
    rules: { entry: ['Look for bullish engulfing candle'], exit: [], risk: [] }
  });
  assertEquals(config.entryIndicator, null, 'Entry indicator should be null for price action');
})) passed++; else failed++;

if (test('Exit RSI detection', () => {
  const config = parseRulesToConfig({
    rules: { entry: [], exit: ['Exit when RSI above 70'], risk: [] }
  });
  assertEquals(config.exitIndicator?.type, 'rsi', 'Exit indicator type');
})) passed++; else failed++;

console.log(`\n${passed}/${passed + failed} tests passed`);
process.exit(failed > 0 ? 1 : 0);
