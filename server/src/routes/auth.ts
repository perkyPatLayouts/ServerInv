import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { generateCsrfToken } from "../utils/csrf.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/** Dummy hash used to prevent timing-based username enumeration. */
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

/** POST /api/auth/login */
router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const [user] = await db.select().from(users).where(eq(users.username, username));
  // Always run bcrypt.compare to prevent timing-based username enumeration
  const isValid = await comparePassword(password, user?.password ?? DUMMY_HASH);
  if (!user || !isValid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({
    userId: user.id,
    role: user.role,
    mustChangePassword: user.mustChangePassword
  });

  // Generate and set CSRF token in cookie
  const csrfToken = generateCsrfToken();
  res.cookie('csrf-token', csrfToken, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours (same as JWT)
  });

  res.json({
    token,
    csrfToken, // Also send in response for initial client setup
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    }
  });
});

/** GET /api/auth/me */
router.get("/me", authenticate, async (req: Request, res: Response) => {
  const [user] = await db.select({ id: users.id, username: users.username, role: users.role }).from(users).where(eq(users.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

/** GET /api/auth/csrf-token - Generate and return a fresh CSRF token */
router.get("/csrf-token", authenticate, (req: Request, res: Response) => {
  const csrfToken = generateCsrfToken();
  res.cookie('csrf-token', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  res.json({ csrfToken });
});

export default router;
