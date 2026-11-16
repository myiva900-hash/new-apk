// Web Audio API Sound generator & Offline-capable Voice speech for connect, disconnect, and VIP guide notifications

type GuideStepListener = (stepIndex: number | null) => void;

const VIP_GUIDE_STEPS = [
  'Welcome to Mutiganda Yvan VPN VIP Premium! Listen carefully to the step by step process on how to pay and activate your unlimited internet for all countries and all SIM cards.',
  'Step 1: Choose your VIP package. One week is 2,000 Rwandan Francs. Two months VIP is 12,000 Francs. Three years Ultra VIP is 35,000 Francs.',
  'Step 2: Open MTN Mobile Money on your phone. Pay using MoMo Pay Code 2 2 3 8 7 6 3 by dialing star 1 8 2 star 8 star 1 star 2 2 3 8 7 6 3 hash, or transfer directly to 0 7 8 0, 9 4 9, 4 8 4.',
  'Step 3: Check and confirm that the registered account name is Yvan Mutiganda, then enter your PIN to complete payment.',
  'Step 4: Take a screenshot of your payment confirmation message and tap Send Screenshot on WhatsApp for instant VIP activation.',
];

class SoundService {
  private ctx: AudioContext | null = null;
  private guideListeners: Set<GuideStepListener> = new Set();
  private activeGuideStep: number | null = null;
  private isGuideCancelled = false;
  private stepTimerId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Pre-warm voices list immediately so offline voices are ready on first tap
      window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => {
        window.speechSynthesis.getVoices();
      });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private pickMaleVoice(preferOfflineLocalOnly: boolean): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const allVoices = window.speechSynthesis.getVoices();
    if (!allVoices || allVoices.length === 0) return null;

    // On phones offline (no internet), Google/Microsoft cloud voices (localService === false) fail silently!
    // Always prefer localService === true first so voice works 100% offline and online.
    const localVoices = allVoices.filter(v => v.localService);
    const pool =
      localVoices.length > 0
        ? localVoices
        : preferOfflineLocalOnly
        ? []
        : allVoices;

    if (pool.length === 0) return null;

    const maleKeywords = [
      'david',
      'mark',
      'guy',
      'daniel',
      'george',
      'ryan',
      'andrew',
      'brian',
      'christopher',
      'eric',
      'steffan',
      'roger',
      'thomas',
      'oliver',
      'alex',
      'fred',
      'aaron',
      'arthur',
      'james',
      'male',
      'en-us',
      'en-gb',
    ];

    const enVoices = pool.filter(v => v.lang.toLowerCase().startsWith('en'));

    for (const kw of maleKeywords) {
      const foundEn = enVoices.find(v => v.name.toLowerCase().includes(kw));
      if (foundEn) return foundEn;
    }
    for (const kw of maleKeywords) {
      const foundAny = pool.find(v => v.name.toLowerCase().includes(kw));
      if (foundAny) return foundAny;
    }

    const femaleKeywords = [
      'female',
      'zira',
      'hazel',
      'susan',
      'samantha',
      'victoria',
      'karen',
      'moira',
      'tessa',
      'aria',
      'jenny',
      'sonia',
      'libby',
      'fiona',
      'eva',
    ];
    const neutralEn = enVoices.find(
      v => !femaleKeywords.some(fk => v.name.toLowerCase().includes(fk))
    );
    if (neutralEn) return neutralEn;

    return enVoices[0] || pool[0] || null;
  }

  public handleNativeTtsStep(step: number | null) {
    if (this.isGuideCancelled && step !== null) return;
    this.setGuideStep(step);
  }

  private setGuideStep(step: number | null) {
    this.activeGuideStep = step;
    this.guideListeners.forEach(cb => cb(step));
  }

  subscribeGuideStep(listener: GuideStepListener): () => void {
    this.guideListeners.add(listener);
    listener(this.activeGuideStep);
    return () => {
      this.guideListeners.delete(listener);
    };
  }

  private clearStepTimer() {
    if (this.stepTimerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.stepTimerId);
      this.stepTimerId = null;
    }
  }

  private playWelcomeChime() {
    try {
      const ctx = this.getContext();
      if (ctx) {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const start = now + idx * 0.08;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.01, start);
          gain.gain.linearRampToValueAtTime(0.16, start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.36);
        });
      }
    } catch {
      // Ignore audio context errors
    }
  }

  private speakPhraseOfflineSafe(text: string, opts?: { rate?: number; pitch?: number }) {
    // 1. Native Android APK offline TextToSpeech (works 100% with zero internet)
    if (typeof window !== 'undefined' && window.AndroidVpn?.speakOffline) {
      try {
        if (window.AndroidVpn.isOfflineTtsAvailable?.() !== false) {
          window.AndroidVpn.speakOffline(text);
          return;
        }
      } catch {
        // Fallback to Web Speech below
      }
    }

    // 2. Browser / WebView SpeechSynthesis using local offline voices first
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const voice = this.pickMaleVoice(isOffline);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = 'en-US';
      utterance.rate = opts?.rate ?? 1.0;
      utterance.pitch = opts?.pitch ?? 0.84;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore
    }
  }

  speakText(text: string) {
    const clean = text.replace(/[*_`#>-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    this.speakPhraseOfflineSafe(clean, { rate: 0.96, pitch: 0.9 });
  }

  stopVoiceGuide() {
    this.isGuideCancelled = true;
    this.clearStepTimer();
    this.setGuideStep(null);
    try {
      window.AndroidVpn?.stopSpeakOffline?.();
    } catch {
      // Ignore
    }
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore
    }
  }

  playVipWelcomeGuide() {
    this.isGuideCancelled = false;
    this.clearStepTimer();

    // 1. Play warm welcome chime (always works offline via WebAudio)
    this.playWelcomeChime();

    // 2. Inside Android APK: use built-in Android TextToSpeech (100% offline guaranteed)
    if (typeof window !== 'undefined' && window.AndroidVpn?.speakOffline) {
      try {
        if (window.AndroidVpn.isOfflineTtsAvailable?.() !== false) {
          this.setGuideStep(0);
          window.AndroidVpn.speakOffline(JSON.stringify(VIP_GUIDE_STEPS));
          return;
        }
      } catch {
        // Fallback below
      }
    }

    // 3. Browser / WebView SpeechSynthesis with offline-safe local voice + retry guard
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.runSilentStepFallback();
        return;
      }

      window.speechSynthesis.cancel();
      // Resume if browser left speechSynthesis paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const preferredVoice = this.pickMaleVoice(isOffline);
      const fallbackLocalVoice = this.pickMaleVoice(true);

      const speakStep = (index: number, forceNoVoiceObj = false) => {
        if (this.isGuideCancelled || index >= VIP_GUIDE_STEPS.length) {
          this.setGuideStep(null);
          return;
        }

        this.setGuideStep(index);
        const utterance = new SpeechSynthesisUtterance(VIP_GUIDE_STEPS[index]);
        utterance.lang = 'en-US';

        if (!forceNoVoiceObj) {
          const chosen = preferredVoice || fallbackLocalVoice;
          if (chosen) {
            utterance.voice = chosen;
          }
        }

        // Lower pitch + steady cadence for a clear authoritative male voice
        utterance.pitch = 0.78;
        utterance.rate = 0.94;
        utterance.volume = 1.0;

        let advanced = false;
        const advanceNext = () => {
          if (advanced || this.isGuideCancelled) return;
          advanced = true;
          this.clearStepTimer();
          speakStep(index + 1, forceNoVoiceObj);
        };

        utterance.onend = () => {
          advanceNext();
        };

        utterance.onerror = () => {
          if (this.isGuideCancelled || advanced) return;
          // If chosen voice failed (e.g. online Google voice while phone is offline), retry with OS default offline engine!
          if (!forceNoVoiceObj) {
            advanced = true;
            this.clearStepTimer();
            speakStep(index, true);
            return;
          }
          // Otherwise progress visual step guide smoothly
          this.stepTimerId = window.setTimeout(advanceNext, 4500);
        };

        window.speechSynthesis.speak(utterance);
      };

      speakStep(0);
    } catch {
      this.runSilentStepFallback();
    }
  }

  private runSilentStepFallback() {
    let idx = 0;
    const next = () => {
      if (this.isGuideCancelled || idx >= VIP_GUIDE_STEPS.length) {
        this.setGuideStep(null);
        return;
      }
      this.setGuideStep(idx);
      idx += 1;
      this.stepTimerId = window.setTimeout(next, 4500);
    };
    next();
  }

  playConnect() {
    try {
      const ctx = this.getContext();
      if (ctx) {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(440, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        osc2.frequency.setValueAtTime(554.37, now + 0.08);
        osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.25);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.45);
      }
    } catch {
      // Ignore
    }

    this.isGuideCancelled = true;
    this.clearStepTimer();
    this.setGuideStep(null);
    this.speakPhraseOfflineSafe('Connected', { rate: 1.0, pitch: 0.95 });
  }

  playDisconnect() {
    try {
      const ctx = this.getContext();
      if (ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.25);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      // Ignore
    }

    this.isGuideCancelled = true;
    this.clearStepTimer();
    this.setGuideStep(null);
    this.speakPhraseOfflineSafe('Disconnected', { rate: 1.0, pitch: 0.9 });
  }
}

export const soundService = new SoundService();
