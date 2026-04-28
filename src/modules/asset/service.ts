import prisma from '../../db/prisma';
import s3Client from '../../config/s3';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const getAllAssets = async (userId: string) => {
  try {
    // 1. Fetch from diverse source tables
    const [standardAssets, images, audios, editors, producers, directorSessions] = await Promise.all([
      prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      (prisma as any).imageLeadResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      (prisma as any).audioLeadResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      (prisma as any).editorResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      (prisma as any).producerResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      (prisma as any).aISession.findMany({ where: { userId, type: 'director' }, orderBy: { createdAt: 'desc' } }),
    ]);

    // 2. Normalize agent results into Asset objects
    const aiAssets: any[] = [
      ...images.flatMap((i: any) => {
        const assetsToReturn: any[] = [];
        
        // Push the main image if it exists
        if (i.mainImageUrl) {
          assetsToReturn.push({
            id: `${i.id}-main`,
            userId: i.userId,
            campaignId: i.campaignId,
            type: 'image',
            name: `AI Main Scene - ${i.sessionId?.substring(0, 8) || 'Concept'}`,
            url: i.mainImageUrl,
            createdAt: i.createdAt,
            origin: 'AI Image Lead',
            fileSize: 524288,
            rawMetadata: i.metadata,
            dbId: i.id
          });
        }
        
        // Push individually generated scenes if they exist
        if (i.scenes && Array.isArray(i.scenes)) {
          i.scenes.forEach((scene: any, idx: number) => {
            if (scene.url && scene.url !== i.mainImageUrl) {
              assetsToReturn.push({
                id: `${i.id}-scene-${idx}`,
                userId: i.userId,
                campaignId: i.campaignId,
                type: 'image',
                name: scene.label ? `AI Image: ${scene.label}` : `AI Scene ${idx + 1} - ${i.sessionId?.substring(0, 8) || 'Content'}`,
                url: scene.url,
                createdAt: i.createdAt,
                origin: 'AI Image Lead',
                fileSize: 524288,
                rawMetadata: i.metadata,
                dbId: i.id
              });
            }
          });
        }
        return assetsToReturn;
      }),
      ...audios.flatMap((a: any) => {
        const variations = [];
        if (a.mixUrl) variations.push({
          id: `${a.id}-mix`,
          userId: a.userId,
          campaignId: a.campaignId,
          type: 'audio',
          name: `AI Mix - ${a.sessionId?.substring(0, 8) || 'Mix'}`,
          url: a.mixUrl,
          createdAt: a.createdAt,
          origin: 'AI Audio Lead',
          fileSize: 1572864,
          rawMetadata: a.metadata,
          dbId: a.id
        });
        if (a.voiceoverUrl) variations.push({
          id: `${a.id}-voice`,
          userId: a.userId,
          campaignId: a.campaignId,
          type: 'audio',
          name: `AI Voiceover - ${a.sessionId?.substring(0, 8) || 'Voice'}`,
          url: a.voiceoverUrl,
          createdAt: a.createdAt,
          origin: 'AI Audio Lead',
          fileSize: 1048576,
          rawMetadata: a.metadata,
          dbId: a.id
        });
        if (a.musicUrl) variations.push({
          id: `${a.id}-music`,
          userId: a.userId,
          campaignId: a.campaignId,
          type: 'audio',
          name: `AI Music - ${a.sessionId?.substring(0, 8) || 'Score'}`,
          url: a.musicUrl,
          createdAt: a.createdAt,
          origin: 'AI Audio Lead',
          fileSize: 1048576,
          rawMetadata: a.metadata,
          dbId: a.id
        });
        return variations;
      }),
      ...editors.filter((e: any) => e.videoUrl).map((e: any) => ({
        id: e.id,
        userId: e.userId,
        campaignId: e.campaignId,
        type: 'video',
        name: `AI Video Render - ${e.sessionId?.substring(0, 8) || 'Export'}`,
        url: e.videoUrl,
        createdAt: e.createdAt,
        origin: 'AI Editor',
        fileSize: 10485760,
        rawMetadata: e.metadata,
        dbId: e.id
      })),
      ...producers.flatMap((p: any) => {
        const resultData = (p.result as any) || {};
        const production = resultData.production || {};
        const items: any[] = [];
        
        // Extract Video
        const video = production.video_url || resultData.video_url || production.videoUrl || resultData.videoUrl;
        if (video) items.push({
          id: `${p.id}-video`,
          userId: p.userId,
          campaignId: p.campaignId,
          type: 'video',
          name: `Production Final - ${p.sessionId?.substring(0, 8) || 'Export'}`,
          url: video,
          createdAt: p.createdAt,
          origin: 'AI Producer',
          fileSize: 15728640,
          rawMetadata: resultData,
          dbId: p.id
        });

        // Extract Music
        const music = production.music_url || resultData.music_url || production.musicUrl || resultData.musicUrl;
        if (music) items.push({
          id: `${p.id}-music`,
          userId: p.userId,
          campaignId: p.campaignId,
          type: 'audio',
          name: `Production Music - ${p.sessionId?.substring(0, 8) || 'Score'}`,
          url: music,
          createdAt: p.createdAt,
          origin: 'AI Producer',
          fileSize: 1572864,
          rawMetadata: resultData,
          dbId: p.id
        });

        // Extract Voiceover
        const voice = production.voiceover_url || resultData.voiceover_url || production.voiceoverUrl || resultData.voiceoverUrl;
        if (voice) items.push({
          id: `${p.id}-voice`,
          userId: p.userId,
          campaignId: p.campaignId,
          type: 'audio',
          name: `Production Voice - ${p.sessionId?.substring(0, 8) || 'Voice'}`,
          url: voice,
          createdAt: p.createdAt,
          origin: 'AI Producer',
          fileSize: 1048576,
          rawMetadata: resultData,
          dbId: p.id
        });

        // Extract Images
        const images = production.image_urls || resultData.image_urls || production.imageUrls || resultData.imageUrls || [];
        if (Array.isArray(images)) {
          images.forEach((url, idx) => {
            items.push({
              id: `${p.id}-img-${idx}`,
              userId: p.userId,
              campaignId: p.campaignId,
              type: 'image',
              name: `Production Image ${idx + 1} - ${p.sessionId?.substring(0, 8) || 'Asset'}`,
              url: url,
              createdAt: p.createdAt,
              origin: 'AI Producer',
              fileSize: 524288,
              rawMetadata: resultData,
              dbId: p.id
            });
          });
        }

        return items;
      }),
      ...directorSessions.flatMap((s: any) => {
        const metadata = (s.metadata as any) || {};
        const production = metadata.production || {};
        const items: any[] = [];
        
        const video = production.video_url || metadata.video_url;
        if (video) items.push({
          id: `${s.id}-video`,
          userId: s.userId,
          campaignId: s.campaignId,
          type: 'video',
          name: `Director Render - ${s.sessionId?.substring(0, 8)}`,
          url: video,
          createdAt: s.createdAt,
          origin: 'AI Director',
          fileSize: 15728640,
          rawMetadata: metadata,
          dbId: s.id
        });

        const music = production.music_url || metadata.music_url;
        if (music) items.push({
          id: `${s.id}-music`,
          userId: s.userId,
          campaignId: s.campaignId,
          type: 'audio',
          name: `Director Music - ${s.sessionId?.substring(0, 8)}`,
          url: music,
          createdAt: s.createdAt,
          origin: 'AI Director',
          fileSize: 1572864,
          rawMetadata: metadata,
          dbId: s.id
        });

        const voice = production.voiceover_url || metadata.voiceover_url;
        if (voice) items.push({
          id: `${s.id}-voice`,
          userId: s.userId,
          campaignId: s.campaignId,
          type: 'audio',
          name: `Director Voice - ${s.sessionId?.substring(0, 8)}`,
          url: voice,
          createdAt: s.createdAt,
          origin: 'AI Director',
          fileSize: 1048576,
          rawMetadata: metadata,
          dbId: s.id
        });

        const images = production.image_urls || metadata.image_urls || [];
        if (Array.isArray(images)) {
          images.forEach((url, idx) => {
            items.push({
              id: `${s.id}-img-${idx}`,
              userId: s.userId,
              campaignId: s.campaignId,
              type: 'image',
              name: `Director Image ${idx + 1} - ${s.sessionId?.substring(0, 8)}`,
              url: url,
              createdAt: s.createdAt,
              origin: 'AI Director',
              fileSize: 524288,
              rawMetadata: metadata,
              dbId: s.id
            });
          });
        }

        return items;
      })
    ];

    // 3. Process and normalize with background sync for sizes
    const normalizedAiAssets = await Promise.all(aiAssets.map(async (asset) => {
      const actualSize = await syncAssetSize(asset);
      return { ...asset, fileSize: actualSize };
    }));

    const normalizedStandardAssets = await Promise.all(standardAssets.map(async (asset) => {
      const actualSize = await syncAssetSize({ ...asset, origin: 'Asset', rawMetadata: asset, dbId: asset.id });
      return { ...asset, fileSize: actualSize };
    }));

    // 4. Combine and sort
    const allAssets = [...normalizedStandardAssets, ...normalizedAiAssets].sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log(`[AssetService] Found ${standardAssets.length} standard assets and ${aiAssets.length} AI assets for user ${userId}`);
    return allAssets;
  } catch (error) {
    console.error('[AssetService] Error fetching combined assets for user:', userId, error);
    throw new Error('Could not fetch combined assets from database.');
  }
};


