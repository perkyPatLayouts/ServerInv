import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  siteUrl: varchar("site_url", { length: 500 }),
  controlPanelUrl: varchar("control_panel_url", { length: 500 }),
});
