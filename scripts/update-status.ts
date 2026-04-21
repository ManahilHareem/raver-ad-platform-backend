import prisma from '../src/db/prisma';

async function main() {
  // Find the most recently created AI Session
  const session = await (prisma as any).aISession.findFirst({
    where: { type: 'director' },
    orderBy: { createdAt: 'desc' }
  });

  if (!session) {
    console.error(`No sessions found in the database.`);
    return;
  }

  const sessionId = session.sessionId;

  const metadata = session.metadata as any;
  metadata.status = 'ready_for_human_review';
  metadata.campaign_status = 'ready_for_human_review';
  if (metadata.production) {
    metadata.production.status = 'ready_for_human_review';
  } else {
    metadata.production = { status: 'ready_for_human_review' };
  }

  await (prisma as any).aISession.update({
    where: { sessionId },
    data: { metadata }
  });

  if (session.campaignId) {
     await (prisma as any).campaign.updateMany({
       where: { id: session.campaignId },
       data: { status: 'ready_for_human_review' }
     });
     
     await (prisma as any).producerResult.updateMany({
        where: { campaignId: session.campaignId },
        data: { status: 'ready_for_human_review' }
     });
  }

  console.log(`Successfully updated latest session ${sessionId} to ready_for_human_review`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
