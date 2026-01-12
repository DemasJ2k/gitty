import { pgTable, text, varchar, timestamp, doublePrecision, boolean, json, index, customType } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number);
  },
});

// User model
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  conversations: many(conversations),
  journalEntries: many(journalEntries),
  strategies: many(strategies),
  tools: many(tools),
  playbooks: many(playbooks),
  settings: one(userSettings),
  knowledgeDocuments: many(knowledgeDocuments),
}));

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Conversation model
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  messages: json('messages').$type<Array<{ role: 'user' | 'assistant'; content: string }>>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('conversation_user_id_idx').on(table.userId),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
}));

export const insertConversationSchema = createInsertSchema(conversations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectConversationSchema = createSelectSchema(conversations);
export type Conversation = z.infer<typeof selectConversationSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

// JournalEntry model
export const journalEntries = pgTable('journal_entries', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // "Trade" | "Analysis" | "Note"
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  tradeDate: timestamp('trade_date'),
  market: varchar('market', { length: 50 }), // "Forex" | "Crypto" | "Stocks" | "Metals"
  symbol: varchar('symbol', { length: 50 }),
  direction: varchar('direction', { length: 20 }), // "Long" | "Short"
  entryPrice: doublePrecision('entry_price'),
  exitPrice: doublePrecision('exit_price'),
  stopLoss: doublePrecision('stop_loss'),
  takeProfit: doublePrecision('take_profit'),
  profitLoss: doublePrecision('profit_loss'),
  emotions: json('emotions').$type<{ preTradeConfidence?: number; postTradeEmotions?: string[] }>(),
  tags: text('tags').array().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('journal_user_id_idx').on(table.userId),
  typeIdx: index('journal_type_idx').on(table.type),
  tradeDateIdx: index('journal_trade_date_idx').on(table.tradeDate),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
}));

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectJournalEntrySchema = createSelectSchema(journalEntries);
export type JournalEntry = z.infer<typeof selectJournalEntrySchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

// Strategy model
export const strategies = pgTable('strategies', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // "Scalping" | "Day Trading" | "Swing" | etc.
  market: varchar('market', { length: 50 }), // "Forex" | "Crypto" | "Stocks" | "Metals"
  timeframe: varchar('timeframe', { length: 20 }), // "5m" | "1h" | "4h" | "1d" | etc.
  riskLevel: varchar('risk_level', { length: 20 }), // "Low" | "Medium" | "High"
  rules: json('rules').$type<{ entry?: string[]; exit?: string[]; risk?: string[] }>(),
  tags: text('tags').array().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('strategy_user_id_idx').on(table.userId),
  categoryIdx: index('strategy_category_idx').on(table.category),
}));

export const strategiesRelations = relations(strategies, ({ one }) => ({
  user: one(users, {
    fields: [strategies.userId],
    references: [users.id],
  }),
}));

export const insertStrategySchema = createInsertSchema(strategies).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectStrategySchema = createSelectSchema(strategies);
export type Strategy = z.infer<typeof selectStrategySchema>;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;

// Tool model
export const tools = pgTable('tools', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // "Calculators" | "Screeners" | "Analysis" | etc.
  url: varchar('url', { length: 500 }),
  tags: text('tags').array().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('tool_user_id_idx').on(table.userId),
  categoryIdx: index('tool_category_idx').on(table.category),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  user: one(users, {
    fields: [tools.userId],
    references: [users.id],
  }),
}));

export const insertToolSchema = createInsertSchema(tools).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectToolSchema = createSelectSchema(tools);
export type Tool = z.infer<typeof selectToolSchema>;
export type InsertTool = z.infer<typeof insertToolSchema>;

// Playbook model
export const playbooks = pgTable('playbooks', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  steps: json('steps').$type<Array<{ id: string; title: string; description: string; order: number }>>().default([]).notNull(),
  tags: text('tags').array().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('playbook_user_id_idx').on(table.userId),
}));

export const playbooksRelations = relations(playbooks, ({ one }) => ({
  user: one(users, {
    fields: [playbooks.userId],
    references: [users.id],
  }),
}));

export const insertPlaybookSchema = createInsertSchema(playbooks).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectPlaybookSchema = createSelectSchema(playbooks);
export type Playbook = z.infer<typeof selectPlaybookSchema>;
export type InsertPlaybook = z.infer<typeof insertPlaybookSchema>;

