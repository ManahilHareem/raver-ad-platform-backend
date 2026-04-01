import { Request, Response } from 'express';
import * as ElevenLabsService from './service';

export const getVoices = async (req: Request, res: Response) => {
  try {
    const voices = await ElevenLabsService.fetchElevenLabsVoices();
    
    return res.status(200).json({
      success: true,
      data: voices,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};  