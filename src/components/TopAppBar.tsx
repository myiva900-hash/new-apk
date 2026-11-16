import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Settings,
  MoreVertical,
  Server,
  Wrench,
  Upload,
  Download,
  Trash2,
  Info,
  ArrowLeft,
  RefreshCw,
  Crown,
  Gift
} from 'lucide-react';
import { MyvLogo } from './MyvLogo';

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenDrawer: () => void;
  onOpenSettings: () => void;
  onOpenPayloadGen: () => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenServerApps: () => void;
  onOpenAbout: () => void;
  onClearLogs: () => void;
  onOpenUpdate?: () => void;
  onOpenVipPayment?: () => void;
  onOpenVipRoom?: () => void;
  accentColor?: 'blue' | 'red' | 'green' | 'yellow' | 'black';
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title = 'Mutiganda Yvan VPN',
  showBack = false,
  onBack,
  onOpenDrawer,
  onOpenSettings,
  onOpenPayloadGen,
  onOpenExport,
  onOpenImport,
  onOpenServerApps,
  onOpenAbout,
  onClearLogs,
  onOpenUpdate,
  onOpenVipPayment,
  onOpenVipRoom,
  accentColor = 'blue',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  const getHeaderGradient = () => {
    switch (accentColor) {
      case 'red':
        return 'from-[#050B1A] via-rose-900 to-red-800 border-rose-500/30';
      case 'green':
        return 'from-[#050B1A] via-emerald-900 to-teal-800 border-emerald-500/30';
      case 'yellow':
        return 'from-[#050B1A] via-amber-800 to-yellow-700 border-amber-500/30';
      case 'black':
        return 'from-[#050B1A] via-slate-950 to-black border-slate-700/40';
      case 'blue':
      default:
        return 'from-[#050B1A] via-blue-950 to-[#1D4ED8] border-blue-500/30';
    }
  };

  return (
    <header className={`sticky top-0 z-30 bg-gradient-to-r ${getHeaderGradient()} text-white shadow-md border-b select-none transition-colors`}>
      <div className="flex items-center justify-between h-14 px-2 sm:px-3">
        
        {/* Left Action: Drawer / Back + Logo + Title + v6 Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {showBack ? (
            <button
              onClick={onBack}
              className="p-2 -ml-1 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors focus:outline-none cursor-pointer shrink-0"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={onOpenDrawer}
              className="p-2 -ml-1 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors focus:outline-none cursor-pointer shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            {!showBack && (
              <div className="p-0.5 rounded-xl bg-white/15 backdrop-blur-xs shadow-xs flex items-center justify-center shrink-0">
                <MyvLogo size={24} monochrome={false} />
              </div>
            )}
            <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white whitespace-nowrap truncate max-w-[130px] sm:max-w-[175px]">
              {title}
            </h1>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-[9px] font-black shrink-0">
              v6
            </span>
          </div>
        </div>

        {/* Right Actions: Gold VIP button, Settings, Overflow ⋮ */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {!showBack && onOpenVipPayment && (
            <button
              onClick={onOpenVipPayment}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-[10px] sm:text-xs shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              aria-label="Kwishyura VIP Premium"
              title="Kwishyura VIP Premium"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>VIP</span>
            </button>
          )}

          {!showBack && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer"
              aria-label="Open Settings"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Overflow Menu Anchor (3 Dots ⋮) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer"
              aria-label="More options"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-[#050B1A] rounded-2xl shadow-2xl border border-slate-200 dark:border-blue-500/35 py-1.5 z-50 text-slate-800 dark:text-slate-100">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenImport();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-700 dark:text-cyan-300 text-left transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Import Config (.myv)</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenExport();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Export Config (.myv)</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                {onOpenVipPayment && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenVipPayment();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-extrabold hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-left transition-colors cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>👑 Kwishyura VIP Premium</span>
                  </button>
                )}

                {onOpenVipRoom && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenVipRoom();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-left transition-colors cursor-pointer"
                  >
                    <Gift className="w-4 h-4 text-emerald-400" />
                    <span>VIP Room &amp; +50h Redeem</span>
                  </button>
                )}

                {onOpenUpdate && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenUpdate();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-500" />
                    <span>Check App Update (New Version)</span>
                  </button>
                )}

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenServerApps();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-left transition-colors cursor-pointer"
                >
                  <Server className="w-4 h-4 text-blue-500" />
                  <span>No-VPS Servers Ping</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenPayloadGen();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-slate-400" />
                  <span>Payload Generator</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onClearLogs();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                  <span>Clear Logs</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAbout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>About Mutiganda Yvan</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
