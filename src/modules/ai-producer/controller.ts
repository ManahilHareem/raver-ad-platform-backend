import { Request, Response } from 'express';
import * as producerService from './service';

export const launchCampaign = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await producerService.launchCampaign(req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getCampaign = async (req: Request, res: Response): Promise<any> => {
  try {
    const { campaign_id } = req.params;
    const result = await producerService.getCampaign(campaign_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const listCampaigns = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await producerService.listCampaigns();
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const approveCampaign = async (req: Request, res: Response): Promise<any> => {
  try {
    const { campaign_id } = req.params;
    const result = await producerService.approveCampaign(campaign_id as string, req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
