import { Response } from 'express';
import * as copyService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const generateScript = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await copyService.generateScript(req.body);

    if (userId && session_id && result && (typeof result === 'string' ? result.length > 0 : Object.keys(result).length > 0)) {
      await (prisma as any).copyLeadResult.upsert({
        where: { sessionId: session_id },
        update: { 
          script: result,
          metadata: { ...result, lastUpdatedAt: new Date().toISOString() }
        },
        create: {
          userId,
          sessionId: session_id,
          script: result,
          metadata: { ...result, lastUpdatedAt: new Date().toISOString() }
        }
      });

      // Sync to high-level Campaign table
      if (req.body.brief?.business_name) {
        try {
          await (prisma as any).campaign.upsert({
            where: { id: session_id },
            update: { name: req.body.brief.business_name },
            create: {
              id: session_id,
              userId,
              name: req.body.brief.business_name,
              status: 'in_production',
              audience: req.body.brief.target_audience,
              format: req.body.brief.format,
              config: { brief: req.body.brief, session_id: session_id }
            }
          });
        } catch (e) {
            console.error('[CopyLeadController] Campaign sync error:', e);
        }
      }
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateCaptions = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await copyService.generateCaptions(req.body);

    if (userId && session_id && result && (Array.isArray(result) ? result.length > 0 : true)) {
      await (prisma as any).copyLeadResult.upsert({
        where: { sessionId: session_id },
        update: { 
          captions: result,
          metadata: { ...(Array.isArray(result) ? { captions_list: result } : result), lastUpdatedAt: new Date().toISOString() }
        },
        create: {
          userId,
          sessionId: session_id,
          captions: result,
          metadata: { ...(Array.isArray(result) ? { captions_list: result } : result), lastUpdatedAt: new Date().toISOString() }
        }
      });
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateOverlays = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await copyService.generateOverlays(req.body);

    if (userId && session_id && result && (Array.isArray(result) ? result.length > 0 : true)) {
      await (prisma as any).copyLeadResult.upsert({
        where: { sessionId: session_id },
        update: { 
          overlays: result,
          metadata: { ...(Array.isArray(result) ? { overlays_list: result } : result), lastUpdatedAt: new Date().toISOString() }
        },
        create: {
          userId,
          sessionId: session_id,
          overlays: result,
          metadata: { ...(Array.isArray(result) ? { overlays_list: result } : result), lastUpdatedAt: new Date().toISOString() }
        }
      });
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateCta = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await copyService.generateCta(req.body);

    if (userId && session_id && result) {
      await (prisma as any).copyLeadResult.upsert({
        where: { sessionId: session_id },
        update: { 
          cta: result,
          metadata: { ...(typeof result === 'object' ? result : { cta_text: result }), lastUpdatedAt: new Date().toISOString() }
        },
        create: {
          userId,
          sessionId: session_id,
          cta: result,
          metadata: { ...(typeof result === 'object' ? result : { cta_text: result }), lastUpdatedAt: new Date().toISOString() }
        }
      });
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateHashtags = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await copyService.generateHashtags(req.body);

    if (userId && session_id && result && (Array.isArray(result) ? result.length > 0 : true)) {
      await (prisma as any).copyLeadResult.upsert({
        where: { sessionId: session_id },
        update: { 
          hashtags: result,
          metadata: { ...(Array.isArray(result) ? { hashtags_list: result } : result), lastUpdatedAt: new Date().toISOString() }
        },
        create: {
          userId,
          sessionId: session_id,
          hashtags: result,
          metadata: { ...(Array.isArray(result) ? { hashtags_list: result } : result), lastUpdatedAt: new Date().toISOString() }
        }
      });
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const produceCopy = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await copyService.produceCopy(req.body);

    if (userId && session_id && result && Object.keys(result).length > 0) {
      await (prisma as any).copyLeadResult.upsert({
        where: { sessionId: session_id },
        update: { metadata: result },
        create: {
          userId,
          sessionId: session_id,
          metadata: result
        }
      });

      // Sync to high-level Campaign table
      if (req.body.brief?.business_name) {
        try {
          await (prisma as any).campaign.upsert({
            where: { id: session_id },
            update: { name: req.body.brief.business_name },
            create: {
              id: session_id,
              userId,
              name: req.body.brief.business_name,
              status: 'in_production',
              config: { brief: req.body.brief, session_id: session_id }
            }
          });
        } catch (e) {}
      }
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
