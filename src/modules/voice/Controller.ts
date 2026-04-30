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

export const getVoiceById = async (req: Request, res: Response) => {
  try {
    const { voice_id } = req.params;
    const voice = await ElevenLabsService.fetchElevenLabsVoice(voice_id as string);
    
    return res.status(200).json({
      success: true,
      data: voice,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const generateTTS = async (req: Request, res: Response) => {
  try {
    const { text, voice_id = 'EXAVITQu4vr4xnSDxMaL' } = req.body; 
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }
    const audioBuffer = await ElevenLabsService.generateElevenLabsTTS(voice_id, text);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    return res.send(audioBuffer);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};