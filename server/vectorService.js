import OpenAI from 'openai';
import { db } from './db.js';
import { embeddings } from '../shared/schema.ts';
import { eq, and, sql, desc } from 'drizzle-orm';

export async function generateEmbedding(text, apiKey) {
  const openai = new OpenAI({ apiKey });
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  
  return response.data[0].embedding;
}

export async function storeEmbedding(userId, sourceType, sourceId, content, embedding, metadata = {}) {
  const vectorStr = `[${embedding.join(',')}]`;
  
  const existing = await db
    .select()
    .from(embeddings)
    .where(and(
      eq(embeddings.userId, userId),
      eq(embeddings.sourceType, sourceType),
      eq(embeddings.sourceId, sourceId)
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.execute(sql`
      UPDATE embeddings 
      SET content = ${content}, 
          embedding = ${vectorStr}::vector,
          metadata = ${JSON.stringify(metadata)}::jsonb
      WHERE id = ${existing[0].id}
    `);
    return existing[0].id;
  }
  
  const [result] = await db.execute(sql`
    INSERT INTO embeddings (id, user_id, source_type, source_id, content, embedding, metadata, created_at)
    VALUES (
      gen_random_uuid(),
      ${userId},
      ${sourceType},
      ${sourceId},
      ${content},
      ${vectorStr}::vector,
      ${JSON.stringify(metadata)}::jsonb,
      NOW()
    )
    RETURNING id
  `);
  
  return result.id;
}

export async function searchSimilar(userId, queryEmbedding, sourceType = null, limit = 10, threshold = 0.7) {
  const vectorStr = `[${queryEmbedding.join(',')}]`;
  
  let query;
  if (sourceType) {
    query = sql`
      SELECT 
        id, 
        source_type, 
        source_id, 
        content, 
        metadata,
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM embeddings
      WHERE user_id = ${userId}
        AND source_type = ${sourceType}
        AND 1 - (embedding <=> ${vectorStr}::vector) > ${threshold}
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;
  } else {
    query = sql`
      SELECT 
        id, 
        source_type, 
        source_id, 
        content, 
        metadata,
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM embeddings
      WHERE user_id = ${userId}
        AND 1 - (embedding <=> ${vectorStr}::vector) > ${threshold}
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;
  }
  
  const results = await db.execute(query);
  return results.rows || results;
}

export async function deleteEmbedding(userId, sourceType, sourceId) {
  await db
    .delete(embeddings)
    .where(and(
      eq(embeddings.userId, userId),
      eq(embeddings.sourceType, sourceType),
      eq(embeddings.sourceId, sourceId)
    ));
}

export async function indexDocument(userId, document, apiKey) {
  try {
    const chunks = splitIntoChunks(document.content, 1000, 100);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk, apiKey);
      
      await storeEmbedding(
        userId,
        'knowledge',
        `${document.id}_chunk_${i}`,
        chunk,
        embedding,
        {
          documentId: document.id,
          title: document.title,
          category: document.category,
          chunkIndex: i,
          totalChunks: chunks.length,
        }
      );
    }
    
    return { success: true, chunks: chunks.length };
  } catch (error) {
    console.error('Error indexing document:', error);
    throw error;
  }
}

export async function indexConversation(userId, conversation, apiKey) {
  try {
    const summary = conversation.messages
      .slice(-10)
      .map(m => `${m.role}: ${m.content.slice(0, 200)}`)
      .join('\n');
    
    const embedding = await generateEmbedding(summary, apiKey);
    
    await storeEmbedding(
      userId,
      'conversation',
      conversation.id,
      summary,
      embedding,
      {
        title: conversation.title,
        messageCount: conversation.messages.length,
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error indexing conversation:', error);
    throw error;
  }
}

export async function indexJournalEntry(userId, entry, apiKey) {
  try {
    const content = `${entry.title}\n${entry.content || ''}\nMarket: ${entry.market || 'N/A'}\nSymbol: ${entry.symbol || 'N/A'}`;
    const embedding = await generateEmbedding(content, apiKey);
    
    await storeEmbedding(
      userId,
      'journal',
      entry.id,
      content,
      embedding,
      {
        title: entry.title,
        type: entry.type,
        market: entry.market,
        symbol: entry.symbol,
        tags: entry.tags,
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error indexing journal entry:', error);
    throw error;
  }
}

export async function searchKnowledge(userId, query, apiKey, limit = 5) {
  const queryEmbedding = await generateEmbedding(query, apiKey);
  return await searchSimilar(userId, queryEmbedding, 'knowledge', limit);
}

export async function searchMemory(userId, query, apiKey, limit = 5) {
  const queryEmbedding = await generateEmbedding(query, apiKey);
  return await searchSimilar(userId, queryEmbedding, null, limit);
}

function splitIntoChunks(text, chunkSize, overlap) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) {
        end = lastSpace;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    
    if (start < 0) start = 0;
  }
  
  return chunks.filter(c => c.length > 0);
}

export async function getEmbeddingStats(userId) {
  const stats = await db.execute(sql`
    SELECT 
      source_type,
      COUNT(*) as count
    FROM embeddings
    WHERE user_id = ${userId}
    GROUP BY source_type
  `);
  
  return stats.rows || stats;
}
