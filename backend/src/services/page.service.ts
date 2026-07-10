import { Page } from '../models/Page.model';
import { ParsedPage } from './parser.service';

export class PageService {
  /**
   * Bulk inserts parsed pages into the database, associating them with a website.
   * Upserts based on URL and websiteId to prevent duplicates.
   */
  public static async bulkSavePages(websiteId: string, pages: ParsedPage[]): Promise<number> {
    if (!pages || pages.length === 0) {
      return 0;
    }

    const bulkOps = pages.map((page) => ({
      updateOne: {
        filter: { websiteId, url: page.url },
        update: {
          $set: {
            title: page.title,
            content: page.content,
            contentLength: page.contentLength,
          }
        },
        upsert: true,
      }
    }));

    try {
      const result = await Page.bulkWrite(bulkOps);
      // Return total number of documents affected (upserted or modified)
      return result.upsertedCount + result.modifiedCount;
    } catch (error) {
      console.error(`[PageService] Error bulk saving pages for website ${websiteId}:`, error);
      throw error;
    }
  }
}
