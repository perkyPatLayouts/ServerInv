import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import multer, { FileFilterCallback } from "multer";
import { PgBackupService } from "../services/pgBackupService.js";
import { MysqlBackupService } from "../services/mysqlBackupService.js";
import { pool, DB_TYPE } from "../db/index.js";

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

/** Allowed command names for existence checks. */
const ALLOWED_COMMANDS = new Set(["pg_dump", "psql", "mysqldump", "mysql", "docker"]);

/** Check if a command exists on the host. */
function commandExists(cmd: string): boolean {
  if (!ALLOWED_COMMANDS.has(cmd)) return false;
  try {
    const result = spawnSync("command", ["-v", cmd], { stdio: "pipe", shell: true });
    return result.status === 0;
  } catch {
    return false;
  }
}

/** Parse DATABASE_URL into components using the URL constructor. */
function parseDbUrl(url: string) {
  const parsed = new URL(url);
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const host = parsed.hostname;
  const port = parsed.port;
  const database = parsed.pathname.replace(/^\//, "");
  if (!user || !host || !port || !database) {
    throw new Error("Invalid DATABASE_URL format");
  }
  return { user, password, host, port, database };
}

/** Find the running postgres docker container name. */
function getDockerContainer(): string {
  const result = spawnSync("docker", [
    "ps", "--filter", "ancestor=postgres:16-alpine", "--format", "{{.Names}}"
  ], { stdio: "pipe" });
  const out = result.stdout?.toString().trim() || "";
  if (!out) throw new Error("No running PostgreSQL Docker container found");

  const containers = out.split("\n");
  const serverinvContainer = containers.find(name => name.toLowerCase().includes("serverinv"));
  if (serverinvContainer) return serverinvContainer;

  return containers[0];
}

/** Find the running MySQL docker container name. */
function getMysqlDockerContainer(): string {
  const result = spawnSync("docker", [
    "ps", "--filter", "ancestor=mysql:8", "--format", "{{.Names}}"
  ], { stdio: "pipe" });
  const out = result.stdout?.toString().trim() || "";
  if (!out) throw new Error("No running MySQL Docker container found");

  const containers = out.split("\n");
  const serverinvContainer = containers.find(name => name.toLowerCase().includes("serverinv"));
  if (serverinvContainer) return serverinvContainer;

  return containers[0];
}

/** GET /api/backup/download — create database dump and stream to browser */
router.get("/download", requireAdmin, async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `serverinv-backup-${timestamp}.sql`;
  const tmpDir = process.env.TMP_DIR || "/tmp";
  const tmpFile = path.join(tmpDir, filename);

  try {
    const dbUrl = process.env.DATABASE_URL!;

    if (DB_TYPE === 'postgres') {
      // PostgreSQL backup
      const usePgDump = commandExists("pg_dump") || commandExists("docker");

      if (usePgDump) {
        const db = parseDbUrl(dbUrl);
        const outFd = fs.openSync(tmpFile, "w");

        if (commandExists("pg_dump")) {
          // Fast path: Use native pg_dump with env-based password
          const result = spawnSync("pg_dump", [
            "-h", db.host, "-p", db.port, "-U", db.user, db.database
          ], {
            stdio: ["pipe", outFd, "pipe"],
            env: { ...process.env, PGPASSWORD: db.password }
          });
          fs.closeSync(outFd);
          if (result.status !== 0) {
            throw new Error(`pg_dump failed: ${result.stderr?.toString()}`);
          }
        } else {
          // Docker path
          const container = getDockerContainer();
          const result = spawnSync("docker", [
            "exec", "-i",
            "-e", `PGPASSWORD=${db.password}`,
            container,
            "pg_dump", "-U", db.user, "-h", "localhost", db.database
          ], {
            stdio: ["pipe", outFd, "pipe"],
            env: { ...process.env }
          });
          fs.closeSync(outFd);
          if (result.status !== 0) {
            throw new Error(`docker pg_dump failed: ${result.stderr?.toString()}`);
          }
        }
      } else {
        // Pure Node.js backup (shared hosting environments)
        console.log("Using pure Node.js PostgreSQL backup (pg_dump not available)");
        const backupService = new PgBackupService(pool);
        const sql = await backupService.generateBackup();
        fs.writeFileSync(tmpFile, sql, "utf8");
      }
    } else {
      // MySQL backup
      const useMysqldump = commandExists("mysqldump");

      if (useMysqldump) {
        const db = parseDbUrl(dbUrl);
        const outFd = fs.openSync(tmpFile, "w");

        // Fast path: Use native mysqldump with env-based password
        const result = spawnSync("mysqldump", [
          "-h", db.host, "-P", db.port, "-u", db.user, db.database
        ], {
          stdio: ["pipe", outFd, "pipe"],
          env: { ...process.env, MYSQL_PWD: db.password }
        });
        fs.closeSync(outFd);
        if (result.status !== 0) {
          throw new Error(`mysqldump failed: ${result.stderr?.toString()}`);
        }
      } else {
        // Pure Node.js backup (shared hosting environments)
        console.log("Using pure Node.js MySQL backup (mysqldump not available)");
        const backupService = new MysqlBackupService(pool);
        const sql = await backupService.generateBackup();
        fs.writeFileSync(tmpFile, sql, "utf8");
      }
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

    if (DB_TYPE === 'postgres') {
      // PostgreSQL restore
      const usePsql = commandExists("psql") || commandExists("docker");

      if (usePsql) {
        const db = parseDbUrl(dbUrl);
        const inFd = fs.openSync(tmpFile, "r");

        if (commandExists("psql")) {
          // Fast path: Use native psql with env-based password
          const result = spawnSync("psql", [
            "-h", db.host, "-p", db.port, "-U", db.user, db.database
          ], {
            stdio: [inFd, "pipe", "pipe"],
            env: { ...process.env, PGPASSWORD: db.password }
          });
          fs.closeSync(inFd);
          if (result.status !== 0) {
            throw new Error(`psql restore failed: ${result.stderr?.toString()}`);
          }
        } else {
          // Docker path
          const container = getDockerContainer();
          const result = spawnSync("docker", [
            "exec", "-i",
            "-e", `PGPASSWORD=${db.password}`,
            container,
            "psql", "-U", db.user, "-h", "localhost", db.database
          ], {
            stdio: [inFd, "pipe", "pipe"],
            env: { ...process.env }
          });
          fs.closeSync(inFd);
          if (result.status !== 0) {
            throw new Error(`docker psql restore failed: ${result.stderr?.toString()}`);
          }
        }
      } else {
        // Pure Node.js restore (shared hosting environments)
        console.log("Using pure Node.js PostgreSQL restore (psql not available)");
        const backupService = new PgBackupService(pool);
        const sql = fs.readFileSync(tmpFile, "utf8");
        await backupService.restoreBackup(sql);
      }
    } else {
      // MySQL restore
      const useMysql = commandExists("mysql");

      if (useMysql) {
        const db = parseDbUrl(dbUrl);
        const inFd = fs.openSync(tmpFile, "r");

        // Fast path: Use native mysql client with env-based password
        const result = spawnSync("mysql", [
          "-h", db.host, "-P", db.port, "-u", db.user, db.database
        ], {
          stdio: [inFd, "pipe", "pipe"],
          env: { ...process.env, MYSQL_PWD: db.password }
        });
        fs.closeSync(inFd);
        if (result.status !== 0) {
          throw new Error(`mysql restore failed: ${result.stderr?.toString()}`);
        }
      } else {
        // Pure Node.js restore (shared hosting environments)
        console.log("Using pure Node.js MySQL restore (mysql not available)");
        const backupService = new MysqlBackupService(pool);
        const sql = fs.readFileSync(tmpFile, "utf8");
        await backupService.restoreBackup(sql);
      }
    }

    fs.unlinkSync(tmpFile);
    res.json({ success: true });
  } catch (err: any) {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    console.error("Restore error:", err);
    res.status(500).json({ error: "Restore failed" });
  }
});

export default router;
