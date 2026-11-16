export type ConnectionMode = 
  | 'direct' 
  | 'custom_payload' 
  | 'custom_host' 
  | 'custom_sni' 
  | 'dnstt' 
  | 'imported_config';

export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'authenticating' 
  | 'connected' 
  | 'disconnecting' 
  | 'reconnecting';

export type SimCarrierMode = 'all_sim' | 'mtn_rw' | 'airtel_rw' | 'global_sim';

export interface VpnServer {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  host: string;
  ip: string;
  ping: number; // in ms
  load: number; // percentage
  supportsUdp: boolean;
  supportsSsl: boolean;
  noVpsRequired?: boolean;
  vipTier?: 'PREMIUM' | 'STANDARD';
}

export interface RedeemCodeRecord {
  code: string;
  hours: number;
  createdAt: string;
  redeemed: boolean;
  redeemedAt?: string;
  assignedTo?: string;
}

export interface CustomSetupConfig {
  payload: string;
  hostHeader: string;
  sni: string;
  proxyHost: string;
  proxyPort: string;
  dnsttDomain: string;
  dnsttPublicKey: string;
  dnsResolver: string;
  importedConfigName?: string;
  importedConfigRaw?: string;
}

export interface AppSettings {
  sound: boolean;
  vibrate: boolean;
  theme: 'light' | 'dark' | 'system';
  accentColor: 'blue' | 'red' | 'green' | 'yellow' | 'black';
  connectionRetry: boolean;
  forwardDns: boolean;
  customDns: boolean;
  primaryDns: string;
  secondaryDns: string;
  autoReconnect: boolean;
  connectionTimeout: number; // seconds
}

export interface VpnLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'vip_shield';
  message: string;
}

export interface ExportableConfig {
  appName: 'Mutiganda Yvan VPN';
  version: '2.4.0';
  exportDate: string;
  configName: string;
  note: string;
  connectionMode: ConnectionMode;
  serverHost: string;
  serverPort: number;
  customSetup: CustomSetupConfig;
  settings: Partial<AppSettings>;
  locked: boolean;
  passwordProtected: boolean;
  passwordHash?: string;
  hwidLocked: boolean;
  targetHwid?: string;
  expiryDate?: string;
}
