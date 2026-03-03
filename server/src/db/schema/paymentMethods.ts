import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});
