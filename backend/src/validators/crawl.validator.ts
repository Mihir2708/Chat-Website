import { body } from 'express-validator';

export const crawlValidator = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage('Website URL is required.')
    .isURL({
      protocols: ['http', 'https'],
      require_protocol: true,
    })
    .withMessage('Please provide a valid website URL.'),
];
