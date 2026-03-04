import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { serverTypes } from "../db/schema/serverTypes.js";
import { servers } from "../db/schema/servers.js";
import { validate } from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const serverTypeSchema = z.object({
  name: z.string().min(1).max(100),
  virtualizationType: z.string().max(100).nullable().optional(),
});

router.get("/", async (_req: Request, res: Response) => {
  const rows = await db.select().from(serverTypes);
  res.json(rows);
});

router.get("/:id", async (req: Request, res: Response) => {
  const [row] = await db.select().from(serverTypes).where(eq(serverTypes.id, +req.params.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.post("/", requireAdmin, validate(serverTypeSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(serverTypes).values(req.body).returning();
  res.status(201).json(row);
});

router.put("/:id", requireAdmin, validate(serverTypeSchema), async (req: Request, res: Response) => {
  const [row] = await db.update(serverTypes).set(req.body).where(eq(serverTypes.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  const refs = await db.select({ id: servers.id }).from(servers).where(eq(servers.serverTypeId, +req.params.id)).limit(1);
  if (refs.length) { res.status(409).json({ error: "Server type is referenced by servers" }); return; }
  const [row] = await db.delete(serverTypes).where(eq(serverTypes.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
