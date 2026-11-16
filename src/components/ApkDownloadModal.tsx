import React from 'react';
import { X, Download, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { MyvLogo } from './MyvLogo';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const directApkUrl = 'https://github.com/myiva900-hash/Mutiganda-Yvan-vpn-/releases/latest/download/app-debug.apk';
  const releasesPageUrl = 'https://github.com/myiva900-hash/Mutiganda-Yvan-vpn-/releases';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#050B1A] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-blue-500/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#050B1A] via-[#1D4ED8] to-[#050B1A] text-white p-5 flex items-start justify-between border-b border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-white/15 backdrop-blur-xs shadow-md shrink-0">
              <MyvLogo size={32} monochrome={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold tracking-tight">Kura APK Nshya ya MYV Hano</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FBBF24] text-slate-950 font-black">v6.0</span>
              </div>
              <p className="text-xs text-cyan-200 mt-0.5">Mutiganda Yvan VPN v6 · Official Edition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Funga"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Success Banner */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/60 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-[#10B981] shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <span className="font-bold">APK v6 irateguye neza 100%!</span> Ifite 124h Countdown, +50h Redeem Codes, VIP Room, No-VPS Servers, na Hacking Matrix Background.
            </div>
          </div>

          {/* Action Button 1: Download directly */}
          <a
            href={directApkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] hover:from-blue-600 hover:to-cyan-500 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>KANDA HANO UKUREMO APK (v6)</span>
          </a>

          {/* Action Button 2: Open GitHub Releases */}
          <a
            href={releasesPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-cyan-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-300 dark:border-blue-500/30"
          >
            <ExternalLink className="w-4 h-4 text-[#06B6D4]" />
            <span>Reba Releases kuri GitHub (Mutiganda-Yvan-vpn-)</span>
          </a>

          {/* Step by Step Guide in Kinyarwanda */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5">
              Amabwiriza y'uko ushyira APK muri Phone:
            </h4>
            
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Fungura Releases:</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Kanda kuri <strong>Releases</strong> kuri GitHub repository <span className="font-mono font-semibold text-[#06B6D4]">Mutiganda-Yvan-vpn-</span>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Kuramo app-debug.apk:</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Munsi ya Assets kanda kuri <span className="font-mono font-bold text-[#10B981]">app-debug.apk</span>. Phone izahita iyikuramo (download).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Shyira muri Phone (Install):</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Kanda <strong>Install</strong>, phone niba igusabye "Allow from this source", wemere kugira ngo app yinjire neza!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FBBF24]" />
            <div>
              <strong>Icyitonderwa:</strong> Mutiganda Yvan VPN v6 ikora kuri SIM card zose kandi ntigombera VPS yihariye.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#050B1A] border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Ndabyumvise (Funga)
          </button>
        </div>

      </div>
    </div>
  );
};
