import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Check, X, Mic, MicOff, ArrowRight } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { speechService } from '../services/speechService';
import { classifyVoiceCommand } from '../services/voiceCommandClassifier';
import { globalVoiceService } from '../services/globalVoiceService';
import type { TextSize } from '../types';

interface OnboardingStep {
  id: number;
  question: string;
  subtext: string;
  type: 'yesno' | 'choice';
  options?: { label: string; value: string; desc: string }[];
  currentVal: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { prefs, setTheme, setFontSize } = useAccessibility();

  const [stepIndex, setStepIndex] = useState(0);
  const [voiceActive, setVoiceActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [lastSpoken, setLastSpoken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Local state reflecting user's choices
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [selectedTextSize, setSelectedTextSize] = useState<string>(prefs.fontSize || 'large');
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      question: 'Would you like voice guidance enabled?',
      subtext: 'The system will read out questions, options, timer updates, and status messages automatically.',
      type: 'yesno',
      currentVal: voiceGuidance ? 'yes' : 'no',
    },
    {
      id: 2,
      question: 'Would you like high contrast mode?',
      subtext: 'High contrast increases readability with pure black backgrounds and high-visibility neon borders.',
      type: 'yesno',
      currentVal: highContrast ? 'yes' : 'no',
    },
    {
      id: 3,
      question: 'What text size would you prefer?',
      subtext: 'Choose a comfortable reading size for questions, options, and controls.',
      type: 'choice',
      options: [
        { label: 'Normal', value: 'normal', desc: 'Standard system font size (16px)' },
        { label: 'Large', value: 'large', desc: 'Comfortable reading font (18px)' },
        { label: 'Extra Large', value: 'xlarge', desc: 'Maximum legibility font (22px)' },
      ],
      currentVal: selectedTextSize,
    },
    {
      id: 4,
      question: 'Would you like keyboard shortcuts enabled?',
      subtext: 'Use 1-4 for options, N for next, P for previous, Alt+R to read questions without touching a mouse.',
      type: 'yesno',
      currentVal: keyboardShortcuts ? 'yes' : 'no',
    },
    {
      id: 5,
      question: 'Would you like audio feedback (earcons) for actions?',
      subtext: 'Hear distinct soft chimes when answers are selected, saved, or navigation buttons are pressed.',
      type: 'yesno',
      currentVal: audioFeedback ? 'yes' : 'no',
    },
  ];

  const currentStep = steps[stepIndex];

  // Spoken read of current preference step
  const speakCurrentQuestion = useCallback((index: number) => {
    speechService.stop();
    const s = steps[index];
    let msg = `${s.question} `;
    if (s.type === 'yesno') {
      msg += 'Say Yes or No, or press Y or N on your keyboard.';
    } else if (s.options) {
      msg += 'Options are: ' + s.options.map(o => o.label).join(', ') + '. Say your choice or press 1, 2, or 3.';
    }
    speechService.speak(msg, { priority: true });
  }, [steps]);

