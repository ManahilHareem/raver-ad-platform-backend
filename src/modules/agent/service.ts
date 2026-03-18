import prisma from '../../db/prisma';

export const getAllAgents = async () => {
  return await prisma.agent.findMany();
};

export const createAgent = async (data: any) => {
  return await prisma.agent.create({
    data
  });
};

export const getAgentById = async (id: string) => {
  return await prisma.agent.findUnique({
    where: { id }
  });
};

export const updateAgent = async (id: string, data: any) => {
  return await prisma.agent.update({
    where: { id },
    data
  });
};

export const deleteAgent = async (id: string) => {
  return await prisma.agent.delete({
    where: { id }
  });
};

export const executeAgentTask = async (id: string, taskData: any) => {
  // Update status to processing internally to mimic queue start
  return await prisma.agent.update({
    where: { id },
    data: { status: 'processing' }
  });
};
