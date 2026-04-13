import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userId = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';
  const campaignId = '29440e40-6401-4b6d-9b42-baf6061950c3';
  const status = 'approved';

  console.log('Seeding campaign for user:', userId);

  // 1. Create/Upsert the high-level Campaign record
  const campaign = await (prisma as any).campaign.upsert({
    where: { id: campaignId },
    update: {
      status,
      name: 'Seeded Approved Campaign',
    },
    create: {
      id: campaignId,
      userId,
      name: 'Seeded Approved Campaign',
      status,
      budget: 1200,
      platforms: ['Instagram', 'TikTok'],
      tones: ['Professional'],
      visualStyles: ['Modern'],
      objective: 'Conversion',
      format: 'Square'
    }
  });

  // 2. Create/Upsert the ProducerResult record
  const resultData = {
    campaign_id: campaignId,
    status: status,
    brief: {
      business_name: 'Seeded Brand',
      product_description: 'An approved production for testing.',
      platform: 'Instagram',
      tone: 'Professional'
    },
    result: {
      video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      status: 'completed'
    }
  };

  await (prisma as any).producerResult.upsert({
    where: { campaignId },
    update: {
      status,
      result: resultData
    },
    create: {
      userId,
      campaignId,
      status,
      brief: resultData.brief,
      result: resultData
    }
  });

  console.log('Successfully seeded campaign:', campaignId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
