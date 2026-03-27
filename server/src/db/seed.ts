import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, pool, DB_TYPE } from "./index.js";
import {
  users,
  currencies,
  serverTypes,
  operatingSystems,
  billingPeriods,
  paymentMethods
} from "./schema/index.js";

/**
 * Helper to insert data with conflict handling for both databases
 */
async function insertIgnoreConflict(table: any, values: any) {
  try {
    if (DB_TYPE === 'postgres') {
      await db.insert(table).values(values).onConflictDoNothing();
    } else {
      // MySQL: Try insert, catch duplicate errors
      await db.insert(table).values(values);
    }
  } catch (e: any) {
    // Ignore duplicate key errors (MySQL error code 1062, MariaDB ER_DUP_ENTRY)
    if (e.errno === 1062 || e.code === 'ER_DUP_ENTRY') {
      // Silently ignore
    } else {
      throw e;
    }
  }
}

async function main() {

  console.log("Seeding database...");

  // Admin user
  const hash = await bcrypt.hash("admin", 10);
  await insertIgnoreConflict(users, { username: "admin", password: hash, role: "admin" });

  // Currencies
  await insertIgnoreConflict(currencies, [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
  ]);

  // Server types
  await insertIgnoreConflict(serverTypes, [
    { name: "VPS" },
    { name: "Dedicated" },
    { name: "Shared" },
  ]);

  // Common OS entries
  await insertIgnoreConflict(operatingSystems, [
    { name: "Ubuntu", version: "24.04", variant: "server" },
    { name: "Ubuntu", version: "22.04", variant: "server" },
    { name: "Debian", version: "12", variant: "server" },
    { name: "Debian", version: "11", variant: "server" },
    { name: "CentOS", version: "9", variant: "server" },
    { name: "AlmaLinux", version: "9", variant: "server" },
  ]);

  // Billing periods
  await insertIgnoreConflict(billingPeriods, [
    { name: "Hourly" },
    { name: "Monthly" },
    { name: "Quarterly" },
    { name: "Yearly" },
    { name: "2 Yearly" },
    { name: "3 Yearly" },
  ]);

  // Payment methods
  await insertIgnoreConflict(paymentMethods, [
    { name: "PayPal" },
    { name: "Credit Card" },
    { name: "Cash" },
    { name: "Digital Currency" },
  ]);

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
