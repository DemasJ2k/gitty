import { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, X, Sparkles, Loader2, BookOpen, PlayCircle, Brain, TrendingUp, TrendingDown, LineChart, BarChart3 } from 'lucide-react';
import { createChart, ColorType, AreaSeries, HistogramSeries } from 'lightweight-charts';
import { useTheme } from '@/contexts/ThemeContext';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  market: string | null;
  timeframe: string | null;
  riskLevel: string | null;
  rules: { entry?: string[]; exit?: string[]; risk?: string[] } | null;
  tags: string[];
  createdAt: string;
}

interface BacktestResults {
  totalTrades: number;
  winningTrades?: number;
  losingTrades?: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent?: number;
  sharpeRatio: number;
  totalReturn: number;
  totalReturnPercent?: number;
  finalCapital?: number;
  avgWin: number;
  avgLoss: number;
  largestWin?: number;
  largestLoss?: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  avgTradeDurationHours?: number;
  trades?: Trade[];
  equity?: { time: string; value: number }[];
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

interface MarketProvider {
  id: string;
  name: string;
  markets: string[];
}

function EquityChart({ equity }: { equity: { time: string; value: number }[] }) {
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
      height: 150,
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

export function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [backtestingStrategy, setBacktestingStrategy] = useState<Strategy | null>(null);
  const [backtestSymbol, setBacktestSymbol] = useState('BTCUSDT');
  const [backtestTimeframe, setBacktestTimeframe] = useState('1h');
  const [backtestProvider, setBacktestProvider] = useState('');
  const [providers, setProviders] = useState<MarketProvider[]>([]);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResults, setBacktestResults] = useState<BacktestResults | null>(null);
  const [backtestError, setBacktestError] = useState('');
  const [backtestTab, setBacktestTab] = useState<'metrics' | 'charts' | 'trades'>('metrics');
  const [isImproving, setIsImproving] = useState(false);
  const [improvements, setImprovements] = useState<string | null>(null);
  const [improvementError, setImprovementError] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Day Trading',
    market: 'Forex',
    timeframe: '1h',
    riskLevel: 'Medium',
    entryRules: '',
    exitRules: '',
    riskRules: '',
    tags: '',
  });

  useEffect(() => {
    loadStrategies();
    loadProviders();
  }, []);

  const loadStrategies = async () => {
    try {
      const data = await fetchApi('/api/strategies');
      setStrategies(data);
    } catch (err) {
      console.error('Failed to load strategies:', err);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/market/providers', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setProviders(data || []);
        if (data && data.length > 0 && !backtestProvider) {
          setBacktestProvider(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    }
  };

  const saveStrategy = async () => {
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        category: form.category || null,
        market: form.market || null,
        timeframe: form.timeframe || null,
        riskLevel: form.riskLevel || null,
        rules: {
          entry: form.entryRules ? form.entryRules.split('\n').filter(Boolean) : [],
          exit: form.exitRules ? form.exitRules.split('\n').filter(Boolean) : [],
          risk: form.riskRules ? form.riskRules.split('\n').filter(Boolean) : [],
        },
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };

      if (editingId) {
        await fetchApi(`/api/strategies/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/api/strategies', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      loadStrategies();
    } catch (err) {
      console.error('Failed to save strategy:', err);
    }
  };

  const deleteStrategy = async (id: string) => {
    try {
      await fetchApi(`/api/strategies/${id}`, { method: 'DELETE' });
      loadStrategies();
    } catch (err) {
      console.error('Failed to delete strategy:', err);
    }
  };

  const startEdit = (strategy: Strategy) => {
    setEditingId(strategy.id);
    setForm({
      name: strategy.name,
      description: strategy.description || '',
      category: strategy.category || 'Day Trading',
      market: strategy.market || 'Forex',
      timeframe: strategy.timeframe || '1h',
      riskLevel: strategy.riskLevel || 'Medium',
      entryRules: strategy.rules?.entry?.join('\n') || '',
      exitRules: strategy.rules?.exit?.join('\n') || '',
      riskRules: strategy.rules?.risk?.join('\n') || '',
      tags: strategy.tags.join(', '),
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      category: 'Day Trading',
      market: 'Forex',
      timeframe: '1h',
      riskLevel: 'Medium',
      entryRules: '',
      exitRules: '',
      riskRules: '',
      tags: '',
    });
  };

  const generateStrategy = async () => {
    if (!generatePrompt.trim() || generatePrompt.length < 10) {
      setGenerateError('Please describe your strategy idea in more detail');
      return;
    }

    setIsGenerating(true);
    setGenerateError('');

    try {
      const response = await fetch('/api/strategies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: generatePrompt,
          market: form.market,
          category: form.category,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setForm({
          ...form,
          name: data.name || '',
          description: data.description || '',
          category: data.category || form.category,
          market: data.market || form.market,
          timeframe: data.timeframe || form.timeframe,
          entryRules: Array.isArray(data.entryRules) ? data.entryRules.join('\n') : '',
          exitRules: Array.isArray(data.exitRules) ? data.exitRules.join('\n') : '',
          riskRules: Array.isArray(data.riskRules) ? data.riskRules.join('\n') : '',
        });
        setShowGenerator(false);
        setIsCreating(true);
      } else {
        const errorData = await response.json();
        setGenerateError(errorData.error || 'Failed to generate strategy');
      }
    } catch (err) {
      setGenerateError('Failed to generate strategy. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const seedStrategiesFromPreloaded = async () => {
    setIsSeeding(true);
    setSeedMessage('');
    try {
      const response = await fetch('/api/strategies/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setSeedMessage(data.message);
        loadStrategies();
      } else {
        setSeedMessage('Failed to load strategies: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setSeedMessage('Failed to load strategies');
    } finally {
      setIsSeeding(false);
    }
  };

  const openBacktest = (strategy: Strategy) => {
    setBacktestingStrategy(strategy);
    setBacktestSymbol(strategy.market === 'Crypto' ? 'BTCUSDT' : strategy.market === 'Forex' ? 'EURUSD' : 'AAPL');
    setBacktestTimeframe(strategy.timeframe || '1h');
    setBacktestResults(null);
    setBacktestError('');
    setImprovements(null);
    setImprovementError('');
  };

  const closeBacktest = () => {
    setBacktestingStrategy(null);
    setBacktestResults(null);
    setBacktestError('');
    setImprovements(null);
    setImprovementError('');
  };

  const runBacktest = async () => {
    if (!backtestingStrategy) return;
    setIsBacktesting(true);
    setBacktestError('');
    setBacktestResults(null);
    setBacktestTab('metrics');
    setImprovements(null);
    setImprovementError('');

    try {
      const response = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol: backtestSymbol,
          timeframe: backtestTimeframe,
          provider: backtestProvider || undefined,
          strategy: {
            name: backtestingStrategy.name,
            category: backtestingStrategy.category,
            riskLevel: backtestingStrategy.riskLevel,
            rules: backtestingStrategy.rules,
          },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setBacktestResults(data.results);
      } else {
        setBacktestError(data.error || 'Failed to run backtest');
      }
    } catch (err) {
      setBacktestError('Failed to run backtest. Please try again.');
    } finally {
      setIsBacktesting(false);
    }
  };

  const getAIImprovements = async () => {
    if (!backtestingStrategy || !backtestResults) return;
    setIsImproving(true);
    setImprovementError('');
    setImprovements(null);

    try {
      const response = await fetch('/api/backtest/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          strategy: backtestingStrategy,
          backtestResults,
          symbol: backtestSymbol,
          timeframe: backtestTimeframe,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setImprovements(data.analysis);
      } else {
        setImprovementError(data.error || 'Failed to get AI suggestions');
      }
    } catch (err) {
      setImprovementError('Failed to get AI suggestions. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="strategies-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Strategies</h1>
          <p className="text-muted-foreground">Document and manage your trading strategies</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={seedStrategiesFromPreloaded} 
            disabled={isSeeding}
            data-testid="button-load-strategies"
          >
            {isSeeding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            Load Trading Strategies
          </Button>
          <Button variant="outline" onClick={() => setShowGenerator(true)} data-testid="button-ai-generate">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
          <Button onClick={() => setIsCreating(true)} data-testid="button-new-strategy">
            <Plus className="h-4 w-4 mr-2" />
            New Strategy
          </Button>
        </div>
      </div>

      {seedMessage && (
        <div className={`p-3 rounded-md text-sm ${seedMessage.includes('Failed') ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'}`}>
          {seedMessage}
        </div>
      )}

      {showGenerator && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Strategy Generator
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setShowGenerator(false); setGenerateError(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {generateError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-md">
                {generateError}
              </div>
            )}
            <Textarea
              placeholder="Describe your trading strategy idea... For example: 'A momentum strategy that buys when RSI crosses above 30 and price is above the 200 EMA, targeting 2:1 risk reward on crypto pairs'"
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              rows={4}
              data-testid="input-generate-prompt"
            />
            <div className="flex gap-2">
              <select
                value={form.market}
                onChange={(e) => setForm({ ...form, market: e.target.value })}
                className="border rounded-md p-2 bg-background"
              >
                <option value="Forex">Forex</option>
                <option value="Crypto">Crypto</option>
                <option value="Stocks">Stocks</option>
                <option value="Metals">Metals</option>
                <option value="All">All Markets</option>
              </select>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border rounded-md p-2 bg-background"
              >
                <option value="Scalping">Scalping</option>
                <option value="Day Trading">Day Trading</option>
                <option value="Swing">Swing Trading</option>
                <option value="Position">Position Trading</option>
                <option value="Trend Following">Trend Following</option>
                <option value="Mean Reversion">Mean Reversion</option>
              </select>
              <Button 
                onClick={generateStrategy} 
                disabled={isGenerating || !generatePrompt.trim()}
                className="flex-1"
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Strategy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isCreating && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Edit Strategy' : 'New Strategy'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Strategy Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="input-name"
              />
              <Input
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                data-testid="input-tags"
              />
            </div>

            <Textarea
              placeholder="Strategy description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              data-testid="input-description"
            />

            <div className="grid grid-cols-4 gap-4">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border rounded-md p-2"
                data-testid="select-category"
              >
                <option value="Scalping">Scalping</option>
                <option value="Day Trading">Day Trading</option>
                <option value="Swing">Swing</option>
                <option value="Position">Position</option>
              </select>
              <select
                value={form.market}
                onChange={(e) => setForm({ ...form, market: e.target.value })}
                className="border rounded-md p-2"
                data-testid="select-market"
              >
                <option value="Forex">Forex</option>
                <option value="Crypto">Crypto</option>
                <option value="Stocks">Stocks</option>
                <option value="Metals">Metals</option>
              </select>
              <select
                value={form.timeframe}
                onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                className="border rounded-md p-2"
                data-testid="select-timeframe"
              >
                <option value="1m">1 min</option>
                <option value="5m">5 min</option>
                <option value="15m">15 min</option>
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="1d">Daily</option>
              </select>
              <select
                value={form.riskLevel}
                onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
                className="border rounded-md p-2"
                data-testid="select-risk"
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Entry Rules (one per line)</label>
                <Textarea
                  placeholder="Confirm trend direction&#10;Wait for pullback..."
                  value={form.entryRules}
                  onChange={(e) => setForm({ ...form, entryRules: e.target.value })}
                  rows={4}
                  data-testid="input-entry-rules"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Exit Rules (one per line)</label>
                <Textarea
                  placeholder="Take profit at 2R&#10;Trail stop after 1R..."
                  value={form.exitRules}
                  onChange={(e) => setForm({ ...form, exitRules: e.target.value })}
                  rows={4}
                  data-testid="input-exit-rules"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Risk Rules (one per line)</label>
                <Textarea
                  placeholder="Max 1% per trade&#10;Max 3 trades per day..."
                  value={form.riskRules}
                  onChange={(e) => setForm({ ...form, riskRules: e.target.value })}
                  rows={4}
                  data-testid="input-risk-rules"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveStrategy} data-testid="button-save-strategy">
                {editingId ? 'Update' : 'Save'} Strategy
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {backtestingStrategy && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Backtest: {backtestingStrategy.name}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={closeBacktest}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Symbol</label>
                <Input
                  value={backtestSymbol}
                  onChange={(e) => setBacktestSymbol(e.target.value.toUpperCase())}
                  placeholder="BTCUSDT, EURUSD, AAPL..."
                  data-testid="input-backtest-symbol"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Timeframe</label>
                <select
                  value={backtestTimeframe}
                  onChange={(e) => setBacktestTimeframe(e.target.value)}
                  className="w-full border rounded-md p-2 bg-background"
                  data-testid="select-backtest-timeframe"
                >
                  <option value="1m">1 min</option>
                  <option value="5m">5 min</option>
                  <option value="15m">15 min</option>
                  <option value="1h">1 hour</option>
                  <option value="4h">4 hours</option>
                  <option value="1d">Daily</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data Provider</label>
                <select
                  value={backtestProvider}
                  onChange={(e) => setBacktestProvider(e.target.value)}
                  className="w-full border rounded-md p-2 bg-background"
                  data-testid="select-backtest-provider"
                >
                  {providers.length === 0 ? (
                    <option value="">Loading...</option>
                  ) : (
                    providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={runBacktest}
                  disabled={isBacktesting || !backtestSymbol}
                  className="w-full"
                  data-testid="button-run-backtest"
                >
                  {isBacktesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Run Backtest
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Backtest parses your rules for keywords (RSI, MA, breakout, etc.) to select indicators. AI then reviews your complete strategy alongside results.
            </p>

            {backtestError && (
              <div className="p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-sm">
                {backtestError}
              </div>
            )}

            {backtestResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-md bg-muted text-center">
                    <div className="text-2xl font-bold">{backtestResults.totalTrades}</div>
                    <div className="text-xs text-muted-foreground">Total Trades</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted text-center">
                    <div className={`text-2xl font-bold ${backtestResults.winRate >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                      {(backtestResults.winRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted text-center">
                    <div className={`text-2xl font-bold ${backtestResults.profitFactor >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {backtestResults.profitFactor?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Profit Factor</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {(backtestResults.maxDrawdown * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Max Drawdown</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted text-center">
                    <div className={`text-2xl font-bold ${backtestResults.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {backtestResults.totalReturn >= 0 ? '+' : ''}{(backtestResults.totalReturn * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Total Return</div>
                  </div>
                </div>

                <div className="flex gap-2 border-b">
                  <button
                    onClick={() => setBacktestTab('metrics')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      backtestTab === 'metrics' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="tab-metrics"
                  >
                    Metrics
                  </button>
                  <button
                    onClick={() => setBacktestTab('charts')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      backtestTab === 'charts' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="tab-charts"
                  >
                    <LineChart className="h-4 w-4" />
                    Charts
                  </button>
                  <button
                    onClick={() => setBacktestTab('trades')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      backtestTab === 'trades' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="tab-trades"
                  >
                    Trades ({backtestResults.trades?.length || 0})
                  </button>
                </div>

                {backtestTab === 'metrics' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sharpe Ratio:</span>
                      <span className="font-medium">{backtestResults.sharpeRatio?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Win:</span>
                      <span className="font-medium text-green-600">+{(backtestResults.avgWin * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Loss:</span>
                      <span className="font-medium text-red-600">{(backtestResults.avgLoss * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Win/Lose Streak:</span>
                      <span className="font-medium">{backtestResults.longestWinStreak}/{backtestResults.longestLoseStreak}</span>
                    </div>
                    {backtestResults.finalCapital && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Final Capital:</span>
                        <span className="font-medium">${backtestResults.finalCapital.toFixed(2)}</span>
                      </div>
                    )}
                    {backtestResults.avgTradeDurationHours && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Duration:</span>
                        <span className="font-medium">{backtestResults.avgTradeDurationHours.toFixed(1)}h</span>
                      </div>
                    )}
                    {backtestResults.largestWin && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Largest Win:</span>
                        <span className="font-medium text-green-600">${backtestResults.largestWin.toFixed(2)}</span>
                      </div>
                    )}
                    {backtestResults.largestLoss && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Largest Loss:</span>
                        <span className="font-medium text-red-600">-${Math.abs(backtestResults.largestLoss).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {backtestTab === 'charts' && (
                  <div className="space-y-4">
                    {backtestResults.equity && backtestResults.equity.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Equity Curve</h4>
                        <EquityChart equity={backtestResults.equity} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Equity data not available for this backtest</p>
                    )}
                    {backtestResults.trades && backtestResults.trades.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Trade Distribution</h4>
                        <TradeDistributionChart trades={backtestResults.trades} />
                      </div>
                    )}
                  </div>
                )}

                {backtestTab === 'trades' && (
                  <div className="max-h-64 overflow-y-auto">
                    {backtestResults.trades && backtestResults.trades.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b">
                            <th className="text-left py-2">Direction</th>
                            <th className="text-left py-2">Entry</th>
                            <th className="text-left py-2">Exit</th>
                            <th className="text-right py-2">P&L</th>
                            <th className="text-left py-2">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backtestResults.trades.map((trade, i) => (
                            <tr key={i} className="border-b">
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${trade.direction === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {trade.direction.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2">{trade.entryPrice.toFixed(2)}</td>
                              <td className="py-2">{trade.exitPrice.toFixed(2)}</td>
                              <td className={`py-2 text-right font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                              </td>
                              <td className="py-2 text-xs text-muted-foreground">{trade.exitReason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No trade details available</p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <Button
                    onClick={getAIImprovements}
                    disabled={isImproving}
                    className="w-full"
                    data-testid="button-ai-improve"
                  >
                    {isImproving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing Strategy...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Get AI Improvement Suggestions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {improvementError && (
              <div className="p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-sm">
                {improvementError}
              </div>
            )}

            {improvements && (
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Improvement Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {improvements}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strategy) => (
          <Card key={strategy.id} data-testid={`strategy-${strategy.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{strategy.name}</h3>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openBacktest(strategy)} 
                    title="Backtest & Improve"
                    data-testid={`button-backtest-${strategy.id}`}
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(strategy)} data-testid={`button-edit-${strategy.id}`}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteStrategy(strategy.id)} data-testid={`button-delete-${strategy.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {strategy.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{strategy.description}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                {strategy.category && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{strategy.category}</span>}
                {strategy.market && <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">{strategy.market}</span>}
                {strategy.timeframe && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded">{strategy.timeframe}</span>}
                {strategy.riskLevel && (
                  <span className={`px-2 py-0.5 rounded ${
                    strategy.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                    strategy.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {strategy.riskLevel}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {strategies.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>No strategies yet</p>
            <p className="text-sm">Create your first trading strategy</p>
          </div>
        )}
      </div>
    </div>
  );
}
