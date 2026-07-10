import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { crawlUrl } from '../services/crawl.service';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants';
import { ApiResponse } from '../utils/ApiResponse';

export const startCrawl = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;

  const result = await crawlUrl(url);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(SUCCESS_MESSAGES.CRAWL_SUCCESS, result));
});
