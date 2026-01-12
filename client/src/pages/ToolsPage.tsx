import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, X, ExternalLink, Sparkles, Loader2, Download } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  url: string | null;
  tags: string[];
  createdAt: string;
}

export function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRecommender, setShowRecommender] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [recommendError, setRecommendError] = useState('');
  const [tradingStyle, setTradingStyle] = useState('Day Trading');
  const [markets, setMarkets] = useState('All');
  const [focus, setFocus] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Calculators',
    url: '',
    tags: '',
  });

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const data = await fetchApi('/api/tools');
      setTools(data);
    } catch (err) {
      console.error('Failed to load tools:', err);
    }
  };

  const saveTool = async () => {
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        category: form.category || null,
        url: form.url || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };

      if (editingId) {
        await fetchApi(`/api/tools/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/api/tools', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      loadTools();
    } catch (err) {
      console.error('Failed to save tool:', err);
    }
  };

  const deleteTool = async (id: string) => {
    try {
      await fetchApi(`/api/tools/${id}`, { method: 'DELETE' });
      loadTools();
    } catch (err) {
      console.error('Failed to delete tool:', err);
    }
  };

  const startEdit = (tool: Tool) => {
    setEditingId(tool.id);
    setForm({
      name: tool.name,
      description: tool.description || '',
      category: tool.category || 'Calculators',
      url: tool.url || '',
      tags: tool.tags.join(', '),
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      category: 'Calculators',
      url: '',
      tags: '',
    });
  };

  const getRecommendations = async () => {
    setIsRecommending(true);
    setRecommendError('');
    setRecommendations(null);

    try {
      const response = await fetch('/api/tools/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          existingTools: tools,
          tradingStyle,
          markets,
          focus,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setRecommendations(data.recommendations);
      } else {
        setRecommendError(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      setRecommendError('Failed to get recommendations. Please try again.');
    } finally {
      setIsRecommending(false);
    }
  };

  const loadPreloadedTools = async () => {
    setIsSeeding(true);
    setSeedMessage('');

    try {
      const response = await fetch('/api/tools/seed', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setSeedMessage(data.message);
        loadTools();
        setTimeout(() => setSeedMessage(''), 5000);
      } else {
        setSeedMessage(data.error || 'Failed to load tools');
      }
    } catch (err) {
      setSeedMessage('Failed to load preloaded tools');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="tools-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Tools</h1>
          <p className="text-muted-foreground">Organize your external trading resources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPreloadedTools} disabled={isSeeding} data-testid="button-load-tools">
            {isSeeding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Load Preloaded
          </Button>
          <Button variant="outline" onClick={() => setShowRecommender(!showRecommender)} data-testid="button-ai-recommend">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Recommend
          </Button>
          <Button onClick={() => setIsCreating(true)} data-testid="button-new-tool">
            <Plus className="h-4 w-4 mr-2" />
            Add Tool
          </Button>
        </div>
      </div>

      {seedMessage && (
        <div className="p-3 rounded-md bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 text-sm">
          {seedMessage}
        </div>
      )}

      {showRecommender && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Tool Recommendations
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setShowRecommender(false); setRecommendations(null); setRecommendError(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get personalized tool recommendations based on your trading style and needs.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Trading Style</label>
                <select
                  value={tradingStyle}
                  onChange={(e) => setTradingStyle(e.target.value)}
                  className="border rounded-md p-2 w-full bg-background"
                  data-testid="select-trading-style"
                >
                  <option value="Scalping">Scalping</option>
                  <option value="Day Trading">Day Trading</option>
                  <option value="Swing Trading">Swing Trading</option>
                  <option value="Position Trading">Position Trading</option>
                  <option value="ICT/Smart Money">ICT/Smart Money</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Markets</label>
                <select
                  value={markets}
                  onChange={(e) => setMarkets(e.target.value)}
                  className="border rounded-md p-2 w-full bg-background"
                  data-testid="select-markets"
                >
                  <option value="All">All Markets</option>
                  <option value="Forex">Forex</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Futures">Futures</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Focus Area</label>
                <Input
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g., Risk management, Backtesting..."
                  data-testid="input-focus"
                />
              </div>
            </div>
            <Button
              onClick={getRecommendations}
              disabled={isRecommending}
              data-testid="button-get-recommendations"
            >
              {isRecommending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Recommendations...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>

            {recommendError && (
              <div className="p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-sm">
                {recommendError}
              </div>
            )}

            {recommendations && (
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                <CardContent className="pt-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {recommendations}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {isCreating && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Edit Tool' : 'Add Tool'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Tool Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="input-name"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border rounded-md p-2"
                data-testid="select-category"
              >
                <option value="Calculators">Calculators</option>
                <option value="Screeners">Screeners</option>
                <option value="Analysis">Analysis</option>
                <option value="News">News</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input
              placeholder="URL (optional)"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              data-testid="input-url"
            />
            <Textarea
              placeholder="Description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              data-testid="input-description"
            />
            <Input
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              data-testid="input-tags"
            />
            <div className="flex gap-2">
              <Button onClick={saveTool} data-testid="button-save-tool">
                {editingId ? 'Update' : 'Add'} Tool
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card key={tool.id} data-testid={`tool-${tool.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{tool.name}</h3>
                <div className="flex gap-1">
                  {tool.url && (
                    <a href={tool.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" data-testid={`button-open-${tool.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => startEdit(tool)} data-testid={`button-edit-${tool.id}`}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteTool(tool.id)} data-testid={`button-delete-${tool.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {tool.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tool.description}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                {tool.category && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{tool.category}</span>}
                {tool.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-accent rounded">{tag}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {tools.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>No tools added yet</p>
            <p className="text-sm">Add your favorite trading resources</p>
          </div>
        )}
      </div>
    </div>
  );
}
