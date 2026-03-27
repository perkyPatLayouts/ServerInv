import "dotenv/config";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migrateMysql } from "drizzle-orm/mysql2/migrator";
import pg from "pg";
import mysql from "mysql2/promise";
import { detectDatabaseType } from "./utils.js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL!;
  const dbType = detectDatabaseType(databaseUrl);

  if (dbType === 'postgres') {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    const db = drizzlePg(pool);
    console.log("Running PostgreSQL migrations...");
    await migratePg(db, { migrationsFolder: "./drizzle/postgres" });
    await pool.end();
  } else {
    const pool = await mysql.createPool(databaseUrl);
    const db = drizzleMysql(pool);
    console.log("Running MySQL migrations...");
    await migrateMysql(db, { migrationsFolder: "./drizzle/mysql" });
    await pool.end();
  }

  console.log("Migrations complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
