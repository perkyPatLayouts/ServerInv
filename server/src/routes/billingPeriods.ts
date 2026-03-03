import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { billingPeriods } from "../db/schema/billingPeriods.js";
import { servers } from "../db/schema/servers.js";
import { validate } from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const billingPeriodSchema = z.object({
  name: z.string().min(1).max(100),
});

/** GET /api/billing-periods */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await db.select().from(billingPeriods);
  res.json(rows);
});

/** GET /api/billing-periods/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const [row] = await db.select().from(billingPeriods).where(eq(billingPeriods.id, +req.params.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** POST /api/billing-periods */
router.post("/", requireAdmin, validate(billingPeriodSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(billingPeriods).values(req.body).returning();
  res.status(201).json(row);
});

/** PUT /api/billing-periods/:id */
router.put("/:id", requireAdmin, validate(billingPeriodSchema), async (req: Request, res: Response) => {
  const [row] = await db.update(billingPeriods).set(req.body).where(eq(billingPeriods.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** DELETE /api/billing-periods/:id — blocked if referenced by servers */
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  const refs = await db.select({ id: servers.id }).from(servers).where(eq(servers.billingPeriodId, +req.params.id)).limit(1);
  if (refs.length) { res.status(409).json({ error: "Billing period is referenced by servers" }); return; }
  const [row] = await db.delete(billingPeriods).where(eq(billingPeriods.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
