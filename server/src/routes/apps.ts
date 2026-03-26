import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { apps } from "../db/schema/apps.js";
import { validate } from "../middleware/validate.js";
import { requireEditorOrAdmin } from "../middleware/auth.js";

const router = Router();

const appSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(32000).nullable().optional(),
});

/** GET /api/apps */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await db.select().from(apps);
  res.json(rows);
});

/** GET /api/apps/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const [row] = await db.select().from(apps).where(eq(apps.id, +req.params.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** POST /api/apps */
router.post("/", requireEditorOrAdmin, validate(appSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(apps).values(req.body).returning();
  res.status(201).json(row);
});

/** PUT /api/apps/:id */
router.put("/:id", requireEditorOrAdmin, validate(appSchema), async (req: Request, res: Response) => {
  const [row] = await db.update(apps).set(req.body).where(eq(apps.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** DELETE /api/apps/:id — cascades to server_apps */
router.delete("/:id", requireEditorOrAdmin, async (req: Request, res: Response) => {
  const [row] = await db.delete(apps).where(eq(apps.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
