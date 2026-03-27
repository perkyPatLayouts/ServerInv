import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";

export const providers = mysqlTable("providers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 200 }).notNull(),
  siteUrl: varchar("site_url", { length: 500 }),
  controlPanelUrl: varchar("control_panel_url", { length: 500 }),
});
