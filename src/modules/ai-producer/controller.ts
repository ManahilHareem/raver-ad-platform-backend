import { Response } from 'express';
import * as producerService from './service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';
import { createNotification } from '../notification/service';

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
            sessionId: req.body.session_id || result.session_id,
            brief: req.body.brief || result.brief,
            status: result.status || 'queued',
            result: result
          },
          update: {
            status: result.status || 'queued',
            brief: req.body.brief || result.brief,
            result: result,
            sessionId: req.body.session_id || result.session_id
          }
        });

        // 2. Also upsert high-level Campaign record for visibility in standard dashboard
        await (prisma as any).campaign.upsert({
          where: { id: result.campaign_id },
          create: {
            id: result.campaign_id,
            userId,
            name: req.body.brief?.business_name || result.brief?.business_name || 'AI Campaign',
            status: result.status || 'queued',
            audience: req.body.brief?.target_audience || result.brief?.target_audience,
            format: req.body.brief?.format || result.brief?.format,
            platforms: req.body.brief?.platform ? [req.body.brief.platform] : (result.brief?.platform ? [result.brief.platform] : []),
            tones: req.body.brief?.tone ? [req.body.brief.tone] : (result.brief?.tone ? [result.brief.tone] : []),
            visualStyles: req.body.brief?.mood ? [req.body.brief.mood] : (result.brief?.mood ? [result.brief.mood] : [])
          },
          update: {
            status: result.status || 'queued',
            name: req.body.brief?.business_name || result.brief?.business_name || 'AI Campaign',
            audience: req.body.brief?.target_audience || result.brief?.target_audience,
            format: req.body.brief?.format || result.brief?.format,
            platforms: req.body.brief?.platform ? [req.body.brief.platform] : (result.brief?.platform ? [result.brief.platform] : []),
            tones: req.body.brief?.tone ? [req.body.brief.tone] : (result.brief?.tone ? [result.brief.tone] : []),
            visualStyles: req.body.brief?.mood ? [req.body.brief.mood] : (result.brief?.mood ? [result.brief.mood] : [])
          }
        });

        // 3. Trigger notification
        await createNotification({
          userId,
          type: 'AI_PRODUCER_LAUNCHED',
          title: 'Campaign Production Launched',
          message: `AI Producer has successfully launched the production for campaign "${req.body.brief?.business_name || 'New Campaign'}".`,
          link: `https://adplatform.raver.ai/dashboard/projects?campaignId=${result.campaign_id}`,
          metadata: { campaignId: result.campaign_id, status: result.status }
        });
      } catch (dbError) {
        console.error('[AIProducerController] ProducerResult persistence error:', dbError);
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

    let result;
    try {
      // 1. Fetch latest status from AI Backend
      result = await producerService.getCampaign(campaign_id as string);
    } catch (proxyError: any) {
      console.warn(`[AIProducerController] External lookup failed for ${campaign_id}, checking local fallback.`);

      // Special Auto-Seeding for specific test campaigns requested by user
      const testIds = ['29440e40-6401-4b6d-9b42-baf6061950c3', '8b20b09f-cfdd-4568-b46f-8ea4bcc89f7c', 'c2965fdd-3031-482e-8e14-7a6132e8237b'];
      if (testIds.includes(campaign_id as string) && userId) {
        let existing = await (prisma as any).producerResult.findUnique({ where: { campaignId: campaign_id } });
        if (!existing) {
          const isAura = campaign_id === 'c2965fdd-3031-482e-8e14-7a6132e8237b';
          const seedStatus = isAura ? 'queued' : 'approved';
          const seedName = isAura ? 'aura ' : (testIds.indexOf(campaign_id as string) === 0 ? 'Seeded Approved Production' : 'Studio Test Production');
          
          console.log(`[AIProducerController] Auto-seeding ${seedStatus} production for campaign ${campaign_id}`);
          
          await (prisma as any).campaign.upsert({
            where: { id: campaign_id },
            update: { status: seedStatus },
            create: {
              id: campaign_id,
              userId,
              name: seedName,
              status: seedStatus,
              budget: 1500,
              platforms: ['Instagram', 'TikTok'],
              tones: ['Luxury'],
              visualStyles: ['Cinematic'],
              audience: isAura ? 'genz ' : 'General'
            }
          });

          existing = await (prisma as any).producerResult.create({
            data: {
              userId,
              campaignId: campaign_id,
              status: seedStatus,
              brief: { 
                business_name: seedName, 
                target_audience: isAura ? 'genz ' : 'General',
                product_description: isAura ? 'Aura Cinematic Campaign' : 'An approved production' 
              },
              result: isAura ? {
                campaign_id: campaign_id,
                status: 'queued',
                session_id: 'raver_prod_1776262508492',
                nodes: {
                  generate_image: { status: 'pending' },
                  generate_text: { status: 'pending' },
                  generate_voice: { status: 'pending' },
                  generate_music: { status: 'pending' },
                  render: { status: 'pending' },
                  score_quality: { status: 'pending' }
                }
              } : {
                video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                status: 'completed',
                campaign_id: campaign_id
              }
            }
          });
        }
      }

      // Fallback: check if we have a local record for this campaign
      const localRecord = await (prisma as any).producerResult.findUnique({
        where: { campaignId: campaign_id }
      });

      if (localRecord) {
        // Ensure user ownership
        if (localRecord.userId !== userId) {
          return res.status(403).json({ success: false, message: 'Unauthorized access to this campaign.' });
        }
        console.log(`[AIProducerController] Serving local fallback for campaign ${campaign_id}`);
        return res.json({ success: true, data: localRecord.result || localRecord });
      }

      // If neither external nor local exists, return the error
      return res.status(proxyError.status || 500).json({
        success: false,
        message: proxyError.message || 'Campaign not found'
      });
    }

    // 2. Sync to dedicated ProducerResult table (continuing if proxy hit was successful)
    if (userId && result.campaign_id) {
      const isMissing = result.message?.includes('No active campaign') || (result.status === null && result.campaign_id === null) || (!result.brief && !result.id);
      if (isMissing) {
        console.log(`[AIProducerController] Skipping persistence for inactive/empty campaign ${campaign_id}`);
        return res.json({ success: true, data: result });
      }

      try {
        // 1. Fetch current local state of the production
        const localResult = await (prisma as any).producerResult.findUnique({ where: { campaignId: result.campaign_id } });
        const localCampaign = await (prisma as any).campaign.findUnique({ where: { id: result.campaign_id } });

        // 2. Terminal state protection: If local status is already 'approved' or 'rejected',
        // background sync should NOT "downgrade" the status.
        const terminalStatuses = ['approved', 'rejected', 'live', 'complete'];
        const finalized = localResult && terminalStatuses.includes(localResult.status);
        const statusToSync = finalized ? localResult.status : result.status;

        // 3. Upsert ProducerResult
        await (prisma as any).producerResult.upsert({
          where: { campaignId: result.campaign_id },
          create: {
            userId,
            campaignId: result.campaign_id,
            brief: result.brief,
            status: statusToSync,
            result: result
          },
          update: {
            status: statusToSync,
            result: result
          }
        });

        // 4. Trigger notification on status change
        if (localResult && localResult.status !== statusToSync) {
            let title = 'Production Update';
            let message = `Campaign "${result.brief?.business_name || 'AI Production'}" is now ${statusToSync}.`;
            
            if (statusToSync === 'ready_for_human_review') {
                title = 'Production Ready for Review';
                message = `AI Producer has finished generating your campaign for "${result.brief?.business_name || 'Campaign'}". Check it out for final approval!`;
            } else if (statusToSync === 'failed') {
                title = 'Production Failed';
                message = `Unfortunately, the production for "${result.brief?.business_name || 'Campaign'}" encountered an error.`;
            } else if (statusToSync === 'processing') {
                title = 'Production Processing';
                message = `The AI Producer is now deep-processing your creative matrix for "${result.brief?.business_name || 'Campaign'}".`;
            }

            await createNotification({
                userId,
                type: `AI_PRODUCER_STATUS_${statusToSync.toUpperCase()}`,
                title,
                message,
                link: `https://adplatform.raver.ai/dashboard/projects?campaignId=${result.campaign_id}`,
                metadata: { campaignId: result.campaign_id, status: statusToSync }
            });
        }

        // 5. Upsert high-level Campaign record
        await (prisma as any).campaign.upsert({
          where: { id: result.campaign_id },
          create: {
            id: result.campaign_id,
            userId,
            name: result.brief?.business_name || 'AI Campaign',
            status: statusToSync,
            audience: result.brief?.target_audience,
            format: result.brief?.format,
            platforms: result.brief?.platform ? [result.brief.platform] : [],
            tones: result.brief?.tone ? [result.brief.tone] : [],
            visualStyles: result.brief?.mood ? [result.brief.mood] : []
          },
          update: {
            status: statusToSync,
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

    // Fetch primary tracking records from local DB
    // We rely on local Campaign table as the source of truth for the dashboard.
    // Deletions are respected because we no longer blindly sync from Proxy on every list call.
    const campaigns = await (prisma as any).campaign.findMany({
      where: { userId },
      include: {
        metrics: true
      },
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
    const body = req.body || {}; // Defensive fallback for undefined body

    let result;
    try {
      result = await producerService.approveCampaign(campaign_id as string, body);
    } catch (proxyError: any) {
      console.warn(`[AIProducerController] External approval failed for ${campaign_id}, proceeding with local update:`, proxyError.message);

      // Fallback: Use body data to update local record if AI backend doesn't have it
      result = {
        campaign_id: campaign_id,
        status: body.approved !== false ? 'approved' : 'rejected', // Default to approved unless explicitly false
        approval: {
          approved: body.approved !== false,
          notes: body.notes || '',
          is_local_fallback: true
        }
      };
    }

    if (userId && campaign_id) {
      const status = result.status || (body.approved !== false ? 'approved' : 'rejected');
      try {
        // Update ProducerResult
        const existingResult = await (prisma as any).producerResult.findUnique({ where: { campaignId: campaign_id } });

        await (prisma as any).producerResult.upsert({
          where: { campaignId: campaign_id },
          create: {
            userId,
            campaignId: campaign_id,
            status: status,
            result: result
          },
          update: {
            status: status,
            result: {
              ...(existingResult?.result || {}),
              approval: {
                approved: body.approved !== false,
                notes: body.notes || '',
                result: result
              }
            }
          }
        });

        // Update Campaign
        await (prisma as any).campaign.upsert({
          where: { id: campaign_id },
          create: {
            id: campaign_id,
            userId,
            name: 'AI Campaign',
            status: status
          },
          update: { status: status }
        });

        // Trigger notification
        await createNotification({
          userId,
          type: status === 'approved' ? 'AI_PRODUCER_APPROVED' : 'AI_PRODUCER_REJECTED',
          title: status === 'approved' ? 'Production Approved' : 'Production Rejected',
          message: status === 'approved'
            ? `Your campaign production for "${campaign_id}" has been approved.`
            : `Your campaign production for "${campaign_id}" has been rejected.`,
          link: `https://adplatform.raver.ai/dashboard/projects?campaignId=${campaign_id}`,
          metadata: { campaignId: campaign_id, status }
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
      // 2a. Delete from Agent Result tables (Isolated data)
      const where = { campaignId: campaign_id, userId };

      await (prisma as any).producerResult.deleteMany({ where });
      await (prisma as any).imageLeadResult.deleteMany({ where });
      await (prisma as any).audioLeadResult.deleteMany({ where });
      await (prisma as any).copyLeadResult.deleteMany({ where });
      await (prisma as any).editorResult.deleteMany({ where });

      // 2b. Delete from AISession (Legacy or Director chats)
      await (prisma as any).aISession.deleteMany({ where });

      // 2c. Delete associated Assets (Optional but recommended for full cleanup)
      await (prisma as any).asset.deleteMany({ where: { campaignId: campaign_id, userId } });

      // 2d. Delete associated Notifications
      // We use raw execution because filtering by JSONB metadata->>'campaignId' is most reliable via SQL
      await (prisma as any).$executeRaw`DELETE FROM "Notification" WHERE "userId" = ${userId}::uuid AND "metadata"->>'campaignId' = ${campaign_id}`;

      // 2e. Delete high-level Campaign record
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
