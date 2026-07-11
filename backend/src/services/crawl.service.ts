// Vercel Serverless filesystem is read-only except for /tmp
if (process.env.NODE_ENV === 'production') {
    process.env.CRAWLEE_STORAGE_DIR = '/tmp/crawlee_storage';
}
import { CheerioCrawler, EnqueueStrategy, CheerioCrawlingContext } from '@crawlee/cheerio';
import config from '../config';
import { ApiError } from '../utils/ApiError';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import { ParserService, ParsedPage } from './parser.service';
import { WebsiteService } from './website.service';
import { PageService } from './page.service';
import { ChunkService } from './chunk.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vectorStore.service';
import { Page } from '../models/Page.model';

export interface CrawledPage {
  url: string;
  title: string;
  statusCode: number;
  html: string;
}

export interface CrawlResult {
  websiteId: string;
  websiteUrl: string;
  totalPages: number;
  storedPages: number;
}

const normalizeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.hash = '';
    return parsedUrl.href.replace(/\/$/, '');
  } catch {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_URL);
  }
};

export const crawlUrl = async (startUrl: string): Promise<CrawlResult> => {
  const normalizedStartUrl = normalizeUrl(startUrl);
  const domain = new URL(normalizedStartUrl).hostname;
  
  // Track this crawl in the database
  const websiteDoc = await WebsiteService.createOrUpdateWebsite(normalizedStartUrl, domain);
  const websiteId = (websiteDoc._id as any).toString();

  const crawledPages: CrawledPage[] = [];

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: config.maxCrawlPages,
    requestHandlerTimeoutSecs: 30,
    ignoreSslErrors: true,
    async requestHandler({ request, $, response, enqueueLinks, log }: CheerioCrawlingContext) {
      const url = request.loadedUrl || request.url;
      const title = $('title').text().trim() || '';
      const html = $.html();
      const statusCode = response?.statusCode || 200;

      crawledPages.push({
        url,
        title,
        statusCode,
        html,
      });

      await enqueueLinks({
        strategy: EnqueueStrategy.SameDomain,
        globs: [
          `${normalizedStartUrl}/**`,
          normalizedStartUrl,
        ],
        exclude: [
          '**/*.{png,jpg,jpeg,gif,webp,svg,pdf,mp4,webm,avi,mp3,wav,css,js,xml,ico}',
          'mailto:*',
          'tel:*',
        ],
      });
    },
    failedRequestHandler({ request, log }) {
      log.error(`Request ${request.url} failed too many times.`);
    },
  });

  try {
    await crawler.run([normalizedStartUrl]);
  } catch (error: any) {
    await WebsiteService.finalizeWebsiteCrawl(websiteId, 'failed');
    if (error.message && error.message.includes('timeout')) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.CRAWL_TIMEOUT);
    }
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.CRAWL_FAILED);
  }

  if (crawledPages.length === 0) {
    await WebsiteService.finalizeWebsiteCrawl(websiteId, 'failed');
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.EMPTY_WEBSITE);
  }

  const parsedPages: ParsedPage[] = [];
  for (const page of crawledPages) {
    const parsed = ParserService.parse(page);
    if (parsed) {
      parsedPages.push(parsed);
    }
  }

  if (parsedPages.length === 0) {
    await WebsiteService.finalizeWebsiteCrawl(websiteId, 'failed');
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No parseable content found on the website.');
  }

  // Persist pages to the database
  let storedPagesCount = 0;
  try {
    storedPagesCount = await PageService.bulkSavePages(websiteId, parsedPages);

    // Fetch the saved pages to get their pageIds for chunking
    const savedPages = await Page.find({ websiteId }).select('_id url title content');

    // Convert to ChunkService's ParsedPage format
    const chunkablePages = savedPages.map(p => ({
      pageId: (p._id as any).toString(),
      websiteId,
      url: p.url,
      title: p.title,
      content: p.content,
    }));

    console.log('Starting chunk generation...');
    const chunks = await ChunkService.chunkPages(chunkablePages);
    console.log(`Generated ${chunks.length} chunks.`);

    console.log('Generating embeddings...');
    const embeddedChunks = await EmbeddingService.generateEmbeddings(chunks);
    console.log(`Generated ${embeddedChunks.length} embeddings.`);

    console.log('Saving embeddings...');
    await VectorStoreService.storeChunks(embeddedChunks);
    console.log(`Stored ${embeddedChunks.length} chunks in website_chunks.`);
    
    console.log('RAG ingestion completed successfully.');
  } catch (error: any) {
    console.error(`[CrawlService] RAG Ingestion pipeline failed for website ${websiteId}:`, error);
    await WebsiteService.finalizeWebsiteCrawl(websiteId, 'failed');
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, `RAG Ingestion pipeline failed: ${error.message}`);
  }

  // Update website status to completed
  await WebsiteService.finalizeWebsiteCrawl(websiteId, 'completed', crawledPages.length, storedPagesCount);

  return {
    websiteId,
    websiteUrl: normalizedStartUrl,
    totalPages: crawledPages.length,
    storedPages: storedPagesCount,
  };
};
