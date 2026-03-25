import prisma from '../../db/prisma';
import s3Client from '../../config/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const getAllAssets = async (userId: string) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`[AssetService] Found ${assets.length} assets for user ${userId}`);
    return assets;
  } catch (error) {
    console.error('[AssetService] Error fetching assets for user:', userId, error);
    throw new Error('Could not fetch assets from database.');
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

export const getUserStorageStats = async (userId: string) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { userId },
      select: { fileSize: true }
    });

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
      expiresIn: 3600,
      signableHeaders: new Set(['host']), // ONLY sign the host, making it super easy for frontend!
    });
    console.log(`[AssetService] Generated pre-signed URL for key: ${key}`);
    return { uploadUrl, key: command.input.Key };
  } catch (error) {
    console.error('[AssetService] Error generating pre-signed URL:', error);
    throw new Error('Could not generate pre-signed URL.');
  }
};
