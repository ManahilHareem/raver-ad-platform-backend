import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as imageLeadService from './service';
import * as assetService from '../asset/service';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

export const generateImages = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { session_id } = req.body;
    const userId = req.user?.id;

    if (session_id && userId) {
      const session = await (prisma as any).aISession.findUnique({
        where: { sessionId: session_id }
      });
      if (session && session.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this session.' });
      }
    }

    const result = await imageLeadService.generateImages(req.body);
    console.log('[ImageLeadController] AI Response received:', JSON.stringify(result).substring(0, 500) + '...');
    
    // Auto-save generated images to User's Asset library
    // The AI backend returns result directly (sometimes with session_id/status: completed)
    if (userId && (result.session_id || result.status === 'completed' || result.success)) {
      const data = result.data || result; // Handle both result.data and flat result
      const scenes: any[] = [];
      if (Array.isArray(data.images)) {
          data.images.forEach((img: any) => {
              if (typeof img === 'string') scenes.push({ url: img });
              else if (img.url) scenes.push({ url: img.url, label: img.label || img.filename });
          });
      }
      if (Array.isArray(data.scenes)) {
        data.scenes.forEach((s: any) => {
          if (s.image_url) scenes.push({ url: s.image_url, label: s.label || s.id });
          if (s.url) scenes.push({ url: s.url, label: s.label || s.filename });
        });
      }
      if (Array.isArray(data.scene_images)) {
        data.scene_images.forEach((s: any) => {
          if (s.image_url) scenes.push({ url: s.image_url, label: s.label || s.scene_id || s.id });
          if (s.url) scenes.push({ url: s.url, label: s.label || s.scene_id || s.id });
        });
      }

      const finalSessionId = data.session_id || session_id || uuidv4();

      // 1. Save results to the dedicated table (NEW)
      try {
        await (prisma as any).imageLeadResult.upsert({
          where: { sessionId: finalSessionId },
          create: {
            userId,
            sessionId: finalSessionId,
            mainImageUrl: data.base_image_url || data.image_url || data.main_image_url || (scenes[0]?.url || null),
            scenes: scenes,
          },
          update: {
            mainImageUrl: data.base_image_url || data.image_url || data.main_image_url || (scenes[0]?.url || null),
            scenes: scenes,
          }
        });
        console.log(`[ImageLeadController] Saved generation results for session ${finalSessionId}`);

        // 1.1 Sync to AISession metadata for quick access (NEW)
        try {
          await (prisma as any).aISession.upsert({
            where: { sessionId: finalSessionId },
            create: {
              userId,
              sessionId: finalSessionId,
              type: 'image-lead',
              metadata: {
                mainImageUrl: data.base_image_url || data.image_url || data.main_image_url || (scenes[0]?.url || null),
                scenes: scenes,
                lastGeneratedAt: new Date().toISOString()
              }
            },
            update: {
              metadata: {
                mainImageUrl: data.base_image_url || data.image_url || data.main_image_url || (scenes[0]?.url || null),
                scenes: scenes,
                lastGeneratedAt: new Date().toISOString()
              }
            }
          });
        } catch (me) {
          console.error('[ImageLeadController] Failed to sync metadata to AISession:', me);
        }
      } catch (e) {
        console.error('[ImageLeadController] Failed to save imageLeadResult:', e);
      }

      // 2. We can still save the main image to Assets for convenience, but maybe the user wants it ONLY in results now.
      // Given "not in assets", I'll skip individual scene assets.
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
      const session = await (prisma as any).aISession.findUnique({
        where: { sessionId: session_id }
      });
      if (session && session.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this session.' });
      }
    }

    const result = await imageLeadService.enhanceImage(req.body);

    // 1. Auto-save enhanced image to ImageLeadResult (NEW Schema)
    if (userId && result.success && result.data?.image_url && session_id) {
      try {
        await (prisma as any).imageLeadResult.upsert({
          where: { sessionId: session_id },
          create: {
            userId,
            sessionId: session_id,
            mainImageUrl: result.data.image_url,
            scenes: []
          },
          update: {
            mainImageUrl: result.data.image_url,
          }
        });
        console.log(`[ImageLeadController] Updated lead result with enhanced image for session ${session_id}`);
      } catch (e) {
        console.error('[ImageLeadController] Failed to update ImageLeadResult with enhanced image:', e);
      }
    }

    // 2. Auto-save enhanced image to User's Asset library
    if (userId && result.success && result.data?.image_url) {
      try {
        await assetService.createAsset({
          userId,
          type: 'image',
          url: result.data.image_url,
          fileSize: 0,
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

        // Verify session ownership
        const session = await (prisma as any).aISession.findUnique({
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

export const listSessions = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const sessions = await (prisma as any).aISession.findMany({
      where: {
        userId,
        type: 'image-lead'
      },
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

        // 1. Fetch from Vault
        const vaultData = await imageLeadService.getVault(session_id);
        
        // 2. Map scenes
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

        // 3. Upsert to Result Table
        const result = await (prisma as any).imageLeadResult.upsert({
            where: { sessionId: session_id },
            create: {
                userId,
                sessionId: session_id,
                mainImageUrl,
                scenes
            },
            update: {
                mainImageUrl,
                scenes
            }
        });

        // 4. Sync to AISession metadata (NEW)
        try {
            await (prisma as any).aISession.upsert({
                where: { sessionId: session_id },
                create: {
                    userId,
                    sessionId: session_id,
                    type: 'image-lead',
                    metadata: {
                        mainImageUrl,
                        scenes,
                        lastSyncedAt: new Date().toISOString()
                    }
                },
                update: {
                    metadata: {
                        mainImageUrl,
                        scenes,
                        lastSyncedAt: new Date().toISOString()
                    }
                }
            });
        } catch (me) {
            console.error('[ImageLeadController] Sync metadata error:', me);
        }

        return res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('[ImageLeadController] Sync Error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}
