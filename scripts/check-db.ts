import prisma from '../src/db/prisma';

async function checkDb() {
  const targetId = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';
  console.log('--- Verifying Tables ---');
  try {
    const tables: any[] = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Current Tables:', tables.map(t => t.tablename).join(', '));
    
    console.log(`\n--- Searching for User: ${targetId} ---`);
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (user) {
      console.log('User FOUND:', JSON.stringify(user, null, 2));
    } else {
      console.log('User NOT FOUND.');
      const allUsers = await prisma.user.findMany({ take: 5 });
      console.log('Sample Users in DB:', JSON.stringify(allUsers, null, 2));
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
