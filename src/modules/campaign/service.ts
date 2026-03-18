import prisma from '../../db/prisma';

const isValidUuid = (uuid: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

export const getAllCampaigns = async () => {
  return await prisma.campaign.findMany({
    include: { metrics: true }
  });
};

export const getCampaignById = async (id: string) => {
  if (!isValidUuid(id)) return null;
  return await prisma.campaign.findUnique({
    where: { id },
    include: { metrics: true }
  });
};

export const createCampaign = async (data: any) => {
  // Map singular 'platform' to 'platforms' array if needed
  let platforms = data.platforms || [];
  if (data.platform && platforms.length === 0) {
    platforms = [data.platform];
  }

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
};

export const updateCampaign = async (id: string, data: any) => {
  if (!isValidUuid(id)) throw new Error('Invalid Campaign ID format');
  return await prisma.campaign.update({
    where: { id },
    data
  });
};

export const deleteCampaign = async (id: string) => {
  if (!isValidUuid(id)) throw new Error('Invalid Campaign ID format');
  return await prisma.campaign.delete({
    where: { id }
  });
};
