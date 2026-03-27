import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";

export const operatingSystems = mysqlTable("operating_systems", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  variant: varchar("variant", { length: 50 }).notNull().default("server"),
});
