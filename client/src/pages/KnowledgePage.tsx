import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Search, Upload, FileText, BookOpen, Trash2, Eye, Sparkles, X, File, Image, Loader2, Library } from 'lucide-react';

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  fileType?: string;
  tags: string[];
  isPreloaded: boolean;
  createdAt: string;
}

export function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<KnowledgeDocument | null>(null);
  const [error, setError] = useState('');
  const [seedMessage, setSeedMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'General',
    tags: '',
  });

  const categories = [
    'General',
    'ICT Concepts',
    'Scalping',
    'Swing Trading',
    'Day Trading',
    'Technical Analysis',
    'Fundamental Analysis',
    'Risk Management',
    'Psychology',
    'Trading Fundamentals',
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/knowledge', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchKnowledge = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setError('');

    try {
      const response = await fetch(`/api/knowledge/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' : 
                     file.type === 'application/pdf' ? 'pdf' : 'text';

    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setUploadedFile({
          name: file.name,
          content: imageData,
          type: 'image',
        });
        setForm(prev => ({ 
          ...prev, 
          title: file.name.replace(/\.[^/.]+$/, ''),
          content: '[Image - Use AI Analyze to extract content]'
        }));
      };
      reader.readAsDataURL(file);
    } else if (fileType === 'text' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setUploadedFile({
          name: file.name,
          content: content,
          type: 'text',
        });
        setForm(prev => ({ 
          ...prev, 
          title: file.name.replace(/\.[^/.]+$/, ''),
          content: content 
        }));
      };
      reader.readAsText(file);
    } else if (fileType === 'pdf') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        setUploadedFile({
          name: file.name,
          content: base64Data,
          type: 'pdf',
        });
        setForm(prev => ({ 
          ...prev, 
          title: file.name.replace(/\.[^/.]+$/, ''),
          content: '[PDF - Processing...]'
        }));
        
        try {
          const response = await fetch('/api/knowledge/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ pdf: base64Data }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setForm(prev => ({ 
              ...prev, 
              content: data.text || '[Could not extract text from PDF]'
            }));
            setUploadedFile(prev => prev ? { ...prev, content: data.text || '' } : null);
          } else {
            setError('Could not extract text from PDF. You may need to paste the content manually.');
            setForm(prev => ({ ...prev, content: '' }));
          }
        } catch (err) {
          setError('Could not extract text from PDF. You may need to paste the content manually.');
          setForm(prev => ({ ...prev, content: '' }));
        }
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeContent = async () => {
    const contentToAnalyze = uploadedFile?.type === 'image' 
      ? uploadedFile.content 
      : (form.content || uploadedFile?.content);
    
    if (!contentToAnalyze) {
      setError('Please add some content to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/knowledge/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: uploadedFile?.type === 'image' ? '' : contentToAnalyze,
          image: uploadedFile?.type === 'image' ? uploadedFile.content : undefined,
          fileType: uploadedFile?.type,
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setForm(prev => ({
          ...prev,
          title: analysis.title || prev.title,
          summary: analysis.summary || '',
          category: analysis.category || prev.category,
          tags: (analysis.tags || []).join(', '),
          content: analysis.extractedContent || prev.content,
        }));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to analyze content');
      }
    } catch (err) {
      setError('Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addToKnowledge = async () => {
    if (!form.title || !form.content) {
      setError('Title and content are required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          summary: form.summary || undefined,
          category: form.category,
          fileType: uploadedFile?.type || 'text',
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      });

      if (response.ok) {
        const doc = await response.json();
        setDocuments(prev => [doc, ...prev]);
        setIsAdding(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save document');
      }
    } catch (err) {
      setError('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        setSearchResults(prev => prev.filter(d => d.id !== id));
        if (viewingDoc?.id === id) setViewingDoc(null);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const loadPrebuiltKnowledge = async () => {
    setIsSeeding(true);
    setSeedMessage('');
    try {
      const response = await fetch('/api/knowledge/seed', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSeedMessage(data.message);
        await fetchDocuments();
        setTimeout(() => setSeedMessage(''), 5000);
      } else {
        const errorData = await response.json();
        setSeedMessage(errorData.error || 'Failed to load knowledge');
      }
    } catch (err) {
      setSeedMessage('Failed to load trading knowledge');
    } finally {
      setIsSeeding(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', content: '', summary: '', category: 'General', tags: '' });
    setUploadedFile(null);
    setError('');
  };

  const displayDocs = searchQuery && searchResults.length > 0 ? searchResults : documents;

  return (
    <div className="p-6 space-y-6" data-testid="knowledge-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Store and search your trading knowledge</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={loadPrebuiltKnowledge} 
            disabled={isSeeding}
            data-testid="button-load-prebuilt"
          >
            {isSeeding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Library className="h-4 w-4 mr-2" />
            )}
            Load Trading Knowledge
          </Button>
          <Button onClick={() => { setIsAdding(true); resetForm(); }} data-testid="button-add-knowledge">
            <Upload className="h-4 w-4 mr-2" />
            Add Knowledge
          </Button>
        </div>
      </div>
      
      {seedMessage && (
        <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 rounded-md">
          {seedMessage}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Search your knowledge base..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchKnowledge()}
          className="flex-1"
          data-testid="input-search"
        />
        <Button onClick={searchKnowledge} disabled={isSearching} data-testid="button-search">
          {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          Search
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add to Knowledge Base</span>
              <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); resetForm(); }}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
            )}
            
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.md,.pdf,image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
                data-testid="button-upload-file"
              >
                <File className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant="outline"
                onClick={analyzeContent}
                disabled={isAnalyzing || (!form.content && !uploadedFile)}
                className="flex-1"
                data-testid="button-analyze"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                AI Analyze
              </Button>
            </div>

            {uploadedFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                {uploadedFile.type === 'image' ? (
                  <Image className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span className="text-sm flex-1">{uploadedFile.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              data-testid="input-title"
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-md p-2 bg-background"
              data-testid="select-category"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <Textarea
              placeholder="Content..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              data-testid="input-content"
            />

            <Textarea
              placeholder="Summary (optional - AI can generate this)"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={2}
              data-testid="input-summary"
            />

            <Input
              placeholder="Tags (comma-separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              data-testid="input-tags"
            />

            <div className="flex gap-2">
              <Button onClick={addToKnowledge} disabled={isSaving} data-testid="button-save">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save to Knowledge Base
              </Button>
              <Button variant="outline" onClick={() => { setIsAdding(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {viewingDoc && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{viewingDoc.title}</span>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {viewingDoc.category && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {viewingDoc.category}
              </span>
            )}
            {viewingDoc.summary && (
              <p className="text-sm text-muted-foreground italic">{viewingDoc.summary}</p>
            )}
            <div className="whitespace-pre-wrap text-sm">{viewingDoc.content}</div>
            {viewingDoc.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {viewingDoc.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {searchQuery && searchResults.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Found {searchResults.length} results for "{searchQuery}"
          </p>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : displayDocs.length > 0 ? (
          displayDocs.map((doc) => (
            <Card key={doc.id} data-testid={`doc-${doc.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{doc.title}</h3>
                      {doc.category && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          {doc.category}
                        </span>
                      )}
                      {doc.isPreloaded && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                          Preloaded
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {doc.summary || doc.content.substring(0, 200)}...
                    </p>
                    {doc.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {doc.tags.slice(0, 5).map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setViewingDoc(doc)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!doc.isPreloaded && (
                      <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : !isAdding && !viewingDoc ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your knowledge base is empty</p>
            <p className="text-sm text-muted-foreground">
              Add trading concepts, strategies, and notes to build your personal knowledge base
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
