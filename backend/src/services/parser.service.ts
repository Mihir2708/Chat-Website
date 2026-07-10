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
    // Helper function to extract text while maintaining proper spacing between block elements
    const getSpacedText = (selector: string): string => {
      const clone = $(selector).clone();
      // Add spaces around block-level elements before extracting text to prevent words from running together
      clone.find('p, div, br, h1, h2, h3, h4, h5, h6, li, td, th').prepend(' ').append(' ');
      return clone.text();
    };

    const mainContent = getSpacedText('main');
    if (mainContent && mainContent.trim().length > 0) {
      return mainContent;
    }

    const articleContent = getSpacedText('article');
    if (articleContent && articleContent.trim().length > 0) {
      return articleContent;
    }

    return getSpacedText('body');
  }

  /**
   * Cleans up text by removing extra spaces and blank lines.
   */
  private static normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize Windows newlines
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .split('\n') // Split by line to trim each line individually
      .map(line => line.trim()) // Trim whitespace from ends of lines
      .filter(line => line.length > 0) // Remove completely empty lines
      .join('\n\n'); // Rejoin with double newlines to form clean paragraphs
  }
}
