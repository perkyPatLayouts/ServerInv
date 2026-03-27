import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import pg from "pg";
import mysql from "mysql2/promise";
import * as schema from "./schema/index.js";
import { detectDatabaseType } from "./utils.js";

const databaseUrl = process.env.DATABASE_URL!;
export const DB_TYPE = detectDatabaseType(databaseUrl);

// Database connection and pool
// For PostgreSQL, pool is created synchronously
// For MySQL, pool is created asynchronously but mysql2/promise handles it internally
let db: any;
let pool: any;

if (DB_TYPE === 'postgres') {
  pool = new pg.Pool({ connectionString: databaseUrl });
  db = drizzlePg(pool, { schema });
} else {
  // mysql2/promise.createPool is synchronous, it returns a promise-based pool wrapper
  pool = mysql.createPool(databaseUrl);
  db = drizzleMysql(pool, { schema, mode: 'default' });
}

export { db, pool };
