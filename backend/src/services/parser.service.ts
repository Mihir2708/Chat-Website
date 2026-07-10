import * as cheerio from 'cheerio';
import { CrawledPage } from './crawl.service';

export interface ParsedPage {
  url: string;
  title: string;
  content: string;
  contentLength: number;
}

export class ParserService {
  /**
   * List of HTML elements that contain non-content text which should be removed.
   */
  private static readonly UNNECESSARY_ELEMENTS = [
    'script', 'style', 'noscript', 'svg', 'iframe', 'canvas', 'nav', 'footer',
    'header', 'aside', 'form', 'button', 'input', 'textarea', 'select',
    'option', 'picture', 'source', 'video', 'audio'
  ];

  /**
   * Parses the HTML of a crawled page to extract clean text.
   * Returns null if the resulting content is less than 100 characters.
   */
  public static parse(page: CrawledPage): ParsedPage | null {
    try {
      const $ = cheerio.load(page.html);

      this.removeUnnecessaryElements($);
      this.removeComments($);

      const content = this.extractMainContent($);
      const normalizedContent = this.normalizeText(content);

      // Skip pages with very little content
      if (normalizedContent.length < 100) {
        return null;
      }

      return {
        url: page.url,
        title: page.title,
        content: normalizedContent,
        contentLength: normalizedContent.length,
      };
    } catch (error) {
      console.error(`[ParserService] Error parsing page ${page.url}:`, error);
      return null;
    }
  }

  /**
   * Removes predefined elements that don't contribute to core content.
   */
  private static removeUnnecessaryElements($: cheerio.CheerioAPI): void {
    const selector = this.UNNECESSARY_ELEMENTS.join(', ');
    $(selector).remove();
  }

  /**
   * Removes all HTML comments from the DOM.
   */
  private static removeComments($: cheerio.CheerioAPI): void {
    $.root().find('*').contents().filter((_, el) => el.type === 'comment').remove();
  }

  /**
   * Extracts text content based on semantic HTML5 hierarchy.
   */
  private static extractMainContent($: cheerio.CheerioAPI): string {
    const mainContent = $('main').text();
    if (mainContent && mainContent.trim().length > 0) {
      return mainContent;
    }

    const articleContent = $('article').text();
    if (articleContent && articleContent.trim().length > 0) {
      return articleContent;
    }

    return $('body').text();
  }

  /**
   * Cleans up text by removing extra spaces and blank lines.
   */
  private static normalizeText(text: string): string {
    return text
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .replace(/\n\s*\n/g, '\n\n') // Replace multiple blank lines with double newline
      .trim(); // Trim leading and trailing whitespace
  }
}
