import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as imageLeadService from './service';
import * as assetService from '../asset/service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const generateImages = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id, brief } = req.body;
    const userId = req.user?.id;

    if (session_id && userId) {
      const session = await (prisma as any).imageLeadResult.findUnique({
        where: { sessionId: session_id }
      });
      if (session && session.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this session.' });
      }
    }

    const result = await imageLeadService.generateImages(req.body);
    console.log('[ImageLeadController] AI Response received:', JSON.stringify(result).substring(0, 500) + '...');
    
    if (userId && (result.session_id || result.status === 'completed' || result.success)) {
      const AI_BASE = process.env.AI_BACKEND_URL || 'https://apiplatform.raver.ai';
      const normalizeUrl = (url: string) => (url && url.startsWith('/') ? `${AI_BASE}${url}` : url);

      const data = result.data || result;
      const scenes: any[] = [];
      if (Array.isArray(data.images)) {
          data.images.forEach((img: any) => {
              if (typeof img === 'string') scenes.push({ url: normalizeUrl(img) });
              else if (img.url) scenes.push({ url: normalizeUrl(img.url), label: img.label || img.filename });
          });
      }
      if (Array.isArray(data.scenes)) {
        data.scenes.forEach((s: any) => {
          if (s.image_url) scenes.push({ url: normalizeUrl(s.image_url), label: s.label || s.id });
          if (s.url) scenes.push({ url: normalizeUrl(s.url), label: s.label || s.filename });
        });
      }
      if (Array.isArray(data.scene_images)) {
        data.scene_images.forEach((s: any) => {
          if (s.image_url) scenes.push({ url: normalizeUrl(s.image_url), label: s.label || s.scene_id || s.id });
          if (s.url) scenes.push({ url: normalizeUrl(s.url), label: s.label || s.scene_id || s.id });
        });
      }

      const finalSessionId = data.session_id || session_id;
      const mainImageUrl = normalizeUrl(data.base_image_url || data.image_url || data.main_image_url || (scenes[0]?.url || null));

      if (scenes.length === 0 && mainImageUrl) {
        scenes.push({ url: mainImageUrl, label: 'Scene 1' });
      }

      // Guard: Only save if we have a valid session ID and some content
      if (userId && finalSessionId && (scenes.length > 0 || mainImageUrl)) {
        try {
          await (prisma as any).imageLeadResult.upsert({
            where: { sessionId: finalSessionId },
            update: {
              campaignId: finalSessionId,
              mainImageUrl,
              scenes,
              metadata: {
                ...((result as any).metadata || {}),
                style_prompt: (result as any).style_prompt
              }
            },
            create: {
              userId,
              sessionId: finalSessionId,
              campaignId: finalSessionId,
              mainImageUrl,
              scenes,
              metadata: {
                ...((result as any).metadata || {}),
                style_prompt: (result as any).style_prompt
              }
            }
          });
          console.log(`[ImageLeadController] Persisted local record for ${finalSessionId}`);
        } catch (dbError) {
          console.error('[ImageLeadController] ImageLeadResult persistence error:', dbError);
        }
      } else {
        console.warn(`[ImageLeadController] Skipping save for session ${finalSessionId || 'unknown'}: No content found.`);
      }

      if (data.image_url) {
        try {
          await assetService.createAsset({
            userId,
            type: 'image',
            url: data.image_url,
            fileSize: 0,
          });
        } catch (e) {
          console.error('[ImageLeadController] Failed to save main asset:', e);
        }
      }
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const enhanceImage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.body;
    const userId = req.user?.id;

    if (session_id && userId) {
      const session = await (prisma as any).imageLeadResult.findUnique({
        where: { sessionId: session_id }
      });
      if (session && session.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this session.' });
      }
    }

    const result = await imageLeadService.enhanceImage(req.body);
    console.log('[ImageLeadController] Enhancement result received:', JSON.stringify(result).substring(0, 500) + '...');

    const data = result.data || result;
    const finalSessionId = session_id || data.session_id;
    const imageUrl = data.image_url;

    if (userId && imageUrl && finalSessionId) {
      try {
        await (prisma as any).imageLeadResult.upsert({
          where: { sessionId: finalSessionId },
          create: {
            userId,
            sessionId: finalSessionId,
            campaignId: finalSessionId,
            mainImageUrl: imageUrl,
            scenes: [],
            metadata: { ...result, lastEnhancedAt: new Date().toISOString() }
          },
          update: {
            campaignId: finalSessionId,
            mainImageUrl: imageUrl,
            metadata: { ...result, lastEnhancedAt: new Date().toISOString() }
          }
        });
        console.log(`[ImageLeadController] Updated lead result with enhanced image for session ${finalSessionId}`);
      } catch (e) {
        console.error('[ImageLeadController] Failed to update ImageLeadResult with enhanced image:', e);
      }
    }

    if (userId && imageUrl) {
      try {
        await (prisma as any).asset.create({
          data: {
            userId,
            type: 'image',
            url: imageUrl,
            fileSize: 0,
          }
        });
      } catch (e) {
        console.error('[ImageLeadController] Failed to save enhanced asset:', e);
      }
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getVault = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { session_id } = req.params;
        const userId = req.user?.id;

        const session = await (prisma as any).imageLeadResult.findUnique({
            where: { sessionId: session_id }
        });

        if (session && userId && session.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to this session.' });
        }

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
      await (prisma as any).imageLeadResult.create({
        data: {
          userId,
          sessionId,
          metadata: { ...(metadata || {}), tag: tag || null }
        }
      });
    }

    return res.status(201).json({ success: true, data: { session_id: sessionId } });
  } catch (error: any) {
    console.error('[ImageLeadController]', error);
    return res.status(500).json({ success: false, message: 'Failed to create session' });
  }
};

