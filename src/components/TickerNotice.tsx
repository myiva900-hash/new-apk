import React, { useState, useEffect } from 'react';
import { Languages, Crown } from 'lucide-react';

interface TickerNoticeProps {
  onServerClick?: () => void;
  onVipClick?: () => void;
}

export const TickerNotice: React.FC<TickerNoticeProps> = ({ onServerClick, onVipClick }) => {
  const [lang, setLang] = useState<'RW' | 'EN'>('RW');

  useEffect(() => {
    const timer = setInterval(() => {
      setLang(prev => (prev === 'RW' ? 'EN' : 'RW'));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const rwMessage =
    '🇷🇼 KWISHYURA: MTN 0780949484 · CODE 2238763 (YVAN MUTIGANDA) · 2000 FRW 1 WEEK · 2 MONTHS · 3 YEARS · UNLIMITED INTERNET ALL COUNTRY ALL SIM CARD · OHEREZA SCREENSHOT KURI WHATSAPP';
  const enMessage =
    '🇷🇼 PAYMENT: MTN 0780949484 · CODE 2238763 (YVAN MUTIGANDA) · 2000 FRW 1 WEEK · 2 MONTHS · 3 YEARS · UNLIMITED INTERNET ALL COUNTRY ALL SIM CARD · SEND SCREENSHOT ON WHATSAPP';

  const activeText = lang === 'RW' ? rwMessage : enMessage;

  return (
    <div
      onClick={onVipClick || onServerClick}
      className="w-full bg-[#050B1A] text-white border-b border-blue-500/30 py-1.5 px-2 flex items-center gap-1.5 overflow-hidden select-none cursor-pointer group shadow-xs"
      title="Mutiganda Yvan VPN VIP"
    >
      {/* Gold 2000 FRW Badge */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[10px] font-black shrink-0 z-10 shadow-xs whitespace-nowrap">
        <Crown className="w-3 h-3" />
        <span>2000 FRW</span>
      </div>

      {/* Smooth 65-Second Continuously Scrolling Marquee Banner */}
      <div className="overflow-hidden flex-1 relative whitespace-nowrap">
        <div className="ticker-marquee flex items-center gap-10 text-[11px] font-extrabold tracking-wide">
          <span className="text-amber-200">{activeText}</span>
          <span className="text-cyan-200">{activeText}</span>
        </div>
      </div>

      {/* RW / EN Language Toggle */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setLang(prev => (prev === 'RW' ? 'EN' : 'RW'));
        }}
        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600/30 hover:bg-blue-600/50 border border-cyan-400/40 text-cyan-200 text-[10px] font-black shrink-0 z-10 cursor-pointer transition-colors"
        title="Switch RW / EN"
      >
        <Languages className="w-3 h-3 text-cyan-300" />
        <span>RW / EN · {lang}</span>
      </button>
    </div>
  );
};
