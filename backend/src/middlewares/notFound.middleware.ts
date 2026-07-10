import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `${ERROR_MESSAGES.NOT_FOUND} - ${req.originalUrl}`));
};
