import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";

export const backupConfig = pgTable("backup_config", {
  id: serial("id").primaryKey(),
  host: varchar("host", { length: 500 }).notNull(),
  port: integer("port").notNull().default(22),
  username: varchar("username", { length: 200 }).notNull(),
  password: varchar("password", { length: 500 }),
  privateKey: varchar("private_key", { length: 5000 }),
  remotePath: varchar("remote_path", { length: 500 }).notNull(),
});
