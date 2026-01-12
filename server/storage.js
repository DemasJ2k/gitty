import {
  users,
  conversations,
  journalEntries,
  strategies,
  tools,
  playbooks,
  userSettings,
  knowledgeDocuments,
  priceAlerts,
  pushSubscriptions,
} from "../shared/schema.ts";
import { db } from "./db.js";
import { eq, and, desc, or, ilike } from "drizzle-orm";

export class DatabaseStorage {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id, user) {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async updateUserPassword(id, hashedPassword) {
    const [updated] = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async getConversation(id) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getUserConversations(userId) {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(conversation) {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async updateConversation(id, conversation) {
    const [updated] = await db.update(conversations).set(conversation).where(eq(conversations.id, id)).returning();
    return updated || undefined;
  }

  async deleteConversation(id) {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getJournalEntry(id) {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry || undefined;
  }

  async getUserJournalEntries(userId, filters) {
    const conditions = [eq(journalEntries.userId, userId)];
    
    if (filters?.type) {
      conditions.push(eq(journalEntries.type, filters.type));
    }
    
    return await db
      .select()
      .from(journalEntries)
      .where(and(...conditions))
      .orderBy(desc(journalEntries.tradeDate), desc(journalEntries.createdAt));
  }

  async createJournalEntry(entry) {
    const [newEntry] = await db.insert(journalEntries).values(entry).returning();
    return newEntry;
  }

  async updateJournalEntry(id, entry) {
    const [updated] = await db.update(journalEntries).set(entry).where(eq(journalEntries.id, id)).returning();
    return updated || undefined;
  }

  async deleteJournalEntry(id) {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  async getStrategy(id) {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy || undefined;
  }

  async getUserStrategies(userId, filters) {
    let conditions = [eq(strategies.userId, userId)];
    
    if (filters?.market) {
      conditions.push(eq(strategies.market, filters.market));
    }
    if (filters?.category) {
      conditions.push(eq(strategies.category, filters.category));
    }
    
    return await db
      .select()
      .from(strategies)
      .where(and(...conditions))
      .orderBy(desc(strategies.updatedAt));
  }

  async createStrategy(strategy) {
    const [newStrategy] = await db.insert(strategies).values(strategy).returning();
    return newStrategy;
  }

  async updateStrategy(id, strategy) {
    const [updated] = await db.update(strategies).set(strategy).where(eq(strategies.id, id)).returning();
    return updated || undefined;
  }

  async deleteStrategy(id) {
    await db.delete(strategies).where(eq(strategies.id, id));
  }

  async getTool(id) {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool || undefined;
  }

  async getUserTools(userId, filters) {
    let conditions = [eq(tools.userId, userId)];
    
    if (filters?.category) {
      conditions.push(eq(tools.category, filters.category));
    }
    
    return await db
      .select()
      .from(tools)
      .where(and(...conditions))
      .orderBy(desc(tools.updatedAt));
  }

  async createTool(userId, tool) {
    const [newTool] = await db.insert(tools).values({ ...tool, userId }).returning();
    return newTool;
  }

  async getToolsByName(userId, name) {
    return await db
      .select()
      .from(tools)
      .where(and(eq(tools.userId, userId), eq(tools.name, name)));
  }

  async updateTool(id, tool) {
    const [updated] = await db.update(tools).set(tool).where(eq(tools.id, id)).returning();
    return updated || undefined;
  }

  async deleteTool(id) {
    await db.delete(tools).where(eq(tools.id, id));
  }

  async getPlaybook(id) {
    const [playbook] = await db.select().from(playbooks).where(eq(playbooks.id, id));
    return playbook || undefined;
  }

  async getUserPlaybooks(userId) {
    return await db
      .select()
      .from(playbooks)
      .where(eq(playbooks.userId, userId))
      .orderBy(desc(playbooks.updatedAt));
  }

  async createPlaybook(playbook) {
    const [newPlaybook] = await db.insert(playbooks).values(playbook).returning();
    return newPlaybook;
  }

  async updatePlaybook(id, playbook) {
    const [updated] = await db.update(playbooks).set(playbook).where(eq(playbooks.id, id)).returning();
    return updated || undefined;
  }

  async deletePlaybook(id) {
    await db.delete(playbooks).where(eq(playbooks.id, id));
  }

  async getUserSettings(userId) {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async upsertUserSettings(settings) {
    const existing = await this.getUserSettings(settings.userId);
    
    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set(settings)
        .where(eq(userSettings.userId, settings.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userSettings).values(settings).returning();
      return created;
    }
  }

  async getKnowledgeDocument(id) {
    const [doc] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
    return doc || undefined;
  }

  async getUserKnowledgeDocuments(userId, filters) {
    const conditions = [eq(knowledgeDocuments.userId, userId)];
    
    if (filters?.category) {
      conditions.push(eq(knowledgeDocuments.category, filters.category));
    }
    
    return await db
      .select()
      .from(knowledgeDocuments)
      .where(and(...conditions))
      .orderBy(desc(knowledgeDocuments.updatedAt));
  }

  async getAllKnowledgeTitles(userId) {
    const docs = await db
      .select({ title: knowledgeDocuments.title })
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.userId, userId));
    return docs.map(d => d.title);
  }

  async searchKnowledgeDocuments(userId, query) {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(knowledgeDocuments)
      .where(
        and(
          eq(knowledgeDocuments.userId, userId),
          or(
            ilike(knowledgeDocuments.title, searchPattern),
            ilike(knowledgeDocuments.content, searchPattern),
            ilike(knowledgeDocuments.summary, searchPattern)
          )
        )
      )
      .orderBy(desc(knowledgeDocuments.updatedAt));
  }

  async createKnowledgeDocument(doc) {
    const [newDoc] = await db.insert(knowledgeDocuments).values(doc).returning();
    return newDoc;
  }

  async updateKnowledgeDocument(id, doc) {
    const [updated] = await db.update(knowledgeDocuments).set(doc).where(eq(knowledgeDocuments.id, id)).returning();
    return updated || undefined;
  }

  async deleteKnowledgeDocument(id) {
    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
  }

  async getPriceAlert(id) {
    const [alert] = await db.select().from(priceAlerts).where(eq(priceAlerts.id, id));
    return alert || undefined;
  }

  async getUserPriceAlerts(userId) {
    return await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.userId, userId))
      .orderBy(desc(priceAlerts.createdAt));
  }

  async getActivePriceAlerts() {
    return await db
      .select()
      .from(priceAlerts)
      .where(and(eq(priceAlerts.isActive, true), eq(priceAlerts.isTriggered, false)));
  }

  async createPriceAlert(alert) {
    const [newAlert] = await db.insert(priceAlerts).values(alert).returning();
    return newAlert;
  }

  async updatePriceAlert(id, alert) {
    const [updated] = await db.update(priceAlerts).set(alert).where(eq(priceAlerts.id, id)).returning();
    return updated || undefined;
  }

  async deletePriceAlert(id) {
    await db.delete(priceAlerts).where(eq(priceAlerts.id, id));
  }

  async getPushSubscription(userId, endpoint) {
    const [sub] = await db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
    return sub || undefined;
  }

  async getUserPushSubscriptions(userId) {
    return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async createPushSubscription(sub) {
    const [newSub] = await db.insert(pushSubscriptions).values(sub).returning();
    return newSub;
  }

  async deletePushSubscription(id) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
  }

  async deletePushSubscriptionByEndpoint(userId, endpoint) {
    await db.delete(pushSubscriptions).where(
      and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint))
    );
  }
}

export const storage = new DatabaseStorage();
