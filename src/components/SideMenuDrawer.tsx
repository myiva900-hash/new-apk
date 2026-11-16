import React from 'react';
import {
  Code2,
  Fingerprint,
  Upload,
  Download,
  Settings,
  LayoutGrid,
  Info,
  X,
  MessageCircle,
  RefreshCw,
  Crown,
  Gift
} from 'lucide-react';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (
    option:
      | 'payload_gen'
      | 'identification'
      | 'export_config'
      | 'import_config'
      | 'settings'
      | 'server_apps'
      | 'online_update'
      | 'about'
      | 'apk_download'
      | 'vip_payment'
      | 'vip_room'
  ) => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectOption,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer content */}
      <div className="absolute inset-y-0 left-0 max-w-[290px] w-full bg-white dark:bg-[#050B1A] shadow-2xl border-r border-slate-200 dark:border-blue-500/30 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        <div className="overflow-y-auto">
          {/* Top Header */}
          <div className="bg-gradient-to-br from-[#050B1A] via-blue-950 to-[#1D4ED8] text-white p-5 pt-7 relative shadow-md border-b border-blue-500/30">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/photo_6015008377458593951_y_2837711e.jpg"
                alt="Mutiganda Yvan"
                className="w-13 h-13 rounded-full object-cover object-top border-2 border-[#FBBF24] shadow-md shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-base font-extrabold tracking-tight leading-tight text-white truncate">
                  Mutiganda Yvan
                </h2>
                <p className="text-[11px] font-semibold text-cyan-200 mt-0.5">
                  Mutiganda Yvan VPN v6
                </p>
                <div className="mt-1 text-[10px] text-[#10B981] font-bold">
                  All Country · All SIM Cards
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items List */}
          <nav className="py-2 divide-y divide-slate-100 dark:divide-slate-800/80">
            <div className="p-2 space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onSelectOption('vip_payment');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-black bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-slate-950 shadow-sm hover:from-amber-400 hover:to-yellow-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-slate-950" />
                  <span>KWISHYURA VIP</span>
                </div>
                <span className="text-[10px] font-black">2,000 FRW</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onSelectOption('vip_room');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-left text-xs sm:text-sm font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#10B981] border border-emerald-200 dark:border-emerald-500/40 hover:bg-emerald-100/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  <span>VIP Room &amp; +50h Code</span>
                </div>
                <span className="text-[10px] font-black">124H</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onSelectOption('apk_download');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-left text-xs sm:text-sm font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-[#06B6D4] border border-blue-200 dark:border-blue-500/40 hover:bg-blue-100/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Kuramo APK ya Phone</span>
                </div>
                <span className="text-[10px] font-black">APK</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onClose();
                  onSelectOption('import_config');
                }}
                className="w-full flex items-center gap-4 px-5 py-3 text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-5 h-5 text-[#06B6D4]" />
                <span>Import Config (.myv)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onSelectOption('export_config');
                }}
                className="w-full flex items-center gap-4 px-5 py-3 text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Upload className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span>Export Config (.myv)</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onClose();
                  onSelectOption('payload_gen');
                }}
                className="w-full flex items-center gap-4 px-5 py-3 text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Code2 className="w-5 h-5 text-blue-500" />
                <span>Payload Generator</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onSelectOption('identification');
                }}
                className="w-full flex items-center gap-4 px-5 py-3 text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Fingerprint className="w-5 h-5 text-blue-500" />
                <span>Identification (HWID)</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onClose();
                  onSelectOption('settings');
                }}
                className="w-full flex items-center gap-4 px-5 py-3 text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onSelectOption('server_apps');
                }}
                className="w-full flex items-center gap-4 px-5 py-3 text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LayoutGrid className="w-5 h-5 text-blue-500" />
                <span>WireGuard Endpoint Probe</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onClose();
                  onSelectOption('online_update');
                }}
                className="w-full flex items-center justify-between px-5 py-3 text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <RefreshCw className="w-5 h-5 text-[#10B981]" />
                  <span>App Update (New Version)</span>
                </div>
                <span className="text-[10px] font-bold text-[#10B981]">v6</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onSelectOption('about');
                }}
                className="w-full flex items-center gap-4 px-5 py-3 text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Info className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span>About Mutiganda Yvan</span>
              </button>
            </div>
          </nav>
        </div>

        {/* WhatsApp Bottom CTA */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
          <a
            href="https://wa.me/250787699523"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-[#10B981] hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950" />
            <span>WhatsApp: 0787699523</span>
          </a>

          <div className="text-[10px] text-slate-500 text-center">
            Mutiganda Yvan VPN · Rwanda 🇷🇼 © 2026
          </div>
        </div>
      </div>
    </div>
  );
};
