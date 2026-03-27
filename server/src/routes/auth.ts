import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/** POST /api/auth/login */
router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user || !(await comparePassword(password, user.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
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

export default router;
