import { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Plus, Trash2, Pencil, Check, X, ImagePlus } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, streamingContent]);

  const loadConversations = async () => {
    try {
      const data = await fetchApi('/api/conversations');
      setConversations(data);
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const createNewConversation = async () => {
    try {
      const newConv = await fetchApi('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat' }),
      });
      setConversations([newConv, ...conversations]);
      setActiveConversation(newConv);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await fetchApi(`/api/conversations/${id}`, { method: 'DELETE' });
      const updated = conversations.filter(c => c.id !== id);
      setConversations(updated);
      if (activeConversation?.id === id) {
        setActiveConversation(updated[0] || null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveRename = async (id: string) => {
    if (!editTitle.trim()) {
      cancelRename();
      return;
    }
    try {
      await fetchApi(`/api/conversations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      setConversations(convs => convs.map(c => 
        c.id === id ? { ...c, title: editTitle.trim() } : c
      ));
      if (activeConversation?.id === id) {
        setActiveConversation({ ...activeConversation, title: editTitle.trim() });
      }
      cancelRename();
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isStreaming) return;

    const message = input.trim();
    const imageData = imagePreview;
    const hasImage = !!selectedImage;
    
    setInput('');
    clearImage();
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    const userContent = hasImage 
      ? `${message}\n[Image attached for analysis]`
      : message;

    const tempMessages = [
      ...(activeConversation?.messages || []),
      { role: 'user' as const, content: userContent },
    ];

    if (activeConversation) {
      setActiveConversation({
        ...activeConversation,
        messages: tempMessages,
      });
    }

    try {
      const requestBody: { message: string; conversationId?: string; image?: string } = {
        message: message || 'Please analyze this image',
        conversationId: activeConversation?.id,
      };
      
      if (hasImage && imageData) {
        requestBody.image = imageData;
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || 'Failed to send message');
        if (activeConversation) {
          setActiveConversation({
            ...activeConversation,
            messages: activeConversation.messages,
          });
        }
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
                if (data.done && data.conversationId) {
                  const conv = await fetchApi(`/api/conversations/${data.conversationId}`);
                  setActiveConversation(conv);
                  loadConversations();
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to connect to the AI service. Please try again.');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const messages = activeConversation?.messages || [];
  const displayMessages = isStreaming
    ? [...messages, { role: 'assistant' as const, content: streamingContent }]
    : messages;

  return (
    <div className="flex h-full" data-testid="chat-page">
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <Button onClick={createNewConversation} className="w-full mb-4" data-testid="button-new-chat">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <div className="flex-1 overflow-auto space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-1 p-2 rounded-md cursor-pointer transition-colors ${
                activeConversation?.id === conv.id ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onClick={() => editingId !== conv.id && setActiveConversation(conv)}
              data-testid={`conversation-${conv.id}`}
            >
              {editingId === conv.id ? (
                <>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(conv.id);
                      if (e.key === 'Escape') cancelRename();
                    }}
                    className="h-6 text-sm flex-1"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`input-rename-${conv.id}`}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); saveRename(conv.id); }}
                    className="p-1 hover:bg-accent rounded"
                    data-testid={`button-save-rename-${conv.id}`}
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); cancelRename(); }}
                    className="p-1 hover:bg-accent rounded"
                    data-testid={`button-cancel-rename-${conv.id}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); startRename(conv); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded"
                    data-testid={`button-rename-${conv.id}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded"
                    data-testid={`button-delete-${conv.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {displayMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Start a conversation with your AI trading assistant</p>
            </div>
          ) : (
            displayMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[70%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                  <CardContent className="p-3">
                    <p className="whitespace-pre-wrap text-sm" data-testid={`message-${idx}`}>{msg.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          {error && (
            <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive" data-testid="chat-error">
              {error}
              {error.includes('API key') && (
                <a href="/settings" className="ml-2 underline">Go to Settings</a>
              )}
            </div>
          )}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img 
                src={imagePreview} 
                alt="Selected" 
                className="max-h-32 rounded-md border"
                data-testid="image-preview"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                data-testid="button-clear-image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
              data-testid="input-file"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="h-[60px] w-[60px]"
              title="Upload image for analysis"
              data-testid="button-upload-image"
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about trading, analysis, or strategies..."
              className="min-h-[60px] resize-none"
              disabled={isStreaming}
              data-testid="input-message"
            />
            <Button
              onClick={sendMessage}
              disabled={(!input.trim() && !selectedImage) || isStreaming}
              size="icon"
              className="h-[60px] w-[60px]"
              data-testid="button-send"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
