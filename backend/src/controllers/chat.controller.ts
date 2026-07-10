import { Request, Response, NextFunction } from 'express';
import { ChatService, ChatRequest } from '../services/chat.service';
import { asyncHandler } from '../utils/asyncHandler';

export const generateAnswer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { websiteId, question } = req.body;

  // 1. Validate required fields
  if (
    !websiteId || 
    !question || 
    typeof websiteId !== 'string' || 
    typeof question !== 'string' || 
    websiteId.trim() === '' || 
    question.trim() === ''
  ) {
    return res.status(400).json({
      success: false,
      message: 'websiteId and question are required.'
    });
  }

  try {
    // 2. Call ChatService
    const chatRequest: ChatRequest = { 
      websiteId: websiteId.trim(), 
      question: question.trim() 
    };
    const chatResponse = await ChatService.generateAnswer(chatRequest);

    // 3. Return HTTP response
    res.status(200).json({
      success: true,
      message: 'Answer generated successfully.',
      data: chatResponse
    });
  } catch (error: any) {
    // 4. Catch unexpected errors
    console.error('[ChatController] Error generating answer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});
