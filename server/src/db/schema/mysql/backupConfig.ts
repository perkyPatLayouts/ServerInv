import { mysqlTable, int, varchar, text } from "drizzle-orm/mysql-core";

export const backupConfig = mysqlTable("backup_config", {
  id: int("id").primaryKey().autoincrement(),
  host: varchar("host", { length: 500 }).notNull(),
  port: int("port").notNull().default(22),
  username: varchar("username", { length: 200 }).notNull(),
  password: varchar("password", { length: 500 }),
  privateKey: text("private_key"),
  remotePath: varchar("remote_path", { length: 500 }).notNull(),
});
