import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  env: string;
  port: number;
  mongoUri: string;
  maxCrawlPages: number;
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI as string,
  maxCrawlPages: Math.min(parseInt(process.env.MAX_CRAWL_PAGES || '10', 10), 10),
};

export default config;
