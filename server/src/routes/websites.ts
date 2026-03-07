import { Router, Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { serverWebsites } from "../db/schema/serverWebsites.js";
import { validate } from "../middleware/validate.js";
import { requireEditorOrAdmin } from "../middleware/auth.js";

const router = Router();

const websiteSchema = z.object({
  domain: z.string().min(1).max(500),
  application: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

/** GET /api/servers/:serverId/websites */
router.get("/:serverId/websites", async (req: Request, res: Response) => {
  const rows = await db.select().from(serverWebsites).where(eq(serverWebsites.serverId, +req.params.serverId));
  res.json(rows);
});

/** POST /api/servers/:serverId/websites */
router.post("/:serverId/websites", requireEditorOrAdmin, validate(websiteSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(serverWebsites).values({ ...req.body, serverId: +req.params.serverId }).returning();
  res.status(201).json(row);
});

/** PUT /api/servers/:serverId/websites/:id */
router.put("/:serverId/websites/:id", requireEditorOrAdmin, validate(websiteSchema), async (req: Request, res: Response) => {
  const [row] = await db
    .update(serverWebsites)
    .set(req.body)
    .where(and(eq(serverWebsites.id, +req.params.id), eq(serverWebsites.serverId, +req.params.serverId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** DELETE /api/servers/:serverId/websites/:id */
router.delete("/:serverId/websites/:id", requireEditorOrAdmin, async (req: Request, res: Response) => {
  const [row] = await db
    .delete(serverWebsites)
    .where(and(eq(serverWebsites.id, +req.params.id), eq(serverWebsites.serverId, +req.params.serverId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
