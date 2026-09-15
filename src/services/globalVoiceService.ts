// ── Global Voice Service ────────────────────────────────────────────
// ONE Whisper/Chrome connection for the ENTIRE app.
// Pages don't manage low-level mic streaming — they register Q&A handlers.

import { whisperVoiceService } from './whisperVoiceService';
import { speechService } from './speechService';

export type TranscriptHandler = (text: string) => boolean; // return true = handled
export type EngineType = 'whisper' | 'chrome' | 'none';

class GlobalVoiceService {
  private _active = false;
  private _engine: EngineType = 'none';
  private _handlers: TranscriptHandler[] = [];
  private _lastSpoken = '';
  private _lastTranscript = '';
  private _lastDispatchedText = '';
  private _lastDispatchTime = 0;
  private _startId = 0;
  private _chromeRec: any = null;
  private _chromeRestartTimer: any = null;
  private _chromeStopped = false;

  private _engineListeners = new Set<(engine: EngineType) => void>();
  private _transcriptListeners = new Set<(text: string) => void>();
  private _statusListeners = new Set<(status: string) => void>();

  /** Register a transcript handler. Returns unregister fn. */
  register(handler: TranscriptHandler): () => void {
    this._handlers.push(handler);
    return () => {
      this._handlers = this._handlers.filter(h => h !== handler);
    };
  }

  subscribeEngine(cb: (engine: EngineType) => void): () => void {
    this._engineListeners.add(cb);
    cb(this._engine);
    return () => this._engineListeners.delete(cb);
  }

  subscribeTranscript(cb: (text: string) => void): () => void {
    this._transcriptListeners.add(cb);
    return () => this._transcriptListeners.delete(cb);
  }

  subscribeStatus(cb: (status: string) => void): () => void {
    this._statusListeners.add(cb);
    cb(this._statusListeners.size ? 'Listening' : 'Ready');
    return () => this._statusListeners.delete(cb);
  }

  private _setEngine(engine: EngineType) {
    this._engine = engine;
    this._engineListeners.forEach(cb => cb(engine));
  }

  private _setStatus(status: string) {
    this._statusListeners.forEach(cb => cb(status));
  }

  getEngine(): EngineType {
    return this._engine;
  }

  recordSpoken(text: string) {
    this._lastSpoken = text;
  }

  getLastSpoken(): string {
    return this._lastSpoken;
  }

  getLastTranscript(): string {
    return this._lastTranscript;
  }

  isActive(): boolean {
    return this._active;
  }

  /** Speak using text-to-speech, recording what was said for repeat command */
  speak(text: string, priority = true) {
    this.recordSpoken(text);
    speechService.speak(text, { priority });
  }

  /** Start global voice — called once from VoiceAssistantProvider */
  async start() {
    if (this._active) return;
    this._active = true;
    this._startId++;
    const myId = this._startId;

    console.log('[GlobalVoice] 🎙️ Starting Voice Assistant...');
    this._setStatus('Connecting...');

    const available = await whisperVoiceService.isServerAvailable();
    if (!this._active || myId !== this._startId) return;

    if (available) {
      console.log('[GlobalVoice] ✅ Using Python Whisper engine');
      this._stopChrome();
      this._setEngine('whisper');
      this._setStatus('Listening (Whisper AI)');
      whisperVoiceService.start(
        (text) => this._dispatch(text),
        (status) => {
          console.log('[GlobalVoice] Whisper status:', status);
          if (status === 'ready' || status === 'listening') {
            this._stopChrome();
            this._setEngine('whisper');
            this._setStatus('Listening (Whisper AI)');
          } else if (status === 'error') {
            if (this._engine !== 'chrome') {
              console.warn('[GlobalVoice] Whisper error → Chrome fallback');
              this._startChrome();
            }
          }
        }
      );
    } else {
      console.log('[GlobalVoice] ⚠️ Whisper unavailable → Chrome Speech API fallback');
      this._startChrome();
    }
  }

  /** Stop global voice */
  stop() {
    this._active = false;
    this._startId++;
    this._chromeStopped = true;
    whisperVoiceService.stop();
    this._stopChrome();
    this._setEngine('none');
    this._setStatus('Muted');
  }

  private _dispatch(rawText: string) {
    const text = rawText.trim();
    if (!text) return;

    // Debounce duplicate transcripts arriving within 600ms
    const now = Date.now();
    if (text === this._lastDispatchedText && now - this._lastDispatchTime < 600) {
      return;
    }
    this._lastDispatchedText = text;
    this._lastDispatchTime = now;

    console.log('[GlobalVoice] 🗣️ Transcript:', `"${text}"`);
    this._lastTranscript = text;
    this._transcriptListeners.forEach(cb => cb(text));

    // Run handlers in reverse (newest/most specific page handler gets first pick)
    const handlersCopy = [...this._handlers].reverse();
    for (const handler of handlersCopy) {
      if (handler(text)) {
        return; // successfully handled!
      }
    }
  }

  private _startChrome() {
    if (!this._active || this._engine === 'whisper') return;
    this._chromeStopped = false;
    this._setEngine('chrome');
    this._setStatus('Listening (Browser Speech)');

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[GlobalVoice] Chrome Speech API not available in this browser');
      this._setEngine('none');
      this._setStatus('Speech API not supported');
      return;
    }

    const tryStart = () => {
      if (!this._active || this._chromeStopped || this._engine === 'whisper') return;
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-IN';
        rec.maxAlternatives = 3;

        rec.onstart = () => {
          if (this._engine === 'whisper' || this._chromeStopped) {
            try { rec.abort(); } catch {}
            return;
          }
          this._setStatus('Listening (Browser Speech)');
        };

        rec.onresult = (e: any) => {
          let phrase = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            phrase += ' ' + e.results[i][0].transcript;
          }
          const clean = phrase
            .trim()
            .toLowerCase()
            .replace(/[.,!?;:\-_'"`~।]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (clean) this._dispatch(clean);
        };

        rec.onerror = (e: any) => {
          if (e.error === 'aborted' || e.error === 'no-speech') {
            return; // ignore normal abort or silence
          }
          console.warn('[GlobalVoice] Chrome speech error:', e.error);
        };

        rec.onend = () => {
          this._chromeRec = null;
          if (this._active && !this._chromeStopped && this._engine === 'chrome') {
            this._chromeRestartTimer = setTimeout(tryStart, 600);
          }
        };

        this._chromeRec = rec;
        rec.start();
      } catch (err) {
        console.warn('[GlobalVoice] Chrome speech start error:', err);
      }
    };

    tryStart();
  }

  private _stopChrome() {
    this._chromeStopped = true;
    if (this._chromeRestartTimer) {
      clearTimeout(this._chromeRestartTimer);
      this._chromeRestartTimer = null;
    }
    if (this._chromeRec) {
      try {
        this._chromeRec.onend = null;
        this._chromeRec.onerror = null;
        this._chromeRec.abort();
      } catch {}
      this._chromeRec = null;
    }
  }
}

export const globalVoiceService = new GlobalVoiceService();
