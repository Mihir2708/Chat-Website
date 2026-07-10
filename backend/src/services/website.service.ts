import { Website, IWebsite } from '../models/Website.model';

export class WebsiteService {
  /**
   * Creates a new Website entry or updates an existing one before a crawl starts.
   */
  public static async createOrUpdateWebsite(url: string, domain: string): Promise<IWebsite> {
    const website = await Website.findOneAndUpdate(
      { url },
      { 
        $set: { 
          domain, 
          status: 'crawling',
        }
      },
      { new: true, upsert: true }
    );
    return website;
  }

  /**
   * Updates the status and stats of a website after crawling completes or fails.
   */
  public static async finalizeWebsiteCrawl(
    websiteId: string | any, 
    status: 'completed' | 'failed', 
    totalPages: number = 0,
    crawledPages: number = 0
  ): Promise<IWebsite | null> {
    const updateData: any = { 
      status, 
      lastCrawledAt: new Date() 
    };

    if (status === 'completed') {
      updateData.totalPages = totalPages;
      updateData.crawledPages = crawledPages;
    }

    return await Website.findByIdAndUpdate(
      websiteId,
      { $set: updateData },
      { new: true }
    );
  }
}
