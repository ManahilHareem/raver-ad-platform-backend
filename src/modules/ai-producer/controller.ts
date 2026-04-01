import { Response } from 'express';
import * as producerService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const launchCampaign = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const result = await producerService.launchCampaign(req.body);
    
    // Persist to local DB if we have a userId and campaign_id
    if (userId && result.campaign_id) {
      try {
        await (prisma as any).campaign.upsert({
          where: { id: result.campaign_id },
          create: {
            id: result.campaign_id,
            userId,
            name: req.body.brief?.business_name || 'AI Campaign',
            status: result.status || 'queued',
            audience: req.body.brief?.target_audience,
            format: req.body.brief?.format,
            platforms: req.body.brief?.platform ? [req.body.brief.platform] : [],
            tones: req.body.brief?.tone ? [req.body.brief.tone] : [],
            visualStyles: req.body.brief?.mood ? [req.body.brief.mood] : [],
            config: {
              brief: req.body.brief,
              session_id: req.body.session_id,
              result: result
            }
          },
          update: {
            status: result.status || 'queued',
            audience: req.body.brief?.target_audience,
            format: req.body.brief?.format,
            platforms: req.body.brief?.platform ? [req.body.brief.platform] : [],
            tones: req.body.brief?.tone ? [req.body.brief.tone] : [],
            visualStyles: req.body.brief?.mood ? [req.body.brief.mood] : [],
            config: {
              brief: req.body.brief,
              session_id: req.body.session_id,
              result: result
            }
          }
        });
        console.log(`[AIProducerController] Persisted campaign ${result.campaign_id} to DB`);
      } catch (dbError) {
        console.error('[AIProducerController] Failed to persist campaign:', dbError);
      }
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getCampaign = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { campaign_id } = req.params;
    const userId = req.user?.id;

    // 1. Fetch latest status from AI Backend
    const result = await producerService.getCampaign(campaign_id as string);
    
    // 2. Sync to local DB
    if (userId && result.campaign_id) {
        try {
            await (prisma as any).campaign.upsert({
                where: { id: result.campaign_id },
                create: {
                    id: result.campaign_id,
                    userId,
                    name: result.brief?.business_name || 'AI Campaign',
                    status: result.status,
                    audience: result.brief?.target_audience,
                    format: result.brief?.format,
                    platforms: result.brief?.platform ? [result.brief.platform] : [],
                    tones: result.brief?.tone ? [result.brief.tone] : [],
                    visualStyles: result.brief?.mood ? [result.brief.mood] : [],
                    config: {
                        brief: result.brief,
                        nodes: result.nodes,
                        result: result.result
                    }
                },
                update: {
                    status: result.status,
                    audience: result.brief?.target_audience,
                    format: result.brief?.format,
                    platforms: result.brief?.platform ? [result.brief.platform] : [],
                    tones: result.brief?.tone ? [result.brief.tone] : [],
                    visualStyles: result.brief?.mood ? [result.brief.mood] : [],
                    config: {
                        brief: result.brief,
                        nodes: result.nodes,
                        result: result.result
                    }
                }
            });
        } catch (dbError) {
            console.error('[AIProducerController] Sync error:', dbError);
        }
    }

    // 3. Return the synced record from DB (or just the backend result directly if preferred)
    // Here we return the backend result for immediate feedback, but it's now in the DB.
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const listCampaigns = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Fetch from external Raver API to sync current user's campaigns
    try {
        const external = await producerService.listCampaigns();
        const externalCampaigns = (external as any).campaigns || [];
        
        for (const ext of externalCampaigns) {
            const brief = ext.brief || {};
            const status = ext.status === 'completed' ? 'active' : (ext.status || 'draft');
            
            await (prisma as any).campaign.upsert({
                where: { id: ext.campaign_id },
                update: {
                    userId,
                    name: brief.business_name || 'AI Campaign',
                    status: status,
                    audience: brief.target_audience,
                    format: brief.format,
                    platforms: brief.platform ? [brief.platform] : [],
                    tones: brief.tone ? [brief.tone] : [],
                    visualStyles: brief.mood ? [brief.mood] : [],
                    config: ext
                },
                create: {
                    id: ext.campaign_id,
                    userId,
                    name: brief.business_name || 'AI Campaign',
                    status: status,
                    audience: brief.target_audience,
                    format: brief.format,
                    platforms: brief.platform ? [brief.platform] : [],
                    tones: brief.tone ? [brief.tone] : [],
                    visualStyles: brief.mood ? [brief.mood] : [],
                    config: ext
                }
            });
        }
    } catch (syncError) {
        console.error('[AIProducerController] Auto-sync failed:', syncError);
        // Continue to return local data even if sync fails
    }

    // 2. Fetch final state from local DB
    const campaigns = await (prisma as any).campaign.findMany({
      where: { userId },
      include: { metrics: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: campaigns });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const approveCampaign = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { campaign_id } = req.params;
    const userId = req.user?.id;
    const result = await producerService.approveCampaign(campaign_id as string, req.body);

    // Sync to local DB
    if (userId && campaign_id) {
        try {
            await (prisma as any).campaign.update({
                where: { id: campaign_id },
                data: {
                    status: result.status || (req.body.approved ? 'approved' : 'rejected'),
                    config: {
                        ...( (await (prisma as any).campaign.findUnique({ where: { id: campaign_id } }))?.config || {} ),
                        approval: {
                            approved: req.body.approved,
                            notes: req.body.notes,
                            result: result
                        }
                    }
                }
            });
        } catch (dbError) {
            console.error('[AIProducerController] Approval sync error:', dbError);
        }
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
