import { useState, useEffect, useCallback } from 'react';
import GridLayout from 'react-grid-layout';
import { fetchApi } from '@/lib/utils';

type LayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Bell, 
  BookOpen,
  BarChart3,
  Clock,
  Save,
  RotateCcw,
  Loader2
} from 'lucide-react';
import 'react-grid-layout/css/styles.css';

interface DashboardStats {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  activeAlerts: number;
  journalEntries: number;
  strategiesCount: number;
}


const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'total-pnl', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'win-rate', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'total-trades', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'active-alerts', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'recent-journal', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
  { i: 'strategies', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
];

const WIDGET_TITLES: Record<string, string> = {
  'total-pnl': 'Total P&L',
  'win-rate': 'Win Rate',
  'total-trades': 'Total Trades',
  'active-alerts': 'Active Alerts',
  'recent-journal': 'Recent Journal Entries',
  'strategies': 'Your Strategies',
};

export function DashboardPage() {
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJournal, setRecentJournal] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (Array.isArray(parsed) && parsed.every(item => 
          item && typeof item.i === 'string' && 
          typeof item.x === 'number' && 
          typeof item.y === 'number' && 
          typeof item.w === 'number' && 
          typeof item.h === 'number'
        )) {
          setLayout(parsed);
        } else {
          console.warn('Invalid layout schema, using defaults');
          localStorage.removeItem('dashboard-layout');
        }
      } catch (e) {
        console.error('Failed to parse saved layout');
        localStorage.removeItem('dashboard-layout');
      }
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('dashboard-container');
      if (container) {
        setContainerWidth(container.clientWidth - 48);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [journalData, strategiesData, alertsData] = await Promise.all([
        fetchApi('/api/journal').catch(() => []),
        fetchApi('/api/strategies').catch(() => []),
        fetchApi('/api/alerts').catch(() => []),
      ]);

      const journal = Array.isArray(journalData) ? journalData : [];
      const strats = Array.isArray(strategiesData) ? strategiesData : [];
      const alerts = Array.isArray(alertsData) ? alertsData : [];

      setRecentJournal(journal.slice(0, 5));
      setStrategies(strats.slice(0, 5));

      const trades = journal.filter((j: any) => j.type === 'trade' || j.type === 'Trade');
      const wins = trades.filter((t: any) => t.profitLoss && t.profitLoss > 0);
      const totalPnL = trades.reduce((sum: number, t: any) => sum + (t.profitLoss || 0), 0);

      setStats({
        totalTrades: trades.length,
        winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
        totalPnL: totalPnL,
        activeAlerts: alerts.filter((a: any) => a.isActive && !a.isTriggered).length,
        journalEntries: journal.length,
        strategiesCount: strats.length,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const onLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    setLayout(newLayout);
  }, []);

  const saveLayout = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('dashboard-layout', JSON.stringify(layout));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save layout:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.removeItem('dashboard-layout');
  };

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return prefix + new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'total-pnl':
        return (
          <Card className="h-full">
            <CardContent className="h-full flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-3xl font-bold ${(stats?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats ? formatCurrency(stats.totalPnL) : '$0.00'}
                </p>
              </div>
              <DollarSign className={`h-10 w-10 ${(stats?.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </CardContent>
          </Card>
        );

      case 'win-rate':
        return (
          <Card className="h-full">
            <CardContent className="h-full flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-3xl font-bold">{stats ? stats.winRate.toFixed(1) : 0}%</p>
                <p className="text-xs text-muted-foreground">{stats?.totalTrades || 0} trades</p>
              </div>
              <Target className="h-10 w-10 text-blue-500" />
            </CardContent>
          </Card>
        );

      case 'total-trades':
        return (
          <Card className="h-full">
            <CardContent className="h-full flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-3xl font-bold">{stats?.totalTrades || 0}</p>
              </div>
              <BarChart3 className="h-10 w-10 text-purple-500" />
            </CardContent>
          </Card>
        );

      case 'active-alerts':
        return (
          <Card className="h-full">
            <CardContent className="h-full flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-3xl font-bold">{stats?.activeAlerts || 0}</p>
              </div>
              <Bell className="h-10 w-10 text-yellow-500" />
            </CardContent>
          </Card>
        );

      case 'recent-journal':
        return (
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Journal Entries
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100%-60px)]">
              {recentJournal.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No entries yet</p>
              ) : (
                <div className="space-y-2">
                  {recentJournal.map((entry) => (
                    <div key={entry.id} className="p-2 bg-muted rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{entry.title}</span>
                        <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{entry.type}</span>
                      </div>
                      {entry.profitLoss && (
                        <span className={`text-xs ${entry.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(entry.profitLoss)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'strategies':
        return (
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100%-60px)]">
              {strategies.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No strategies yet</p>
              ) : (
                <div className="space-y-2">
                  {strategies.map((strategy) => (
                    <div key={strategy.id} className="p-2 bg-muted rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{strategy.name}</span>
                        <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{strategy.category}</span>
                      </div>
                      {strategy.market && (
                        <span className="text-xs text-muted-foreground">{strategy.market}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="h-full">
            <CardContent className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Widget: {widgetId}</p>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" id="dashboard-container" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your trading overview at a glance</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={resetLayout} data-testid="button-reset-layout">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={saveLayout} disabled={isSaving} data-testid="button-save-layout">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Layout
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="button-edit-layout">
              <Settings2 className="h-4 w-4 mr-2" />
              Customize
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md text-sm">
          Drag widgets to rearrange. Resize from corners. Click Save when done.
        </div>
      )}

      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={containerWidth}
        onLayoutChange={onLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {layout.map((item) => (
          <div key={item.i} data-testid={`widget-${item.i}`}>
            {renderWidget(item.i)}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
