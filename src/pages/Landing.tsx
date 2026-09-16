import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Keyboard,
  BookOpen,
  Target,
  Contrast,
  Bell,
  BarChart3,
  ShieldCheck,
  Eye,
  Award,
  ArrowRight,
  Sparkles,
  LogIn,
  Volume2,
  Zap,
  FileText,
  CheckCircle2,
  Sliders,
  Clock,
  ChevronRight,
  Play,
  Headphones,
  Sparkle,
  Layers,
  Bot,
  Activity,
  Check
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { speechService } from '../services/speechService';

// Audio Earcon synthesis using Web Audio API for zero-latency auditory feedback
function playEarcon(type: 'success' | 'nav' | 'flag') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'nav') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn('Earcon audio context failed', e);
  }
}

export default function Landing() {
  const navigate = useNavigate();
  const { prefs, setTheme } = useAccessibility();
  const [activeTheme, setActiveTheme] = useState(prefs.theme);
  const { active: voiceActive, toggleVoice, status: voiceStatus, engine, lastTranscript } = useVoiceAssistant();

  // Simulated exam terminal state on the hero
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [demoQuestionIndex, setDemoQuestionIndex] = useState(0);
  const [isQuestionSpeaking, setIsQuestionSpeaking] = useState(false);

  const DEMO_QUESTIONS = [
    {
      subject: 'Quantitative Aptitude · SSC CGL & Banking',
      qNum: 7,
      total: 25,
      question: 'A merchant purchases a smart braille device for ₹4,000 and sells it at a 20% gain. What is the final selling price?',
      options: [
        { key: 'A', text: '₹4,600' },
        { key: 'B', text: '₹4,800' },
        { key: 'C', text: '₹5,000' },
        { key: 'D', text: '₹5,200' },
      ],
      correct: 'B',
      explanation: 'Profit = 20% of 4000 = ₹800. Selling Price = 4000 + 800 = ₹4,800.',
    },
    {
      subject: 'Reasoning Ability · Coding-Decoding',
      qNum: 8,
      total: 25,
      question: 'In a certain code language, if "ACCESS" is written as "BDDFTT", how is "VISION" written in that same code?',
      options: [
        { key: 'A', text: 'WJTJPO' },
        { key: 'B', text: 'WKTJPO' },
        { key: 'C', text: 'WJUJQP' },
        { key: 'D', text: 'XKTKQP' },
      ],
      correct: 'A',
      explanation: 'Each letter is shifted forward by +1: V->W, I->J, S->T, I->J, O->P, N->O.',
    },
  ];

  const currentQ = DEMO_QUESTIONS[demoQuestionIndex];

  // Step 1: Spoken Welcome & Screen Reader Announcement
  useEffect(() => {
    document.title = 'DrishtiX — Beyond Barriers, Brighter Futures | Accessible Examination Portal';
    const welcomeText =
      'Welcome to DrishtiX. Beyond Barriers, Brighter Futures. An accessible examination platform for independent learning. Press V anytime to toggle Groq AI voice guidance.';

    const announce = document.createElement('div');
    announce.setAttribute('role', 'status');
    announce.setAttribute('aria-live', 'polite');
    announce.textContent = welcomeText;
    announce.style.position = 'absolute';
    announce.style.left = '-9999px';
    document.body.appendChild(announce);

    const timer = setTimeout(() => {
      speechService.speak(welcomeText, { priority: true });
    }, 400);

    return () => {
      clearTimeout(timer);
      if (document.body.contains(announce)) {
        document.body.removeChild(announce);
      }
      speechService.stop();
    };
  }, []);

  // Step 2: Global V Hotkey Listener to trigger Voice Guidance
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === 'v' || e.key === 'V') &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        toggleVoice();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVoice]);

  const handleReadDemoQuestion = () => {
    setIsQuestionSpeaking(true);
    playEarcon('nav');
    const speech = `Question ${currentQ.qNum} of ${currentQ.total}. ${currentQ.question}. Option A: ${currentQ.options[0].text}. Option B: ${currentQ.options[1].text}. Option C: ${currentQ.options[2].text}. Option D: ${currentQ.options[3].text}.`;
    speechService.speak(speech, {
      priority: true,
      onEnd: () => setIsQuestionSpeaking(false),
    });
  };

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    setSelectedOption(opt);
    playEarcon('success');
    speechService.speak(`Option ${opt} selected: ${currentQ.options.find(o => o.key === opt)?.text}`, { priority: true });
  };

  const handleNextDemoQ = () => {
    playEarcon('nav');
    setDemoQuestionIndex((prev) => (prev + 1) % DEMO_QUESTIONS.length);
    setSelectedOption('A');
  };

  // 7 Core Pages Representations
  const PAGE_ECOSYSTEM = [
    {
      title: 'Live Examination Terminal',
      path: '/exams',
      badge: 'Real-Time Exam Mode',
      badgeColor: '#2563EB',
      icon: Award,
      description:
        'Full-screen simulated exam hall with real-time countdown, question-palette navigation, audio earcons, and dual-layer voice control.',
      features: ['Automated Math-to-Speech Engine', 'High/Low Frequency Earcon Alerts', 'Auto-Save & Review Palette'],
      actionText: 'Explore Mock Exams',
      demoUrl: '/exam/banking-quant-01',
    },
    {
      title: 'Adaptive AI Practice Drills',
      path: '/practice',
      badge: 'Targeted Remediation',
      badgeColor: '#8B5CF6',
      icon: Target,
      description:
        'Continuous AI diagnostics track your weak chapters and immediately serve bite-sized 5 to 10 question targeted practice drills.',
      features: ['Sub-60% Accuracy Auto-Drill', 'Step-by-Step Spoken Solutions', 'Confidence & Speed Calibration'],
      actionText: 'Start AI Practice',
      demoUrl: '/practice',
    },
    {
      title: 'Performance & Diagnostic Hub',
      path: '/performance',
      badge: 'Visual & Spoken Analytics',
      badgeColor: '#059669',
      icon: BarChart3,
      description:
        'In-depth performance debriefs displaying subject-wise accuracy, time-spent analysis, national benchmarks, and auditory recaps.',
      features: ['Subject Mastery Breakdown', 'Response Velocity Graphs', 'Spoken Weak-Topic Summary'],
      actionText: 'View Analytics Suite',
      demoUrl: '/performance',
    },
    {
      title: 'Audio & Text High-Yield Notes',
      path: '/study-materials',
      badge: 'Auditory Study Guides',
      badgeColor: '#F59E0B',
      icon: BookOpen,
      description:
        'Comprehensive formula cheat-sheets, static GK briefs, and revision summaries engineered with one-click conversational text-to-speech.',
      features: ['Spoken Complex Math Equations', 'Structured Topic Summaries', 'High-Contrast Reading Mode'],
      actionText: 'Browse Study Notes',
      demoUrl: '/study-materials',
    },
    {
      title: 'Previous Year Solved Papers',
      path: '/pyqs',
      badge: '10+ Years Official Archive',
      badgeColor: '#EC4899',
      icon: FileText,
      description:
        'Official archive of previous year SSC, IBPS, UPSC, and RRB questions with authentic answer keys and auditory step explanations.',
      features: ['Exam Body & Year Filters', 'Authentic Paper Structures', 'Real Trend & Weightage Signals'],
      actionText: 'Solve Past Papers',
      demoUrl: '/pyqs',
    },
    {
      title: 'Universal Accessibility Suite',
      path: '/settings',
      badge: 'WCAG 2.1 AAA Controls',
      badgeColor: '#06B6D4',
      icon: Sliders,
      description:
        'Configure the system for your exact vision and motor needs: 4 high-contrast themes, speech rate slider, cursor enlargement, and hotkeys.',
      features: ['Yellow-on-Black & High-Contrast', '0.5x – 2.0x Speech Rate Control', 'Keyboard Hotkey Customization'],
      actionText: 'Personalize Settings',
      demoUrl: '/settings',
    },
    {
      title: 'Live Notifications & Timelines',
      path: '/notifications',
      badge: 'Real-Time Exam Alerts',
      badgeColor: '#EA580C',
      icon: Bell,
      description:
        'Instant spoken and visual alerts for upcoming exam registration dates, admit card downloads, result announcements, and daily goals.',
      features: ['Spoken Notification Readout', 'Government Exam Deadlines', 'Admit Card Direct Alerts'],
      actionText: 'Check Notifications',
      demoUrl: '/notifications',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflowX: 'hidden' }}>
      {/* Ambient Floating 3D Glowing Orbs */}
      <div className="ambient-orb-1" style={{ top: -80, left: '10%' }} aria-hidden="true" />
      <div className="ambient-orb-2" style={{ top: 240, right: '5%' }} aria-hidden="true" />

      {/* Skip Navigation for Screen Readers */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      {/* ── Glassmorphism Navbar ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(var(--bg-card), 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Logo Brand */}
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '0.85rem',
                background: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '4px',
              }}
              aria-hidden="true"
            >
              <img
                src="/drishtix-icon.png"
                alt="DrishtiX Emblem"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '1.35rem',
                  lineHeight: 1.1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--text)' }}>Drishti</span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 900,
                  }}
                >
                  X
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.62rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                Beyond Barriers, Brighter Futures
              </div>
            </div>
          </div>

          {/* Quick Controls & Nav Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            {/* Theme Selector Pills */}
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                background: 'var(--bg-surface)',
                padding: '0.3rem 0.5rem',
                borderRadius: '999px',
                border: '1px solid var(--border)',
              }}
              role="group"
              aria-label="Theme selector"
            >
              {(
                [
                  { id: 'default', label: 'Light', color: '#F8FAFC' },
                  { id: 'dark', label: 'Dark', color: '#0F172A' },
                  { id: 'high-contrast', label: 'AAA Contrast', color: '#000000' },
                  { id: 'yellow-black', label: 'Yellow/Black', color: '#FFFF00' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  title={`Switch to ${t.label} theme`}
                  aria-label={`Switch to ${t.label} theme`}
                  onClick={() => {
                    setTheme(t.id);
                    setActiveTheme(t.id);
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: `2px solid ${activeTheme === t.id ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    background: t.color,
                    outline: activeTheme === t.id ? '2px solid var(--focus-ring)' : 'none',
                    outlineOffset: 2,
                    transition: 'transform 0.15s ease',
                  }}
                />
              ))}
            </div>

            {/* Voice Toggle Button in Header */}
            <button
              className={voiceActive ? 'hero-btn-primary' : 'hero-btn-secondary'}
              onClick={toggleVoice}
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.82rem',
                borderRadius: '999px',
              }}
              title="Toggle Groq AI Voice (V)"
              aria-label={voiceActive ? 'Deactivate Voice Guidance' : 'Activate Voice Guidance (Hotkey V)'}
            >
              {voiceActive ? (
                <>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#22C55E',
                      boxShadow: '0 0 8px #22C55E',
                    }}
                  />
                  <span>Voice Active (V)</span>
                </>
              ) : (
                <>
                  <Mic size={14} style={{ color: 'var(--primary)' }} />
                  <span>Voice Mode (V)</span>
                </>
              )}
            </button>

            <button
              className="btn-ghost"
              onClick={() => navigate('/login')}
              style={{ fontSize: '0.875rem', fontWeight: 600 }}
            >
              Sign In
            </button>
            <button
              className="hero-btn-primary"
              onClick={() => navigate('/register')}
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ── HERO SECTION ── */}
        <section
          style={{
            padding: '5rem 1.5rem 3rem',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
          aria-labelledby="hero-heading"
        >
          <div style={{ maxWidth: 940, margin: '0 auto' }}>
            {/* Groq AI Whisper announcement badge */}
            <div className="badge-glow fade-in" style={{ marginBottom: '1.75rem' }}>
              <Zap size={14} style={{ color: '#F59E0B' }} />
              <span>⚡ Powered by Groq AI Whisper Large-v3 · ~200ms Latency · 100% WCAG 2.1 AAA</span>
            </div>

            {/* 3D Main Headline */}
            <h1
              id="hero-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.6rem, 6.2vw, 4.8rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                color: 'var(--text)',
                marginBottom: '1.5rem',
              }}
              className="fade-in"
            >
              Exams Without Barriers.{' '}
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 45%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Empowerment for Every Aspirant.
              </span>
            </h1>

            {/* Sub-headline */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                marginBottom: '2.5rem',
                maxWidth: 720,
                margin: '0 auto 2.5rem',
              }}
              className="fade-in"
            >
              India's premier AI-powered, accessible exam & practice platform for SSC, Banking, UPSC and Railways.
              Engineered with voice commands, spoken math equations, audio earcons, and keyboard independence — no
              assistance required.
            </p>

            {/* Hero CTA Action Group */}
            <div
              style={{
                display: 'flex',
                gap: '1.25rem',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
              className="fade-in"
            >
              <button
                className="hero-btn-primary"
                onClick={() => navigate('/exams')}
                style={{
                  padding: '0.95rem 2.25rem',
                  fontSize: '1.05rem',
                }}
                aria-label="Launch interactive mock examination"
              >
                <Sparkles size={19} />
                <span>Launch Mock Exam</span>
                <ArrowRight size={18} />
              </button>

              <button
                className="hero-btn-secondary"
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.95rem 2.25rem',
                  fontSize: '1.05rem',
                }}
                aria-label="Sign in with demo student account"
              >
                <LogIn size={19} />
                <span>Demo Account</span>
              </button>

              <button
                className="hero-btn-secondary"
                onClick={toggleVoice}
                style={{
                  padding: '0.95rem 1.8rem',
                  fontSize: '1.05rem',
                  border: voiceActive ? '2px solid #22C55E' : '1.5px solid var(--border)',
                }}
                aria-label="Toggle voice guidance (or press key V)"
              >
                {voiceActive ? <MicOff size={19} style={{ color: '#EF4444' }} /> : <Mic size={19} style={{ color: 'var(--primary)' }} />}
                <span>{voiceActive ? 'Mute Voice' : 'Voice (V)'}</span>
              </button>
            </div>

            {/* Quick Demo Credentials & Voice hint */}
            <div
              style={{
                marginTop: '1.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <span>
                Demo Login: <strong style={{ color: 'var(--text)' }}>aryan@example.com</strong> /{' '}
                <strong style={{ color: 'var(--text)' }}>student123</strong>
              </span>
              <span>·</span>
              <span>
                Say <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>"Help"</kbd> or press{' '}
                <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>V</kbd> for voice commands
              </span>
            </div>
          </div>

          {/* ── 3D SIMULATED EXAM TERMINAL CARD PREVIEW ── */}
          <div
            className="perspective-1000 fade-in"
            style={{ maxWidth: 940, margin: '3.5rem auto 0', padding: '0 1rem' }}
          >
            <div
              className="card-3d glass-panel-glow"
              style={{
                padding: '2rem',
                textAlign: 'left',
                border: '1.5px solid rgba(99, 102, 241, 0.35)',
                position: 'relative',
              }}
            >
              {/* Terminal Title Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '1.25rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '0.5rem',
                      background: 'rgba(37, 99, 235, 0.12)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-hidden="true"
                  >
                    <Award size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: 'var(--text)',
                      }}
                    >
                      LIVE EXAM TERMINAL · {currentQ.subject}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Question {currentQ.qNum} of {currentQ.total} · Section: Quantitative Aptitude
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Countdown Timer Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'var(--bg-surface)',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '999px',
                      border: '1px solid var(--border)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                    }}
                  >
                    <Clock size={15} style={{ color: '#F59E0B' }} />
                    <span>44:18 Left</span>
                  </div>

                  {/* Groq Live Voice Status Indicator */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: voiceActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                      border: `1px solid ${voiceActive ? 'rgba(34, 197, 94, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
                      padding: '0.4rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: voiceActive ? '#22C55E' : 'var(--primary)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 16 }}>
                      <div className="sound-bar" style={{ animationDelay: '0.1s' }} />
                      <div className="sound-bar" style={{ animationDelay: '0.3s' }} />
                      <div className="sound-bar" style={{ animationDelay: '0.2s' }} />
                      <div className="sound-bar" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span>{voiceActive ? 'Groq Voice Active' : 'AI Voice Ready'}</span>
                  </div>
                </div>
              </div>

              {/* Simulated Question Card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    <strong style={{ color: 'var(--primary)' }}>Q{currentQ.qNum}.</strong> {currentQ.question}
                  </p>

                  <button
                    onClick={handleReadDemoQuestion}
                    className="btn-secondary"
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      flexShrink: 0,
                      borderRadius: '0.5rem',
                    }}
                    title="Read Question Aloud with Math Engine (R)"
                    aria-label="Read question aloud using Speech Engine"
                  >
                    <Volume2 size={15} style={{ color: isQuestionSpeaking ? '#22C55E' : 'var(--primary)' }} />
                    <span>{isQuestionSpeaking ? 'Speaking…' : 'Read Aloud [R]'}</span>
                  </button>
                </div>

                {/* 4 Interactive Option Buttons */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '0.85rem',
                    marginTop: '1.25rem',
                  }}
                >
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOption === opt.key;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => handleSelectOption(opt.key as 'A' | 'B' | 'C' | 'D')}
                        className={`interactive-option-preview ${isSelected ? 'selected' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSelectOption(opt.key as 'A' | 'B' | 'C' | 'D');
                          }
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                            color: isSelected ? '#FFFFFF' : 'var(--text)',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            flexShrink: 0,
                          }}
                        >
                          {isSelected ? <Check size={16} /> : opt.key}
                        </div>
                        <span
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? 'var(--primary)' : 'var(--text)',
                          }}
                        >
                          {opt.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Voice Recognition Simulated Pill */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  color: '#F8FAFC',
                  borderRadius: '0.85rem',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Mic size={18} style={{ color: '#22C55E' }} />
                  <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                    Spoken Command:{' '}
                    <strong style={{ color: '#38BDF8' }}>"Select option {selectedOption}"</strong>
                  </span>
                  <span
                    style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ADE80',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    99.8% Groq Confidence
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={handleNextDemoQ}
                    className="btn-ghost"
                    style={{
                      fontSize: '0.78rem',
                      color: '#F8FAFC',
                      padding: '0.35rem 0.75rem',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '0.5rem',
                    }}
                  >
                    Next Question [N] →
                  </button>
                  <button
                    onClick={() => navigate('/exam/banking-quant-01')}
                    className="hero-btn-primary"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '0.5rem',
                    }}
                  >
                    Full Exam Simulation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3D GLASS STATS COUNTERS ── */}
        <section
          style={{
            padding: '3.5rem 1.5rem',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            position: 'relative',
            zIndex: 2,
          }}
          aria-label="Platform Highlights and Statistics"
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                4 Verticals
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                SSC, Banking, UPSC & RRB
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Curated Syllabus & Mock Tests</div>
            </div>

            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #059669, #10B981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                WCAG AAA
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                Zero Sensory Barriers
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>High Contrast & Screen Reader Certified</div>
            </div>

            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ~200ms
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                Groq Voice Latency
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Whisper Large-v3 Real-Time ASR</div>
            </div>

            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Dual Earcons
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                Audio Feedback Cues
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Harmonic Chimes for Non-Visual Confirmation</div>
            </div>

            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #06B6D4, #2563EB)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                100%
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                Keyboard Navigable
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Zero Mouse Dependency Guaranteed</div>
            </div>
          </div>
        </section>

        {/* ── THE DRISHTIX ECOSYSTEM: REPRESENTATION OF ALL PAGES ── */}
        <section
          style={{
            padding: '6rem 1.5rem',
            background: 'var(--bg)',
            position: 'relative',
          }}
          aria-labelledby="ecosystem-heading"
        >
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <div
                className="badge-glow"
                style={{
                  marginBottom: '1rem',
                  display: 'inline-flex',
                }}
              >
                <Layers size={14} style={{ color: 'var(--primary)' }} />
                <span>Complete Platform Walkthrough</span>
              </div>
              <h2
                id="ecosystem-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                  fontWeight: 900,
                  color: 'var(--text)',
                  marginBottom: '1rem',
                }}
              >
                Explore the DrishtiX Ecosystem
              </h2>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '1.15rem',
                  maxWidth: 680,
                  margin: '0 auto',
                  lineHeight: 1.6,
                }}
              >
                Every module is built with extreme attention to auditory precision, semantic structure, and visual clarity
                to give you total autonomy.
              </p>
            </div>

            {/* Page Representation Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '2rem',
              }}
            >
              {PAGE_ECOSYSTEM.map((page) => {
                const IconComponent = page.icon;
                return (
                  <div key={page.title} className="page-card-3d">
                    <div>
                      {/* Top Card Bar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '1.25rem',
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '1rem',
                            background: `rgba(${page.badgeColor === '#2563EB' ? '37, 99, 235' : page.badgeColor === '#8B5CF6' ? '139, 92, 246' : '5, 150, 105'}, 0.12)`,
                            color: page.badgeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComponent size={24} />
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.35rem 0.85rem',
                            borderRadius: '999px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: page.badgeColor,
                          }}
                        >
                          {page.badge}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '1.35rem',
                          color: 'var(--text)',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {page.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.92rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.6,
                          marginBottom: '1.25rem',
                        }}
                      >
                        {page.description}
                      </p>

                      {/* Feature Bullet Chips */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          marginBottom: '1.5rem',
                        }}
                      >
                        {page.features.map((feat) => (
                          <div key={feat} className="page-preview-chip">
                            <CheckCircle2 size={12} style={{ color: page.badgeColor }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Link */}
                    <div
                      style={{
                        borderTop: '1px solid var(--border)',
                        paddingTop: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <button
                        onClick={() => navigate(page.path)}
                        className="btn-ghost"
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                        aria-label={`Navigate to ${page.title}`}
                      >
                        <span>{page.actionText}</span>
                        <ChevronRight size={16} />
                      </button>

                      <button
                        onClick={() => navigate(page.demoUrl)}
                        className="btn-primary"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.4rem 0.9rem',
                          borderRadius: '0.6rem',
                        }}
                      >
                        Instant Launch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE AUDITORY SANDBOX ("TEST OUR AUDIO ENGINE") ── */}
        <section
          style={{
            padding: '5rem 1.5rem',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
          aria-labelledby="audio-sandbox-heading"
        >
          <div style={{ maxWidth: 940, margin: '0 auto', textAlign: 'center' }}>
            <div className="badge-glow" style={{ marginBottom: '1rem' }}>
              <Headphones size={14} style={{ color: '#22C55E' }} />
              <span>Experience Audio Earcons in Real Time</span>
            </div>
            <h2
              id="audio-sandbox-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 900,
                color: 'var(--text)',
                marginBottom: '1rem',
              }}
            >
              Auditory Feedback Engineered for Independence
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '1.05rem',
                maxWidth: 620,
                margin: '0 auto 2.5rem',
                lineHeight: 1.6,
              }}
            >
              Visually impaired aspirants shouldn't have to guess if their click registered. Our dual-tier earcons provide
              instant acoustic confirmations. Click below to test each sound:
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => playEarcon('success')}
                className="hero-btn-secondary"
                style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
                aria-label="Play option select earcon chime"
              >
                <Play size={16} style={{ color: '#22C55E' }} />
                <span>Test Option Select Earcon (D5-A5)</span>
              </button>

              <button
                onClick={() => playEarcon('nav')}
                className="hero-btn-secondary"
                style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
                aria-label="Play question navigation chime"
              >
                <Play size={16} style={{ color: '#3B82F6' }} />
                <span>Test Question Next Earcon (A4-E5)</span>
              </button>

              <button
                onClick={() => playEarcon('flag')}
                className="hero-btn-secondary"
                style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
                aria-label="Play flag question earcon chime"
              >
                <Play size={16} style={{ color: '#F59E0B' }} />
                <span>Test Flag Question Earcon (G5)</span>
              </button>

              <button
                onClick={() => speechService.speak('Welcome to DrishtiX. Voice engine operational. Ready for exam navigation.', { priority: true })}
                className="hero-btn-primary"
                style={{ padding: '0.8rem 1.75rem', fontSize: '0.9rem' }}
                aria-label="Trigger AI spoken greeting test"
              >
                <Volume2 size={16} />
                <span>Test Speech Narration</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── KEYBOARD SHORTCUTS MATRIX ── */}
        <section
          style={{ padding: '5rem 1.5rem', background: 'var(--bg)' }}
          aria-labelledby="keyboard-heading"
        >
          <div style={{ maxWidth: 940, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2
                id="keyboard-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '2.2rem',
                  color: 'var(--text)',
                  marginBottom: '0.75rem',
                }}
              >
                Complete Keyboard Mastery
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                Every single action can be executed in a fraction of a second without ever reaching for a mouse.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {[
                ['1, 2, 3, 4', 'Select answer options A, B, C, or D immediately'],
                ['N / →', 'Advance forward to next question with audio cue'],
                ['P / ←', 'Navigate backward to previous question'],
                ['F', 'Flag or unflag current question for later review'],
                ['R', 'Read current question & all options aloud (Math TTS)'],
                ['V', 'Toggle Groq AI voice guidance listening mode'],
                ['S', 'Trigger exam submission modal confirmation'],
                ['Esc', 'Cancel active action or close dialogue modal'],
              ].map(([key, desc]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    padding: '0.85rem 1.25rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.85rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  <kbd
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '0.45rem',
                      padding: '0.25rem 0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      color: 'var(--primary)',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 0 var(--border)',
                    }}
                  >
                    {key}
                  </kbd>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HIGH-IMPACT 3D GLOWING CALL TO ACTION ── */}
        <section
          style={{
            padding: '5.5rem 1.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
          aria-labelledby="cta-heading"
        >
          <div
            style={{
              maxWidth: 1060,
              margin: '0 auto',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 45%, #7C3AED 100%)',
              borderRadius: '2rem',
              padding: '4rem 2rem',
              textAlign: 'center',
              boxShadow: '0 25px 60px -15px rgba(37, 99, 235, 0.45)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
              }}
              aria-hidden="true"
            />
            <h2
              id="cta-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '1.25rem',
                lineHeight: 1.15,
              }}
            >
              Start Preparing with Full Independence Today
            </h2>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '2.5rem',
                fontSize: '1.15rem',
                maxWidth: 620,
                margin: '0 auto 2.5rem',
                lineHeight: 1.6,
              }}
            >
              Join hundreds of aspirants cracking SSC, Banking, UPSC and Railways with zero visual or physical barriers.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '1.25rem',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: '#FFFFFF',
                  color: '#1D4ED8',
                  border: 'none',
                  borderRadius: '0.85rem',
                  padding: '1rem 2.5rem',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <Sparkles size={18} />
                <span>Create Free Student Account</span>
              </button>

              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '0.85rem',
                  padding: '1rem 2.25rem',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <LogIn size={18} />
                <span>Try Demo Account</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          padding: '3rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem', color: 'var(--text)' }}>
              Drishti<span style={{ color: '#F59E0B' }}>X</span>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Smart India Hackathon (SIH 4.0) Submission
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 700, margin: '0 auto 1rem', lineHeight: 1.6 }}>
            Designed and built for 100% accessible, independent examination preparation. Conforms to WCAG 2.1 AAA standards,
            RPwD Act 2016 guidelines, and Section 508 accessibility criteria.
          </p>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            © 2026 DrishtiX Platform. Dedicated to barrier-free educational empowerment.
          </div>
        </div>
      </footer>
    </div>
  );
}
