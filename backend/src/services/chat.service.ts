import { GoogleGenerativeAI } from '@google/generative-ai';
import { RetrievalService } from './retrieval.service';
import { PromptService } from './prompt.service';
import config from '../config';

export interface ChatRequest {
  websiteId: string;
  question: string;
}

export interface ChatSource {
  url: string;
  chunkIndex: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export class ChatService {
  private static genAI: GoogleGenerativeAI | null = null;

  /**
   * Lazily initializes and reuses a single instance of the Google Generative AI client.
   */
  private static getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      if (!config.geminiApiKey) {
        throw new Error('Gemini API key is not configured.');
      }
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
    return this.genAI;
  }

  /**
   * Orchestrates the complete RAG answer generation pipeline.
   *
   * @param request The chat request containing websiteId and question.
   * @returns The generated answer and sources.
   */
  public static async generateAnswer(request: ChatRequest): Promise<ChatResponse> {
    // 1. Validate inputs
    const { websiteId, question } = request;

    if (!websiteId || typeof websiteId !== 'string' || websiteId.trim().length === 0) {
      throw new Error('Invalid websiteId provided.');
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new Error('Invalid question provided.');
    }

    try {
      // 2. Retrieve relevant chunks
      const retrievedChunks = await RetrievalService.searchSimilarChunks(websiteId, question);

      // 3. Handle case with no retrieved chunks
      if (!retrievedChunks || retrievedChunks.length === 0) {
        return {
          answer: "I couldn't find that information in the provided website.",
          sources: []
        };
      }

      // 4. Build prompt using retrieved chunks
      const prompt = PromptService.buildPrompt(question, retrievedChunks);

      // 5. Send prompt to Gemini Chat API
      const client = this.getClient();
      const chatModel = config.geminiChatModel;
      const model = client.getGenerativeModel({ model: chatModel });

      const result = await model.generateContent(prompt);
      let answer = result.response.text();
      
      // Clean up any newline characters from the response to ensure plain, continuous text
      if (answer) {
        answer = answer.replace(/\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
      }

      if (!answer || answer.trim().length === 0) {
        throw new Error('Gemini returned an empty response.');
      }

      // 6. Map the sources and remove duplicate URLs
      const uniqueUrls = new Set<string>();
      const sources: ChatSource[] = [];
      
      for (const chunk of retrievedChunks) {
        if (!uniqueUrls.has(chunk.url)) {
          uniqueUrls.add(chunk.url);
          sources.push({
            url: chunk.url,
            chunkIndex: chunk.chunkIndex
          });
        }
      }

      return {
        answer,
        sources
      };
    } catch (error: any) {
      console.error(`[ChatService] Error generating answer for website ${websiteId}:`, error);
      throw new Error(`Failed to generate answer: ${error.message || 'Unknown error'}`);
    }
  }
}
