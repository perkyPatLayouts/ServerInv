import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";

export const locations = mysqlTable("locations", {
  id: int("id").primaryKey().autoincrement(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  datacenter: varchar("datacenter", { length: 200 }),
});
