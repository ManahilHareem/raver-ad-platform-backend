import { Response } from 'express';
import * as audioService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const generateMusic = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await audioService.generateMusic(req.body);

    if (userId && session_id && result.music_url) {
      await (prisma as any).audioLeadResult.upsert({
        where: { sessionId: session_id },
        update: { 
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          musicUrl: result.music_url,
          metadata: { ...result, brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
        },
        create: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          musicUrl: result.music_url,
          metadata: { ...result, brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
        }
      });

      // Sync to high-level Campaign table
      if (req.body.brief?.business_name) {
        try {
          await (prisma as any).campaign.upsert({
            where: { id: session_id },
            create: {
              id: session_id,
              userId,
              name: req.body.brief.business_name,
              status: 'in_production',
              audience: req.body.brief.target_audience,
              format: req.body.brief.format,
              platforms: req.body.brief.platform ? [req.body.brief.platform] : [],
              config: { brief: req.body.brief, session_id: session_id }
            },
            update: {
              name: req.body.brief.business_name,
              audience: req.body.brief.target_audience,
              format: req.body.brief.format
            }
          });
        } catch (e) {
          console.error('[AudioLeadController] Campaign sync error:', e);
        }
      }
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateVoiceover = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await audioService.generateVoiceover(req.body);

    if (userId && session_id && result.voiceover_url) {
      await (prisma as any).audioLeadResult.upsert({
        where: { sessionId: session_id },
        update: { 
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          voiceoverUrl: result.voiceover_url,
          metadata: { ...result, brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
        },
        create: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          voiceoverUrl: result.voiceover_url,
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

export const produceAudio = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await audioService.produceAudio(req.body);

    if (userId && session_id) {
      await (prisma as any).audioLeadResult.upsert({
        where: { sessionId: session_id },
        update: { 
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          musicUrl: result.music_url || undefined,
          voiceoverUrl: result.voiceover_url || undefined,
          mixUrl: result.mix_url || undefined,
          metadata: { ...result, brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
        },
        create: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          musicUrl: result.music_url,
          voiceoverUrl: result.voiceover_url,
          mixUrl: result.mix_url,
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

export const mixAudio = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;
    const result = await audioService.mixAudio(req.body);

    if (userId && session_id && result.mix_url) {
      await (prisma as any).audioLeadResult.upsert({
        where: { sessionId: session_id },
        update: { 
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          mixUrl: result.mix_url,
          metadata: { ...result, brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
        },
        create: {
          userId,
          sessionId: session_id,
          campaignId: session_id,
          businessName: req.body.brief?.business_name,
          mixUrl: result.mix_url,
          metadata: { ...result, brief: req.body.brief, lastUpdatedAt: new Date().toISOString() }
        }
      });
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
        const local = await (prisma as any).audioLeadResult.findUnique({ where: { sessionId: session_id } });
        if (local && local.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
    }

    const result = await audioService.getVault(session_id as string);
    
    // Sync vault results to local DB
    if (userId && session_id && result.audio_files) {
        const music = result.audio_files.find((f: any) => f.label === 'Music' || f.filename?.includes('music'));
        const voiceover = result.audio_files.find((f: any) => f.label === 'Voiceover' || f.filename?.includes('voiceover'));
        const mix = result.audio_files.find((f: any) => f.label === 'Mix' || f.label === 'Full' || f.label === 'Mixed' || f.filename?.includes('mix'));

        try {
            await (prisma as any).audioLeadResult.upsert({
                where: { sessionId: session_id },
                update: {
                    musicUrl: music?.url || undefined,
                    voiceoverUrl: voiceover?.url || undefined,
                    mixUrl: mix?.url || undefined,
                    metadata: { ...result, lastUpdatedAt: new Date().toISOString() }
                },
                create: {
                    userId,
                    sessionId: session_id,
                    campaignId: session_id,
                    musicUrl: music?.url,
                    voiceoverUrl: voiceover?.url,
                    mixUrl: mix?.url,
                    metadata: { ...result, lastUpdatedAt: new Date().toISOString() }
                }
            });
        } catch (e) {
            console.error('[AudioLeadController] Vault sync error:', e);
        }
    }

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

    const results = await (prisma as any).audioLeadResult.findMany({
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

    const record = await (prisma as any).audioLeadResult.findUnique({
      where: { sessionId: session_id }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    if (record.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to research archives' });
    }

    await (prisma as any).audioLeadResult.delete({
      where: { sessionId: session_id }
    });

    return res.json({ success: true, message: 'Synthesis archived successfully' });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

