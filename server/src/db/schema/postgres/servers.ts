import { pgTable, serial, varchar, integer, decimal, date, boolean } from "drizzle-orm/pg-core";
import { serverTypes } from "./serverTypes.js";
import { providers } from "./providers.js";
import { locations } from "./locations.js";
import { currencies } from "./currencies.js";
import { cpuTypes } from "./cpuTypes.js";
import { operatingSystems } from "./operatingSystems.js";
import { billingPeriods } from "./billingPeriods.js";
import { paymentMethods } from "./paymentMethods.js";

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: varchar("url", { length: 500 }),
  ip: varchar("ip", { length: 45 }),
  serverTypeId: integer("server_type_id").references(() => serverTypes.id),
  providerId: integer("provider_id").references(() => providers.id),
  locationId: integer("location_id").references(() => locations.id),
  price: decimal("price", { precision: 10, scale: 2 }),
  billingPeriodId: integer("billing_period_id").references(() => billingPeriods.id),
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  recurring: boolean("recurring").default(false).notNull(),
  autoRenew: boolean("auto_renew").default(false).notNull(),
  currencyId: integer("currency_id").references(() => currencies.id),
  renewalDate: date("renewal_date"),
  ram: integer("ram"),
  diskSize: integer("disk_size"),
  diskType: varchar("disk_type", { length: 10 }),
  cpuTypeId: integer("cpu_type_id").references(() => cpuTypes.id),
  osId: integer("os_id").references(() => operatingSystems.id),
  notes: varchar("notes", { length: 32000 }),
});