export const listSessions = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const sessions = await (prisma as any).imageLeadResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: sessions });
  } catch (error: any) {
    console.error('[ImageLeadController] Error listing sessions:', error);
    return res.status(500).json({ success: false, message: 'Failed to list sessions' });
  }
};

export const syncVault = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { session_id } = req.body;
        const userId = req.user?.id;

        if (!session_id || !userId) {
            return res.status(400).json({ success: false, message: 'Missing session_id or unauthorized' });
        }

        const vaultData = await imageLeadService.getVault(session_id);
        
        const scenes: any[] = [];
        if (Array.isArray(vaultData.images)) {
          vaultData.images.forEach((img: any) => {
            let url = img.url;
            if (url.startsWith('/')) url = `${process.env.AI_BACKEND_URL || 'https://apiplatform.raver.ai'}${url}`;
            scenes.push({ url, label: img.label || img.filename });
          });
        }
        if (Array.isArray(vaultData.scene_images)) {
          vaultData.scene_images.forEach((s: any) => {
            let url = s.image_url || s.url;
            if (url) {
                if (url.startsWith('/')) url = `${process.env.AI_BACKEND_URL || 'https://apiplatform.raver.ai'}${url}`;
                scenes.push({ url, label: s.label || s.scene_id || s.id });
            }
          });
        }

        const mainImageUrl = vaultData.base_image_url || vaultData.main_image_url || vaultData.main_image 
            ? ( (vaultData.base_image_url || vaultData.main_image_url || vaultData.main_image).startsWith('/') 
                ? `${process.env.AI_BACKEND_URL || 'https://apiplatform.raver.ai'}${vaultData.base_image_url || vaultData.main_image_url || vaultData.main_image}` 
                : (vaultData.base_image_url || vaultData.main_image_url || vaultData.main_image) )
            : (scenes[0]?.url || null);

        // Guard: Only upsert if we actually found something in the vault
        if (scenes.length > 0 || mainImageUrl) {
            const result = await (prisma as any).imageLeadResult.upsert({
                where: { sessionId: session_id },
                create: {
                    userId,
                    sessionId: session_id,
                    campaignId: session_id,
                    mainImageUrl,
                    scenes,
                    metadata: { ...vaultData, lastSyncedAt: new Date().toISOString() }
                },
                update: {
                    campaignId: session_id,
                    mainImageUrl,
                    scenes,
                    metadata: { ...vaultData, lastSyncedAt: new Date().toISOString() }
                }
            });
            return res.json({ success: true, data: result });
        } else {
            console.warn(`[ImageLeadController] Sync skipped for ${session_id}: Vault is empty.`);
            return res.json({ success: true, message: 'Vault is empty, nothing to sync.', data: [] });
        }
    } catch (error: any) {
        console.error('[ImageLeadController] Sync Error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const deleteSession = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const session = await (prisma as any).imageLeadResult.findUnique({
      where: { sessionId: session_id }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this session' });
    }

    await (prisma as any).imageLeadResult.delete({
      where: { sessionId: session_id }
    });

    return res.json({ success: true, message: 'Visual synthesis session cleared from archives' });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

