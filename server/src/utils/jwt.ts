import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required but not set. Please configure JWT_SECRET in your .env file.");
}

const SECRET = process.env.JWT_SECRET;

export interface JwtPayload {
  userId: number;
  role: string;
}

/** Sign a JWT with user id and role. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "24h" });
}

/** Verify and decode a JWT. */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
