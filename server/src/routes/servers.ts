import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { servers } from "../db/schema/servers.js";
import { serverWebsites } from "../db/schema/serverWebsites.js";
import { serverTypes } from "../db/schema/serverTypes.js";
import { providers } from "../db/schema/providers.js";
import { locations } from "../db/schema/locations.js";
import { currencies } from "../db/schema/currencies.js";
import { cpuTypes } from "../db/schema/cpuTypes.js";
import { operatingSystems } from "../db/schema/operatingSystems.js";
import { billingPeriods } from "../db/schema/billingPeriods.js";
import { paymentMethods } from "../db/schema/paymentMethods.js";
import { validate } from "../middleware/validate.js";
import { requireEditorOrAdmin } from "../middleware/auth.js";

const router = Router();

const serverSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().max(500).nullable().optional(),
  ip: z.string().max(45).nullable().optional(),
  serverTypeId: z.number().int().nullable().optional(),
  providerId: z.number().int().nullable().optional(),
  locationId: z.number().int().nullable().optional(),
  price: z.string().or(z.number()).transform(String).nullable().optional(),
  billingPeriodId: z.number().int().nullable().optional(),
  paymentMethodId: z.number().int().nullable().optional(),
  recurring: z.boolean().optional(),
  autoRenew: z.boolean().optional(),
  currencyId: z.number().int().nullable().optional(),
  renewalDate: z.string().nullable().optional(),
  ram: z.number().int().nullable().optional(),
  diskSize: z.number().int().nullable().optional(),
  diskType: z.string().max(10).nullable().optional(),
  cpuTypeId: z.number().int().nullable().optional(),
  osId: z.number().int().nullable().optional(),
  notes: z.string().max(32000).nullable().optional(),
});

/** GET /api/servers — list all with joined relations */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      id: servers.id,
      name: servers.name,
      url: servers.url,
      ip: servers.ip,
      serverTypeId: servers.serverTypeId,
      providerId: servers.providerId,
      locationId: servers.locationId,
      price: servers.price,
      billingPeriodId: servers.billingPeriodId,
      paymentMethodId: servers.paymentMethodId,
      recurring: servers.recurring,
      autoRenew: servers.autoRenew,
      currencyId: servers.currencyId,
      renewalDate: servers.renewalDate,
      ram: servers.ram,
      diskSize: servers.diskSize,
      diskType: servers.diskType,
      cpuTypeId: servers.cpuTypeId,
      osId: servers.osId,
      notes: servers.notes,
      serverType: serverTypes.name,
      serverTypeVirtualization: serverTypes.virtualizationType,
      providerName: providers.name,
      providerSiteUrl: providers.siteUrl,
      providerControlPanelUrl: providers.controlPanelUrl,
      locationCity: locations.city,
      locationCountry: locations.country,
      locationDatacenter: locations.datacenter,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
      cpuType: cpuTypes.type,
      cpuCores: cpuTypes.cores,
      cpuSpeed: cpuTypes.speed,
      osName: operatingSystems.name,
      osVersion: operatingSystems.version,
      osVariant: operatingSystems.variant,
      billingPeriod: billingPeriods.name,
      paymentMethod: paymentMethods.name,
    })
    .from(servers)
    .leftJoin(serverTypes, eq(servers.serverTypeId, serverTypes.id))
    .leftJoin(providers, eq(servers.providerId, providers.id))
    .leftJoin(locations, eq(servers.locationId, locations.id))
    .leftJoin(currencies, eq(servers.currencyId, currencies.id))
    .leftJoin(cpuTypes, eq(servers.cpuTypeId, cpuTypes.id))
    .leftJoin(operatingSystems, eq(servers.osId, operatingSystems.id))
    .leftJoin(billingPeriods, eq(servers.billingPeriodId, billingPeriods.id))
    .leftJoin(paymentMethods, eq(servers.paymentMethodId, paymentMethods.id));

  // Attach websites for each server
  const websiteRows = await db.select().from(serverWebsites);
  const websiteMap = new Map<number, typeof websiteRows>();
  for (const w of websiteRows) {
    if (!websiteMap.has(w.serverId)) websiteMap.set(w.serverId, []);
    websiteMap.get(w.serverId)!.push(w);
  }

  const result = rows.map((r) => ({ ...r, websites: websiteMap.get(r.id) || [] }));
  res.json(result);
});

/** GET /api/servers/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const [row] = await db
    .select()
    .from(servers)
    .where(eq(servers.id, +req.params.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const websites = await db.select().from(serverWebsites).where(eq(serverWebsites.serverId, row.id));
  res.json({ ...row, websites });
});

/** POST /api/servers */
router.post("/", requireEditorOrAdmin, validate(serverSchema), async (req: Request, res: Response) => {
  const [row] = await db.insert(servers).values(req.body).returning();
  res.status(201).json(row);
});

/** PUT /api/servers/:id */
router.put("/:id", requireEditorOrAdmin, validate(serverSchema), async (req: Request, res: Response) => {
  const [row] = await db.update(servers).set(req.body).where(eq(servers.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

/** DELETE /api/servers/:id */
router.delete("/:id", requireEditorOrAdmin, async (req: Request, res: Response) => {
  const [row] = await db.delete(servers).where(eq(servers.id, +req.params.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
