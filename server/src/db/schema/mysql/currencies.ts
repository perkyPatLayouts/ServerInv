import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";

export const currencies = mysqlTable("currencies", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
});
