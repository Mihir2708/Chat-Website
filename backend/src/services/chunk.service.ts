import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import config from '../config';

export interface ParsedPage {
  pageId: string;
  websiteId: string;
  url: string;
  title: string;
  content: string;
}

export interface Chunk {
  pageId: string;
  websiteId: string;
  url: string;
  chunkIndex: number;
  content: string;
}

export class ChunkService {
  /**
   * Splits a single parsed page into multiple semantic chunks.
   * Empty chunks are ignored.
   */
  public static async chunkPage(page: ParsedPage): Promise<Chunk[]> {
    if (!page.content || page.content.trim().length === 0) {
      return [];
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });

    const docs = await splitter.createDocuments([page.content]);

    return docs
      .map((doc, index) => {
        const text = doc.pageContent.trim();
        if (text.length === 0) {
          return null;
        }

        return {
          pageId: page.pageId,
          websiteId: page.websiteId,
          url: page.url,
          chunkIndex: index,
          content: text,
        };
      })
      .filter((chunk): chunk is Chunk => chunk !== null);
  }

  /**
   * Bulk splits an array of parsed pages into semantic chunks.
   */
  public static async chunkPages(pages: ParsedPage[]): Promise<Chunk[]> {
    const allChunks: Chunk[] = [];
    
    for (const page of pages) {
      const pageChunks = await this.chunkPage(page);
      allChunks.push(...pageChunks);
    }
    
    return allChunks;
  }
}
