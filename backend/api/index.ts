import app from '../src/app';
import { connectDatabase } from '../src/config/database';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
    // Ensure DB connection is established before processing the request
    await connectDatabase();
    
    // Delegate the request to the Express app
    return app(req as any, res as any);
};