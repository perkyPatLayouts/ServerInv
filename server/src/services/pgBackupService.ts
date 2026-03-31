import { Pool } from "pg";

/**
 * Pure Node.js PostgreSQL backup service.
 *
 * Provides backup and restore functionality without relying on pg_dump/psql commands.
 * Designed for shared hosting environments where these tools may not be available.
 *
 * Performance: Slower than native pg_dump (~5-10x), but fully functional.
 * Recommended for databases < 1GB.
 */
export class PgBackupService {
  constructor(private pool: Pool) {}

  /**
   * Generate a complete SQL backup of the database.
   *
   * @param options - Backup options
   * @param options.excludeUsers - If true, exclude users table from backup
   * @returns SQL dump as string
   */
  async generateBackup(options: { excludeUsers?: boolean } = {}): Promise<string> {
    const client = await this.pool.connect();
    try {
      let sql = "-- ServerInv Database Backup\n";
      sql += `-- Generated: ${new Date().toISOString()}\n`;
      if (options.excludeUsers) {
        sql += "-- Users table excluded from this backup\n";
      }
      sql += "\n";
      sql += "BEGIN;\n\n";

      // Get all user tables (exclude system tables)
      const tablesResult = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);

      let tables = tablesResult.rows.map((r) => r.tablename);

      // Exclude users table if requested
      if (options.excludeUsers) {
        tables = tables.filter(t => t !== 'users');
        console.log("[PgBackupService] Excluding users table from backup");
      }

      // Drop tables in reverse order to handle foreign key constraints
      sql += "-- Drop existing tables\n";
      for (const table of tables.reverse()) {
        sql += `DROP TABLE IF EXISTS "${table}" CASCADE;\n`;
      }
      sql += "\n";

      // Reverse back to original order for creation
      tables.reverse();

      // Generate CREATE TABLE statements
      for (const table of tables) {
        sql += await this.generateCreateTable(client, table);
        sql += "\n";
      }

      // Generate INSERT statements
      for (const table of tables) {
        sql += await this.generateInserts(client, table);
        sql += "\n";
      }

      // Restore sequences
      sql += await this.generateSequenceResets(client, tables);

      sql += "COMMIT;\n";
      return sql;
    } finally {
      client.release();
    }
  }

  /**
   * Generate CREATE TABLE statement for a specific table.
   */
  private async generateCreateTable(client: any, tableName: string): Promise<string> {
    let sql = `-- Table: ${tableName}\n`;
    sql += `CREATE TABLE "${tableName}" (\n`;

    // Get column definitions
    const columnsResult = await client.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    const columnDefs: string[] = [];

    for (const col of columnsResult.rows) {
      let def = `  "${col.column_name}" `;

      // Map data type
      if (col.data_type === "character varying") {
        def += `VARCHAR(${col.character_maximum_length})`;
      } else if (col.data_type === "integer") {
        def += "INTEGER";
      } else if (col.data_type === "numeric") {
        def += `DECIMAL(${col.numeric_precision},${col.numeric_scale})`;
      } else if (col.data_type === "boolean") {
        def += "BOOLEAN";
      } else if (col.data_type === "date") {
        def += "DATE";
      } else if (col.data_type === "timestamp without time zone") {
        def += "TIMESTAMP";
      } else {
        def += col.data_type.toUpperCase();
      }

      // Handle NOT NULL
      if (col.is_nullable === "NO") {
        def += " NOT NULL";
      }

      // Handle DEFAULT (skip SERIAL defaults as they'll be recreated)
      if (col.column_default && !col.column_default.startsWith("nextval")) {
        def += ` DEFAULT ${col.column_default}`;
      }

      columnDefs.push(def);
    }

    sql += columnDefs.join(",\n");
    sql += "\n);\n\n";

    // Add primary key constraint
    const pkResult = await client.query(`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass AND i.indisprimary
    `, [tableName]);

    if (pkResult.rows.length > 0) {
      const pkColumns = pkResult.rows.map((r: any) => `"${r.attname}"`).join(", ");
      sql += `ALTER TABLE "${tableName}" ADD PRIMARY KEY (${pkColumns});\n\n`;
    }

    // Add foreign key constraints
    const fkResult = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1
    `, [tableName]);

    for (const fk of fkResult.rows) {
      sql += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${fk.constraint_name}" `;
      sql += `FOREIGN KEY ("${fk.column_name}") `;
      sql += `REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}");\n`;
    }

    if (fkResult.rows.length > 0) {
      sql += "\n";
    }

    return sql;
  }

  /**
   * Generate INSERT statements for a table.
   * Batches rows for better performance (1000 rows per batch).
   */
  private async generateInserts(client: any, tableName: string): Promise<string> {
    // Get row count
    const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const rowCount = parseInt(countResult.rows[0].count);

    if (rowCount === 0) {
      return `-- No data for table: ${tableName}\n`;
    }

    let sql = `-- Data for table: ${tableName} (${rowCount} rows)\n`;

    // Get column names
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    const columns = columnsResult.rows as any[];
    const columnNames = columns.map((c: any) => `"${c.column_name}"`).join(", ");

    // Fetch data in batches
    const BATCH_SIZE = 1000;
    let offset = 0;

    while (offset < rowCount) {
      const dataResult = await client.query(
        `SELECT * FROM "${tableName}" ORDER BY 1 LIMIT ${BATCH_SIZE} OFFSET ${offset}`
      );

      for (const row of dataResult.rows) {
        const values = columns.map((col: any) => {
          const value = row[col.column_name];
          return this.escapeValue(value, col.data_type);
        }).join(", ");

        sql += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});\n`;
      }

      offset += BATCH_SIZE;
    }

    sql += "\n";
    return sql;
  }

  /**
   * Generate sequence reset statements to ensure serial columns continue from correct values.
   */
  private async generateSequenceResets(client: any, tables: string[]): Promise<string> {
    let sql = "-- Reset sequences\n";

    for (const table of tables) {
      const seqResult = await client.query(`
        SELECT
          column_name,
          pg_get_serial_sequence($1, column_name) as sequence_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_default LIKE 'nextval%'
      `, [table]);

      for (const seq of seqResult.rows) {
        if (seq.sequence_name) {
          sql += `SELECT setval('${seq.sequence_name}', (SELECT COALESCE(MAX("${seq.column_name}"), 1) FROM "${table}"), true);\n`;
        }
      }
    }

    sql += "\n";
    return sql;
  }

  /**
   * Escape and format a value for SQL insertion.
   */
  private escapeValue(value: any, dataType: string): string {
    if (value === null || value === undefined) {
      return "NULL";
    }

    if (dataType === "boolean") {
      return value ? "true" : "false";
    }

    if (dataType === "integer" || dataType === "numeric") {
      return String(value);
    }

    if (dataType === "date" || dataType === "timestamp without time zone") {
      if (value instanceof Date) {
        return `'${value.toISOString()}'`;
      }
      return `'${value}'`;
    }

    // String types - escape single quotes
    const stringValue = String(value);
    const escaped = stringValue.replace(/'/g, "''");
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
    const client = await this.pool.connect();
    try {
      // Clean restore: drop and recreate schema (unless in merge mode)
      if (!options.mergeMode) {
        console.log("[PgBackupService] Dropping existing schema for clean restore...");
        await client.query("DROP SCHEMA IF EXISTS public CASCADE");
        await client.query("CREATE SCHEMA public");
        await client.query("GRANT ALL ON SCHEMA public TO current_user");
        await client.query("GRANT ALL ON SCHEMA public TO public");
        console.log("[PgBackupService] Schema recreated successfully");
      } else {
        console.log("[PgBackupService] Merge mode: preserving existing tables");
        console.log(`[PgBackupService] Conflict resolution: ${options.conflictResolution || 'keep-existing'}`);
      }

      // Parse SQL into statements
      const statements = this.parseSQL(sqlContent);
      console.log(`[PgBackupService] Parsed ${statements.length} SQL statements from backup`);

      let executedCount = 0;
      let skippedCount = 0;

      // In merge mode, execute statements individually (no transaction)
      // This allows us to tolerate errors without aborting everything
      if (options.mergeMode) {
        console.log("[PgBackupService] Executing statements individually (merge mode)");

        for (let statement of statements) {
          if (!statement.trim()) continue;

          // Skip users table statements if excludeUsers is true
          if (options.excludeUsers && this.isUsersTableStatement(statement)) {
            skippedCount++;
            continue;
          }

          // Skip ownership statements
          if (this.isOwnershipStatement(statement)) {
            skippedCount++;
            continue;
          }

          // Handle conflicts for INSERT statements
          if (statement.trim().toUpperCase().startsWith('INSERT')) {
            const originalStatement = statement;
            statement = this.convertInsertForMerge(statement, options.conflictResolution || 'keep-existing');

            // Debug: log first converted statement to verify conversion works
            if (executedCount === 0 && statement !== originalStatement) {
              console.log(`[PgBackupService] Example conflict handling (${options.conflictResolution}):`);
              console.log(`[PgBackupService] Original: ${originalStatement.substring(0, 100)}...`);
              console.log(`[PgBackupService] Converted: ${statement.substring(0, 150)}...`);
            }
          }

          try {
            await client.query(statement);
            executedCount++;
            if (executedCount % 100 === 0) {
              console.log(`[PgBackupService] Executed ${executedCount} statements...`);
            }
          } catch (err: any) {
            // Tolerate specific errors in merge mode
            if (
              err.message.includes('already exists') ||
              err.message.includes('does not exist')
            ) {
              skippedCount++;
              continue;
            }

            // For duplicate key errors, log more details to debug conflict resolution
            if (err.message.includes('duplicate key')) {
              console.error("[PgBackupService] Duplicate key error (conflict resolution may not be working):");
              console.error("Statement preview:", statement.substring(0, 250));
              console.error("Error:", err.message);
              console.error("Expected: ON CONFLICT clause should prevent this error");
              skippedCount++;
              continue;
            }

            console.error("[PgBackupService] Failed to execute statement:");
            console.error("Statement preview:", statement.substring(0, 200));
            console.error("Error:", err.message);
            // Don't throw - continue with next statement
            skippedCount++;
          }
        }

        console.log(`[PgBackupService] Successfully executed ${executedCount} statements`);
        if (skippedCount > 0) {
          console.log(`[PgBackupService] Skipped ${skippedCount} statements (conflicts or errors)`);
        }
      } else {
        // Clean restore mode: use transaction for atomicity
        await client.query("BEGIN");
        console.log("[PgBackupService] Started transaction");

        for (let statement of statements) {
          if (!statement.trim()) continue;

          // Skip users table statements if excludeUsers is true
          if (options.excludeUsers && this.isUsersTableStatement(statement)) {
            skippedCount++;
            continue;
          }

          // Skip ownership statements
          if (this.isOwnershipStatement(statement)) {
            skippedCount++;
            continue;
          }

          try {
            await client.query(statement);
            executedCount++;
            if (executedCount % 100 === 0) {
              console.log(`[PgBackupService] Executed ${executedCount} statements...`);
            }
          } catch (err: any) {
            console.error("[PgBackupService] Failed to execute statement:");
            console.error("Statement preview:", statement.substring(0, 200));
            console.error("Error:", err.message);
            throw err;
          }
        }

        await client.query("COMMIT");
        console.log(`[PgBackupService] Successfully committed ${executedCount} statements`);
        if (skippedCount > 0) {
          console.log(`[PgBackupService] Skipped ${skippedCount} statements (users excluded)`);
        }
      }
    } catch (err: any) {
      console.error("[PgBackupService] Restore failed");
      if (!options.mergeMode) {
        console.error("[PgBackupService] Rolling back transaction");
        await client.query("ROLLBACK");
        console.error("[PgBackupService] Rollback completed");
      }
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Check if a SQL statement operates on the users table.
   */
  private isUsersTableStatement(statement: string): boolean {
    const upperStatement = statement.trim().toUpperCase();
    return (
      upperStatement.includes('TABLE "USERS"') ||
      upperStatement.includes('TABLE USERS') ||
      upperStatement.includes('INTO "USERS"') ||
      upperStatement.includes('INTO USERS') ||
      upperStatement.startsWith('CREATE TABLE "USERS"') ||
      upperStatement.startsWith('CREATE TABLE USERS')
    );
  }

  /**
   * Check if a SQL statement is an ownership/role statement.
   * These should be skipped to avoid role conflicts between environments.
   */
  private isOwnershipStatement(statement: string): boolean {
    const upperStatement = statement.trim().toUpperCase();
    return (
      upperStatement.includes('OWNER TO') ||
      upperStatement.startsWith('ALTER SCHEMA') ||
      upperStatement.startsWith('CREATE ROLE') ||
      upperStatement.startsWith('GRANT') ||
      upperStatement.startsWith('REVOKE')
    );
  }

  /**
   * Convert INSERT statement to handle conflicts in merge mode.
   * PostgreSQL uses ON CONFLICT clause.
   */
  private convertInsertForMerge(statement: string, resolution: 'keep-existing' | 'use-restored'): string {
    // Extract table name to get primary key
    const tableMatch = statement.match(/INSERT INTO ["']?(\w+)["']?/i);
    if (!tableMatch) return statement;

    const tableName = tableMatch[1];

    if (resolution === 'keep-existing') {
      // ON CONFLICT DO NOTHING - keeps existing row
      if (!statement.includes('ON CONFLICT')) {
        // Assume 'id' is the primary key (standard for all our tables)
        return statement.replace(/;?\s*$/, ' ON CONFLICT (id) DO NOTHING;');
      }
    } else {
      // ON CONFLICT DO UPDATE - replaces with restored row
      // This is more complex as we need to update all columns
      // For simplicity, we'll use DO UPDATE SET ... EXCLUDED
      if (!statement.includes('ON CONFLICT')) {
        // Extract column names from INSERT
        const columnsMatch = statement.match(/\(([^)]+)\)\s+VALUES/i);
        if (columnsMatch) {
          const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/['"]/g, ''));
          const updateClauses = columns
            .filter(col => col !== 'id') // Don't update primary key
            .map(col => `"${col}" = EXCLUDED."${col}"`)
            .join(', ');

          if (updateClauses) {
            return statement.replace(/;?\s*$/, ` ON CONFLICT (id) DO UPDATE SET ${updateClauses};`);
          }
        }
      }
    }

    return statement;
  }

  /**
   * Parse SQL content into individual statements.
   * Handles multi-line statements, comments, and psql meta-commands.
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
        // Check for escaped quote
        if (nextChar === stringChar) {
          current += char + nextChar;
          i++; // Skip next char
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

      // Handle psql meta-commands and backslash commands (only outside strings)
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
