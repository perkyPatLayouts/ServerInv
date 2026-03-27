import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const serverTypes = pgTable("server_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  virtualizationType: varchar("virtualization_type", { length: 100 }),
});
