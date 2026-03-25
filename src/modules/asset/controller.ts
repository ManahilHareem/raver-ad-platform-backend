import { Request, Response } from 'express';
import * as assetService from './service'; // Resync TS server

export const getAssets = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const assets = await assetService.getAllAssets(userId);
    const stats = await assetService.getUserStorageStats(userId);
    
    // Explicitly tell the browser not to cache this list
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ 
      success: true, 
      data: assets,
      metadata: {
        stats: [
          { label: "Total Assets", value: stats.totalAssets.toString() },
          { label: "Storage Used", value: `${stats.storageUsedMB} MB` },
          { label: "Storage Available", value: stats.storageUsedBytes >= stats.quotaBytes ? "0 MB" : `${stats.storageAvailableMB} MB` },
          { label: "Quota", value: "1 GB" }
        ]
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch assets' });
  }
};

export const uploadAsset = async (req: Request, res: Response) => {
  try {
    const { filename, contentType, fileSize } = req.body;
    const authReq = req as any;
    const userId = authReq.user?.id;

    if (!filename || !contentType || fileSize === undefined) {
      return res.status(400).json({ success: false, message: 'filename, contentType, and fileSize are required' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check storage limit (1GB)
    const stats = await assetService.getUserStorageStats(userId);
    if (stats.storageUsedBytes >= stats.quotaBytes) {
      return res.status(403).json({ 
        success: false, 
        message: 'Storage limit reached (1GB). Please delete some assets to upload more.' 
      });
    }

    const { uploadUrl, key } = await assetService.getPresignedUploadUrl(filename, contentType);

    // Create the record in the database immediately
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION || 'us-east-1';
    const permanentUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    console.log(`Generating upload for: ${filename} -> ${key}`);
    console.log(`Permanent URL: ${permanentUrl}`);

    const asset = await assetService.createAsset({
      userId,
      type: contentType.split('/')[0],
      url: permanentUrl,
      fileSize: Number(fileSize), // Ensure it's a number
    });

    console.log('Asset saved to DB:', asset.id);

    res.status(201).json({ 
      success: true, 
      data: { 
        uploadUrl, 
        asset 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to generate upload URL' });
  }
};

export const getAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = await assetService.getAssetById(id as string);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, data: asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch asset' });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await assetService.deleteAsset(id as string);
    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete asset' });
  }
};
