import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, CloudLightning, Globe, Download } from 'lucide-react';
import { MyvLogo } from './MyvLogo';

interface OnlineUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyUpdate?: (version: string) => void;
}

export const OnlineUpdateModal: React.FC<OnlineUpdateModalProps> = ({
  isOpen,
  onClose,
  onApplyUpdate,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [appliedVersion, setAppliedVersion] = useState('v6.0.0 VIP Pro');
  const [lastCheckTime, setLastCheckTime] = useState('Ubu ako kanya (Just now)');

  if (!isOpen) return null;

  const onlineAppUrl = 'https://ais-pre-cmw46z3ccjwjrwsdznksfu-385114119254.us-east1.run.app';

  const handleCheckUpdate = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setUpdateAvailable(true);
      setLastCheckTime(new Date().toLocaleTimeString('en-GB'));
    }, 1000);
  };

  const handleInstallNewVersion = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setUpdateAvailable(false);
      setAppliedVersion('v6.2.0 VIP Cloud Build');
      setLastCheckTime(new Date().toLocaleTimeString('en-GB'));
      onApplyUpdate?.('v6.2.0 VIP Cloud Build');
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#050B1A] rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-blue-500/35 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#050B1A] via-blue-900 to-[#1D4ED8] text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-white/15 backdrop-blur-xs shadow-md shrink-0">
              <MyvLogo size={32} monochrome={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold tracking-tight">Kugenzura Update (New Version)</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">LIVE</span>
              </div>
              <p className="text-xs text-cyan-200 mt-0.5">Mutiganda Yvan VPN · Cloud Auto-Update</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Funga"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status Box */}
          <div className={`p-4 border rounded-2xl flex items-start gap-3 ${
            updateAvailable
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/40'
          }`}>
            <CheckCircle2 className={`w-6 h-6 shrink-0 mt-0.5 ${
              updateAvailable ? 'text-amber-500' : 'text-emerald-500'
            }`} />
            <div className="text-xs space-y-1">
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                {updateAvailable
                  ? 'New Version Irahari: v6.2.0 VIP Cloud!'
                  : `Version yawe igezweho: ${appliedVersion}`}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                {updateAvailable
                  ? 'Harimo amaserver mashya adasaba VPS, Anti-Hacking Shield, na +50h Redeem Boost!'
                  : 'Amaserver yose ya Gisozi VIP 01, Rwamagana 02, Kayonza 03, na Cloudflare Edge ari Online.'}
              </p>
              <div className="text-[10px] text-cyan-600 dark:text-cyan-300 font-bold pt-1">
                Active Build: <strong>{appliedVersion}</strong> · Checked: {lastCheckTime}
              </div>
            </div>
          </div>

          {updateAvailable ? (
            <button
              onClick={handleInstallNewVersion}
              disabled={isChecking}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{isChecking ? 'Installing New Version...' : 'UPDATE NOW TO NEW VERSION (v6.2.0)'}</span>
            </button>
          ) : (
            <button
              onClick={handleCheckUpdate}
              disabled={isChecking}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking for New Version...' : 'CHECK FOR NEW VERSION'}</span>
            </button>
          )}

          <a
            href={onlineAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>FUNGURA LIVE CLOUD VERSION 🚀</span>
          </a>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-bold text-slate-800 dark:text-amber-300 flex items-center gap-1.5">
              <CloudLightning className="w-4 h-4 text-amber-500" />
              <span>Auto-Update Cloud Sync:</span>
            </div>
            <p>
              App igira update ako kanya kuri Cloud igihe cyose hasohotse New Version cyangwa amaserver mashya adasaba VPS.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Funga (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
