import { Request, Response } from 'express';
import * as billingService from './service'; // Resync TS server

export const getSubscription = async (req: Request, res: Response) => {
  try {
    const subscription = await billingService.getSubscription();
    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
};

export const addPaymentMethod = async (req: Request, res: Response) => {
  try {
    const result = await billingService.addPaymentMethod(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add payment method' });
  }
};
