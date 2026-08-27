import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sources, pdfChunks } from '@/lib/db/schema';
import { getEmbedding } from '@/lib/utils/embeddings';
import * as pdf from 'pdf-parse';

interface RouteParams {
  params: Promise<{
    researchId: string;
  }>;
}

// Simple text splitter function (chunk size, overlap)
function splitTextIntoChunks(text: string, chunkSize = 750, overlap = 150): string[] {
  const chunks: string[] = [];
  // Normalize whitespace
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  let i = 0;
  while (i < normalizedText.length) {
    const chunk = normalizedText.slice(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  
  return chunks;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { researchId } = await params;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Read arrayBuffer and convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse PDF
    const parsedPdf = await (pdf.default || pdf)(buffer);
    const pdfText = parsedPdf.text || '';
    
    if (!pdfText.trim()) {
      return NextResponse.json({ error: 'Failed to extract text from PDF (empty or scanned image PDF)' }, { status: 422 });
    }
    
    // Save to sources registry
    const sourceId = Math.random().toString(36).substring(2, 15);
    const domain = 'Uploaded PDF';
    const title = file.name || 'Uploaded Document';
    
    await db.insert(sources).values({
      id: sourceId,
      researchId,
      domain,
      title,
      trust: 100,
      url: null,
    });
    
    // Chunk and generate embeddings
    const textChunks = splitTextIntoChunks(pdfText);
    
    for (let index = 0; index < textChunks.length; index++) {
      const chunkText = textChunks[index];
      const embedding = await getEmbedding(chunkText);
      const chunkId = Math.random().toString(36).substring(2, 15);
      
      await db.insert(pdfChunks).values({
        id: chunkId,
        researchId,
        content: chunkText,
        embedding,
        pageNumber: 1, // Default page indicator
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed PDF. Extracted and embedded ${textChunks.length} chunks.` 
    });
  } catch (err: any) {
    console.error('Error handling PDF upload:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error processing PDF' }, { status: 500 });
  }
}
