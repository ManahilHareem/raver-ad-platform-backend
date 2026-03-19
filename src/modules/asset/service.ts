import prisma from '../../db/prisma';

export const getAllAssets = async () => {
  try {
    return await prisma.asset.findMany();
  } catch (error) {
    console.error('Error fetching all assets:', error);
    throw new Error('Could not fetch assets from database.');
  }
};

export const createAsset = async (data: any) => {
  try {
    return await prisma.asset.create({
      data
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    throw new Error('Could not save asset to database.');
  }
};

export const getAssetById = async (id: string) => {
  try {
    return await prisma.asset.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error(`Error fetching asset by ID (${id}):`, error);
    throw new Error('Could not fetch asset from database.');
  }
};

export const deleteAsset = async (id: string) => {
  try {
    return await prisma.asset.delete({
      where: { id }
    });
  } catch (error) {
    console.error(`Error deleting asset by ID (${id}):`, error);
    throw new Error('Could not delete asset from database.');
  }
};
