import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Play, 
  Loader2, 
  AlertTriangle,
  Award,
  Target,
  BarChart3,
  Clock,
  DollarSign,
  LineChart
} from 'lucide-react';
import { createChart, ColorType, LineSeries, HistogramSeries, AreaSeries } from 'lightweight-charts';
import { useTheme } from '@/contexts/ThemeContext';

interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  finalCapital: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  avgTradeDurationHours: number;
  trades: Trade[];
  equity: { time: string; value: number }[];
}

interface Trade {
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  pnl: number;
  pnlPercent: number;
  reason: string;
  exitReason: string;
}

interface StrategyTemplate {
  name: string;
  entryIndicator: { type: string; [key: string]: any } | null;
  exitIndicator: { type: string; [key: string]: any } | null;
  stopMultiplier: number;
  rrRatio: number;
  riskPerTrade: number;
}

function EquityChart({ equity, trades }: { equity: { time: string; value: number }[], trades: Trade[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current || !equity || equity.length === 0) return;

    const isDark = resolvedTheme === 'dark';
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? 'hsl(222.2 84% 4.9%)' : 'white' },
        textColor: isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 250,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#22c55e',
      topColor: 'rgba(34, 197, 94, 0.4)',
      bottomColor: 'rgba(34, 197, 94, 0.05)',
      lineWidth: 2,
    });

    const chartData = equity.map(point => ({
      time: point.time as any,
      value: point.value,
    }));

    areaSeries.setData(chartData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [equity, resolvedTheme]);

  return <div ref={chartContainerRef} data-testid="equity-chart" />;
}

function DrawdownChart({ equity }: { equity: { time: string; value: number }[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current || !equity || equity.length === 0) return;

    const isDark = resolvedTheme === 'dark';
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? 'hsl(222.2 84% 4.9%)' : 'white' },
        textColor: isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 200,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#ef4444',
      topColor: 'rgba(239, 68, 68, 0.05)',
      bottomColor: 'rgba(239, 68, 68, 0.4)',
      lineWidth: 2,
      invertFilledArea: true,
    });

    let peak = equity[0]?.value || 10000;
    const drawdownData = equity.map(point => {
      if (point.value > peak) peak = point.value;
      const drawdownPercent = ((point.value - peak) / peak) * 100;
      return {
        time: point.time as any,
        value: drawdownPercent,
      };
    });

    areaSeries.setData(drawdownData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [equity, resolvedTheme]);

  return <div ref={chartContainerRef} data-testid="drawdown-chart" />;
}

function TradeDistributionChart({ trades }: { trades: Trade[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current || !trades || trades.length === 0) return;

    const isDark = resolvedTheme === 'dark';
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? 'hsl(222.2 84% 4.9%)' : 'white' },
        textColor: isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 200,
    });

    const histogramSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
    });

    const histogramData = trades.map((trade, index) => ({
      time: index as any,
      value: trade.pnl,
      color: trade.pnl >= 0 ? '#22c55e' : '#ef4444',
    }));

    histogramSeries.setData(histogramData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [trades, resolvedTheme]);

  return <div ref={chartContainerRef} data-testid="trade-distribution-chart" />;
}

interface MarketProvider {
  id: string;
  name: string;
  markets: string[];
}

