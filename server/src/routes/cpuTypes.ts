import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { cpuTypes } from "../db/schema/cpuTypes.js";
import { servers } from "../db/schema/servers.js";
import { validate } from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const cpuTypeSchema = z.object({
  type: z.string().min(1).max(200),
  cores: z.number().int().min(1),
  speed: z.string().or(z.number()).transform(String),
});

router.get("/", async (_req: Request, res: Response) => {
  const rows = await db.select().from(cpuTypes);
  res.json(rows);
});

router.get("/:id", async (req: Request, res: Response) => {
  const [row] = await db.select().from(cpuTypes).where(eq(cpuTypes.id, +req.params.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.post("/", requireAdmin, validate(cpuTypeSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(cpuTypes).values(req.body).returning();
  res.status(201).json(row);
});

router.put("/:id", requireAdmin, validate(cpuTypeSchema), async (req: Request, res: Response) => {
  const [row] = await db.update(cpuTypes).set(req.body).where(eq(cpuTypes.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  const refs = await db.select({ id: servers.id }).from(servers).where(eq(servers.cpuTypeId, +req.params.id)).limit(1);
  if (refs.length) { res.status(409).json({ error: "CPU type is referenced by servers" }); return; }
  const [row] = await db.delete(cpuTypes).where(eq(cpuTypes.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
