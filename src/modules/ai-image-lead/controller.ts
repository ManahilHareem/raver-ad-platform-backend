import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as imageLeadService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

const handle = (fn: (body: any) => Promise<any>) => async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (req.method === 'POST' && (!req.body || Object.keys(req.body).length === 0)) {
       console.warn(`[AI-Image-Lead] Calling ${req.path} with empty body.`);
    }
    const result = await fn(req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateImages = handle(imageLeadService.generateImages);
export const enhanceImage = handle(imageLeadService.enhanceImage);
export const getVault = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { session_id } = req.params;
        const result = await imageLeadService.getVault(session_id as string);
        return res.json({ success: true, data: result });
    } catch (error: any) {
        return res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

export const createSession = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const sessionId = uuidv4();
    const userId = req.user?.id;
    const { tag, metadata } = req.body;

    if (userId) {
      await (prisma as any).aISession.create({
        data: {
          userId,
          sessionId,
          tag: tag || null,
          type: 'image-lead',
          metadata: metadata || {}
        }
      });
    }

    return res.status(201).json({ success: true, data: { session_id: sessionId } });
  } catch (error: any) {
    console.error('[ImageLeadController]', error);
    return res.status(500).json({ success: false, message: 'Failed to create session' });
  }
};
