import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Languages,
  Phone,
  Volume2,
  Square,
  Play,
  Send,
  Clock
} from 'lucide-react';
import { PaymentRecord } from '../types/vpn';
import { backendApi } from '../services/api';
import { soundService } from '../services/sound';

interface VipPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated?: () => void;
}

export const VipPaymentModal: React.FC<VipPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentUpdated,
}) => {
  const [lang, setLang] = useState<'RW' | 'EN'>('RW');
  const [selectedPlan, setSelectedPlan] = useState<'1week' | '2months' | '3years'>('1week');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [speakingStep, setSpeakingStep] = useState<number | null>(null);

  // Payment Verification Form
  const [payerPhone, setPayerPhone] = useState('');
  const [momoTxId, setMomoTxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [myPayments, setMyPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    const unsub = soundService.subscribeGuideStep(step => {
      setSpeakingStep(step);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMyPayments();
    } else {
      soundService.stopVoiceGuide();
    }
  }, [isOpen]);

  const loadMyPayments = async () => {
    try {
      const list = await backendApi.getMyPayments();
      setMyPayments(list);
    } catch {
      // Ignore if offline
    }
  };

  if (!isOpen) return null;

  const copyText = async (label: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopiedField(label);
        setTimeout(() => setCopiedField(null), 2000);
      } catch {
        setCopiedField(null);
      }
    }
  };

  const plans = [
    {
      id: '1week' as const,
      title: '1 Week VIP',
      price: '2,000 FRW',
      badge: 'POPULAR 🔥',
    },
    {
      id: '2months' as const,
      title: '2 Months VIP',
      price: '12,000 FRW',
      badge: 'BEST VALUE ⭐',
    },
    {
      id: '3years' as const,
      title: '3 Years Ultra VIP',
      price: '35,000 FRW',
      badge: 'ULTRA 👑',
    },
  ];

  const activePlan = plans.find(p => p.id === selectedPlan) || plans[0];

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitFeedback(null);
    try {
      const res = await backendApi.submitPayment({
        planId: selectedPlan,
        payerPhone,
        momoTxId,
      });
      setSubmitFeedback({
        ok: true,
        text: `Ubusabe (${res.payment.id}) bwoherejwe kuri backend! Buri mu kugenzurwa (PENDING). Iyo bwemejwe, amasaha ya VIP yiyongeraho ako kanya.`,
      });
      setMomoTxId('');
      await loadMyPayments();
      onPaymentUpdated?.();
    } catch (err) {
      setSubmitFeedback({
        ok: false,
        text: err instanceof Error ? err.message : 'Kwohereza Transaction ID byanze.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    lang === 'RW'
      ? `Muraho Mutiganda Yvan! Nishyuye ${activePlan.title} (${activePlan.price}) kuri MTN 0780949484 / CODE 2238763 (Yvan Mutiganda) · Device ID: ${backendApi.getDeviceId()}. Dore screenshot yanjye:`
      : `Hello Mutiganda Yvan! I just paid for ${activePlan.title} (${activePlan.price}) via MTN 0780949484 / CODE 2238763 (Yvan Mutiganda) · Device ID: ${backendApi.getDeviceId()}. Here is my screenshot:`
  );

  const whatsappUrl = `https://wa.me/250787699523?text=${whatsappMessage}`;

  const handleClose = () => {
    soundService.stopVoiceGuide();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#050B1A] text-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F59E0B]/50 overflow-hidden animate-in zoom-in-95 duration-150">

        {/* Gold Metallic Header */}
        <div className="p-4 bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950/15 flex items-center justify-center">
              <Crown className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight uppercase">
                KWISHYURA VIP PREMIUM 👑
              </h3>
              <p className="text-[11px] font-bold text-slate-900/85">
                {lang === 'RW'
                  ? '🇷🇼 MTN MoMo · Backend Payment Verification'
                  : '🇬🇧 MTN MoMo · Backend Payment Verification'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(prev => (prev === 'RW' ? 'EN' : 'RW'))}
              className="px-2 py-1 rounded-lg bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
              title="Switch Kinyarwanda / English"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{lang === 'RW' ? '🇷🇼 RW' : '🇬🇧 EN'}</span>
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-full bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Male Voice Step-by-Step Guide Bar */}
        <div className="px-4 py-2 bg-blue-950/80 border-b border-blue-500/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Volume2 className={`w-4 h-4 shrink-0 ${speakingStep !== null ? 'text-emerald-400' : 'text-cyan-300'}`} />
            <div className="text-[11px] font-bold text-cyan-100 truncate">
              {speakingStep !== null
                ? speakingStep === 0
                  ? '🎙️ Welcome! Playing step-by-step guide...'
                  : `🎙️ Voice Guide · Step ${speakingStep} / 4`
                : '🎙️ Tap Play for Male Voice Step-by-Step Guide'}
            </div>
          </div>

          {speakingStep !== null ? (
            <button
              onClick={() => soundService.stopVoiceGuide()}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-white" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={() => soundService.playVipWelcomeGuide()}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-slate-950" />
              <span>Play Guide</span>
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">

          {/* 3 Selectable VIP Plan Cards */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#FBBF24] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'RW' ? 'Hitamo Plan ya VIP' : 'Select VIP Plan'}</span>
            </div>

            <div className="space-y-2">
              {plans.map(plan => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#F59E0B]/15 border-[#FBBF24] shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-[#F59E0B]/50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-xs sm:text-sm">
                          {plan.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FBBF24] text-slate-950 font-black">
                          {plan.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-cyan-200 mt-0.5">
                        WireGuard VIP Access · All Country · All SIM Card
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-[#FBBF24] whitespace-nowrap">
                        {plan.price}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MTN Mobile Money Details Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/90 to-slate-900 border border-[#1D4ED8]/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#06B6D4]">
                💳 MTN Mobile Money
              </span>
              <span className="text-[10px] font-black text-[#FBBF24]">RWANDA</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050B1A] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">MTN Number</div>
                <div className="text-sm font-mono font-black text-white">0780949484</div>
              </div>
              <button
                onClick={() => copyText('mtn', '0780949484')}
                className="px-2.5 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'mtn' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'mtn' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050B1A] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">MoMo Pay CODE</div>
                <div className="text-sm font-mono font-black text-[#FBBF24]">2238763</div>
              </div>
              <button
                onClick={() => copyText('code', '2238763')}
                className="px-2.5 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-amber-400 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'code' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050B1A] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">Registered Name</div>
                <div className="text-xs sm:text-sm font-black text-[#10B981]">Yvan Mutiganda</div>
              </div>
              <span className="text-[10px] font-bold text-[#10B981]">✅ Verified</span>
            </div>

            {/* USSD Buttons */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-[#050B1A]/90 border border-amber-500/30 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] text-amber-300 font-bold">MoMo Pay Code USSD</div>
                  <div className="text-xs font-mono font-black text-white truncate">*182*8*1*2238763#</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => copyText('ussd_code', '*182*8*1*2238763#')}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'ussd_code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                  <a
                    href="tel:*182*8*1*2238763%23"
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Dial</span>
                  </a>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#050B1A]/90 border border-cyan-500/30 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] text-cyan-300 font-bold">Direct Transfer USSD</div>
                  <div className="text-xs font-mono font-black text-white truncate">*182*1*1*0780949484#</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => copyText('ussd_dir', '*182*1*1*0780949484#')}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'ussd_dir' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                  <a
                    href="tel:*182*1*1*0780949484%23"
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Dial</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* BACKEND PAYMENT VERIFICATION SUBMISSION FORM */}
          <form onSubmit={handleSubmitPayment} className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/40 space-y-2.5">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#10B981]">
              ✅ Emeza Kwishyura Kuri Backend ({activePlan.title})
            </div>
            <p className="text-[10px] text-slate-300">
              Umaze kwishyura kuri MoMo, andika nimero wakoresheje na Transaction ID iri muri SMS ya MTN kugira ngo backend ibigenzure iguhe VIP.
            </p>
            <input
              type="tel"
              required
              value={payerPhone}
              onChange={e => setPayerPhone(e.target.value)}
              placeholder="Nimero yawe yishyuye (e.g. 078xxxxxxx)"
              className="w-full px-3 py-2 rounded-xl bg-[#050B1A] border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <input
              type="text"
              required
              value={momoTxId}
              onChange={e => setMomoTxId(e.target.value)}
              placeholder="MTN MoMo Transaction ID (e.g. 9823412054)"
              className="w-full px-3 py-2 rounded-xl bg-[#050B1A] border border-slate-700 text-xs font-mono uppercase text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1D4ED8] hover:bg-blue-600 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'SENDING...' : 'OHEREZA BYEMEZWE KURI BACKEND'}</span>
            </button>

            {submitFeedback && (
              <div
                className={`p-2 rounded-xl text-[11px] font-bold border ${
                  submitFeedback.ok
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {submitFeedback.text}
              </div>
            )}

            {myPayments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Ubwishyu bwawe ({myPayments.length})</span>
                </div>
                {myPayments.slice(0, 3).map(p => (
                  <div key={p.id} className="p-2 rounded-lg bg-[#050B1A] border border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-300 truncate">{p.momoTxId} · {p.planTitle}</span>
                    <span className={`font-black shrink-0 ml-2 ${
                      p.status === 'VERIFIED' ? 'text-emerald-400' : p.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* Large Green WhatsApp CTA Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.99] cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950" />
            <span>
              {lang === 'RW'
                ? '📲 OHEREZA SCREENSHOT KURI WHATSAPP'
                : '📲 SEND SCREENSHOT ON WHATSAPP'}
            </span>
          </a>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Mutiganda Yvan VPN · Backend Payment Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
