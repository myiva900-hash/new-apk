import React, { useState } from 'react';
import { X, Download, CheckCircle, AlertCircle, FileText, Key, ArrowRight } from 'lucide-react';
import { ExportableConfig } from '../types/vpn';
import { parseAndValidateConfig, getOrCreateDeviceId } from '../services/configManager';
import { parseWireGuardConf } from '../services/vpnBridge';

interface ImportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigImported: (config: ExportableConfig) => void;
}

export const ImportConfigModal: React.FC<ImportConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigImported,
}) => {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successConfig, setSuccessConfig] = useState<ExportableConfig | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setSuccessConfig(null);
    setNeedPassword(false);

    const reader = new FileReader();
    reader.onload = event => {
      const text = (event.target?.result as string) || '';
      setFileContent(text);
      attemptParse(text, '', file.name);
    };
    reader.readAsText(file);
  };

  const attemptParse = (rawText: string, pass: string, nameHint?: string) => {
    setErrorMsg(null);
    setSuccessConfig(null);
    const trimmed = rawText.trim();

    // 1. Standard WireGuard .conf / INI format
    if (/\[interface\]/i.test(trimmed) && /\[peer\]/i.test(trimmed)) {
      const wgResult = parseWireGuardConf(trimmed);
      if (!wgResult.ok || !wgResult.profile) {
        setErrorMsg(wgResult.error || 'Invalid WireGuard .conf file.');
        return;
      }

      const prof = wgResult.profile;
      const cleanTitle = (nameHint || fileName || `WG_${prof.endpointHost}`).replace(/\.conf$/i, '');

      setNeedPassword(false);
      setSuccessConfig({
        appName: 'Mutiganda Yvan VPN',
        version: '6.0.0',
        exportDate: new Date().toISOString(),
        configName: cleanTitle,
        note: `WireGuard Tunnel (${prof.endpointHost}:${prof.endpointPort})`,
        connectionMode: 'imported_config',
        serverHost: prof.endpointHost,
        serverPort: prof.endpointPort,
        customSetup: {
          wireguard: {
            ...prof,
            importedConfigName: cleanTitle,
          },
          importedConfigName: cleanTitle,
          importedConfigRaw: trimmed,
        },
        settings: {},
        locked: false,
        passwordProtected: false,
        hwidLocked: false,
      });
      return;
    }

    // 2. Encrypted .myv JSON envelope
    const userHwid = getOrCreateDeviceId();
    const result = parseAndValidateConfig(trimmed, pass, userHwid);

    if (result.success && result.config) {
      setSuccessConfig(result.config);
      setNeedPassword(false);
    } else if (result.error === 'PASSWORD_REQUIRED') {
      setNeedPassword(true);
      setErrorMsg('This configuration profile is encrypted with a password. Please enter it below.');
    } else {
      setErrorMsg(result.error || 'Failed to import configuration.');
    }
  };

  const handleApply = () => {
    if (successConfig) {
      onConfigImported(successConfig);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-white dark:bg-[#050B1A] rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-blue-500/35 animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-blue-500/25 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/30 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-[#06B6D4]" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Import WireGuard (.conf / .myv)
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
        <div className="p-4 overflow-y-auto space-y-3 text-xs">

          {/* File Picker */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select WireGuard .conf or .myv File
            </label>
            <label className="border-2 border-dashed border-slate-300 dark:border-blue-500/40 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all text-center">
              <FileText className="w-7 h-7 text-blue-600 dark:text-[#06B6D4] mb-1.5" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {fileName ? fileName : 'Kanda hano uhitemo .conf cyangwa .myv'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                Standard WireGuard INI (.conf) &amp; Mutiganda Yvan VPN (.myv)
              </span>
              <input
                type="file"
                accept=".conf,.myv,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Paste WireGuard Config directly */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Or Paste WireGuard .conf Text
            </label>
            <textarea
              rows={4}
              value={fileContent}
              onChange={e => {
                setFileContent(e.target.value);
                setFileName('Pasted_WireGuard.conf');
              }}
              placeholder={'[Interface]\nPrivateKey = ...\nAddress = 10.0.0.2/32\n\n[Peer]\nPublicKey = ...\nEndpoint = your-vps.example.com:51820\nAllowedIPs = 0.0.0.0/0'}
              className="w-full p-2.5 text-[11px] font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-blue-500/30 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]"
            />
            {fileContent.trim() && !successConfig && !needPassword && (
              <button
                type="button"
                onClick={() => attemptParse(fileContent, password, fileName || 'Pasted_WireGuard')}
                className="mt-1.5 w-full py-2 bg-[#1D4ED8] hover:bg-blue-600 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Validate WireGuard Profile
              </button>
            )}
          </div>

          {/* Password Prompt if required */}
          {needPassword && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                <Key className="w-4 h-4" />
                <span>Password Protected Configuration</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter decryption password"
                  className="flex-1 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => attemptParse(fileContent, password, fileName)}
                  className="px-3 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/40 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Validation Box */}
          {successConfig && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Valid WireGuard Configuration!</span>
              </div>
              <div className="pl-6 text-[11px] space-y-0.5 text-slate-700 dark:text-slate-300">
                <div><span className="font-semibold">Name:</span> {successConfig.configName}</div>
                <div><span className="font-semibold">Endpoint:</span> {successConfig.serverHost}:{successConfig.serverPort}</div>
                {successConfig.note && (
                  <div><span className="font-semibold">Note:</span> {successConfig.note}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-blue-500/25 flex items-center justify-end gap-2 bg-slate-50/60 dark:bg-slate-900/60 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!successConfig}
            className="px-5 py-2 text-xs font-bold bg-[#1D4ED8] hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Load Configuration</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
