import React, { useState } from 'react';
import { X, Upload, Download, FileCode } from 'lucide-react';
import { ConnectionMode, CustomSetupConfig, ExportableConfig, VpnServer } from '../types/vpn';
import { exportConfigToFile, getOrCreateDeviceId } from '../services/configManager';
import { buildWireGuardIni } from '../services/vpnBridge';

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: VpnServer;
  port: number;
  connectionMode: ConnectionMode;
  customSetup: CustomSetupConfig;
}

export const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  isOpen,
  onClose,
  server,
  port,
  connectionMode,
  customSetup,
}) => {
  const [configName, setConfigName] = useState('MYV_WireGuard_Profile');
  const [note, setNote] = useState('Mutiganda Yvan VPN v6 · Real WireGuard Profile');
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [password, setPassword] = useState('');
  const [hwidLock, setHwidLock] = useState(false);
  const [targetHwid, setTargetHwid] = useState(() => getOrCreateDeviceId());
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);

  if (!isOpen) return null;

  const effectiveHost =
    connectionMode === 'wireguard_server' && server.endpointHost
      ? server.endpointHost
      : customSetup.wireguard.endpointHost;

  const effectivePort =
    connectionMode === 'wireguard_server' && server.endpointPort
      ? port || server.endpointPort
      : customSetup.wireguard.endpointPort || port;

  const effectivePublicKey =
    connectionMode === 'wireguard_server' && server.serverPublicKey
      ? server.serverPublicKey
      : customSetup.wireguard.peerPublicKey;

  const mergedSetup: CustomSetupConfig = {
    ...customSetup,
    wireguard: {
      ...customSetup.wireguard,
      endpointHost: effectiveHost,
      endpointPort: effectivePort,
      peerPublicKey: effectivePublicKey,
      dns: server.dnsServers || customSetup.wireguard.dns,
      allowedIps: server.allowedIps || customSetup.wireguard.allowedIps,
      mtu: server.mtu || customSetup.wireguard.mtu,
    },
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMyv = () => {
    let expiryDateStr: string | undefined = undefined;
    if (enableExpiry) {
      const d = new Date();
      d.setDate(d.getDate() + expiryDays);
      expiryDateStr = d.toISOString();
    }

    const exportData: ExportableConfig = {
      appName: 'Mutiganda Yvan VPN',
      version: '6.0.0',
      exportDate: new Date().toISOString(),
      configName: configName.trim() || 'MYV_WireGuard_Profile',
      note: note.trim(),
      connectionMode,
      serverHost: effectiveHost || 'unconfigured',
      serverPort: effectivePort || 51820,
      customSetup: mergedSetup,
      settings: {
        connectionRetry: true,
        forwardDns: false,
        customDns: false,
      },
      locked: true,
      passwordProtected: passwordProtect && Boolean(password.trim()),
      hwidLocked: hwidLock,
      targetHwid: hwidLock ? targetHwid.trim() : undefined,
      expiryDate: expiryDateStr,
    };

    const fileContent = exportConfigToFile(exportData, passwordProtect ? password.trim() : undefined);
    triggerDownload(
      fileContent,
      `${configName.replace(/[^a-zA-Z0-9_-]/g, '_')}.myv`,
      'application/json'
    );
    onClose();
  };

  const handleExportConf = () => {
    const ini = buildWireGuardIni(mergedSetup.wireguard);
    triggerDownload(
      ini,
      `${configName.replace(/[^a-zA-Z0-9_-]/g, '_')}.conf`,
      'text/plain'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-white dark:bg-[#050B1A] rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-blue-500/35 animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-blue-500/25 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/30 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600 dark:text-[#06B6D4]" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Export Config (.myv / .conf)
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
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Configuration File Name
            </label>
            <input
              type="text"
              value={configName}
              onChange={e => setConfigName(e.target.value)}
              placeholder="e.g. MYV_VIP_WireGuard"
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes for Users
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Notes or instructions..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Security & Locking Options */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="block font-bold text-blue-600 dark:text-[#06B6D4] tracking-wide text-[11px] uppercase">
              Security &amp; Protection (.myv)
            </span>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passwordProtect}
                  onChange={e => setPasswordProtect(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Password Protect Config
                </span>
              </label>
              {passwordProtect && (
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter decrypt password"
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hwidLock}
                  onChange={e => setHwidLock(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Lock to Hardware ID (HWID)
                </span>
              </label>
              {hwidLock && (
                <input
                  type="text"
                  value={targetHwid}
                  onChange={e => setTargetHwid(e.target.value)}
                  placeholder="Target HWID (e.g. MYV-AND-...)"
                  className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableExpiry}
                  onChange={e => setEnableExpiry(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Set Expiration Date
                </span>
              </label>
              {enableExpiry && (
                <div className="flex items-center gap-2">
                  <select
                    value={expiryDays}
                    onChange={e => setExpiryDays(Number(e.target.value))}
                    className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                  <span className="text-slate-500 text-[11px]">
                    Valid for {expiryDays} days from export
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-blue-500/25 flex flex-wrap items-center justify-end gap-2 bg-slate-50/60 dark:bg-slate-900/60 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExportConf}
            className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export .CONF</span>
          </button>
          <button
            onClick={handleExportMyv}
            className="px-4 py-2 text-xs font-bold bg-[#1D4ED8] hover:bg-blue-600 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .MYV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
