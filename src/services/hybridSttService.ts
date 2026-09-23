// ── Unified Hybrid / Failover Speech-to-Text Service ─────────────────────
// SIGHT-EXAM AI Accessibility Platform
// Primary STT: Groq Whisper (via backend)
// Fallback STT: Local faster-whisper (localhost:8765)
// Automatically falls back on 429, timeout, 5xx, or network failure.
// Reuses the EXACT same audio recording — candidate never speaks twice.

import { speechService } from './speechService';

export type SttProvider = 'groq' | 'local' | 'none';
export type SttVoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'FALLBACK' | 'SUCCESS' | 'ERROR';

export interface SttResult {
  success: boolean;
  text: string;
  provider: SttProvider;
  command?: any;
  error?: string;
  durationMs?: number;
}

export type SttTranscriptCallback = (result: SttResult) => void;
export type SttStatusCallback = (state: SttVoiceState, message?: string) => void;

const BACKEND_TRANSCRIBE_URL = 'http://localhost:5000/api/ai/transcribe';
const LOCAL_WHISPER_URL      = 'http://localhost:8765/transcribe';
const LOCAL_WHISPER_HEALTH   = 'http://localhost:8765/health';

const SAMPLE_RATE            = 16000;
const BUFFER_SIZE            = 2048;   // ~128ms per audio frame
const BASE_SPEECH_RMS        = 0.012;  // High-sensitivity speech threshold
const SILENCE_FRAMES_TRIGGER = 3;      // ~384ms pause triggers utterance submission
const MIN_UTTERANCE_MS       = 180;    // Minimum 180ms to capture single-syllable commands ('B', 'No', 'A')
const MAX_UTTERANCE_MS       = 5000;   // Safety cap: 5 seconds continuous audio

const KNOWN_HALLUCINATIONS = [
  'thank you', 'thanks for watching', 'subscribe', 'like and subscribe',
  'subtitles by', 'transcribed by', 'amara.org', 'bye bye', 'goodbye',
  'धन्यवाद', 'बहुत बहुत धन्यवाद', 'देखने के लिए धन्यवाद', 'सब्सक्राइब करें',
  'लाइक करें', 'you', 'yeah', 'oh', 'um', 'uh'
];

function isHallucinationText(text: string): boolean {
  if (!text) return true;
  const t = text.toLowerCase().trim();
  if (t.length <= 1) return true;
  for (const h of KNOWN_HALLUCINATIONS) {
    if (t === h || t.startsWith(h + ' ') || t.endsWith(' ' + h)) return true;
  }
  if (/^(\w+)(?:\s+\1){2,}$/i.test(t)) return true;
  return false;
}

