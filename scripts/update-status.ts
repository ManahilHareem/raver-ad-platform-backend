import prisma from '../src/db/prisma';

async function main() {
  const targetSessionId = '1776437022066';
  
  // Find the specific AI Session
  const session = await (prisma as any).aISession.findUnique({
    where: { sessionId: targetSessionId }
  });

  if (!session) {
    console.error(`Session ${targetSessionId} not found in the database.`);
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

  console.log(`Successfully updated specific session ${sessionId} to ready_for_human_review`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
