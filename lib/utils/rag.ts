import { db } from '@/lib/db';
import { getEmbedding } from './embeddings';
import { sql } from 'drizzle-orm';

export async function getRelevantContext(researchId: string, queryText: string, limit = 5): Promise<string> {
  try {
    const queryEmbedding = await getEmbedding(queryText);
    
    // Neon pgvector cosine distance query: (embedding <=> queryVector)
    const query = sql`
      SELECT content, (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as distance
      FROM pdf_chunks
      WHERE research_id = ${researchId}
      ORDER BY distance ASC
      LIMIT ${limit}
    `;
    
    const results = await db.execute(query);
    const rows = results.rows as unknown as Array<{ content: string; distance: number }>;
    
    // Only accept chunks with a reasonable similarity score (cosine distance < 0.75)
    const relevantChunks = rows
      .filter(row => Number(row.distance) < 0.75)
      .map(row => row.content);
      
    if (relevantChunks.length === 0) {
      return '';
    }
    
    return "\n=== RETRIEVED DOCUMENT SOURCE CONTEXT ===\n" + 
           relevantChunks.join("\n\n") + 
           "\n=========================================\n";
  } catch (err) {
    console.error('Error fetching RAG context:', err);
    return '';
  }
}
