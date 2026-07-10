import { Router } from 'express';
import { getExample, createExample } from '../controllers/example.controller';
import { exampleValidator } from '../validators/example.validator';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.get('/', getExample);
router.post('/', exampleValidator, validate, createExample);

export default router;
