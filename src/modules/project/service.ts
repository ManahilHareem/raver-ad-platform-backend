import prisma from '../../db/prisma';

export const getAllProjects = async () => {
  return await prisma.project.findMany({
    include: { campaigns: true }
  });
};

export const createProject = async (data: any) => {
  return await prisma.project.create({
    data
  });
};

export const getProjectById = async (id: string) => {
  return await prisma.project.findUnique({
    where: { id },
    include: { campaigns: true }
  });
};

export const updateProject = async (id: string, data: any) => {
  return await prisma.project.update({
    where: { id },
    data
  });
};

export const deleteProject = async (id: string) => {
  return await prisma.project.delete({
    where: { id }
  });
};
