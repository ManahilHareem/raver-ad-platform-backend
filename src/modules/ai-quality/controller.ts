import { Response } from 'express';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';
import * as qualityService from './service';
import { createNotification } from '../notification/service';

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


    // Trigger notification
    await createNotification({
      userId,
      type: 'AI_QUALITY_SCORED',
      title: 'Forensic Audit Completed',
      message: `AI Quality Lead has completed a forensic audit for campaign "${qualityReport.campaignId}". Decision: ${qualityReport.decision}.`,
      link: `https://adplatform.raver.ai/agents/quality?sessionId=${qualityReport.sessionId || ''}`,
      metadata: { reportId: qualityReport.id, decision: qualityReport.decision }
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
 * List all previous quality results for the user, joined with their original assets
 */
export const getHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Fetch latest reports
    const reports = await (prisma as any).qualityLeadResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    if (reports.length === 0) return res.json({ success: true, data: [] });

    // Extract unique session and campaign IDs for batch lookup
    const sessionIds = [...new Set(reports.map((r: any) => r.sessionId).filter(Boolean))];

    // Batch fetch candidates from all agent tables
    const [editors, audios, images, copies, producers, directors] = await Promise.all([
      (prisma as any).editorResult.findMany({ where: { userId, sessionId: { in: sessionIds } } }),
      (prisma as any).audioLeadResult.findMany({ where: { userId, sessionId: { in: sessionIds } } }),
      (prisma as any).imageLeadResult.findMany({ where: { userId, sessionId: { in: sessionIds } } }),
      (prisma as any).copyLeadResult.findMany({ where: { userId, sessionId: { in: sessionIds } } }),
      (prisma as any).producerResult.findMany({ where: { userId, sessionId: { in: sessionIds } } }),
      (prisma as any).aISession.findMany({ where: { userId, sessionId: { in: sessionIds }, type: 'director' } })
    ]);

    // Create a lookup map for candidates
    const candidateMap: Record<string, any> = {};
    
    editors.forEach((e: any) => { 
      candidateMap[e.sessionId] = { 
        ...e, 
        agentType: 'Editor', 
        label: 'Video Render', 
        url: e.videoUrl,
        metadata: e.metadata 
      }; 
    });
    audios.forEach((a: any) => { 
      candidateMap[a.sessionId] = { 
        ...a, 
        agentType: 'Audio', 
        label: 'Audio Mix', 
        url: a.mixUrl,
        musicUrl: a.musicUrl,
        voiceoverUrl: a.voiceoverUrl,
        metadata: a.metadata
      }; 
    });
    images.forEach((i: any) => { 
      candidateMap[i.sessionId] = { 
        ...i, 
        agentType: 'Image', 
        label: 'Scene Images', 
        url: i.mainImageUrl,
        mainImageUrl: i.mainImageUrl,
        scenes: i.scenes,
        metadata: i.metadata
      }; 
    });
    copies.forEach((c: any) => { 
      candidateMap[c.sessionId] = { 
        ...c, 
        agentType: 'Copy', 
        label: 'Ad Script', 
        url: null,
        script: c.script,
        captions: c.captions,
        overlays: c.overlays,
        cta: c.cta,
        hashtags: c.hashtags,
        metadata: c.metadata
      }; 
    });
    producers.forEach((p: any) => { 
      candidateMap[p.sessionId] = { 
        ...p, 
        agentType: 'Producer', 
        label: 'Producer Audit', 
        url: p.result?.video_url || p.result?.videoUrl || p.result?.render_url || p.result?.renderUrl,
        brief: p.brief,
        status: p.status,
        result: p.result
      }; 
    });
    directors.forEach((d: any) => { 
      candidateMap[d.sessionId] = { 
        ...d, 
        agentType: 'Director', 
        label: 'Director Session', 
        url: d.metadata?.video_url || d.metadata?.videoUrl || d.metadata?.production?.video_url || d.metadata?.production?.videoUrl,
        metadata: d.metadata 
      }; 
    });

    // Merge candidates into reports
    const enrichedReports = reports.map((report: any) => ({
      ...report,
      candidate: report.sessionId ? candidateMap[report.sessionId] : null
    }));

    return res.json({ success: true, data: enrichedReports });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete (archive) a specific quality report
 */
export const deleteReport = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Handle potential reportId or internal id
    const report = await (prisma as any).qualityLeadResult.findFirst({
      where: {
        OR: [
          { id: id.includes('-') && id.length === 36 ? id : undefined },
          { reportId: id }
        ].filter(Boolean) as any,
        userId
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Quality report not found or unauthorized' });
    }

    await (prisma as any).qualityLeadResult.delete({
      where: { id: report.id }
    });

    return res.json({ success: true, message: 'Quality report deleted successfully' });
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
        metadata: e.metadata,
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
        musicUrl: a.musicUrl,
        voiceoverUrl: a.voiceoverUrl,
        metadata: a.metadata,
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
        mainImageUrl: i.mainImageUrl,
        scenes: i.scenes,
        metadata: i.metadata,
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
        script: c.script,
        captions: c.captions,
        overlays: c.overlays,
        cta: c.cta,
        hashtags: c.hashtags,
        metadata: c.metadata,
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
        brief: p.brief,
        status: p.status,
        result: p.result,
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
        metadata: d.metadata,
        createdAt: d.createdAt,
        raw: d
      }))
    };

    return res.json({ success: true, data: groupedCandidates });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
