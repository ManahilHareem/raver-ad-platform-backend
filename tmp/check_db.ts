import prisma from '../src/db/prisma';

async function run() {
  const sessions = await (prisma as any).aISession.findMany();
  console.log('--- ALL AI SESSIONS ---');
  console.log(JSON.stringify(sessions, null, 2));
  
  const campaigns = await (prisma as any).campaign.findMany();
  console.log('--- ALL CAMPAIGNS ---');
  console.log(JSON.stringify(campaigns, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
