import { Response } from 'express';
import * as directorService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

/**
 * Helper to safely merge existing metadata with new results from the AI service.
 * Ensures chat history and production assets are preserved.
 */
const mergeMetadata = (existing: any, incoming: any) => {
  const base = (existing as any) || {};
  const data = incoming.data || incoming;

  return {
    ...base,
    ...data,
    production: {
      ...(base.production || {}),
      ...(data.production || (data.video_url ? data : {})),
    },
    history: data.history || base.history || [],
    brief_draft: data.brief_draft || base.brief_draft || {}
  };
};

export const chat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id, message } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Load context from DB if it's an existing session
    let existingHistory: any[] = [];
    let existingMetadata: any = {};
    if (session_id) {
      const session = await (prisma as any).aISession.findUnique({ where: { sessionId: session_id } });
      if (session) {
        existingMetadata = session.metadata || {};
        existingHistory = Array.isArray(existingMetadata.history) ? existingMetadata.history : [];
      }
    }

    // 2. Append User Message
    const userMessage = { role: 'user', content: message || req.body.content };
    const updatedHistory = [...existingHistory, userMessage];

    // 3. Request AI response
    const aiRequestPayload = {
      ...req.body,
      history: updatedHistory
    };
    const result = await directorService.chat(aiRequestPayload);

    // 4. Append Assistant Message
    const assistantMessage = {
      role: 'assistant',
      content: result.message || result.content || (typeof result === 'string' ? result : JSON.stringify(result))
    };
    const finalHistory = [...updatedHistory, assistantMessage];

    // 5. Persist to DB (Source of Truth for Conversation)
    const sessionId = session_id || result.session_id;
    const merged = mergeMetadata(existingMetadata, { ...result, history: finalHistory });

    await (prisma as any).aISession.upsert({
      where: { sessionId },
      update: { metadata: merged, type: 'director' },
      create: {
        userId,
        sessionId,
        type: 'director',
        metadata: merged
      }
    });

    return res.json({ success: true, data: { ...result, history: finalHistory } });
  } catch (error: any) {
    console.error('[AIDirectorController] Chat Error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getSession = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    if (userId) {
      const localSession = await (prisma as any).aISession.findUnique({
        where: { sessionId: session_id as string }
      });
      if (localSession && localSession.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this session.' });
      }
    }

    const local = await (prisma as any).aISession.findUnique({ where: { sessionId: session_id as string } });
    if (local) {
      const metadata = (local.metadata as any) || {};
      const history = metadata.history || [];
      const prompt = history.find((m: any) => m.role === 'user')?.content || '';
      
      return res.json({ 
        success: true, 
        data: {
          ...metadata,
          prompt
        } 
      });
    }

    const result = await directorService.getSession(session_id as string);

    if (userId && session_id) {
      const merged = mergeMetadata(null, result);
      await (prisma as any).aISession.upsert({
        where: { sessionId: session_id as string },
        update: { metadata: merged, userId },
        create: {
          userId,
          sessionId: session_id as string,
          type: 'director',
          metadata: merged
        }
      });
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getUpdate = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    // 1. Fetch latest state from AI Proxy
    const result = await directorService.getUpdate(session_id as string);

    // 2. Conditional Persistence: Only save to DB if it's ready for review (Production complete)
    // As per user request: "if it is 'ready_for_human_review' than add it to db"
    if (userId && session_id && result.status === 'ready_for_human_review') {
      const existing = await (prisma as any).aISession.findUnique({ where: { sessionId: session_id as string } });
      const merged = mergeMetadata(existing?.metadata, result);

      await (prisma as any).aISession.upsert({
        where: { sessionId: session_id as string },
        update: { metadata: merged, userId },
        create: {
          userId,
          sessionId: session_id as string,
          type: 'director',
          metadata: merged
        }
      });
      console.log(`[AIDirector] Session ${session_id} finalized in local database.`);
    }

    // Always return the live proxy result to the frontend (even if not finalized)
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const listSessions = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const sessions = await (prisma as any).aISession.findMany({
      where: {
        userId,
        type: 'director'
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = sessions.map((s: any) => {
      const metadata = (s.metadata as any) || {};
      const history = metadata.history || [];
      const prompt = history.find((m: any) => m.role === 'user')?.content || '';

      return {
        ...metadata,
        session_id: s.sessionId,
        created_at: s.createdAt,
        prompt
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const localSession = await (prisma as any).aISession.findUnique({
      where: { sessionId: session_id as string }
    });

    if (localSession && localSession.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this session.' });
    }

    if (localSession) {
      await (prisma as any).aISession.delete({
        where: { sessionId: session_id as string }
      });
    }

    const result = await directorService.deleteSession(session_id as string);

    return res.json({
      success: true,
      message: 'Session deleted successfully',
      data: result
    });
  } catch (error: any) {
    console.error('[AIDirectorController] Error deleting session:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete session'
    });
  }
};
