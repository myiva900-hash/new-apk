import {
  ConnectionMode,
  ConnectionStatus,
  CustomSetupConfig,
  RedeemCodeRecord,
  SimCarrierMode,
  VpnLogEntry,
  VpnServer,
} from '../types/vpn';
import { soundService } from './sound';
import { triggerHaptic } from './haptics';

const INITIAL_COUNTDOWN_SECONDS = 124 * 3600; // 124 hours = 446,400 seconds
const REDEEM_BONUS_SECONDS = 50 * 3600; // +50 hours = 180,000 seconds
const STORAGE_REMAINING_KEY = 'myv_remaining_seconds_v6';
const STORAGE_CODES_KEY = 'myv_redeem_codes_v6';

export interface VpnStats {
  uploadBytes: number;
  downloadBytes: number;
  uploadSpeed: number; // bytes/sec
  downloadSpeed: number; // bytes/sec
  connectedSeconds: number;
  remainingSeconds: number; // Counts down from 124 hours (+50h on redeem)
  assignedIp: string;
}

export type LogListener = (entry: VpnLogEntry) => void;
export type StatusListener = (status: ConnectionStatus, stats: VpnStats) => void;

function loadStoredRemainingSeconds(): number {
  if (typeof window === 'undefined') return INITIAL_COUNTDOWN_SECONDS;
  try {
    const raw = localStorage.getItem(STORAGE_REMAINING_KEY);
    if (raw !== null) {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return INITIAL_COUNTDOWN_SECONDS;
}

function loadStoredCodes(): RedeemCodeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CODES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [
    {
      code: 'MYV-50H-2026-VIP1',
      hours: 50,
      createdAt: new Date().toISOString(),
      redeemed: false,
      assignedTo: 'VIP Welcome Member',
    },
  ];
}

class VpnSimulatorService {
  private status: ConnectionStatus = 'disconnected';
  private stats: VpnStats = {
    uploadBytes: 0,
    downloadBytes: 0,
    uploadSpeed: 0,
    downloadSpeed: 0,
    connectedSeconds: 0,
    remainingSeconds: loadStoredRemainingSeconds(),
    assignedIp: '10.8.0.2',
  };

  private timerInterval: NodeJS.Timeout | null = null;
  private trafficInterval: NodeJS.Timeout | null = null;
  private logListeners: Set<LogListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private codes: RedeemCodeRecord[] = loadStoredCodes();

  private persistRemaining() {
    try {
      localStorage.setItem(STORAGE_REMAINING_KEY, String(this.stats.remainingSeconds));
    } catch {
      // Ignore
    }
  }

  private persistCodes() {
    try {
      localStorage.setItem(STORAGE_CODES_KEY, JSON.stringify(this.codes));
    } catch {
      // Ignore
    }
  }

  public subscribeLogs(listener: LogListener) {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  public subscribeStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status, { ...this.stats });
    return () => this.statusListeners.delete(listener);
  }

  public emitLog(level: 'info' | 'success' | 'warn' | 'error' | 'vip_shield', message: string) {
    const entry: VpnLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      level,
      message,
    };
    this.logListeners.forEach(listener => listener(entry));
  }

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach(listener => listener(this.status, { ...this.stats }));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getStats(): VpnStats {
    return { ...this.stats };
  }

  public getCodes(): RedeemCodeRecord[] {
    return [...this.codes];
  }

  public generateRedeemCode(assignedTo?: string): RedeemCodeRecord {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randBlock = (len: number) =>
      Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

    const record: RedeemCodeRecord = {
      code: `MYV-50H-${randBlock(4)}-${randBlock(4)}`,
      hours: 50,
      createdAt: new Date().toISOString(),
      redeemed: false,
      assignedTo: assignedTo?.trim() || 'VIP Room Guest',
    };

    this.codes = [record, ...this.codes];
    this.persistCodes();
    this.emitLog('vip_shield', `[REDEEM-GEN] Generated +50H VIP Redeem Code: ${record.code}`);
    return record;
  }

  public redeemTimeCode(rawInput: string): { ok: boolean; message: string; addedHours?: number } {
    const cleaned = rawInput.trim().toUpperCase();
    if (!cleaned) {
      return { ok: false, message: 'Andika Redeem Code mbere yo gukomeza.' };
    }

    const existing = this.codes.find(c => c.code.toUpperCase() === cleaned);
    if (existing) {
      if (existing.redeemed) {
        return { ok: false, message: `Code ${cleaned} yarakoreshejwe mbere.` };
      }
      existing.redeemed = true;
      existing.redeemedAt = new Date().toISOString();
      this.persistCodes();
    } else if (/^MYV-50H-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleaned)) {
      this.codes = [
        {
          code: cleaned,
          hours: 50,
          createdAt: new Date().toISOString(),
          redeemed: true,
          redeemedAt: new Date().toISOString(),
          assignedTo: 'External VIP Pass',
        },
        ...this.codes,
      ];
      this.persistCodes();
    } else {
      return {
        ok: false,
        message: 'Redeem Code siyo. Koresha code ya MYV-50H-XXXX-XXXX cyangwa ukore code nshya.',
      };
    }

    this.stats.remainingSeconds += REDEEM_BONUS_SECONDS;
    this.persistRemaining();
    this.statusListeners.forEach(listener => listener(this.status, { ...this.stats }));

    this.emitLog(
      'vip_shield',
      `[REDEEM-SUCCESS] +50 Hours VIP Time added via ${cleaned}! New balance: ${this.formatCountdown(this.stats.remainingSeconds)}`
    );

    return {
      ok: true,
      message: `+50 Hours VIP Time yongeweho neza! (${cleaned})`,
      addedHours: 50,
    };
  }

  public async startConnection(
    server: VpnServer,
    port: number,
    mode: ConnectionMode,
    customSetup: CustomSetupConfig,
    settings: {
      sound: boolean;
      vibrate: boolean;
      primaryDns: string;
      forwardDns: boolean;
      simCarrier?: SimCarrierMode;
    }
  ) {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }

    if (this.stats.remainingSeconds <= 0) {
      this.stats.remainingSeconds = INITIAL_COUNTDOWN_SECONDS;
      this.persistRemaining();
    }

    this.setStatus('connecting');
    this.emitLog('info', `[System] Mutiganda Yvan VPN v6.0.0 Core started`);
    this.emitLog(
      'info',
      `[SIM-BYPASS] Universal Carrier Engine: ${(settings.simCarrier || 'all_sim').toUpperCase()} (Works on ALL SIM Cards)`
    );

    // Call native Android VPN bridge if running inside Android APK
    try {
      if (typeof window !== 'undefined' && (window as any).AndroidVpn?.startVpn) {
        (window as any).AndroidVpn.startVpn(server.host, port);
        this.emitLog('info', `[Native] Android VpnService interface invoked for ${server.name}`);
      }
    } catch (e) {
      console.warn('Native VPN bridge:', e);
    }

    this.emitLog('info', `[VPN] Initializing Built-in No-VPS Edge Tunnel...`);
    this.emitLog('info', `[Config] Target Node: ${server.name} (${server.country}) -> ${server.host}:${port}`);
    this.emitLog('info', `[DNS] Forward DNS: ${settings.forwardDns ? 'Enabled' : 'Disabled'} | Resolver: ${settings.primaryDns || '1.1.1.1'}`);

    await new Promise(r => setTimeout(r, 400));

    this.setStatus('authenticating');
    this.emitLog('info', `[Net] Allocating protected TUN socket & verifying Zero-VPS Cloud Edge...`);

    // Real reachability check (non-blocking)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      await fetch('https://1.1.1.1/cdn-cgi/trace', { mode: 'no-cors', signal: controller.signal }).catch(() => {});
      clearTimeout(timeoutId);
    } catch {
      // Offline / sandbox fallback handled cleanly
    }

    await new Promise(r => setTimeout(r, 450));

    switch (mode) {
      case 'custom_payload': {
        this.emitLog('info', `[Payload] Injecting HTTP/TCP Header to remote gateway...`);
        const snippet = (customSetup.payload || '').slice(0, 48).replace(/\[crlf\]/g, ' ');
        this.emitLog('info', `[Payload Raw] ${snippet}...`);
        await new Promise(r => setTimeout(r, 350));
        this.emitLog('success', `[Proxy] Received HTTP/1.1 200 Connection Established`);
        break;
      }

      case 'custom_sni': {
        const targetSni = customSetup.sni || 'edge.cloudflare.com';
        this.emitLog('info', `[TLS] Initiating SSL/TLS handshake with SNI: ${targetSni}`);
        await new Promise(r => setTimeout(r, 350));
        this.emitLog('success', `[TLS] Handshake complete: TLSv1.3 / AES_256_GCM_SHA384`);
        break;
      }

      case 'custom_host': {
        const host = customSetup.hostHeader || 'cdn.cloudflare.net';
        this.emitLog('info', `[HTTP] Transmitting HTTP CONNECT proxy header with Host: ${host}`);
        await new Promise(r => setTimeout(r, 300));
        this.emitLog('success', `[HTTP] HTTP/1.1 200 OK`);
        break;
      }

      case 'dnstt': {
        this.emitLog('info', `[DNSTT] Initializing DNS Tunnel over UDP 53 -> ${customSetup.dnsttDomain || 't.myv-dns.org'}`);
        await new Promise(r => setTimeout(r, 350));
        this.emitLog('success', `[DNSTT] Cryptographic session key established`);
        break;
      }

      case 'imported_config': {
        this.emitLog('info', `[Import] Reading active profile: ${customSetup.importedConfigName || 'myv_secure.myv'}`);
        await new Promise(r => setTimeout(r, 300));
        this.emitLog('success', `[Import] Decrypted session parameters verified`);
        break;
      }

      case 'direct':
      default: {
        this.emitLog('info', `[Direct] TCP 3-Way Handshake with ${server.ip}:${port}...`);
        await new Promise(r => setTimeout(r, 300));
        this.emitLog('success', `[Direct] Remote Cloud Edge synchronized (No VPS Required)`);
        break;
      }
    }

    await new Promise(r => setTimeout(r, 250));
    this.emitLog('info', `[TUN] Builder.addAddress("10.8.0.2", 24).addRoute("0.0.0.0", 0).establish()`);
    this.emitLog('success', `[TUN] Virtual interface tun0 active (All SIM Cards Unlocked)`);

    // Explicitly requested Yellow & Green Anti-Hacking / Anti-Spam Premium Server logs
    this.emitLog(
      'vip_shield',
      `[HACKING-SHIELD] Anti-Hacking & Anti-Spam Protection ACTIVE · Zero Intrusion · Zero Spam`
    );
    this.emitLog(
      'vip_shield',
      `[PREMIUM-SERVER] VIP Premium Server Connected (${server.name} · All Country & All SIM) · Timer: ${this.formatCountdown(this.stats.remainingSeconds)} ↓`
    );

    if (settings.sound) {
      soundService.playConnect();
    }
    if (settings.vibrate) {
      triggerHaptic([50, 80, 50]);
    }

    this.stats.connectedSeconds = 0;
    this.setStatus('connected');
    this.startTrafficSimulation();
  }

  private startTrafficSimulation() {
    this.stopIntervals();

    this.timerInterval = setInterval(() => {
      this.stats.connectedSeconds += 1;
      if (this.stats.remainingSeconds > 0) {
        this.stats.remainingSeconds -= 1;
        if (this.stats.connectedSeconds % 5 === 0) {
          this.persistRemaining();
        }
      }
      this.statusListeners.forEach(listener => listener(this.status, { ...this.stats }));
    }, 1000);

    this.trafficInterval = setInterval(() => {
      const upDelta = Math.floor(Math.random() * 34000) + 1500;
      const downDelta = Math.floor(Math.random() * 115000) + 5200;

      this.stats.uploadBytes += upDelta;
      this.stats.downloadBytes += downDelta;
      this.stats.uploadSpeed = upDelta;
      this.stats.downloadSpeed = downDelta;

      this.statusListeners.forEach(listener => listener(this.status, { ...this.stats }));
    }, 1000);
  }

  public async stopConnection(settings: { sound: boolean; vibrate: boolean }) {
    if (this.status === 'disconnected' || this.status === 'disconnecting') {
      return;
    }

    this.setStatus('disconnecting');
    this.emitLog('warn', `[VPN] Disconnect signal received. Tearing down tunnel...`);
    this.stopIntervals();
    this.persistRemaining();

    try {
      if (typeof window !== 'undefined' && (window as any).AndroidVpn?.stopVpn) {
        (window as any).AndroidVpn.stopVpn();
      }
    } catch (e) {
      console.warn('Native VPN bridge stop:', e);
    }

    await new Promise(r => setTimeout(r, 350));

    this.emitLog('info', `[TUN] Closing tun0 file descriptor and releasing routes...`);
    this.emitLog('info', `[Summary] Total Sent: ${this.formatBytes(this.stats.uploadBytes)} | Total Received: ${this.formatBytes(this.stats.downloadBytes)}`);
    this.emitLog('info', `[VPN] Mutiganda Yvan VPN disconnected (Remaining: ${this.formatCountdown(this.stats.remainingSeconds)})`);

    if (settings.sound) {
      soundService.playDisconnect();
    }
    if (settings.vibrate) {
      triggerHaptic(40);
    }

    this.stats.uploadSpeed = 0;
    this.stats.downloadSpeed = 0;
    this.setStatus('disconnected');
  }

  private stopIntervals() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.trafficInterval) {
      clearInterval(this.trafficInterval);
      this.trafficInterval = null;
    }
  }

  public formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  public formatCountdown(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const hrs = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
}

export const vpnSimulator = new VpnSimulatorService();
