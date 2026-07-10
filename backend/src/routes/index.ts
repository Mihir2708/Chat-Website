import { Router } from 'express';
import exampleRoutes from './example.routes';
import crawlRoutes from './crawl.routes';

const router = Router();

router.use('/example', exampleRoutes);
router.use('/crawl', crawlRoutes);

export default router;
