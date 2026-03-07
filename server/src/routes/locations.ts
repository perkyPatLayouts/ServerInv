import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { locations } from "../db/schema/locations.js";
import { servers } from "../db/schema/servers.js";
import { validate } from "../middleware/validate.js";
import { requireEditorOrAdmin } from "../middleware/auth.js";

const router = Router();

const locationSchema = z.object({
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  datacenter: z.string().max(200).nullable().optional(),
});

router.get("/", async (_req: Request, res: Response) => {
  const rows = await db.select().from(locations);
  res.json(rows);
});

router.get("/:id", async (req: Request, res: Response) => {
  const [row] = await db.select().from(locations).where(eq(locations.id, +req.params.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.post("/", requireEditorOrAdmin, validate(locationSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(locations).values(req.body).returning();
  res.status(201).json(row);
});

router.put("/:id", requireEditorOrAdmin, validate(locationSchema), async (req: Request, res: Response) => {
  const [row] = await db.update(locations).set(req.body).where(eq(locations.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/:id", requireEditorOrAdmin, async (req: Request, res: Response) => {
  const refs = await db.select({ id: servers.id }).from(servers).where(eq(servers.locationId, +req.params.id)).limit(1);
  if (refs.length) { res.status(409).json({ error: "Location is referenced by servers" }); return; }
  const [row] = await db.delete(locations).where(eq(locations.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
