import { ChunkModel } from '../models/Chunk.model';
import { EmbeddingService } from './embedding.service';
import { Chunk } from './chunk.service';

export interface RetrievedChunk {
  pageId: string;
  websiteId: string;
  url: string;
  chunkIndex: number;
  content: string;
  score: number;
}

export class RetrievalService {
  /**
   * Searches for similar chunks in the database using vector search.
   *
   * @param websiteId The ID of the website to search within.
   * @param question The user's question to find semantic matches for.
   * @param limit The maximum number of results to return (default: 5).
   * @returns An array of relevant chunks sorted by similarity score.
   */
  public static async searchSimilarChunks(
    websiteId: string,
    question: string,
    limit: number = 5
  ): Promise<RetrievedChunk[]> {
    // 1. Validate inputs
    if (!websiteId || typeof websiteId !== 'string' || websiteId.trim().length === 0) {
      return [];
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return [];
    }

    try {
      // 2. Generate embedding for the question
      // We create a dummy Chunk object since EmbeddingService expects a Chunk
      const questionChunk: Chunk = {
        pageId: 'query',
        websiteId: websiteId,
        url: 'query',
        chunkIndex: 0,
        content: question.trim(),
      };

      const embeddedQuestion = await EmbeddingService.generateEmbedding(questionChunk);
      const questionEmbedding = embeddedQuestion.embedding;

      if (!questionEmbedding || questionEmbedding.length === 0) {
        return [];
      }

      // 3. Perform MongoDB Atlas Vector Search
      // Note: 'vector_index' is the assumed name of the Atlas Vector Search index.
      // If your index has a different name (e.g., 'default'), please update it here.
      const chunks = await ChunkModel.aggregate([
        {
          $vectorSearch: {
            index: 'default', 
            path: 'embedding',
            queryVector: questionEmbedding,
            numCandidates: Math.max(limit * 10, 100), // Standard practice: evaluate 10x limit candidates
            limit: limit,
            filter: {
              websiteId: websiteId
            }
          }
        },
        {
          $project: {
            _id: 0, // Exclude MongoDB _id
            pageId: 1,
            websiteId: 1,
            url: 1,
            chunkIndex: 1,
            content: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]);

      return chunks as RetrievedChunk[];
    } catch (error: any) {
      console.error(`[RetrievalService] Error during vector search for website ${websiteId}:`, error);
      // Return empty array for any failures as per requirements
      return [];
    }
  }
}
