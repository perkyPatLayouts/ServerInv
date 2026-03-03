import bcrypt from "bcryptjs";

/** Hash a plaintext password. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** Compare plaintext against a hash. */
export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
