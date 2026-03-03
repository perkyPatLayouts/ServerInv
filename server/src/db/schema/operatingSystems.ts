import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const operatingSystems = pgTable("operating_systems", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  variant: varchar("variant", { length: 50 }).notNull().default("server"),
});