function pcmToWav(pcmData: Int16Array, sampleRate = 16000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataLength = pcmData.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint8(0, 0x52); // 'R'
  view.setUint8(1, 0x49); // 'I'
  view.setUint8(2, 0x46); // 'F'
  view.setUint8(3, 0x46); // 'F'
  view.setUint32(4, 36 + dataLength, true);

  // WAVE header
  view.setUint8(8, 0x57);  // 'W'
  view.setUint8(9, 0x41);  // 'A'
  view.setUint8(10, 0x56); // 'V'
  view.setUint8(11, 0x45); // 'E'

  // fmt sub-chunk
  view.setUint8(12, 0x66); // 'f'
  view.setUint8(13, 0x6d); // 'm'
  view.setUint8(14, 0x74); // 't'
  view.setUint8(15, 0x20); // ' '
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  view.setUint8(36, 0x64); // 'd'
  view.setUint8(37, 0x61); // 'a'
  view.setUint8(38, 0x74); // 't'
  view.setUint8(39, 0x61); // 'a'
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < pcmData.length; i++, offset += 2) {
    view.setInt16(offset, pcmData[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = (reader.result as string) || '';
      const b64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export class HybridSttService {
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lowpassNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;

  private onTranscript: SttTranscriptCallback | null = null;
  private onStatus: SttStatusCallback | null = null;

  private _active = false;
  private _isProcessing = false;
  private _state: SttVoiceState = 'IDLE';
  private startId = 0;

  // Utterance Buffering
  private pcmBuffer: Int16Array[] = [];
  private isSpeaking = false;
  private consecutiveVoicedFrames = 0;
  private silenceFrameCount = 0;
  private speechDurationMs = 0;
  private noiseFloor = 0.005;

  // Duplicate Request & Debounce Protection
  private lastTranscript = '';
  private lastTranscriptTime = 0;

  isActive(): boolean {
    return this._active;
  }

  isProcessing(): boolean {
    return this._isProcessing;
  }

  getState(): SttVoiceState {
    return this._state;
  }

  private _setState(state: SttVoiceState, msg?: string) {
    this._state = state;
    this.onStatus?.(state, msg);
  }

  async isLocalServerAvailable(): Promise<boolean> {
    try {
      const res = await fetch(LOCAL_WHISPER_HEALTH, {
        signal: AbortSignal.timeout(1000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async start(
    onTranscript: SttTranscriptCallback,
    onStatus: SttStatusCallback
  ): Promise<void> {
    if (this._active) return;

    this.startId++;
    const myId = this.startId;
    this._active = true;
    this._isProcessing = false;
    this.onTranscript = onTranscript;
    this.onStatus = onStatus;

    this._setState('LISTENING', 'Listening...');
    console.log('[HybridSTT] 🎙️ Initializing Hybrid Voice System (Primary: Groq, Fallback: Local Whisper)...');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(({
            googNoiseSuppression: true,
            googEchoCancellation: true,
            googAutoGainControl: true,
            googHighpassFilter: true,
            googNoiseSuppression2: true,
            googEchoCancellation2: true,
          }) as any),
        },
      });

      if (!this._active || myId !== this.startId) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
        return;
      }

      console.log('[HybridSTT] 🎙️ Microphone access granted (16kHz audio stream)');
      this._setupAudioDSP();
      this._setState('LISTENING', 'Listening...');
    } catch (err) {
      console.error('[HybridSTT] Microphone error:', err);
      this._active = false;
      this._setState('ERROR', 'Microphone access denied');
      this.stop();
    }
  }

  private _setupAudioDSP() {
    if (!this.stream) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: SAMPLE_RATE });

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const resume = () => {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
      };
      window.addEventListener('click', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });

      const source = this.audioCtx.createMediaStreamSource(this.stream);

      // 1. High-pass filter at 130Hz to eliminate fan noise, table rumble & chassis vibration
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'highpass';
      this.filterNode.frequency.value = 130;

      // 2. Low-pass filter at 3600Hz to eliminate high-frequency hiss, sizzle & clicks
      this.lowpassNode = this.audioCtx.createBiquadFilter();
      this.lowpassNode.type = 'lowpass';
      this.lowpassNode.frequency.value = 3600;

      // 3. Dynamics compressor: smooth vocal leveling without pumping
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -24;
      this.compressorNode.knee.value = 10;
      this.compressorNode.ratio.value = 4;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.15;

      // 4. Clean make-up gain (1.30x boost ensures clear speech transmission)
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.30;

      this.processor = this.audioCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this._active) return;

        // Duplicate Request Protection: Skip recording while a transcription is in flight
        if (this._isProcessing) return;

        const float32 = e.inputBuffer.getChannelData(0);

        // RMS Energy calculation
        let sumSq = 0;
        for (let i = 0; i < float32.length; i++) sumSq += float32[i] * float32[i];
        const rms = Math.sqrt(sumSq / float32.length);

        // Float32 -> Int16 PCM
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const frameDurationMs = (float32.length / SAMPLE_RATE) * 1000;

        if (!this.isSpeaking) {
          this.noiseFloor = this.noiseFloor * 0.96 + rms * 0.04;
        }

        const dynamicThreshold = speechService.isSpeaking
          ? Math.max(BASE_SPEECH_RMS * 1.35, this.noiseFloor * 2.0)
          : Math.max(BASE_SPEECH_RMS, this.noiseFloor * 1.9);

        if (rms >= dynamicThreshold) {
          this.consecutiveVoicedFrames++;

          // 1 frame of strong voice (>1.35x threshold) or 2 consecutive voiced frames confirms speech
          if ((this.consecutiveVoicedFrames >= 1 && rms >= dynamicThreshold * 1.35) || this.consecutiveVoicedFrames >= 2) {
            // Barge-in: immediately cancel AI screen reader speech if candidate speaks
            if (speechService.isSpeaking) {
              console.log('[HybridSTT] 🛑 Barge-in: Candidate interrupted, stopping AI speech.');
              speechService.stop();
            }

            this.isSpeaking = true;
            this.silenceFrameCount = 0;
            this.speechDurationMs += frameDurationMs;
            this.pcmBuffer.push(int16);

            if (this.speechDurationMs >= MAX_UTTERANCE_MS) {
              this._dispatchBufferedUtterance();
            }
          }
        } else {
          this.consecutiveVoicedFrames = 0;
          if (this.isSpeaking) {
            this.silenceFrameCount++;
            if (this.silenceFrameCount <= 2) {
              this.pcmBuffer.push(int16);
            }
            this.speechDurationMs += frameDurationMs;

            if (this.silenceFrameCount >= SILENCE_FRAMES_TRIGGER) {
              this._dispatchBufferedUtterance();
            }
          }
        }
      };

      source.connect(this.filterNode);
      this.filterNode.connect(this.lowpassNode);
      this.lowpassNode.connect(this.compressorNode);
      this.compressorNode.connect(this.gainNode);
      this.gainNode.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);
    } catch (err) {
      console.error('[HybridSTT] Audio DSP setup error:', err);
      this._setState('ERROR', 'Audio pipeline initialization failed');
    }
  }

  /**
   * Finalize the captured speech into ONE audio recording (WAV) and dispatch to STT.
   */
  private async _dispatchBufferedUtterance() {
    if (this.pcmBuffer.length === 0 || this._isProcessing) return;

    if (this.speechDurationMs < MIN_UTTERANCE_MS) {
      this.pcmBuffer = [];
      this.isSpeaking = false;
      this.silenceFrameCount = 0;
      this.speechDurationMs = 0;
      return;
    }

    const totalSamples = this.pcmBuffer.reduce((s, f) => s + f.length, 0);
    const merged = new Int16Array(totalSamples);
    let offset = 0;
    for (const frame of this.pcmBuffer) {
      merged.set(frame, offset);
      offset += frame.length;
    }

    // Reset buffer for next speech segment
    this.pcmBuffer = [];
    this.isSpeaking = false;
    this.silenceFrameCount = 0;
    this.speechDurationMs = 0;

    const wavBlob = pcmToWav(merged, SAMPLE_RATE);
    const durationSec = (totalSamples / SAMPLE_RATE).toFixed(2);
    console.log(`[HybridSTT] 🎙️ Utterance recorded (${durationSec}s). Locking mic & entering PROCESSING...`);

    // Lock mic and update UI state
    this._isProcessing = true;
    this._setState('PROCESSING', 'Processing voice...');

    try {
      const result = await this.transcribeAudio(wavBlob);

      if (result.success && result.text) {
        if (isHallucinationText(result.text)) {
          console.log('[HybridSTT] 🔇 Filtered hallucination result:', result.text);
          return;
        }

        const now = Date.now();
        // Debounce identical recognized transcripts within 750ms
        if (result.text.toLowerCase() === this.lastTranscript.toLowerCase() && now - this.lastTranscriptTime < 750) {
          console.log('[HybridSTT] Duplicate transcript debounced:', result.text);
        } else {
          this.lastTranscript = result.text;
          this.lastTranscriptTime = now;
          this._setState('SUCCESS', '✓ Voice recognized');
          this.onTranscript?.(result);
        }
      } else {
        if (result.error) {
          this._setState('ERROR', result.error);
        }
      }
    } catch (err: any) {
      console.error('[HybridSTT] Unexpected transcription failure:', err);
      this._setState('ERROR', 'Speech recognition unavailable');
    } finally {
      this._isProcessing = false;
      if (this._active) {
        // Return to LISTENING after short success toast
        setTimeout(() => {
          if (this._active && !this._isProcessing) {
            this._setState('LISTENING', 'Listening...');
          }
        }, 1200);
      }
    }
  }

  /**
   * Universal STT failover pipeline using ONE audio recording:
   * 1. Primary: Groq Whisper via backend proxy (http://localhost:5000/api/ai/transcribe)
   * 2. Backend automatically falls back to local faster-whisper on Groq 429/timeout/5xx.
   * 3. If backend itself is unreachable (offline / air-gapped), frontend directly calls local faster-whisper.
   */
  async transcribeAudio(audioBlob: Blob, simulate429 = false): Promise<SttResult> {
    const t0 = performance.now();

    // ── ATTEMPT 1: Backend STT (Groq Primary with Server-side Fallback) ──
    try {
      console.log('[HybridSTT] 📤 Sending audio to backend STT orchestrator...');
      const base64Audio = await blobToBase64(audioBlob);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (simulate429) {
        headers['x-simulate-groq-429'] = 'true';
      }

      const res = await fetch(BACKEND_TRANSCRIBE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ audio: base64Audio }),
        signal: AbortSignal.timeout(9000), // generous window for primary + fallback
      });

      if (res.ok) {
        const data = await res.json();
        const elapsedMs = Math.round(performance.now() - t0);
        if (data.provider === 'local') {
          console.log(`[STT] Provider: Local faster-whisper`);
          console.log(`[STT] Status: SUCCESS (${elapsedMs}ms)`);
          this._setState('FALLBACK', 'Using offline speech recognition...');
        } else {
          console.log(`[STT] Provider: Groq`);
          console.log(`[STT] Status: SUCCESS (${elapsedMs}ms)`);
        }
        return {
          success: true,
          text: data.text || '',
          provider: (data.provider as SttProvider) || 'groq',
          command: data.command,
          durationMs: elapsedMs,
        };
      } else {
        console.warn(`[HybridSTT] Backend returned HTTP ${res.status}. Falling back to direct Local Whisper...`);
      }
    } catch (backendErr: any) {
      console.warn(`[HybridSTT] Backend unreachable (${backendErr.message}). Switching to direct Local Whisper...`);
    }

    // ── ATTEMPT 2: Direct Frontend Local Faster-Whisper Fallback ──
    try {
      this._setState('FALLBACK', 'Using offline speech recognition...');
      console.log('[STT] Provider: Groq | Status: 429/ERROR');
      console.log('[STT] Switching to Local Whisper');

      const localRes = await fetch(LOCAL_WHISPER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/wav' },
        body: audioBlob,
        signal: AbortSignal.timeout(6000),
      });

      if (localRes.ok) {
        const localData = await localRes.json();
        const elapsedMs = Math.round(performance.now() - t0);
        console.log('[STT] Provider: Local faster-whisper');
        console.log(`[STT] Status: SUCCESS (${elapsedMs}ms)`);
        return {
          success: true,
          text: localData.text || '',
          provider: 'local',
          command: localData.command,
          durationMs: elapsedMs,
        };
      }
    } catch (localErr: any) {
      console.error(`[HybridSTT] Direct local Whisper failed:`, localErr);
    }

    // ── ATTEMPT 3: Both Providers Failed ──
    const elapsedMs = Math.round(performance.now() - t0);
    console.error('[STT] Provider: none');
    console.error('[STT] Status: FAILED');
    return {
      success: false,
      text: '',
      provider: 'none',
      error: 'Speech recognition unavailable',
      durationMs: elapsedMs,
    };
  }

  stop(): void {
    this._active = false;
    this._isProcessing = false;
    this.isSpeaking = false;
    this.pcmBuffer = [];

    if (this.processor) {
      try { this.processor.disconnect(); } catch {}
      this.processor = null;
    }
    if (this.gainNode) {
      try { this.gainNode.disconnect(); } catch {}
      this.gainNode = null;
    }
    if (this.compressorNode) {
      try { this.compressorNode.disconnect(); } catch {}
      this.compressorNode = null;
    }
    if (this.filterNode) {
      try { this.filterNode.disconnect(); } catch {}
      this.filterNode = null;
    }
    if (this.lowpassNode) {
      try { this.lowpassNode.disconnect(); } catch {}
      this.lowpassNode = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    this._setState('IDLE', 'Voice assistant paused');
    console.log('[HybridSTT] 🔴 Voice service stopped');
  }
}

export const hybridSttService = new HybridSttService();