export const createAsset = async (data: any) => {
  try {
    const asset = await prisma.asset.create({
      data
    });
    console.log(`[AssetService] Created asset ${asset.id} for user ${data.userId}`);
    return asset;
  } catch (error) {
    console.error('[AssetService] Error creating asset:', error);
    throw new Error('Could not save asset to database.');
  }
};

export const getAssetById = async (id: string) => {
  try {
    return await prisma.asset.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error(`Error fetching asset by ID (${id}):`, error);
    throw new Error('Could not fetch asset from database.');
  }
};

export const deleteAsset = async (id: string) => {
  try {
    // 1. Fetch the asset to get the URL
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      throw new Error('Asset not found');
    }

    // 2. Extract key from URL
    // URL format: https://bucket.s3.region.amazonaws.com/assets/filename
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) throw new Error('AWS_S3_BUCKET_NAME not defined');
    
    // The key is everything after the bucket domain
    // We can also extract it by finding the first occurrence of 'assets/'
    const keyIndex = asset.url.indexOf('assets/');
    if (keyIndex !== -1) {
      const key = asset.url.substring(keyIndex);

      // 3. Delete from S3
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      await s3Client.send(deleteCommand);
      console.log(`[AssetService] Deleted file from S3: ${key}`);
    }

    // 4. Delete from DB
    return await prisma.asset.delete({
      where: { id }
    });
  } catch (error) {
    console.error(`[AssetService] Error deleting asset by ID (${id}):`, error);
    throw new Error('Could not delete asset.');
  }
};