export function BacktestPage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedStrategy, setSelectedStrategy] = useState('ma_crossover');
  const [templates, setTemplates] = useState<Record<string, StrategyTemplate>>({});
  const [providers, setProviders] = useState<MarketProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'metrics' | 'charts' | 'trades'>('metrics');

  const timeframes = [
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
  ];

  useEffect(() => {
    fetchTemplates();
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/market/providers', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setProviders(data || []);
        // Set default provider if available
        if (data && data.length > 0 && !selectedProvider) {
          setSelectedProvider(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/backtest/templates', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || {});
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const runBacktest = async () => {
    setIsRunning(true);
    setError('');
    setResults(null);

    try {
      const strategy = templates[selectedStrategy];
      const response = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol,
          timeframe,
          strategy,
          provider: selectedProvider || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to run backtest');
      }
    } catch (err) {
      setError('Failed to run backtest');
    } finally {
      setIsRunning(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="p-6 space-y-6" data-testid="backtest-page">
      <div>
        <h1 className="text-2xl font-bold">Backtesting</h1>
        <p className="text-muted-foreground">Test trading strategies on historical data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backtest Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., BTCUSDT"
                data-testid="input-symbol"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full border rounded-md p-2 bg-background"
                data-testid="select-timeframe"
              >
                {timeframes.map((tf) => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full border rounded-md p-2 bg-background"
                data-testid="select-provider"
              >
                {providers.length === 0 ? (
                  <option value="">Loading providers...</option>
                ) : (
                  providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} ({provider.markets.join(', ')})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Strategy</label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full border rounded-md p-2 bg-background"
                data-testid="select-strategy"
              >
                {Object.entries(templates).map(([key, template]) => (
                  <option key={key} value={key}>{template.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedStrategy && templates[selectedStrategy] && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <div className="font-medium mb-1">{templates[selectedStrategy].name}</div>
              <div className="text-muted-foreground">
                Risk per trade: {(templates[selectedStrategy].riskPerTrade * 100).toFixed(0)}% | 
                Risk/Reward: 1:{templates[selectedStrategy].rrRatio} | 
                Stop: {templates[selectedStrategy].stopMultiplier}x ATR
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button 
            onClick={runBacktest} 
            disabled={isRunning || !symbol}
            className="w-full"
            data-testid="button-run-backtest"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Backtest...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Backtest
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={results.totalReturnPercent >= 0 ? 'border-green-500' : 'border-red-500'}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className={`text-2xl font-bold ${results.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(results.totalReturnPercent)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(results.totalReturn)}</p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${results.totalReturnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold">{results.winRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {results.winningTrades}W / {results.losingTrades}L
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Factor</p>
                    <p className="text-2xl font-bold">
                      {results.profitFactor === Infinity ? '∞' : results.profitFactor.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{results.totalTrades} trades</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                    <p className="text-2xl font-bold">{results.sharpeRatio.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Annualized</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'metrics' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-metrics"
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'charts' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-charts"
            >
              <LineChart className="h-4 w-4" />
              Performance Charts
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'trades' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-trades"
            >
              Trade History ({results.trades.length})
            </button>
          </div>

          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Drawdown</span>
                      <span className="font-medium text-red-600">
                        -{results.maxDrawdownPercent.toFixed(2)}% ({formatCurrency(results.maxDrawdown)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Final Capital</span>
                      <span className="font-medium">{formatCurrency(results.finalCapital)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Win</span>
                      <span className="font-medium text-green-600">{formatCurrency(results.avgWin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Loss</span>
                      <span className="font-medium text-red-600">-{formatCurrency(results.avgLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Largest Win</span>
                      <span className="font-medium text-green-600">{formatCurrency(results.largestWin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Largest Loss</span>
                      <span className="font-medium text-red-600">{formatCurrency(results.largestLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Trade Duration</span>
                      <span className="font-medium">{results.avgTradeDurationHours.toFixed(1)} hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Win/Loss Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Win Rate</span>
                        <span>{results.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${results.winRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{results.winningTrades}</p>
                        <p className="text-xs text-muted-foreground">Winning Trades</p>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{results.losingTrades}</p>
                        <p className="text-xs text-muted-foreground">Losing Trades</p>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Expectancy per Trade</p>
                      <p className={`text-xl font-bold ${results.totalReturn / results.totalTrades >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(results.totalTrades > 0 ? results.totalReturn / results.totalTrades : 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Equity Curve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.equity && results.equity.length > 0 ? (
                    <EquityChart equity={results.equity} trades={results.trades} />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No equity data available</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Drawdown Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.equity && results.equity.length > 0 ? (
                      <DrawdownChart equity={results.equity} />
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      Trade P&L Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.trades && results.trades.length > 0 ? (
                      <TradeDistributionChart trades={results.trades} />
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No trades available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'trades' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  All Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.trades.slice().reverse().map((trade, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-md text-sm ${
                        trade.pnl >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {trade.direction === 'long' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium capitalize">{trade.direction}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(trade.entryTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.pnl)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({formatPercent(trade.pnlPercent)})
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                        <span>Entry: {trade.entryPrice.toFixed(2)} → Exit: {trade.exitPrice.toFixed(2)}</span>
                        <span className="capitalize">{trade.exitReason}</span>
                      </div>
                    </div>
                  ))}
                  {results.trades.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No trades executed</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
