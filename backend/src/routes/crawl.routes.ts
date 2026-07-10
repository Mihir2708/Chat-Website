import { Router } from 'express';
import { startCrawl } from '../controllers/crawl.controller';
import { crawlValidator } from '../validators/crawl.validator';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.post('/', crawlValidator, validate, startCrawl);

export default router;