export const calculateStatsFromAssets = (assets: any[]) => {
  const totalAssets = assets.length;
  const storageUsedBytes = assets.reduce((sum: number, asset: any) => sum + (asset.fileSize || 0), 0);
  const quotaBytes = 1 * 1024 * 1024 * 1024; // 1 GB in bytes
  const storageAvailableBytes = Math.max(0, quotaBytes - storageUsedBytes);

  return {
    totalAssets,
    storageUsedBytes,
    storageAvailableBytes,
    quotaBytes,
    storageUsedMB: (storageUsedBytes / (1024 * 1024)).toFixed(2),
    storageAvailableMB: (storageAvailableBytes / (1024 * 1024)).toFixed(2),
  };
};

export const getUserStorageStats = async (userId: string) => {
  try {
    // This is essentially doing what getAllAssets does but just for stats.
    // However, to keep it simple and consistent, we'll reuse the logic or call it.
    const allAssets = await getAllAssets(userId);
    return calculateStatsFromAssets(allAssets);
  } catch (error) {
    console.error('[AssetService] Error calculating storage stats:', userId, error);
    throw new Error('Could not calculate storage statistics.');
  }
};

export const getPresignedUploadUrl = async (fileName: string, contentType: string) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');
    }

    // Clean filename: remove everything except alphanumeric and dots
    const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
    const baseName = fileName.includes('.') ? fileName.split('.').slice(0, -1).join('.') : fileName;
    
    const cleanBase = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphen
      .replace(/-+/g, '-')       // Replace multiple hyphens with one
      .replace(/^-|-$/g, '');    // Trim hyphens from ends

    const cleanFileName = extension ? `${cleanBase}.${extension}` : cleanBase;
    const key = `assets/${Date.now()}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    } as any);

    const uploadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600
    });
    console.log(`[AssetService] Generated pre-signed URL for key: ${key}`);
    return { uploadUrl, key: command.input.Key };
  } catch (error) {
    console.error('[AssetService] Error generating pre-signed URL:', error);
    throw new Error('Could not generate pre-signed URL.');
  }
};
export const getS3ObjectSize = async (url: string): Promise<number | null> => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName || !url.includes(bucketName)) return null;

    const keyIndex = url.indexOf('assets/');
    if (keyIndex === -1) return null;
    const key = url.substring(keyIndex);

    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    const response = await s3Client.send(command);
    return response.ContentLength || null;
  } catch (error) {
    // Silently fail to avoid blocking the main flow
    return null;
  }
};

export const syncAssetSize = async (asset: any) => {
  if (asset.fileSize && asset.fileSize > 0 && asset.fileSize !== 524288 && asset.fileSize !== 1048576 && asset.fileSize !== 1572864 && asset.fileSize !== 10485760 && asset.fileSize !== 15728640) {
    return asset.fileSize;
  }

  // Check metadata for cached size
  if (asset.metadata && (asset.metadata as any).actualSize) {
    return (asset.metadata as any).actualSize;
  }

  const actualSize = await getS3ObjectSize(asset.url);
  if (actualSize) {
    // Background update to cache the size
    const updatePromise = (async () => {
      try {
        if (asset.origin === 'Asset') {
          await prisma.asset.update({
            where: { id: asset.dbId || asset.id },
            data: { fileSize: actualSize }
          });
        } else if (asset.origin === 'AI Image Lead') {
          await (prisma as any).imageLeadResult.update({
            where: { id: asset.dbId || asset.id },
            data: { metadata: { ...(asset.rawMetadata || {}), actualSize } }
          });
        } else if (asset.origin === 'AI Audio Lead') {
          await (prisma as any).audioLeadResult.update({
            where: { id: asset.dbId },
            data: { metadata: { ...(asset.rawMetadata || {}), actualSize } }
          });
        } else if (asset.origin === 'AI Editor') {
          await (prisma as any).editorResult.update({
            where: { id: asset.dbId || asset.id },
            data: { metadata: { ...(asset.rawMetadata || {}), actualSize } }
          });
        } else if (asset.origin === 'AI Producer') {
          await (prisma as any).producerResult.update({
            where: { id: asset.dbId || asset.id },
            data: { result: { ...(asset.rawMetadata || {}), actualSize } }
          });
        } else if (asset.origin === 'AI Director') {
          await (prisma as any).aISession.update({
            where: { id: asset.dbId || asset.id },
            data: { metadata: { ...(asset.rawMetadata || {}), actualSize } }
          });
        }
      } catch (e) {
        console.error(`[AssetService] Failed to cache size for ${asset.id}:`, e);
      }
    })();
    return actualSize;
  }

  return asset.fileSize || 0;
};
