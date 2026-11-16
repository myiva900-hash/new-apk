import React, { useState } from 'react';
import {
  Crown,
  Gift,
  Sparkles,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Server,
  Smartphone,
  Plus,
  KeyRound,
  Users
} from 'lucide-react';
import { SERVERS } from '../data/servers';
import { RedeemCodeRecord, VpnServer } from '../types/vpn';
import { vpnSimulator } from '../services/vpnSimulator';

interface VipRoomScreenProps {
  remainingSeconds: number;
  selectedServer: VpnServer;
  onSelectServer: (server: VpnServer) => void;
  onOpenVipPayment: () => void;
  onSwitchToHome: () => void;
}

export const VipRoomScreen: React.FC<VipRoomScreenProps> = ({
  remainingSeconds,
  selectedServer,
  onSelectServer,
  onOpenVipPayment,
  onSwitchToHome,
}) => {
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemFeedback, setRedeemFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [guestLabel, setGuestLabel] = useState('');
  const [codes, setCodes] = useState<RedeemCodeRecord[]>(() => vpnSimulator.getCodes());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const vipServers = SERVERS.filter(s => s.vipTier === 'PREMIUM');

  const handleGenerateCode = () => {
    const newRec = vpnSimulator.generateRedeemCode(guestLabel);
    setCodes(vpnSimulator.getCodes());
    setGuestLabel('');
    setRedeemInput(newRec.code);
  };

  const handleRedeem = () => {
    const res = vpnSimulator.redeemTimeCode(redeemInput);
    setRedeemFeedback({ ok: res.ok, text: res.message });
    setCodes(vpnSimulator.getCodes());
    if (res.ok) {
      setRedeemInput('');
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      setCopiedCode(null);
    }
  };

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
                Icyumba cy&apos;abahawe VIP · All Country · All SIM Cards · No-VPS Edge
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

        {/* Remaining Countdown & +50h summary */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/30">
            <div className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>REMAINING TIME</span>
            </div>
            <div className="text-base sm:text-lg font-mono font-black tabular-nums text-emerald-400 mt-0.5">
              {vpnSimulator.formatCountdown(remainingSeconds)}
            </div>
            <div className="text-[10px] text-slate-400">Starts at 124h countdown</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-400/30">
            <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>CARRIER ACCESS</span>
            </div>
            <div className="text-sm sm:text-base font-black text-white mt-0.5">
              All SIM Cards
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold">
              MTN · Airtel · Global Ready
            </div>
          </div>
        </div>
      </div>

      {/* REDEEM TIME (+50 HOURS) */}
      <div className="p-4 rounded-2xl bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] border border-slate-200 dark:border-cyan-500/35 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Redeem Time (+50 Hours VIP)
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Shyiramo code uhabwe amasaha 50 y&apos;inyongera ako kanya
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-500">+50 HRS</span>
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
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all active:scale-95"
          >
            REDEEM +50H
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

      {/* REDEEM CODE GENERATOR (VIP ADMIN / MEMBER TOOL) */}
      <div className="p-4 rounded-2xl bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] border border-slate-200 dark:border-amber-500/35 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Generate VIP Redeem Code (+50h)
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Kora code nshya yo guha abahawe VIP Premium Room
              </p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={guestLabel}
            onChange={e => setGuestLabel(e.target.value)}
            placeholder="Izina ry'uhawe VIP (urugero: Eric)"
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={handleGenerateCode}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Generate</span>
          </button>
        </div>

        {/* Generated Codes List */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
          {codes.map(item => (
            <div
              key={item.code}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                item.redeemed
                  ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-65'
                  : 'bg-amber-500/10 border-amber-400/35'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-mono font-black text-slate-900 dark:text-amber-300 truncate">
                  {item.code}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <Users className="w-3 h-3 shrink-0" />
                  <span className="truncate">{item.assignedTo || 'VIP Member'}</span>
                  <span>·</span>
                  <span className={item.redeemed ? 'text-slate-400' : 'text-emerald-500 font-bold'}>
                    {item.redeemed ? 'Used' : '+50h Ready'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!item.redeemed && (
                  <button
                    onClick={() => setRedeemInput(item.code)}
                    className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold cursor-pointer"
                  >
                    Use
                  </button>
                )}
                <button
                  onClick={() => handleCopyCode(item.code)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Copy Redeem Code"
                >
                  {copiedCode === item.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NO-VPS BUILT-IN VIP SERVERS */}
      <div className="p-4 rounded-2xl bg-white/75 dark:bg-[#050B1A]/60 backdrop-blur-[2px] border border-slate-200 dark:border-blue-500/35 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              VIP Premium Servers (No VPS Needed)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Anti-Spam Shield
          </span>
        </div>

        <div className="space-y-1.5">
          {vipServers.map(srv => {
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
                    <div className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold truncate">
                      {srv.country}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-500 shrink-0 ml-2">
                  {srv.ping}ms
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
