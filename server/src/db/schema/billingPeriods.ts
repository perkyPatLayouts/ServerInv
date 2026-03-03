import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const billingPeriods = pgTable("billing_periods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});
