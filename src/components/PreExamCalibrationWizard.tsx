import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  Sliders,
  Clock,
  ShieldCheck,
  Eye,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Zap,
  HelpCircle
} from 'lucide-react';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';
import { globalVoiceService } from '../services/globalVoiceService';
import { useAccessibility } from '../context/AccessibilityContext';
import type { ThemeMode, FontSize } from '../types';

interface PreExamCalibrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (settings: {
    timeMultiplier: number;
    autonomousMode: boolean;
    screenReaderMode: boolean;
  }) => void;
  examTitle?: string;
}

export default function PreExamCalibrationWizard({
  isOpen,
  onClose,
  onComplete,
  examTitle = 'Mock Examination',
}: PreExamCalibrationWizardProps) {
  const { prefs, setTheme, setFontSize } = useAccessibility();
  const [step, setStep] = useState(1);

  // Calibration state
  const [audioTested, setAudioTested] = useState(false);
  const [speechRate, setSpeechRate] = useState(prefs.voiceRate || 1.0);
  const [micTested, setMicTested] = useState(false);
  const [listening, setListening] = useState(false);
  const [heardText, setHeardText] = useState('');
  const [screenReaderMode, setScreenReaderMode] = useState(
    Boolean(localStorage.getItem('sight_screen_reader_mode') === 'true')
  );
  const [timeMultiplier, setTimeMultiplier] = useState<number>(() => {
    const saved = localStorage.getItem('sight_time_multiplier');
    return saved ? parseFloat(saved) : 1.5;
  });
  const [autonomousMode, setAutonomousMode] = useState(true);

  const cleanupVoiceRef = useRef<(() => void) | null>(null);

  const handleTestAudio = useCallback(() => {
    audioCueService.select();
    speechService.configure(speechRate, prefs.voicePitch, prefs.voiceName);
    speechService.speak(
      'Audio output verified. Drishti AI speech synthesis is crystal clear and responsive. Say "Next" or press Enter to proceed to Step 2.',
      {
        priority: true,
        onEnd: () => {
          setAudioTested(true);
          audioCueService.examStart();
        },
      }
    );
    screenReaderAnnouncer.announceAssertive('Audio output verified. Press Enter to proceed to Step 2.');
  }, [speechRate, prefs.voicePitch, prefs.voiceName]);

  const handleStartMicTest = useCallback(async () => {
    setListening(true);
    setHeardText('Listening… speak "Option A" or "Next"');
    speechService.speak('Microphone is listening. Please speak now, say Option A or Next.', { priority: true });
    screenReaderAnnouncer.announcePolite('Microphone listening.');
    try {
      if (!globalVoiceService.isActive()) {
        await globalVoiceService.start();
      }
    } catch {}
  }, []);

  const handleFinish = useCallback(() => {
    localStorage.setItem('sight_exam_calibrated', 'true');
    localStorage.setItem('sight_time_multiplier', timeMultiplier.toString());
    localStorage.setItem('sight_screen_reader_mode', screenReaderMode.toString());
    localStorage.setItem('sight_autonomous_mode', autonomousMode.toString());

    audioCueService.examStart();
    speechService.speak(
      'Accessibility calibration complete. Launching autonomous examination now with your accommodations.',
      {
        priority: true,
        onEnd: () => {
          onComplete({
            timeMultiplier,
            autonomousMode,
            screenReaderMode,
          });
        },
      }
    );
    setTimeout(() => {
      onComplete({
        timeMultiplier,
        autonomousMode,
        screenReaderMode,
      });
    }, 1800);
  }, [timeMultiplier, screenReaderMode, autonomousMode, onComplete]);

  const speakStepGuidance = useCallback((currentStep: number) => {
    speechService.stop();
    let text = '';
    switch (currentStep) {
      case 1:
        text = 'Step 1 of 4: Audio output. Say "Test Audio" or press T to verify speech narration and chime cues. Say "Next" or press Enter to proceed to Step 2.';
        break;
      case 2:
        text = 'Step 2 of 4: Microphone speech recognition. The microphone is actively listening. Please say "Option A", "Next", or any phrase now. Say "Next" or press Enter to proceed to Step 3.';
        break;
      case 3:
        text = `Step 3 of 4: Visual display and screen reader mode. Current theme is ${prefs.theme === 'default' ? 'Light Clean' : prefs.theme === 'high-contrast' ? 'High Contrast Dark' : 'Yellow on Black'}. Say "Next" or press Enter to continue. Or say "High Contrast", "Dark Mode", "Screen Reader Mode", or press C to change theme, S for screen reader.`;
        break;
      case 4:
        text = `Step 4 of 4: Accommodations. Compensatory time is set to ${timeMultiplier}x. Autonomous Scribe-Free Mode is enabled. Say "Begin Exam", "Start Exam", or press Enter to launch your mock test now. Or say "Double time" or "Standard time" to adjust.`;
        break;
    }
    speechService.speak(text, { priority: true });
    screenReaderAnnouncer.announceAssertive(text);
  }, [timeMultiplier, prefs.theme]);

  const handleNext = useCallback(() => {
    if (step < 4) {
      const nextStep = step + 1;
      setStep(nextStep);
      speakStepGuidance(nextStep);
    } else {
      handleFinish();
    }
  }, [step, speakStepGuidance, handleFinish]);

  const handlePrev = useCallback(() => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      speakStepGuidance(prevStep);
    }
  }, [step, speakStepGuidance]);

  // Initial welcome and instruction on open
  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setAudioTested(false);
    setMicTested(false);

    const intro = `Pre-Exam Accessibility Calibration for ${examTitle}. Step 1 of 4: Audio Output Verification. Testing speech narration and sound cues. Say "Test Audio" or press T to test sound. Say "Next" or press Enter to proceed to Step 2. You can also say "Skip" at any time to start the exam directly.`;
    speechService.speak(intro, { priority: true });
    screenReaderAnnouncer.announceAssertive(intro);

    if (!globalVoiceService.isActive()) {
      globalVoiceService.start().catch(() => {});
    }

    return () => {
      speechService.stop();
    };
  }, [isOpen, examTitle]);

  // Auto-listen when Step 2 (Microphone Check) is active
  useEffect(() => {
    if (!isOpen || step !== 2) return;
    setListening(true);
    setHeardText('Listening… speak "Option A" or "Next"');
    if (!globalVoiceService.isActive()) {
      globalVoiceService.start().catch(() => {});
    }
  }, [isOpen, step]);

  // Dedicated Voice Command Listener for the Calibration Wizard
  useEffect(() => {
    if (!isOpen) return;

    const unregister = globalVoiceService.register((raw: string) => {
      const lower = raw.trim().toLowerCase();
      console.log(`[PreExamCalibrationWizard Voice] 🗣️ Heard: "${raw}" on Step ${step}`);

      // 1. Skip / Direct Start
      if (/\b(skip|skip\s+calibration|bypass|skip\s+test|seedha\s+start|direct\s+start|chodo)\b/i.test(lower)) {
        audioCueService.select();
        speechService.speak('Skipping calibration. Starting examination with 1.5x extra time and autonomous mode.', { priority: true });
        handleFinish();
        return true;
      }

      // 2. Start / Begin Exam
      if (
        step === 4 ||
        /\b(begin\s+(?:the\s+)?exam|start\s+(?:the\s+)?exam|launch\s+exam|shuru\s+karo|exam\s+shuru|exam\s+start|start\s+mock\s+test|begin\s+mock\s+test|finish|done)\b/i.test(lower)
      ) {
        if (
          /\b(begin|start|launch|finish|done|shuru|proceed)\b/i.test(lower) &&
          !/\b(next|mic|voice|audio|sound)\b/i.test(lower)
        ) {
          audioCueService.examStart();
          handleFinish();
          return true;
        }
      }

      // 3. Next / Advance
      if (/\b(next\s+step|next|agla|aage\s+badho|aage|forward|continue|proceed|samne)\b/i.test(lower)) {
        audioCueService.navigation();
        handleNext();
        return true;
      }

      // 4. Back / Previous
      if (/\b(previous\s+step|previous|prev|pichla|peeche\s+jao|back|go\s+back)\b/i.test(lower)) {
        audioCueService.navigation();
        if (step > 1) {
          handlePrev();
        } else {
          speechService.speak('You are at the first step.');
        }
        return true;
      }

      // 5. Repeat / Guidance
      if (/\b(repeat|repeat\s+audio|help|guidance|kya\s+karein|sunao|dobara|batao|instruction)\b/i.test(lower)) {
        speakStepGuidance(step);
        return true;
      }

      // 6. Cancel / Close
      if (/\b(cancel|close|exit|radd\s+karo|band\s+karo)\b/i.test(lower)) {
        audioCueService.select();
        speechService.speak('Calibration cancelled.');
        onClose();
        return true;
      }

      // ── Step-Specific Commands ──

      // Step 1: Audio Test
      if (step === 1) {
        if (/\b(test\s+audio|check\s+audio|audio\s+test|sound\s+test|check\s+sound|play\s+sound|audio|sound|chime)\b/i.test(lower)) {
          handleTestAudio();
          return true;
        }
      }

      // Step 2: Microphone Test
      if (step === 2) {
        setHeardText(`Heard: "${raw}"`);
        setMicTested(true);
        audioCueService.select();
        speechService.speak(`Microphone verified! Heard: ${raw}. Say "Next" or press Enter to continue.`, { priority: true });
        screenReaderAnnouncer.announcePolite(`Microphone verified: ${raw}`);
        if (/\b(next|agla|aage)\b/i.test(lower)) {
          setTimeout(() => handleNext(), 1200);
        }
        return true;
      }

      // Step 3: Theme, Font, Screen Reader
      if (step === 3) {
        if (/\b(high\s+contrast|dark\s+mode|dark\s+theme|contrast)\b/i.test(lower)) {
          setTheme('high-contrast');
          speechService.speak('High Contrast Dark theme enabled.');
          return true;
        }
        if (/\b(yellow|yellow\s+black|yellow\s+on\s+black)\b/i.test(lower)) {
          setTheme('yellow-black');
          speechService.speak('Yellow on Black high contrast theme enabled.');
          return true;
        }
        if (/\b(light\s+mode|light\s+theme|default\s+theme|normal\s+theme)\b/i.test(lower)) {
          setTheme('default');
          speechService.speak('Light Clean theme enabled.');
          return true;
        }
        if (/\b(screen\s+reader|external\s+screen\s+reader|nvda|jaws|talkback)\b/i.test(lower)) {
          const next = !screenReaderMode;
          setScreenReaderMode(next);
          speechService.speak(next ? 'External screen reader mode enabled.' : 'External screen reader mode disabled.');
          return true;
        }
        if (/\b(large\s+font|big\s+font|increase\s+font|font\s+size|font)\b/i.test(lower)) {
          setFontSize('large');
          speechService.speak('Large font size enabled.');
          return true;
        }
        if (/\b(extra\s+large|huge\s+font)\b/i.test(lower)) {
          setFontSize('xlarge');
          speechService.speak('Extra Large font size enabled.');
          return true;
        }
      }

      // Step 4: Accommodations Time Multiplier
      if (step === 4) {
        if (/\b(one\s+point\s+zero|standard\s+time|normal\s+time|1\s+point\s+0)\b/i.test(lower)) {
          setTimeMultiplier(1.0);
          speechService.speak('Compensatory time set to 1.0x standard time.');
          return true;
        }
        if (/\b(one\s+point\s+five|pwd\s+time|1\s+point\s+5|default\s+time|extra\s+time)\b/i.test(lower)) {
          setTimeMultiplier(1.5);
          speechService.speak('Compensatory time set to 1.5x PwD default extra time.');
          return true;
        }
        if (/\b(double\s+time|two\s+point\s+zero|2\s+point\s+0|double)\b/i.test(lower)) {
          setTimeMultiplier(2.0);
          speechService.speak('Compensatory time set to 2.0x double extra time.');
          return true;
        }
        if (/\b(autonomous|scribe\s+free|independent)\b/i.test(lower)) {
          const next = !autonomousMode;
          setAutonomousMode(next);
          speechService.speak(next ? 'Autonomous Scribe-Free Mode enabled.' : 'Autonomous Scribe-Free Mode disabled.');
          return true;
        }
      }

      return false;
    });

    cleanupVoiceRef.current = unregister;

    return () => {
      unregister();
    };
  }, [isOpen, step, timeMultiplier, screenReaderMode, autonomousMode, handleFinish, handleNext, handlePrev, handleTestAudio, speakStepGuidance, onClose, setTheme, setFontSize]);

  // Keyboard navigation inside wizard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' && (e.target as HTMLInputElement).type === 'text') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        screenReaderAnnouncer.announcePolite('Calibration wizard closed.');
        return;
      }
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        speechService.speak('Skipping calibration. Starting examination directly.', { priority: true });
        handleFinish();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        speakStepGuidance(step);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNext();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P' || e.key === 'Backspace') {
        e.preventDefault();
        handlePrev();
        return;
      }

      // Step 1 shortcuts
      if (step === 1) {
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          handleTestAudio();
          return;
        }
      }

      // Step 2 shortcuts
      if (step === 2) {
        if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          handleStartMicTest();
          return;
        }
      }

      // Step 3 shortcuts
      if (step === 3) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          const themes: ThemeMode[] = ['default', 'high-contrast', 'yellow-black'];
          const nextIdx = (themes.indexOf(prefs.theme) + 1) % themes.length;
          const nextTheme = themes[nextIdx];
          setTheme(nextTheme);
          const msg = `Contrast theme set to ${nextTheme === 'default' ? 'Light Clean' : nextTheme === 'high-contrast' ? 'High Contrast Dark' : 'Yellow on Black'}`;
          speechService.speak(msg);
          screenReaderAnnouncer.announcePolite(msg);
          return;
        }
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          const sizes: FontSize[] = ['default', 'large', 'xlarge'];
          const nextIdx = (sizes.indexOf(prefs.fontSize) + 1) % sizes.length;
          const nextSize = sizes[nextIdx];
          setFontSize(nextSize);
          const msg = `Font size set to ${nextSize === 'default' ? 'Normal' : nextSize === 'large' ? 'Large' : 'Extra Large'}`;
          speechService.speak(msg);
          screenReaderAnnouncer.announcePolite(msg);
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          const nextMode = !screenReaderMode;
          setScreenReaderMode(nextMode);
          const msg = nextMode ? 'External screen reader mode enabled.' : 'External screen reader mode disabled.';
          speechService.speak(msg);
          screenReaderAnnouncer.announcePolite(msg);
          return;
        }
      }

      // Step 4 shortcuts
      if (step === 4) {
        if (e.key === '1') {
          e.preventDefault();
          setTimeMultiplier(1.0);
          const msg = 'Time multiplier set to 1.0x standard time.';
          speechService.speak(msg);
          screenReaderAnnouncer.announcePolite(msg);
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          setTimeMultiplier(1.5);
          const msg = 'Time multiplier set to 1.5x PwD default extra time.';
          speechService.speak(msg);
          screenReaderAnnouncer.announcePolite(msg);
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          setTimeMultiplier(2.0);
          const msg = 'Time multiplier set to 2.0x double extra time.';
          speechService.speak(msg);
          screenReaderAnnouncer.announcePolite(msg);
          return;
        }
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          const nextAuto = !autonomousMode;
          setAutonomousMode(nextAuto);
          const msg = nextAuto ? 'Autonomous Scribe-Free Mode enabled.' : 'Autonomous Scribe-Free Mode disabled.';
          speechService.speak(msg);
          screenReaderAnnouncer.announcePolite(msg);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, timeMultiplier, autonomousMode, screenReaderMode, prefs.theme, prefs.fontSize, handleFinish, handleNext, handlePrev, handleTestAudio, handleStartMicTest, speakStepGuidance, onClose, setTheme, setFontSize]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-wizard-title"
    >
      <div
        className="card fade-in"
        style={{
          width: '100%',
          maxWidth: 680,
          background: 'var(--bg-card)',
          border: '2px solid var(--primary)',
          borderRadius: '1rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
            padding: '1.25rem 1.5rem',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '0.5rem',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} color="#fff" />
            </div>
            <div>
              <h2
                id="calibration-wizard-title"
                style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}
              >
                Pre-Exam Accessibility Calibration
              </h2>
              <p style={{ fontSize: '0.78rem', margin: 0, opacity: 0.9 }}>
                Verifying your hardware, screen-reader, and PwD accommodations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ color: '#fff', padding: '0.35rem', borderRadius: '0.4rem' }}
            aria-label="Close calibration wizard"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.5rem',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          <span style={{ color: 'var(--primary)' }}>
            Step {step} of 4: {step === 1 && 'Audio Output'}
            {step === 2 && 'Microphone Input'}
            {step === 3 && 'Screen Reader & Display'}
            {step === 4 && 'Accommodations & Time'}
          </span>
          <button
            onClick={() => speakStepGuidance(step)}
            className="btn-ghost"
            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            aria-label="Repeat step audio instructions (R)"
          >
            <Volume2 size={14} /> Repeat Audio (R)
          </button>
        </div>

        {/* Wizard Body */}
        <div
          id="calibration-wizard-scroll"
          data-scrollable="true"
          style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}
        >
          {/* STEP 1: Audio & Earcon Verification */}
          {step === 1 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Verify Speech Narration & Sound Cues
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Ensure your headphones or speakers are connected and the volume is clear. Drishti AI reads questions, options, and timer alerts aloud.
                </p>
              </div>

              <div
                style={{
                  background: audioTested ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-surface)',
                  border: audioTested ? '1.5px solid #22C55E' : '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                    Speech Synthesizer Status
                  </div>
                  <div style={{ fontSize: '0.8rem', color: audioTested ? '#16A34A' : 'var(--text-muted)' }}>
                    {audioTested ? '✓ Audio output verified and loud' : 'Click "Test Audio Output" below to test'}
                  </div>
                </div>

                <button
                  onClick={handleTestAudio}
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.1rem',
                    fontSize: '0.875rem',
                  }}
                  aria-label="Test Audio Output. Press to hear speech narration."
                >
                  <Volume2 size={16} /> Test Audio Output
                </button>
              </div>

              {/* Speed Slider */}
              <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.6rem', border: '1px solid var(--border)' }}>
                <label
                  htmlFor="speech-rate-slider"
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}
                >
                  <span>Speech Rate: {speechRate}x</span>
                  <span style={{ color: 'var(--text-muted)' }}>0.75x (Slow) – 1.5x (Fast)</span>
                </label>
                <input
                  id="speech-rate-slider"
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={speechRate}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setSpeechRate(val);
                    speechService.configure(val, prefs.voicePitch);
                  }}
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Microphone & Speech Recognition Test */}
          {step === 2 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Microphone Speech Recognition Test
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  In Independent Exam Mode, you can speak commands like <em>"Option B"</em>, <em>"Next"</em>, or <em>"Mark for review"</em> without touching the keyboard.
                </p>
              </div>

              <div
                style={{
                  background: micTested ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-surface)',
                  border: micTested ? '1.5px solid #22C55E' : '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                    Microphone Input Status
                  </div>
                  <div style={{ fontSize: '0.8rem', color: micTested ? '#16A34A' : 'var(--text-muted)' }}>
                    {micTested ? '✓ Voice recognition verified successfully' : heardText || 'Click "Start Voice Test" and speak'}
                  </div>
                </div>

                <button
                  onClick={handleStartMicTest}
                  className={listening ? 'btn-secondary' : 'btn-primary'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.1rem',
                    fontSize: '0.875rem',
                    boxShadow: listening ? '0 0 12px rgba(37,99,235,0.4)' : 'none',
                  }}
                  aria-label="Start Voice Test. Click and speak Option A or Next."
                >
                  {listening ? <Mic className="mic-pulse" size={16} /> : <Mic size={16} />}
                  {listening ? 'Listening… Speak Now' : 'Start Voice Test'}
                </button>
              </div>

              {micTested && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#16A34A',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>Speech input verified! Full voice navigation is unlocked for this session.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Visual & Screen Reader Preset */}
          {step === 3 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Visual Display & Screen Reader Preference
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Choose your contrast mode or enable screen reader compatibility mode for external software like NVDA, JAWS, or TalkBack.
                </p>
              </div>

              {/* Contrast Mode Selector */}
              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '0.5rem' }}>
                  Contrast Theme
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                  {[
                    { id: 'default', label: 'Light Clean' },
                    { id: 'high-contrast', label: 'High Contrast (Dark)' },
                    { id: 'yellow-black', label: 'Yellow on Black' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as ThemeMode)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '0.55rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: prefs.theme === t.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: prefs.theme === t.id ? 'var(--primary-light)' : 'var(--bg-surface)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                      aria-pressed={prefs.theme === t.id}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Sizing */}
              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '0.5rem' }}>
                  Reading Font Size
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                  {[
                    { id: 'default', label: 'Normal (16px)' },
                    { id: 'large', label: 'Large (18px)' },
                    { id: 'xlarge', label: 'Extra Large (22px)' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFontSize(f.id as FontSize)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '0.55rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: prefs.fontSize === f.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: prefs.fontSize === f.id ? 'var(--primary-light)' : 'var(--bg-surface)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                      aria-pressed={prefs.fontSize === f.id}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Reader Optimization Toggle */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  padding: '0.9rem',
                  borderRadius: '0.6rem',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>
                    External Screen Reader Mode (NVDA / JAWS / TalkBack)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Prioritizes ARIA live updates and suppresses simultaneous built-in browser speech to avoid voice collision.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={screenReaderMode}
                  onChange={e => {
                    setScreenReaderMode(e.target.checked);
                    speechService.speak(
                      e.target.checked
                        ? 'External screen reader mode enabled.'
                        : 'External screen reader mode disabled.'
                    );
                  }}
                  style={{ width: 20, height: 20, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  aria-label="Toggle external screen reader mode"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Accommodations & Autonomous Mode */}
          {step === 4 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Compensatory Extra Time & Autonomous Scribe-Free Mode
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Per Government of India PwD guidelines, visually impaired candidates are entitled to 20 minutes compensatory extra time per hour (1.33x - 1.5x).
                </p>
              </div>

              {/* Extra Time Multipliers */}
              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '0.5rem' }}>
                  Compensatory Time Multiplier
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[
                    { val: 1.0, label: '1.0x (Standard)' },
                    { val: 1.33, label: '1.33x (+20m/h)' },
                    { val: 1.5, label: '1.5x (PwD Default)' },
                    { val: 2.0, label: '2.0x (Double)' },
                  ].map(m => (
                    <button
                      key={m.val}
                      onClick={() => setTimeMultiplier(m.val)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '0.55rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: timeMultiplier === m.val ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: timeMultiplier === m.val ? 'var(--primary-light)' : 'var(--bg-surface)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                      aria-pressed={timeMultiplier === m.val}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Autonomous Scribe-Free Exam Mode */}
              <div
                style={{
                  background: 'rgba(37, 99, 235, 0.08)',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1.5px solid rgba(37, 99, 235, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} /> Independent Exam Mode (No Scribe Needed)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Enables voice confirmations before committing answers, audio activity audit trails, and self-guided autonomous proctoring.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autonomousMode}
                  onChange={e => setAutonomousMode(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: '#2563EB', cursor: 'pointer' }}
                  aria-label="Toggle Independent Exam Mode without scribe"
                />
              </div>

              {/* Ready Summary Banner */}
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #86EFAC',
                  borderRadius: '0.6rem',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  color: '#15803D',
                  fontWeight: 600,
                }}
              >
                <Sparkles size={18} color="#16A34A" />
                <span>All checks passed! Your examination will run with {timeMultiplier}x time in Autonomous Mode.</span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {step > 1 ? (
            <button
              onClick={handlePrev}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {step < 4 && (
              <button
                onClick={() => {
                  speechService.speak('Skipping calibration. Starting examination directly.', { priority: true });
                  handleFinish();
                }}
                className="btn-ghost"
                title="Skip calibration and start exam directly (Alt+S or say Skip)"
                style={{ fontSize: '0.825rem', color: 'var(--text-muted)', padding: '0.55rem 0.85rem' }}
                aria-label="Skip calibration and start exam directly. Shortcut: Alt plus S"
              >
                Skip to Exam (Alt+S)
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.55rem 1.25rem' }}
              >
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  padding: '0.65rem 1.5rem',
                  background: 'linear-gradient(135deg, #16A34A, #15803D)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                }}
              >
                <Zap size={16} /> Begin Examination Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
