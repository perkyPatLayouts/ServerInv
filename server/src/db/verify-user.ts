import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, pool } from "./index.js";
import { users } from "./schema/index.js";
import { eq } from "drizzle-orm";

/**
 * Diagnostic script to verify user credentials and test password hashing.
 * Usage: npx tsx src/db/verify-user.ts <username> <password>
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error("Usage: npx tsx src/db/verify-user.ts <username> <password>");
    process.exit(1);
  }

  const [username, password] = args;

  console.log(`\n=== Verifying user: ${username} ===\n`);

  // Fetch user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));

  if (!user) {
    console.error(`❌ User '${username}' not found in database`);
    process.exit(1);
  }

  console.log(`✓ User found in database`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Username: ${user.username}`);
  console.log(`  Role: ${user.role}`);
  console.log(`  Must change password: ${user.mustChangePassword}`);
  console.log(`  Created: ${user.createdAt}`);
  console.log(`  Updated: ${user.updatedAt}`);
  console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
  console.log(`  Hash length: ${user.password.length} characters`);

  // Verify password hash format (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (!user.password.match(/^\$2[aby]\$/)) {
    console.error(`\n❌ Password hash format is invalid!`);
    console.error(`   Expected bcrypt hash starting with $2a$, $2b$, or $2y$`);
    console.error(`   Got: ${user.password.substring(0, 10)}...`);
    process.exit(1);
  }

  console.log(`✓ Password hash format is valid (bcrypt)`);

  // Test password comparison
  console.log(`\n=== Testing password verification ===\n`);
  console.log(`Comparing password: "${password}"`);

  try {
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      console.log(`✅ PASSWORD MATCHES! Login should work.`);
    } else {
      console.log(`❌ PASSWORD DOES NOT MATCH!`);
      console.log(`\nThis means:`);
      console.log(`- The user exists in the database`);
      console.log(`- The password hash is stored correctly`);
      console.log(`- But the password you're entering doesn't match the hash`);
      console.log(`\nTry running reset-admin.ts again with a new password.`);
    }
  } catch (err: any) {
    console.error(`❌ Error comparing password: ${err.message}`);
    process.exit(1);
  }

  await pool.end();
  console.log(`\nDone!\n`);
}

main().catch((err) => {
  console.error("Failed to verify user:", err);
  process.exit(1);
});
