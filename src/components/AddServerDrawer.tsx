import React, { useState } from 'react';
import {
  X,
  Plus,
  Server,
  Trash2,
  Check,
  AlertCircle,
  CheckCircle2,
  FileText,
  Globe,
} from 'lucide-react';
import { VpnServer } from '../types/vpn';
import { isBlockedDocIp, isValidWireGuardKey, parseWireGuardConf } from '../services/vpnBridge';
import { backendApi } from '../services/api';

interface AddServerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  localServers: VpnServer[];
  selectedServerId: string;
  onSaveLocalServer: (server: VpnServer, clientPrivateKey?: string, address?: string) => void;
  onSelectServer: (server: VpnServer) => void;
  onDeleteLocalServer: (id: string) => void;
  onBackendServerAdded?: () => Promise<void>;
}

const FLAG_OPTIONS = ['🇷🇼', '🇩🇪', '🇺🇸', '🇬🇧', '🇳🇱', '🇫🇷', '🇸🇬', '🌐'];

export const AddServerDrawer: React.FC<AddServerDrawerProps> = ({
  isOpen,
  onClose,
  localServers,
  selectedServerId,
  onSaveLocalServer,
  onSelectServer,
  onDeleteLocalServer,
  onBackendServerAdded,
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Kigali / Custom VPS');
  const [flag, setFlag] = useState('🇷🇼');
  const [endpointHost, setEndpointHost] = useState('');
  const [endpointPort, setEndpointPort] = useState(51820);
  const [serverPublicKey, setServerPublicKey] = useState('');
  const [clientPrivateKey, setClientPrivateKey] = useState('');
  const [clientAddress, setClientAddress] = useState('10.0.0.2/32');
  const [dnsServers, setDnsServers] = useState('1.1.1.1, 8.8.8.8');
  const [confPaste, setConfPaste] = useState('');
  const [publishToBackend, setPublishToBackend] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const adminToken =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('myv_admin_token') || '' : '';

  const handleParseConf = (raw: string) => {
    setConfPaste(raw);
    if (!raw.trim()) return;
    const res = parseWireGuardConf(raw);
    if (res.ok && res.profile) {
      setEndpointHost(res.profile.endpointHost);
      setEndpointPort(res.profile.endpointPort);
      setServerPublicKey(res.profile.peerPublicKey);
      setClientPrivateKey(res.profile.privateKey);
      setClientAddress(res.profile.address);
      setDnsServers(res.profile.dns);
      if (!name.trim()) {
        setName(`WG ${res.profile.endpointHost}`);
      }
      setFeedback({ ok: true, text: 'Amakuru ya WireGuard .conf yasomwe neza!' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanName = name.trim();
    const cleanHost = endpointHost.trim();
    const cleanPubKey = serverPublicKey.trim();
    const cleanPrivKey = clientPrivateKey.trim();

    if (!cleanName) {
      setFeedback({ ok: false, text: 'Andika izina rya server (urugero: Kigali VPS 01).' });
      return;
    }
    if (!cleanHost) {
      setFeedback({ ok: false, text: 'Andika Endpoint Host cyangwa IP nyayo ya WireGuard server.' });
      return;
    }
    if (isBlockedDocIp(cleanHost)) {
      setFeedback({
        ok: false,
        text: 'IP za 192.0.2.x / 198.51.100.x / 203.0.113.x ni izo kwigereranyaho gusa. Shyiramo IP/Domain ya server yawe nyayo.',
      });
      return;
    }
    if (!isValidWireGuardKey(cleanPubKey)) {
      setFeedback({
        ok: false,
        text: 'Server PublicKey igomba kuba ari WireGuard Base64 key nyayo (inyuguti 44 irangirira kuri =).',
      });
      return;
    }
    if (cleanPrivKey && !isValidWireGuardKey(cleanPrivKey)) {
      setFeedback({
        ok: false,
        text: 'Client PrivateKey wanditse ntiyuzuye (gomba kuba ari WireGuard Base64 key).',
      });
      return;
    }

    setSaving(true);
    try {
      const newServer: VpnServer = {
        id: `custom-${Date.now().toString(36)}`,
        name: cleanName,
        location: location.trim() || cleanHost,
        countryCode: flag === '🇷🇼' ? 'RW' : 'WG',
        flag,
        endpointHost: cleanHost,
        endpointPort: Number(endpointPort) || 51820,
        serverPublicKey: cleanPubKey,
        dnsServers: dnsServers.trim() || '1.1.1.1, 8.8.8.8',
        allowedIps: '0.0.0.0/0, ::/0',
        mtu: 1420,
        requiresVip: false,
        createdAt: new Date().toISOString(),
      };

      onSaveLocalServer(
        newServer,
        cleanPrivKey || undefined,
        clientAddress.trim() || undefined
      );

      if (publishToBackend && adminToken) {
        await backendApi.adminAddServer(adminToken, {
          name: cleanName,
          location: newServer.location,
          countryCode: newServer.countryCode,
          flag,
          endpointHost: cleanHost,
          endpointPort: newServer.endpointPort,
          serverPublicKey: cleanPubKey,
          dnsServers: newServer.dnsServers,
          allowedIps: newServer.allowedIps,
          mtu: 1420,
          requiresVip: false,
        });
        await onBackendServerAdded?.();
      }

      setName('');
      setEndpointHost('');
      setServerPublicKey('');
      setClientPrivateKey('');
      setConfPaste('');
      setFeedback({
        ok: true,
        text: `Server [${cleanName}] yashyizweho neza kandi yahiswemo!`,
      });
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : 'Byanze kubika server.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Right Slide-Over Side Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-[340px] w-full bg-white dark:bg-[#050B1A] shadow-2xl border-l border-slate-200 dark:border-cyan-500/35 flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#050B1A] via-[#1D4ED8] to-[#06B6D4] text-white p-4 flex items-center justify-between border-b border-blue-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Server className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Ongeramo Server</h3>
              <p className="text-[10px] text-cyan-100">Side WireGuard Server Manager</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/15 cursor-pointer"
            aria-label="Close Add Server Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Quick .conf Auto-Fill */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-cyan-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-[#06B6D4] text-[11px]">
              <FileText className="w-3.5 h-3.5" />
              <span>Paste .conf (Auto-Fill Optional)</span>
            </div>
            <textarea
              rows={3}
              value={confPaste}
              onChange={e => handleParseConf(e.target.value)}
              placeholder="[Interface]&#10;PrivateKey = ...&#10;[Peer]&#10;PublicKey = ...&#10;Endpoint = host:51820"
              className="w-full p-2 text-[10px] font-mono bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Add Server Form */}
          <form onSubmit={handleSave} className="space-y-2.5">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Izina rya Server
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="urugero: Kigali VPS 01"
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Flag
                </label>
                <select
                  value={flag}
                  onChange={e => setFlag(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {FLAG_OPTIONS.map(f => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Endpoint Host / IP
                </label>
                <input
                  type="text"
                  value={endpointHost}
                  onChange={e => setEndpointHost(e.target.value)}
                  placeholder="vpn.yourdomain.com"
                  className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  UDP Port
                </label>
                <input
                  type="number"
                  value={endpointPort}
                  onChange={e => setEndpointPort(Number(e.target.value))}
                  min={1}
                  max={65535}
                  className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Rwanda / Europe / US"
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Server PublicKey (WireGuard Base64)
              </label>
              <input
                type="text"
                value={serverPublicKey}
                onChange={e => setServerPublicKey(e.target.value)}
                placeholder="44-character Base64 key ending in ="
                className="w-full p-2 text-[11px] font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Client PrivateKey (Optional)
              </label>
              <input
                type="password"
                value={clientPrivateKey}
                onChange={e => setClientPrivateKey(e.target.value)}
                placeholder="Shyiramo niba ugifite muri .conf"
                className="w-full p-2 text-[11px] font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {adminToken && (
              <label className="flex items-center gap-2 text-[11px] font-semibold text-amber-600 dark:text-amber-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={publishToBackend}
                  onChange={e => setPublishToBackend(e.target.checked)}
                  className="accent-amber-500 rounded"
                />
                <span>Publish also to Backend DB (all users)</span>
              </label>
            )}

            {feedback && (
              <div
                className={`p-2.5 rounded-xl text-[11px] flex items-start gap-2 border ${
                  feedback.ok
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                }`}
              >
                {feedback.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] hover:from-blue-600 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Bika Server (Add Server)'}</span>
            </button>
          </form>

          {/* Saved Custom Side Servers */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Saved Phone Servers ({localServers.length})</span>
              </span>
            </div>

            {localServers.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                Nta server yawe bwite urashyiramo kuri iyi telefoni.
              </p>
            ) : (
              <div className="space-y-1.5">
                {localServers.map(srv => {
                  const isActive = srv.id === selectedServerId;
                  return (
                    <div
                      key={srv.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-cyan-500/60'
                          : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectServer(srv);
                          onClose();
                        }}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <span>{srv.flag}</span>
                          <span className="truncate">{srv.name}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-cyan-300 truncate">
                          {srv.endpointHost}:{srv.endpointPort}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteLocalServer(srv.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 cursor-pointer shrink-0"
                        title="Delete server"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
