import { pipeline } from '@xenova/transformers';

let extractor: any = null;

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    if (!extractor) {
      // Initialize the Xenova pipeline for sentence embeddings
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('Error generating sentence embedding:', err);
    throw err;
  }
}
