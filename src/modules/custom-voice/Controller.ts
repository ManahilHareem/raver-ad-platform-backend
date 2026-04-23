import { Request, Response } from 'express';
import * as Service from './service';

export const cloneVoice = async (req: Request, res: Response) => {
  try {
    const result = await Service.cloneVoice(req.body, req.files as Express.Multer.File[]);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message || 'Internal Server Error', data: error.data });
  }
};

export const cloneVoiceFromRecording = async (req: Request, res: Response) => {
  try {
    const result = await Service.cloneVoiceFromRecording(req.body, req.files as Express.Multer.File[]);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message || 'Internal Server Error', data: error.data });
  }
};

export const listVoices = async (req: Request, res: Response) => {
  try {
    const result = await Service.listVoices();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message || 'Internal Server Error', data: error.data });
  }
};

export const getVoiceDetails = async (req: Request, res: Response) => {
  try {
    const result = await Service.getVoiceDetails(req.params.voice_id as string);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message || 'Internal Server Error', data: error.data });
  }
};

export const deleteCustomVoice = async (req: Request, res: Response) => {
  try {
    const result = await Service.deleteCustomVoice(req.params.voice_id as string);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message || 'Internal Server Error', data: error.data });
  }
};

export const testVoice = async (req: Request, res: Response) => {
  try {
    const result = await Service.testVoice(req.params.voice_id as string, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message || 'Internal Server Error', data: error.data });
  }
};
