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

async function getUserDetails(identifier: string) {
  try {
    console.log(`\n--- Fetching details for: ${identifier} ---\n`);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier.includes('-') && identifier.length > 20 ? identifier : undefined },
          { email: identifier }
        ]
      },
      include: {
        _count: {
          select: {
            campaigns: true,
            assets: true,
            aiSessions: true,
            agents: true
          }
        },
        Billing: true
      }
    });

    if (!user) {
      console.log('❌ User not found.');
      return;
    }

    console.log('👤 User Profile:');
    console.log(`ID:        ${user.id}`);
    console.log(`Email:     ${user.email}`);
    console.log(`Name:      ${user.fullName || 'N/A'}`);
    console.log(`Role:      ${user.professionalRole || 'N/A'}`);
    console.log(`Created:   ${user.createdAt}`);
    
    console.log('\n📊 Statistics:');
    console.log(`Campaigns:   ${user._count.campaigns}`);
    console.log(`Assets:      ${user._count.assets}`);
    console.log(`AI Sessions: ${user._count.aiSessions}`);
    console.log(`Agents:      ${user._count.agents}`);

    if (user.Billing) {
        console.log('\n💳 Billing:');
        console.log(`Plan:      ${(user.Billing as any).plan || 'N/A'}`);
        console.log(`Status:    ${(user.Billing as any).status || 'N/A'}`);
    }

    // Get last 5 campaigns
    const lastCampaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, createdAt: true }
    });

    if (lastCampaigns.length > 0) {
      console.log('\n📅 Recent Campaigns:');
      lastCampaigns.forEach(c => {
        console.log(`- [${c.status.padEnd(10)}] ${c.name.padEnd(30)} (${c.id})`);
      });
    }

  } catch (error) {
    console.error('Error fetching user details:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

const identifier = process.argv[2];
if (!identifier) {
  console.log('Usage: npx ts-node scripts/get_user_details.ts <user_id_or_email>');
  process.exit(1);
}

getUserDetails(identifier);
