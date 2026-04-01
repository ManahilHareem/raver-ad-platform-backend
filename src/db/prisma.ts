import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;

// Parse connection string for SSL parameters as pg doesn't naturally handle some Prisma-specific flags
const isNoVerify = connectionString.includes('sslmode=no-verify') || connectionString.includes('accept-invalid-certs=true');

const pool = new Pool({ 
  connectionString,
  ssl: isNoVerify ? { rejectUnauthorized: false } : undefined
});

const adapter = new PrismaPg(pool as any);
const prisma: PrismaClient = new PrismaClient({ adapter });

export default prisma;
