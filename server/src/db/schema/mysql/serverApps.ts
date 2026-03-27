import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { servers } from "./servers";
import { apps } from "./apps";

export const serverApps = mysqlTable("server_apps", {
  id: int("id").primaryKey().autoincrement(),
  serverId: int("server_id").references(() => servers.id, { onDelete: "cascade" }).notNull(),
  appId: int("app_id").references(() => apps.id, { onDelete: "cascade" }).notNull(),
  url: varchar("url", { length: 500 }),
});
