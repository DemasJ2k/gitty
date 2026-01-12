import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, X, TrendingUp, TrendingDown, Brain, Loader2 } from 'lucide-react';

interface JournalEntry {
  id: string;
  type: string;
  title: string;
  content: string | null;
  tradeDate: string | null;
  market: string | null;
  symbol: string | null;
  direction: string | null;
  entryPrice: number | null;
  exitPrice: number | null;
  profitLoss: number | null;
  emotions: { preTradeConfidence?: number; postTradeEmotions?: string[] } | null;
  tags: string[];
  createdAt: string;
}

export function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [form, setForm] = useState({
    type: 'Trade',
    title: '',
    content: '',
    market: 'Forex',
    symbol: '',
    direction: 'Long',
    entryPrice: '',
    exitPrice: '',
    profitLoss: '',
    preTradeConfidence: 5,
    tags: '',
  });

  useEffect(() => {
    loadEntries();
  }, [filterType]);

  const loadEntries = async () => {
    try {
      const url = filterType ? `/api/journal?type=${filterType}` : '/api/journal';
      const data = await fetchApi(url);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const saveEntry = async () => {
    try {
      const payload = {
        type: form.type,
        title: form.title,
        content: form.content || null,
        market: form.market || null,
        symbol: form.symbol || null,
        direction: form.direction || null,
        entryPrice: form.entryPrice ? parseFloat(form.entryPrice) : null,
        exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
        profitLoss: form.profitLoss ? parseFloat(form.profitLoss) : null,
        emotions: { preTradeConfidence: form.preTradeConfidence },
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };

      if (editingId) {
        await fetchApi(`/api/journal/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/api/journal', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      loadEntries();
    } catch (err) {
      console.error('Failed to save entry:', err);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await fetchApi(`/api/journal/${id}`, { method: 'DELETE' });
      loadEntries();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setForm({
      type: entry.type,
      title: entry.title,
      content: entry.content || '',
      market: entry.market || 'Forex',
      symbol: entry.symbol || '',
      direction: entry.direction || 'Long',
      entryPrice: entry.entryPrice?.toString() || '',
      exitPrice: entry.exitPrice?.toString() || '',
      profitLoss: entry.profitLoss?.toString() || '',
      preTradeConfidence: entry.emotions?.preTradeConfidence || 5,
      tags: entry.tags.join(', '),
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm({
      type: 'Trade',
      title: '',
      content: '',
      market: 'Forex',
      symbol: '',
      direction: 'Long',
      entryPrice: '',
      exitPrice: '',
      profitLoss: '',
      preTradeConfidence: 5,
      tags: '',
    });
  };

  const analyzeJournal = async () => {
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysis(null);
    
    try {
      const response = await fetch('/api/journal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAnalysis(data.analysis);
      } else {
        setAnalysisError(data.error || 'Failed to analyze journal');
      }
    } catch (err) {
      setAnalysisError('Failed to analyze journal. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="journal-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Journal</h1>
          <p className="text-muted-foreground">Track your trades and analyze your performance</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={analyzeJournal} 
            disabled={isAnalyzing || entries.length === 0}
            data-testid="button-analyze"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            AI Analysis
          </Button>
          <Button onClick={() => setIsCreating(true)} data-testid="button-new-entry">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {['', 'Trade', 'Analysis', 'Note'].map((type) => (
          <Button
            key={type}
            variant={filterType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType(type)}
            data-testid={`filter-${type || 'all'}`}
          >
            {type || 'All'}
          </Button>
        ))}
      </div>

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
              AI Journal Analysis
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

      {isCreating && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Edit Entry' : 'New Journal Entry'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="border rounded-md p-2"
                data-testid="select-type"
              >
                <option value="Trade">Trade</option>
                <option value="Analysis">Analysis</option>
                <option value="Note">Note</option>
              </select>
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-testid="input-title"
              />
              <Input
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                data-testid="input-tags"
              />
            </div>

            {form.type === 'Trade' && (
              <div className="grid grid-cols-4 gap-4">
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
                <Input
                  placeholder="Symbol (e.g., EUR/USD)"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  data-testid="input-symbol"
                />
                <select
                  value={form.direction}
                  onChange={(e) => setForm({ ...form, direction: e.target.value })}
                  className="border rounded-md p-2"
                  data-testid="select-direction"
                >
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
                <Input
                  placeholder="P/L"
                  type="number"
                  value={form.profitLoss}
                  onChange={(e) => setForm({ ...form, profitLoss: e.target.value })}
                  data-testid="input-pnl"
                />
              </div>
            )}

            <Textarea
              placeholder="Notes, analysis, or thoughts..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={4}
              data-testid="input-content"
            />

            <div className="flex gap-2">
              <Button onClick={saveEntry} data-testid="button-save-entry">
                {editingId ? 'Update' : 'Save'} Entry
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id} data-testid={`entry-${entry.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      entry.type === 'Trade' ? 'bg-blue-100 text-blue-800' :
                      entry.type === 'Analysis' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.type}
                    </span>
                    {entry.direction && (
                      <span className={`flex items-center gap-1 text-xs ${
                        entry.direction === 'Long' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.direction === 'Long' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {entry.direction}
                      </span>
                    )}
                    {entry.symbol && <span className="text-xs text-muted-foreground">{entry.symbol}</span>}
                  </div>
                  <h3 className="font-semibold">{entry.title}</h3>
                  {entry.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>}
                  {entry.profitLoss !== null && (
                    <p className={`text-sm font-medium mt-2 ${entry.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      P/L: {entry.profitLoss >= 0 ? '+' : ''}{entry.profitLoss}
                    </p>
                  )}
                  {entry.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {entry.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-accent rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} data-testid={`button-edit-${entry.id}`}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} data-testid={`button-delete-${entry.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No journal entries yet</p>
            <p className="text-sm">Start tracking your trades and analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
