import prisma from '../../db/prisma';

export const getAllTemplates = async () => {
  return await prisma.template.findMany();
};

export const createTemplate = async (data: any) => {
  return await prisma.template.create({
    data
  });
};

export const getTemplateById = async (id: string) => {
  return await prisma.template.findUnique({
    where: { id }
  });
};

export const updateTemplate = async (id: string, data: any) => {
  return await prisma.template.update({
    where: { id },
    data
  });
};

export const deleteTemplate = async (id: string) => {
  return await prisma.template.delete({
    where: { id }
  });
};
