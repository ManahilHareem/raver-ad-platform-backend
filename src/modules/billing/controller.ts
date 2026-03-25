import { Request, Response } from 'express';
import * as billingService from './service'; // Resync TS server

export const getSubscription = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const subscription = await billingService.getSubscriptionPlan(userId);
    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
};

export const addPaymentMethod = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const result = await billingService.addPaymentMethod(authReq.user?.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to add payment method' });
  }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const authReq = req as any;
    const result = await billingService.updatePaymentMethod(id, authReq.user?.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update payment method' });
  }
};

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const result = await billingService.getPaymentMethods(authReq.user?.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment methods' });
  }
};
