import express from 'express';
import { storage } from './storage.js';
import { hashPassword, verifyPassword, createSession, getSession, deleteSession, requireAuth } from './auth.js';
import { encrypt, decrypt, maskApiKey } from './encryption.js';
import { getCandles, searchSymbols, getAvailableProviders } from './marketData.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { 
  insertJournalEntrySchema,
  insertStrategySchema,
  insertToolSchema,
  insertPlaybookSchema,
  insertUserSettingsSchema,
} from '../shared/schema.ts';
import { seedKnowledgeBase, preloadedKnowledge } from './knowledgeSeed.js';
import { seedStrategies, preloadedStrategies } from './strategySeed.js';
import { seedTools, preloadedTools } from './toolSeed.js';
import { BacktestEngine, strategyTemplates, parseRulesToConfig } from './backtesting.js';
import { searchMemory, searchKnowledge, indexDocument, indexConversation, indexJournalEntry, getEmbeddingStats } from './vectorService.js';
import { sendDiscordAlert, sendTelegramAlert, sendAlert, fetchNews, validateTradingViewWebhook } from './notifications.js';

const router = express.Router();

// Helper to create AI clients using user's API keys
function createAnthropicClient(apiKey) {
  return new Anthropic({
    apiKey: apiKey,
  });
}

function createOpenAIClient(apiKey) {
  return new OpenAI({
    apiKey: apiKey,
  });
}


// Validation schemas
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const chatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().uuid().optional(),
  image: z.string().optional(),
});

