import { Response } from 'express';
import * as editorService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const renderCampaign = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { tag, ...body } = req.body;
    const userId = req.user?.id;
    const result = await editorService.renderCampaign(req.body);

    // If session_id is returned or provided, persist tag
    const sessionId = body.session_id || result.session_id;
    if (userId && sessionId) {
      await (prisma as any).aISession.upsert({
        where: { sessionId },
        update: { tag: tag || undefined },
        create: {
          userId,
          sessionId,
          tag: tag || null,
          type: 'editor'
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
    const { tag, ...body } = req.body;
    const userId = req.user?.id;
    const result = await editorService.exportFormats(req.body);

    const sessionId = body.session_id || result.session_id;
    if (userId && sessionId) {
      await (prisma as any).aISession.upsert({
        where: { sessionId },
        update: { tag: tag || undefined },
        create: {
          userId,
          sessionId,
          tag: tag || null,
          type: 'editor'
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
    const result = await editorService.getRenders(session_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
