import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import { Chunk } from './chunk.service';
import { ApiError } from '../utils/ApiError';
import { HTTP_STATUS } from '../constants';

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

export class EmbeddingService {
  private static genAI: GoogleGenerativeAI | null = null;
  
  /**
   * Lazy initializes and returns the GoogleGenerativeAI client instance
   * to avoid unnecessary initializations.
   */
  private static getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      if (!config.geminiApiKey) {
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Gemini API key is not configured.');
      }
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
    return this.genAI;
  }

  /**
   * Generates a vector embedding for a single chunk.
   */
  public static async generateEmbedding(chunk: Chunk): Promise<EmbeddedChunk> {
    if (!chunk.content || chunk.content.trim().length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot generate embedding for empty chunk content.');
    }

    try {
      const client = this.getClient();
      const model = client.getGenerativeModel({ model: config.geminiEmbeddingModel });
      
      const result = await model.embedContent(chunk.content);
      const embedding = result.embedding.values;

      if (!embedding || embedding.length === 0) {
        throw new Error('Received empty embedding from Gemini API.');
      }

      return {
        ...chunk,
        embedding,
      };
    } catch (error: any) {
      console.error(`[EmbeddingService] Error generating embedding for chunk on page ${chunk.url}:`, error);
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR, 
        `Failed to generate embedding: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Generates vector embeddings for an array of chunks concurrently.
   * Empty chunks are skipped.
   */
  public static async generateEmbeddings(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
    if (!chunks || chunks.length === 0) {
      return [];
    }

    const embeddedChunks: EmbeddedChunk[] = [];
    const validChunks = chunks.filter(chunk => chunk.content && chunk.content.trim().length > 0);

    if (validChunks.length === 0) return [];

    try {
      const client = this.getClient();
      const model = client.getGenerativeModel({ model: config.geminiEmbeddingModel });

      // Gemini allows batching multiple embeddings into a single API request.
      // This avoids hitting the 100 Requests-Per-Minute free-tier limit.
      const BATCH_SIZE = 100;

      for (let i = 0; i < validChunks.length; i += BATCH_SIZE) {
        const batch = validChunks.slice(i, i + BATCH_SIZE);
        
        const requests = batch.map(chunk => ({
          content: { role: 'user', parts: [{ text: chunk.content }] }
        }));

        let result;
        let retries = 0;
        const MAX_RETRIES = 5;
        
        while (retries < MAX_RETRIES) {
          try {
            result = await model.batchEmbedContents({ requests });
            break;
          } catch (error: any) {
            if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
              // Wait between 5 and 80 seconds based on retries + some jitter
              const delaySeconds = Math.pow(2, retries) * 5 + Math.random() * 2;
              console.log(`[EmbeddingService] Rate limited. Retrying in ${delaySeconds.toFixed(1)}s (Attempt ${retries + 1}/${MAX_RETRIES})...`);
              await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
              retries++;
            } else {
              throw error; // Rethrow if it's not a rate limit error
            }
          }
        }

        if (!result || !result.embeddings) {
          throw new Error('Max retries reached for embedding batch due to rate limiting.');
        }

        result.embeddings.forEach((emb, index) => {
          embeddedChunks.push({
            ...batch[index],
            embedding: emb.values,
          });
        });

        // Small delay between large batches to be safe
        if (i + BATCH_SIZE < validChunks.length) {
          console.log(`[EmbeddingService] Pausing between embedding batches...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return embeddedChunks;
    } catch (error: any) {
      console.error(`[EmbeddingService] Error generating bulk embeddings:`, error);
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR, 
        `Failed to generate bulk embeddings: ${error.message || 'Unknown error'}`
      );
    }
  }
}
