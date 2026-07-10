import mongoose from 'mongoose';
import { ChunkModel } from '../models/Chunk.model';
import config from '../config';

async function run() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  const websiteId = "6a50a388f1e1f549efb761e2";

  // 1. Check if chunks exist for this website at all
  const count = await ChunkModel.countDocuments({ websiteId });
  console.log(`Total chunks for website ${websiteId}:`, count);

  if (count > 0) {
    const sample = await ChunkModel.findOne({ websiteId });
    console.log('Sample chunk embedding length:', sample?.embedding?.length);
  }

  // 2. Try $vectorSearch without filter to see if index works
  try {
    const dummyEmbedding = new Array(768).fill(0.1); // Assuming 768 dims for text-embedding-004
    const chunks = await ChunkModel.aggregate([
      {
        $vectorSearch: {
          index: 'default', 
          path: 'embedding',
          queryVector: dummyEmbedding,
          numCandidates: 10,
          limit: 2
        }
      }
    ]);
    console.log('$vectorSearch WITHOUT filter returned:', chunks.length, 'chunks');
  } catch (e: any) {
    console.log('$vectorSearch WITHOUT filter error:', e.message);
  }

  // 3. Try $vectorSearch WITH filter to see if it fails
  try {
    const dummyEmbedding = new Array(768).fill(0.1);
    const chunks = await ChunkModel.aggregate([
      {
        $vectorSearch: {
          index: 'default', 
          path: 'embedding',
          queryVector: dummyEmbedding,
          numCandidates: 10,
          limit: 2,
          filter: { websiteId }
        }
      }
    ]);
    console.log('$vectorSearch WITH filter returned:', chunks.length, 'chunks');
  } catch (e: any) {
    console.log('$vectorSearch WITH filter error:', e.message);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
