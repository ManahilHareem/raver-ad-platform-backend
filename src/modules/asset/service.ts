import prisma from '../../db/prisma';
import s3Client from '../../config/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

export const getPresignedUploadUrl = async (fileName: string, contentType: string) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `assets/${Date.now()}-${fileName}`,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { uploadUrl, key: command.input.Key };
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw new Error('Could not generate pre-signed URL.');
  }
};
