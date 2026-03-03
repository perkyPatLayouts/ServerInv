import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcryptjs";
import { users } from "./schema/users.js";
import { currencies } from "./schema/currencies.js";
import { serverTypes } from "./schema/serverTypes.js";
import { operatingSystems } from "./schema/operatingSystems.js";
import { billingPeriods } from "./schema/billingPeriods.js";
import { paymentMethods } from "./schema/paymentMethods.js";

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  console.log("Seeding database...");

  // Admin user
  const hash = await bcrypt.hash("admin", 10);
  await db
    .insert(users)
    .values({ username: "admin", password: hash, role: "admin" })
    .onConflictDoNothing();

  // Currencies
  await db
    .insert(currencies)
    .values([
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "EUR", name: "Euro", symbol: "€" },
      { code: "GBP", name: "British Pound", symbol: "£" },
    ])
    .onConflictDoNothing();

  // Server types
  await db
    .insert(serverTypes)
    .values([
      { name: "VPS" },
      { name: "Dedicated" },
      { name: "Shared" },
    ])
    .onConflictDoNothing();

  // Common OS entries
  await db
    .insert(operatingSystems)
    .values([
      { name: "Ubuntu", version: "24.04", variant: "server" },
      { name: "Ubuntu", version: "22.04", variant: "server" },
      { name: "Debian", version: "12", variant: "server" },
      { name: "Debian", version: "11", variant: "server" },
      { name: "CentOS", version: "9", variant: "server" },
      { name: "AlmaLinux", version: "9", variant: "server" },
    ])
    .onConflictDoNothing();

  // Billing periods
  await db
    .insert(billingPeriods)
    .values([
      { name: "Hourly" },
      { name: "Monthly" },
      { name: "Quarterly" },
      { name: "Yearly" },
      { name: "2 Yearly" },
      { name: "3 Yearly" },
    ])
    .onConflictDoNothing();

  // Payment methods
  await db
    .insert(paymentMethods)
    .values([
      { name: "PayPal" },
      { name: "Credit Card" },
      { name: "Cash" },
      { name: "Digital Currency" },
    ])
    .onConflictDoNothing();

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
