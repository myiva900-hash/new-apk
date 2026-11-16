import {
  AdminRedeemCodeRecord,
  PaymentRecord,
  VipAccountStatus,
  VpnServer,
} from '../types/vpn';
import { getOrCreateDeviceId } from './configManager';

const FALLBACK_CLOUD_ORIGIN = 'https://ais-pre-cmw46z3ccjwjrwsdznksfu-385114119254.us-east1.run.app';

function getApiBase(): string {
  if (typeof window === 'undefined') return '';
  if (window.location.protocol === 'file:') {
    return FALLBACK_CLOUD_ORIGIN;
  }
  return '';
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const deviceId = getOrCreateDeviceId();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('X-Device-Id', deviceId);

  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const backendApi = {
  getDeviceId: () => getOrCreateDeviceId(),

  async getVipStatus(): Promise<VipAccountStatus> {
    const deviceId = getOrCreateDeviceId();
    return apiFetch<VipAccountStatus>(`/api/vip/status?deviceId=${encodeURIComponent(deviceId)}`);
  },

  async getServers(): Promise<VpnServer[]> {
    const data = await apiFetch<{ servers: VpnServer[] }>('/api/servers');
    return data.servers;
  },

  async probeServer(host: string, port: number): Promise<{
    ok: boolean;
    host: string;
    resolvedIp?: string;
    dnsMs?: number;
    tcpReachable?: boolean;
    tcpMs?: number;
    note?: string;
    error?: string;
  }> {
    return apiFetch('/api/servers/probe', {
      method: 'POST',
      body: JSON.stringify({ host, port }),
    });
  },

  async redeemCode(code: string): Promise<{
    ok: boolean;
    addedHours: number;
    vipExpiresAt: number;
    remainingSeconds: number;
    message: string;
  }> {
    return apiFetch('/api/redeem', {
      method: 'POST',
      body: JSON.stringify({
        deviceId: getOrCreateDeviceId(),
        code,
      }),
    });
  },

  async submitPayment(params: {
    planId: '1week' | '2months' | '3years';
    payerPhone: string;
    momoTxId: string;
  }): Promise<{ ok: boolean; payment: PaymentRecord }> {
    return apiFetch('/api/payments/submit', {
      method: 'POST',
      body: JSON.stringify({
        deviceId: getOrCreateDeviceId(),
        ...params,
      }),
    });
  },

  async getMyPayments(): Promise<PaymentRecord[]> {
    const deviceId = getOrCreateDeviceId();
    const data = await apiFetch<{ payments: PaymentRecord[] }>(
      `/api/payments/my?deviceId=${encodeURIComponent(deviceId)}`
    );
    return data.payments;
  },

  // Admin APIs
  async getAdminBootstrapStatus(): Promise<{ configured: boolean }> {
    return apiFetch('/api/admin/bootstrap-status');
  },

  async bootstrapAdmin(secret: string): Promise<{ ok: boolean; token: string }> {
    return apiFetch('/api/admin/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ secret }),
    });
  },

  async adminLogin(secret: string): Promise<{ ok: boolean; token: string }> {
    return apiFetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ secret }),
    });
  },

  async adminGetOverview(token: string): Promise<{
    payments: PaymentRecord[];
    codes: AdminRedeemCodeRecord[];
    servers: VpnServer[];
  }> {
    return apiFetch('/api/admin/overview', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async adminApprovePayment(token: string, paymentId: string, note?: string) {
    return apiFetch(`/api/admin/payments/${encodeURIComponent(paymentId)}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ note }),
    });
  },

  async adminRejectPayment(token: string, paymentId: string, note?: string) {
    return apiFetch(`/api/admin/payments/${encodeURIComponent(paymentId)}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ note }),
    });
  },

  async adminGenerateCode(
    token: string,
    hours: number,
    assignedTo: string
  ): Promise<{
    ok: boolean;
    code: string;
    codeHint: string;
    hours: number;
    assignedTo: string;
    createdAt: string;
  }> {
    return apiFetch('/api/admin/codes/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ hours, assignedTo }),
    });
  },

  async adminAddServer(
    token: string,
    server: {
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
    }
  ): Promise<{ ok: boolean; id: string }> {
    return apiFetch('/api/admin/servers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(server),
    });
  },

  async adminDeleteServer(token: string, id: string) {
    return apiFetch(`/api/admin/servers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
