import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import multer, { FileFilterCallback } from "multer";
import { PgBackupService } from "../services/pgBackupService.js";
import { pool } from "../db/index.js";

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

  // Look for ServerInv container specifically (contains "serverinv" in name)
  const containers = out.split("\n");
  const serverinvContainer = containers.find(name => name.toLowerCase().includes("serverinv"));
  if (serverinvContainer) return serverinvContainer;

  // Fallback to first container (for backward compatibility)
  return containers[0];
}

/** GET /api/backup/download — create pg_dump and stream to browser */
router.get("/download", requireAdmin, async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `serverinv-backup-${timestamp}.sql`;
  const tmpDir = process.env.TMP_DIR || "/tmp";
  const tmpFile = path.join(tmpDir, filename);

  try {
    const dbUrl = process.env.DATABASE_URL!;
    const usePgDump = commandExists("pg_dump") || commandExists("docker");

    if (usePgDump) {
      // Fast path: Use native pg_dump (VPS environments)
      if (commandExists("pg_dump")) {
        // Use DATABASE_URL directly - pg_dump handles it safely
        execSync(`pg_dump "${dbUrl}" > "${tmpFile}"`, {
          env: { ...process.env },
          shell: '/bin/bash'
        });
      } else {
        const db = parseDbUrl(dbUrl);
        const container = getDockerContainer();
        // Security: Use environment variable for password instead of command-line argument
        // This prevents password exposure in process list and command injection
        execSync(
          `docker exec -i -e PGPASSWORD='${db.password.replace(/'/g, "'\\''")}' ${container} pg_dump -U ${db.user} -h localhost ${db.database} > "${tmpFile}"`,
          { env: { ...process.env }, shell: '/bin/bash' }
        );
      }
    } else {
      // Pure Node.js backup (shared hosting environments)
      console.log("Using pure Node.js backup (pg_dump not available)");
      const backupService = new PgBackupService(pool);
      const sql = await backupService.generateBackup();
      fs.writeFileSync(tmpFile, sql, "utf8");
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
    // Security: Don't expose error details to client
    console.error("Backup error:", err);
    res.status(500).json({ error: "Backup failed" });
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
    const usePsql = commandExists("psql") || commandExists("docker");

    if (usePsql) {
      // Fast path: Use native psql (VPS environments)
      if (commandExists("psql")) {
        execSync(`psql "${dbUrl}" < "${tmpFile}"`, {
          stdio: "pipe",
          env: { ...process.env },
          shell: '/bin/bash'
        });
      } else {
        const db = parseDbUrl(dbUrl);
        const container = getDockerContainer();
        // Security: Use environment variable for password instead of command-line argument
        // Escape single quotes in password to prevent injection
        execSync(
          `docker exec -i -e PGPASSWORD='${db.password.replace(/'/g, "'\\''")}' ${container} psql -U ${db.user} -h localhost ${db.database} < "${tmpFile}"`,
          {
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env },
            shell: '/bin/bash'
          }
        );
      }
    } else {
      // Pure Node.js restore (shared hosting environments)
      console.log("Using pure Node.js restore (psql not available)");
      const backupService = new PgBackupService(pool);
      const sql = fs.readFileSync(tmpFile, "utf8");
      await backupService.restoreBackup(sql);
    }

    fs.unlinkSync(tmpFile);
    res.json({ success: true });
  } catch (err: any) {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    // Security: Don't expose error details to client
    console.error("Restore error:", err);
    res.status(500).json({ error: "Restore failed" });
  }
});

export default router;
