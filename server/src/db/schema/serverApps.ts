import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";
import { servers } from "./servers";
import { apps } from "./apps";

export const serverApps = pgTable("server_apps", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").references(() => servers.id, { onDelete: "cascade" }).notNull(),
  appId: integer("app_id").references(() => apps.id, { onDelete: "cascade" }).notNull(),
  url: varchar("url", { length: 500 }),
});
