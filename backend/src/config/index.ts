import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file only in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

interface Config {
  env: string;
  port: number;
  mongoUri: string;
  maxCrawlPages: number;
  chunkSize: number;
  chunkOverlap: number;
  geminiApiKey: string;
  geminiEmbeddingModel: string;
  geminiChatModel: string;
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI as string,
  maxCrawlPages: Math.min(parseInt(process.env.MAX_CRAWL_PAGES || '10', 10), 10),
  chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
  geminiApiKey: process.env.GEMINI_API_KEY as string,
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  geminiChatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
};

export default config;
