import {
  ConnectionStatus,
  VpnLogEntry,
  WireGuardProfile,
} from '../types/vpn';
import { soundService } from './sound';
import { triggerHaptic } from './haptics';
import { backendApi } from './api';

export interface BridgeNotice {
  level: 'error' | 'warn' | 'info' | 'success';
  title: string;
  message: string;
  action?: 'add_server' | 'import_conf' | 'gen_keys' | 'download_apk' | 'vip_payment';
}

export interface LiveTunnelStats {
  rxBytes: number;
  txBytes: number;
  rxSpeed: number;
  txSpeed: number;
  connectedSeconds: number;
  latestHandshakeEpochMs: number;
  tunnelName: string;
  nativeAndroidActive: boolean;
  lastNotice: BridgeNotice | null;
}

export type LogListener = (entry: VpnLogEntry) => void;
export type StatusListener = (status: ConnectionStatus, stats: LiveTunnelStats) => void;

interface AndroidVpnInterface {
  isNativeAndroid?: () => boolean;
  isWireGuardSupported?: () => boolean;
  startWireGuard?: (configIni: string, serverLabel: string) => void;
  stopWireGuard?: () => void;
  getStatusJson?: () => string;
  generateWireGuardKeyPair?: () => string;
  openWhatsApp?: (phoneNumber: string) => void;
  isOfflineTtsAvailable?: () => boolean;
  speakOffline?: (stepsJsonOrText: string) => void;
  stopSpeakOffline?: () => void;
}

declare global {
  interface Window {
    AndroidVpn?: AndroidVpnInterface;
    __MYV_NATIVE_BRIDGE__?: {
      onNativeEvent: (eventType: string, payload: Record<string, unknown>) => void;
    };
  }
}

export function isValidWireGuardKey(key: string): boolean {
  return /^[A-Za-z0-9+/]{42,43}=$/.test(key.trim());
}

export function isBlockedDocIp(host: string): boolean {
  const clean = host.trim();
  return (
    clean.startsWith('192.0.2.') ||
    clean.startsWith('198.51.100.') ||
    clean.startsWith('203.0.113.')
  );
}

export function parseWireGuardConf(rawText: string): {
  ok: boolean;
  profile?: WireGuardProfile;
  error?: string;
} {
  const lines = rawText.split(/\r?\n/);
  let section: 'interface' | 'peer' | null = null;
  const iface: Record<string, string> = {};
  const peer: Record<string, string> = {};

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;
    const lower = line.toLowerCase();
    if (lower === '[interface]') {
      section = 'interface';
      continue;
    }
    if (lower === '[peer]') {
      section = 'peer';
      continue;
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1 || !section) continue;
    const key = line.slice(0, eqIdx).trim().toLowerCase();
    const val = line.slice(eqIdx + 1).trim();
    if (section === 'interface') {
      iface[key] = val;
    } else {
      peer[key] = val;
    }
  }

  const privateKey = iface['privatekey'] || '';
  const address = iface['address'] || '10.0.0.2/32';
  const dns = iface['dns'] || '1.1.1.1';
  const mtu = Number(iface['mtu']) || 1420;
  const peerPublicKey = peer['publickey'] || '';
  const presharedKey = peer['presharedkey'] || '';
  const allowedIps = peer['allowedips'] || '0.0.0.0/0, ::/0';
  const persistentKeepalive = Number(peer['persistentkeepalive']) || 25;
  const endpointRaw = peer['endpoint'] || '';

  if (!isValidWireGuardKey(privateKey)) {
    return { ok: false, error: 'Invalid or missing [Interface] PrivateKey (Base64 WireGuard key required).' };
  }
  if (!isValidWireGuardKey(peerPublicKey)) {
    return { ok: false, error: 'Invalid or missing [Peer] PublicKey (Base64 WireGuard key required).' };
  }

  const lastColon = endpointRaw.lastIndexOf(':');
  if (lastColon <= 0) {
    return { ok: false, error: 'Missing valid [Peer] Endpoint in format host:port.' };
  }
  const endpointHost = endpointRaw.slice(0, lastColon).replace(/^\[|\]$/g, '').trim();
  const endpointPort = Number(endpointRaw.slice(lastColon + 1).trim());

  if (!endpointHost || Number.isNaN(endpointPort) || endpointPort < 1 || endpointPort > 65535) {
    return { ok: false, error: 'Invalid Endpoint host or UDP port.' };
  }
  if (isBlockedDocIp(endpointHost)) {
    return { ok: false, error: 'RFC 5737 documentation IPs (192.0.2.x / 198.51.100.x / 203.0.113.x) cannot be used.' };
  }

  return {
    ok: true,
    profile: {
      privateKey,
      address,
      dns,
      mtu,
      peerPublicKey,
      presharedKey: presharedKey || undefined,
      endpointHost,
      endpointPort,
      allowedIps,
      persistentKeepalive,
    },
  };
}

