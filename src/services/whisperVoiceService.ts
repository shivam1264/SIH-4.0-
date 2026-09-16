// ── Whisper Voice Recognition Service (Noise-Robust) ──────────────
// Optimized for noisy environments: hackathon, presentations, crowds
// Uses client-side VAD + energy gate + clean PCM Int16 streaming

import { speechService } from './speechService';

export type WhisperTranscriptCallback = (text: string) => void;
export type WhisperStatusCallback = (
  status: 'connecting' | 'ready' | 'listening' | 'error' | 'disconnected'
) => void;

const WHISPER_WS_URL        = 'ws://localhost:8765/ws/voice';
const SAMPLE_RATE           = 16000;
const BUFFER_SIZE           = 2048;   // ~128ms per audio frame (ultra-responsive streaming)
const BASE_SPEECH_RMS       = 0.012;  // Robust baseline speech threshold (ambient noise floor is ~0.003-0.007)
const SILENCE_FRAMES_TRIGGER = 3;      // 3 silence frames (~384ms) triggers natural end-of-utterance (was 768ms)
const MIN_UTTERANCE_MS       = 240;    // Minimum 240ms for fast commands like 'yes', 'no', 'option B'
const MAX_UTTERANCE_MS       = 4500;   // Safety cap: dispatch if continuous speech exceeds 4.5s

class WhisperVoiceService {
  private ws: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private onTranscript: WhisperTranscriptCallback | null = null;
  private onStatus: WhisperStatusCallback | null = null;
  private _active = false;
  private startId = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Utterance-level buffering (preserves complete words & sentences)
  private pcmBuffer: Int16Array[] = [];
  private isSpeaking = false;
  private silenceFrameCount = 0;
  private speechDurationMs = 0;
  private noiseFloor = 0.005;

  async isServerAvailable(): Promise<boolean> {
    try {
      const res = await fetch('http://localhost:8765/health', {
        signal: AbortSignal.timeout(1000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async start(
    onTranscript: WhisperTranscriptCallback,
    onStatus: WhisperStatusCallback,
  ): Promise<void> {
    if (this._active) return;

    this.startId++;
    const myId = this.startId;
    this._active = true;
    this.onTranscript = onTranscript;
    this.onStatus = onStatus;

    console.log('[Whisper] 🟡 Starting high-sensitivity noise-robust voice service...');
    onStatus('connecting');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: SAMPLE_RATE,
          // Aggressive noise suppression and voice clarity constraints
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Extra Chrome-specific constraints
          ...(({ googNoiseSuppression: true, googEchoCancellation: true,
                  googAutoGainControl: true, googHighpassFilter: true,
                  googNoiseSuppression2: true, googEchoCancellation2: true }) as any),
        },
      });

      if (!this._active || myId !== this.startId) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
        return;
      }

      console.log('[Whisper] 🎙️ Microphone granted (high-sensitivity mode)');
      this._connectWebSocket(myId);
    } catch (err) {
      console.error('[Whisper] Microphone error:', err);
      this._active = false;
      onStatus('error');
    }
  }

  private _connectWebSocket(myId: number) {
    if (!this._active || myId !== this.startId) return;

    console.log('[Whisper] 🔌 Connecting to Whisper server...');

    try {
      this.ws = new WebSocket(WHISPER_WS_URL);
      this.ws.binaryType = 'arraybuffer';
    } catch (err) {
      console.error('[Whisper] WebSocket creation failed:', err);
      this.onStatus?.('error');
      return;
    }

    this.ws.onopen = () => {
      if (!this._active || myId !== this.startId) { this.ws?.close(); return; }
      console.log('[Whisper] ✅ Connected to Python Whisper server');
      this.onStatus?.('ready');
      this._startSmartStreaming();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.transcript?.trim()) {
          const clean = data.transcript
            .toLowerCase()
            .replace(/[.,!?;:\-_'"`~।]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (clean) {
            console.log(`[Whisper] 🗣️ "${clean}"`);
            this.onTranscript?.(clean);
          }
        }
      } catch {}
    };

    this.ws.onerror = () => this.onStatus?.('error');

