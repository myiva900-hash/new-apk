import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  Sparkles,
  Crown,
  Gift,
  Server,
  Download,
  Volume2,
  Trash2,
  Loader2,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { backendApi } from '../services/api';
import { soundService } from '../services/sound';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientState: {
    isNativeAndroid: boolean;
    status: string;
    connectionMode: string;
    simCarrier: string;
    hasEndpoint: boolean;
    hasKeys: boolean;
  };
  onOpenVipPayment: () => void;
  onOpenVipRoom: () => void;
  onOpenAddServer: () => void;
  onOpenApkDownload: () => void;
}

const QUICK_QUESTIONS: Array<{ label: string; prompt: string }> = [
  {
    label: '💳 Uko nishyura VIP',
    prompt: 'Nsobanurira uko bishyura VIP na MTN MoMo, ibiciro, na USSD code zo gukoresha.',
  },
  {
    label: '🌐 Free Internet & VPN',
    prompt: 'Nsobanurira intambwe ku yindi uko nkoresha iyi VPN kugira ngo mbone internet kuri SIM Card zose.',
  },
  {
    label: '🔑 Redeem Code (+50h)',
    prompt: 'Ndasobanuza uko Redeem Code ikora n’aho nayinjiriza ngo mbone amasaha ya VIP.',
  },
  {
    label: '🛡️ Server & WireGuard Keys',
    prompt: 'Nashyiramo nte WireGuard server na Keys cyangwa dosiye .conf kugira ngo CONNECT ikore?',
  },
  {
    label: '📱 Android APK vs Browser',
    prompt: 'Kuki Android APK ikenewe kugira ngo WireGuard VPN ikore kandi nayikura he?',
  },
  {
    label: '🇬🇧 Payment & Usage (EN)',
    prompt: 'Explain in English how to pay via MTN MoMo and how to connect the VPN step by step.',
  },
];

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome-msg',
  role: 'model',
  text:
    'Muraho! Ndi AI Assistant wa Mutiganda Yvan VPN v6.\n\n' +
    'Nshobora kugufasha gusobanukirwa:\n' +
    '1. Uko bishyura VIP kuri MTN MoMo (0780949484 · Code 2238763 · Yvan Mutiganda)\n' +
    '2. Uko bakoresha Free Internet / WireGuard VPN kuri SIM Card zose\n' +
    '3. Uko binjiza Redeem Code (+50h / VIP Room) no gukora Keys / Server\n' +
    '4. Gukemura ibibazo byo kwihuza (CONNECT) cyangwa Android APK.\n\n' +
    'Hitamo ikibazo munsi cyangwa wandike icyo wifuza kubaza!',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  clientState,
  onOpenVipPayment,
  onOpenVipRoom,
  onOpenAddServer,
  onOpenApkDownload,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }, [isOpen, messages.length, loading]);

  if (!isOpen) return null;

  const sendMessage = async (questionText?: string) => {
    const clean = (questionText ?? input).trim();
    if (!clean || loading) return;

    if (!questionText) {
      setInput('');
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: clean,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historyForApi = messages
      .filter(m => m.id !== 'welcome-msg' && !m.isError)
      .slice(-10)
      .map(m => ({ role: m.role, text: m.text }));

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await backendApi.askAssistant({
        message: clean,
        history: historyForApi,
        clientState,
      });

      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Ntibishoboye kuvugana na AI Assistant. Genzura internet cyangwa Settings > Secrets.';
      setMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'model',
          text: errMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    soundService.stopVoiceGuide();
    setMessages([INITIAL_WELCOME]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg h-[90vh] sm:h-[82vh] bg-[#050B1A] text-white rounded-t-3xl sm:rounded-3xl border border-blue-500/40 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#050B1A] via-[#1D4ED8]/80 to-[#06B6D4]/40 px-4 py-3.5 border-b border-blue-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#1D4ED8] flex items-center justify-center shadow-md shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black tracking-tight text-white truncate">
                  MYV AI Assistant
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-black uppercase">
                  RW / EN
                </span>
              </div>
              <p className="text-[10px] text-cyan-200 truncate">
                Ubufasha: Kwishyura MoMo · Free Internet · WireGuard · Redeem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Siba ikiganiro"
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                soundService.stopVoiceGuide();
                onClose();
              }}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close AI Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Questions Bar */}
        <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800/90 flex gap-1.5 overflow-x-auto shrink-0">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q.label}
              type="button"
              disabled={loading}
              onClick={() => sendMessage(q.prompt)}
              className="px-2.5 py-1.5 rounded-xl bg-blue-950/70 hover:bg-[#1D4ED8] border border-blue-500/35 text-[11px] font-bold text-cyan-200 hover:text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gradient-to-b from-[#050B1A] to-slate-950 select-text">
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-[#1D4ED8] to-blue-600 text-white rounded-br-sm'
                      : msg.isError
                      ? 'bg-rose-950/70 border border-rose-500/50 text-rose-200 rounded-bl-sm'
                      : 'bg-slate-900/95 border border-blue-500/25 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {msg.isError && (
                    <div className="flex items-center gap-1.5 font-black text-rose-300 mb-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>AI Connection Notice</span>
                    </div>
                  )}
                  <div>{msg.text}</div>
                </div>

                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                  {!isUser && !msg.isError && (
                    <button
                      type="button"
                      onClick={() => soundService.speakText(msg.text)}
                      className="text-[10px] font-bold text-[#06B6D4] hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      title="Umva igisubizo mu ijwi"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Soma mu ijwi</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-cyan-300 bg-slate-900/80 border border-blue-500/25 rounded-2xl px-3.5 py-2.5 w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-[#06B6D4]" />
              <span>AI irimo gutegura igisubizo...</span>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* App Deep-Link Shortcuts */}
        <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/90 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenVipPayment();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-slate-950 text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Crown className="w-3 h-3" />
            <span>Kwishyura VIP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenVipRoom();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Gift className="w-3 h-3" />
            <span>Redeem Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddServer();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Server className="w-3 h-3" />
            <span>+ Server</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenApkDownload();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Android APK</span>
          </button>

          <a
            href="https://wa.me/250787699523"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] text-[10px] font-black flex items-center gap-1 shrink-0"
          >
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Input Composer */}
        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-3 bg-[#050B1A] border-t border-blue-500/30 flex items-center gap-2 shrink-0"
        >
          <div className="flex-1 relative">
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Baza ibyo kwishyura, free internet, cyangwa connect..."
              disabled={loading}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900 border border-blue-500/35 focus:border-[#06B6D4] focus:outline-none text-xs text-white placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] hover:from-blue-600 hover:to-cyan-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ohereza</span>
          </button>
        </form>
      </div>
    </div>
  );
};
