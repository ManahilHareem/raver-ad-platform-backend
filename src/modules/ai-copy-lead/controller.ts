import { Request, Response } from 'express';
import * as copyService from './service';

const handle = (fn: (body: any) => Promise<any>) => async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await fn(req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateScript = handle(copyService.generateScript);
export const generateCaptions = handle(copyService.generateCaptions);
export const generateOverlays = handle(copyService.generateOverlays);
export const generateCta = handle(copyService.generateCta);
export const generateHashtags = handle(copyService.generateHashtags);
export const produceCopy = handle(copyService.produceCopy);
