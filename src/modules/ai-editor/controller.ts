import { Response } from 'express';
import * as editorService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const renderCampaign = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { tag, ...body } = req.body;
    const userId = req.user?.id;
    const result = await editorService.renderCampaign(req.body);

    const sessionId = body.session_id || result.session_id;
    const hasContent = result.video_url || result.url || (result.metadata && Object.keys(result.metadata).length > 0);

    if (userId && sessionId && hasContent) {
      const metadata = {
        ...(result.metadata || (typeof result === 'object' ? result : {})),
        tag: tag || undefined,
        lastUpdatedAt: new Date().toISOString()
      };
      await (prisma as any).editorResult.upsert({
        where: { sessionId },
        update: { 
          campaignId: sessionId,
          metadata 
        },
        create: {
          userId,
          sessionId,
          campaignId: sessionId,
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
    const result = await editorService.exportFormats(req.body);

    const sessionId = body.session_id || result.session_id;
    const exportUrl = result.video_url || result.url;

    if (userId && sessionId && exportUrl) {
      const metadata = {
        ...(result.metadata || (typeof result === 'object' ? result : {})),
        tag: tag || undefined,
        lastUpdatedAt: new Date().toISOString()
      };
      await (prisma as any).editorResult.upsert({
        where: { sessionId },
        update: { 
          campaignId: sessionId,
          videoUrl: exportUrl,
          format: format || result.format,
          metadata
        },
        create: {
          userId,
          sessionId,
          campaignId: sessionId,
          videoUrl: exportUrl,
          format: format || result.format,
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
