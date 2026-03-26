import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

async function verifyMigration() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  const appsCount = await db.execute(sql`SELECT COUNT(*) FROM apps`);
  const serverAppsCount = await db.execute(sql`SELECT COUNT(*) FROM server_apps`);
  const websitesWithApps = await db.execute(sql`SELECT COUNT(*) FROM server_websites WHERE application IS NOT NULL AND application != ''`);

  console.log('Apps created:', appsCount.rows[0].count);
  console.log('Server-apps relationships created:', serverAppsCount.rows[0].count);
  console.log('Original websites with applications:', websitesWithApps.rows[0].count);

  const sampleApps = await db.execute(sql`
    SELECT a.name, COUNT(sa.id) as server_count
    FROM apps a
    LEFT JOIN server_apps sa ON a.id = sa.app_id
    GROUP BY a.id, a.name
    ORDER BY server_count DESC
    LIMIT 5
  `);

  console.log('\nSample apps with server counts:');
  sampleApps.rows.forEach((row: any) => {
    console.log(`  ${row.name}: ${row.server_count} servers`);
  });

  await client.end();
}

verifyMigration().catch(console.error);
