import { EmbeddingService } from "../services/embedding.service";

async function testEmbedding() {
  const chunks = [
    {
      pageId: "page1",
      websiteId: "website1",
      url: "https://example.com",
      chunkIndex: 0,
      content: "Next.js uses file based routing and React components."
    }
  ];

  try {
    const result = await EmbeddingService.generateEmbeddings(chunks);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testEmbedding();
