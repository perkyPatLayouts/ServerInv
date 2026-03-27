import { mysqlTable, int, varchar, text } from "drizzle-orm/mysql-core";

export const apps = mysqlTable("apps", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  notes: text("notes"),
});
