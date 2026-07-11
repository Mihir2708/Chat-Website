import app from '../src/app';
import { connectDatabase } from '../src/config/database';

export default async (req: any, res: any) => {
    // Ensure DB connection is established before processing the request
    await connectDatabase();
    
    // Delegate the request to the Express app
    return app(req, res);
};