import prisma from '../../db/prisma';

const isValidUuid = (uuid: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

export const getAllCampaigns = async () => {
  try {
    return await prisma.campaign.findMany({
      include: { metrics: true }
    });
  } catch (error) {
    console.error('Error fetching all campaigns:', error);
    throw new Error('Could not retrieve campaigns from database.');
  }
};

export const getCampaignById = async (id: string) => {
  if (!isValidUuid(id)) return null;
  try {
    return await prisma.campaign.findUnique({
      where: { id },
      include: { metrics: true }
    });
  } catch (error) {
    console.error(`Error fetching campaign by ID (${id}):`, error);
    throw new Error('Could not retrieve campaign from database.');
  }
};

export const createCampaign = async (data: any) => {
  // Map singular 'platform' to 'platforms' array if needed
  let platforms = data.platforms || [];
  if (data.platform && platforms.length === 0) {
    platforms = [data.platform];
  }

  try {
    return await prisma.campaign.create({
      data: {
        userId: data.userId,
        name: data.name,
        objective: data.objective || data.config?.objective,
        audience: data.audience || data.config?.audience,
        visualStyles: data.visualStyles || data.config?.visualStyles || [],
        tones: data.tones || data.config?.tones || [],
        colorScheme: data.colorScheme || data.config?.colorScheme,
        platforms: platforms.length > 0 ? platforms : (data.config?.platforms || []),
        duration: data.duration || data.config?.duration,
        format: data.format || data.config?.format,
        budget: Number(data.budget) || 0,
        status: "draft",
        config: data.config
      }
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw new Error('Campaign creation failed.');
  }
};

export const updateCampaign = async (id: string, data: any) => {
  if (!isValidUuid(id)) throw new Error('Invalid Campaign ID format');
  try {
    return await prisma.campaign.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error(`Error updating campaign ID (${id}):`, error);
    throw new Error('Campaign update failed.');
  }
};

export const deleteCampaign = async (id: string) => {
  if (!isValidUuid(id)) throw new Error('Invalid Campaign ID format');
  try {
    return await prisma.campaign.delete({
      where: { id }
    });
  } catch (error) {
    console.error(`Error deleting campaign ID (${id}):`, error);
    throw new Error('Campaign deletion failed.');
  }
};
