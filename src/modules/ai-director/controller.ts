import { Request, Response } from 'express';
import * as directorService from './service';

export const chat = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await directorService.chat(req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getSession = async (req: Request, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const result = await directorService.getSession(session_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getUpdate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { session_id } = req.params;
    const result = await directorService.getUpdate(session_id as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const listSessions = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await directorService.listSessions();
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
