// ── High-Fidelity Human-Quality Text-to-Speech Service ──────────
// Strictly restricted to English & Hindi languages.
// Eliminates audio breaking, avoids browser synthesis stalling,
// and supports graceful task queueing during page explanations.

export interface VoiceOption {
  name: string;
  lang: string;
  label: string;
  recommended?: boolean;
}

export interface QueuedTask {
  action: () => void | Promise<void>;
  label?: string;
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

  // Interruption buffering support for page explanation
  private _isPageExplaining = false;
  private _pageExplainingName = '';
  private _queuedInterruptedTask: QueuedTask | null = null;

  // Queue of sentence utterances for long-text streaming without Chromium 15s freeze
  private _sentenceQueue: string[] = [];
  private _currentSentenceIndex = 0;
  private _sentenceOnEndCallback: (() => void) | null = null;

  constructor() {
    this.initVoices();
  }

  public onStop(cb: () => void): () => void {
    this._stopListeners.add(cb);
    return () => this._stopListeners.delete(cb);
  }

  public repeatLast(): boolean {
    if (!this.lastSpokenText) return false;
    this.speak(this.lastSpokenText, { priority: true });
    return true;
  }

  // ── Page Explanation & Interruption Tracking ──
  public setPageExplaining(val: boolean, pageName = '') {
    this._isPageExplaining = val;
    this._pageExplainingName = pageName;
    if (!val) {
      this._queuedInterruptedTask = null;
    }
  }

  public get isPageExplaining(): boolean {
    return this._isPageExplaining;
  }

  public get pageExplainingName(): string {
    return this._pageExplainingName;
  }

  public queueInterruptedTask(action: () => void | Promise<void>, label?: string): boolean {
    this._queuedInterruptedTask = { action, label };
    console.log(`[SpeechService] 📋 Interrupted task queued while explaining page: "${label || 'action'}"`);
    return true;
  }

  public hasQueuedTask(): boolean {
    return !!this._queuedInterruptedTask;
  }

  public clearQueuedTask() {
    this._queuedInterruptedTask = null;
  }

