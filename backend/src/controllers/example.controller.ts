import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { processExampleData } from '../services/example.service';
import { HTTP_STATUS } from '../constants';

export const getExample = asyncHandler(async (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Example fetched successfully',
    data: { hello: 'world' },
  });
});

export const createExample = asyncHandler(async (req: Request, res: Response) => {
  const result = await processExampleData(req.body);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Example created successfully',
    data: result,
  });
});
