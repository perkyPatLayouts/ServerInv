import { mysqlTable, int, varchar, decimal, date, boolean, text } from "drizzle-orm/mysql-core";
import { serverTypes } from "./serverTypes";
import { providers } from "./providers";
import { locations } from "./locations";
import { currencies } from "./currencies";
import { cpuTypes } from "./cpuTypes";
import { operatingSystems } from "./operatingSystems";
import { billingPeriods } from "./billingPeriods";
import { paymentMethods } from "./paymentMethods";

export const servers = mysqlTable("servers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 200 }).notNull(),
  url: varchar("url", { length: 500 }),
  ip: varchar("ip", { length: 45 }),
  serverTypeId: int("server_type_id").references(() => serverTypes.id),
  providerId: int("provider_id").references(() => providers.id),
  locationId: int("location_id").references(() => locations.id),
  price: decimal("price", { precision: 10, scale: 2 }),
  billingPeriodId: int("billing_period_id").references(() => billingPeriods.id),
  paymentMethodId: int("payment_method_id").references(() => paymentMethods.id),
  recurring: boolean("recurring").default(false).notNull(),
  autoRenew: boolean("auto_renew").default(false).notNull(),
  currencyId: int("currency_id").references(() => currencies.id),
  renewalDate: date("renewal_date", { mode: 'date' }),
  ram: int("ram"),
  diskSize: int("disk_size"),
  diskType: varchar("disk_type", { length: 10 }),
  cpuTypeId: int("cpu_type_id").references(() => cpuTypes.id),
  osId: int("os_id").references(() => operatingSystems.id),
  notes: text("notes"),
});
