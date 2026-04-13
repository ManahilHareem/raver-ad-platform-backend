import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found to associate the production with.');
    return;
  }
  const campaignId = 'mock-prod-' + Math.random().toString(36).substring(2, 7);
  const campaign = await (prisma as any).campaign.create({
    data: {
      id: campaignId,
      userId: user.id,
      name: 'Approved Premium Production',
      status: 'approved',
      budget: 5000,
      platforms: ['Instagram', 'TikTok'],
      tones: ['Energetic'],
      visualStyles: ['Cinematic']
    }
  });

  await (prisma as any).producerResult.create({
    data: {
      userId: user.id,
      campaignId: campaignId,
      status: 'approved',
      brief: { business_name: 'Approved Premium Production', objective: 'Brand Awareness' },
      result: { video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
    }
  });

  console.log('Successfully created an Approved Production record:', campaignId);
}
main().finally(() => prisma.$disconnect());
