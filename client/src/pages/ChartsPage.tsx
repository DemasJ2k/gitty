import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchApi } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { Search, RefreshCw, Brain, Loader2, X, Wifi, WifiOff } from 'lucide-react';
import { createBinanceWebSocket, RealtimeWebSocket } from '@/lib/websocket';
import { useTheme } from '@/contexts/ThemeContext';

interface SymbolResult {
  symbol: string;
  name: string;
  market: string;
  coingeckoId?: string;
  binanceSymbol?: string;
  polygonSymbol?: string;
  alphaVantageSymbol?: string;
  twelveDataSymbol?: string;
}

const BUILTIN_SYMBOLS: Record<string, SymbolResult[]> = {
  metals: [
    { symbol: 'XAUUSD', name: 'Gold / US Dollar', market: 'forex', polygonSymbol: 'C:XAUUSD' },
    { symbol: 'XAGUSD', name: 'Silver / US Dollar', market: 'forex', polygonSymbol: 'C:XAGUSD' },
    { symbol: 'XPTUSD', name: 'Platinum / US Dollar', market: 'forex', polygonSymbol: 'C:XPTUSD' },
  ],
  indices: [
    { symbol: 'SPY', name: 'S&P 500 ETF', market: 'stocks' },
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF', market: 'stocks' },
    { symbol: 'DIA', name: 'Dow Jones ETF', market: 'stocks' },
    { symbol: 'IWM', name: 'Russell 2000 ETF', market: 'stocks' },
    { symbol: 'VTI', name: 'Total Stock Market ETF', market: 'stocks' },
  ],
  commodities: [
    { symbol: 'GLD', name: 'Gold ETF', market: 'stocks' },
    { symbol: 'SLV', name: 'Silver ETF', market: 'stocks' },
    { symbol: 'USO', name: 'Oil ETF', market: 'stocks' },
    { symbol: 'UNG', name: 'Natural Gas ETF', market: 'stocks' },
  ],
};

