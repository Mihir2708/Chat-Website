import mongoose, { Schema, Document } from 'mongoose';

export interface IChunk extends Document {
  websiteId: string;
  pageId: string;
  url: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const ChunkSchema = new Schema<IChunk>(
  {
    websiteId: {
      type: String,
      required: true,
      index: true,
    },
    pageId: {
      type: String,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'website_chunks', // Explicitly setting collection name as requested
  }
);

// Unique compound index to avoid duplicate chunks per page
ChunkSchema.index({ pageId: 1, chunkIndex: 1 }, { unique: true });

export const ChunkModel = mongoose.model<IChunk>('Chunk', ChunkSchema);