  // Handle answers
  const handleAnswer = (answer: string) => {
    if (currentStep.id === 1) {
      const val = answer.toLowerCase().startsWith('y');
      setVoiceGuidance(val);
      speechService.speak(val ? 'Voice guidance enabled.' : 'Voice guidance turned off.');
    } else if (currentStep.id === 2) {
      const val = answer.toLowerCase().startsWith('y');
      setHighContrast(val);
      if (val) {
        setTheme('high-contrast');
        speechService.speak('High contrast mode enabled.');
      } else {
        setTheme('default');
        speechService.speak('Standard contrast mode selected.');
      }
    } else if (currentStep.id === 3) {
      let size: any = 'large';
      if (answer.includes('normal') || answer === '1') size = 'default';
      else if (answer.includes('extra') || answer.includes('xlarge') || answer === '3') size = 'xlarge';
      else size = 'large';
      setSelectedTextSize(size);
      setFontSize(size);
      speechService.speak(`Text size set to ${size === 'xlarge' ? 'Extra Large' : size === 'default' ? 'Normal' : 'Large'}.`);
    } else if (currentStep.id === 4) {
      const val = answer.toLowerCase().startsWith('y');
      setKeyboardShortcuts(val);
      speechService.speak(val ? 'Keyboard shortcuts enabled.' : 'Keyboard shortcuts turned off.');
    } else if (currentStep.id === 5) {
      const val = answer.toLowerCase().startsWith('y');
      setAudioFeedback(val);
      speechService.speak(val ? 'Audio feedback enabled.' : 'Audio feedback turned off.');
    }

    // Advance or finish
    if (stepIndex < steps.length - 1) {
      setTimeout(() => {
        setStepIndex(prev => {
          const next = prev + 1;
          speakCurrentQuestion(next);
          return next;
        });
      }, 900);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    setIsSaving(true);
    speechService.speak('Your accessibility preferences are saved. Welcome to your Student Dashboard.', {
      priority: true,
      onEnd: () => {
        navigate('/dashboard');
      },
    });
    // Fallback if onEnd doesn't fire immediately
    setTimeout(() => {
      navigate('/dashboard');
    }, 2400);
  };

  // Keyboard navigation for accessible setup
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'v' || e.key === 'V') {
        setVoiceActive(v => !v);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        speakCurrentQuestion(stepIndex);
        return;
      }
      if (currentStep.type === 'yesno') {
        if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
          handleAnswer('yes');
        } else if (e.key === 'n' || e.key === 'N') {
          handleAnswer('no');
        }
      } else if (currentStep.type === 'choice') {
        if (e.key === '1') handleAnswer('normal');
        else if (e.key === '2') handleAnswer('large');
        else if (e.key === '3') handleAnswer('xlarge');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stepIndex, currentStep]);

  // Initial welcome and preference step read
  useEffect(() => {
    document.title = 'Accessible Onboarding — SIGHT-EXAM AI';
    speechService.speak("Let's configure your accessibility preferences. Would you like voice guidance enabled? Say Yes or No, or press Y or N.", { priority: true });
    return () => speechService.stop();
  }, []);

  // Voice recognition via Global Voice Service
  useEffect(() => {
    if (!voiceActive) {
      setListening(false);
      return;
    }
    setListening(true);

    const unregister = globalVoiceService.register((rawText: string) => {
      const text = rawText.trim().toLowerCase();
      setLastSpoken(text);
      if (text.includes('yes') || text.includes('haan') || text.includes('enable')) {
        handleAnswer('yes');
        return true;
      } else if (text.includes('no') || text.includes('nahin') || text.includes('disable')) {
        handleAnswer('no');
        return true;
      } else if (text.includes('normal') || text.includes('medium') || text.includes('standard')) {
        handleAnswer('normal');
        return true;
      } else if (text.includes('large') && !text.includes('extra')) {
        handleAnswer('large');
        return true;
      } else if (text.includes('extra') || text.includes('huge') || text.includes('maximum')) {
        handleAnswer('xlarge');
        return true;
      } else if (text.includes('repeat') || text.includes('read again')) {
        speakCurrentQuestion(stepIndex);
        return true;
      }
      return false;
    });

    return () => {
      unregister();
      setListening(false);
    };
  }, [voiceActive, stepIndex]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Progress Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="badge badge-blue" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
            ACCESSIBILITY ONBOARDING WIZARD
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 900, color: 'var(--text)', marginBottom: '0.5rem' }}>
            Personalize Your Exam Experience
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Step {stepIndex + 1} of 5 · Voice and Keyboard Fully Supported
          </p>

          {/* Stepper dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '1rem' }} aria-hidden="true">
            {steps.map((s, idx) => (
              <div
                key={s.id}
                style={{
                  width: idx === stepIndex ? 32 : 12,
                  height: 12,
                  borderRadius: 6,
                  background: idx <= stepIndex ? 'var(--primary)' : 'var(--border)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Wizard Card */}
        <div
          className="card fade-in"
          style={{
            padding: '2.5rem',
            border: '2px solid var(--primary)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
          role="region"
          aria-live="polite"
          aria-label={`Step ${currentStep.id}: ${currentStep.question}`}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="badge badge-blue" style={{ fontSize: '0.85rem' }}>
              Step {currentStep.id} of 5
            </span>
            <button
              className="btn-ghost"
              onClick={() => speakCurrentQuestion(stepIndex)}
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              aria-label="Repeat this question aloud"
            >
              <Volume2 size={15} aria-hidden="true" /> Read Aloud (R)
            </button>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.3, marginBottom: '0.6rem' }}>
              {currentStep.question}
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {currentStep.subtext}
            </p>
          </div>

          {/* Input Options */}
          {currentStep.type === 'yesno' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                className="btn-primary"
                onClick={() => handleAnswer('yes')}
                style={{
                  padding: '1.1rem',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  background: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                aria-label="Yes, enable this option. Press Y or click here."
              >
                <Check size={18} aria-hidden="true" /> Yes (Press Y)
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleAnswer('no')}
                style={{
                  padding: '1.1rem',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                aria-label="No, keep this disabled. Press N or click here."
              >
                <X size={18} aria-hidden="true" /> No (Press N)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
              {currentStep.options?.map((opt, idx) => (
                <button
                  key={opt.value}
                  className="card"
                  onClick={() => handleAnswer(opt.value)}
                  style={{
                    padding: '1rem 1.25rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: selectedTextSize === opt.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: selectedTextSize === opt.value ? 'var(--primary-light)' : 'var(--bg-card)',
                  }}
                  aria-label={`${opt.label}. ${opt.desc}. Press ${idx + 1}`}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                      <span aria-hidden="true" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}>[{idx + 1}]</span>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                  <ArrowRight size={18} color="var(--primary)" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          {/* Voice Helper Bar */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: voiceActive ? '#22C55E' : '#94A3B8' }} />
              {voiceActive ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#16A34A', fontWeight: 600 }}>
                  <Mic size={14} aria-hidden="true" /> Listening for answer…
                </span>
              ) : (
                'Press V to enable voice answers'
              )}
              {lastSpoken && <span style={{ fontStyle: 'italic' }}>("{lastSpoken}")</span>}
            </div>
            <button
              className="btn-ghost"
              onClick={() => setVoiceActive(v => !v)}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {voiceActive ? (
                <><MicOff size={14} aria-hidden="true" /> Mute Mic</>
              ) : (
                <><Mic size={14} aria-hidden="true" /> Mic On (V)</>
              )}
            </button>
          </div>
        </div>

        {/* Skip to Dashboard */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            className="btn-ghost"
            onClick={finishOnboarding}
            style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            Skip and use recommended defaults <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
