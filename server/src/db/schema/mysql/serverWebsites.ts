import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { servers } from "./servers";

export const serverWebsites = mysqlTable("server_websites", {
  id: int("id").primaryKey().autoincrement(),
  serverId: int("server_id").references(() => servers.id, { onDelete: "cascade" }).notNull(),
  domain: varchar("domain", { length: 500 }).notNull(),
  application: varchar("application", { length: 200 }),
  notes: varchar("notes", { length: 1000 }),
});
