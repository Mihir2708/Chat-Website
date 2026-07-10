import { ChunkModel } from '../models/Chunk.model';
import { EmbeddedChunk } from './embedding.service';

export class VectorStoreService {
  /**
   * Validates a single chunk to ensure it contains proper content and a valid embedding.
   */
  private static isValidChunk(chunk: EmbeddedChunk): boolean {
    if (!chunk.content || chunk.content.trim().length === 0) {
      return false;
    }
    
    if (!chunk.embedding || !Array.isArray(chunk.embedding) || chunk.embedding.length === 0) {
      return false;
    }

    // Ensure all elements in the embedding array are actual numbers
    if (chunk.embedding.some(val => typeof val !== 'number' || isNaN(val))) {
      return false;
    }

    return true;
  }

  /**
   * Stores a single embedded chunk into MongoDB.
   * Upserts based on pageId and chunkIndex to prevent duplicates.
   */
  public static async storeChunk(chunk: EmbeddedChunk): Promise<void> {
    if (!this.isValidChunk(chunk)) {
      throw new Error(`Invalid chunk provided for pageId: ${chunk.pageId}, chunkIndex: ${chunk.chunkIndex}`);
    }

    try {
      await ChunkModel.findOneAndUpdate(
        { pageId: chunk.pageId, chunkIndex: chunk.chunkIndex },
        {
          $set: {
            websiteId: chunk.websiteId,
            url: chunk.url,
            content: chunk.content,
            embedding: chunk.embedding,
          }
        },
        { upsert: true, new: true }
      );
    } catch (error: any) {
      console.error(`[VectorStoreService] Error storing chunk ${chunk.chunkIndex} for page ${chunk.pageId}:`, error);
      throw new Error(`Failed to store chunk: ${error.message}`);
    }
  }

  /**
   * Bulk stores an array of embedded chunks into MongoDB.
   * Uses bulkWrite for optimal database performance.
   */
  public static async storeChunks(chunks: EmbeddedChunk[]): Promise<void> {
    if (!chunks || chunks.length === 0) {
      return;
    }

    // Pre-filter to only valid chunks
    const validChunks = chunks.filter(chunk => this.isValidChunk(chunk));

    if (validChunks.length === 0) {
      console.warn('[VectorStoreService] No valid chunks provided for bulk storage.');
      return;
    }

    const bulkOps = validChunks.map(chunk => ({
      updateOne: {
        filter: { pageId: chunk.pageId, chunkIndex: chunk.chunkIndex },
        update: {
          $set: {
            websiteId: chunk.websiteId,
            url: chunk.url,
            content: chunk.content,
            embedding: chunk.embedding,
          }
        },
        upsert: true,
      }
    }));

    try {
      // ordered: false ensures that if one operation fails, the rest will continue to process
      await ChunkModel.bulkWrite(bulkOps, { ordered: false });
    } catch (error: any) {
      console.error('[VectorStoreService] Error during bulk storing chunks:', error);
      throw new Error(`Failed to bulk store chunks: ${error.message}`);
    }
  }
}
