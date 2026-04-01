import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL as string, { ssl: 'require', onnotice: () => {} });

async function testIntrospection() {
  try {
    console.log('Testing raw introspection query...');
    const result = await sql`
      select "ns"."nspname" as "schema", "cls"."relname" as "name"
      from "pg_catalog"."pg_class" as "cls"
      inner join "pg_catalog"."pg_namespace" as "ns" on "cls"."relnamespace" = "ns"."oid"
      where "ns"."nspname" !~ '^pg_' and "ns"."nspname" != 'information_schema'
      and "cls"."relkind" in ('r', 'v')
      limit 5;
    `;
    console.log('Query result:', result);
    if (result.length > 0) {
      console.log('✅ Basic introspection works for this user.');
    } else {
      console.log('❌ No tables found in public schema.');
    }
  } catch (e) {
    console.error('❌ Introspection query failed:', e);
  } finally {
    await sql.end();
  }
}

testIntrospection();
