import { Response } from 'express';
import * as producerService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const launchCampaign = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const result = await producerService.launchCampaign(req.body);
    
    // 1. Persist to dedicated ProducerResult table
    if (userId && result.campaign_id) {
      try {
        await (prisma as any).producerResult.upsert({
          where: { campaignId: result.campaign_id },
          create: {
            userId,
            campaignId: result.campaign_id,
            sessionId: req.body.session_id,
            brief: req.body.brief,
            status: result.status || 'queued',
            result: result
          },
          update: {
            status: result.status || 'queued',
            brief: req.body.brief,
            result: result
          }
        });
      } catch (dbError) {
        console.error('[AIProducerController] ProducerResult persistence error:', dbError);
      }

      // 2. Persist to high-level Campaign table for dashboard visibility
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
              session_id: req.body.session_id
            }
          },
          update: {
            status: result.status || 'queued',
            name: req.body.brief?.business_name || undefined,
            audience: req.body.brief?.target_audience,
            format: req.body.brief?.format,
            platforms: req.body.brief?.platform ? [req.body.brief.platform] : [],
            tones: req.body.brief?.tone ? [req.body.brief.tone] : [],
            visualStyles: req.body.brief?.mood ? [req.body.brief.mood] : []
          }
        });
        console.log(`[AIProducerController] Persisted campaign ${result.campaign_id} to DB`);
      } catch (dbError) {
        console.error('[AIProducerController] Campaign persistence error:', dbError);
      }
    } else {
      console.warn('[AIProducerController] Skipping persistence: No valid campaign_id returned from AI.');
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
    
    // 2. Sync to dedicated ProducerResult table
    if (userId && result.campaign_id) {
        const isMissing = result.message?.includes('No active campaign') || (result.status === null && result.campaign_id === null) || (!result.brief && !result.id);
        if (isMissing) {
            console.log(`[AIProducerController] Skipping persistence for inactive/empty campaign ${campaign_id}`);
            return res.json({ success: true, data: result });
        }

        try {
            await (prisma as any).producerResult.upsert({
                where: { campaignId: result.campaign_id },
                create: {
                    userId,
                    campaignId: result.campaign_id,
                    brief: result.brief,
                    status: result.status,
                    result: result
                },
                update: {
                    status: result.status,
                    result: result
                }
            });

            // Sync high-level Campaign record
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
                    visualStyles: result.brief?.mood ? [result.brief.mood] : []
                },
                update: {
                    status: result.status,
                    audience: result.brief?.target_audience,
                    format: result.brief?.format,
                    platforms: result.brief?.platform ? [result.brief.platform] : [],
                    tones: result.brief?.tone ? [result.brief.tone] : [],
                    visualStyles: result.brief?.mood ? [result.brief.mood] : []
                }
            });
        } catch (dbError) {
            console.error('[AIProducerController] Sync error:', dbError);
        }
    }

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
            
            // Skip ghost campaigns (No ID or no content)
            if (!ext.campaign_id || (!ext.brief && status === 'draft')) {
                continue;
            }

            // Sync ProducerResult
            try {
                await (prisma as any).producerResult.upsert({
                    where: { campaignId: ext.campaign_id },
                    update: {
                        userId,
                        status: status,
                        brief: brief,
                        result: ext
                    },
                    create: {
                        userId,
                        campaignId: ext.campaign_id,
                        status: status,
                        brief: brief,
                        result: ext
                    }
                });

                // Sync Campaign
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
                        visualStyles: brief.mood ? [brief.mood] : []
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
                        visualStyles: brief.mood ? [brief.mood] : []
                    }
                });
            } catch (innerError) {
                console.error(`[AIProducerController] Failed to sync campaign ${ext.campaign_id}:`, innerError);
            }
        }
    } catch (syncError) {
        console.error('[AIProducerController] Auto-sync failed:', syncError);
    }

    // 2. Fetch primary tracking records from local DB
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

    if (userId && campaign_id) {
        const status = result.status || (req.body.approved ? 'approved' : 'rejected');
        try {
            // Update ProducerResult
            await (prisma as any).producerResult.update({
                where: { campaignId: campaign_id },
                data: {
                    status: status,
                    result: {
                        ...( (await (prisma as any).producerResult.findUnique({ where: { campaignId: campaign_id } }))?.result || {} ),
                        approval: {
                            approved: req.body.approved,
                            notes: req.body.notes,
                            result: result
                        }
                    }
                }
            });

            // Update Campaign
            await (prisma as any).campaign.update({
                where: { id: campaign_id },
                data: { status: status }
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

export const deleteCampaign = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { campaign_id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log(`[AIProducerController] Deleting campaign ${campaign_id} for user ${userId}`);

    // 1. Double-check ownership on Campaign level
    const campaign = await (prisma as any).campaign.findUnique({
      where: { id: campaign_id }
    });

    if (campaign && campaign.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this campaign.' });
    }

    // 2. Perform deletions across all related tables
    try {
      // Delete from ProducerResult
      await (prisma as any).producerResult.deleteMany({
        where: { campaignId: campaign_id, userId }
      });

      // Delete from AISession (Legacy or Director chats)
      await (prisma as any).aISession.deleteMany({
        where: { campaignId: campaign_id, userId }
      });

      // Delete high-level Campaign record
      await (prisma as any).campaign.delete({
        where: { id: campaign_id }
      });

      console.log(`[AIProducerController] Successfully deleted campaign ${campaign_id}`);
      return res.json({ success: true, message: `Campaign ${campaign_id} has been deleted.` });
    } catch (dbError: any) {
      // Handle the case where the record might already be gone (P2025)
      if (dbError.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Campaign not found.' });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('[AIProducerController] Delete error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
