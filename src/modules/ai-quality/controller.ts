import { Response } from 'express';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';
import * as qualityService from './service';

/**
 * Score an asset for quality
 */
export const scoreAsset = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await qualityService.scoreAsset(req.body);

    // Persist the quality report in the database
    const qualityReport = await (prisma as any).qualityLeadResult.create({
      data: {
        userId,
        reportId: result.report_id,
        campaignId: req.body.campaign_id || result.campaign_id,
        sessionId: req.body.session_id || result.session_id,
        visualScore: result.visual_score,
        brandAlignmentScore: result.brand_alignment_score,
        copyScore: result.copy_score,
        platformFitScore: result.platform_fit_score,
        audioFitScore: result.audio_fit_score,
        overallScore: result.overall_score,
        decision: result.decision,
        rejected: result.rejected,
        rejectReason: result.reject_reason,
        metadata: result
      }
    });

    return res.json({ success: true, data: qualityReport });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

/**
 * Get a specific quality report from the database
 */
export const getReport = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // reportId or internal id
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const report = await (prisma as any).qualityLeadResult.findFirst({
      where: {
        OR: [
          { id },
          { reportId: id }
        ],
        userId
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Quality report not found' });
    }

    return res.json({ success: true, data: report });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all previous quality results for the user
 */
export const getHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const results = await (prisma as any).qualityLeadResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get unified list of synthesis candidates from disparate agents
 */
export const getCandidates = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const limit = 20;

    // Fetch latest results from different agent schemas
    const [editors, audios, images, copies, producers, directors] = await Promise.all([
      (prisma as any).editorResult.findMany({ where: { userId }, take: limit, orderBy: { createdAt: 'desc' } }),
      (prisma as any).audioLeadResult.findMany({ where: { userId }, take: limit, orderBy: { createdAt: 'desc' } }),
      (prisma as any).imageLeadResult.findMany({ where: { userId }, take: limit, orderBy: { createdAt: 'desc' } }),
      (prisma as any).copyLeadResult.findMany({ where: { userId }, take: limit, orderBy: { createdAt: 'desc' } }),
      (prisma as any).producerResult.findMany({ where: { userId }, take: limit, orderBy: { createdAt: 'desc' } }),
      (prisma as any).aISession.findMany({ where: { userId, type: 'director' }, take: limit, orderBy: { createdAt: 'desc' } })
    ]);

    // Format them into a grouped structure by tags
    const groupedCandidates = {
      video_synthesis: editors.map((e: any) => ({ 
        id: e.id, 
        sessionId: e.sessionId, 
        campaignId: e.campaignId, 
        type: 'Editor', 
        label: 'Video Render', 
        url: e.videoUrl, 
        createdAt: e.createdAt,
        raw: e
      })),
      audio_mix: audios.map((a: any) => ({ 
        id: a.id, 
        sessionId: a.sessionId, 
        campaignId: a.campaignId, 
        type: 'Audio', 
        label: 'Audio Mix', 
        url: a.mixUrl, 
        createdAt: a.createdAt,
        raw: a
      })),
      image_scenes: images.map((i: any) => ({ 
        id: i.id, 
        sessionId: i.sessionId, 
        campaignId: i.campaignId, 
        type: 'Image', 
        label: 'Scene Images', 
        url: i.mainImageUrl, 
        createdAt: i.createdAt,
        raw: i
      })),
      copy_script: copies.map((c: any) => ({ 
        id: c.id, 
        sessionId: c.sessionId, 
        campaignId: c.campaignId, 
        type: 'Copy', 
        label: 'Ad Script', 
        url: null, 
        createdAt: c.createdAt,
        raw: c
      })),
      producer_render: producers.map((p: any) => ({
        id: p.id,
        sessionId: p.sessionId,
        campaignId: p.campaignId,
        type: 'Producer',
        label: 'Producer Audit',
        url: p.result?.video_url || p.result?.videoUrl || p.result?.render_url || p.result?.renderUrl,
        createdAt: p.createdAt,
        raw: p
      })),
      director_session: directors.map((d: any) => ({
        id: d.id,
        sessionId: d.sessionId,
        campaignId: d.campaignId,
        type: 'Director',
        label: 'Director Session',
        url: d.metadata?.video_url || d.metadata?.videoUrl || d.metadata?.production?.video_url || d.metadata?.production?.videoUrl,
        createdAt: d.createdAt,
        raw: d
      }))
    };

    return res.json({ success: true, data: groupedCandidates });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
