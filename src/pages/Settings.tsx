import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Type,
  Sliders,
  Mic,
  Volume2,
  Check,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Ear,
  Eye,
  Bell,
  Cpu,
  Zap,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAccessibility } from '../context/AccessibilityContext';
import { speechService } from '../services/speechService';
import { groqVoiceService } from '../services/groqVoiceService';
import { usePageVoice } from '../hooks/usePageVoice';
import type { ThemeMode, FontSize } from '../types';

export default function Settings() {
  const {
    prefs,
    setTheme,
    setFontSize,
    setSpacing,
    setFontFamily,
    toggleVoice,
    setVoiceRate,
    setVoicePitch,
    setVoiceName,
    toggleHighFocus,
    toggleReduceMotion,
    toggleAudioFeedback,
    toggleAutoRead,
    toggleTimerWarnings,
    resetToDefaults,
  } = useAccessibility();

  const [testSpoken, setTestSpoken] = useState(false);
  const [availableVoices, setAvailableVoices] = useState(() => speechService.getAvailableVoices());
  const [groqKey, setGroqKey] = useState(() => groqVoiceService.getApiKey());
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    document.title = 'Accessibility Preferences — DrishtiX';
    const updateVoices = () => {
      setAvailableVoices(speechService.getAvailableVoices());
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  usePageVoice('Settings', [
    {
      triggers: ['dark mode', 'dark theme', 'black theme', 'dark'],
      answer: () => 'Dark mode activated.',
      action: () => setTheme('dark'),
    },
    {
      triggers: ['light mode', 'light theme', 'white theme', 'light'],
      answer: () => 'Light mode activated.',
      action: () => setTheme('default'),
    },
    {
      triggers: ['high contrast', 'contrast theme', 'high contrast mode'],
      answer: () => 'High contrast theme activated.',
      action: () => setTheme('high-contrast'),
    },
    {
      triggers: ['yellow on black', 'yellow black', 'yellow theme'],
      answer: () => 'Yellow on black theme activated.',
      action: () => setTheme('yellow-black'),
    },
    {
      triggers: ['huge font', 'huge text', '150%', 'maximum font', 'sabse bada font'],
      answer: () => 'Font size set to huge 150 percent.',
      action: () => setFontSize('xxlarge'),
    },
    {
      triggers: ['extra large', 'xlarge', 'x large', '135%', 'extra large font'],
      answer: () => 'Font size set to extra large 135 percent.',
      action: () => setFontSize('xlarge'),
    },
    {
      triggers: ['large font', 'large text', '115%', 'bada text', 'font bada'],
      answer: () => 'Font size set to large 115 percent.',
      action: () => setFontSize('large'),
    },
    {
      triggers: ['normal font', 'normal text', '100%', 'default font', 'default text'],
      answer: () => 'Font size set to normal 100 percent.',
      action: () => setFontSize('default'),
    },
    {
      triggers: ['automatic question announcing', 'auto read', 'auto question', 'toggle auto read', 'announcing'],
      answer: () => `Automatic question announcing ${!prefs.autoReadQuestion ? 'enabled' : 'disabled'}.`,
      action: () => toggleAutoRead(),
    },
    {
      triggers: ['audio feedback', 'toggle audio feedback', 'sound feedback', 'audio cues'],
      answer: () => `Audio feedback sound cues ${!prefs.audioFeedback ? 'enabled' : 'disabled'}.`,
      action: () => toggleAudioFeedback(),
    },
    {
      triggers: ['speed badhao', 'fast bolo', 'voice rate up', 'faster voice', 'speak faster'],
      answer: () => 'Voice speed increased.',
      action: () => setVoiceRate(Math.min(1.8, Number((prefs.voiceRate + 0.15).toFixed(2)))),
    },
    {
      triggers: ['speed kam karo', 'slow bolo', 'dheere bolo', 'voice rate down', 'slower voice', 'speak slower'],
      answer: () => 'Voice speed decreased.',
      action: () => setVoiceRate(Math.max(0.6, Number((prefs.voiceRate - 0.15).toFixed(2)))),
    },
    {
      triggers: ['summary', 'current settings', 'preferences kya hai', 'batao', 'read settings'],
      answer: () => `Current accessibility settings: Theme ${prefs.theme}, Font scaling ${prefs.fontSize}, Speaking pace ${prefs.voiceRate.toFixed(1)}x, Automatic question reading ${prefs.autoReadQuestion ? 'active' : 'inactive'}.`,
    },
    {
      triggers: ['test voice', 'awaz test', 'voice check', 'sample voice', 'sample voice output'],
      answer: () => 'Testing voice audio output now.',
      action: () => testVoice(),
    },
    {
      triggers: ['reset to defaults', 'reset settings', 'default settings', 'restore defaults'],
      answer: () => 'System accessibility preferences reset to default values.',
      action: () => resetToDefaults(),
    },
  ]);

  function testVoice() {
    speechService.configure(prefs.voiceRate, prefs.voicePitch, prefs.voiceName);
    speechService.speak(
      'Welcome to DrishtiX. Beyond Barriers, Brighter Futures. Audio guidance is active and calibrated. Question 1. What is the capital of India? Option A: Mumbai. Option B: New Delhi.',
      { priority: true }
    );
    setTestSpoken(true);
    setTimeout(() => setTestSpoken(false), 5000);
  }

  const SectionTitle = ({
    icon: IconComp,
    children,
  }: {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    children: React.ReactNode;
  }) => (
    <h2
      style={{
        fontWeight: 800,
        fontSize: '1rem',
        color: 'var(--text)',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <IconComp size={18} color="#2563EB" />
      {children}
    </h2>
  );

  const Toggle = ({
    label,
    desc,
    checked,
    onChange,
    id,
  }: {
    label: string;
    desc?: string;
    checked: boolean;
    onChange: () => void;
    id: string;
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '0.65rem 0',
        gap: '1rem',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <label htmlFor={id} style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', cursor: 'pointer' }}>
          {label}
        </label>
        {desc && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{desc}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: 'none',
          background: checked ? '#2563EB' : 'var(--border)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
        aria-label={label}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          }}
          aria-hidden="true"
        />
      </button>
    </div>
  );

  return (
    <AppLayout title="Accessibility Settings">
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        {/* ── 1. Hero Accessibility Banner (Compact) ── */}
        <div
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #7C3AED 100%)',
            borderRadius: '0.85rem',
            padding: '0.85rem 1.25rem',
            color: '#fff',
            marginBottom: '1.25rem',
            boxShadow: '0 4px 16px rgba(37,99,235,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '0.55rem',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(6px)',
              flexShrink: 0
            }}>
              <Sliders size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  lineHeight: 1.2
                }}
              >
                System Accessibility Preferences
              </h1>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '999px',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(4px)',
                }}
              >
                WCAG AAA
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              resetToDefaults();
              speechService.speak('Preferences reset to default values.');
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.3)',
              fontWeight: 600,
              fontSize: '0.82rem',
              padding: '0.45rem 0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '0.55rem',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} /> Reset to Defaults
          </button>
        </div>

        {/* ── 2. 2-Column Settings Hub ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* ── Left Column: Visual, Typography & Layout ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Visual Theme Selection */}
            <div
              className="card fade-in"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '0.85rem',
                border: '1px solid var(--border)',
              }}
            >
              <SectionTitle icon={Palette}>Display Theme (High Contrast / Dark / Light)</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {(
                  [
                    ['default', 'Light Mode', '#FFFFFF', '#0F172A', '#EFF6FF'],
                    ['dark', 'Dark Mode', '#0F172A', '#F1F5F9', '#1E293B'],
                    ['high-contrast', 'High Contrast', '#000000', '#FFFFFF', '#000000'],
                    ['yellow-black', 'Yellow on Black', '#000000', '#FFFF00', '#1A1A00'],
                  ] as [ThemeMode, string, string, string, string][]
                ).map(([t, label, bg, fg, previewBg]) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    aria-pressed={prefs.theme === t}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem',
                      border: `2px solid ${prefs.theme === t ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: '0.65rem',
                      background: prefs.theme === t ? 'var(--primary-light)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '0.45rem',
                        background: bg,
                        border: '1px solid rgba(0,0,0,.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: fg,
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        flexShrink: 0,
                      }}
                    >
                      Aa
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>{label}</div>
                    </div>
                    {prefs.theme === t && <Check size={16} color="#2563EB" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Sizing Scaler */}
            <div
              className="card fade-in"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '0.85rem',
                border: '1px solid var(--border)',
              }}
            >
              <SectionTitle icon={Type}>Text Scaling & Font Size</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {(
                  [
                    ['default', 'Normal', '100%'],
                    ['large', 'Large', '115%'],
                    ['xlarge', 'X-Large', '135%'],
                    ['xxlarge', 'Huge', '150%'],
                  ] as [FontSize, string, string][]
                ).map(([size, label, pct]) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    aria-pressed={prefs.fontSize === size}
                    style={{
                      padding: '0.65rem 0.4rem',
                      borderRadius: '0.5rem',
                      border: prefs.fontSize === size ? '2px solid #2563EB' : '1px solid var(--border)',
                      background: prefs.fontSize === size ? '#EFF6FF' : 'var(--bg-surface)',
                      color: prefs.fontSize === size ? '#2563EB' : 'var(--text)',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div>{label}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>{pct}</div>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Dynamically enlarges all questions, options, and analytical texts throughout the portal.
              </p>
            </div>

            {/* Typography Family & Spacing */}
            <div
              className="card fade-in"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '0.85rem',
                border: '1px solid var(--border)',
              }}
            >
              <SectionTitle icon={SlidersHorizontal}>Font Family & Line Spacing</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                    Typeface Preference
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'system', label: 'Inter (Default)' },
                      { id: 'atkinson', label: 'Atkinson Hyperlegible (Low Vision)' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFontFamily(f.id as any)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          border: prefs.fontFamily === f.id ? '1px solid #2563EB' : '1px solid var(--border)',
                          background: prefs.fontFamily === f.id ? '#EFF6FF' : 'var(--bg-surface)',
                          color: prefs.fontFamily === f.id ? '#2563EB' : 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                    Line & Character Spacing
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['normal', 'relaxed', 'loose'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setSpacing(s)}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          border: prefs.spacing === s ? '1px solid #2563EB' : '1px solid var(--border)',
                          background: prefs.spacing === s ? '#EFF6FF' : 'var(--bg-surface)',
                          color: prefs.spacing === s ? '#2563EB' : 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Speech Synthesizer & Audio Cues ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Speech Synthesizer & Audio Engine */}
            <div
              className="card fade-in"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '0.85rem',
                border: '1px solid var(--border)',
              }}
            >
              <SectionTitle icon={Volume2}>Speech Synthesizer & Voice Tuning</SectionTitle>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Voice Selection */}
                {availableVoices.length > 0 && (
                  <div>
                    <label
                      htmlFor="voice-select"
                      style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}
                    >
                      Text-to-Speech Voice Profile
                    </label>
                    <select
                      id="voice-select"
                      value={prefs.voiceName || ''}
                      onChange={e => setVoiceName(e.target.value)}
                      className="input-field"
                      style={{ padding: '0.55rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      <option value="">Default System Natural Voice</option>
                      {availableVoices.map(v => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Rate Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>Speaking Pace / Rate</span>
                    <span style={{ color: '#2563EB', fontWeight: 800 }}>{prefs.voiceRate.toFixed(1)}x Speed</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.8"
                    step="0.1"
                    value={prefs.voiceRate}
                    onChange={e => setVoiceRate(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                </div>

                {/* Pitch Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>Voice Pitch & Tone</span>
                    <span style={{ color: '#7C3AED', fontWeight: 800 }}>{prefs.voicePitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.1"
                    value={prefs.voicePitch}
                    onChange={e => setVoicePitch(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#7C3AED', cursor: 'pointer' }}
                  />
                </div>

                {/* Test Voice Button */}
                <button
                  onClick={testVoice}
                  style={{
                    background: testSpoken ? '#ECFDF5' : '#EFF6FF',
                    color: testSpoken ? '#059669' : '#2563EB',
                    border: testSpoken ? '1px solid #A7F3D0' : '1px solid #BFDBFE',
                    padding: '0.65rem',
                    borderRadius: '0.6rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                  }}
                >
                  <Volume2 size={16} />
                  <span>{testSpoken ? 'Testing Speech Engine Output…' : 'Sample Voice Output'}</span>
                </button>
              </div>
            </div>

            {/* Assistive Controls & Alerts */}
            <div
              className="card fade-in"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '0.85rem',
                border: '1px solid var(--border)',
              }}
            >
              <SectionTitle icon={Ear}>Assistive Features & Toggles</SectionTitle>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Toggle
                  id="auto-read"
                  label="Automatic Question Announcing"
                  desc="Reads new examination questions immediately upon navigation without pressing R."
                  checked={prefs.autoReadQuestion}
                  onChange={toggleAutoRead}
                />

                <Toggle
                  id="audio-cue"
                  label="Harmonic Auditory Earcons"
                  desc="Plays crisp soft audio chimes when answers are selected or time ticks down."
                  checked={prefs.audioFeedback}
                  onChange={toggleAudioFeedback}
                />

                <Toggle
                  id="timer-warn"
                  label="Spoken Time-Remaining Warnings"
                  desc="Announces 10 min, 5 min, and 1 minute spoken alerts during exam attempt."
                  checked={prefs.timerWarnings}
                  onChange={toggleTimerWarnings}
                />

                <Toggle
                  id="high-focus"
                  label="High Focus Outline Indicator"
                  desc="Draws a bold 3px high-visibility outline around the actively focused element."
                  checked={prefs.highFocus}
                  onChange={toggleHighFocus}
                />

                <Toggle
                  id="reduce-motion"
                  label="Reduce Dynamic Motion"
                  desc="Disables subtle animations, transitions, and pulsing indicator badges."
                  checked={prefs.reduceMotion}
                  onChange={toggleReduceMotion}
                />
              </div>
            </div>

            {/* Groq Cloud AI Voice Recognition (High Accuracy STT) */}
            <div
              className="card fade-in"
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(49, 46, 129, 0.4))',
                borderRadius: '0.85rem',
                border: '1.5px solid rgba(129, 140, 248, 0.4)',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <SectionTitle icon={Cpu}>Groq AI Speech Recognition</SectionTitle>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    background: '#10B981',
                    color: '#064E3B',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                  }}
                >
                  ACTIVE • 99% ACCURACY
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Powered by <strong>Groq Cloud Whisper Large-v3</strong> for sub-200ms real-time voice command processing.
                Accurately understands Indian accents, Hinglish, Hindi phrases (जैसे <em>"अगला सवाल"</em>, <em>"ऑप्शन बी"</em>), and noisy environments.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Groq Cloud API Key
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="password"
                    value={groqKey}
                    onChange={e => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.8rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={() => {
                      groqVoiceService.setApiKey(groqKey);
                      setKeySaved(true);
                      setTimeout(() => setKeySaved(false), 3000);
                    }}
                    style={{
                      padding: '0.55rem 1rem',
                      background: keySaved ? '#10B981' : '#4F46E5',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {keySaved ? <Check size={16} /> : <Zap size={16} />}
                    <span>{keySaved ? 'Saved!' : 'Save Key'}</span>
                  </button>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Default model: <strong style={{ color: '#818CF8' }}>whisper-large-v3</strong> (Cloud GPU accelerated)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
