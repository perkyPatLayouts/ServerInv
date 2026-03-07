import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { paymentMethods } from "../db/schema/paymentMethods.js";
import { servers } from "../db/schema/servers.js";
import { validate } from "../middleware/validate.js";
import { requireEditorOrAdmin } from "../middleware/auth.js";

const router = Router();

const paymentMethodSchema = z.object({
  name: z.string().min(1).max(100),
});

/** GET /api/payment-methods */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await db.select().from(paymentMethods);
  res.json(rows);
});

/** GET /api/payment-methods/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const [row] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, +req.params.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** POST /api/payment-methods */
router.post("/", requireEditorOrAdmin, validate(paymentMethodSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(paymentMethods).values(req.body).returning();
  res.status(201).json(row);
});

/** PUT /api/payment-methods/:id */
router.put("/:id", requireEditorOrAdmin, validate(paymentMethodSchema), async (req: Request, res: Response) => {
  const [row] = await db.update(paymentMethods).set(req.body).where(eq(paymentMethods.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** DELETE /api/payment-methods/:id — blocked if referenced by servers */
router.delete("/:id", requireEditorOrAdmin, async (req: Request, res: Response) => {
  const refs = await db.select({ id: servers.id }).from(servers).where(eq(servers.paymentMethodId, +req.params.id)).limit(1);
  if (refs.length) { res.status(409).json({ error: "Payment method is referenced by servers" }); return; }
  const [row] = await db.delete(paymentMethods).where(eq(paymentMethods.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
