// Export schemas based on database type detected at runtime
// The database type is determined by the DATABASE_URL protocol in utils.ts

import { detectDatabaseType } from "../utils.js";
import * as pgSchemas from './postgres/index.js';
import * as mysqlSchemas from './mysql/index.js';

const dbType = detectDatabaseType(process.env.DATABASE_URL || '');

// Select the appropriate schema set based on database type
const schemas = dbType === 'postgres' ? pgSchemas : mysqlSchemas;

// Export all schemas
export const {
  users,
  currencies,
  locations,
  providers,
  serverTypes,
  cpuTypes,
  operatingSystems,
  billingPeriods,
  paymentMethods,
  servers,
  serverWebsites,
  apps,
  serverApps,
  backupConfig
} = schemas;
