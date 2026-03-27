import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { operatingSystems } from "../db/schema/index.js";
import { servers } from "../db/schema/index.js";
import { validate } from "../middleware/validate.js";
import { requireEditorOrAdmin } from "../middleware/auth.js";

const router = Router();

const osSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().min(1).max(50),
  variant: z.string().max(50).default("server"),
});

router.get("/", async (_req: Request, res: Response) => {
  const rows = await db.select().from(operatingSystems);
  res.json(rows);
});

router.get("/:id", async (req: Request, res: Response) => {
  const [row] = await db.select().from(operatingSystems).where(eq(operatingSystems.id, +req.params.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.post("/", requireEditorOrAdmin, validate(osSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(operatingSystems).values(req.body).returning();
  res.status(201).json(row);
});

router.put("/:id", requireEditorOrAdmin, validate(osSchema), async (req: Request, res: Response) => {
  const [row] = await db.update(operatingSystems).set(req.body).where(eq(operatingSystems.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/:id", requireEditorOrAdmin, async (req: Request, res: Response) => {
  const refs = await db.select({ id: servers.id }).from(servers).where(eq(servers.osId, +req.params.id)).limit(1);
  if (refs.length) { res.status(409).json({ error: "OS is referenced by servers" }); return; }
  const [row] = await db.delete(operatingSystems).where(eq(operatingSystems.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
