import { Request, Response } from 'express';
import * as adsService from './service';

const handle = (fn: (body: any) => Promise<any>) => async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await fn(req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateCampaign = handle(adsService.generateCampaign);
export const generateVariations = handle(adsService.generateVariations);
export const generateMultipleFal = handle(adsService.generateMultipleFal);
export const generateAudio = handle(adsService.generateAudio);
export const generatePreviews = handle(adsService.generatePreviews);
