import { Request, Response } from 'express';
import * as templateService from './service';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await templateService.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const template = await templateService.createTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create template' });
  }
};

export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await templateService.getTemplateById(id as string);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch template' });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await templateService.updateTemplate(id as string, req.body);
    res.json({ success: true, data: template });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await templateService.deleteTemplate(id as string);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
};