    this.ws.onclose = (e) => {
      console.warn(`[Whisper] WebSocket closed (code=${e.code})`);
      this._stopSmartStreaming();
      if (this._active && myId === this.startId) {
        this.onStatus?.('disconnected');
        this.reconnectTimer = setTimeout(() => {
          if (this._active && myId === this.startId) this._connectWebSocket(myId);
        }, 2000);
      }
    };
  }

  /**
   * Smart PCM streaming with client-side vocal DSP:
   * - Highpass filter removes low-frequency desk/fan noise
   * - Dynamics Compressor lifts soft speech without clipping
   * - Gain boost ensures normal conversational/quiet speech is picked up
   */
  private _startSmartStreaming() {
    if (!this.stream) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: SAMPLE_RATE });

      // Automatically resume audioCtx if suspended by browser autoplay policy
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

      // Input source
      const source = this.audioCtx.createMediaStreamSource(this.stream);

      // 1. High-pass filter at 85Hz: Removes desk vibrations, hum, fan noise
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'highpass';
      this.filterNode.frequency.value = 85;

      // 2. Dynamics Compressor: Clean vocal leveling without pumping or distortion
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -28;
      this.compressorNode.knee.value = 8;
      this.compressorNode.ratio.value = 3;
      this.compressorNode.attack.value = 0.005;
      this.compressorNode.release.value = 0.2;

      // 3. Make-up Gain node: clean 1.6x boost (natural, clean, zero clipping)
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.6;

      // ScriptProcessor for raw PCM access
      this.processor = this.audioCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (this.ws?.readyState !== WebSocket.OPEN) return;

        // ── Echo Cancellation & BARGE-IN ──
        // If the microphone picks up voice while TTS is speaking, it might be echo or user barge-in.
        // We rely on browser echo cancellation (enabled in getUserMedia) to filter out the TTS voice.
        // If rms still crosses dynamicThreshold, we assume it's the user interrupting.

        const float32 = e.inputBuffer.getChannelData(0);

        // ── Calculate RMS Energy ──
        let sumSq = 0;
        for (let i = 0; i < float32.length; i++) sumSq += float32[i] * float32[i];
        const rms = Math.sqrt(sumSq / float32.length);

        // Convert Float32 → Int16 PCM
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const frameDurationMs = (float32.length / SAMPLE_RATE) * 1000; // ~128ms

        // Dynamic noise floor tracking: learn ambient room noise floor when idle
        if (!this.isSpeaking) {
          this.noiseFloor = this.noiseFloor * 0.95 + rms * 0.05;
        }
        const dynamicThreshold = Math.max(BASE_SPEECH_RMS, this.noiseFloor * 2.4);

        if (rms >= dynamicThreshold) {
          // ── BARGE-IN: Stop AI speech if user starts talking ──
          if (speechService.isSpeaking) {
            console.log('[Whisper] 🛑 Barge-in: User interrupted, stopping AI speech.');
            speechService.stop();
          }

          // Voice detected!
          this.isSpeaking = true;
          this.silenceFrameCount = 0;
          this.speechDurationMs += frameDurationMs;
          this.pcmBuffer.push(int16);

          // If speech continues uninterrupted for > 4.5s, dispatch current chunk
          if (this.speechDurationMs >= MAX_UTTERANCE_MS) {
            this._dispatchBufferedUtterance();
          }
        } else {
          // Silence frame
          if (this.isSpeaking) {
            this.silenceFrameCount++;
            // Retain up to 2 trailing silence frames (~500ms) to avoid clipping word endings
            if (this.silenceFrameCount <= 2) {
              this.pcmBuffer.push(int16);
            }
            this.speechDurationMs += frameDurationMs;

            // When user pauses for ~768ms (3 silence frames), sentence has ended
            if (this.silenceFrameCount >= SILENCE_FRAMES_TRIGGER) {
              this._dispatchBufferedUtterance();
            }
          }
        }
      };

      // Connect DSP audio graph: source -> filter -> compressor -> gain -> processor
      source.connect(this.filterNode);
      this.filterNode.connect(this.compressorNode);
      this.compressorNode.connect(this.gainNode);
      this.gainNode.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);

      this.onStatus?.('listening');
      console.log('[Whisper] 🎤 Utterance-based streaming started (natural pause detection)');
    } catch (err) {
      console.error('[Whisper] Streaming setup error:', err);
    }
  }

  private _dispatchBufferedUtterance() {
    if (this.speechDurationMs >= MIN_UTTERANCE_MS && this.pcmBuffer.length > 0) {
      const totalSamples = this.pcmBuffer.reduce((s, f) => s + f.length, 0);
      const merged = new Int16Array(totalSamples);
      let offset = 0;
      for (const frame of this.pcmBuffer) {
        merged.set(frame, offset);
        offset += frame.length;
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(merged.buffer);
        this.ws.send('FLUSH');
        console.log(`[Whisper] 🎙️ Dispatched complete sentence: ${(totalSamples / SAMPLE_RATE).toFixed(2)}s`);
      }
    }

    // Reset state for next utterance
    this.pcmBuffer = [];
    this.isSpeaking = false;
    this.silenceFrameCount = 0;
    this.speechDurationMs = 0;
  }

  private _stopSmartStreaming() {
    this.pcmBuffer = [];
    this.isSpeaking = false;
    this.silenceFrameCount = 0;
    this.speechDurationMs = 0;
    try { this.processor?.disconnect(); } catch {}
    try { this.gainNode?.disconnect(); } catch {}
    try { this.compressorNode?.disconnect(); } catch {}
    try { this.filterNode?.disconnect(); } catch {}
    try { this.audioCtx?.close(); } catch {}
    this.processor = null;
    this.gainNode = null;
    this.compressorNode = null;
    this.filterNode = null;
    this.audioCtx = null;
  }

  stop() {
    console.log('[Whisper] 🔴 Voice service stopped');
    this._active = false;
    this.startId++;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this._stopSmartStreaming();
    try { this.stream?.getTracks().forEach(t => t.stop()); } catch {}
    this.stream = null;
    try { this.ws?.close(); } catch {}
    this.ws = null;
  }

  isActive() { return this._active; }
}

export const whisperVoiceService = new WhisperVoiceService();
