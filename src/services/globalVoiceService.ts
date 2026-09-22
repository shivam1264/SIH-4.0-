// ── Global Voice Service ────────────────────────────────────────────
// ONE Whisper/Chrome connection for the ENTIRE app.
// Pages don't manage low-level mic streaming — they register Q&A handlers.

import { hybridSttService, SttResult, SttVoiceState } from './hybridSttService';
import { groqVoiceService } from './groqVoiceService';
import { whisperVoiceService } from './whisperVoiceService';
import { speechService } from './speechService';
import { drishtiActionService } from './drishtiActionService';

export type TranscriptHandler = (text: string, parsedCommand?: any) => boolean | Promise<boolean>; // return true = handled
export type EngineType = 'groq' | 'whisper' | 'chrome' | 'none';

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
  private _interimDispatchTimer: any = null;
  private _lastInterimText = '';

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

    console.log('[GlobalVoice] 🎙️ Starting Voice Assistant with Hybrid Failover Engine (Groq Primary -> Local Whisper Fallback)...');
    this._setStatus('Connecting...');

    try {
      this._stopChrome();
      this._setEngine('groq');
      this._setStatus('Listening (Cloud AI)');

      await hybridSttService.start(
        (result: SttResult) => {
          if (result.success && result.text) {
            this._setEngine(result.provider === 'local' ? 'whisper' : 'groq');
            this._dispatch(result.text, result.command);
          }
        },
        (state: SttVoiceState, message?: string) => {
          if (state === 'LISTENING') {
            const engineLabel = this._engine === 'whisper' ? 'Listening (Offline Whisper)' : 'Listening (Cloud AI)';
            this._setStatus(engineLabel);
          } else if (state === 'PROCESSING') {
            this._setStatus('Processing voice...');
          } else if (state === 'FALLBACK') {
            this._setEngine('whisper');
            this._setStatus('Using offline speech recognition...');
          } else if (state === 'SUCCESS') {
            this._setStatus(message || '✓ Voice recognized');
          } else if (state === 'ERROR') {
            this._setStatus(message || 'Speech recognition unavailable');
          }
        }
      );
      return;
    } catch (err) {
      console.warn('[GlobalVoice] Hybrid STT service error → Chrome Speech API fallback', err);
      if (this._active && myId === this._startId) {
        this._startChrome();
      }
    }
  }

  /** Stop global voice */
  stop() {
    this._active = false;
    this._startId++;
    this._chromeStopped = true;
    hybridSttService.stop();
    groqVoiceService.stop();
    whisperVoiceService.stop();
    this._stopChrome();
    this._setEngine('none');
    this._setStatus('Muted');
  }

  private async _runHandlers(text: string, parsedCommand?: any): Promise<boolean> {
    const handlersCopy = [...this._handlers].reverse();
    for (const handler of handlersCopy) {
      try {
        const handled = await handler(text, parsedCommand);
        if (handled) {
          return true; // successfully handled!
        }
      } catch (err) {
        console.error('[GlobalVoice] Handler error:', err);
      }
    }
    return false;
  }

  private async _dispatch(rawText: string, parsedCommand?: any) {
    const text = rawText.trim();
    if (!text) return;

    const lower = text.toLowerCase();

    // ── Check for explicit standalone stop commands ──
    const isStopCommand =
      parsedCommand?.action === 'STOP_VOICE' ||
      /^(?:stop|ruko|ruk\s*jao|chup|pause|cancel|shant|quiet|रुको|रुक\s*जाओ|चुप|शांत)$/i.test(lower) ||
      /\b(stop\s+speaking|stop\s+talking|chup\s+ho\s+jao|chup\s+raho|shant\s+ho\s+jao|stop\s+audio|mute\s+audio|audio\s+stop|speech\s+stop)\b/i.test(lower);

    if (isStopCommand) {
      console.log('[GlobalVoice] 🛑 Explicit stop command received:', text);
      speechService.stop(true);
      this._lastTranscript = text;
      this._transcriptListeners.forEach(cb => cb(text));
      speechService.speak('Stopped.', { priority: true });
      return;
    }

    // ── Intelligent Interruption Handling ──
    // When the assistant is currently explaining page details / briefing:
    if (speechService.isSpeaking && speechService.isPageExplaining) {
      // 1. Directional scrolling & auto-scroll commands run immediately without stopping speech:
      const isScrollDown =
        parsedCommand?.action === 'SCROLL_DOWN' ||
        /\b(scroll\s+(?:the\s+page\s+)?down|scroll\s+down|neeche\s+scroll|scroll\s+neeche|niche\s+scroll|scroll\s+niche|page\s+down|neeche\s+jao|niche\s+jao|neeche\s+karo|niche\s+karo|thoda\s+niche|thoda\s+neeche|aur\s+niche|aur\s+neeche|aur\s+scroll|scroll\s+a\s+bit|scroll\s+further|नीचे\s*स्क्रॉल|नीचे\s*करो|नीचे\s*जाओ|थोड़ा\s*नीचे|और\s*नीचे)\b/i.test(lower);

      const isScrollUp =
        parsedCommand?.action === 'SCROLL_UP' ||
        /\b(scroll\s+(?:the\s+)?(?:page\s+)?up|scroll\s+up|upar\s+scroll|scroll\s+upar|oopar\s+scroll|page\s+up|upar\s+jao|oopar\s+jao|upar\s+karo|oopar\s+karo|thoda\s+upar|thoda\s+oopar|aur\s+upar|aur\s+oopar|ऊपर\s*स्क्रॉल|ऊपर\s*करो|ऊपर\s*जाओ|थोड़ा\s*ऊपर|और\s*ऊपर)\b/i.test(lower);

      const isScrollTop =
        parsedCommand?.action === 'SCROLL_TOP' ||
        /\b(scroll\s+(?:to\s+(?:the\s+)?)?top|go\s+to\s+(?:the\s+)?top|sabse\s+upar\s+jao|sabse\s+upar|top\s+par\s+jao|top\s+pe\s+jao|top\s+par|shuru\s+me\s+jao|ekdam\s+upar|ek\s+dam\s+upar|सबसे\s*ऊपर|टॉप\s*पर|एकदम\s*ऊपर)\b/i.test(lower);

      const isScrollBottom =
        parsedCommand?.action === 'SCROLL_BOTTOM' ||
        /\b(scroll\s+(?:to\s+(?:the\s+)?)?bottom|go\s+to\s+(?:the\s+)?bottom|sabse\s+neeche\s+jao|sabse\s+neeche|sabse\s+niche\s+jao|sabse\s+niche|bottom\s+par\s+jao|bottom\s+pe\s+jao|bottom\s+par|aakhri\s+me\s+jao|last\s+me\s+jao|ekdam\s+niche|ek\s+dam\s+niche|ekdam\s+neeche|ek\s+dam\s+neeche|सबसे\s*नीचे|बॉटम\s*पर|एकदम\s*नीचे)\b/i.test(lower);

      const isAutoScrollStart =
        parsedCommand?.action === 'AUTO_SCROLL_START' ||
        ((/\b(start\s+auto\s*scroll|begin\s+auto\s*scroll|auto\s*scroll\s+(?:shuru|start|on|chalu)|auto\s*scroll|scroll\s+automatically|ऑटो\s*स्क्रॉल(?:\s*(?:शुरू|चलाओ|करो))?)\b/i.test(lower)) && !/\b(stop|roko|faster|slower|band|ruk)\b/i.test(lower));

      const isAutoScrollStop =
        parsedCommand?.action === 'AUTO_SCROLL_STOP' ||
        /\b(stop\s+auto\s*scroll|stop\s+scroll|end\s+auto\s*scroll|auto\s*scroll\s+(?:roko|band|stop)|scroll\s+(?:roko|band|ruk)|pause\s+scroll|स्क्रॉल\s*रोको|ऑटो\s*स्क्रॉल\s*बंद|रोक\s*दो)\b/i.test(lower);

      if (isScrollDown) {
        drishtiActionService.scrollDown();
        this._lastTranscript = text;
        this._transcriptListeners.forEach(cb => cb(text));
        return;
      }
      if (isScrollUp) {
        drishtiActionService.scrollUp();
        this._lastTranscript = text;
        this._transcriptListeners.forEach(cb => cb(text));
        return;
      }
      if (isScrollTop) {
        drishtiActionService.scrollToTop();
        this._lastTranscript = text;
        this._transcriptListeners.forEach(cb => cb(text));
        return;
      }
      if (isScrollBottom) {
        drishtiActionService.scrollToBottom();
        this._lastTranscript = text;
        this._transcriptListeners.forEach(cb => cb(text));
        return;
      }
      if (isAutoScrollStart) {
        drishtiActionService.startAutoScroll();
        this._lastTranscript = text;
        this._transcriptListeners.forEach(cb => cb(text));
        return;
      }
      if (isAutoScrollStop) {
        drishtiActionService.stopAutoScroll();
        this._lastTranscript = text;
        this._transcriptListeners.forEach(cb => cb(text));
        return;
      }

      // 2. Action / Navigation interruption:
      // The assistant listens properly, finishes explaining page details, and then executes the interrupted task.
      console.log(`[GlobalVoice] 👂 Heard action during page explanation: "${text}". Queuing for execution upon explanation finish.`);
      this._lastTranscript = text;
      this._transcriptListeners.forEach(cb => cb(text));
      speechService.queueInterruptedTask(async () => {
        await this._runHandlers(text, parsedCommand);
      }, text);
      return;
    }

    // Normal speech reading (e.g. question reading):
    // Universal barge-in halts speech immediately so user can issue commands.
    if (speechService.isSpeaking) {
      console.log('[GlobalVoice] 🛑 Interrupting active speech for incoming voice command:', text);
      speechService.stop();
    }

    // Echo suppression: only suppress if audio is a long verbatim sentence echoed from computer speakers
    const lastSpokenLower = this._lastSpoken.toLowerCase();
    const timeSinceSpeech = Date.now() - speechService.lastSpeechEndTime;
    const isRecentSpeech = speechService.isSpeaking || timeSinceSpeech < 500;

    // Candidate action keywords that must NEVER be suppressed as echoes:
    const isActionKeyword = /\b(stop|chup|ruko|skip|pause|cancel|confirm|yes|no|next|prev|previous|option|opt|select|clear|ans|answer|submit|drishti|time|flag|read|repeat|sunao|batao|help|dark|light|yellow|contrast|font|start|open|history|practice|result|performance|profile|setting|paper|material|scroll|niche|neeche|upar)\b/i.test(lower);

    if (isRecentSpeech && lastSpokenLower && !isActionKeyword) {
      if (lower === lastSpokenLower && lower.length > 20) {
        console.log('[GlobalVoice] 🔇 Suppressed exact echo transcript:', text);
        return;
      }
      if (lastSpokenLower.includes(lower) && lower.length > 30) {
        console.log('[GlobalVoice] 🔇 Suppressed long verbatim echo transcript:', text);
        return;
      }
    }

    // Debounce duplicate transcripts arriving within 800ms
    const now = Date.now();
    if (text === this._lastDispatchedText && now - this._lastDispatchTime < 800) {
      return;
    }
    this._lastDispatchedText = text;
    this._lastDispatchTime = now;

    console.log('[GlobalVoice] 🗣️ Transcript:', `"${text}"`);
    this._lastTranscript = text;
    this._transcriptListeners.forEach(cb => cb(text));

    await this._runHandlers(text, parsedCommand);
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
          let finalPhrase = '';
          let interimPhrase = '';

          for (let i = e.resultIndex; i < e.results.length; ++i) {
            const res = e.results[i];
            const trans = res[0]?.transcript || '';
            if (res.isFinal) {
              finalPhrase += ' ' + trans;
            } else {
              interimPhrase += ' ' + trans;
            }
          }

          finalPhrase = finalPhrase
            .trim()
            .toLowerCase()
            .replace(/[.,!?;:\-_'"`~।]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          interimPhrase = interimPhrase
            .trim()
            .toLowerCase()
            .replace(/[.,!?;:\-_'"`~।]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          // 1. If we have finalized transcript, dispatch for command execution
          if (finalPhrase) {
            if (speechService.isSpeaking) {
              const isStop =
                /^(?:stop|ruko|ruk\s*jao|chup|pause|cancel|shant|quiet|रुको|रुक\s*जाओ|चुप|शांत)$/i.test(finalPhrase) ||
                /\b(stop\s+speaking|stop\s+talking|chup\s+ho\s+jao|stop\s+audio)\b/i.test(finalPhrase);
              if (isStop) {
                speechService.stop(true);
              } else if (!speechService.isPageExplaining) {
                console.log('[GlobalVoice] 🛑 Barge-in: Candidate spoke final phrase, stopping AI speech.');
                speechService.stop();
              }
            }
            if (this._interimDispatchTimer) {
              clearTimeout(this._interimDispatchTimer);
              this._interimDispatchTimer = null;
            }
            this._lastInterimText = '';
            this._dispatch(finalPhrase);
            return;
          }

          // 2. If we only have interim transcript:
          // Update live visual indicator ONLY (shows candidate what is currently being heard)
          if (interimPhrase) {
            // ── BARGE-IN: Stop AI speech if user starts talking (unless page explaining) ──
            if (speechService.isSpeaking) {
              const isStop =
                /^(?:stop|ruko|ruk\s*jao|chup|pause|cancel|shant|quiet|रुको|रुक\s*जाओ|चुप|शांत)$/i.test(interimPhrase) ||
                /\b(stop\s+speaking|stop\s+talking|chup\s+ho\s+jao|stop\s+audio)\b/i.test(interimPhrase);
              if (isStop) {
                speechService.stop(true);
              } else if (!speechService.isPageExplaining) {
                console.log('[GlobalVoice] 🛑 Barge-in: User interrupted, stopping AI speech.');
                speechService.stop();
              }
            }

            this._transcriptListeners.forEach(cb => cb(interimPhrase));
            this._lastInterimText = interimPhrase;

            // Silence debounce fallback: if browser delays isFinal for > 600ms after speech pause, finalize it
            if (this._interimDispatchTimer) clearTimeout(this._interimDispatchTimer);
            this._interimDispatchTimer = setTimeout(() => {
              if (this._lastInterimText) {
                const toSend = this._lastInterimText;
                this._lastInterimText = '';
                this._dispatch(toSend);
              }
            }, 600);
          }
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
    if (this._interimDispatchTimer) {
      clearTimeout(this._interimDispatchTimer);
      this._interimDispatchTimer = null;
    }
    this._lastInterimText = '';
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
