import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";

export const billingPeriods = mysqlTable("billing_periods", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});
