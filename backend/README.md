# Chat with Website Application

This project allows users to crawl a website, generate embeddings from its content, and chat with an AI assistant that uses the crawled data to answer questions accurately. It is split into a **Next.js** frontend and a **Node.js/Express** backend.

## How to Run It

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (must support Atlas Vector Search)
- Gemini API Key

### 1. Backend Setup
Navigate to the backend directory and configure the server:

```bash
cd "Chat Website/backend"
npm install
```

Create a `.env` file in the backend root directory with the following required variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_CHAT_MODEL=gemini-3.1-flash-lite
```

Start the backend development server:
```bash
npm run dev
```

### 2. Frontend Setup
Navigate to the frontend directory and start the UI:

```bash
cd "Chat Website UI"
npm install
```

Create a `.env` file in the frontend root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

---

## Technical Overview

### Crawling Strategy
We utilize **Crawlee's `CheerioCrawler`** for lightweight, fast, and scalable  website crawling.
- **Scoping**: The crawler is strictly limited to the base domain using `EnqueueStrategy.SameDomain`, ensuring it doesn't wander off to external sites.
- **Resource Filtering**: We ignore media files, documents, and assets by aggressively filtering common extensions (e.g., `.png`, `.jpg`, `.pdf`, `.mp4`, `.css`, `.js`).
- **Extraction**: As pages are discovered, the HTML is parsed using Cheerio to strip away markup and extract pure textual content .

### Chunking & Retrieval Approach
- **Chunking**: Extracted page text can be too large for an LLM context window. We use `@langchain/textsplitters` (`RecursiveCharacterTextSplitter`) to intelligently break down the text into smaller, overlapping chunks that preserve semantic meaning.
- **Embedding Generation**: Each text chunk is passed through the Gemini embedding model (`gemini-embedding-2`) to generate vector representations.
- **Vector Storage**: The chunks and their corresponding vectors are saved into a MongoDB Atlas database.
- **Retrieval**: When a user asks a question, we generate a vector embedding for the query and perform a **MongoDB Atlas Vector Search** (`$vectorSearch`). This search evaluates candidate chunks by cosine similarity (or similar metric) and returns the top 5 most relevant pieces of context.

### Grounding (Preventing Hallucinations)
To ensure the LLM answers factually and stays within the scope of the crawled website, we use a strict Retrieval-Augmented Generation (RAG) approach:
1. **Context Injection**: The top chunks retrieved from the vector search are appended directly into the LLM prompt.
2. **Strict Instructions**: The system prompt explicitly commands the model to:
   - *"Answer ONLY using the provided context."*
   - *"Do not make up information."*
   - *"If the answer cannot be found in the context, respond: 'I couldn't find that information in the provided website.'"*
3. **Empty Context Handling**: If the semantic search yields no relevant chunks, the prompt dynamically injects `[No context available for this website.]` to guarantee the fallback response is triggered instead of a hallucination.
