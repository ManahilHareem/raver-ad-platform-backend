import { Request, Response } from 'express';
import * as assetService from './service'; // Resync TS server

export const getAssets = async (req: Request, res: Response) => {
  try {
    const assets = await assetService.getAssets();
    res.json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assets' });
  }
};

export const uploadAsset = async (req: Request, res: Response) => {
  try {
    const uploadData = await assetService.getUploadUrl(req.body);
    res.status(201).json({ success: true, data: uploadData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate upload URL' });
  }
};

export const getAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = await assetService.getAsset(id as string);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch asset' });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await assetService.deleteAsset(id as string);
    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete asset' });
  }
};
