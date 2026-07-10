import { Router } from 'express';
import { generateAnswer } from '../controllers/chat.controller';

const router = Router();

// Registers POST / so that when mounted on /chat, the resulting endpoint is /api/chat
router.post('/', generateAnswer);

export default router;
