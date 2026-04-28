import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const isNoVerify = connectionString.includes('sslmode=no-verify') || connectionString.includes('accept-invalid-certs=true');

const pool = new Pool({ 
  connectionString,
  ssl: isNoVerify ? { rejectUnauthorized: false } : undefined
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function listAllUsers() {
  try {
    console.log(`\n--- Fetching all users from database ---\n`);

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            campaigns: true,
            assets: true,
            aiSessions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log('❌ No users found.');
      return;
    }

    console.log(`${'Email'.padEnd(30)} | ${'ID'.padEnd(36)} | ${'Campaigns'.padEnd(10)} | ${'Created At'}`);
    console.log('-'.repeat(100));

    users.forEach(u => {
      console.log(`${u.email.padEnd(30)} | ${u.id.padEnd(36)} | ${String(u._count.campaigns).padEnd(10)} | ${u.createdAt.toISOString().split('T')[0]}`);
    });

    console.log(`\nTotal Users: ${users.length}`);

  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

listAllUsers();
