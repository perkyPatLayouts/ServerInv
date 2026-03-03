import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "fallback-secret";

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