  public executeQueuedTask(): boolean {
    if (!this._queuedInterruptedTask) return false;
    const task = this._queuedInterruptedTask;
    this._queuedInterruptedTask = null;
    this._isPageExplaining = false;
    console.log(`[SpeechService] 🚀 Executing queued interrupted task: "${task.label || 'action'}"`);
    try {
      task.action();
      return true;
    } catch (err) {
      console.error('[SpeechService] Error executing queued interrupted task:', err);
      return false;
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !this.synth) return;

    const load = () => {
      const raw = this.synth?.getVoices() || [];
      // STRICT TWO-LANGUAGE POLICY: Only English and Hindi voices are allowed.
      this.voices = raw.filter(v => {
        const lang = (v.lang || '').toLowerCase();
        return lang.startsWith('en') || lang.startsWith('hi');
      });
      this.selectBestVoice();
    };

    load();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = load;
    }
  }

  /**
   * Detects whether text contains Devanagari Hindi characters
   */
  public isHindiText(text: string): boolean {
    if (!text) return false;
    // Devanagari Unicode block [\u0900-\u097F]
    return /[\u0900-\u097F]/.test(text);
  }

  /**
   * Selects the optimal voice matching the specific language of the text.
   * Hindi text -> Native Hindi voice (or Indian English fallback).
   * English / Hinglish -> Natural Indian English or Google/Microsoft English.
   */
  public getVoiceForText(text: string): SpeechSynthesisVoice | null {
    if (!this.voices.length) return null;

    const isHindi = this.isHindiText(text);

    if (isHindi) {
      // 1. Try native Hindi voice
      const hindiVoice = this.voices.find(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang.startsWith('hi') || name.includes('hindi') || name.includes('हिन्दी') || name.includes('hemant') || name.includes('kalpana') || name.includes('swara') || name.includes('madhur');
      });
      if (hindiVoice) return hindiVoice;

      // 2. Fallback to Indian English voice which handles Hindi phonetics decently
      const indianVoice = this.voices.find(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang.includes('en-in') || name.includes('india') || name.includes('heera') || name.includes('neerja') || name.includes('ravi') || name.includes('prabhat');
      });
      if (indianVoice) return indianVoice;
    }

    // If user explicitly picked a preferred voice that is currently available
    if (this.preferredVoiceName) {
      const match = this.voices.find(v => v.name === this.preferredVoiceName);
      if (match) return match;
    }

    // Default: use currently selected best English voice
    if (!this.selectedVoice) {
      this.selectBestVoice();
    }
    return this.selectedVoice;
  }

  private selectBestVoice() {
    if (!this.voices.length) return;

    if (this.preferredVoiceName) {
      const match = this.voices.find(v => v.name === this.preferredVoiceName);
      if (match) {
        this.selectedVoice = match;
        return;
      }
    }

    // Curated ranking for English & Indian English voices
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
      const found = this.voices.find(v => test(v) && !v.name.includes('David') && !v.name.includes('Mark'));
      if (found) {
        this.selectedVoice = found;
        return;
      }
    }

    this.selectedVoice = this.voices.find(v => !v.name.includes('David')) || this.voices[0] || null;
  }

  getAvailableVoices(): VoiceOption[] {
    if (!this.voices.length && this.synth) {
      const raw = this.synth.getVoices();
      this.voices = raw.filter(v => {
        const lang = (v.lang || '').toLowerCase();
        return lang.startsWith('en') || lang.startsWith('hi');
      });
      this.selectBestVoice();
    }

    return this.voices.map(v => {
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
      } else if (v.name.includes('Google हिन्दी') || v.lang.startsWith('hi')) {
        label = `${v.name} (Natural Hindi Speech)`;
        recommended = true;
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
    this.rate = rate;
    this.pitch = pitch;
    if (voiceName) {
      this.setVoiceByName(voiceName);
    }
  }

  private _fallbackTimer: any = null;

  setEnabled(v: boolean) { this.enabled = v; }

  get isSpeaking(): boolean {
    return this._isSpeaking;
  }

  /**
   * Splits longer text into natural sentence fragments to prevent Chromium speech freeze
   */
  private splitIntoSentences(text: string): string[] {
    if (!text) return [];
    // Match sentence terminators (. ! ? । \n) while keeping abbreviations reasonably safe
    const raw = text.split(/(?<=[.!?|।\n])\s+/);
    const result: string[] = [];
    for (const chunk of raw) {
      const trimmed = chunk.trim();
      if (trimmed) {
        // If single chunk is exceptionally long (>220 chars without punctuation), split by comma or semi-colon
        if (trimmed.length > 220) {
          const sub = trimmed.split(/(?<=[,;])\s+/);
          result.push(...sub.map(s => s.trim()).filter(Boolean));
        } else {
          result.push(trimmed);
        }
      }
    }
    return result.length > 0 ? result : [text];
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

    if (this._fallbackTimer) {
      clearTimeout(this._fallbackTimer);
      this._fallbackTimer = null;
    }

    // Clear previous queued sentences if priority
    if (priority) {
      this._sentenceQueue = [];
      try {
        this.synth.cancel();
      } catch {}
      this._isSpeaking = false;
    }

    this.lastSpokenText = text;
    const cleaned = this.mathToPhonetic(text);
    if (!cleaned) return;

    // Sentence-level queueing for natural, non-breaking speech
    const sentences = this.splitIntoSentences(cleaned);
    if (sentences.length > 1) {
      this._sentenceQueue = sentences;
      this._currentSentenceIndex = 0;
      this._sentenceOnEndCallback = onEnd || null;
      this.playNextSentence();
      return;
    }

    this.speakSingleUtterance(cleaned, onEnd);
  }

  private playNextSentence() {
    if (!this._sentenceQueue.length || this._currentSentenceIndex >= this._sentenceQueue.length) {
      this._sentenceQueue = [];
      const onEnd = this._sentenceOnEndCallback;
      this._sentenceOnEndCallback = null;
      this._isSpeaking = false;
      this.lastSpeechEndTime = Date.now();

      onEnd?.();

      if (this._queuedInterruptedTask) {
        setTimeout(() => this.executeQueuedTask(), 80);
      } else {
        this._isPageExplaining = false;
      }
      return;
    }

    const currentText = this._sentenceQueue[this._currentSentenceIndex];
    this._currentSentenceIndex++;

    this.speakSingleUtterance(currentText, () => {
      this.playNextSentence();
    });
  }

  private speakSingleUtterance(cleaned: string, onEnd?: () => void) {
    if (!this.synth) return;

    const utt = new SpeechSynthesisUtterance(cleaned);
    utt.rate = this.rate;
    utt.pitch = this.pitch;

    // Dynamic voice selection matching content language (Hindi vs English)
    const voice = this.getVoiceForText(cleaned);
    if (voice) {
      utt.voice = voice;
      utt.lang = voice.lang;
    } else {
      utt.lang = this.isHindiText(cleaned) ? 'hi-IN' : 'en-IN';
    }

    // Retain global reference so Chromium GC doesn't collect utterance and drop onend
    (window as any).__activeUtterance = utt;

    const wordCount = cleaned.split(/\s+/).length;
    const maxDurationMs = Math.max(2500, (wordCount / 1.8) * 1000 + 2000);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (this._fallbackTimer) {
        clearTimeout(this._fallbackTimer);
        this._fallbackTimer = null;
      }
      this._isSpeaking = false;
      this.lastSpeechEndTime = Date.now();
      try { delete (window as any).__activeUtterance; } catch {}

      onEnd?.();

      // If single utterance ended and a task was queued during page explanation
      if (!this._sentenceQueue.length) {
        if (this._queuedInterruptedTask) {
          setTimeout(() => this.executeQueuedTask(), 80);
        } else {
          this._isPageExplaining = false;
        }
      }
    };

    utt.onstart = () => {
      this._isSpeaking = true;
      this._fallbackTimer = setTimeout(finish, maxDurationMs);
    };

    utt.onend = finish;
    utt.onerror = finish;

    this._isSpeaking = true;
    this.synth.speak(utt);
  }

  stop(clearQueue = true) {
    this._sentenceQueue = [];
    this._sentenceOnEndCallback = null;
    if (this._fallbackTimer) {
      clearTimeout(this._fallbackTimer);
      this._fallbackTimer = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
        delete (window as any).__activeUtterance;
      } catch {}
    }
    this._isSpeaking = false;
    if (clearQueue) {
      this._isPageExplaining = false;
      this._queuedInterruptedTask = null;
    }
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
      // Measurement units
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
