import mongoose from 'mongoose';
import config from './index';

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!config.mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    // Check if we are already connected to reuse the existing connection in serverless environment
    if (mongoose.connection.readyState === 1) {
      return;
    }

    const connection = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Throw error instead of process.exit(1) to avoid killing the serverless instance
    throw error;
  }
};
