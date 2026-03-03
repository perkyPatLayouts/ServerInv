import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import multer, { FileFilterCallback } from "multer";

const router = Router();

const upload = multer({
  dest: "/tmp",
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.originalname.endsWith(".sql")) {
      cb(null, true);
    } else {
      cb(new Error("Only .sql files are allowed"));
    }
  },
});

/** Check if a command exists on the host. */
function commandExists(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Parse DATABASE_URL into components for docker exec usage. */
function parseDbUrl(url: string) {
  const m = url.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!m) throw new Error("Invalid DATABASE_URL format");
  return { user: m[1], password: m[2], host: m[3], port: m[4], database: m[5] };
}

/** Find the running postgres docker container name. */
function getDockerContainer(): string {
  const out = execSync(
    'docker ps --filter "ancestor=postgres:16-alpine" --format "{{.Names}}"',
    { stdio: "pipe" }
  ).toString().trim();
  if (!out) throw new Error("No running PostgreSQL Docker container found");
  return out.split("\n")[0];
}

/** GET /api/backup/download — create pg_dump and stream to browser */
router.get("/download", requireAdmin, async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `serverinv-backup-${timestamp}.sql`;
  const tmpFile = path.join("/tmp", filename);

  try {
    const dbUrl = process.env.DATABASE_URL!;

    if (commandExists("pg_dump")) {
      execSync(`pg_dump "${dbUrl}" > "${tmpFile}"`);
    } else {
      const db = parseDbUrl(dbUrl);
      const container = getDockerContainer();
      execSync(
        `docker exec -e PGPASSWORD="${db.password}" ${container} pg_dump -U ${db.user} ${db.database} > "${tmpFile}"`,
      );
    }

    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);
    stream.on("end", () => {
      fs.unlinkSync(tmpFile);
    });
    stream.on("error", () => {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream backup" });
      }
    });
  } catch (err: any) {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    res.status(500).json({ error: "Backup failed", details: err.message });
  }
});

/** POST /api/backup/restore — accept uploaded .sql file and restore */
router.post("/restore", requireAdmin, upload.single("backup"), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No backup file uploaded" });
    return;
  }

  const tmpFile = file.path;
  try {
    const dbUrl = process.env.DATABASE_URL!;

    if (commandExists("psql")) {
      execSync(`psql "${dbUrl}" < "${tmpFile}"`, { stdio: "pipe" });
    } else {
      const db = parseDbUrl(dbUrl);
      const container = getDockerContainer();
      execSync(
        `docker exec -i -e PGPASSWORD="${db.password}" ${container} psql -U ${db.user} ${db.database} < "${tmpFile}"`,
        { stdio: ["pipe", "pipe", "pipe"] },
      );
    }

    fs.unlinkSync(tmpFile);
    res.json({ success: true });
  } catch (err: any) {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    res.status(500).json({ error: "Restore failed", details: err.message });
  }
});

export default router;
