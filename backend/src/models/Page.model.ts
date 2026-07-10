import mongoose, { Schema, Document } from 'mongoose';
import { IWebsite } from './Website.model';

export interface IPage extends Document {
  websiteId: mongoose.Types.ObjectId | IWebsite;
  url: string;
  title: string;
  content: string;
  contentLength: number;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    contentLength: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure URL uniqueness per website
PageSchema.index({ websiteId: 1, url: 1 }, { unique: true });

export const Page = mongoose.model<IPage>('Page', PageSchema);