export function buildWireGuardIni(profile: WireGuardProfile): string {
  const lines = [
    '[Interface]',
    `PrivateKey = ${profile.privateKey.trim()}`,
    `Address = ${profile.address.trim() || '10.0.0.2/32'}`,
    `DNS = ${profile.dns.trim() || '1.1.1.1'}`,
    `MTU = ${profile.mtu || 1420}`,
    '',
    '[Peer]',
    `PublicKey = ${profile.peerPublicKey.trim()}`,
  ];

  if (profile.presharedKey?.trim()) {
    lines.push(`PresharedKey = ${profile.presharedKey.trim()}`);
  }

  const host = profile.endpointHost.includes(':') && !profile.endpointHost.startsWith('[')
    ? `[${profile.endpointHost}]`
    : profile.endpointHost.trim();

  lines.push(`Endpoint = ${host}:${profile.endpointPort || 51820}`);
  lines.push(`AllowedIPs = ${profile.allowedIps.trim() || '0.0.0.0/0, ::/0'}`);
  if (profile.persistentKeepalive > 0) {
    lines.push(`PersistentKeepalive = ${profile.persistentKeepalive}`);
  }

  return lines.join('\n');
}

class RealWireGuardBridgeService {
  private status: ConnectionStatus = 'disconnected';
  private stats: LiveTunnelStats = {
    rxBytes: 0,
    txBytes: 0,
    rxSpeed: 0,
    txSpeed: 0,
    connectedSeconds: 0,
    latestHandshakeEpochMs: 0,
    tunnelName: 'myv_wg0',
    nativeAndroidActive: this.isNativeAndroid(),
    lastNotice: null,
  };

  private logListeners = new Set<LogListener>();
  private statusListeners = new Set<StatusListener>();
  private soundEnabled = true;
  private vibrateEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.__MYV_NATIVE_BRIDGE__ = {
        onNativeEvent: (eventType, payload) => {
          this.handleNativeEvent(eventType, payload);
        },
      };

