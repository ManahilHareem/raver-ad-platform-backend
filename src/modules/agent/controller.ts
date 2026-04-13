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

import { AuthRequest } from '../../middleware/auth';
import prisma from '../../db/prisma';

export const getAgentTaskCounts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [
      directorTasks,
      producerTasks,
      imageLeadTasks,
      copyLeadTasks,
      audioLeadTasks,
      editorTasks,
      qualityLeadTasks
    ] = await Promise.all([
      prisma.aISession.count({ where: { userId } }),
      prisma.producerResult.count({ where: { userId } }),
      prisma.imageLeadResult.count({ where: { userId } }),
      prisma.copyLeadResult.count({ where: { userId } }),
      prisma.audioLeadResult.count({ where: { userId } }),
      prisma.editorResult.count({ where: { userId } }),
      prisma.qualityLeadResult.count({ where: { userId } })
    ]);

    return res.json({
      success: true,
      data: {
        "Raver Director": directorTasks,
        "Raver Producer": producerTasks,
        "Raver Image Lead": imageLeadTasks,
        "Raver Copy Lead": copyLeadTasks,
        "Raver Audio Lead": audioLeadTasks,
        "Raver Editor": editorTasks,
        "Raver Quality Lead": qualityLeadTasks
      }
    });
  } catch (error: any) {
    console.error('[AgentController] Error fetching task counts:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch agent task counts' });
  }
};
