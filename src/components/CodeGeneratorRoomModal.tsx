import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  RefreshCw,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { AdminRedeemCodeRecord } from '../types/vpn';
import { backendApi } from '../services/api';

interface CodeGeneratorRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HOUR_PRESETS: Array<{ label: string; hours: number }> = [
  { label: '+50h Default', hours: 50 },
  { label: '+124h VPN', hours: 124 },
  { label: '1 Week (168h)', hours: 168 },
  { label: '2 Months (1440h)', hours: 1440 },
  { label: '3 Years (26280h)', hours: 26280 },
];

const QUANTITY_OPTIONS = [1, 3, 5, 10];

export const CodeGeneratorRoomModal: React.FC<CodeGeneratorRoomModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [token, setToken] = useState<string>(() => sessionStorage.getItem('myv_admin_token') || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [hours, setHours] = useState(50);
  const [count, setCount] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [freshCodes, setFreshCodes] = useState<
    Array<{ code: string; hours: number; assignedTo: string }>
  >([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [historyCodes, setHistoryCodes] = useState<AdminRedeemCodeRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async (activeToken: string) => {
    setLoadingHistory(true);
    try {
      const overview = await backendApi.adminGetOverview(activeToken);
      setHistoryCodes(overview.codes);
    } catch {
      sessionStorage.removeItem('myv_admin_token');
      setToken('');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const stored = sessionStorage.getItem('myv_admin_token') || '';
      setToken(stored);
      if (stored) {
        loadHistory(stored);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = passwordInput.trim();
    if (!candidate || authLoading) return;

    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await backendApi.adminLogin(candidate);
      sessionStorage.setItem('myv_admin_token', res.token);
      setToken(res.token);
      setPasswordInput('');
      await loadHistory(res.token);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Password siyo. Injiza Password y’icyumba.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('myv_admin_token');
    setToken('');
    setPasswordInput('');
    setFreshCodes([]);
    setHistoryCodes([]);
    setAuthError(null);
  };

  const handleGenerate = async () => {
    if (!token || generating) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await backendApi.adminGenerateCode(token, hours, recipient, count);
      const list =
        res.codes && res.codes.length > 0
          ? res.codes.map(c => ({ code: c.code, hours: c.hours, assignedTo: c.assignedTo }))
          : [{ code: res.code, hours: res.hours, assignedTo: res.assignedTo }];
      setFreshCodes(list);
      setRecipient('');
      await loadHistory(token);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Ntibishoboye gukora code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Ignore clipboard errors
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-md max-h-[90vh] bg-[#050B1A] text-white rounded-3xl border border-amber-400/50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#050B1A] via-amber-950/60 to-[#1D4ED8]/50 px-4 py-3.5 border-b border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] text-slate-950 flex items-center justify-center shadow-md shrink-0">
              {token ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-tight text-amber-300 truncate">
                Icyumba cya Redeem Generator
              </h2>
              <p className="text-[10px] text-cyan-200 truncate">
                {token
                  ? 'Icyumba Gifunguye · Backend Single-Use Codes'
                  : 'Injiza Password kugira ngo ufungure'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {token && (
              <button
                type="button"
                onClick={handleLock}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-300 text-[10px] font-black cursor-pointer"
                title="Funga Icyumba"
              >
                Funga
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!token ? (
            /* LOCKED VAULT GATE */
            <form onSubmit={handleUnlock} className="space-y-4 py-3">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-[#FBBF24]" />
                </div>
                <h3 className="text-sm font-black text-white">
                  Icyumba Cyihariye cy&apos;Umuyobozi
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Injiza password y&apos;icyumba kugira ngo ufungure aho bakorera Redeem Codes za{' '}
                  <span className="text-emerald-400 font-bold">Mutiganda Yvan VPN</span>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Password y&apos;Icyumba
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    autoFocus
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Andika password..."
                    className="w-full px-3.5 py-3 pr-10 rounded-xl bg-slate-900 border border-amber-500/40 focus:border-[#FBBF24] focus:outline-none text-sm font-mono tracking-widest text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-bold text-rose-300">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading || !passwordInput.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                <span>{authLoading ? 'KUGENZURA...' : 'FUNGURA ICYUMBA'}</span>
              </button>
            </form>
          ) : (
            /* UNLOCKED REDEEM CODE GENERATOR ROOM */
            <div className="space-y-4">
              {/* Hour Presets */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Amasaha ya Redeem Code (Hours)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {HOUR_PRESETS.map(p => (
                    <button
                      key={p.hours}
                      type="button"
                      onClick={() => setHours(p.hours)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border cursor-pointer transition-colors ${
                        hours === p.hours
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-400/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours Input + Quantity + Recipient */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Custom Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={26280}
                    value={hours}
                    onChange={e => setHours(Math.max(1, Number(e.target.value) || 50))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Umubare wa Codes
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {QUANTITY_OPTIONS.map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setCount(q)}
                        className={`py-2 rounded-lg text-xs font-black border cursor-pointer ${
                          count === q
                            ? 'bg-[#06B6D4] text-slate-950 border-cyan-300'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        {q}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Izina ry&apos;Umukiriya cyangwa Note
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="Urugero: Jean Paul / MTN MoMo VIP"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                />
              </div>

              {genError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-bold text-rose-300">
                  {genError}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {generating
                    ? 'IRIMO GUKORA CODE...'
                    : `GENERATE ${count}x CODE (+${hours}h)`}
                </span>
              </button>

              {/* Freshly Generated Plaintext Codes */}
              {freshCodes.length > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Codes Zishya Zibitswe kuri Backend</span>
                    </span>
                    {freshCodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            freshCodes.map(c => c.code).join('\n'),
                            'ALL'
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'ALL' ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === 'ALL' ? 'Copied All' : 'Copy All'}</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto select-text">
                    {freshCodes.map(item => {
                      const shareUrl = `https://wa.me/?text=${encodeURIComponent(
                        `Mutiganda Yvan VPN VIP Redeem Code (+${item.hours}h): ${item.code}`
                      )}`;
                      return (
                        <div
                          key={item.code}
                          className="p-2 rounded-xl bg-slate-950/90 border border-emerald-500/30 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-black text-emerald-300 truncate">
                              {item.code}
                            </div>
                            <div className="text-[9px] text-slate-400">
                              +{item.hours}h · {item.assignedTo}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(item.code, item.code)}
                              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === item.code ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedKey === item.code ? 'Copied' : 'Copy'}</span>
                            </button>
                            <a
                              href={shareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 text-emerald-300 hover:bg-[#10B981]/30"
                              title="Ohereza kuri WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* History of Codes in Backend */}
              <div className="p-3 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Codes Zose Ziri muri Backend ({historyCodes.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => loadHistory(token)}
                    disabled={loadingHistory}
                    className="text-[10px] font-bold text-[#06B6D4] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {historyCodes.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2">
                    Nta redeem code irakorwa kugeza ubu. Kanda buto iri hejuru ukore iya mbere!
                  </p>
                ) : (
                  <div className="max-h-44 overflow-y-auto space-y-1.5">
                    {historyCodes.map((c, idx) => (
                      <div
                        key={`${c.codeHint}-${idx}`}
                        className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2 text-[10px] font-mono"
                      >
                        <div className="min-w-0">
                          <div className="text-slate-200 font-bold truncate">{c.codeHint}</div>
                          <div className="text-slate-500 truncate">
                            {c.assignedTo} · +{c.hours}h
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-black shrink-0 ${
                            c.redeemed
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {c.redeemed ? 'USED' : 'READY'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
