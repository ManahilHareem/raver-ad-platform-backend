import { Request, Response } from 'express';
import * as imageLeadService from './service';

const handle = (fn: (...args: any[]) => Promise<any>) => async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await fn(req.body || req.params.session_id);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateImages = handle(imageLeadService.generateImages);
export const enhanceImage = handle(imageLeadService.enhanceImage);
export const getVault = async (req: Request, res: Response): Promise<any> => {
    try {
        const { session_id } = req.params;
        const result = await imageLeadService.getVault(session_id as string);
        return res.json({ success: true, data: result });
    } catch (error: any) {
        return res.status(error.status || 500).json({ success: false, message: error.message });
    }
};
