import { CheerioCrawler, EnqueueStrategy, CheerioCrawlingContext } from 'crawlee';
import config from '../config';
import { ApiError } from '../utils/ApiError';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import { ParserService, ParsedPage } from './parser.service';

export interface CrawledPage {
  url: string;
  title: string;
  statusCode: number;
  html: string;
}

export interface CrawlResult {
  totalPages: number;
  pages: ParsedPage[];
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
    if (error.message && error.message.includes('timeout')) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.CRAWL_TIMEOUT);
    }
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.CRAWL_FAILED);
  }

  if (crawledPages.length === 0) {
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
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No parseable content found on the website.');
  }

  return {
    totalPages: parsedPages.length,
    pages: parsedPages,
  };
};
