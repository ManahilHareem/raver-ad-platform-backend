import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as chatService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const chat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    let { session_id, message, website_url, tag } = req.body;
    const userId = req.user?.id;
    
    // Auto-generate session_id if not provided
    if (!session_id || session_id.trim() === '') {
      session_id = uuidv4();
    }

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required.' });
    }

    const result = await chatService.sendMessage(session_id, message, website_url);

    // Persist tags if provided and authenticated
    if (userId) {
      await (prisma as any).aISession.upsert({
        where: { sessionId: session_id },
        update: { tag: tag || undefined },
        create: {
          userId,
          sessionId: session_id,
          tag: tag || null,
          type: 'chat'
        }
      });
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[ChatController]', error);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Error communicating with AI service' });
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const result = await chatService.getChatHistory(session_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[ChatController]', error);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Error fetching chat history' });
  }
};

export const deleteChatSession = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const result = await chatService.deleteSession(session_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[ChatController]', error);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Error deleting session' });
  }
};

export const listSessionsByTag = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { tag } = req.query;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const sessions = await (prisma as any).aISession.findMany({
      where: {
        userId,
        tag: tag ? (tag as string) : undefined
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: sessions });
  } catch (error: any) {
    console.error('[ChatController]', error);
    return res.status(500).json({ success: false, message: error.message || 'Error listing sessions' });
  }
};
