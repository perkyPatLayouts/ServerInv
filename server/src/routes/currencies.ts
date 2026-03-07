import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { currencies } from "../db/schema/currencies.js";
import { servers } from "../db/schema/servers.js";
import { validate } from "../middleware/validate.js";
import { requireEditorOrAdmin } from "../middleware/auth.js";

const router = Router();

const currencySchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
});

/** GET /api/currencies */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await db.select().from(currencies);
  res.json(rows);
});

/** GET /api/currencies/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const [row] = await db.select().from(currencies).where(eq(currencies.id, +req.params.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** POST /api/currencies */
router.post("/", requireEditorOrAdmin, validate(currencySchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(currencies).values(req.body).returning();
  res.status(201).json(row);
});

/** PUT /api/currencies/:id */
router.put("/:id", requireEditorOrAdmin, validate(currencySchema), async (req: Request, res: Response) => {
  const [row] = await db.update(currencies).set(req.body).where(eq(currencies.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** DELETE /api/currencies/:id — blocked if referenced by servers */
router.delete("/:id", requireEditorOrAdmin, async (req: Request, res: Response) => {
  const refs = await db.select({ id: servers.id }).from(servers).where(eq(servers.currencyId, +req.params.id)).limit(1);
  if (refs.length) { res.status(409).json({ error: "Currency is referenced by servers" }); return; }
  const [row] = await db.delete(currencies).where(eq(currencies.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
