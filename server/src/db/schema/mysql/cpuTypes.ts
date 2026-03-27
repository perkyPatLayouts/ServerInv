import { mysqlTable, int, varchar, decimal } from "drizzle-orm/mysql-core";

export const cpuTypes = mysqlTable("cpu_types", {
  id: int("id").primaryKey().autoincrement(),
  type: varchar("type", { length: 200 }).notNull(),
  cores: int("cores").notNull(),
  speed: decimal("speed", { precision: 5, scale: 2 }).notNull(),
});
