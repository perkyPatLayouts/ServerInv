import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";
import { servers } from "./servers.js";

export const serverWebsites = pgTable("server_websites", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").references(() => servers.id, { onDelete: "cascade" }).notNull(),
  domain: varchar("domain", { length: 500 }).notNull(),
  application: varchar("application", { length: 200 }),
  notes: varchar("notes", { length: 1000 }),
});
