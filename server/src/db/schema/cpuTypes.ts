import { pgTable, serial, varchar, integer, decimal } from "drizzle-orm/pg-core";

export const cpuTypes = pgTable("cpu_types", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 200 }).notNull(),
  cores: integer("cores").notNull(),
  speed: decimal("speed", { precision: 5, scale: 2 }).notNull(),
});
