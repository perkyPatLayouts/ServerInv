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
   * @returns SQL dump as string
   */
  async generateBackup(): Promise<string> {
    const conn = await this.pool.getConnection();

    try {
      let sql = "-- ServerInv Database Backup\n";
      sql += `-- Generated: ${new Date().toISOString()}\n\n`;
      sql += "SET FOREIGN_KEY_CHECKS=0;\n\n";

      // Get all tables
      const [tables]: any = await conn.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name"
      );

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
   */
  async restoreBackup(sqlContent: string): Promise<void> {
    const conn = await this.pool.getConnection();

    try {
      // Parse SQL into statements
      const statements = this.parseSQL(sqlContent);

      // Execute all statements
      for (const statement of statements) {
        if (statement.trim() && !statement.startsWith('--')) {
          try {
            await conn.query(statement);
          } catch (err: any) {
            console.error("Failed to execute statement:", statement.substring(0, 100));
            throw err;
          }
        }
      }
    } finally {
      conn.release();
    }
  }

  /**
   * Parse SQL content into individual statements.
   * Handles multi-line statements and comments.
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

      // Handle comments (only outside strings)
      if (!inString && char === "-" && nextChar === "-") {
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
