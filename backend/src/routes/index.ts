import { Router } from 'express';
import exampleRoutes from './example.routes';
import crawlRoutes from './crawl.routes';

import chatRoutes from './chat.routes';

const router = Router();

router.use('/example', exampleRoutes);
router.use('/crawl', crawlRoutes);
router.use('/chat', chatRoutes);

export default router;
