import React, { useState } from 'react';
import { X, Server, RefreshCw, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VpnServer } from '../types/vpn';
import { backendApi } from '../services/api';

interface ServerAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: VpnServer[];
}

interface ProbeState {
  loading?: boolean;
  ok?: boolean;
  resolvedIp?: string;
  dnsMs?: number;
  tcpMs?: number;
  note?: string;
  error?: string;
}

export const ServerAppsModal: React.FC<ServerAppsModalProps> = ({ isOpen, onClose, servers }) => {
  const [customHost, setCustomHost] = useState('');
  const [customPort, setCustomPort] = useState(51820);
  const [probeResults, setProbeResults] = useState<Record<string, ProbeState>>({});
  const [customResult, setCustomResult] = useState<ProbeState | null>(null);

  if (!isOpen) return null;

  const probeEndpoint = async (key: string, host: string, port: number) => {
    setProbeResults(prev => ({ ...prev, [key]: { loading: true } }));
    try {
      const res = await backendApi.probeServer(host, port);
      setProbeResults(prev => ({
        ...prev,
        [key]: {
          loading: false,
          ok: res.ok,
          resolvedIp: res.resolvedIp,
          dnsMs: res.dnsMs,
          tcpMs: res.tcpMs,
          note: res.note,
        },
      }));
    } catch (err) {
      setProbeResults(prev => ({
        ...prev,
        [key]: {
          loading: false,
          ok: false,
          error: err instanceof Error ? err.message : 'Probe failed',
        },
      }));
    }
  };

  const probeCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHost.trim()) return;
    setCustomResult({ loading: true });
    try {
      const res = await backendApi.probeServer(customHost.trim(), customPort);
      setCustomResult({
        loading: false,
        ok: res.ok,
        resolvedIp: res.resolvedIp,
        dnsMs: res.dnsMs,
        tcpMs: res.tcpMs,
        note: res.note,
      });
    } catch (err) {
      setCustomResult({
        loading: false,
        ok: false,
        error: err instanceof Error ? err.message : 'Probe failed',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-white dark:bg-[#050B1A] rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-blue-500/40 animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-blue-500/25 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/30 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#06B6D4]" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Real Endpoint &amp; DNS Diagnostics
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Custom Endpoint Prober */}
          <form onSubmit={probeCustom} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/75 border border-slate-200 dark:border-cyan-500/30 space-y-2">
            <div className="font-bold text-slate-800 dark:text-cyan-300">
              Test Your WireGuard Server Endpoint
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customHost}
                onChange={e => setCustomHost(e.target.value)}
                placeholder="Host or real VPS IP"
                className="flex-1 px-2.5 py-2 rounded-lg bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
              />
              <input
                type="number"
                value={customPort}
                onChange={e => setCustomPort(Number(e.target.value) || 51820)}
                className="w-20 px-2 py-2 rounded-lg bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={customResult?.loading}
              className="w-full py-2 rounded-lg bg-[#1D4ED8] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${customResult?.loading ? 'animate-spin' : ''}`} />
              <span>Run Real DNS / Reachability Check</span>
            </button>

            {customResult && !customResult.loading && (
              <div className={`p-2 rounded-lg text-[11px] font-mono ${
                customResult.ok
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
              }`}>
                {customResult.ok ? (
                  <div>
                    Resolved: {customResult.resolvedIp} (DNS {customResult.dnsMs}ms) · {customResult.note}
                  </div>
                ) : (
                  <div>Error: {customResult.error}</div>
                )}
              </div>
            )}
          </form>

          {/* Registered Backend Servers */}
          <div>
            <span className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              Backend Registered WireGuard Servers ({servers.length})
            </span>

            {servers.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>No WireGuard servers registered on backend yet.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                {servers.map(srv => {
                  const st = probeResults[srv.id];
                  return (
                    <div key={srv.id} className="p-3 bg-white dark:bg-slate-900/80 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-white truncate">
                          {srv.flag} {srv.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          {srv.endpointHost}:{srv.endpointPort}
                        </div>
                        {st && !st.loading && (
                          <div className={`text-[10px] font-mono mt-0.5 ${st.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {st.ok ? `IP ${st.resolvedIp} · DNS ${st.dnsMs}ms` : st.error}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => probeEndpoint(srv.id, srv.endpointHost, srv.endpointPort)}
                        disabled={st?.loading}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {st?.loading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : st?.ok ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : null}
                        <span>Probe</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/25 text-[11px] text-slate-500 dark:text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#06B6D4] shrink-0" />
            <span>WireGuard uses UDP sockets; DNS resolution verifies real endpoint hostnames without invented test IPs.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/60 dark:bg-[#050B1A] rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-[#1D4ED8] hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            Funga (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
