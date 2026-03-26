import prisma from '../../db/prisma';

const isValidUuid = (uuid: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

export const getAllUsers = async () => {
  return await prisma.user.findMany({ 
    select: { 
      id: true, email: true, fullName: true, professionalRole: true, bio: true, 
      avatarUrl: true, instagram: true, facebook: true, twitter: true, linkedin: true, 
      website: true, campaignUpdates: true, aiInsights: true, teamActivity: true, 
      weeklySummary: true, createdAt: true 
    } 
  });
};

export const getUserById = async (id: string) => {
  if (!isValidUuid(id)) return null;
  return await prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, email: true, fullName: true, professionalRole: true, bio: true, 
      avatarUrl: true, instagram: true, facebook: true, twitter: true, linkedin: true, 
      website: true, campaignUpdates: true, aiInsights: true, teamActivity: true, 
      weeklySummary: true, createdAt: true 
    }
  });
};

export const getMe = async (id?: string) => {
  if (!id || !isValidUuid(id)) return null;
  return await prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, email: true, fullName: true, professionalRole: true, bio: true, 
      avatarUrl: true, instagram: true, facebook: true, twitter: true, linkedin: true, 
      website: true, campaignUpdates: true, aiInsights: true, teamActivity: true, 
      weeklySummary: true, createdAt: true 
    }
  });
};

export const updateSettings = async (id: string, data: any) => {
  if (!isValidUuid(id)) throw new Error('Invalid User ID format');
  // Can be mapped to billing/settings later based on exact schema fields required
  return await prisma.user.update({
    where: { id },
    data
  });
};

export const createUser = async (data: any) => {
  return await prisma.user.create({
    data
  });
};

export const updateUser = async (id: string, data: any) => {
  if (!isValidUuid(id)) throw new Error('Invalid User ID format');
  // Filter out fields that are not in the schema or that we don't want to update via this endpoint
  const allowedFields = [
    'fullName', 'professionalRole', 'bio', 'avatarUrl', 
    'instagram', 'facebook', 'twitter', 'linkedin', 'website',
    'campaignUpdates', 'aiInsights', 'teamActivity', 'weeklySummary'
  ];
  const filteredData: any = {};
  
  Object.keys(data).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredData[key] = data[key];
    }
  });

  return await prisma.user.update({
    where: { id },
    data: filteredData,
    select: { 
      id: true, email: true, fullName: true, professionalRole: true, bio: true, 
      avatarUrl: true, instagram: true, facebook: true, twitter: true, linkedin: true, 
      website: true, campaignUpdates: true, aiInsights: true, teamActivity: true, 
      weeklySummary: true, createdAt: true 
    }
  });
};

export const deleteUser = async (id: string) => {
  if (!isValidUuid(id)) throw new Error('Invalid User ID format');
  return await prisma.user.delete({
    where: { id }
  });
};

export const generateAvatarUploadUrl = async (userId: string, fileName: string, contentType: string) => {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const s3Client = (await import('../../config/s3')).default;
  
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!bucketName) throw new Error('S3 Bucket not configured');

  const extension = fileName.split('.').pop() || 'jpg';
  const key = `avatars/${userId}-${Date.now()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const permanentUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

  return { uploadUrl, permanentUrl, key };
};
