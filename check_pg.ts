import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkVersion() {
  try {
    await client.connect();
    const res = await client.query('SELECT version()');
    console.log('PostgreSQL Version:', res.rows[0].version);
    
    // Also check if pg_catalog tables are accessible
    const tables = await client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\' LIMIT 5');
    console.log('Public tables found:', tables.rows);
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.end();
  }
}

checkVersion();
