import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL!;
const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');

export default defineConfig({
  schema: isPostgres
    ? "./src/db/schema/postgres/!(index).ts"
    : "./src/db/schema/mysql/!(index).ts",
  out: isPostgres ? "./drizzle/postgres" : "./drizzle/mysql",
  dialect: isPostgres ? "postgresql" : "mysql",
  dbCredentials: { url: databaseUrl },
});
