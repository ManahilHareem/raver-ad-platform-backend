import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as chatService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const chat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    let { session_id, message, website_url, tag = ""  } = req.body;
    const userId = req.user?.id;

    // Auto-generate session_id if not provided
    if (!session_id || session_id.trim() === '') {
      session_id = uuidv4();
    }

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required.' });
    }

    // 1. Load context from DB if it's an existing session
    let existingHistory: any[] = [];
    if (session_id) {
      const session = await (prisma as any).aISession.findUnique({ where: { sessionId: session_id } });
      if (session) {
        existingHistory = session.metadata?.history || [];
      }
    }

    // 2. Append User Message to Local History
    const userMessage = { role: 'user', content: message };
    const updatedHistory = [...existingHistory, userMessage];

    // 3. Request AI response with full context
    const result = await chatService.sendMessage(session_id, message, website_url, updatedHistory);

    // 4. Append Assistant Message to Local History
    const aiMessage = result.response || result.message || result.content || (typeof result === 'string' ? result : '');
    const assistantMessage = { role: 'assistant', content: aiMessage };
    const finalHistory = [...updatedHistory, assistantMessage];

    // 5. Persist to DB (Source of Truth)
    if (userId) {
      await (prisma as any).aISession.upsert({
        where: { sessionId: session_id },
        update: { 
          tag: tag || undefined,
          metadata: { history: finalHistory }
        },
        create: {
          userId,
          sessionId: session_id,
          tag: tag || null,
          type: 'chat',
          metadata: { history: finalHistory }
        }
      });
    }

    return res.json({ success: true, data: { ...result, history: finalHistory } });
  } catch (error: any) {
    console.error('[ChatController] Error in chat:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Error communicating with AI service' });
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    // 1. Flexible session lookup (matches id or sessionId)
    const sid = String(session_id);
    let session = await (prisma as any).aISession.findUnique({
      where: { sessionId: sid }
    });

    if (!session && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sid)) {
      session = await (prisma as any).aISession.findUnique({
        where: { id: sid }
      });
    }

    if (session) {
      // Enforce ownership if authenticated
      if (userId && session.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this session.' });
      }

      // Only allow "chat" type for this endpoint
      if (session.type !== 'chat') {
        return res.status(400).json({ success: false, message: 'This session is not a standard chat session.' });
      }

      // Return local history if available
      if (session.metadata?.history) {
        const prompt = session.metadata.history.find((m: any) => m.role === 'user')?.content || '';
        return res.json({ 
          success: true, 
          data: { 
            history: session.metadata.history,
            prompt 
          } 
        });
      }
    }

    const result = await chatService.getChatHistory(session_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[ChatController] Error fetching chat history:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Error fetching chat history' });
  }
};

export const deleteChatSession = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Flexible session lookup (matches id or sessionId)
    const sid = String(session_id);
    let session = await (prisma as any).aISession.findUnique({
      where: { sessionId: sid }
    });

    if (!session && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sid)) {
      session = await (prisma as any).aISession.findUnique({
        where: { id: sid }
      });
    }

    if (session && session.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this session.' });
    }

    // 2. Perform deletion from local DB
    if (session) {
      await (prisma as any).aISession.delete({
        where: { id: session.id }
      });
    }

    const result = await chatService.deleteSession(session_id as string);
    return res.json({ 
      success: true, 
      message: 'Chat session deleted successfully',
      data: result 
    });
  } catch (error: any) {
    console.error('[ChatController] Error deleting chat session:', error);
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
        tag: tag ? (tag as string) : undefined,
        type: 'chat'
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: sessions });
  } catch (error: any) {
    console.error('[ChatController] Error listing sessions:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error listing sessions' });
  }
};

export const newChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const tag = req.body?.tag || null;
    const session_id = uuidv4();

    if (userId) {
      await (prisma as any).aISession.create({
        data: {
          userId,
          sessionId: session_id,
          tag: tag || null,
          type: 'chat',
          metadata: { history: [] }
        }
      });
    }

    return res.json({ 
      success: true, 
      data: { 
        session_id,
        message: 'New session initialized',
        history: []
      } 
    });
  } catch (error: any) {
    console.error('[ChatController] Error creating new session:', error);
    return res.status(500).json({ success: false, message: 'Failed to initialize new session' });
  }
};
