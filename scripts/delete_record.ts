import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connectionString = `${process.env.DATABASE_URL}`;
  const isNoVerify = connectionString.includes('sslmode=no-verify') || connectionString.includes('accept-invalid-certs=true');
  const pool = new Pool({ 
    connectionString,
    ssl: isNoVerify ? { rejectUnauthorized: false } : undefined
  });
  const adapter = new PrismaPg(pool as any);
  const prisma: any = new PrismaClient({ adapter });

  const recordId = 'e37d3fc5-2dae-4148-ae0f-77542b0ef00f';

  try {
    console.log(`Searching for ImageLeadResult with ID: ${recordId}...`);
    
    // Attempt deletion
    const deleted = await prisma.imageLeadResult.delete({
      where: { id: recordId }
    });
    
    console.log('Successfully deleted record:', deleted);
  } catch (err: any) {
    if (err.code === 'P2025') {
       console.log('Record not found (already deleted).');
    } else {
       console.error('Error during deletion:', err.message);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => console.error(e));
