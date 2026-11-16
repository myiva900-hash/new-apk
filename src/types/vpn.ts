export type ConnectionMode =
  | 'wireguard_server'
  | 'wireguard_manual'
  | 'imported_config';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting';

export type SimCarrierMode = 'all_sim' | 'mtn_rw' | 'airtel_rw' | 'global_sim';

export interface VpnServer {
  id: string;
  name: string;
  location: string;
  countryCode: string;
  flag: string;
  endpointHost: string;
  endpointPort: number;
  serverPublicKey: string;
  dnsServers: string;
  allowedIps: string;
  mtu: number;
  requiresVip: boolean;
  createdAt?: string;
}

export interface WireGuardProfile {
  privateKey: string;
  publicKey?: string;
  address: string;
  dns: string;
  mtu: number;
  peerPublicKey: string;
  presharedKey?: string;
  endpointHost: string;
  endpointPort: number;
  allowedIps: string;
  persistentKeepalive: number;
  importedConfigName?: string;
}

export interface CustomSetupConfig {
  wireguard: WireGuardProfile;
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
  connectionTimeout: number;
}

export interface VpnLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'vip_shield';
  message: string;
}

export interface VipAccountStatus {
  deviceId: string;
  isVipActive: boolean;
  vipExpiresAt: number;
  remainingSeconds: number;
  totalCreditedHours: number;
  serverTimeMs?: number;
}

export interface PaymentRecord {
  id: string;
  deviceId?: string;
  planId: '1week' | '2months' | '3years';
  planTitle: string;
  amountFrw: number;
  hoursToCredit: number;
  payerPhone: string;
  momoTxId: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  adminNote?: string | null;
  createdAt: string;
  verifiedAt?: string | null;
}

export interface AdminRedeemCodeRecord {
  codeHint: string;
  hours: number;
  assignedTo: string;
  redeemed: boolean;
  redeemedBy?: string | null;
  redeemedAt?: string | null;
  createdAt: string;
}

export interface ExportableConfig {
  appName: 'Mutiganda Yvan VPN';
  version: '6.0.0';
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
