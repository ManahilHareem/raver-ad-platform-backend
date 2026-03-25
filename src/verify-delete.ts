import dotenv from 'dotenv';
import prisma from './db/prisma';
import s3Client from './config/s3';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as assetService from './modules/asset/service';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function verifyDelete() {
  console.log('--- STARTING S3 DELETE VERIFICATION ---');
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  const key = `assets/delete-test-${Date.now()}.txt`;
  
  try {
    // 1. Setup: Upload to S3 and Create DB record
    console.log(`1. Setting up test file: ${key}`);
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: 'Delete test content',
      ContentType: 'text/plain'
    });
    await s3Client.send(putCommand);

    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const asset = await prisma.asset.create({
      data: {
        userId: user.id,
        type: 'text',
        url: `https://${bucket}.s3.amazonaws.com/${key}`,
        fileSize: 20
      }
    });
    console.log(`Asset created in DB: ${asset.id}`);

    // 2. Execute: Delete via Service
    console.log('2. Deleting asset via service...');
    await assetService.deleteAsset(asset.id);
    console.log('SUCCESS: Service call finished.');

    // 3. Verify: Check DB
    console.log('3. Verifying DB record is gone...');
    const found = await prisma.asset.findUnique({ where: { id: asset.id } });
    if (found) throw new Error('DB record still exists!');
    console.log('SUCCESS: DB record removed.');

    // 4. Verify: Check S3
    console.log('4. Verifying S3 file is gone...');
    try {
      const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
      await s3Client.send(headCommand);
      throw new Error('S3 file still exists!');
    } catch (e: any) {
      if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
        console.log('SUCCESS: S3 file removed.');
      } else {
        throw e;
      }
    }

    console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');

  } catch (error: any) {
    console.error('FAILED:', error.message);
  }
}

verifyDelete();
