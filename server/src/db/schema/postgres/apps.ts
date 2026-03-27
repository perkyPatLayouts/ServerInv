import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  notes: varchar("notes", { length: 32000 }),
});
