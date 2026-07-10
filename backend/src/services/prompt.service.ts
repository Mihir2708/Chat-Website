import { RetrievedChunk } from './retrieval.service';

export class PromptService {
  /**
   * Builds a high-quality RAG prompt using the user's question and the retrieved chunks.
   *
   * @param question The user's question.
   * @param chunks The semantic chunks retrieved from the database.
   * @returns A complete prompt string ready to be sent directly to the LLM.
   */
  public static buildPrompt(question: string, chunks: RetrievedChunk[]): string {
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new Error('Question must be a valid non-empty string.');
    }

    const systemInstructions = 
`You are an AI assistant.

Answer ONLY using the provided context.

If the answer cannot be found in the context, respond:

"I couldn't find that information in the provided website."

Do not make up information.
Do NOT use Markdown formatting (no asterisks, bolding, or bullet points). Provide your answer in clear, plain text.`;

    // 6. If chunks are empty, generate a prompt informing the LLM that no context is available.
    if (!chunks || chunks.length === 0) {
      return `${systemInstructions}\n\nContext:\n\n[No context available for this website.]\n\n----------------------------------\n\nQuestion:\n\n${question.trim()}\n\nAnswer:\n`;
    }

    let contextSection = 'Context:\n\n';

    // 7. Preserve chunk order returned from RetrievalService
    chunks.forEach((chunk, index) => {
      // 8. Include URL and Content (exclude embedding, score, pageId, websiteId)
      contextSection += `[Chunk ${index + 1}]\n\nSource:\n${chunk.url}\n\nContent:\n${chunk.content.trim()}\n\n----------------------------------\n\n`;
    });

    const finalPrompt = `${systemInstructions}\n\n${contextSection}Question:\n\n${question.trim()}\n\nAnswer:\n`;

    return finalPrompt;
  }
}
