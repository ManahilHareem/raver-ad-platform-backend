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

const voiceOptions = [
  "adam", "arnold", "callum", "clyde", "daniel", "george", "james", "joseph", "liam", "michael",
  "antoni", "charlie", "drew", "ethan", "fin", "harry", "jeremy", "josh", "patrick", "sam", "thomas",
  "charlotte", "domi", "dorothy", "emily", "rachel", "sarah", "alice", "matilda",
  "elli", "freya", "gigi", "grace", "jessica", "lily", "nicole"
];

const detectVoice = (message: string): string | null => {
  if (!message) return null;
  const lowerMsg = message.toLowerCase();
  for (const voice of voiceOptions) {
    const regex = new RegExp(`\\b${voice}\\b`, 'i');
    if (regex.test(lowerMsg)) {
      return voice;
    }
  }
  return null;
};

export const chat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id, campaign_id, message } = req.body;
    const lookupId = session_id || campaign_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Load context from DB if it's an existing session
    let existingHistory: any[] = [];
    let existingMetadata: any = {};
    if (lookupId) {
      const session = await (prisma as any).aISession.findUnique({ where: { sessionId: lookupId } });
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
    const finalId = lookupId || result.session_id;
    const campaignIdToSave = campaign_id || result.campaign_id;

    if (finalId) {
      const merged = mergeMetadata(existingMetadata, { ...result, history: finalHistory });
      await (prisma as any).aISession.upsert({
        where: { sessionId: finalId },
        update: { metadata: merged, type: 'director', campaignId: campaignIdToSave },
        create: {
          userId,
          sessionId: finalId,
          type: 'director',
          metadata: merged,
          campaignId: campaignIdToSave
        }
      });
    }

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

    const cleanId = (session_id as string).includes('_') ? (session_id as string).split('_')[0] : session_id;
    const result = await directorService.getSession(cleanId as string);

    if (userId && session_id) {
      const isMissing = result.message?.includes('No active campaign') || (result.status === null && result.campaign_id === null);
      if (isMissing) {
        return res.json({ success: true, data: result });
      }

      const local = await (prisma as any).aISession.findUnique({ where: { sessionId: session_id as string } });
      const merged = mergeMetadata(null, result);
      
      // Ensure the metadata reflects our versioned ID, not the base ID from the service
      merged.session_id = session_id;
      
      // If the proxy doesn't report ready, we assume it's still in production
      if (result.status !== 'ready_for_human_review') {
        merged.production = merged.production || {};
        merged.production.status = 'in_production';
      }

      const campaignIdToSave = result.campaign_id || (typeof session_id === 'string' && !session_id.includes('_') ? session_id : (local?.campaignId || null));

      await (prisma as any).aISession.upsert({
        where: { sessionId: session_id as string },
        update: { metadata: merged, userId, campaignId: campaignIdToSave },
        create: {
          userId,
          sessionId: session_id as string,
          type: 'director',
          metadata: merged,
          campaignId: campaignIdToSave
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
    // If it's a versioned session (has _timestamp), we strip the suffix for the external proxy
    const cleanId = (session_id as string).includes('_') ? (session_id as string).split('_')[0] : session_id;
    const result = await directorService.getUpdate(cleanId as string);

    // 2. Conditional Persistence: Only save to DB if it's ready for review (Production complete)
    // As per user request: "if it is 'ready_for_human_review' than add it to db"
    if (userId && session_id) {
      const isMissing = result.message?.includes('No active campaign') || (result.status === null && result.campaign_id === null);
      if (isMissing) {
        return res.json({ success: true, data: result });
      }

      const existing = await (prisma as any).aISession.findUnique({ where: { sessionId: session_id as string } });
      const merged = mergeMetadata(existing?.metadata, result);
      
      // Ensure the metadata reflects our versioned ID, not the base ID from the service
      merged.session_id = session_id;

      // Force production status if the campaign is not yet finalized
      if (result.status !== 'ready_for_human_review') {
        merged.production = merged.production || {};
        merged.production.status = 'in_production';
      }

      const campaignIdToSave = result.campaign_id || (typeof session_id === 'string' && !session_id.includes('_') ? session_id : (existing?.campaignId || null));

      await (prisma as any).aISession.upsert({
        where: { sessionId: session_id as string },
        update: { metadata: merged, userId, campaignId: campaignIdToSave },
        create: {
          userId,
          sessionId: session_id as string,
          type: 'director',
          metadata: merged,
          campaignId: campaignIdToSave
        }
      });
      console.log(`[AIDirector] Session ${session_id} updated in local database.`);
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

    // Deduplicate by campaignId (checking column, metadata, or sessionId prefix)
    // Only shows the latest session for each unique campaign/conversation
    const deduplicated = sessions.reduce((acc: any, current: any) => {
      const metadata = (current.metadata as any) || {};
      const groupKey = current.campaignId || metadata.campaign_id || current.sessionId.split('_')[0];

      if (!acc[groupKey] || new Date(current.createdAt) > new Date(acc[groupKey].createdAt)) {
        acc[groupKey] = current;
      }
      return acc;
    }, {});

    const formatted = Object.values(deduplicated).map((s: any) => {
      const metadata = (s.metadata as any) || {};
      const history = metadata.history || [];
      const prompt = history.find((m: any) => m.role === 'user')?.content || '';

      return {
        ...metadata,
        session_id: s.sessionId,
        campaign_id: s.campaignId || metadata.campaign_id,
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

    const localSession = await (prisma as any).aISession.findFirst({
      where: {
        OR: [
          { sessionId: session_id as string },
          { campaignId: session_id as string }
        ]
      }
    });

    if (localSession && localSession.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this session.' });
    }

    // The service now handles the database deletion using deleteMany for safety
    const result = await directorService.deleteSession(session_id as string);

    return res.json(result);
  } catch (error: any) {
    console.error('[AIDirectorController] Error deleting session:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete session'
    });
  }
};

export const regenerateChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id, message } = req.body;
    const lookupId = session_id ;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Load the existing session from DB using campaignId
    //    session_id from request = campaignId in DB
    let existingHistory: any[] = [];
    let existingMetadata: any = {};
    let existingSession: any = null;
    if (lookupId) {
      existingSession = await (prisma as any).aISession.findFirst({
        where: { campaignId: lookupId, type: 'director' },
        orderBy: { createdAt: 'desc' }
      });

      if (existingSession) {
        existingMetadata = existingSession.metadata || {};
        existingHistory = Array.isArray(existingMetadata.history) ? existingMetadata.history : [];
      }
    }

    // 2. Append User Message
    const userMessage = { role: 'user', content: message || req.body.content };
    const updatedHistory = [...existingHistory, userMessage];

    // 3. Request AI response
    const aiRequestPayload = {
      message,
      session_id: existingSession?.sessionId,
      campaign_id: existingSession?.campaignId,
      history: updatedHistory
    };
    const result = await directorService.regenerateChat(aiRequestPayload);

    // Capture explicit parameter overrides like voice from the newest user text
    const detectedVoice = detectVoice(userMessage.content);
    if (detectedVoice) {
      if (!result.brief_draft) result.brief_draft = {};
      result.brief_draft.voice = detectedVoice;
      result.voice = detectedVoice;
    }

    // 4. Append Assistant Message
    const assistantMessage = {
      role: 'assistant',
      content: result.message || result.content || (typeof result === 'string' ? result : JSON.stringify(result))
    };
    const finalHistory = [...updatedHistory, assistantMessage];

    // 5. Update the SAME session in DB — no new records, just update in place
    const isRejected = typeof result.response === 'string' && result.response.includes("couldn't apply that revision right now");

    if (!isRejected && existingSession) {
      const merged = mergeMetadata(existingMetadata, { ...result, history: finalHistory });

      // Force status to 'in_production' since we just triggered a regeneration
      merged.production = merged.production || {};
      merged.production.status = 'in_production';
      merged.campaign_status = 'in_production';
      merged.status = 'in_production';

      await (prisma as any).aISession.update({
        where: { sessionId: existingSession.sessionId },
        data: { metadata: merged }
      });

      return res.json({ success: true, data: merged });
    }

    return res.json({ success: true, data: { ...result, history: finalHistory } });
  } catch (error: any) {
    console.error('[AIDirectorController] Chat Error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};