import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, X, GripVertical } from 'lucide-react';

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface Playbook {
  id: string;
  name: string;
  description: string | null;
  steps: PlaybookStep[];
  tags: string[];
  createdAt: string;
}

export function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPlaybook, setViewingPlaybook] = useState<Playbook | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    tags: '',
    steps: [{ id: crypto.randomUUID(), title: '', description: '', order: 1 }],
  });

  useEffect(() => {
    loadPlaybooks();
  }, []);

  const loadPlaybooks = async () => {
    try {
      const data = await fetchApi('/api/playbooks');
      setPlaybooks(data);
    } catch (err) {
      console.error('Failed to load playbooks:', err);
    }
  };

  const savePlaybook = async () => {
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        steps: form.steps.filter(s => s.title).map((s, i) => ({ ...s, order: i + 1 })),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };

      if (editingId) {
        await fetchApi(`/api/playbooks/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/api/playbooks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      loadPlaybooks();
    } catch (err) {
      console.error('Failed to save playbook:', err);
    }
  };

  const deletePlaybook = async (id: string) => {
    try {
      await fetchApi(`/api/playbooks/${id}`, { method: 'DELETE' });
      loadPlaybooks();
    } catch (err) {
      console.error('Failed to delete playbook:', err);
    }
  };

  const startEdit = (playbook: Playbook) => {
    setEditingId(playbook.id);
    setForm({
      name: playbook.name,
      description: playbook.description || '',
      tags: playbook.tags.join(', '),
      steps: playbook.steps.length > 0 ? playbook.steps : [{ id: crypto.randomUUID(), title: '', description: '', order: 1 }],
    });
    setIsCreating(true);
    setViewingPlaybook(null);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      tags: '',
      steps: [{ id: crypto.randomUUID(), title: '', description: '', order: 1 }],
    });
  };

  const addStep = () => {
    setForm({
      ...form,
      steps: [...form.steps, { id: crypto.randomUUID(), title: '', description: '', order: form.steps.length + 1 }],
    });
  };

  const removeStep = (id: string) => {
    setForm({
      ...form,
      steps: form.steps.filter(s => s.id !== id),
    });
  };

  const updateStep = (id: string, field: 'title' | 'description', value: string) => {
    setForm({
      ...form,
      steps: form.steps.map(s => s.id === id ? { ...s, [field]: value } : s),
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="playbooks-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Playbooks</h1>
          <p className="text-muted-foreground">Step-by-step execution guides for systematic trading</p>
        </div>
        <Button onClick={() => setIsCreating(true)} data-testid="button-new-playbook">
          <Plus className="h-4 w-4 mr-2" />
          New Playbook
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Edit Playbook' : 'New Playbook'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Playbook Name"
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
              placeholder="Playbook description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              data-testid="input-description"
            />

            <div className="space-y-3">
              <label className="text-sm font-medium">Steps</label>
              {form.steps.map((step, idx) => (
                <div key={step.id} className="flex gap-2 items-start">
                  <div className="flex items-center gap-2 pt-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium w-6">{idx + 1}.</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Step title"
                      value={step.title}
                      onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                      data-testid={`input-step-title-${idx}`}
                    />
                    <Textarea
                      placeholder="Step description..."
                      value={step.description}
                      onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                      rows={2}
                      data-testid={`input-step-desc-${idx}`}
                    />
                  </div>
                  {form.steps.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addStep} data-testid="button-add-step">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={savePlaybook} data-testid="button-save-playbook">
                {editingId ? 'Update' : 'Save'} Playbook
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {viewingPlaybook && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{viewingPlaybook.name}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(viewingPlaybook)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewingPlaybook(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {viewingPlaybook.description && (
              <p className="text-muted-foreground mb-4">{viewingPlaybook.description}</p>
            )}
            <div className="space-y-4">
              {viewingPlaybook.steps.map((step, idx) => (
                <div key={step.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{step.title}</h4>
                    {step.description && <p className="text-sm text-muted-foreground mt-1">{step.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playbooks.map((playbook) => (
          <Card
            key={playbook.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setViewingPlaybook(playbook)}
            data-testid={`playbook-${playbook.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{playbook.name}</h3>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(playbook)} data-testid={`button-edit-${playbook.id}`}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deletePlaybook(playbook.id)} data-testid={`button-delete-${playbook.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {playbook.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{playbook.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{playbook.steps.length} steps</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {playbooks.length === 0 && !viewingPlaybook && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>No playbooks yet</p>
            <p className="text-sm">Create step-by-step guides for your trading</p>
          </div>
        )}
      </div>
    </div>
  );
}
