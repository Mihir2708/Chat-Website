import { PromptService } from "../services/prompt.service";
import { RetrievedChunk } from "../services/retrieval.service";

function testPromptService() {
  const question = "What service you provide?";

  const chunks: RetrievedChunk[] = [
    {
      pageId: "6a50c433f1e1f549efb770f9",
      websiteId: "6a50c42af1e1f549efb770f0",
      url: "https://nectarbits.com/software-development-service.shtml",
      chunkIndex: 0,
      content: "We provide Web Development and Mobile App Development.",
      score: 0.95,
    },
    {
      pageId: "page2",
      websiteId: "website1",
      url: "https://example.com/about",
      chunkIndex: 1,
      content: "We also offer UI/UX Design and Consulting.",
      score: 0.91,
    },
  ];

  try {
    const prompt = PromptService.buildPrompt(question, chunks);

    console.log("========== GENERATED PROMPT ==========\n");
    console.log(prompt);
    console.log("\n========== END ==========");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testPromptService();