      // Sync initial real state if Android APK is already running a tunnel
      this.syncInitialAndroidState();
    }
  }

  public isNativeAndroid(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean(window.AndroidVpn?.isNativeAndroid?.() || window.AndroidVpn?.startWireGuard)
    );
  }

  private syncInitialAndroidState() {
    try {
      const raw = window.AndroidVpn?.getStatusJson?.();
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.status) {
        this.status = parsed.status as ConnectionStatus;
      }
      this.stats = {
        ...this.stats,
        rxBytes: Number(parsed.rxBytes) || 0,
        txBytes: Number(parsed.txBytes) || 0,
        connectedSeconds: Number(parsed.connectedSeconds) || 0,
        tunnelName: parsed.tunnelName || 'myv_wg0',
        nativeAndroidActive: true,
      };
      this.notifyStatus();
    } catch {
      // Ignore if running in browser
    }
  }

  private handleNativeEvent(eventType: string, payload: Record<string, unknown>) {
    if (eventType === 'state') {
      const nextStatus = (payload.status as ConnectionStatus) || 'disconnected';
      const prevStatus = this.status;
      this.status = nextStatus;
      this.stats = {
        ...this.stats,
        tunnelName: (payload.tunnelName as string) || this.stats.tunnelName,
        connectedSeconds: Number(payload.connectedSeconds) || 0,
        nativeAndroidActive: true,
        lastNotice:
          nextStatus === 'connected'
            ? null
            : this.stats.lastNotice,
      };

      if (nextStatus === 'connected' && prevStatus !== 'connected') {
        if (this.soundEnabled) soundService.playConnect();
        if (this.vibrateEnabled) triggerHaptic([50, 80, 50]);
      } else if (nextStatus === 'disconnected' && prevStatus === 'connected') {
        if (this.soundEnabled) soundService.playDisconnect();
        if (this.vibrateEnabled) triggerHaptic(40);
      }

      this.notifyStatus();
    } else if (eventType === 'traffic') {
      this.stats = {
        ...this.stats,
        rxBytes: Number(payload.rxBytes) || 0,
        txBytes: Number(payload.txBytes) || 0,
        rxSpeed: Number(payload.rxSpeed) || 0,
        txSpeed: Number(payload.txSpeed) || 0,
        latestHandshakeEpochMs: Number(payload.latestHandshakeEpochMs) || 0,
        connectedSeconds: Number(payload.connectedSeconds) || this.stats.connectedSeconds,
        nativeAndroidActive: true,
      };
      this.notifyStatus();
    } else if (eventType === 'log') {
      const level = (payload.level as VpnLogEntry['level']) || 'info';
      const msg = String(payload.message || '');
      if (msg) {
        this.emitLog(level, msg);
      }
    } else if (eventType === 'tts_step') {
      const step = Number(payload.step);
      if (!Number.isNaN(step)) {
        soundService.handleNativeTtsStep(step);
      }
    } else if (eventType === 'tts_done') {
      soundService.handleNativeTtsStep(null);
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

  private notifyStatus() {
    this.statusListeners.forEach(listener => listener(this.status, { ...this.stats }));
  }

  public emitLog(level: VpnLogEntry['level'], message: string) {
    const entry: VpnLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      level,
      message,
    };
    this.logListeners.forEach(listener => listener(entry));
  }

  public clearNotice() {
    if (this.stats.lastNotice) {
      this.stats = { ...this.stats, lastNotice: null };
      this.notifyStatus();
    }
  }

  public setNotice(notice: BridgeNotice | null) {
    this.stats = { ...this.stats, lastNotice: notice };
    this.notifyStatus();
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getStats(): LiveTunnelStats {
    return { ...this.stats };
  }

  public generateKeyPair(): { privateKey: string; publicKey: string } | null {
    // 1. Inside Android APK: use native WireGuard crypto KeyPair
    if (window.AndroidVpn?.generateWireGuardKeyPair) {
      try {
        const parsed = JSON.parse(window.AndroidVpn.generateWireGuardKeyPair());
        if (parsed.privateKey && parsed.publicKey) {
          return parsed;
        }
      } catch {
        // Fallback below
      }
    }
    return null;
  }

  public async generateKeyPairAsync(): Promise<{ privateKey: string; publicKey: string } | null> {
    const nativeKeys = this.generateKeyPair();
    if (nativeKeys) return nativeKeys;

    // 2. Modern Browser fallback via WebCrypto X25519
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const kp = (await crypto.subtle.generateKey(
          { name: 'X25519' },
          true,
          ['deriveBits']
        )) as CryptoKeyPair;

        const [pkcs8, rawPub] = await Promise.all([
          crypto.subtle.exportKey('pkcs8', kp.privateKey),
          crypto.subtle.exportKey('raw', kp.publicKey),
        ]);

        const pkcs8Bytes = new Uint8Array(pkcs8);
        // X25519 PKCS#8 ends with the 32-byte raw scalar
        const rawPriv = pkcs8Bytes.slice(pkcs8Bytes.length - 32);
        const rawPubBytes = new Uint8Array(rawPub);

        const toBase64 = (bytes: Uint8Array) => {
          let bin = '';
          for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
          return btoa(bin);
        };

        return {
          privateKey: toBase64(rawPriv),
          publicKey: toBase64(rawPubBytes),
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  public async startWireGuard(
    profile: WireGuardProfile,
    serverLabel: string,
    opts: { sound: boolean; vibrate: boolean; simCarrierLabel?: string }
  ) {
    this.soundEnabled = opts.sound;
    this.vibrateEnabled = opts.vibrate;
    this.stats = { ...this.stats, lastNotice: null };

    if (!profile.endpointHost.trim() || isBlockedDocIp(profile.endpointHost)) {
      const msg =
        'Shyiramo Endpoint Host/IP nyayo ya WireGuard server (cyangwa ukande "+ Server" / "Import .CONF") mbere yo guhuza.';
      this.emitLog('error', `[WireGuard] ${msg}`);
      this.setNotice({
        level: 'error',
        title: 'Nta Server Endpoint irimo',
        message: msg,
        action: 'add_server',
      });
      return;
    }

    if (!isValidWireGuardKey(profile.peerPublicKey)) {
      const msg =
        'Injiza Server PublicKey nyayo ya WireGuard (inyuguti 44 za Base64) cyangwa ukore Import ya .conf.';
      this.emitLog('error', `[WireGuard] ${msg}`);
      this.setNotice({
        level: 'error',
        title: 'Server PublicKey irakenewe',
        message: msg,
        action: 'add_server',
      });
      return;
    }

    if (!isValidWireGuardKey(profile.privateKey)) {
      const msg =
        'Injiza Client PrivateKey ya WireGuard cyangwa ukande "Generate KeyPair" hasi muri WG KEYS.';
      this.emitLog('error', `[WireGuard] ${msg}`);
      this.setNotice({
        level: 'error',
        title: 'Client PrivateKey irabura',
        message: msg,
        action: 'gen_keys',
      });
      return;
    }

    const ini = buildWireGuardIni(profile);

    if (!this.isNativeAndroid() || !window.AndroidVpn?.startWireGuard) {
      // Browser environment: perform a real backend DNS/TCP endpoint probe so user sees immediate live verification
      this.status = 'connecting';
      this.notifyStatus();
      this.emitLog(
        'info',
        `[WireGuard Probe] Validating ${serverLabel} (${profile.endpointHost}:${profile.endpointPort}) via backend...`
      );

      try {
        const probe = await backendApi.probeServer(
          profile.endpointHost.trim(),
          profile.endpointPort || 51820
        );
        this.status = 'disconnected';
        if (probe.ok) {
          this.emitLog(
            'success',
            `[Endpoint Verified] ${probe.host} -> ${probe.resolvedIp} (DNS ${probe.dnsMs}ms${probe.tcpReachable ? `, TCP ${probe.tcpMs}ms` : ''}). Tunnel nyayo ikenera Android APK.`
          );
          this.setNotice({
            level: 'info',
            title: `Server Endpoint Iremejwe (${probe.resolvedIp})`,
            message:
              'Config ya WireGuard iri tayari! Kuko uri muri Browser, fungura iyi app muri Android APK (app-debug.apk) kugira ngo Android VpnService ikoreshe tun0 nyayo.',
            action: 'download_apk',
          });
        } else {
          const errText = probe.error || probe.note || 'Endpoint ntabwo yabonetse kuri DNS.';
          this.emitLog('warn', `[Endpoint Probe] ${errText}`);
          this.setNotice({
            level: 'warn',
            title: 'Endpoint ntishoboye kuboneka',
            message: `${errText}. Reba neza niba Endpoint (${profile.endpointHost}:${profile.endpointPort}) ari yo.`,
            action: 'add_server',
          });
        }
      } catch (err) {
        this.status = 'disconnected';
        const msg =
          err instanceof Error
            ? err.message
            : 'Uri muri Browser. Fungura muri Android APK kugira ngo WireGuard ikore.';
        this.emitLog('warn', `[Android VpnService] ${msg}`);
        this.setNotice({
          level: 'info',
          title: 'Android APK irakenewe kuri Tunnel',
          message:
            'Config ya WireGuard imeze neza! Koresha Android APK (app-debug.apk) kugira ngo WireGuard GoBackend itangire kuri telefoni.',
          action: 'download_apk',
        });
      }
      return;
    }

    this.status = 'connecting';
    this.notifyStatus();
    this.emitLog(
      'info',
      `[Android Bridge] Dispatching WireGuard config for ${serverLabel} (${profile.endpointHost}:${profile.endpointPort})...`
    );
    window.AndroidVpn.startWireGuard(ini, serverLabel);
  }

  public stopWireGuard(opts: { sound: boolean; vibrate: boolean }) {
    this.soundEnabled = opts.sound;
    this.vibrateEnabled = opts.vibrate;

    if (!this.isNativeAndroid() || !window.AndroidVpn?.stopWireGuard) {
      this.status = 'disconnected';
      this.notifyStatus();
      return;
    }

    this.status = 'disconnecting';
    this.notifyStatus();
    window.AndroidVpn.stopWireGuard();
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

export const vpnBridge = new RealWireGuardBridgeService();