const MARKET_REQUIREMENTS: Record<string, string> = {
  metals: 'Metals charts require a Polygon API key configured in Settings.',
  stocks: 'Stocks charts require a Polygon, Alpha Vantage, or Twelve Data API key.',
  forex: 'Forex charts require a Polygon, Alpha Vantage, or Twelve Data API key.',
  indices: 'Index ETFs work with any stock data provider.',
  commodities: 'Commodity ETFs work with any stock data provider.',
};

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function ChartsPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);
  const wsRef = useRef<RealtimeWebSocket | null>(null);
  const { resolvedTheme } = useTheme();
  const [symbol, setSymbol] = useState('AAPL');
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolResult | null>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [market, setMarket] = useState('stocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SymbolResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [candleData, setCandleData] = useState<Candle[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const loadCandles = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    setAnalysis(null);
    setAnalysisError('');
    setCandleData([]);

    try {
      let url = `/api/market/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&market=${encodeURIComponent(market)}`;
      if (selectedSymbol?.coingeckoId) {
        url += `&coingeckoId=${encodeURIComponent(selectedSymbol.coingeckoId)}`;
      }
      if (selectedSymbol?.binanceSymbol) {
        url += `&binanceSymbol=${encodeURIComponent(selectedSymbol.binanceSymbol)}`;
      }
      if (selectedSymbol?.polygonSymbol) {
        url += `&polygonSymbol=${encodeURIComponent(selectedSymbol.polygonSymbol)}`;
      }
      if (selectedSymbol?.alphaVantageSymbol) {
        url += `&alphaVantageSymbol=${encodeURIComponent(selectedSymbol.alphaVantageSymbol)}`;
      }
      if (selectedSymbol?.twelveDataSymbol) {
        url += `&twelveDataSymbol=${encodeURIComponent(selectedSymbol.twelveDataSymbol)}`;
      }
      const data = await fetchApi(url);
      
      if (chartRef.current && seriesRef.current && data.length > 0) {
        const chartData = data.map((c: Candle) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        seriesRef.current.setData(chartData);
        chartRef.current.timeScale().fitContent();
        setCandleData(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load market data';
      setError(errorMessage);
      setCandleData([]);
      console.error('Failed to load candles:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, selectedSymbol, market]);

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: 'transparent' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: '#374151' },
          horzLines: { color: '#374151' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;
      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
    }

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  const connectWebSocket = useCallback(() => {
    if (market !== 'crypto' || !selectedSymbol?.binanceSymbol) {
      return;
    }

    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    setIsConnecting(true);

    wsRef.current = createBinanceWebSocket(
      selectedSymbol.binanceSymbol,
      timeframe,
      (candle) => {
        if (seriesRef.current) {
          seriesRef.current.update({
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          });
          setCandleData((prev) => {
            const lastIndex = prev.findIndex((c) => c.time === candle.time);
            if (lastIndex >= 0) {
              const updated = [...prev];
              updated[lastIndex] = candle;
              return updated;
            } else if (prev.length > 0 && candle.time > prev[prev.length - 1].time) {
              return [...prev, candle];
            }
            return prev;
          });
        }
      },
      () => {
        setIsLive(true);
        setIsConnecting(false);
      },
      () => {
        setIsLive(false);
        setIsConnecting(false);
      }
    );

    wsRef.current.connect();
  }, [market, selectedSymbol, timeframe]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setIsLive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (market !== 'crypto') {
      disconnectWebSocket();
    }
  }, [market, disconnectWebSocket]);

  useEffect(() => {
    if (isLive) {
      disconnectWebSocket();
    }
  }, [symbol, selectedSymbol, timeframe]);

  useEffect(() => {
    if (chartRef.current) {
      const isDark = resolvedTheme === 'dark';
      chartRef.current.applyOptions({
        layout: {
          background: { color: isDark ? 'hsl(222.2 84% 4.9%)' : 'white' },
          textColor: isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)',
        },
        grid: {
          vertLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
          horzLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
        },
      });
    }
  }, [resolvedTheme]);

  const analyzeChart = async () => {
    if (candleData.length === 0) {
      setAnalysisError('No chart data available. Load a chart first.');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysis(null);
    
    try {
      const response = await fetch('/api/market/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol,
          market,
          timeframe,
          candles: candleData,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAnalysis(data.analysis);
      } else {
        setAnalysisError(data.error || 'Failed to analyze chart');
      }
    } catch (err) {
      setAnalysisError('Failed to analyze chart. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const searchSymbols = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const data = await fetchApi(`/api/market/symbols?search=${searchQuery}&market=${market}`);
      setSearchResults(data);
    } catch (err) {
      console.error('Failed to search symbols:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSymbol = (s: SymbolResult) => {
    setSymbol(s.symbol);
    setSelectedSymbol(s);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="p-6 space-y-6" data-testid="charts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Charts</h1>
          <p className="text-muted-foreground">Real-time market data visualization</p>
        </div>
        <Button 
          variant="outline" 
          onClick={analyzeChart} 
          disabled={isAnalyzing || loading || candleData.length === 0}
          data-testid="button-analyze-chart"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          AI Analysis
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <div className="flex gap-2">
            <Input
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchSymbols()}
              data-testid="input-search"
            />
            <Button onClick={searchSymbols} disabled={isSearching} data-testid="button-search">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {searchResults.length > 0 && (
            <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
              <CardContent className="p-2">
                {searchResults.map((s) => (
                  <div
                    key={s.symbol}
                    className="p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => selectSymbol(s)}
                    data-testid={`symbol-${s.symbol}`}
                  >
                    <span className="font-medium">{s.symbol}</span>
                    <span className="text-sm text-muted-foreground ml-2">{s.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <select
          value={market}
          onChange={(e) => {
            const newMarket = e.target.value;
            setMarket(newMarket);
            if (BUILTIN_SYMBOLS[newMarket]) {
              setSearchResults(BUILTIN_SYMBOLS[newMarket]);
            } else {
              setSearchResults([]);
            }
          }}
          className="border rounded-md p-2"
          data-testid="select-market"
        >
          <option value="stocks">Stocks</option>
          <option value="forex">Forex</option>
          <option value="crypto">Crypto</option>
          <option value="metals">Metals</option>
          <option value="indices">Indices (ETFs)</option>
          <option value="commodities">Commodities (ETFs)</option>
        </select>

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
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

        <Button onClick={loadCandles} disabled={loading} data-testid="button-refresh">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {market === 'crypto' && selectedSymbol?.binanceSymbol && (
          <Button 
            variant={isLive ? 'default' : 'outline'}
            onClick={isLive ? disconnectWebSocket : connectWebSocket}
            disabled={isConnecting}
            className={isLive ? 'bg-green-600 hover:bg-green-700' : ''}
            data-testid="button-live"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isLive ? (
              <Wifi className="h-4 w-4 mr-2" />
            ) : (
              <WifiOff className="h-4 w-4 mr-2" />
            )}
            {isLive ? 'Live' : 'Go Live'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {symbol}
            <span className="text-sm font-normal text-muted-foreground">({timeframe})</span>
            {isLive && (
              <span className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                <span className="h-2 w-2 bg-white rounded-full" />
                LIVE
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {MARKET_REQUIREMENTS[market] && !error && (
            <div className="text-sm text-muted-foreground mb-4 p-2 bg-muted rounded">
              {MARKET_REQUIREMENTS[market]}
            </div>
          )}
          {error && (
            <div className="text-center py-8 text-destructive">
              <p>{error}</p>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full" data-testid="chart-container" />
        </CardContent>
      </Card>

      {analysisError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-md">
          {analysisError}
        </div>
      )}

      {analysis && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Chart Analysis: {symbol} ({timeframe})
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setAnalysis(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm">{analysis}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
