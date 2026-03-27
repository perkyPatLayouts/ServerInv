import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";

export const serverTypes = mysqlTable("server_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  virtualizationType: varchar("virtualization_type", { length: 100 }),
});
