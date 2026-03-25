import { Request, Response } from 'express';
import * as assetService from './service'; // Resync TS server

export const getAssets = async (req: Request, res: Response) => {
  try {
    const assets = await assetService.getAllAssets();
    res.json({ success: true, data: assets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch assets' });
  }
};

export const uploadAsset = async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ success: false, message: 'filename and contentType are required' });
    }

    const { uploadUrl, key } = await assetService.getPresignedUploadUrl(filename, contentType);
    
    // Return the URL and the key (which will be used as the asset's URI after upload)
    res.status(201).json({ 
      success: true, 
      data: { 
        uploadUrl, 
        assetId: key 
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
