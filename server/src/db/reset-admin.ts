import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, pool, DB_TYPE } from "./index.js";
import { users } from "./schema/index.js";
import { eq } from "drizzle-orm";

/**
 * CLI script to create or reset an admin user's credentials.
 * Usage: npx tsx src/db/reset-admin.ts <username> <password>
 *
 * This script will:
 * - Create a new admin user if the username doesn't exist
 * - Update the password and role if the username already exists
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error("Usage: npx tsx src/db/reset-admin.ts <username> <password>");
    console.error("Example: npx tsx src/db/reset-admin.ts admin MyNewPassword123");
    process.exit(1);
  }

  const [username, password] = args;

  if (username.length < 1 || username.length > 100) {
    console.error("Error: Username must be between 1 and 100 characters");
    process.exit(1);
  }

  if (password.length < 4) {
    console.error("Error: Password must be at least 4 characters");
    process.exit(1);
  }

  console.log(`Processing admin user: ${username}`);

  // Hash the password
  const hash = await bcrypt.hash(password, 10);

  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));

  if (existingUser) {
    // Update existing user - set password and ensure role is admin
    await db
      .update(users)
      .set({
        password: hash,
        role: "admin",
        updatedAt: new Date()
      })
      .where(eq(users.username, username));

    console.log(`✓ Admin user '${username}' password updated and role set to 'admin'`);
  } else {
    // Create new admin user
    try {
      await db
        .insert(users)
        .values({
          username,
          password: hash,
          role: "admin"
        });

      console.log(`✓ New admin user '${username}' created`);
    } catch (err: any) {
      console.error("Error creating user:", err.message);
      process.exit(1);
    }
  }

  await pool.end();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Failed to reset admin user:", err);
  process.exit(1);
});
