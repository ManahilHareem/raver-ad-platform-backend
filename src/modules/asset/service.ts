import prisma from '../../db/prisma';

export const getAllAssets = async () => {
  return await prisma.asset.findMany();
};

export const createAsset = async (data: any) => {
  return await prisma.asset.create({
    data
  });
};

export const getAssetById = async (id: string) => {
  return await prisma.asset.findUnique({
    where: { id }
  });
};

export const deleteAsset = async (id: string) => {
  return await prisma.asset.delete({
    where: { id }
  });
};
