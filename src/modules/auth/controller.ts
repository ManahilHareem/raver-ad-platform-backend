import { Request, Response } from 'express';
import * as authService from './service'; // Resync TS server

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await authService.signup(email, password, fullName);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Failed to sign up' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error(error);
    res.status(401).json({ success: false, message: error.message || 'Invalid credentials' });
  }
};
