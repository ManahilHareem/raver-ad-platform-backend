import { Request, Response } from 'express';
import * as agentService from './service';

export const getAgents = async (req: Request, res: Response) => {
  try {
    const agents = await agentService.getAllAgents();
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch agents' });
  }
};

export const createAgent = async (req: Request, res: Response) => {
  try {
    const agent = await agentService.createAgent(req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create agent' });
  }
};

export const getAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await agentService.getAgentById(id as string);
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, data: agent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch agent' });
  }
};

export const updateAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await agentService.updateAgent(id as string, req.body);
    res.json({ success: true, data: agent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update agent' });
  }
};

export const deleteAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await agentService.deleteAgent(id as string);
    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete agent' });
  }
};

export const executeAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await agentService.executeAgentTask(id as string, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to execute agent' });
  }
};
