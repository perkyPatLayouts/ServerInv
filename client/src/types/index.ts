export interface Server {
  id: number;
  name: string;
  url: string | null;
  ip: string | null;
  serverTypeId: number | null;
  providerId: number | null;
  locationId: number | null;
  price: string | null;
  billingPeriodId: number | null;
  paymentMethodId: number | null;
  recurring: boolean;
  autoRenew: boolean;
  currencyId: number | null;
  renewalDate: string | null;
  ram: number | null;
  diskSize: number | null;
  diskType: string | null;
  cpuTypeId: number | null;
  osId: number | null;
  notes: string | null;
  // Joined fields
  serverType?: string | null;
  serverTypeVirtualization?: string | null;
  providerName?: string | null;
  providerSiteUrl?: string | null;
  providerControlPanelUrl?: string | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  locationDatacenter?: string | null;
  currencyCode?: string | null;
  currencySymbol?: string | null;
  billingPeriod?: string | null;
  paymentMethod?: string | null;
  cpuType?: string | null;
  cpuCores?: number | null;
  cpuSpeed?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  osVariant?: string | null;
  websites?: Website[];
}

export interface Website {
  id: number;
  serverId: number;
  domain: string;
  application: string | null;
  notes: string | null;
}

export interface Currency { id: number; code: string; name: string; symbol: string; }
export interface Location { id: number; city: string; country: string; datacenter: string | null; }
export interface Provider { id: number; name: string; siteUrl: string | null; controlPanelUrl: string | null; }
export interface ServerType { id: number; name: string; virtualizationType: string | null; }
export interface BillingPeriod { id: number; name: string; }
export interface PaymentMethod { id: number; name: string; }
export interface CpuType { id: number; type: string; cores: number; speed: string; }
export interface OperatingSystem { id: number; name: string; version: string; variant: string; }
export interface User { id: number; username: string; role: string; createdAt?: string; }
export interface BackupConfig { id: number; host: string; port: number; username: string; password: string | null; privateKey: string | null; remotePath: string; }
export interface BackupFile { name: string; size: number; modifyTime: number; }
