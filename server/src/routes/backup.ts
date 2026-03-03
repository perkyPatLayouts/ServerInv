import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { backupConfig } from "../db/schema/backupConfig.js";
import { validate } from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import SftpClient from "ssh2-sftp-client";

const router = Router();

const configSchema = z.object({
  host: z.string().min(1).max(500),
  port: z.number().int().default(22),
  username: z.string().min(1).max(200),
  password: z.string().max(500).nullable().optional(),
  privateKey: z.string().max(5000).nullable().optional(),
  remotePath: z.string().min(1).max(500),
});

/** GET /api/backup/config */
router.get("/config", requireAdmin, async (_req: Request, res: Response) => {
  const rows = await db.select().from(backupConfig);
  res.json(rows[0] || null);
});

/** POST /api/backup/config */
router.post("/config", requireAdmin, validate(configSchema), async (req: Request, res: Response) => {
  const existing = await db.select().from(backupConfig);
  if (existing.length) {
    const [row] = await db.update(backupConfig).set(req.body).where(eq(backupConfig.id, existing[0].id)).returning();
    res.json(row);
  } else {
    const [row] = await db.insert(backupConfig).values(req.body).returning();
    res.status(201).json(row);
  }
});

/** POST /api/backup/export — create backup and upload via SFTP */
router.post("/export", requireAdmin, async (_req: Request, res: Response) => {
  const [config] = await db.select().from(backupConfig);
  if (!config) { res.status(400).json({ error: "Backup not configured" }); return; }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `serverinv-backup-${timestamp}.sql`;
  const tmpFile = path.join("/tmp", filename);

  try {
    const dbUrl = process.env.DATABASE_URL!;
    execSync(`pg_dump "${dbUrl}" > "${tmpFile}"`);

    const sftp = new SftpClient();
    const sftpConfig: any = {
      host: config.host,
      port: config.port,
      username: config.username,
    };
    if (config.privateKey) sftpConfig.privateKey = config.privateKey;
    else if (config.password) sftpConfig.password = config.password;

    await sftp.connect(sftpConfig);
    const remoteDest = `${config.remotePath}/${filename}`;
    await sftp.put(tmpFile, remoteDest);
    await sftp.end();

    fs.unlinkSync(tmpFile);
    res.json({ success: true, filename, remote: remoteDest });
  } catch (err: any) {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    res.status(500).json({ error: "Backup failed", details: err.message });
  }
});

/** POST /api/backup/restore — download from SFTP and restore */
router.post("/restore", requireAdmin, async (req: Request, res: Response) => {
  const [config] = await db.select().from(backupConfig);
  if (!config) { res.status(400).json({ error: "Backup not configured" }); return; }

  const { filename } = req.body;
  if (!filename) { res.status(400).json({ error: "filename required" }); return; }

  const tmpFile = path.join("/tmp", filename);
  try {
    const sftp = new SftpClient();
    const sftpConfig: any = {
      host: config.host,
      port: config.port,
      username: config.username,
    };
    if (config.privateKey) sftpConfig.privateKey = config.privateKey;
    else if (config.password) sftpConfig.password = config.password;

    await sftp.connect(sftpConfig);
    await sftp.get(`${config.remotePath}/${filename}`, tmpFile);
    await sftp.end();

    const dbUrl = process.env.DATABASE_URL!;
    execSync(`psql "${dbUrl}" < "${tmpFile}"`);

    fs.unlinkSync(tmpFile);
    res.json({ success: true });
  } catch (err: any) {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    res.status(500).json({ error: "Restore failed", details: err.message });
  }
});

/** GET /api/backup/list — list remote backups */
router.get("/list", requireAdmin, async (_req: Request, res: Response) => {
  const [config] = await db.select().from(backupConfig);
  if (!config) { res.status(400).json({ error: "Backup not configured" }); return; }

  try {
    const sftp = new SftpClient();
    const sftpConfig: any = {
      host: config.host,
      port: config.port,
      username: config.username,
    };
    if (config.privateKey) sftpConfig.privateKey = config.privateKey;
    else if (config.password) sftpConfig.password = config.password;

    await sftp.connect(sftpConfig);
    const files = await sftp.list(config.remotePath);
    await sftp.end();

    const backups = files
      .filter((f) => f.name.startsWith("serverinv-backup-") && f.name.endsWith(".sql"))
      .map((f) => ({ name: f.name, size: f.size, modifyTime: f.modifyTime }))
      .sort((a, b) => b.modifyTime - a.modifyTime);
    res.json(backups);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to list backups", details: err.message });
  }
});

export default router;
