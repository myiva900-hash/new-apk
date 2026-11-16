// Web Audio API Sound generator & Voice speech for connect, disconnect, and VIP guide notifications

type GuideStepListener = (stepIndex: number | null) => void;

class SoundService {
  private ctx: AudioContext | null = null;
  private guideListeners: Set<GuideStepListener> = new Set();
  private activeGuideStep: number | null = null;
  private isGuideCancelled = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Pre-warm voices list
      window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => {
        window.speechSynthesis.getVoices();
      });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private pickMaleVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const maleKeywords = [
      'google uk english male',
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
    ];

    const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));

    // 1. Exact match on known male voice names (preferring English)
    for (const kw of maleKeywords) {
      const foundEn = enVoices.find(v => v.name.toLowerCase().includes(kw));
      if (foundEn) return foundEn;
    }
    for (const kw of maleKeywords) {
      const foundAny = voices.find(v => v.name.toLowerCase().includes(kw));
      if (foundAny) return foundAny;
    }

    // 2. Fallback to non-female English voice
    const femaleKeywords = ['female', 'zira', 'hazel', 'susan', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'aria', 'jenny', 'sonia', 'libby', 'fiona', 'eva'];
    const neutralEn = enVoices.find(
      v => !femaleKeywords.some(fk => v.name.toLowerCase().includes(fk))
    );
    if (neutralEn) return neutralEn;

    return enVoices[0] || voices[0] || null;
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

  stopVoiceGuide() {
    this.isGuideCancelled = true;
    this.setGuideStep(null);
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

    // 1. Warm welcoming chime
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
      // Ignore audio errors
    }

    // 2. Spoken male voice step-by-step payment guide starting with "Welcome"
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      const steps = [
        'Welcome to Mutiganda Yvan VPN VIP Premium! Listen carefully to the step by step process on how to pay and activate your unlimited internet for all countries and all SIM cards.',
        'Step 1: Choose your VIP package. One week is 2,000 Rwandan Francs. Two months VIP is 12,000 Francs. Three years Ultra VIP is 35,000 Francs.',
        'Step 2: Open MTN Mobile Money on your phone. Pay using MoMo Pay Code 2 2 3 8 7 6 3 by dialing star 1 8 2 star 8 star 1 star 2 2 3 8 7 6 3 hash, or transfer directly to 0 7 8 0, 9 4 9, 4 8 4.',
        'Step 3: Check and confirm that the registered account name is Yvan Mutiganda, then enter your PIN to complete payment.',
        'Step 4: Take a screenshot of your payment confirmation message and tap Send Screenshot on WhatsApp for instant VIP activation.'
      ];

      const maleVoice = this.pickMaleVoice();

      const speakStep = (index: number) => {
        if (this.isGuideCancelled || index >= steps.length) {
          this.setGuideStep(null);
          return;
        }

        this.setGuideStep(index);
        const utterance = new SpeechSynthesisUtterance(steps[index]);
        if (maleVoice) {
          utterance.voice = maleVoice;
        }
        // Lower pitch + steady cadence for a clear authoritative male voice
        utterance.pitch = 0.78;
        utterance.rate = 0.94;
        utterance.volume = 1.0;

        utterance.onend = () => {
          if (!this.isGuideCancelled) {
            speakStep(index + 1);
          }
        };

        utterance.onerror = () => {
          if (!this.isGuideCancelled) {
            this.setGuideStep(null);
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      speakStep(0);
    } catch {
      this.setGuideStep(null);
    }
  }

  playConnect() {
    // 1. Play professional chime
    try {
      const ctx = this.getContext();
      if (ctx) {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(440, now); // A4
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

        osc2.frequency.setValueAtTime(554.37, now + 0.08); // C#5
        osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.25); // C#6

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
      // Audio playback silently ignored if blocked by browser policy
    }

    // 2. Play spoken voice saying "Connected" as explicitly requested by user
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.isGuideCancelled = true;
        this.setGuideStep(null);
        window.speechSynthesis.cancel(); // Stop any pending speech
        const utterance = new SpeechSynthesisUtterance('Connected');
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        const englishVoice = this.pickMaleVoice();
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Silently ignore if blocked
    }
  }

  playDisconnect() {
    // 1. Play gentle descending chime
    try {
      const ctx = this.getContext();
      if (ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.25); // E4

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

    // 2. Play spoken voice saying "Disconnected"
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.isGuideCancelled = true;
        this.setGuideStep(null);
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Disconnected');
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        utterance.volume = 0.9;
        const englishVoice = this.pickMaleVoice();
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Ignore
    }
  }
}

export const soundService = new SoundService();
