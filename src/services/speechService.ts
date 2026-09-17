// ── High-Fidelity Human-Quality Text-to-Speech Service ──────────
export interface VoiceOption {
  name: string;
  lang: string;
  label: string;
  recommended?: boolean;
}

class SpeechService {
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private rate = 0.96;   // Relaxed, natural conversational pacing (not rushed)
  private pitch = 0.96;  // Warm, gentle tone (not shrill or piercing)
  private enabled = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private preferredVoiceName: string = '';
  private _isSpeaking = false;
  private _stopListeners = new Set<() => void>();
  public lastSpeechEndTime = 0;
  public lastSpokenText: string = '';

  constructor() {
    this.initVoices();
  }

  public onStop(cb: () => void): () => void {
    this._stopListeners.add(cb);
    return () => this._stopListeners.delete(cb);
  }

  repeatLast(): boolean {
    if (!this.lastSpokenText) return false;
    this.speak(this.lastSpokenText, { priority: true });
    return true;
  }

  private initVoices() {
    if (typeof window === 'undefined' || !this.synth) return;

    const load = () => {
      this.voices = this.synth?.getVoices() || [];
      this.selectBestVoice();
    };

    load();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = load;
    }
  }

  private selectBestVoice() {
    if (!this.voices.length) return;

    // If user explicitly picked a preferred voice that exists, use it
    if (this.preferredVoiceName) {
      const match = this.voices.find(v => v.name === this.preferredVoiceName);
      if (match) {
        this.selectedVoice = match;
        return;
      }
    }

    // Curated high-fidelity voice ranking for both Edge & Chrome:
    // - Edge Natural/Online voices (Neerja, Prabhat, Sonia)
    // - Google UK / US voices in Chrome
    // - Microsoft Heera / Zira / Ravi desktop voices
    const ranking = [
      (v: SpeechSynthesisVoice) => (v.name.includes('Natural') || v.name.includes('Online')) && (v.lang.startsWith('en-IN') || v.name.includes('India')),
      (v: SpeechSynthesisVoice) => v.name.includes('Google UK English Female'),
      (v: SpeechSynthesisVoice) => (v.name.includes('Natural') || v.name.includes('Online')) && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.name.includes('Heera') && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.name.includes('Google US English'),
      (v: SpeechSynthesisVoice) => v.name.includes('Zira'),
      (v: SpeechSynthesisVoice) => v.name.includes('Google UK English Male'),
      (v: SpeechSynthesisVoice) => v.name.includes('Ravi') && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.name.includes('Google') && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en-IN'),
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en-GB'),
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en-US'),
    ];

    for (const test of ranking) {
      // Exclude harsh robotic desktop voices (David/Mark)
      const found = this.voices.find(v => test(v) && !v.name.includes('David') && !v.name.includes('Mark'));
      if (found) {
        this.selectedVoice = found;
        return;
      }
    }

    // Fallback: any voice that is not David
    this.selectedVoice = this.voices.find(v => !v.name.includes('David')) || this.voices[0] || null;
  }

  getAvailableVoices(): VoiceOption[] {
    if (!this.voices.length && this.synth) {
      this.voices = this.synth.getVoices();
      this.selectBestVoice();
    }

    // Return English & Hindi friendly options
    const filtered = this.voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('hi'));
    
    return filtered.map(v => {
      let label = v.name;
      let recommended = false;

      if (v.name.includes('Google UK English Female')) {
        label = 'Google UK Female (Warm & Natural — Recommended)';
        recommended = true;
      } else if (v.name.includes('Heera')) {
        label = 'Microsoft Heera (Indian English — Gentle & Clear)';
        recommended = true;
      } else if (v.name.includes('Google US English')) {
        label = 'Google US English (Clear & Natural)';
      } else if (v.name.includes('Zira')) {
        label = 'Microsoft Zira (Soft American English)';
      } else if (v.name.includes('Google UK English Male')) {
        label = 'Google UK Male (Calm & Professional)';
      } else if (v.name.includes('Ravi')) {
        label = 'Microsoft Ravi (Indian English Male)';
      } else if (v.name.includes('Google हिन्दी')) {
        label = 'Google Hindi (Natural Hindi Speech)';
      }

      return {
        name: v.name,
        lang: v.lang,
        label,
        recommended,
      };
    });
  }

  getCurrentVoice(): SpeechSynthesisVoice | null {
    if (!this.selectedVoice) this.selectBestVoice();
    return this.selectedVoice;
  }

  setVoiceByName(name: string) {
    this.preferredVoiceName = name;
    const match = this.voices.find(v => v.name === name);
    if (match) {
      this.selectedVoice = match;
    }
  }

  configure(rate: number, pitch: number, voiceName?: string) {
    // Keep rate in pleasant range (0.85 – 1.1) and pitch gently warm (0.9 – 1.05)
    this.rate = rate;
    this.pitch = pitch;
    if (voiceName) {
      this.setVoiceByName(voiceName);
    }
  }

  setEnabled(v: boolean) { this.enabled = v; }

  get isSpeaking(): boolean {
    return this._isSpeaking || (typeof window !== 'undefined' && !!window.speechSynthesis?.speaking);
  }

  speak(
    text: string,
    priorityOrOptions: boolean | { priority?: boolean; onEnd?: () => void | Promise<void> } = false,
    callbackOnEnd?: () => void
  ): void {
    if (!this.enabled || !this.synth) return;

    let priority = false;
    let onEnd = callbackOnEnd;

    if (typeof priorityOrOptions === 'object' && priorityOrOptions !== null) {
      priority = !!priorityOrOptions.priority;
      if (priorityOrOptions.onEnd) {
        onEnd = () => { priorityOrOptions.onEnd?.(); };
      }
    } else {
      priority = !!priorityOrOptions;
    }

    if (priority) {
      this.synth.cancel();
      this._isSpeaking = false;
    }

    this.lastSpokenText = text;

    if (!this.selectedVoice) {
      this.selectBestVoice();
    }

    const cleaned = this.mathToPhonetic(text);
    const utt = new SpeechSynthesisUtterance(cleaned);

    utt.rate = this.rate;
    utt.pitch = this.pitch;

    if (this.selectedVoice) {
      utt.voice = this.selectedVoice;
      utt.lang = this.selectedVoice.lang;
    } else {
      utt.lang = 'en-IN';
    }

    // Retain global reference so Chromium GC doesn't collect the utterance and drop onend
    (window as any).__activeUtterance = utt;

    const wordCount = cleaned.split(/\s+/).length;
    const maxDurationMs = Math.max(3000, (wordCount / 2.0) * 1000 + 2000);

    let finished = false;
    let fallbackTimer: any = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      this._isSpeaking = false;
      this.lastSpeechEndTime = Date.now();
      try { delete (window as any).__activeUtterance; } catch {}
      onEnd?.();
    };

    utt.onstart = () => {
      this._isSpeaking = true;
      fallbackTimer = setTimeout(finish, maxDurationMs);
    };

    utt.onend = finish;
    utt.onerror = finish;

    this.synth.speak(utt);
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
        delete (window as any).__activeUtterance;
      } catch {}
    }
    this._isSpeaking = false;
    this.lastSpeechEndTime = Date.now();
    this._stopListeners.forEach(cb => {
      try { cb(); } catch (err) { console.error('[SpeechService] onStop listener error:', err); }
    });
  }

  public mathToPhonetic(text: string): string {
    if (!text) return '';
    return text
      // Currency and Percentages
      .replace(/₹\s*(\d[\d,]*)/g, '$1 rupees')
      .replace(/Rs\.?\s*(\d[\d,]*)/gi, '$1 rupees')
      .replace(/(\d+)\s*%/g, '$1 percent')
      .replace(/\$/g, 'dollars ')
      // LaTeX math fractions & roots
      .replace(/\\frac\{1\}\{2\}/g, 'one half')
      .replace(/\\frac\{1\}\{3\}/g, 'one third')
      .replace(/\\frac\{2\}\{3\}/g, 'two thirds')
      .replace(/\\frac\{1\}\{4\}/g, 'one fourth')
      .replace(/\\frac\{3\}\{4\}/g, 'three fourths')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
      // Measurement units (must precede standalone ² and ³)
      .replace(/cm³/g, ' cubic centimeters ')
      .replace(/m³\b/g, ' cubic meters ')
      .replace(/cm²\b/g, ' square centimeters ')
      .replace(/m²\b/g, ' square meters ')
      .replace(/km²\b/g, ' square kilometers ')
      .replace(/m\/s²\b/g, ' meters per second squared ')
      .replace(/m\/s\b/g, ' meters per second ')
      .replace(/km\/h\b/g, ' kilometers per hour ')
      .replace(/p\.a\.?/gi, ' per annum ')
      // Fractions & ratios
      .replace(/\b1\/2\b/g, 'one half')
      .replace(/\b1\/3\b/g, 'one third')
      .replace(/\b2\/3\b/g, 'two thirds')
      .replace(/\b1\/4\b/g, 'one fourth')
      .replace(/\b3\/4\b/g, 'three fourths')
      .replace(/(\d+)\/(\d+)/g, '$1 over $2')
      // Subscripts and powers
      .replace(/([a-zA-Z0-9])\^2\b/g, '$1 squared')
      .replace(/([a-zA-Z0-9])\^3\b/g, '$1 cubed')
      .replace(/([a-zA-Z0-9])\^([a-zA-Z0-9]+)/g, '$1 to the power $2')
      .replace(/²/g, ' squared')
      .replace(/³/g, ' cubed')
      .replace(/⁴/g, ' to the power 4')
      // Roots & operators
      .replace(/√\s*(\w+)/g, 'square root of $1')
      .replace(/√/g, 'square root of ')
      .replace(/±/g, ' plus or minus ')
      .replace(/×/g, ' multiplied by ')
      .replace(/÷/g, ' divided by ')
      .replace(/≠/g, ' is not equal to ')
      .replace(/≈/g, ' is approximately equal to ')
      .replace(/≥/g, ' greater than or equal to ')
      .replace(/≤/g, ' less than or equal to ')
      .replace(/∞/g, ' infinity ')
      .replace(/∑/g, ' sum of ')
      // Greek variables in competitive exams
      .replace(/π/g, ' pi ')
      .replace(/θ/g, ' theta ')
      .replace(/α/g, ' alpha ')
      .replace(/β/g, ' beta ')
      .replace(/Δ/g, ' delta ')
      .replace(/λ/g, ' lambda ')
      // Question Roman numbering
      .replace(/\(i\)/gi, ' part 1 ')
      .replace(/\(ii\)/gi, ' part 2 ')
      .replace(/\(iii\)/gi, ' part 3 ')
      .replace(/\(iv\)/gi, ' part 4 ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  isAvailable() { return typeof window !== 'undefined' && 'speechSynthesis' in window; }
}

export const speechService = new SpeechService();

// Chromium / Edge SpeechSynthesis Heartbeat to prevent premature audio stalling
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);
}

