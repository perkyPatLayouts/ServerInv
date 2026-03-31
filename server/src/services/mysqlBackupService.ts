import type { Pool, RowDataPacket } from "mysql2/promise";

/**
 * Pure Node.js MySQL/MariaDB backup service.
 *
 * Provides backup and restore functionality without relying on mysqldump/mysql commands.
 * Designed for shared hosting environments where these tools may not be available.
 *
 * Performance: Slower than native mysqldump (~5-10x), but fully functional.
 * Recommended for databases < 1GB.
 */
export class MysqlBackupService {
  constructor(private pool: Pool) {}

  /**
   * Generate a complete SQL backup of the database.
   *
   * @param options - Backup options
   * @param options.excludeUsers - If true, exclude users table from backup
   * @returns SQL dump as string
   */
  async generateBackup(options: { excludeUsers?: boolean } = {}): Promise<string> {
    const conn = await this.pool.getConnection();

    try {
      let sql = "-- ServerInv Database Backup\n";
      sql += `-- Generated: ${new Date().toISOString()}\n`;
      if (options.excludeUsers) {
        sql += "-- Users table excluded from this backup\n";
      }
      sql += "\n";
      sql += "SET FOREIGN_KEY_CHECKS=0;\n\n";

      // Get all tables
      let [tables]: any = await conn.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name"
      );

      // Exclude users table if requested
      if (options.excludeUsers) {
        tables = tables.filter((t: any) => t.table_name !== 'users');
        console.log("[MysqlBackupService] Excluding users table from backup");
      }

      // Drop and create tables
      for (const { table_name } of tables) {
        sql += `-- Table: ${table_name}\n`;
        sql += `DROP TABLE IF EXISTS \`${table_name}\`;\n`;

        // Get CREATE TABLE statement
        const [createTable]: any = await conn.query(`SHOW CREATE TABLE \`${table_name}\``);
        sql += createTable[0]['Create Table'] + ';\n\n';
      }

      // Insert data for each table
      for (const { table_name } of tables) {
        sql += await this.generateInserts(conn, table_name);
      }

      sql += "SET FOREIGN_KEY_CHECKS=1;\n";
      return sql;
    } finally {
      conn.release();
    }
  }

  /**
   * Generate INSERT statements for a table.
   * Batches rows for better performance (1000 rows per batch).
   */
  private async generateInserts(conn: any, tableName: string): Promise<string> {
    // Get row count
    const [countResult]: any = await conn.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
    const rowCount = countResult[0].count;

    if (rowCount === 0) {
      return `-- No data for table: ${tableName}\n\n`;
    }

    let sql = `-- Data for table: ${tableName} (${rowCount} rows)\n`;

    // Get column information
    const [columns]: any = await conn.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = ?
       ORDER BY ordinal_position`,
      [tableName]
    );

    const columnNames = columns.map((c: any) => `\`${c.column_name}\``).join(", ");

    // Fetch data in batches
    const BATCH_SIZE = 1000;
    let offset = 0;

    while (offset < rowCount) {
      const [rows]: any = await conn.query(
        `SELECT * FROM \`${tableName}\` LIMIT ${BATCH_SIZE} OFFSET ${offset}`
      );

      if (rows.length > 0) {
        sql += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES\n`;

        const valueRows = rows.map((row: any) => {
          const values = columns.map((col: any) => {
            const value = row[col.column_name];
            return this.escapeValue(value, col.data_type);
          }).join(', ');
          return `(${values})`;
        });

        sql += valueRows.join(',\n');
        sql += ';\n\n';
      }

      offset += BATCH_SIZE;
    }

    return sql;
  }

  /**
   * Escape and format a value for SQL insertion.
   */
  private escapeValue(value: any, dataType: string): string {
    if (value === null || value === undefined) {
      return "NULL";
    }

    // Boolean types (tinyint(1))
    if (dataType === "tinyint" || typeof value === "boolean") {
      return value ? "1" : "0";
    }

    // Numeric types
    if (dataType.includes("int") || dataType.includes("decimal") || dataType.includes("float") || dataType.includes("double")) {
      return String(value);
    }

    // Date/time types
    if (dataType.includes("date") || dataType.includes("time")) {
      if (value instanceof Date) {
        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
      }
      return `'${value}'`;
    }

    // String types - escape single quotes and backslashes
    const stringValue = String(value);
    const escaped = stringValue
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
    return `'${escaped}'`;
  }

  /**
   * Restore database from SQL backup file.
   *
   * @param sqlContent - SQL dump content
   * @param options - Restore options
   * @param options.excludeUsers - If true, skip restoring users table
   * @param options.mergeMode - If true, merge with existing data instead of dropping tables
   * @param options.conflictResolution - How to handle duplicate keys: 'keep-existing' or 'use-restored'
   */
  async restoreBackup(
    sqlContent: string,
    options: {
      excludeUsers?: boolean;
      mergeMode?: boolean;
      conflictResolution?: 'keep-existing' | 'use-restored';
    } = {}
  ): Promise<void> {
    const conn = await this.pool.getConnection();

    try {
      await conn.query("SET FOREIGN_KEY_CHECKS=0");

      // Clean restore: drop all existing tables (unless in merge mode)
      if (!options.mergeMode) {
        console.log("[MysqlBackupService] Dropping existing tables for clean restore...");

        const [tables]: any = await conn.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
        );

        for (const { table_name } of tables) {
          console.log(`[MysqlBackupService] Dropping table: ${table_name}`);
          await conn.query(`DROP TABLE IF EXISTS \`${table_name}\``);
        }

        console.log(`[MysqlBackupService] Dropped ${tables.length} existing tables`);
      } else {
        console.log("[MysqlBackupService] Merge mode: preserving existing tables");
        console.log(`[MysqlBackupService] Conflict resolution: ${options.conflictResolution || 'keep-existing'}`);
      }

      // Parse SQL into statements
      const statements = this.parseSQL(sqlContent);
      console.log(`[MysqlBackupService] Parsed ${statements.length} SQL statements from backup`);

      // Execute all statements
      let executedCount = 0;
      let skippedCount = 0;

      for (let statement of statements) {
        if (!statement.trim() || statement.startsWith('--')) continue;

        // Skip users table statements if excludeUsers is true
        if (options.excludeUsers && this.isUsersTableStatement(statement)) {
          skippedCount++;
          continue;
        }

        // In merge mode, handle conflicts for INSERT statements
        if (options.mergeMode && statement.trim().toUpperCase().startsWith('INSERT')) {
          statement = this.convertInsertForMerge(statement, options.conflictResolution || 'keep-existing');
        }

        try {
          await conn.query(statement);
          executedCount++;
          if (executedCount % 100 === 0) {
            console.log(`[MysqlBackupService] Executed ${executedCount} statements...`);
          }
        } catch (err: any) {
          // In merge mode, tolerate "already exists" errors
          if (options.mergeMode && (
            err.message.includes('already exists') ||
            err.message.includes('Duplicate entry')
          )) {
            skippedCount++;
            continue;
          }

          console.error("[MysqlBackupService] Failed to execute statement:");
          console.error("Statement preview:", statement.substring(0, 200));
          console.error("Error:", err.message);
          throw err;
        }
      }

      await conn.query("SET FOREIGN_KEY_CHECKS=1");
      console.log(`[MysqlBackupService] Successfully executed ${executedCount} statements`);
      if (skippedCount > 0) {
        console.log(`[MysqlBackupService] Skipped ${skippedCount} statements (users excluded or conflicts)`);
      }
    } finally {
      conn.release();
    }
  }

  /**
   * Check if a SQL statement operates on the users table.
   */
  private isUsersTableStatement(statement: string): boolean {
    const upperStatement = statement.trim().toUpperCase();
    return (
      upperStatement.includes('TABLE `USERS`') ||
      upperStatement.includes('TABLE USERS') ||
      upperStatement.includes('INTO `USERS`') ||
      upperStatement.includes('INTO USERS') ||
      upperStatement.startsWith('CREATE TABLE `USERS`') ||
      upperStatement.startsWith('CREATE TABLE USERS')
    );
  }

  /**
   * Convert INSERT statement to handle conflicts in merge mode.
   * MySQL uses INSERT IGNORE (keep existing) or REPLACE INTO (use restored).
   */
  private convertInsertForMerge(statement: string, resolution: 'keep-existing' | 'use-restored'): string {
    if (resolution === 'keep-existing') {
      // INSERT IGNORE - keeps existing row on duplicate key
      if (!statement.toUpperCase().includes('IGNORE')) {
        return statement.replace(/^INSERT/i, 'INSERT IGNORE');
      }
    } else {
      // REPLACE INTO - replaces existing row
      return statement.replace(/^INSERT INTO/i, 'REPLACE INTO');
    }

    return statement;
  }

  /**
   * Parse SQL content into individual statements.
   * Handles multi-line statements, comments, and mysql/psql meta-commands.
   */
  private parseSQL(sql: string): string[] {
    const statements: string[] = [];
    let current = "";
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1];

      // Handle strings
      if ((char === "'" || char === '"') && !inString) {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (inString && char === stringChar) {
        // Check for escaped quote (MySQL uses backslash escaping)
        if (sql[i - 1] === '\\') {
          current += char;
          continue;
        }
        inString = false;
        current += char;
        continue;
      }

      // Handle SQL comments (only outside strings)
      if (!inString && char === "-" && nextChar === "-") {
        // Skip to end of line
        while (i < sql.length && sql[i] !== "\n") {
          i++;
        }
        continue;
      }

      // Handle backslash commands (only outside strings)
      // These are lines starting with \ and are not valid SQL for our parser
      // Examples: \restrict, \unrestrict, \dt, \c, etc.
      if (!inString && char === "\\" && (i === 0 || sql[i - 1] === "\n" || sql[i - 1] === "\r")) {
        // Skip to end of line
        while (i < sql.length && sql[i] !== "\n") {
          i++;
        }
        continue;
      }

      // Handle statement terminator
      if (!inString && char === ";") {
        current += char;
        statements.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    // Add last statement if not empty
    if (current.trim()) {
      statements.push(current.trim());
    }

    return statements;
  }
}
