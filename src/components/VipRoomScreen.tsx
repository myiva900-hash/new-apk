import React, { useState, useEffect } from 'react';
import {
  Crown,
  Gift,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Server,
  Smartphone,
  Plus,
  KeyRound,
  Lock,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import {
  AdminRedeemCodeRecord,
  PaymentRecord,
  VipAccountStatus,
  VpnServer,
} from '../types/vpn';
import { backendApi } from '../services/api';
import { vpnBridge } from '../services/vpnBridge';

interface VipRoomScreenProps {
  vipStatus: VipAccountStatus | null;
  servers: VpnServer[];
  selectedServer: VpnServer;
  onSelectServer: (server: VpnServer) => void;
  onOpenVipPayment: () => void;
  onSwitchToHome: () => void;
  onRefreshBackend: () => Promise<void>;
  onOpenCodeGenerator?: () => void;
}

export const VipRoomScreen: React.FC<VipRoomScreenProps> = ({
  vipStatus,
  servers,
  selectedServer,
  onSelectServer,
  onOpenVipPayment,
  onSwitchToHome,
  onRefreshBackend,
  onOpenCodeGenerator,
}) => {
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Backend Owner Admin State
  const [adminConfigured, setAdminConfigured] = useState<boolean>(true);
  const [adminSecretInput, setAdminSecretInput] = useState('');
  const [adminToken, setAdminToken] = useState<string>(() => sessionStorage.getItem('myv_admin_token') || '');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminPayments, setAdminPayments] = useState<PaymentRecord[]>([]);
  const [adminCodes, setAdminCodes] = useState<AdminRedeemCodeRecord[]>([]);
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Admin Generate Code form
  const [genHours, setGenHours] = useState(50);
  const [genRecipient, setGenRecipient] = useState('');

  // Admin Add Real WireGuard Server form
  const [srvName, setSrvName] = useState('');
  const [srvLocation, setSrvLocation] = useState('Kigali, Rwanda');
  const [srvHost, setSrvHost] = useState('');
  const [srvPort, setSrvPort] = useState(51820);
  const [srvPubKey, setSrvPubKey] = useState('');
  const [srvMsg, setSrvMsg] = useState<string | null>(null);

  useEffect(() => {
    backendApi.getAdminBootstrapStatus().then(r => setAdminConfigured(r.configured)).catch(() => {});
  }, []);

  useEffect(() => {
    if (adminToken) {
      loadAdminOverview(adminToken);
    }
  }, [adminToken]);

  const loadAdminOverview = async (token: string) => {
    try {
      const data = await backendApi.adminGetOverview(token);
      setAdminPayments(data.payments);
      setAdminCodes(data.codes);
      setAdminError(null);
    } catch {
      sessionStorage.removeItem('myv_admin_token');
      setAdminToken('');
    }
  };

  const handleRedeem = async () => {
    if (!redeemInput.trim()) return;
    setRedeemLoading(true);
    setRedeemFeedback(null);
    try {
      const res = await backendApi.redeemCode(redeemInput);
      setRedeemFeedback({ ok: true, text: res.message });
      setRedeemInput('');
      await onRefreshBackend();
    } catch (err) {
      setRedeemFeedback({
        ok: false,
        text: err instanceof Error ? err.message : 'Redeem yanze kuri backend.',
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleAdminAuth = async () => {
    setAdminError(null);
    try {
      const res = adminConfigured
        ? await backendApi.adminLogin(adminSecretInput)
        : await backendApi.bootstrapAdmin(adminSecretInput);
      sessionStorage.setItem('myv_admin_token', res.token);
      setAdminToken(res.token);
      setAdminConfigured(true);
      setAdminSecretInput('');
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const handleGenerateCode = async () => {
    if (!adminToken) return;
    try {
      const res = await backendApi.adminGenerateCode(adminToken, genHours, genRecipient);
      setLastGeneratedCode(res.code);
      setGenRecipient('');
      await loadAdminOverview(adminToken);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Failed to generate code');
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!adminToken) return;
    try {
      await backendApi.adminApprovePayment(adminToken, paymentId, 'MTN MoMo Verified');
      await loadAdminOverview(adminToken);
      await onRefreshBackend();
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!adminToken) return;
    try {
      await backendApi.adminRejectPayment(adminToken, paymentId, 'Transaction ID not found on MoMo');
      await loadAdminOverview(adminToken);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Failed to reject payment');
    }
  };

  const handleAddServer = async () => {
    if (!adminToken) return;
    setSrvMsg(null);
    try {
      await backendApi.adminAddServer(adminToken, {
        name: srvName,
        location: srvLocation,
        countryCode: 'RW',
        flag: '🛡️',
        endpointHost: srvHost,
        endpointPort: srvPort,
        serverPublicKey: srvPubKey,
        dnsServers: '1.1.1.1, 8.8.8.8',
        allowedIps: '0.0.0.0/0, ::/0',
        mtu: 1420,
        requiresVip: true,
      });
      setSrvName('');
      setSrvHost('');
      setSrvPubKey('');
      setSrvMsg('WireGuard server yemejwe kandi yabitswe kuri backend!');
      await onRefreshBackend();
      await loadAdminOverview(adminToken);
    } catch (err) {
      setSrvMsg(err instanceof Error ? err.message : 'Server yanze kwemezwa');
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!adminToken) return;
    await backendApi.adminDeleteServer(adminToken, id);
    await onRefreshBackend();
    await loadAdminOverview(adminToken);
  };

  const copyPlainCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Ignore
    }
  };

  const remainingSeconds = vipStatus?.remainingSeconds ?? 0;

  return (
    <div className="flex-1 w-full max-w-xl mx-auto p-3 sm:p-4 pb-20 flex flex-col gap-3 select-none">
      {/* VIP Room Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#050B1A]/80 via-blue-950/75 to-[#050B1A]/80 backdrop-blur-[2px] border border-amber-400/50 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-amber-300">
                VIP PREMIUM ROOM
              </h2>
              <p className="text-[11px] text-cyan-200 font-medium">
                Backend-Verified VIP · Single-Use Redeem · Real WireGuard Relays
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVipPayment}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all active:scale-95"
          >
            GURA VIP
          </button>
        </div>

        {/* Remaining VIP Time & Device ID */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/30">
            <div className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>BACKEND VIP BALANCE</span>
            </div>
            <div className="text-base sm:text-lg font-mono font-black tabular-nums text-emerald-400 mt-0.5">
              {vpnBridge.formatCountdown(remainingSeconds)}
            </div>
            <div className="text-[10px] text-slate-400">
              {vipStatus?.isVipActive ? 'Active on server' : 'Pay or Redeem Code'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-400/30">
            <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>DEVICE ID</span>
            </div>
            <div className="text-[11px] font-mono font-black text-white mt-1 truncate">
              {backendApi.getDeviceId()}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold">
              Server-Synced Account
            </div>
          </div>
        </div>

        {onOpenCodeGenerator && (
          <button
            type="button"
            onClick={onOpenCodeGenerator}
            className="mt-3 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-between shadow-md cursor-pointer transition-all active:scale-99"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              <span>Fungura Icyumba cya Redeem Generator</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Password
            </span>
          </button>
        )}
      </div>

      {/* BACKEND SINGLE-USE REDEEM CODE INPUT */}
      <div className="p-4 rounded-2xl bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] border border-slate-200 dark:border-cyan-500/35 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Redeem VIP Code (Backend Verified)
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Code ikoreshwa rimwe gusa kandi igenzurwa kuri server nyayo
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-500">1-TIME USE</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={redeemInput}
            onChange={e => setRedeemInput(e.target.value)}
            placeholder="MYV-50H-XXXX-XXXX"
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-blue-500/40 text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handleRedeem}
            disabled={redeemLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
          >
            {redeemLoading ? 'CHECKING...' : 'REDEEM'}
          </button>
        </div>

        {redeemFeedback && (
          <div
            className={`p-2.5 rounded-xl text-xs font-bold border ${
              redeemFeedback.ok
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'
            }`}
          >
            {redeemFeedback.text}
          </div>
        )}
      </div>

      {/* VERIFIED WIREGUARD SERVERS FROM BACKEND */}
      <div className="p-4 rounded-2xl bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] border border-slate-200 dark:border-blue-500/35 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              Registered WireGuard Servers
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Real Endpoints
          </span>
        </div>

        {servers.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
            Nta WireGuard server irandikwa na Admin kuri backend. Nyir&apos;app ashobora kuyishyiramo hasi mu gice cya Owner Admin cyangwa ukoreshe .conf yawe kuri Home.
          </p>
        ) : (
          <div className="space-y-1.5">
            {servers.map(srv => {
              const active = selectedServer.id === srv.id;
              return (
                <button
                  key={srv.id}
                  onClick={() => {
                    onSelectServer(srv);
                    onSwitchToHome();
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border-amber-400/60'
                      : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{srv.flag}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {srv.name}
                      </div>
                      <div className="text-[10px] font-mono text-amber-600 dark:text-amber-300 truncate">
                        {srv.endpointHost}:{srv.endpointPort}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-500 shrink-0 ml-2">
                    WireGuard
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* OWNER / ADMIN VERIFICATION CONSOLE */}
      <div className="p-4 rounded-2xl bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] border border-slate-200 dark:border-amber-500/35 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Owner Admin Console (Backend Security)
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Emeza abishyuye MoMo, kora Redeem Codes z&apos;ukuri, wandike WireGuard Servers
              </p>
            </div>
          </div>
          {adminToken && (
            <button
              onClick={() => {
                sessionStorage.removeItem('myv_admin_token');
                setAdminToken('');
              }}
              className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
            >
              Lock
            </button>
          )}
        </div>

        {!adminToken ? (
          <div className="space-y-2">
            <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                {adminConfigured
                  ? 'Injiza Admin Secret yawe kugira ngo ufungure ibikorwa bya backend.'
                  : 'Shyiraho Admin Secret bwa mbere (izafunga Setup imaze kubikwa).'}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={adminSecretInput}
                onChange={e => setAdminSecretInput(e.target.value)}
                placeholder={adminConfigured ? 'Enter Admin Secret' : 'Create Owner Admin Secret (min 6 chars)'}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                onClick={handleAdminAuth}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
              >
                {adminConfigured ? 'Unlock' : 'Set Secret'}
              </button>
            </div>
            {adminError && <p className="text-xs text-rose-400 font-bold">{adminError}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {adminError && <p className="text-xs text-rose-400 font-bold">{adminError}</p>}

            {/* 1. Generate Single-Use Redeem Code */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-amber-500/30 space-y-2 text-white">
              <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Generate Single-Use Redeem Code (Saved in Backend)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min={1}
                  max={8760}
                  value={genHours}
                  onChange={e => setGenHours(Number(e.target.value) || 50)}
                  className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                  placeholder="Hours"
                />
                <input
                  type="text"
                  value={genRecipient}
                  onChange={e => setGenRecipient(e.target.value)}
                  className="col-span-2 px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  placeholder="Izina ry'umukiriya (VIP)"
                />
              </div>
              <button
                onClick={handleGenerateCode}
                className="w-full py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generate +{genHours}h Backend Code</span>
              </button>

              {lastGeneratedCode && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-black text-emerald-300 truncate">
                    {lastGeneratedCode}
                  </div>
                  <button
                    onClick={() => copyPlainCode(lastGeneratedCode)}
                    className="px-2 py-1 rounded bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
                {adminCodes.map((c, idx) => (
                  <div key={`${c.codeHint}-${idx}`} className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                    <span>{c.codeHint} · {c.assignedTo} (+{c.hours}h)</span>
                    <span className={c.redeemed ? 'text-slate-500' : 'text-emerald-400 font-bold'}>
                      {c.redeemed ? 'USED' : 'READY'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Pending / Submitted MTN MoMo Payments */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-emerald-500/30 space-y-2 text-white">
              <div className="text-xs font-black text-emerald-300">
                MTN MoMo Payment Verification Queue ({adminPayments.length})
              </div>
              {adminPayments.length === 0 ? (
                <p className="text-[11px] text-slate-400">Nta bwishyu buriyandikisha.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {adminPayments.map(p => (
                    <div key={p.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">{p.planTitle} ({p.amountFrw} FRW)</span>
                        <span className={`text-[10px] font-black ${
                          p.status === 'VERIFIED' ? 'text-emerald-400' : p.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-300">
                        Phone: {p.payerPhone} · MoMo TX: {p.momoTxId}
                      </div>
                      {p.status === 'PENDING' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleApprovePayment(p.id)}
                            className="flex-1 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify &amp; Credit VIP</span>
                          </button>
                          <button
                            onClick={() => handleRejectPayment(p.id)}
                            className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Register Real WireGuard Server Endpoint */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-cyan-500/30 space-y-2 text-white">
              <div className="text-xs font-black text-cyan-300">
                Add Verified WireGuard Server Endpoint
              </div>
              <input
                type="text"
                value={srvName}
                onChange={e => setSrvName(e.target.value)}
                placeholder="Server Name (e.g. Kigali WireGuard VPS 01)"
                className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={srvHost}
                  onChange={e => setSrvHost(e.target.value)}
                  placeholder="Real IP or Domain"
                  className="col-span-2 px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                />
                <input
                  type="number"
                  value={srvPort}
                  onChange={e => setSrvPort(Number(e.target.value) || 51820)}
                  placeholder="51820"
                  className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                />
              </div>
              <input
                type="text"
                value={srvPubKey}
                onChange={e => setSrvPubKey(e.target.value)}
                placeholder="Server WireGuard Base64 PublicKey (44 chars)"
                className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
              />
              <button
                onClick={handleAddServer}
                className="w-full py-2 rounded-lg bg-[#1D4ED8] hover:bg-blue-600 text-white font-black text-xs cursor-pointer"
              >
                Register WireGuard Endpoint
              </button>
              {srvMsg && <p className="text-[11px] text-cyan-300 font-semibold">{srvMsg}</p>}

              {servers.length > 0 && (
                <div className="space-y-1 pt-1">
                  {servers.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1.5 rounded-lg">
                      <span className="truncate">{s.name} ({s.endpointHost}:{s.endpointPort})</span>
                      <button
                        onClick={() => handleDeleteServer(s.id)}
                        className="text-rose-400 hover:text-rose-300 cursor-pointer ml-2"
                        title="Delete server"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
