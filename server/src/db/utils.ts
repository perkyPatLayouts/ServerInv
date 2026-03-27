/**
 * Database type detection and utilities
 */

/**
 * Supported database types
 */
export type DatabaseType = 'postgres' | 'mysql';

/**
 * Detects database type from DATABASE_URL protocol
 *
 * @param databaseUrl - The database connection URL
 * @returns The detected database type
 * @throws Error if DATABASE_URL is missing or uses unsupported protocol
 */
export function detectDatabaseType(databaseUrl: string): DatabaseType {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
    return 'postgres';
  } else if (databaseUrl.startsWith('mysql://')) {
    return 'mysql';
  }

  throw new Error(
    'Unsupported DATABASE_URL protocol. Use postgres://, postgresql://, or mysql://'
  );
}
