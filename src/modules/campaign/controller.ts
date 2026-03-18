import { Request, Response } from 'express';
import * as campaignService from './service';

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignService.getAllCampaigns();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
  }
};

export const getCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await campaignService.getCampaignById(id as string);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch campaign' });
  }
};

export const createCampaign = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const campaign = await campaignService.createCampaign({ ...req.body, userId });
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create campaign' });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await campaignService.updateCampaign(id as string, req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update campaign' });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await campaignService.deleteCampaign(id as string);
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete campaign' });
  }
};
