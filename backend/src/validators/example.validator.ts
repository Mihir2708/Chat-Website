import { body } from 'express-validator';

export const exampleValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string'),
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
];
