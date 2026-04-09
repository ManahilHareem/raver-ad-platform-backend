import { Response } from 'express';
import * as editorService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const renderCampaign = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { tag, ...body } = req.body;
    const userId = req.user?.id;

    // Sanitize input for AI service validation
    const sanitizedBody = {
      ...body,
      transition_duration: typeof body.transition_duration === 'number' ? Math.max(0, body.transition_duration) : (body.transition_duration ? Number(body.transition_duration) : 1.0),
      music_volume: typeof body.music_volume === 'number' ? Math.min(1, Math.max(0, body.music_volume)) : 0.5
    };

    const result = await editorService.renderCampaign(sanitizedBody);

    const sessionId = body.session_id || result.session_id;
    const hasContent = result.video_url || result.url || (result.metadata && Object.keys(result.metadata).length > 0);

    if (userId && sessionId && hasContent) {
      const metadata = {
        ...(result.metadata || (typeof result === 'object' ? result : {})),
        payload: sanitizedBody,
        tag: tag || undefined,
        lastUpdatedAt: new Date().toISOString()
      };
      const format = result.format || body.format || '9:16';
      await (prisma as any).editorResult.upsert({
        where: { sessionId },
        update: { 
          campaignId: sessionId,
          videoUrl: result.video_url || result.url || undefined,
          format,
          type: 'render',
          metadata 
        },
        create: {
          userId,
          sessionId,
          campaignId: sessionId,
          videoUrl: result.video_url || result.url || undefined,
          format,
          type: 'render',
          metadata
        }
      });
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const exportFormats = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { tag, format, ...body } = req.body;
    const userId = req.user?.id;

    // Sanitize input for AI service validation
    const sanitizedBody = {
      ...body,
      format,
      transition_duration: typeof body.transition_duration === 'number' ? Math.max(0, body.transition_duration) : (body.transition_duration ? Number(body.transition_duration) : 1.0),
      music_volume: typeof body.music_volume === 'number' ? Math.min(1, Math.max(0, body.music_volume)) : 0.5
    };

    const result = await editorService.exportFormats(sanitizedBody);

    const sessionId = body.session_id || result.session_id;

    if (userId && sessionId && result.renders) {
      const renderKeys = Object.keys(result.renders);
      const primaryFormat = renderKeys.includes('16:9') ? '16:9' : renderKeys[0];
      const primaryRender = result.renders[primaryFormat];
      const videoUrl = primaryRender?.video_url || primaryRender?.url;

      const metadata = {
        ...(result.metadata || (typeof result === 'object' ? result : {})),
        payload: sanitizedBody,
        renders: result.renders,
        tag: tag || undefined,
        lastUpdatedAt: new Date().toISOString()
      };

      await (prisma as any).editorResult.upsert({
        where: { sessionId },
        update: { 
          campaignId: sessionId,
          videoUrl,
          format: primaryFormat,
          type: 'export',
          metadata
        },
        create: {
          userId,
          sessionId,
          campaignId: sessionId,
          videoUrl,
          format: primaryFormat,
          type: 'export',
          metadata
        }
      });
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getRenders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    if (userId && session_id) {
        const local = await (prisma as any).editorResult.findUnique({ where: { sessionId: session_id } });
        if (local && local.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
    }

    const result = await editorService.getRenders(session_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getAllResults = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const results = await (prisma as any).editorResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteResult = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Validate UUID format to prevent database syntax errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof id !== 'string' || !uuidRegex.test(id)) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    const result = await (prisma as any).editorResult.findUnique({ where: { id } });
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    if (result.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await (prisma as any).editorResult.delete({ where: { id } });

    return res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
