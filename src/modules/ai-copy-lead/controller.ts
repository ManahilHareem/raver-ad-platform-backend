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
      await (prisma as any).copyLeadResult.create({
        data: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          type: 'script',
          script: result,
          metadata: { ...result, brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
        }
      });
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
      await (prisma as any).copyLeadResult.create({
        data: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          type: 'captions',
          captions: result,
          metadata: { ...(Array.isArray(result) ? { captions_list: result } : result), brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
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
      await (prisma as any).copyLeadResult.create({
        data: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          type: 'overlays',
          overlays: result,
          metadata: { ...(Array.isArray(result) ? { overlays_list: result } : result), brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
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
      await (prisma as any).copyLeadResult.create({
        data: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          type: 'cta',
          cta: result,
          metadata: { ...(typeof result === 'object' ? result : { cta_text: result }), brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
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
      await (prisma as any).copyLeadResult.create({
        data: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          type: 'hashtags',
          hashtags: result,
          metadata: { ...(Array.isArray(result) ? { hashtags_list: result } : result), brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
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
      await (prisma as any).copyLeadResult.create({
        data: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          type: 'package',
          script: result.script || {},
          overlays: result.overlays || [],
          captions: result.platform_copy || {},
          metadata: { ...result, brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
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

export const getVault = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    if (userId && session_id) {
        const local = await (prisma as any).copyLeadResult.findFirst({ where: { sessionId: session_id, userId } });
        if (local && local.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
    }

    const result = await copyService.getVault(session_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getResults = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const results = await (prisma as any).copyLeadResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: results });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const deleteResult = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if any results exist for this session and belong to the user
    const results = await (prisma as any).copyLeadResult.findMany({
      where: { sessionId: session_id, userId }
    });

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Synthesis records not found in archives' });
    }

    await (prisma as any).copyLeadResult.deleteMany({
      where: { sessionId: session_id, userId }
    });

    return res.json({ success: true, message: 'Linguistic synthesis archived successfully' });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

