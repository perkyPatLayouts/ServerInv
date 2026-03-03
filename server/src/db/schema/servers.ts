import { pgTable, serial, varchar, integer, decimal, date } from "drizzle-orm/pg-core";
import { serverTypes } from "./serverTypes";
import { providers } from "./providers";
import { locations } from "./locations";
import { currencies } from "./currencies";
import { cpuTypes } from "./cpuTypes";
import { operatingSystems } from "./operatingSystems";

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: varchar("url", { length: 500 }),
  ip: varchar("ip", { length: 45 }),
  serverTypeId: integer("server_type_id").references(() => serverTypes.id),
  providerId: integer("provider_id").references(() => providers.id),
  locationId: integer("location_id").references(() => locations.id),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }),
  currencyId: integer("currency_id").references(() => currencies.id),
  renewalDate: date("renewal_date"),
  ram: integer("ram"),
  diskSize: integer("disk_size"),
  diskType: varchar("disk_type", { length: 10 }),
  cpuTypeId: integer("cpu_type_id").references(() => cpuTypes.id),
  osId: integer("os_id").references(() => operatingSystems.id),
  notes: varchar("notes", { length: 2000 }),
});
