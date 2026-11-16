import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Rocket,
  Sliders,
  Check,
  Play,
  Square,
  Activity,
  ShieldCheck,
  Sparkles,
  Lock,
  MessageCircle,
  Crown,
  Clock,
  Gift,
  Smartphone,
  MoreVertical,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import {
  ConnectionMode,
  ConnectionStatus,
  CustomSetupConfig,
  SimCarrierMode,
  VpnServer
} from '../types/vpn';
import { VpnStats, vpnSimulator } from '../services/vpnSimulator';
import { SERVERS, AVAILABLE_PORTS, SIM_CARRIERS } from '../data/servers';
import { MyvLogo } from './MyvLogo';

interface HomeScreenProps {
  status: ConnectionStatus;
  stats: VpnStats;
  selectedServer: VpnServer;
  onSelectServer: (server: VpnServer) => void;
  selectedPort: number;
  onSelectPort: (port: number) => void;
  connectionMode: ConnectionMode;
  onSelectConnectionMode: (mode: ConnectionMode) => void;
  simCarrier: SimCarrierMode;
  onSelectSimCarrier: (sim: SimCarrierMode) => void;
  customSetupEnabled: boolean;
  onToggleCustomSetup: (enabled: boolean) => void;
  customSetup: CustomSetupConfig;
  onUpdateCustomSetup: (updates: Partial<CustomSetupConfig>) => void;
  onStartVpn: () => void;
  onStopVpn: () => void;
  onOpenPayloadGen: () => void;
  onOpenImportConfig: () => void;
  onOpenExportConfig: () => void;
  onOpenServerApps: () => void;
  onOpenUpdate?: () => void;
  onOpenVipPayment?: () => void;
  onOpenVipRoom?: () => void;
  accentColor?: 'blue' | 'red' | 'green' | 'yellow' | 'black';
  onSelectAccentColor?: (color: 'blue' | 'red' | 'green' | 'yellow' | 'black') => void;
}