const conversationSchema = z.object({
  title: z.string().optional(),
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== Auth Routes ====================

router.post('/auth/signup', async (req, res) => {
  try {
    const result = authSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const { email, password, name } = result.data;
    
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      name: name || null,
    });
    
    await storage.upsertUserSettings({ userId: user.id });
    
    const token = createSession(user.id);
    
    res.cookie('session', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const result = authSchema.pick({ email: true, password: true }).safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const { email, password } = result.data;
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = createSession(user.id);
    
    res.cookie('session', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/auth/logout', (req, res) => {
  const token = req.cookies.session;
  if (token) {
    deleteSession(token);
    res.clearCookie('session');
  }
  res.json({ success: true });
});

router.get('/auth/me', requireAuth, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

router.post('/auth/change-password', requireAuth, async (req, res) => {
  try {
    const passwordChangeSchema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    });
    
    const result = passwordChangeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const { currentPassword, newPassword } = result.data;
    
    const isValid = await verifyPassword(currentPassword, req.user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(req.user.id, hashedPassword);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ==================== User Settings Routes ====================

const API_KEY_FIELDS = [
  'openaiApiKey', 
  'anthropicApiKey', 
  'polygonApiKey', 
  'alphaVantageApiKey', 
  'coinGeckoApiKey', 
  'twelveDataApiKey',
  'coinbaseApiKey',
  'coinbaseApiSecret',
  'discordWebhookUrl',
  'telegramBotToken',
  'telegramChatId',
  'newsApiKey',
  'tradingViewWebhookSecret'
];

function prepareSettingsForClient(settings) {
  if (!settings) return settings;
  const result = { ...settings };
  for (const field of API_KEY_FIELDS) {
    const hasKey = !!result[field];
    let isValid = false;
    if (hasKey) {
      const decrypted = decrypt(result[field]);
      isValid = !!decrypted;
    }
    delete result[field];
    result[`${field}Set`] = isValid;
  }
  return result;
}

function processApiKeysForStorage(data) {
  const processed = { ...data };
  for (const field of API_KEY_FIELDS) {
    if (field in processed) {
      const value = processed[field];
      if (value === '' || value === null) {
        processed[field] = null;
      } else if (typeof value === 'string' && value.length > 0) {
        processed[field] = encrypt(value);
      } else {
        delete processed[field];
      }
    }
  }
  return processed;
}

router.get('/settings', requireAuth, async (req, res) => {
  try {
    let settings = await storage.getUserSettings(req.user.id);
    if (!settings) {
      settings = await storage.upsertUserSettings({ userId: req.user.id });
    }
    res.json(prepareSettingsForClient(settings));
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/settings', requireAuth, async (req, res) => {
  try {
    const settingsSchema = insertUserSettingsSchema.partial().omit({ userId: true });
    const result = settingsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const processedData = processApiKeysForStorage(result.data);
    
    const settings = await storage.upsertUserSettings({
      userId: req.user.id,
      ...processedData,
    });
    res.json(prepareSettingsForClient(settings));
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ==================== Conversation Routes ====================

router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const conversations = await storage.getUserConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const result = conversationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const conversation = await storage.createConversation({
      userId: req.user.id,
      title: result.data.title || 'New Chat',
      messages: [],
    });
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const conversation = await storage.getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

router.put('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const conversation = await storage.getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const result = conversationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const updated = await storage.updateConversation(req.params.id, result.data);
    res.json(updated);
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

router.delete('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const conversation = await storage.getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await storage.deleteConversation(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ==================== Chat Routes (Dual Provider Support) ====================

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const result = chatSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const { message, conversationId, image } = result.data;
    
    const settings = await storage.getUserSettings(req.user.id);
    const provider = settings?.preferredProvider || 'anthropic';
    
    let apiKey = null;
    try {
      if (provider === 'openai') {
        if (settings?.openaiApiKey) {
          apiKey = decrypt(settings.openaiApiKey);
        }
        if (!apiKey) {
          return res.status(400).json({ 
            error: 'OpenAI API key not configured',
            message: 'Please add your OpenAI API key in Settings to use this provider.'
          });
        }
      } else {
        if (settings?.anthropicApiKey) {
          apiKey = decrypt(settings.anthropicApiKey);
        }
        if (!apiKey) {
          return res.status(400).json({ 
            error: 'Anthropic API key not configured',
            message: 'Please add your Anthropic API key in Settings to use this provider.'
          });
        }
      }
    } catch (decryptError) {
      console.error('API key decryption failed:', decryptError.message);
      return res.status(400).json({
        error: 'API key configuration error',
        message: 'Your API key could not be decrypted. Please re-enter it in Settings.'
      });
    }
    
    let conversation;
    if (conversationId) {
      conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== req.user.id) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      conversation = await storage.createConversation({
        userId: req.user.id,
        title: message.substring(0, 50),
        messages: [],
      });
    }
    
    const userMessageForStorage = image ? `${message}\n[Image attached for analysis]` : message;
    const messages = [...(conversation.messages || []), { role: 'user', content: userMessageForStorage }];
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let fullResponse = '';
    
    if (provider === 'openai') {
      const openai = createOpenAIClient(apiKey);
      const model = settings?.openaiModel || 'gpt-4o';
      
      const apiMessages = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      
      if (image) {
        const imageContent = [
          { type: 'text', text: message },
          { type: 'image_url', image_url: { url: image } }
        ];
        apiMessages.push({ role: 'user', content: imageContent });
      } else {
        apiMessages.push({ role: 'user', content: message });
      }
      
      const stream = await openai.chat.completions.create({
        model: model,
        messages: apiMessages,
        stream: true,
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content, conversationId: conversation.id })}\n\n`);
        }
      }
    } else {
      const anthropic = createAnthropicClient(apiKey);
      const model = settings?.anthropicModel || 'claude-sonnet-4-5';
      
      const apiMessages = messages.slice(0, -1).map(m => ({
        role: m.role,
        content: [{ type: 'text', text: m.content }]
      }));
      
      if (image) {
        const base64Data = image.replace(/^data:image\/[a-z+]+;base64,/, '');
        const mediaTypeMatch = image.match(/^data:(image\/[a-z+]+);base64,/);
        const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : 'image/jpeg';
        
        apiMessages.push({
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
            { type: 'text', text: message }
          ]
        });
      } else {
        apiMessages.push({ role: 'user', content: [{ type: 'text', text: message }] });
      }
      
      const stream = anthropic.messages.stream({
        model: model,
        max_tokens: 8192,
        messages: apiMessages,
      });
      
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const content = event.delta.text;
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content, conversationId: conversation.id })}\n\n`);
          }
        }
      }
    }
    
    const updatedMessages = [...messages, { role: 'assistant', content: fullResponse }];
    await storage.updateConversation(conversation.id, { messages: updatedMessages });
    
    res.write(`data: ${JSON.stringify({ done: true, conversationId: conversation.id })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to send message' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
});

// ==================== Journal Entry Routes ====================

router.get('/journal', requireAuth, async (req, res) => {
  try {
    const { type, tags } = req.query;
    const entries = await storage.getUserJournalEntries(req.user.id, {
      type: type || undefined,
      tags: tags ? tags.split(',') : undefined,
    });
    res.json(entries);
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ error: 'Failed to get journal entries' });
  }
});

router.post('/journal', requireAuth, async (req, res) => {
  try {
    const schema = insertJournalEntrySchema.omit({ userId: true });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const entry = await storage.createJournalEntry({
      userId: req.user.id,
      ...result.data,
    });
    res.status(201).json(entry);
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

router.get('/journal/:id', requireAuth, async (req, res) => {
  try {
    const entry = await storage.getJournalEntry(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(entry);
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ error: 'Failed to get journal entry' });
  }
});

router.put('/journal/:id', requireAuth, async (req, res) => {
  try {
    const entry = await storage.getJournalEntry(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const schema = insertJournalEntrySchema.partial().omit({ userId: true });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const updated = await storage.updateJournalEntry(req.params.id, result.data);
    res.json(updated);
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

router.delete('/journal/:id', requireAuth, async (req, res) => {
  try {
    const entry = await storage.getJournalEntry(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await storage.deleteJournalEntry(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

router.post('/journal/analyze', requireAuth, async (req, res) => {
  try {
    const entries = await storage.getUserJournalEntries(req.user.id, {});
    
    if (!entries || entries.length === 0) {
      return res.status(400).json({ error: 'No journal entries to analyze. Add some trades first!' });
    }

    const settings = await storage.getUserSettings(req.user.id);
    const provider = settings?.preferredProvider || 'anthropic';
    
    let apiKey;
    if (provider === 'openai') {
      apiKey = settings?.openaiApiKey ? decrypt(settings.openaiApiKey) : null;
    } else {
      apiKey = settings?.anthropicApiKey ? decrypt(settings.anthropicApiKey) : null;
    }
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: `Please configure your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key in Settings` 
      });
    }

    const entrySummaries = entries.slice(0, 50).map(e => {
      return `- ${e.type}: "${e.title}" (${e.market || 'Unknown market'}, ${e.symbol || 'Unknown symbol'})
        Direction: ${e.direction || 'N/A'}, P/L: ${e.profitLoss !== null ? e.profitLoss : 'N/A'}
        Confidence: ${e.emotions?.preTradeConfidence || 'N/A'}/10
        Notes: ${e.content?.substring(0, 100) || 'None'}`;
    }).join('\n');

    const prompt = `Analyze this trading journal and provide insights about the trader's performance, patterns, and areas for improvement.

Journal Entries (${entries.length} total):
${entrySummaries}

Please provide a structured analysis with:
1. **Strengths**: What is the trader doing well?
2. **Weaknesses**: What areas need improvement?
3. **Patterns**: Any behavioral or trading patterns you notice?
4. **Emotional Insights**: Analysis of confidence levels and emotional patterns
5. **Recommendations**: 3-5 specific actionable suggestions for improvement

Be specific and reference actual entries when possible. Keep your response concise but insightful.`;

    let analysisText;
    
    if (provider === 'openai') {
      const openai = createOpenAIClient(apiKey);
      const response = await openai.chat.completions.create({
        model: settings?.aiModel || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
      });
      analysisText = response.choices[0]?.message?.content || 'No analysis generated';
    } else {
      const anthropic = createAnthropicClient(apiKey);
      const response = await anthropic.messages.create({
        model: settings?.aiModel || 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      });
      analysisText = response.content[0]?.text || 'No analysis generated';
    }

    res.json({ 
      analysis: analysisText,
      entriesAnalyzed: Math.min(entries.length, 50),
      totalEntries: entries.length,
    });
  } catch (error) {
    console.error('Journal analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze journal. Please try again.' });
  }
});

router.post('/journal/from-conversation', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      conversationId: z.string().uuid(),
      type: z.enum(['trade', 'analysis', 'note', 'idea']).default('analysis'),
      title: z.string().optional(),
      tags: z.array(z.string()).optional(),
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const conversation = await storage.getConversation(result.data.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const content = conversation.messages
      .map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`)
      .join('\n\n');
    
    const baseTags = result.data.tags || [];
    const tags = baseTags.includes('from-chat') ? baseTags : [...baseTags, 'from-chat'];
    
    const entry = await storage.createJournalEntry({
      userId: req.user.id,
      type: result.data.type,
      title: result.data.title || conversation.title || 'From Chat',
      content: content,
      tags: tags,
      tradeDate: new Date().toISOString(),
    });
    
    res.status(201).json(entry);
  } catch (error) {
    console.error('Create journal from conversation error:', error);
    res.status(500).json({ error: 'Failed to create journal entry from conversation' });
  }
});

// ==================== Strategy Routes ====================

router.get('/strategies', requireAuth, async (req, res) => {
  try {
    const { market, category } = req.query;
    const strategies = await storage.getUserStrategies(req.user.id, {
      market: market || undefined,
      category: category || undefined,
    });
    res.json(strategies);
  } catch (error) {
    console.error('Get strategies error:', error);
    res.status(500).json({ error: 'Failed to get strategies' });
  }
});

router.post('/strategies', requireAuth, async (req, res) => {
  try {
    const schema = insertStrategySchema.omit({ userId: true });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const strategy = await storage.createStrategy({
      userId: req.user.id,
      ...result.data,
    });
    res.status(201).json(strategy);
  } catch (error) {
    console.error('Create strategy error:', error);
    res.status(500).json({ error: 'Failed to create strategy' });
  }
});

router.get('/strategies/:id', requireAuth, async (req, res) => {
  try {
    const strategy = await storage.getStrategy(req.params.id);
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    if (strategy.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(strategy);
  } catch (error) {
    console.error('Get strategy error:', error);
    res.status(500).json({ error: 'Failed to get strategy' });
  }
});

router.put('/strategies/:id', requireAuth, async (req, res) => {
  try {
    const strategy = await storage.getStrategy(req.params.id);
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    if (strategy.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const schema = insertStrategySchema.partial().omit({ userId: true });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const updated = await storage.updateStrategy(req.params.id, result.data);
    res.json(updated);
  } catch (error) {
    console.error('Update strategy error:', error);
    res.status(500).json({ error: 'Failed to update strategy' });
  }
});

router.delete('/strategies/:id', requireAuth, async (req, res) => {
  try {
    const strategy = await storage.getStrategy(req.params.id);
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    if (strategy.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await storage.deleteStrategy(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete strategy error:', error);
    res.status(500).json({ error: 'Failed to delete strategy' });
  }
});

router.post('/strategies/generate', requireAuth, async (req, res) => {
  const { prompt, market, category } = req.body;

  if (!prompt || prompt.length < 10) {
    return res.status(400).json({ error: 'Please describe your trading idea in more detail (at least 10 characters)' });
  }

  try {
    const settings = await storage.getUserSettings(req.user.id);
    const provider = settings?.preferredProvider || 'anthropic';
    
    let apiKey;
    if (provider === 'openai') {
      apiKey = settings?.openaiApiKey ? decrypt(settings.openaiApiKey) : null;
    } else {
      apiKey = settings?.anthropicApiKey ? decrypt(settings.anthropicApiKey) : null;
    }

    if (!apiKey) {
      return res.status(400).json({ 
        error: `No ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key configured. Please add your API key in Settings.` 
      });
    }

    const systemPrompt = `You are a professional trading strategy developer. Generate a complete trading strategy based on the user's description.

Return a JSON object with this structure:
{
  "name": "Strategy Name",
  "description": "Brief description of the strategy",
  "category": "One of: Trend Following, Mean Reversion, Breakout, Momentum, Scalping, Swing, Position",
  "market": "One of: Forex, Crypto, Stocks, Metals, Indices, Commodities, All",
  "timeframe": "Primary timeframe (e.g., 1h, 4h, 1d)",
  "entryRules": ["Rule 1", "Rule 2", "Rule 3"],
  "exitRules": ["Rule 1", "Rule 2"],
  "riskManagement": {
    "stopLoss": "Description of stop loss placement",
    "takeProfit": "Description of take profit targets",
    "positionSize": "Position sizing rule (e.g., 1-2% risk per trade)"
  },
  "indicators": ["Indicator 1", "Indicator 2"],
  "notes": "Additional notes or tips for this strategy"
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

    const userMessage = `Create a trading strategy based on this idea: ${prompt}
${market ? `Target market: ${market}` : ''}
${category ? `Strategy category: ${category}` : ''}`;

    let responseText;

    if (provider === 'openai') {
      const openai = createOpenAIClient(apiKey);
      const response = await openai.chat.completions.create({
        model: settings?.openaiModel || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
      });
      responseText = response.choices[0].message.content;
    } else {
      const anthropic = createAnthropicClient(apiKey);
      const response = await anthropic.messages.create({
        model: settings?.anthropicModel || 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });
      responseText = response.content[0].text;
    }

    let strategy;
    try {
      strategy = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        strategy = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    const entryRules = Array.isArray(strategy.entryRules) ? strategy.entryRules : [];
    const exitRules = Array.isArray(strategy.exitRules) ? strategy.exitRules : [];
    const riskMgmt = strategy.riskManagement || {};
    
    const riskRules = [
      `Stop Loss: ${riskMgmt.stopLoss || 'Based on ATR or structure'}`,
      `Take Profit: ${riskMgmt.takeProfit || '2:1 risk reward ratio'}`,
      `Position Size: ${riskMgmt.positionSize || '1-2% risk per trade'}`,
    ];

    if (strategy.indicators?.length) {
      riskRules.push(`Indicators: ${strategy.indicators.join(', ')}`);
    }
    if (strategy.notes) {
      riskRules.push(`Notes: ${strategy.notes}`);
    }

    res.json({
      name: strategy.name || 'AI Generated Strategy',
      description: strategy.description || prompt,
      category: strategy.category || category || 'Trend Following',
      market: strategy.market || market || 'All',
      timeframe: strategy.timeframe || '1h',
      entryRules: entryRules,
      exitRules: exitRules,
      riskRules: riskRules,
    });
  } catch (error) {
    console.error('Strategy generation error:', error);
    res.status(500).json({ error: 'Failed to generate strategy. Please try again.' });
  }
});

router.get('/strategies/preloaded', requireAuth, async (req, res) => {
  res.json({ 
    available: preloadedStrategies.length,
    categories: [...new Set(preloadedStrategies.map(s => s.category))],
    markets: [...new Set(preloadedStrategies.map(s => s.market))]
  });
});

router.post('/strategies/seed', requireAuth, async (req, res) => {
  try {
    const result = await seedStrategies(storage, req.user.id);
    res.json({ 
      success: true, 
      added: result.added,
      skipped: result.skipped,
      message: result.added > 0 
        ? `Added ${result.added} trading strategies` 
        : 'All preloaded strategies already exist'
    });
  } catch (error) {
    console.error('Error seeding strategies:', error);
    res.status(500).json({ error: 'Failed to seed strategies' });
  }
});

// ==================== Tool Routes ====================

router.get('/tools/preloaded', requireAuth, async (req, res) => {
  res.json({ 
    available: preloadedTools.length,
    categories: [...new Set(preloadedTools.map(t => t.category))],
  });
});

router.post('/tools/seed', requireAuth, async (req, res) => {
  try {
    const result = await seedTools(storage, req.user.id);
    res.json({ 
      success: true, 
      added: result.added,
      skipped: result.skipped,
      message: result.added > 0 
        ? `Added ${result.added} trading tools` 
        : 'All preloaded tools already exist'
    });
  } catch (error) {
    console.error('Error seeding tools:', error);
    res.status(500).json({ error: 'Failed to seed tools' });
  }
});

router.get('/tools', requireAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const tools = await storage.getUserTools(req.user.id, {
      category: category || undefined,
    });
    res.json(tools);
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({ error: 'Failed to get tools' });
  }
});

router.post('/tools', requireAuth, async (req, res) => {
  try {
    const schema = insertToolSchema.omit({ userId: true });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const tool = await storage.createTool(req.user.id, result.data);
    res.status(201).json(tool);
  } catch (error) {
    console.error('Create tool error:', error);
    res.status(500).json({ error: 'Failed to create tool' });
  }
});

router.get('/tools/:id', requireAuth, async (req, res) => {
  try {
    const tool = await storage.getTool(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    if (tool.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(tool);
  } catch (error) {
    console.error('Get tool error:', error);
    res.status(500).json({ error: 'Failed to get tool' });
  }
});

router.put('/tools/:id', requireAuth, async (req, res) => {
  try {
    const tool = await storage.getTool(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    if (tool.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const schema = insertToolSchema.partial().omit({ userId: true });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const updated = await storage.updateTool(req.params.id, result.data);
    res.json(updated);
  } catch (error) {
    console.error('Update tool error:', error);
    res.status(500).json({ error: 'Failed to update tool' });
  }
});

router.delete('/tools/:id', requireAuth, async (req, res) => {
  try {
    const tool = await storage.getTool(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    if (tool.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await storage.deleteTool(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete tool error:', error);
    res.status(500).json({ error: 'Failed to delete tool' });
  }
});

// ==================== Playbook Routes ====================

router.get('/playbooks', requireAuth, async (req, res) => {
  try {
    const playbooks = await storage.getUserPlaybooks(req.user.id);
    res.json(playbooks);
  } catch (error) {
    console.error('Get playbooks error:', error);
    res.status(500).json({ error: 'Failed to get playbooks' });
  }
});

router.post('/playbooks', requireAuth, async (req, res) => {
  try {
    const schema = insertPlaybookSchema.omit({ userId: true });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const playbook = await storage.createPlaybook({
      userId: req.user.id,
      ...result.data,
    });
    res.status(201).json(playbook);
  } catch (error) {
    console.error('Create playbook error:', error);
    res.status(500).json({ error: 'Failed to create playbook' });
  }
});

router.get('/playbooks/:id', requireAuth, async (req, res) => {
  try {
    const playbook = await storage.getPlaybook(req.params.id);
    if (!playbook) {
      return res.status(404).json({ error: 'Playbook not found' });
    }
    if (playbook.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(playbook);
  } catch (error) {
    console.error('Get playbook error:', error);
    res.status(500).json({ error: 'Failed to get playbook' });
  }
});

router.put('/playbooks/:id', requireAuth, async (req, res) => {
  try {
    const playbook = await storage.getPlaybook(req.params.id);
    if (!playbook) {
      return res.status(404).json({ error: 'Playbook not found' });
    }
    if (playbook.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const schema = insertPlaybookSchema.partial().omit({ userId: true });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const updated = await storage.updatePlaybook(req.params.id, result.data);
    res.json(updated);
  } catch (error) {
    console.error('Update playbook error:', error);
    res.status(500).json({ error: 'Failed to update playbook' });
  }
});

router.delete('/playbooks/:id', requireAuth, async (req, res) => {
  try {
    const playbook = await storage.getPlaybook(req.params.id);
    if (!playbook) {
      return res.status(404).json({ error: 'Playbook not found' });
    }
    if (playbook.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await storage.deletePlaybook(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete playbook error:', error);
    res.status(500).json({ error: 'Failed to delete playbook' });
  }
});

// ==================== Market Data Routes (Multi-Provider) ====================

router.get('/market/symbols', requireAuth, async (req, res) => {
  try {
    const { search, market } = req.query;
    
    if (!search) {
      return res.json([]);
    }
    
    const settings = await storage.getUserSettings(req.user.id);
    const symbols = await searchSymbols(settings, search, market);
    
    res.json(symbols);
  } catch (error) {
    console.error('Symbol search error:', error);
    res.status(500).json({ error: error.message || 'Failed to search symbols' });
  }
});

router.get('/market/candles', requireAuth, async (req, res) => {
  try {
    const { symbol, timeframe = '1h', from, to, coingeckoId, binanceSymbol, market, polygonSymbol, alphaVantageSymbol, twelveDataSymbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    const settings = await storage.getUserSettings(req.user.id);
    const options = {};
    if (coingeckoId) options.coingeckoId = coingeckoId;
    if (binanceSymbol) options.binanceSymbol = binanceSymbol;
    if (market) options.market = market;
    if (polygonSymbol) options.polygonSymbol = polygonSymbol;
    if (alphaVantageSymbol) options.alphaVantageSymbol = alphaVantageSymbol;
    if (twelveDataSymbol) options.twelveDataSymbol = twelveDataSymbol;
    
    const candles = await getCandles(settings, symbol, timeframe, from, to, options);
    
    res.json(candles);
  } catch (error) {
    console.error('Get candles error:', error);
    res.status(500).json({ error: error.message || 'Failed to get market data' });
  }
});

router.get('/market/providers', requireAuth, async (req, res) => {
  try {
    const settings = await storage.getUserSettings(req.user.id);
    const providers = getAvailableProviders(settings);
    res.json(providers);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to get available providers' });
  }
});

router.post('/market/analyze', requireAuth, async (req, res) => {
  try {
    const { symbol, market, timeframe, candles } = req.body;
    
    if (!symbol || !candles || candles.length === 0) {
      return res.status(400).json({ error: 'Symbol and candle data are required' });
    }

    const settings = await storage.getUserSettings(req.user.id);
    const provider = settings?.preferredProvider || 'anthropic';
    
    let apiKey;
    if (provider === 'openai') {
      apiKey = settings?.openaiApiKey ? decrypt(settings.openaiApiKey) : null;
    } else {
      apiKey = settings?.anthropicApiKey ? decrypt(settings.anthropicApiKey) : null;
    }
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: `Please configure your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key in Settings` 
      });
    }

    const recentCandles = candles.slice(-50);
    const candleSummary = recentCandles.map((c, i) => 
      `${i + 1}. O:${c.open.toFixed(4)} H:${c.high.toFixed(4)} L:${c.low.toFixed(4)} C:${c.close.toFixed(4)}`
    ).join('\n');

    const lastCandle = recentCandles[recentCandles.length - 1];
    const firstCandle = recentCandles[0];
    const priceChange = ((lastCandle.close - firstCandle.open) / firstCandle.open * 100).toFixed(2);
    const high = Math.max(...recentCandles.map(c => c.high));
    const low = Math.min(...recentCandles.map(c => c.low));
    const volatility = ((high - low) / firstCandle.open * 100).toFixed(2);

    const prompt = `Analyze this ${market || 'unknown'} chart for ${symbol} on the ${timeframe || '1h'} timeframe.

Summary Statistics:
- Current Price: ${lastCandle.close}
- Period Price Change: ${priceChange}%
- Range High: ${high}
- Range Low: ${low}
- Volatility: ${volatility}%

Last ${recentCandles.length} Candles (OHLC):
${candleSummary}

Please provide a technical analysis including:
1. **Trend Analysis**: Current trend direction and strength
2. **Support & Resistance**: Key price levels to watch
3. **Patterns**: Any chart patterns forming (e.g., head & shoulders, triangles, flags)
4. **Entry Opportunities**: Potential trade setups with entry/exit levels
5. **Risk Assessment**: Key risks and what to watch for
6. **ICT Concepts**: Any relevant ICT patterns (FVG, order blocks, liquidity sweeps)

Keep your analysis focused and actionable.`;

    let analysisText;
    
    if (provider === 'openai') {
      const openai = createOpenAIClient(apiKey);
      const response = await openai.chat.completions.create({
        model: settings?.aiModel || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
      });
      analysisText = response.choices[0]?.message?.content || 'No analysis generated';
    } else {
      const anthropic = createAnthropicClient(apiKey);
      const response = await anthropic.messages.create({
        model: settings?.aiModel || 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      });
      analysisText = response.content[0]?.text || 'No analysis generated';
    }

    res.json({ 
      analysis: analysisText,
      symbol,
      timeframe,
      candlesAnalyzed: recentCandles.length,
    });
  } catch (error) {
    console.error('Chart analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze chart. Please try again.' });
  }
});

// ==================== User Profile Routes ====================

router.put('/user/profile', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
    }).refine(data => data.name || data.email, {
      message: 'At least one field (name or email) is required',
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    if (result.data.email) {
      const existing = await storage.getUserByEmail(result.data.email);
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }
    
    const updated = await storage.updateUser(req.user.id, result.data);
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==================== Memory System Routes (pgvector) ====================

router.get('/memory/status', requireAuth, async (req, res) => {
  try {
    const settings = await storage.getUserSettings(req.user.id);
    const openaiApiKey = settings?.openaiApiKey ? decrypt(settings.openaiApiKey) : null;
    const stats = await getEmbeddingStats(req.user.id);
    
    res.json({
      available: true,
      hasApiKey: !!openaiApiKey,
      stats: stats,
      message: openaiApiKey 
        ? 'Vector memory ready (pgvector)' 
        : 'Add OpenAI API key in Settings to enable semantic search',
    });
  } catch (error) {
    console.error('Memory status error:', error);
    res.json({
      available: true,
      hasApiKey: false,
      stats: [],
      message: 'Vector memory ready (pgvector)',
    });
  }
});

router.get('/memory/search', requireAuth, async (req, res) => {
  const { q, type, limit = 10 } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    const settings = await storage.getUserSettings(req.user.id);
    const openaiApiKey = settings?.openaiApiKey ? decrypt(settings.openaiApiKey) : null;
    
    if (!openaiApiKey) {
      return res.json({ 
        results: [],
        available: false,
        message: 'Add OpenAI API key in Settings to enable semantic search',
      });
    }
    
    const results = await searchMemory(req.user.id, q, openaiApiKey, parseInt(limit));
    
    res.json({
      results: results,
      available: true,
    });
  } catch (error) {
    console.error('Memory search error:', error);
    res.status(500).json({ error: 'Failed to search memory' });
  }
});

router.post('/memory/index', requireAuth, async (req, res) => {
  const { type, id } = req.body;
  
  if (!type || !id) {
    return res.status(400).json({ error: 'Type and ID are required' });
  }
  
  try {
    const settings = await storage.getUserSettings(req.user.id);
    const openaiApiKey = settings?.openaiApiKey ? decrypt(settings.openaiApiKey) : null;
    
    if (!openaiApiKey) {
      return res.status(400).json({ 
        error: 'Add OpenAI API key in Settings to enable indexing',
      });
    }
    
    let result;
    switch (type) {
      case 'knowledge':
        const doc = await storage.getKnowledgeDocument(id);
        if (!doc || doc.userId !== req.user.id) {
          return res.status(404).json({ error: 'Document not found' });
        }
        result = await indexDocument(req.user.id, doc, openaiApiKey);
        await storage.updateKnowledgeDocument(id, { vectorIndexed: true });
        break;
        
      case 'conversation':
        const conv = await storage.getConversation(id);
        if (!conv || conv.userId !== req.user.id) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        result = await indexConversation(req.user.id, conv, openaiApiKey);
        break;
        
      case 'journal':
        const entry = await storage.getJournalEntry(id);
        if (!entry || entry.userId !== req.user.id) {
          return res.status(404).json({ error: 'Journal entry not found' });
        }
        result = await indexJournalEntry(req.user.id, entry, openaiApiKey);
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid type' });
    }
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Memory index error:', error);
    res.status(500).json({ error: 'Failed to index item' });
  }
});

// ==================== Knowledge Base Routes ====================

const knowledgeDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().optional(),
  category: z.string().optional(),
  fileType: z.string().optional(),
  sourceUrl: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  isPreloaded: z.boolean().optional().default(false),
});

router.get('/knowledge', requireAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const documents = await storage.getUserKnowledgeDocuments(req.user.id, { category });
    res.json({ documents });
  } catch (error) {
    console.error('Error fetching knowledge documents:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge documents' });
  }
});

router.post('/knowledge', requireAuth, async (req, res) => {
  const result = knowledgeDocumentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }
  
  const content = result.data.content.trim();
  const placeholders = [
    '[Image - Use AI Analyze to extract content]',
    '[PDF - Processing...]',
    'Image content analyzed by AI'
  ];
  
  if (!content || content.length < 10 || placeholders.includes(content)) {
    return res.status(400).json({ 
      error: 'Content is required. Please use AI Analyze to extract content from images or wait for PDF processing to complete.'
    });
  }
  
  try {
    const doc = await storage.createKnowledgeDocument({
      ...result.data,
      content: content,
      userId: req.user.id,
    });
    res.status(201).json(doc);
  } catch (error) {
    console.error('Error creating knowledge document:', error);
    res.status(500).json({ error: 'Failed to create knowledge document' });
  }
});

router.get('/knowledge/search', requireAuth, async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    const results = await storage.searchKnowledgeDocuments(req.user.id, q);
    res.json({ results });
  } catch (error) {
    console.error('Error searching knowledge documents:', error);
    res.status(500).json({ error: 'Failed to search knowledge documents' });
  }
});

router.get('/knowledge/:id', requireAuth, async (req, res) => {
  try {
    const doc = await storage.getKnowledgeDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Knowledge document not found' });
    }
    if (doc.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(doc);
  } catch (error) {
    console.error('Error fetching knowledge document:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge document' });
  }
});

router.put('/knowledge/:id', requireAuth, async (req, res) => {
  const doc = await storage.getKnowledgeDocument(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Knowledge document not found' });
  }
  if (doc.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const result = knowledgeDocumentSchema.partial().safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }
  
  try {
    const updated = await storage.updateKnowledgeDocument(req.params.id, result.data);
    res.json(updated);
  } catch (error) {
    console.error('Error updating knowledge document:', error);
    res.status(500).json({ error: 'Failed to update knowledge document' });
  }
});

router.delete('/knowledge/:id', requireAuth, async (req, res) => {
  const doc = await storage.getKnowledgeDocument(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Knowledge document not found' });
  }
  if (doc.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    await storage.deleteKnowledgeDocument(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge document:', error);
    res.status(500).json({ error: 'Failed to delete knowledge document' });
  }
});

router.get('/knowledge/preloaded', requireAuth, async (req, res) => {
  res.json({ 
    available: preloadedKnowledge.length,
    categories: [...new Set(preloadedKnowledge.map(d => d.category))]
  });
});

router.post('/knowledge/seed', requireAuth, async (req, res) => {
  try {
    const count = await seedKnowledgeBase(storage, req.user.id);
    res.json({ 
      success: true, 
      added: count,
      message: count > 0 ? `Added ${count} knowledge documents` : 'All preloaded knowledge already exists'
    });
  } catch (error) {
    console.error('Error seeding knowledge base:', error);
    res.status(500).json({ error: 'Failed to seed knowledge base' });
  }
});

router.post('/knowledge/parse-pdf', requireAuth, async (req, res) => {
  const { pdf } = req.body;
  
  if (!pdf) {
    return res.status(400).json({ error: 'PDF data is required' });
  }
  
  try {
    const base64Data = pdf.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const data = await pdfParse(buffer);
    res.json({ text: data.text || '' });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

router.post('/knowledge/analyze', requireAuth, async (req, res) => {
  const { content, image, fileType } = req.body;
  
  if (!content && !image) {
    return res.status(400).json({ error: 'Content or image is required for analysis' });
  }
  
  const settings = await storage.getUserSettings(req.user.id);
  const provider = settings?.preferredProvider || 'anthropic';
  
  let apiKey = null;
  try {
    if (provider === 'openai' && settings?.openaiApiKey) {
      apiKey = decrypt(settings.openaiApiKey);
    } else if (settings?.anthropicApiKey) {
      apiKey = decrypt(settings.anthropicApiKey);
    }
  } catch (e) {
    return res.status(500).json({ error: 'Failed to decrypt API key' });
  }
  
  if (!apiKey) {
    return res.status(400).json({ 
      error: `No ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key configured. Please add your API key in Settings.`
    });
  }
  
  const textPrompt = `Analyze the following trading-related content and provide:
1. A concise title (max 100 characters)
2. A brief summary (2-3 sentences)
3. Relevant category (one of: ICT, Scalping, Swing Trading, Day Trading, Technical Analysis, Fundamental Analysis, Risk Management, Psychology, General)
4. Up to 5 relevant tags

Content to analyze:
${(content || '').substring(0, 10000)}

Respond in JSON format:
{
  "title": "...",
  "summary": "...",
  "category": "...",
  "tags": ["tag1", "tag2", ...]
}`;

  const imagePrompt = `Analyze this trading-related image (likely a chart, screenshot, or trading document) and provide:
1. A concise title (max 100 characters) describing the content
2. A detailed description of what the image shows (patterns, indicators, price action, annotations, etc.)
3. Relevant category (one of: ICT, Scalping, Swing Trading, Day Trading, Technical Analysis, Fundamental Analysis, Risk Management, Psychology, General)
4. Up to 5 relevant tags
5. Extracted text content from the image if any

Respond in JSON format:
{
  "title": "...",
  "summary": "...",
  "category": "...",
  "tags": ["tag1", "tag2", ...],
  "extractedContent": "A detailed text description of the image content that can be stored and searched..."
}`;

  const parseJsonResponse = (text) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      const rawMatch = text.match(/\{[\s\S]*\}/);
      if (rawMatch) {
        return JSON.parse(rawMatch[0]);
      }
      return null;
    }
  };

  try {
    let analysisResult = null;
    let rawResponse = '';
    
    if (provider === 'openai') {
      const openai = createOpenAIClient(apiKey);
      const model = settings?.openaiModel || 'gpt-4o';
      
      let messageContent;
      if (image) {
        messageContent = [
          { type: 'text', text: imagePrompt + '\n\nIMPORTANT: Respond with ONLY valid JSON, no other text.' },
          { type: 'image_url', image_url: { url: image } }
        ];
      } else {
        messageContent = textPrompt;
      }
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: messageContent }],
        response_format: image ? undefined : { type: 'json_object' },
      });
      
      rawResponse = response.choices[0].message.content;
      analysisResult = parseJsonResponse(rawResponse);
    } else {
      const anthropic = createAnthropicClient(apiKey);
      const model = settings?.anthropicModel || 'claude-sonnet-4-5';
      
      let messageContent;
      if (image) {
        const base64Data = image.replace(/^data:image\/[a-z+]+;base64,/, '');
        const mediaTypeMatch = image.match(/^data:(image\/[a-z+]+);base64,/);
        const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : 'image/jpeg';
        
        messageContent = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: imagePrompt + '\n\nIMPORTANT: Respond with ONLY valid JSON, no other text.' }
        ];
      } else {
        messageContent = [{ type: 'text', text: textPrompt }];
      }
      
      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: messageContent }],
      });
      
      rawResponse = response.content[0].text;
      analysisResult = parseJsonResponse(rawResponse);
    }
    
    if (!analysisResult) {
      const titleMatch = rawResponse.match(/title[:\s]*["']?([^"'\n,}]+)/i);
      analysisResult = {
        title: titleMatch ? titleMatch[1].trim() : 'Untitled Document',
        summary: rawResponse.substring(0, 500),
        category: 'General',
        tags: [],
        extractedContent: image ? rawResponse : undefined
      };
    }
    
    if (image) {
      if (!analysisResult.extractedContent || analysisResult.extractedContent.length < 20) {
        const descriptionParts = [];
        if (analysisResult.title) descriptionParts.push(`Title: ${analysisResult.title}`);
        if (analysisResult.summary) descriptionParts.push(`Description: ${analysisResult.summary}`);
        if (analysisResult.category) descriptionParts.push(`Category: ${analysisResult.category}`);
        if (analysisResult.tags?.length) descriptionParts.push(`Tags: ${analysisResult.tags.join(', ')}`);
        
        analysisResult.extractedContent = descriptionParts.length > 0 
          ? descriptionParts.join('\n\n')
          : `Image analyzed on ${new Date().toLocaleDateString()}. ${rawResponse.substring(0, 1000)}`;
      }
    }
    
    analysisResult.title = (analysisResult.title || 'Untitled Document').substring(0, 100);
    analysisResult.summary = analysisResult.summary || '';
    analysisResult.category = analysisResult.category || 'General';
    analysisResult.tags = Array.isArray(analysisResult.tags) ? analysisResult.tags.slice(0, 5) : [];
    
    res.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({ error: 'Failed to analyze content. Please try again or enter the details manually.' });
  }
});

// ==================== Backtesting Routes ====================

router.get('/backtest/templates', requireAuth, (req, res) => {
  res.json({ templates: strategyTemplates });
});

router.post('/backtest/run', requireAuth, async (req, res) => {
  const { symbol, timeframe, strategy, startDate, endDate, provider } = req.body;

  if (!symbol || !timeframe) {
    return res.status(400).json({ error: 'Symbol and timeframe are required' });
  }

  try {
    const settings = await storage.getUserSettings(req.user.id);
    
    // If a specific provider is requested, override settings
    const effectiveSettings = provider ? 
      { ...settings, preferredMarketDataProvider: provider } : 
      settings;
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const from = startDate ? new Date(startDate) : sixMonthsAgo;
    const to = endDate ? new Date(endDate) : new Date();
    
    if (from < sixMonthsAgo) {
      return res.status(400).json({ 
        error: 'Maximum backtest period is 6 months. Please adjust your start date.' 
      });
    }

    const candles = await getCandles(effectiveSettings, symbol, timeframe, from, to);
    
    if (!candles || candles.length < 50) {
      return res.status(400).json({ 
        error: 'Insufficient historical data for backtesting. Need at least 50 candles.' 
      });
    }

    let strategyConfig;
    if (strategy && strategy.rules) {
      strategyConfig = parseRulesToConfig(strategy);
    } else if (strategy && strategy.category) {
      const riskMultiplier = strategy.riskLevel === 'High' ? 1.5 : strategy.riskLevel === 'Low' ? 0.5 : 1;
      const baseRisk = 0.02 * riskMultiplier;
      
      switch (strategy.category) {
        case 'Scalping':
          strategyConfig = {
            name: strategy.name || 'Scalping Strategy',
            entryIndicator: { type: 'ma_crossover', fastPeriod: 5, slowPeriod: 10 },
            exitIndicator: { type: 'rsi', period: 7, overbought: 75, oversold: 25 },
            stopMultiplier: 1,
            rrRatio: 1.5,
            riskPerTrade: baseRisk
          };
          break;
        case 'Day Trading':
          strategyConfig = {
            name: strategy.name || 'Day Trading Strategy',
            entryIndicator: { type: 'ma_crossover', fastPeriod: 9, slowPeriod: 21 },
            exitIndicator: { type: 'ma_crossover', fastPeriod: 9, slowPeriod: 21 },
            stopMultiplier: 1.5,
            rrRatio: 2,
            riskPerTrade: baseRisk
          };
          break;
        case 'Swing':
        case 'Swing Trading':
          strategyConfig = {
            name: strategy.name || 'Swing Trading Strategy',
            entryIndicator: { type: 'ma_crossover', fastPeriod: 20, slowPeriod: 50 },
            exitIndicator: { type: 'rsi', period: 14, overbought: 70, oversold: 30 },
            stopMultiplier: 2.5,
            rrRatio: 3,
            riskPerTrade: baseRisk
          };
          break;
        case 'Position':
        case 'Position Trading':
          strategyConfig = {
            name: strategy.name || 'Position Trading Strategy',
            entryIndicator: { type: 'ma_crossover', fastPeriod: 50, slowPeriod: 200 },
            exitIndicator: { type: 'ma_crossover', fastPeriod: 50, slowPeriod: 200 },
            stopMultiplier: 3,
            rrRatio: 4,
            riskPerTrade: baseRisk * 0.5
          };
          break;
        case 'Trend Following':
          strategyConfig = {
            name: strategy.name || 'Trend Following Strategy',
            entryIndicator: { type: 'breakout', period: 20 },
            exitIndicator: null,
            stopMultiplier: 2,
            rrRatio: 3,
            riskPerTrade: baseRisk
          };
          break;
        case 'Mean Reversion':
          strategyConfig = {
            name: strategy.name || 'Mean Reversion Strategy',
            entryIndicator: { type: 'rsi', period: 14, oversold: 25, overbought: 75 },
            exitIndicator: { type: 'rsi', period: 14, oversold: 30, overbought: 70 },
            stopMultiplier: 1.5,
            rrRatio: 1.5,
            riskPerTrade: baseRisk
          };
          break;
        default:
          strategyConfig = { ...strategyTemplates.ma_crossover, name: strategy.name || 'Custom Strategy' };
      }
    } else {
      strategyConfig = strategy || strategyTemplates.ma_crossover;
    }
    const engine = new BacktestEngine(candles, strategyConfig);
    const results = engine.run();

    res.json({
      symbol,
      timeframe,
      period: { from: from.toISOString(), to: to.toISOString() },
      candleCount: candles.length,
      strategy: strategyConfig.name || 'Custom Strategy',
      results
    });
  } catch (error) {
    console.error('Backtesting error:', error);
    res.status(500).json({ error: error.message || 'Failed to run backtest' });
  }
});

router.post('/backtest/improve', requireAuth, async (req, res) => {
  const { strategy, backtestResults, symbol, timeframe } = req.body;

  if (!strategy || !backtestResults) {
    return res.status(400).json({ error: 'Strategy and backtest results are required' });
  }

  try {
    const settings = await storage.getUserSettings(req.user.id);
    const preferredProvider = settings?.preferredProvider || 'anthropic';

    let apiKey;
    if (preferredProvider === 'openai') {
      apiKey = settings?.openaiApiKey ? decrypt(settings.openaiApiKey) : null;
    } else {
      apiKey = settings?.anthropicApiKey ? decrypt(settings.anthropicApiKey) : null;
    }

    if (!apiKey) {
      return res.status(400).json({ 
        error: `No ${preferredProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key configured. Please add your API key in Settings.` 
      });
    }

    const categoryUsed = strategy.category || 'Day Trading';
    const prompt = `You are a trading strategy analyst. Analyze the following trading strategy and provide improvement suggestions.

**Strategy: ${strategy.name}**
- Category: ${categoryUsed}
- Market: ${strategy.market || 'N/A'}
- Timeframe: ${strategy.timeframe || 'N/A'}
- Risk Level: ${strategy.riskLevel || 'Medium'}

**User's Defined Entry Rules:**
${strategy.rules?.entry?.length ? strategy.rules.entry.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'None defined'}

**User's Defined Exit Rules:**
${strategy.rules?.exit?.length ? strategy.rules.exit.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'None defined'}

**User's Defined Risk Rules:**
${strategy.rules?.risk?.length ? strategy.rules.risk.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'None defined'}

**Simulation Results on ${symbol} ${timeframe}:**
(Using a ${categoryUsed} indicator model adapted to the strategy's risk profile)
- Total Trades: ${backtestResults.totalTrades}
- Win Rate: ${(backtestResults.winRate * 100).toFixed(1)}%
- Profit Factor: ${backtestResults.profitFactor?.toFixed(2) || 'N/A'}
- Max Drawdown: ${(backtestResults.maxDrawdown * 100).toFixed(2)}%
- Sharpe Ratio: ${backtestResults.sharpeRatio?.toFixed(2) || 'N/A'}
- Total Return: ${(backtestResults.totalReturn * 100).toFixed(2)}%
- Average Win: ${(backtestResults.avgWin * 100).toFixed(2)}%
- Average Loss: ${(backtestResults.avgLoss * 100).toFixed(2)}%
- Win/Lose Streaks: ${backtestResults.longestWinStreak || 0}/${backtestResults.longestLoseStreak || 0}

Provide a comprehensive analysis:

1. **Rule Quality Assessment**: Evaluate the user's defined entry/exit/risk rules for clarity, completeness, and potential gaps. Are there missing confirmations? Conflicting rules?

2. **Performance Context**: Based on the simulation metrics, what does this suggest about ${categoryUsed} strategies in the ${symbol} ${timeframe} context?

3. **Entry Rule Improvements**: Suggest specific improvements or additions to the entry rules. Consider adding filters, confirmations, or timing elements.

4. **Exit Rule Improvements**: Suggest improvements to exit rules. Consider partial profit-taking, trailing stops, time-based exits, or signal reversals.

5. **Risk Management Enhancements**: Based on the drawdown and loss metrics, suggest risk rule improvements. Consider position sizing, maximum daily loss, correlation limits.

6. **Optimization Ideas**: What parameters or conditions could be tuned? What additional indicators might complement this strategy type?

Be specific and reference the actual rules when making suggestions. Focus on practical, actionable improvements.`;

    let analysis;
    if (preferredProvider === 'openai') {
      const openai = createOpenAIClient(apiKey);
      const completion = await openai.chat.completions.create({
        model: settings?.openaiModel || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert quantitative trading analyst specializing in strategy optimization and risk management.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000
      });
      analysis = completion.choices[0].message.content;
    } else {
      const anthropic = createAnthropicClient(apiKey);
      const message = await anthropic.messages.create({
        model: settings?.anthropicModel || 'claude-sonnet-4-5-20250514',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: [{ type: 'text', text: prompt }] }
        ],
        system: 'You are an expert quantitative trading analyst specializing in strategy optimization and risk management.'
      });
      analysis = message.content[0].text;
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Strategy improvement analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze strategy' });
  }
});

router.post('/tools/recommend', requireAuth, async (req, res) => {
  const { existingTools, tradingStyle, markets, focus } = req.body;

  try {
    const settings = await storage.getUserSettings(req.user.id);
    const preferredProvider = settings?.preferredProvider || 'anthropic';

    let apiKey;
    if (preferredProvider === 'openai') {
      apiKey = settings?.openaiApiKey ? decrypt(settings.openaiApiKey) : null;
    } else {
      apiKey = settings?.anthropicApiKey ? decrypt(settings.anthropicApiKey) : null;
    }

    if (!apiKey) {
      return res.status(400).json({ 
        error: `No ${preferredProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key configured. Please add your API key in Settings.` 
      });
    }

    const existingToolsList = existingTools && existingTools.length > 0 
      ? existingTools.map(t => `- ${t.name} (${t.category})`).join('\n')
      : 'None yet';

    const prompt = `You are a trading tools expert. Recommend useful trading tools and resources.

**User Context:**
- Trading Style: ${tradingStyle || 'General'}
- Markets: ${markets || 'All'}
- Focus Area: ${focus || 'General improvement'}

**Currently Using:**
${existingToolsList}

Recommend 5-7 trading tools the user should consider. For each tool, provide:
1. **Name**: The tool/platform name
2. **Category**: Calculators, Screeners, Analysis, News, Education, or Charting
3. **Description**: 1-2 sentences on what it does
4. **URL**: The actual website URL (use real, working URLs)
5. **Why Recommended**: How it helps the user's specific trading style/markets

Focus on tools that complement what they already have. Include a mix of free and premium options.
Format each tool clearly with the fields above.`;

    let recommendations;
    if (preferredProvider === 'openai') {
      const openai = createOpenAIClient(apiKey);
      const completion = await openai.chat.completions.create({
        model: settings?.openaiModel || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a trading tools expert who recommends practical, useful tools for traders.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000
      });
      recommendations = completion.choices[0].message.content;
    } else {
      const anthropic = createAnthropicClient(apiKey);
      const message = await anthropic.messages.create({
        model: settings?.anthropicModel || 'claude-sonnet-4-5-20250514',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: [{ type: 'text', text: prompt }] }
        ],
        system: 'You are a trading tools expert who recommends practical, useful tools for traders.'
      });
      recommendations = message.content[0].text;
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Tool recommendation error:', error);
    res.status(500).json({ error: error.message || 'Failed to get recommendations' });
  }
});

// ==================== Price Alert Routes ====================

router.get('/alerts', requireAuth, async (req, res) => {
  try {
    const alerts = await storage.getUserPriceAlerts(req.user.id);
    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to get price alerts' });
  }
});

router.post('/alerts', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      symbol: z.string().min(1),
      market: z.string().min(1),
      condition: z.enum(['above', 'below', 'crosses']),
      targetPrice: z.number().positive(),
      note: z.string().optional(),
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const alert = await storage.createPriceAlert({
      userId: req.user.id,
      ...result.data,
      isActive: true,
    });
    res.status(201).json(alert);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create price alert' });
  }
});

router.put('/alerts/:id', requireAuth, async (req, res) => {
  try {
    const alert = await storage.getPriceAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    if (alert.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const schema = z.object({
      symbol: z.string().optional(),
      market: z.string().optional(),
      condition: z.enum(['above', 'below', 'crosses']).optional(),
      targetPrice: z.number().positive().optional(),
      note: z.string().optional(),
      isActive: z.boolean().optional(),
    }).strict();
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const updated = await storage.updatePriceAlert(req.params.id, result.data);
    res.json(updated);
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update price alert' });
  }
});

router.delete('/alerts/:id', requireAuth, async (req, res) => {
  try {
    const alert = await storage.getPriceAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    if (alert.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await storage.deletePriceAlert(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete price alert' });
  }
});

// ==================== Push Notification Routes ====================

router.get('/push/vapid-key', requireAuth, (req, res) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ publicKey: vapidPublicKey });
});

router.post('/push/subscribe', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid subscription', details: result.error.flatten() });
    }
    
    const existing = await storage.getPushSubscription(req.user.id, result.data.endpoint);
    if (existing) {
      return res.json({ success: true, message: 'Already subscribed' });
    }
    
    await storage.createPushSubscription({
      userId: req.user.id,
      endpoint: result.data.endpoint,
      keys: result.data.keys,
      userAgent: req.headers['user-agent'] || null,
    });
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

router.delete('/push/unsubscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }
    
    await storage.deletePushSubscriptionByEndpoint(req.user.id, endpoint);
    res.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

router.get('/push/status', requireAuth, async (req, res) => {
  try {
    const subscriptions = await storage.getUserPushSubscriptions(req.user.id);
    const vapidConfigured = !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;
    res.json({
      enabled: vapidConfigured,
      subscribed: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
    });
  } catch (error) {
    console.error('Push status error:', error);
    res.status(500).json({ error: 'Failed to get push status' });
  }
});

// ==================== Notification Routes (Discord/Telegram) ====================

router.post('/notifications/test', requireAuth, async (req, res) => {
  try {
    const { channel } = req.body;
    const message = '🚀 Test alert from Trading AI Platform - Your notifications are working!';
    
    let result;
    if (channel === 'discord') {
      result = await sendDiscordAlert(req.user.id, message, {
        title: 'Test Alert',
        description: 'This is a test notification from your Trading AI Platform.',
        color: 0x00ff00,
        fields: [
          { name: 'Status', value: 'Connected ✅', inline: true },
          { name: 'Time', value: new Date().toLocaleString(), inline: true },
        ],
      });
    } else if (channel === 'telegram') {
      result = await sendTelegramAlert(req.user.id, 
        `<b>🚀 Test Alert</b>\n\nThis is a test notification from your Trading AI Platform.\n\n<i>Status: Connected ✅</i>\n<i>Time: ${new Date().toLocaleString()}</i>`
      );
    } else {
      result = await sendAlert(req.user.id, message);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

router.post('/notifications/send', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      message: z.string().min(1),
      channels: z.array(z.enum(['discord', 'telegram'])).optional(),
      title: z.string().optional(),
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    
    const { message, channels, title } = result.data;
    const results = {};
    
    if (!channels || channels.includes('discord')) {
      results.discord = await sendDiscordAlert(req.user.id, message, { title });
    }
    if (!channels || channels.includes('telegram')) {
      results.telegram = await sendTelegramAlert(req.user.id, title ? `<b>${title}</b>\n\n${message}` : message);
    }
    
    res.json(results);
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ==================== News API Routes ====================

router.get('/news', requireAuth, async (req, res) => {
  try {
    const settings = await storage.getUserSettings(req.user.id);
    if (!settings?.newsApiKey) {
      return res.status(400).json({ error: 'News API key not configured. Add it in Settings.' });
    }
    
    const apiKey = decrypt(settings.newsApiKey);
    if (!apiKey) {
      return res.status(500).json({ error: 'Failed to decrypt News API key' });
    }
    
    const query = req.query.q || 'stock market trading forex cryptocurrency';
    const pageSize = parseInt(req.query.limit) || 10;
    
    const result = await fetchNews(apiKey, { query, pageSize });
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

router.get('/news/headlines', requireAuth, async (req, res) => {
  try {
    const settings = await storage.getUserSettings(req.user.id);
    if (!settings?.newsApiKey) {
      return res.status(400).json({ error: 'News API key not configured' });
    }
    
    const apiKey = decrypt(settings.newsApiKey);
    if (!apiKey) {
      return res.status(500).json({ error: 'Failed to decrypt News API key' });
    }
    
    const category = req.query.category || 'business';
    const country = req.query.country || 'us';
    const pageSize = parseInt(req.query.limit) || 10;
    
    const params = new URLSearchParams({
      category,
      country,
      pageSize: pageSize.toString(),
      apiKey,
    });
    
    const response = await fetch(`https://newsapi.org/v2/top-headlines?${params}`);
    const data = await response.json();
    
    if (data.status !== 'ok') {
      return res.status(500).json({ error: data.message || 'Failed to fetch headlines' });
    }
    
    res.json({
      success: true,
      articles: data.articles.map(article => ({
        title: article.title,
        description: article.description,
        source: article.source?.name,
        url: article.url,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
      })),
    });
  } catch (error) {
    console.error('Headlines fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch headlines' });
  }
});

// ==================== TradingView Webhook Routes ====================

router.post('/webhook/tradingview', async (req, res) => {
  try {
    const { secret, userId, ...alertData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const settings = await storage.getUserSettings(userId);
    if (!settings?.tradingViewWebhookSecret) {
      return res.status(401).json({ error: 'TradingView webhook not configured for this user' });
    }
    
    const storedSecret = decrypt(settings.tradingViewWebhookSecret);
    if (!validateTradingViewWebhook(storedSecret, secret)) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }
    
    const alertMessage = alertData.message || `TradingView Alert: ${alertData.ticker || 'Unknown'} - ${alertData.action || 'Signal'}`;
    
    const notificationResults = await sendAlert(userId, alertMessage, {
      discord: {
        title: '📊 TradingView Alert',
        description: alertMessage,
        color: alertData.action === 'buy' ? 0x00ff00 : alertData.action === 'sell' ? 0xff0000 : 0x0099ff,
        fields: [
          { name: 'Ticker', value: alertData.ticker || 'N/A', inline: true },
          { name: 'Action', value: alertData.action || 'N/A', inline: true },
          { name: 'Price', value: alertData.price?.toString() || 'N/A', inline: true },
          { name: 'Time', value: new Date().toLocaleString(), inline: true },
        ],
      },
    });
    
    console.log('TradingView webhook processed:', { userId, ticker: alertData.ticker, action: alertData.action });
    
    res.json({ 
      success: true, 
      message: 'Alert processed',
      notifications: notificationResults,
    });
  } catch (error) {
    console.error('TradingView webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

router.get('/webhook/tradingview/info', requireAuth, (req, res) => {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'https://your-app-url.replit.app';
  
  res.json({
    webhookUrl: `${baseUrl}/api/webhook/tradingview`,
    usage: {
      description: 'Configure this webhook URL in your TradingView alerts',
      payloadFormat: {
        secret: 'Your webhook secret from Settings',
        userId: 'Your user ID',
        ticker: 'Symbol (e.g., BTCUSD)',
        action: 'buy | sell | signal',
        price: 'Current price',
        message: 'Optional custom message',
      },
      example: JSON.stringify({
        secret: 'your-webhook-secret',
        userId: req.user.id,
        ticker: '{{ticker}}',
        action: '{{strategy.order.action}}',
        price: '{{close}}',
        message: '{{strategy.order.comment}}',
      }, null, 2),
    },
  });
});

export default router;
