// ── Audio Cue (Earcon) Service ──────────────────────────────
class AudioCueService {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  setEnabled(v: boolean) { this.enabled = v; }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.3) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  navigation()    { this.tone(880, 0.08); }
  select()        { this.tone(1046, 0.12); }
  success()       { this.tone(1318, 0.15); setTimeout(() => this.tone(1760, 0.2), 100); }
  correct()       { this.success(); }
  error()         { this.tone(220, 0.3, 'square', 0.2); }
  wrong()         { this.error(); }
  timerWarning()  { this.tone(660, 0.2); setTimeout(() => this.tone(660, 0.2), 300); }
  examStart()     { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.2), i * 150)); }
  examSubmit()    { [784, 659, 523].forEach((f, i) => setTimeout(() => this.tone(f, 0.2), i * 150)); }
  voiceActivate() { this.tone(1200, 0.1, 'triangle'); }
  voiceStop()     { this.tone(800, 0.1, 'triangle'); }
}

export const audioCueService = new AudioCueService();