// UserSettings model
export const userSettings = pgTable('user_settings', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  preferredProvider: varchar('preferred_provider', { length: 50 }).default('anthropic').notNull(),
  anthropicModel: varchar('anthropic_model', { length: 100 }).default('claude-sonnet-4-5').notNull(),
  openaiModel: varchar('openai_model', { length: 100 }).default('gpt-4o').notNull(),
  openaiApiKey: text('openai_api_key'),
  anthropicApiKey: text('anthropic_api_key'),
  polygonApiKey: text('polygon_api_key'),
  alphaVantageApiKey: text('alpha_vantage_api_key'),
  coinGeckoApiKey: text('coingecko_api_key'),
  twelveDataApiKey: text('twelve_data_api_key'),
  coinbaseApiKey: text('coinbase_api_key'),
  coinbaseApiSecret: text('coinbase_api_secret'),
  preferredMarketDataProvider: varchar('preferred_market_data_provider', { length: 50 }).default('polygon').notNull(),
  discordWebhookUrl: text('discord_webhook_url'),
  telegramBotToken: text('telegram_bot_token'),
  telegramChatId: text('telegram_chat_id'),
  newsApiKey: text('news_api_key'),
  tradingViewWebhookSecret: text('tradingview_webhook_secret'),
  theme: varchar('theme', { length: 20 }).default('system').notNull(),
  timezone: varchar('timezone', { length: 100 }).default('UTC').notNull(),
  defaultMarket: varchar('default_market', { length: 50 }).default('forex').notNull(),
  defaultTimeframe: varchar('default_timeframe', { length: 20 }).default('1h').notNull(),
  riskPerTrade: doublePrecision('risk_per_trade').default(1.0).notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  notificationEmail: varchar('notification_email', { length: 255 }),
  notificationPhone: varchar('notification_phone', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('settings_user_id_idx').on(table.userId),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectUserSettingsSchema = createSelectSchema(userSettings);
export type UserSettings = z.infer<typeof selectUserSettingsSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Knowledge Document model
export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  category: varchar('category', { length: 100 }), // "ICT" | "Scalping" | "Swing Trading" | "General" | "Custom"
  fileType: varchar('file_type', { length: 50 }), // "pdf" | "image" | "text" | "url"
  sourceUrl: varchar('source_url', { length: 500 }),
  tags: text('tags').array().default([]).notNull(),
  isPreloaded: boolean('is_preloaded').default(false).notNull(),
  vectorIndexed: boolean('vector_indexed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('knowledge_user_id_idx').on(table.userId),
  categoryIdx: index('knowledge_category_idx').on(table.category),
}));

export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({ one }) => ({
  user: one(users, {
    fields: [knowledgeDocuments.userId],
    references: [users.id],
  }),
}));

export const insertKnowledgeDocumentSchema = createInsertSchema(knowledgeDocuments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectKnowledgeDocumentSchema = createSelectSchema(knowledgeDocuments);
export type KnowledgeDocument = z.infer<typeof selectKnowledgeDocumentSchema>;
export type InsertKnowledgeDocument = z.infer<typeof insertKnowledgeDocumentSchema>;

export const embeddings = pgTable('embeddings', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceType: varchar('source_type', { length: 50 }).notNull(),
  sourceId: text('source_id').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding'),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('embedding_user_id_idx').on(table.userId),
  sourceTypeIdx: index('embedding_source_type_idx').on(table.sourceType),
  sourceIdIdx: index('embedding_source_id_idx').on(table.sourceId),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  user: one(users, {
    fields: [embeddings.userId],
    references: [users.id],
  }),
}));

export const insertEmbeddingSchema = createInsertSchema(embeddings).omit({ 
  id: true, 
  createdAt: true 
});
export type Embedding = typeof embeddings.$inferSelect;
export type InsertEmbedding = z.infer<typeof insertEmbeddingSchema>;

// Price Alert model
export const priceAlerts = pgTable('price_alerts', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: varchar('symbol', { length: 50 }).notNull(),
  market: varchar('market', { length: 50 }).notNull(),
  condition: varchar('condition', { length: 20 }).notNull(),
  targetPrice: doublePrecision('target_price').notNull(),
  currentPrice: doublePrecision('current_price'),
  isActive: boolean('is_active').default(true).notNull(),
  isTriggered: boolean('is_triggered').default(false).notNull(),
  triggeredAt: timestamp('triggered_at'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('alert_user_id_idx').on(table.userId),
  symbolIdx: index('alert_symbol_idx').on(table.symbol),
  isActiveIdx: index('alert_is_active_idx').on(table.isActive),
}));

export const priceAlertsRelations = relations(priceAlerts, ({ one }) => ({
  user: one(users, {
    fields: [priceAlerts.userId],
    references: [users.id],
  }),
}));

export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({ 
  id: true, 
  createdAt: true,
  isTriggered: true,
  triggeredAt: true,
  currentPrice: true,
});
export const selectPriceAlertSchema = createSelectSchema(priceAlerts);
export type PriceAlert = z.infer<typeof selectPriceAlertSchema>;
export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;

// Push Subscription model
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  keys: json('keys').$type<{ p256dh: string; auth: string }>().notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('push_user_id_idx').on(table.userId),
  endpointIdx: index('push_endpoint_idx').on(table.endpoint),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ 
  id: true, 
  createdAt: true 
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
