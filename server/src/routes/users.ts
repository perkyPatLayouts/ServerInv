import { Router, Request, Response } from "express";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { validate } from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4),
});

/** PUT /api/users/me/password — any authenticated user can change their own password. */
router.put("/me/password", validate(changePasswordSchema), async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }
  const hash = await hashPassword(newPassword);
  await db.update(users).set({ password: hash, updatedAt: new Date() }).where(eq(users.id, userId));
  res.json({ success: true });
});

const createUserSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(4),
  role: z.enum(["admin", "editor", "viewer"]),
});

const updateUserSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  password: z.string().min(4).optional(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
});

/** GET /api/users — admin only */
router.get("/", requireAdmin, async (_req: Request, res: Response) => {
  const rows = await db.select({ id: users.id, username: users.username, role: users.role, createdAt: users.createdAt }).from(users);
  res.json(rows);
});

/** POST /api/users — admin only */
router.post("/", requireAdmin, validate(createUserSchema), async (req: Request, res: Response) => {
  const { username, password, role } = req.body;
  const hash = await hashPassword(password);
  try {
    const [row] = await db.insert(users).values({ username, password: hash, role }).returning({ id: users.id, username: users.username, role: users.role });
    res.status(201).json(row);
  } catch (err: any) {
    if (err.code === "23505") { res.status(409).json({ error: "Username already exists" }); return; }
    throw err;
  }
});

/** PUT /api/users/:id — admin only */
router.put("/:id", requireAdmin, validate(updateUserSchema), async (req: Request, res: Response) => {
  const updates: any = {};
  if (req.body.username) updates.username = req.body.username;
  if (req.body.password) updates.password = await hashPassword(req.body.password);
  if (req.body.role) updates.role = req.body.role;
  updates.updatedAt = new Date();
  try {
    const [row] = await db.update(users).set(updates).where(eq(users.id, +req.params.id)).returning({ id: users.id, username: users.username, role: users.role });
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err: any) {
    if (err.code === "23505") { res.status(409).json({ error: "Username already exists" }); return; }
    throw err;
  }
});

/** DELETE /api/users/:id — admin only, cannot delete last admin */
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  const [target] = await db.select().from(users).where(eq(users.id, +req.params.id));
  if (!target) { res.status(404).json({ error: "Not found" }); return; }
  if (target.role === "admin") {
    const [{ value }] = await db.select({ value: count() }).from(users).where(eq(users.role, "admin"));
    if (value <= 1) { res.status(409).json({ error: "Cannot delete the last admin user" }); return; }
  }
  await db.delete(users).where(eq(users.id, +req.params.id));
  res.json({ success: true });
});

export default router;
