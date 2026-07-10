import mongoose, { Schema, Document } from 'mongoose';

export interface IWebsite extends Document {
  url: string;
  domain: string;
  title?: string;
  status: 'pending' | 'crawling' | 'completed' | 'failed';
  totalPages: number;
  crawledPages: number;
  lastCrawledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSchema = new Schema<IWebsite>(
  {
    url: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'crawling', 'completed', 'failed'],
      default: 'pending',
    },
    totalPages: {
      type: Number,
      default: 0,
    },
    crawledPages: {
      type: Number,
      default: 0,
    },
    lastCrawledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Website = mongoose.model<IWebsite>('Website', WebsiteSchema);
