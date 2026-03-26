import { Request, Response } from 'express';
import * as audioService from './service';

const handle = (fn: (body: any) => Promise<any>) => async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await fn(req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const generateMusic = handle(audioService.generateMusic);
export const generateVoiceover = handle(audioService.generateVoiceover);
export const produceAudio = handle(audioService.produceAudio);
export const mixAudio = handle(audioService.mixAudio);
export const getVault = async (req: Request, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const result = await audioService.getVault(session_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
