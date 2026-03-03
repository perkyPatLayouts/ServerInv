import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  datacenter: varchar("datacenter", { length: 200 }),
});
