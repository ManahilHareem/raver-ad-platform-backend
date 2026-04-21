import { Response } from 'express';
import * as directorService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';
import { createNotification } from '../notification/service';

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
    const { session_id, campaign_id, message, assets } = req.body;
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
    const userMessage = {
      role: 'user',
      content: message || req.body.content,
      assets: assets || []
    };
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

      // Explicitly track the assets in metadata if provided
      if (assets) {
        merged.assets = assets;
      }

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

    return res.json({ success: true, data: { ...result, history: finalHistory, assets } });
  } catch (error: any) {
    console.error('[AIDirectorController] Chat Error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const approveSession = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;
    console.log("req.body", req.body);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Sync to local DB
    let result: any = { status: 'approved' };
    if (session_id) {
      const session = await (prisma as any).aISession.findUnique({
        where: { sessionId: session_id as string }
      });

      if (session) {
        if (session.userId !== userId) {
          return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const merged = mergeMetadata(session.metadata, {
          status: 'approved',
          production: { status: 'approved' }
        });

        // Update Session
        const updatedSession = await (prisma as any).aISession.update({
          where: { sessionId: session_id as string },
          data: { metadata: merged }
        });

        // Update linked Campaign and ProducerResult if they exist
        const campaignId = session.campaignId || (session.metadata as any)?.campaign_id;
        if (campaignId) {
          try {
            await (prisma as any).campaign.updateMany({
              where: { id: campaignId },
              data: { status: 'approved' }
            });
            
            await (prisma as any).producerResult.updateMany({
              where: { campaignId: campaignId },
              data: { status: 'approved' }
            });
          } catch (dbError) {
            console.error('[AIDirectorController] Sync status update failed:', dbError);
          }
        }

        // Trigger notification
        await createNotification({
          userId,
          type: 'AI_DIRECTOR_APPROVED',
          title: 'Production Approved',
          message: `Your production session ${session_id} has been approved and status updated.`,
          metadata: { sessionId: session_id, campaignId }
        });

        result = updatedSession;
      }
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AIDirectorController] Approval Error:', error);
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
    let result: any;
    try {
      result = await directorService.getSession(cleanId as string);
    } catch (proxyError: any) {
      console.warn(`[AIDirector] Proxy session fetch failed for ${session_id}, returning local data.`);
      if (local) {
        const metadata = (local.metadata as any) || {};
        const history = metadata.history || [];
        const prompt = history.find((m: any) => m.role === 'user')?.content || '';
        return res.json({ success: true, data: { ...metadata, prompt } });
      }
      throw proxyError;
    }

    if (userId && session_id) {
      const isMissing = result.message?.includes('No active campaign') || (result.status === null && result.campaign_id === null);
      if (isMissing) {
        if (local) {
          const metadata = (local.metadata as any) || {};
          const history = metadata.history || [];
          const prompt = history.find((m: any) => m.role === 'user')?.content || '';
          return res.json({ success: true, data: { ...metadata, prompt } });
        }
        return res.json({ success: true, data: result });
      }

      const merged = mergeMetadata(local?.metadata, result);

      // Ensure the metadata reflects our versioned ID, not the base ID from the service
      merged.session_id = session_id;

      // If the proxy doesn't report ready, we assume it's still in production
      if (result.status !== 'ready_for_human_review') {
        merged.production = merged.production || {};
        merged.production.status = 'in_production';
      }

      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const campaignIdToSave = result.campaign_id || (typeof session_id === 'string' && isUuid(session_id) ? session_id : (local?.campaignId || null));

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

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    // 1. Check local DB first for existing data (Avoid proxy if already terminal)
    const local = await (prisma as any).aISession.findUnique({ where: { sessionId: session_id as string } });
    if (local) {
      if (userId && local.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const metadata = (local.metadata as any) || {};
      const status = metadata.status || metadata.production?.status || (metadata.campaign_status);

      // If already approved or ready, return local state without redundant proxy hit
      if (status === 'approved' || status === 'ready_for_human_review') {
        return res.json({
          success: true,
          data: {
            ...metadata,
            session_id: local.sessionId,
            campaign_id: local.campaignId,
            status: status
          }
        });
      }
    }

    // 2. Fetch latest state from AI Proxy
    const cleanId = (session_id as string).includes('_') ? (session_id as string).split('_')[0] : session_id;
    let result: any;
    try {
      result = await directorService.getUpdate(cleanId as string);
    } catch (proxyError: any) {
      console.warn(`[AIDirector] Proxy call failed for ${session_id}, returning local data.`);
      if (local) return res.json({ success: true, data: local.metadata });
      throw proxyError;
    }

    // 3. Conditional Persistence: Only save to DB if it's ready for review (Production complete)
    if (userId && session_id) {
      const isMissing = result.message?.includes('No active campaign') || (result.status === null && result.campaign_id === null);
      if (isMissing) {
        // If proxy doesn't see it but we do, return local. Otherwise return proxy message.
        if (local) return res.json({ success: true, data: local.metadata });
        return res.json({ success: true, data: result });
      }

      const existing = local || await (prisma as any).aISession.findUnique({ where: { sessionId: session_id as string } });
      const merged = mergeMetadata(existing?.metadata, result);

      merged.session_id = session_id;

      if (result.status !== 'ready_for_human_review') {
        merged.production = merged.production || {};
        merged.production.status = 'in_production';
      }

      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const campaignIdToSave = result.campaign_id || (typeof session_id === 'string' && isUuid(session_id) ? session_id : (existing?.campaignId || null));

      // Detect shift to ready_for_human_review and notify
      const oldStatus = existing?.metadata ? (existing.metadata as any).status || (existing.metadata as any).production?.status : null;
      if (result.status === 'ready_for_human_review' && oldStatus !== 'ready_for_human_review') {
        await createNotification({
          userId,
          type: 'AI_DIRECTOR_READY',
          title: 'Director Production Ready',
          message: `Your AI Director session for "${session_id}" is now complete and ready for your review.`,
          link: `https://adplatform.raver.ai/agents/director?sessionId=${session_id}`,
          metadata: { sessionId: session_id, campaignId: campaignIdToSave }
        });
      }

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

export const getDbUpdate = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const local = await (prisma as any).aISession.findUnique({ where: { sessionId: session_id as string } });
    
    if (!local) {
      return res.status(404).json({ success: false, message: 'Session not found in local database' });
    }

    if (userId && local.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this session' });
    }

    const metadata = (local.metadata as any) || {};
    const status = metadata.status || metadata.production?.status || (metadata.campaign_status);

    return res.json({
      success: true,
      data: {
        ...metadata,
        session_id: local.sessionId,
        campaign_id: local.campaignId,
        status: status,
        is_local: true
      }
    });
  } catch (error: any) {
    console.error('[AIDirectorController] DB Update Error:', error);
    return res.status(500).json({ success: false, message: error.message });
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
    const lookupId = session_id;

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
        where: { campaignId: lookupId, type: 'director', userId },
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
      ...existingMetadata,
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

    // 5. Save as a NEW session in DB, branching off the previous one
    if (existingSession) {
      // Treat the new result as the single entity source of truth, avoiding deep-merge of old production state
      const newState = {
        ...existingMetadata,
        ...result,
        history: finalHistory
      };

      // Force status to 'in_production' since we just triggered a regeneration
      newState.production = newState.production || {};
      newState.production.status = 'in_production';
      newState.campaign_status = 'in_production';
      newState.status = 'in_production';

      // Ensure a unique session ID for the new fork
      let newSessionId = result.session_id;
      if (!newSessionId || newSessionId === existingSession.sessionId) {
        const baseSessionId = existingSession.sessionId.includes('_') 
          ? existingSession.sessionId.split('_')[0] 
          : existingSession.sessionId;
        newSessionId = `${baseSessionId}_${Date.now()}`;
      }
      newState.session_id = newSessionId;

      await (prisma as any).aISession.create({
        data: {
          userId,
          sessionId: newSessionId,
          type: 'director',
          campaignId: existingSession.campaignId,
          metadata: newState
        }
      });

      return res.json({ success: true, data: newState });
    }

    return res.json({ success: true, data: { ...result, history: finalHistory } });
  } catch (error: any) {
    console.error('[AIDirectorController] Chat Error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const approveStep = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const params = {
      step_name: req.body.step_name || req.query.step_name,
      action: req.body.action || req.query.action,
      notes: req.body.notes || req.query.notes,
      selected_asset_id: req.body.selected_asset_id // Support asset selection if provided
    };

    const result = await directorService.approveStep(session_id as string, params);

    // 1. Persist the updated state to DB
    if (session_id && result && result.campaign) {
      const campaignData = result.campaign;
      
      const existing = await (prisma as any).aISession.findUnique({
        where: { sessionId: session_id as string }
      });

      const merged = mergeMetadata(existing?.metadata, campaignData);
      
      // Ensure we keep track of the specific step approvals in the metadata
      merged.step_approvals = campaignData.step_approvals || merged.step_approvals || {};

      await (prisma as any).aISession.upsert({
        where: { sessionId: session_id as string },
        update: { 
          metadata: merged, 
          userId, 
          campaignId: campaignData.campaign_id || existing?.campaignId 
        },
        create: {
          userId,
          sessionId: session_id as string,
          type: 'director',
          metadata: merged,
          campaignId: campaignData.campaign_id
        }
      });

      // Sync status to Campaign and ProducerResult tables if linked
      const campaignId = campaignData.campaign_id || existing?.campaignId || (merged as any)?.campaign_id;
      if (campaignId) {
        const statusToSync = campaignData.status || (merged as any)?.status || (merged as any)?.production?.status;
        if (statusToSync) {
          try {
            await (prisma as any).campaign.updateMany({
              where: { id: campaignId },
              data: { status: statusToSync }
            });
            
            await (prisma as any).producerResult.updateMany({
              where: { campaignId: campaignId },
              data: { status: statusToSync }
            });
          } catch (syncError) {
            console.warn('[AIDirectorController] Background status sync failed:', syncError);
          }
        }
      }
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AIDirectorController] Approve Step Error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};