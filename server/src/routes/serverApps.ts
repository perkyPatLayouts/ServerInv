import { Router, Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { serverApps } from "../db/schema/index.js";
import { apps } from "../db/schema/index.js";
import { validate } from "../middleware/validate.js";
import { requireEditorOrAdmin } from "../middleware/auth.js";

const router = Router();

const serverAppSchema = z.object({
  appId: z.number(),
  url: z.string().max(500).nullable().optional(),
});

/** GET /api/servers/:serverId/apps */
router.get("/:serverId/apps", async (req: Request, res: Response) => {
  const rows = await db
    .select({
      id: serverApps.id,
      serverId: serverApps.serverId,
      appId: serverApps.appId,
      url: serverApps.url,
      appName: apps.name,
      appNotes: apps.notes,
    })
    .from(serverApps)
    .leftJoin(apps, eq(serverApps.appId, apps.id))
    .where(eq(serverApps.serverId, +req.params.serverId));
  res.json(rows);
});

/** POST /api/servers/:serverId/apps */
router.post("/:serverId/apps", requireEditorOrAdmin, validate(serverAppSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(serverApps).values({ ...req.body, serverId: +req.params.serverId }).returning();
  res.status(201).json(row);
});

/** PUT /api/servers/:serverId/apps/:id */
router.put("/:serverId/apps/:id", requireEditorOrAdmin, validate(serverAppSchema.partial()), async (req: Request, res: Response) => {
  const [row] = await db
    .update(serverApps)
    .set(req.body)
    .where(and(eq(serverApps.id, +req.params.id), eq(serverApps.serverId, +req.params.serverId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** DELETE /api/servers/:serverId/apps/:id */
router.delete("/:serverId/apps/:id", requireEditorOrAdmin, async (req: Request, res: Response) => {
  const [row] = await db
    .delete(serverApps)
    .where(and(eq(serverApps.id, +req.params.id), eq(serverApps.serverId, +req.params.serverId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