const CONNECTION_MODES: {
  id: ConnectionMode;
  title: string;
  subtitle: string;
}[] = [
  { id: 'direct', title: 'Direct Connection', subtitle: 'Rwanda & Global Internet · No VPS Needed' },
  { id: 'custom_payload', title: 'Custom Payload', subtitle: 'TCP Injection Mode' },
  { id: 'custom_host', title: 'Custom Host Header', subtitle: 'HTTP Header Mode' },
  { id: 'custom_sni', title: 'Custom SNI', subtitle: 'SSL / TLS Mode' },
  { id: 'dnstt', title: 'DNSTT Tunnel', subtitle: 'DNS Tunneling Mode' },
  { id: 'imported_config', title: 'Imported Config', subtitle: '.MYV File Profile' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  status,
  stats,
  selectedServer,
  onSelectServer,
  selectedPort,
  onSelectPort,
  connectionMode,
  onSelectConnectionMode,
  simCarrier,
  onSelectSimCarrier,
  customSetupEnabled,
  onToggleCustomSetup,
  customSetup,
  onUpdateCustomSetup,
  onStartVpn,
  onStopVpn,
  onOpenPayloadGen,
  onOpenImportConfig,
  onOpenExportConfig,
  onOpenServerApps,
  onOpenUpdate,
  onOpenVipPayment,
  onOpenVipRoom,
  accentColor = 'blue',
}) => {
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showPortMenu, setShowPortMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [showConfigDotsMenu, setShowConfigDotsMenu] = useState(false);

  const dotsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeDots = (e: MouseEvent) => {
      if (dotsMenuRef.current && !dotsMenuRef.current.contains(e.target as Node)) {
        setShowConfigDotsMenu(false);
      }
    };
    if (showConfigDotsMenu) {
      document.addEventListener('mousedown', closeDots);
    }
    return () => document.removeEventListener('mousedown', closeDots);
  }, [showConfigDotsMenu]);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'authenticating';
  const isBusy = isConnecting || status === 'disconnecting';

  const currentModeInfo = CONNECTION_MODES.find(m => m.id === connectionMode) || CONNECTION_MODES[0];
  const currentSimInfo = SIM_CARRIERS.find(s => s.id === simCarrier) || SIM_CARRIERS[0];

  const getStartButtonGradient = () => {
    switch (accentColor) {
      case 'red':
        return 'bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 hover:from-rose-600 hover:to-red-500 shadow-rose-600/30';
      case 'green':
        return 'bg-gradient-to-r from-emerald-600 via-[#10B981] to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 text-slate-950';
      case 'yellow':
        return 'bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] hover:from-amber-400 hover:to-yellow-300 shadow-amber-500/30 text-slate-950';
      case 'black':
        return 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 hover:from-black hover:to-slate-900 shadow-black/40 border border-slate-700';
      case 'blue':
      default:
        return 'bg-gradient-to-r from-[#1D4ED8] via-blue-600 to-[#06B6D4] hover:from-blue-600 hover:to-cyan-500 shadow-blue-600/35';
    }
  };

  return (
    <div className="flex-1 w-full max-w-xl mx-auto p-3 sm:p-4 pb-20 flex flex-col gap-3 select-none">
      
      {/* Main Luxury VPN Card */}
      <div className="bg-white/75 dark:bg-[#050B1A]/58 backdrop-blur-[2px] rounded-2xl shadow-xl border border-slate-200/80 dark:border-[#1D4ED8]/45 p-4 relative">
        
        {/* Brand Banner + 124h Countdown Timer */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-blue-500/20 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-0.5 rounded-full bg-white/10 shadow-sm flex items-center justify-center shrink-0">
              <MyvLogo size={34} monochrome={false} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">
                Mutiganda Yvan
              </div>
              <p className="text-[10px] text-slate-500 dark:text-[#06B6D4] truncate">
                No-VPS Edge · All Country · All SIM Card
              </p>
            </div>
          </div>

          {/* 124h Countdown Timer & Redeem +50h Quick Action */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-emerald-500/40 text-right">
              <div className="text-[9px] font-bold text-slate-500 dark:text-emerald-400 flex items-center justify-end gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>TIME LEFT</span>
              </div>
              <div className="text-[11px] font-mono font-black tabular-nums text-slate-900 dark:text-[#10B981]">
                {vpnSimulator.formatCountdown(stats.remainingSeconds)}
              </div>
            </div>

            {onOpenVipRoom && (
              <button
                onClick={onOpenVipRoom}
                className="px-2 py-1.5 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/40 text-emerald-700 dark:text-[#10B981] text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                title="Redeem +50 Hours Time"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>+50H</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Grid: SELECT SERVER and SELECT PORT */}
        <div className="grid grid-cols-12 gap-3 pb-3 border-b border-slate-100 dark:border-blue-500/20">
          
          {/* SELECT SERVER */}
          <div className="col-span-8 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                SELECT SERVER
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-[#10B981]">
                Built-in · No VPS
              </span>
            </div>

            <button
              onClick={() => {
                setShowServerMenu(!showServerMenu);
                setShowPortMenu(false);
                setShowModeMenu(false);
                setShowSimMenu(false);
              }}
              disabled={isConnected || isBusy}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-blue-500/30 transition-colors text-left disabled:opacity-60 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center shrink-0">
                  <span className="text-base select-none">{selectedServer.flag}</span>
                </div>
                <div className="truncate">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                    {selectedServer.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedServer.country} · <span className="text-emerald-600 dark:text-[#10B981] font-semibold">{selectedServer.ping}ms</span>
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {showServerMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#050B1A] rounded-xl shadow-2xl border border-slate-200 dark:border-blue-500/40 py-1.5 z-40 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-[#06B6D4] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>🇷🇼 Built-In Cloud &amp; Rwanda Servers</span>
                  <span className="text-[9px] text-emerald-500">No VPS Required</span>
                </div>

                {SERVERS.map(srv => (
                  <button
                    key={srv.id}
                    onClick={() => {
                      onSelectServer(srv);
                      setShowServerMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                      selectedServer.id === srv.id ? 'bg-blue-50/80 dark:bg-blue-950/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-lg shrink-0">{srv.flag}</span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-800 dark:text-white truncate flex items-center gap-1.5">
                          <span>{srv.name}</span>
                          {srv.vipTier === 'PREMIUM' && (
                            <span className="text-[9px] font-black text-amber-500">VIP</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {srv.country} · Load {srv.load}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-mono font-bold ${srv.ping < 20 ? 'text-[#10B981]' : 'text-[#06B6D4]'}`}>
                        {srv.ping}ms
                      </span>
                      {selectedServer.id === srv.id && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SELECT PORT */}
          <div className="col-span-4 relative">
            <span className="block text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
              SELECT PORT
            </span>

            <button
              onClick={() => {
                setShowPortMenu(!showPortMenu);
                setShowServerMenu(false);
                setShowModeMenu(false);
                setShowSimMenu(false);
              }}
              disabled={isConnected || isBusy}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-blue-500/30 transition-colors text-left disabled:opacity-60 cursor-pointer h-[50px]"
            >
              <div className="truncate">
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                  P {selectedPort}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Port</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {showPortMenu && (
              <div className="absolute top-full right-0 w-48 mt-1 bg-white dark:bg-[#050B1A] rounded-xl shadow-2xl border border-slate-200 dark:border-blue-500/40 py-1 z-40 max-h-56 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Available Ports
                </div>
                {AVAILABLE_PORTS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => {
                      onSelectPort(p.value);
                      setShowPortMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                      selectedPort === p.value ? 'bg-blue-50/80 dark:bg-blue-950/40' : ''
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-white">{p.label}</div>
                      <div className="text-[9px] text-slate-500">{p.desc}</div>
                    </div>
                    {selectedPort === p.value && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All SIM Cards Selector Row */}
        <div className="pt-2.5 pb-2 border-b border-slate-100 dark:border-blue-500/20 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-cyan-300">
              <Smartphone className="w-3.5 h-3.5 text-[#10B981]" />
              <span>SIM CARD CARRIER</span>
            </div>
            <span className="text-[10px] font-bold text-[#10B981]">Works on All SIM Cards</span>
          </div>

          <button
            onClick={() => {
              setShowSimMenu(!showSimMenu);
              setShowServerMenu(false);
              setShowPortMenu(false);
              setShowModeMenu(false);
            }}
            disabled={isConnected || isBusy}
            className="mt-1.5 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-emerald-500/30 text-left disabled:opacity-60 cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
              {currentSimInfo.label}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {showSimMenu && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#050B1A] rounded-xl shadow-2xl border border-slate-200 dark:border-emerald-500/40 py-1 z-40">
              {SIM_CARRIERS.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSimCarrier(item.id);
                    setShowSimMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer ${
                    simCarrier === item.id ? 'text-[#10B981] bg-emerald-50/50 dark:bg-emerald-950/30' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>{item.label}</span>
                  {simCarrier === item.id && <Check className="w-4 h-4 text-[#10B981]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data Counter */}
        <div className="my-3 flex items-center justify-center gap-4 sm:gap-6 px-4 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-blue-500/25 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-1.5">
            <ArrowUpCircle className="w-4 h-4 text-[#06B6D4]" />
            <span>Upload: {vpnSimulator.formatBytes(stats.uploadBytes)}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <ArrowDownCircle className="w-4 h-4 text-[#10B981]" />
            <span>Download: {vpnSimulator.formatBytes(stats.downloadBytes)}</span>
          </div>
        </div>

        {/* Connection Mode + 3-Dot Config Menu (Import / Export) + Custom Setup Switch */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              CONNECTION MODE
            </span>

            <div className="flex items-center gap-2.5">
              {/* 3 Dots (⋮) Button -> Shows Import Config (.myv) */}
              <div className="relative" ref={dotsMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowConfigDotsMenu(prev => !prev)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/35 hover:border-cyan-400 text-slate-700 dark:text-cyan-300 flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors"
                  aria-label="Import and Export Menu"
                  title="⋮ Import / Export Config"
                >
                  <MoreVertical className="w-3.5 h-3.5 shrink-0" />
                  <span>Import / Export</span>
                </button>

                {showConfigDotsMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#050B1A] rounded-xl shadow-2xl border border-slate-200 dark:border-cyan-500/40 py-1.5 z-50">
                    <button
                      onClick={() => {
                        setShowConfigDotsMenu(false);
                        onOpenImportConfig();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-extrabold text-blue-600 dark:text-[#06B6D4] hover:bg-blue-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Import Config (.myv)</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowConfigDotsMenu(false);
                        onOpenExportConfig();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Export Config (.myv)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Setup Switch */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                  CUSTOM SETUP
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={customSetupEnabled}
                  onClick={() => onToggleCustomSetup(!customSetupEnabled)}
                  disabled={isConnected || isBusy}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    customSetupEnabled ? 'bg-[#1D4ED8]' : 'bg-slate-300 dark:bg-slate-700'
                  } disabled:opacity-50`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      customSetupEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Connection Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowModeMenu(!showModeMenu);
                setShowServerMenu(false);
                setShowPortMenu(false);
                setShowSimMenu(false);
              }}
              disabled={isConnected || isBusy}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-blue-500/30 transition-colors text-left disabled:opacity-60 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/15 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-[#06B6D4]">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                    {currentModeInfo.title}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {currentModeInfo.subtitle}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {showModeMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#050B1A] rounded-xl shadow-2xl border border-slate-200 dark:border-blue-500/40 py-1.5 z-40">
                {CONNECTION_MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onSelectConnectionMode(mode.id);
                      setShowModeMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                      connectionMode === mode.id ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Rocket className="w-4 h-4 text-[#06B6D4]" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-white">{mode.title}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{mode.subtitle}</div>
                      </div>
                    </div>
                    {connectionMode === mode.id && (
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CUSTOM SETUP EXPANDED DRAWER */}
        {customSetupEnabled && (
          <div className="mt-3 p-3 rounded-xl bg-blue-50/50 dark:bg-slate-900/80 border border-blue-200/80 dark:border-cyan-500/30 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-blue-800 dark:text-cyan-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Custom {currentModeInfo.title} Parameters
              </span>
              {connectionMode === 'custom_payload' && (
                <button
                  onClick={onOpenPayloadGen}
                  className="text-[10px] font-semibold text-blue-600 dark:text-[#06B6D4] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Payload Generator
                </button>
              )}
            </div>

            {connectionMode === 'custom_payload' && (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={customSetup.payload}
                  onChange={e => onUpdateCustomSetup({ payload: e.target.value })}
                  placeholder="CONNECT [host_port] [protocol][crlf]Host: example.com[crlf][crlf]"
                  className="w-full p-2 text-[11px] font-mono bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customSetup.proxyHost}
                    onChange={e => onUpdateCustomSetup({ proxyHost: e.target.value })}
                    placeholder="Proxy Host"
                    className="w-full p-1.5 text-[11px] bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none"
                  />
                  <input
                    type="text"
                    value={customSetup.proxyPort}
                    onChange={e => onUpdateCustomSetup({ proxyPort: e.target.value })}
                    placeholder="Proxy Port"
                    className="w-full p-1.5 text-[11px] bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none"
                  />
                </div>
              </div>
            )}

            {connectionMode === 'custom_sni' && (
              <input
                type="text"
                value={customSetup.sni}
                onChange={e => onUpdateCustomSetup({ sni: e.target.value })}
                placeholder="e.g. edge.cloudflare.com"
                className="w-full p-2 text-xs bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none"
              />
            )}

            {connectionMode === 'custom_host' && (
              <input
                type="text"
                value={customSetup.hostHeader}
                onChange={e => onUpdateCustomSetup({ hostHeader: e.target.value })}
                placeholder="e.g. cdn.cloudflare.net"
                className="w-full p-2 text-xs bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none"
              />
            )}

            {connectionMode === 'dnstt' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customSetup.dnsttDomain}
                  onChange={e => onUpdateCustomSetup({ dnsttDomain: e.target.value })}
                  placeholder="t.myv-dns.org"
                  className="w-full p-1.5 text-xs bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none"
                />
                <input
                  type="text"
                  value={customSetup.dnsttPublicKey}
                  onChange={e => onUpdateCustomSetup({ dnsttPublicKey: e.target.value })}
                  placeholder="DNSTT Public Key"
                  className="w-full p-1.5 text-xs font-mono bg-white dark:bg-[#050B1A] border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none"
                />
              </div>
            )}

            {connectionMode === 'imported_config' && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#06B6D4]" />
                  {customSetup.importedConfigName || 'No profile loaded'}
                </span>
                <button
                  onClick={onOpenImportConfig}
                  className="px-2.5 py-1 text-[10px] font-bold bg-[#1D4ED8] text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  Import .MYV File
                </button>
              </div>
            )}
          </div>
        )}

        {/* MAIN VPN START / STOP BUTTON */}
        <div className="mt-4">
          <button
            onClick={isConnected ? onStopVpn : onStartVpn}
            disabled={isBusy}
            className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm tracking-widest uppercase text-white shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer android-ripple ${
              isConnected
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
                : isBusy
                ? 'bg-amber-500 text-slate-950 opacity-90 cursor-wait'
                : getStartButtonGradient()
            }`}
          >
            {isBusy ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{status === 'connecting' ? 'CONNECTING...' : 'AUTHENTICATING...'}</span>
              </>
            ) : isConnected ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>STOP VPN</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>START VPN</span>
              </>
            )}
          </button>
        </div>

        {/* Connection Status Banner */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-blue-500/20 flex items-center justify-between text-xs gap-2">
          <div className="font-semibold text-[11px] uppercase">
            {isConnected ? (
              <span className="text-[#10B981] font-extrabold">
                CONNECTED · SHIELD ACTIVE
              </span>
            ) : isBusy ? (
              <span className="text-[#FBBF24] font-bold">
                CONNECTING...
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">DISCONNECTED</span>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-500 dark:text-cyan-300 truncate">
            {isConnected ? `IP: ${stats.assignedIp}` : selectedServer.name}
          </div>
        </div>

        {/* Yellow & Green Anti-Hacking / Anti-Spam Banner when Connected */}
        {isConnected && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/10 border border-amber-400/45 flex items-center justify-between gap-2 text-[11px]">
            <span className="font-extrabold bg-gradient-to-r from-[#FBBF24] to-[#10B981] bg-clip-text text-transparent">
              Anti-Hacking &amp; Anti-Spam Premium Server Active
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981] shrink-0">
              {vpnSimulator.formatCountdown(stats.remainingSeconds)}
            </span>
          </div>
        )}
      </div>

      {/* METALLIC GOLD VIP PAYMENT CARD */}
      {onOpenVipPayment && (
        <div
          onClick={onOpenVipPayment}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onOpenVipPayment()}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] text-slate-950 shadow-lg shadow-amber-500/20 border border-amber-200/70 flex items-center justify-between gap-3 cursor-pointer transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-950/15 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black tracking-tight uppercase truncate">
                KWISHYURA VIP PREMIUM 👑
              </div>
              <div className="text-[11px] font-bold text-slate-900/90 truncate">
                MTN 0780949484 · CODE 2238763 · 2,000 FRW / Week
              </div>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-[#FBBF24] font-black text-xs shrink-0">
            PAY
          </span>
        </div>
      )}

      {/* QUICK UTILITY ACTIONS */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenServerApps}
          className="p-3 bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] rounded-xl border border-slate-200/80 dark:border-blue-500/35 hover:border-cyan-400 transition-all flex items-center gap-2.5 text-left shadow-xs cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-[#06B6D4] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-white">Server Ping Test</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">No-VPS Edge Nodes</div>
          </div>
        </button>

        <button
          onClick={onOpenPayloadGen}
          className="p-3 bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] rounded-xl border border-slate-200/80 dark:border-blue-500/35 hover:border-cyan-400 transition-all flex items-center gap-2.5 text-left shadow-xs cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-[#1D4ED8] dark:text-cyan-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-white">Payload Tool</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Custom HTTP injector</div>
          </div>
        </button>

        {onOpenVipRoom && (
          <button
            onClick={onOpenVipRoom}
            className="p-3 bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] rounded-xl border border-slate-200/80 dark:border-emerald-500/35 hover:border-emerald-400 transition-all flex items-center gap-2.5 text-left shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-[#10B981] flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">Redeem +50h</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">VIP Room &amp; Codes</div>
            </div>
          </button>
        )}

        {onOpenUpdate && (
          <button
            onClick={onOpenUpdate}
            className="p-3 bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] rounded-xl border border-slate-200/80 dark:border-amber-500/35 hover:border-amber-400 transition-all flex items-center gap-2.5 text-left shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-[#FBBF24] flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">App Update</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Get New Version</div>
            </div>
          </button>
        )}
      </div>

      {/* GLASSMORPHIC DARK NAVY FOUNDER SUPPORT CARD */}
      <div className="p-3.5 bg-[#050B1A]/75 backdrop-blur-[2px] text-white rounded-2xl shadow-lg border border-[#1D4ED8]/45 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/assets/aistudio/photo_6015008377458593951_y_2837711e.jpg"
            alt="Mutiganda Yvan"
            className="w-14 h-14 rounded-full object-cover object-top border-2 border-[#FBBF24] shadow-md shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white truncate">Mutiganda Yvan</h3>
            <p className="text-[11px] text-cyan-200 font-medium truncate">
              Lead Architect &amp; Founder
            </p>
            <p className="text-[10px] font-mono text-amber-300 mt-0.5">
              0787699523
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/250787699523"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-slate-950" />
          <span>WhatsApp</span>
        </a>
      </div>

      {/* Security Footer */}
      <div className="px-3 py-2 bg-white/70 dark:bg-[#050B1A]/65 backdrop-blur-[2px] rounded-xl border border-slate-200/70 dark:border-blue-500/25 text-[11px] text-slate-600 dark:text-slate-200 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#06B6D4] shrink-0" />
        <span>Mutiganda Yvan VPN uses strong encryption.</span>
      </div>
    </div>
  );
};
