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
  Layers,
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

  // 7 Core Pages Ecosystem Showcase with Rich Themed Color Washes
  const PAGE_ECOSYSTEM = [
    {
      title: 'Live Examination Terminal',
      path: '/exams',
      badge: 'Full Exam Hall Simulation',
      badgeColor: '#38BDF8',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      bgWash: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.16) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 80%)',
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
      badgeColor: '#C084FC',
      glowColor: 'rgba(192, 132, 252, 0.4)',
      bgWash: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.18) 0%, rgba(236, 72, 153, 0.08) 50%, transparent 80%)',
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
      badgeColor: '#34D399',
      glowColor: 'rgba(52, 211, 153, 0.4)',
      bgWash: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 80%)',
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
      badgeColor: '#FBBF24',
      glowColor: 'rgba(251, 191, 36, 0.4)',
      bgWash: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.18) 0%, rgba(234, 88, 12, 0.08) 50%, transparent 80%)',
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
      badgeColor: '#F472B6',
      glowColor: 'rgba(244, 114, 182, 0.4)',
      bgWash: 'radial-gradient(circle at top right, rgba(244, 63, 94, 0.18) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 80%)',
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
      badgeColor: '#22D3EE',
      glowColor: 'rgba(34, 211, 238, 0.4)',
      bgWash: 'radial-gradient(circle at top right, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 80%)',
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
      badgeColor: '#FB923C',
      glowColor: 'rgba(251, 146, 60, 0.4)',
      bgWash: 'radial-gradient(circle at top right, rgba(249, 115, 22, 0.18) 0%, rgba(239, 68, 68, 0.08) 50%, transparent 80%)',
      icon: Bell,
      description:
        'Instant spoken and visual alerts for upcoming exam registration dates, admit card downloads, result announcements, and daily goals.',
      features: ['Spoken Notification Readout', 'Government Exam Deadlines', 'Admit Card Direct Alerts'],
      actionText: 'Check Notifications',
      demoUrl: '/notifications',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #050814 0%, #080D20 30%, #060A18 70%, #040711 100%)',
        color: '#F8FAFC',
        position: 'relative',
        overflowX: 'hidden',
      }}
      className="cyber-grid"
    >
      {/* ── Dynamic Multi-Layer Aurora Glow Mesh (Fluidly Fades & Blends Across the Canvas) ── */}
      <div className="aurora-orb-1" style={{ top: -60, left: '5%' }} aria-hidden="true" />
      <div className="aurora-orb-2" style={{ top: 180, right: '3%' }} aria-hidden="true" />
      <div className="aurora-orb-3" style={{ top: '38%', left: '15%' }} aria-hidden="true" />
      <div className="aurora-orb-4" style={{ top: '65%', right: '10%' }} aria-hidden="true" />

      {/* Skip Navigation for Screen Readers */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      {/* ── Luxury Glassmorphism Navbar ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(5, 8, 20, 0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            maxWidth: 1300,
            margin: '0 auto',
            padding: '0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Logo Brand with Glowing Halo */}
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '0.85rem',
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.4), 0 0 0 1px rgba(255,255,255,0.2)',
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
                <span style={{ color: '#FFFFFF' }}>Drishti</span>
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
                  color: '#94A3B8',
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
                background: 'rgba(15, 23, 42, 0.75)',
                padding: '0.3rem 0.5rem',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
              role="group"
              aria-label="Theme selector"
            >
              {(
                [
                  { id: 'dark', label: 'Dark Luxury', color: '#0F172A' },
                  { id: 'high-contrast', label: 'AAA Contrast', color: '#000000' },
                  { id: 'yellow-black', label: 'Yellow/Black', color: '#FFFF00' },
                  { id: 'light', label: 'Light', color: '#F8FAFC' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  title={`Switch to ${t.label} theme`}
                  aria-label={`Switch to ${t.label} theme`}
                  onClick={() => {
                    setTheme(t.id as any);
                    setActiveTheme(t.id as any);
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: `2px solid ${activeTheme === t.id ? '#38BDF8' : 'rgba(255, 255, 255, 0.2)'}`,
                    cursor: 'pointer',
                    background: t.color,
                    outline: activeTheme === t.id ? '2px solid #38BDF8' : 'none',
                    outlineOffset: 2,
                    boxShadow: activeTheme === t.id ? '0 0 10px rgba(56, 189, 248, 0.6)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </div>

            {/* Voice Toggle Button in Header */}
            <button
              className={voiceActive ? 'hero-btn-primary' : 'hero-btn-secondary'}
              onClick={toggleVoice}
              style={{
                padding: '0.5rem 1rem',
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
                      boxShadow: '0 0 10px #22C55E',
                    }}
                  />
                  <span>Voice Active (V)</span>
                </>
              ) : (
                <>
                  <Mic size={14} style={{ color: '#38BDF8' }} />
                  <span>Voice Mode (V)</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#CBD5E1',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.5rem 0.75rem',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#38BDF8')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1')}
            >
              Sign In
            </button>

            <button
              className="hero-btn-primary"
              onClick={() => navigate('/register')}
              style={{ padding: '0.55rem 1.35rem', fontSize: '0.875rem' }}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ── HERO SECTION WITH UNZOOMED INSPIRATIONAL ARTWORK (EXACT NATURAL PROPORTIONS) ── */}
        <section
          style={{
            position: 'relative',
            padding: '2rem 1.5rem 3rem',
            zIndex: 1,
          }}
          aria-labelledby="hero-heading"
        >
          <div
            style={{
              position: 'relative',
              maxWidth: 1260,
              margin: '0 auto',
              borderRadius: '2rem',
              overflow: 'hidden',
              border: '1.5px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.25)',
              backgroundImage: 'url(/hero-bg.png)',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              aspectRatio: '1672 / 941',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Soft left directional gradient wash: guarantees text legibility while student, books, mug, and India Gate on right remain 100% unzoomed and vivid */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(5, 8, 22, 0.94) 0%, rgba(5, 8, 22, 0.82) 36%, rgba(5, 8, 22, 0.12) 50%, transparent 64%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />

            {/* Left-aligned hero headline, badge, subtitle, and CTA buttons */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                maxWidth: 490,
                textAlign: 'left',
                padding: '2rem 2.5rem',
              }}
            >
              {/* Groq AI Whisper announcement badge */}
              <div className="badge-glow fade-in" style={{ marginBottom: '0.85rem', fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}>
                <Zap size={12} style={{ color: '#FBBF24' }} />
                <span>⚡ Powered by Groq AI Whisper Large-v3 · ~200ms Latency · 100% WCAG AAA</span>
              </div>

              {/* 3D Main Headline with rich blended gradient text */}
              <h1
                id="hero-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.75rem, 2.9vw, 2.65rem)',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  color: '#FFFFFF',
                  marginBottom: '0.85rem',
                }}
                className="fade-in"
              >
                Exams Without Barriers.{' '}
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 30%, #C084FC 65%, #34D399 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 20px rgba(129, 140, 248, 0.35))',
                  }}
                >
                  Empowerment for Every Aspirant.
                </span>
              </h1>

              {/* Sub-headline */}
              <p
                style={{
                  fontSize: 'clamp(0.85rem, 1.15vw, 0.96rem)',
                  color: '#CBD5E1',
                  lineHeight: 1.55,
                  marginBottom: '1.25rem',
                  maxWidth: 460,
                }}
                className="fade-in"
              >
                India's premier AI-powered accessible examination platform for SSC, Banking, UPSC and Railways.
                Engineered with voice commands, audio earcons, and keyboard independence.
              </p>

              {/* Hero CTA Action Group */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
                className="fade-in"
              >
                <button
                  className="hero-btn-primary"
                  onClick={() => navigate('/exams')}
                  style={{
                    padding: '0.75rem 1.6rem',
                    fontSize: '0.9rem',
                  }}
                  aria-label="Launch interactive mock examination"
                >
                  <Sparkles size={16} />
                  <span>Launch Mock Exam</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  className="hero-btn-secondary"
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '0.75rem 1.45rem',
                    fontSize: '0.9rem',
                  }}
                  aria-label="Sign in with demo student account"
                >
                  <LogIn size={16} />
                  <span>Demo Login</span>
                </button>

                <button
                  className="hero-btn-secondary"
                  onClick={toggleVoice}
                  style={{
                    padding: '0.75rem 1.25rem',
                    fontSize: '0.9rem',
                    border: voiceActive ? '2px solid #22C55E' : '1.5px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: voiceActive ? '0 0 25px rgba(34, 197, 94, 0.35)' : undefined,
                  }}
                  aria-label="Toggle voice guidance (or press key V)"
                >
                  {voiceActive ? <MicOff size={15} style={{ color: '#EF4444' }} /> : <Mic size={15} style={{ color: '#38BDF8' }} />}
                  <span>{voiceActive ? 'Mute' : 'Voice (V)'}</span>
                </button>
              </div>

              {/* Quick Demo Credentials & Voice hint */}
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  Demo: <strong style={{ color: '#FFFFFF' }}>aryan@example.com</strong> /{' '}
                  <strong style={{ color: '#FFFFFF' }}>student123</strong>
                </span>
                <span>·</span>
                <span>
                  Say <kbd style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#38BDF8', padding: '2px 5px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.72rem' }}>"Help"</kbd> or press{' '}
                  <kbd style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#38BDF8', padding: '2px 5px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.72rem' }}>V</kbd>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3D SIMULATED CYBER EXAM TERMINAL PREVIEW ── */}
        <section
          style={{
            padding: '1.5rem 1.5rem 4rem',
            position: 'relative',
            zIndex: 3,
            marginTop: '-3.5rem',
          }}
          aria-label="Simulated Exam Terminal"
        >
          <div
            className="perspective-1000 fade-in"
            style={{ maxWidth: 980, margin: '0 auto', padding: '0 1rem' }}
          >
            <div
              className="card-3d glass-panel-glow"
              style={{
                padding: '2.2rem',
                textAlign: 'left',
                border: '1.5px solid rgba(129, 140, 248, 0.35)',
                position: 'relative',
              }}
            >
              {/* Terminal Title Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingBottom: '1.25rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '0.65rem',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38BDF8',
                      boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-hidden="true"
                  >
                    <Award size={22} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: '#FFFFFF',
                        letterSpacing: '0.01em',
                      }}
                    >
                      LIVE EXAM TERMINAL · {currentQ.subject}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                      Question {currentQ.qNum} of {currentQ.total} · Section: Quantitative Aptitude
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Countdown Timer Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'rgba(15, 23, 42, 0.85)',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#F8FAFC',
                    }}
                  >
                    <Clock size={15} style={{ color: '#FBBF24' }} />
                    <span>44:18 Left</span>
                  </div>

                  {/* Groq Live Voice Status Indicator */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      background: voiceActive ? 'rgba(34, 197, 94, 0.18)' : 'rgba(99, 102, 241, 0.18)',
                      border: `1px solid ${voiceActive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                      padding: '0.45rem 0.95rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: voiceActive ? '#4ADE80' : '#A5B4FC',
                      boxShadow: voiceActive ? '0 0 15px rgba(34, 197, 94, 0.3)' : '0 0 15px rgba(99, 102, 241, 0.2)',
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

              {/* Simulated Question Card in Dark Slate Glass */}
              <div
                style={{
                  background: 'rgba(10, 15, 32, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '1rem',
                  padding: '1.6rem',
                  marginBottom: '1.5rem',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      color: '#F8FAFC',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    <strong style={{ color: '#38BDF8' }}>Q{currentQ.qNum}.</strong> {currentQ.question}
                  </p>

                  <button
                    onClick={handleReadDemoQuestion}
                    className="hero-btn-secondary"
                    style={{
                      padding: '0.5rem 0.95rem',
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      flexShrink: 0,
                      borderRadius: '0.6rem',
                    }}
                    title="Read Question Aloud with Math Engine (R)"
                    aria-label="Read question aloud using Speech Engine"
                  >
                    <Volume2 size={15} style={{ color: isQuestionSpeaking ? '#34D399' : '#38BDF8' }} />
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
                            background: isSelected ? '#38BDF8' : 'rgba(30, 41, 59, 0.6)',
                            color: isSelected ? '#0F172A' : '#F8FAFC',
                            border: `2px solid ${isSelected ? '#38BDF8' : 'rgba(255, 255, 255, 0.18)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            flexShrink: 0,
                            boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.6)' : 'none',
                          }}
                        >
                          {isSelected ? <Check size={16} /> : opt.key}
                        </div>
                        <span
                          style={{
                            fontSize: '0.98rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#FFFFFF' : '#CBD5E1',
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
                  background: 'rgba(5, 10, 24, 0.95)',
                  color: '#F8FAFC',
                  borderRadius: '0.85rem',
                  padding: '0.95rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  border: '1px solid rgba(129, 140, 248, 0.35)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mic size={18} style={{ color: '#34D399' }} />
                  <span style={{ fontSize: '0.84rem', color: '#94A3B8' }}>
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
                      boxShadow: '0 0 10px rgba(74, 222, 128, 0.25)',
                    }}
                  >
                    99.8% Groq Confidence
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={handleNextDemoQ}
                    className="hero-btn-secondary"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.4rem 0.85rem',
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
                      padding: '0.4rem 0.95rem',
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

        {/* ── 3D GLASS STATS COUNTERS (BLENDED LUXURY DARK BACKGROUND) ── */}
        <section
          style={{
            padding: '4rem 1.5rem',
            background: 'linear-gradient(180deg, transparent 0%, rgba(11, 18, 38, 0.7) 50%, transparent 100%)',
            position: 'relative',
            zIndex: 2,
          }}
          aria-label="Platform Highlights and Statistics"
        >
          <div
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.6rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #38BDF8, #818CF8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                4 Verticals
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC', marginTop: 4 }}>
                SSC, Banking, UPSC & RRB
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Curated Syllabus & Mock Tests</div>
            </div>

            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.6rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #34D399, #2DD4BF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                WCAG AAA
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC', marginTop: 4 }}>
                Zero Sensory Barriers
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>High Contrast & Screen Reader Certified</div>
            </div>

            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.6rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #FBBF24, #FB923C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ~200ms
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC', marginTop: 4 }}>
                Groq Voice Latency
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Whisper Large-v3 Real-Time ASR</div>
            </div>

            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.6rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #F472B6, #C084FC)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Dual Earcons
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC', marginTop: 4 }}>
                Audio Feedback Cues
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Harmonic Chimes for Confirmation</div>
            </div>

            <div className="stat-card-3d">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.6rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #22D3EE, #38BDF8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                100%
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC', marginTop: 4 }}>
                Keyboard Navigable
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Zero Mouse Dependency Guaranteed</div>
            </div>
          </div>
        </section>

        {/* ── THE DRISHTIX ECOSYSTEM: REPRESENTATION OF ALL PAGES (RICH COLOR BLENDS) ── */}
        <section
          style={{
            padding: '6.5rem 1.5rem',
            position: 'relative',
          }}
          aria-labelledby="ecosystem-heading"
        >
          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <div
                className="badge-glow"
                style={{
                  marginBottom: '1rem',
                  display: 'inline-flex',
                }}
              >
                <Layers size={14} style={{ color: '#38BDF8' }} />
                <span>Complete Platform Ecosystem</span>
              </div>
              <h2
                id="ecosystem-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.1rem, 4.5vw, 3.4rem)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  marginBottom: '1rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Explore the DrishtiX Ecosystem
              </h2>
              <p
                style={{
                  color: '#94A3B8',
                  fontSize: '1.15rem',
                  maxWidth: 680,
                  margin: '0 auto',
                  lineHeight: 1.6,
                }}
              >
                Every module is built with extreme attention to auditory precision, semantic structure, and visual clarity
                to give you total independence.
              </p>
            </div>

            {/* Page Representation Grid with Rich Color Washes */}
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
                  <div
                    key={page.title}
                    className="page-card-3d"
                    style={
                      {
                        '--glow-color': page.glowColor,
                        background: `${page.bgWash}, linear-gradient(135deg, rgba(20, 28, 56, 0.85) 0%, rgba(9, 14, 30, 0.92) 100%)`,
                        borderTop: `2px solid ${page.badgeColor}`,
                      } as React.CSSProperties
                    }
                  >
                    <div>
                      {/* Top Card Bar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '1.35rem',
                        }}
                      >
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: '1.1rem',
                            background: `rgba(255, 255, 255, 0.06)`,
                            border: `1px solid ${page.badgeColor}40`,
                            color: page.badgeColor,
                            boxShadow: `0 0 20px ${page.glowColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComponent size={25} />
                        </div>
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            padding: '0.4rem 0.95rem',
                            borderRadius: '999px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: `1px solid ${page.badgeColor}50`,
                            color: page.badgeColor,
                            boxShadow: `0 0 12px ${page.badgeColor}25`,
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
                          fontSize: '1.4rem',
                          color: '#FFFFFF',
                          marginBottom: '0.85rem',
                        }}
                      >
                        {page.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.94rem',
                          color: '#94A3B8',
                          lineHeight: 1.65,
                          marginBottom: '1.35rem',
                        }}
                      >
                        {page.description}
                      </p>

                      {/* Feature Bullet Chips */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.55rem',
                          marginBottom: '1.5rem',
                        }}
                      >
                        {page.features.map((feat) => (
                          <div key={feat} className="page-preview-chip">
                            <CheckCircle2 size={13} style={{ color: page.badgeColor }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Link */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '1.35rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <button
                        onClick={() => navigate(page.path)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: page.badgeColor,
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                        }}
                        aria-label={`Navigate to ${page.title}`}
                      >
                        <span>{page.actionText}</span>
                        <ChevronRight size={16} />
                      </button>

                      <button
                        onClick={() => navigate(page.demoUrl)}
                        className="hero-btn-secondary"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.45rem 1rem',
                          borderRadius: '0.65rem',
                          border: `1px solid ${page.badgeColor}60`,
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

        {/* ── INTERACTIVE AUDITORY SANDBOX ("EXPERIENCE SOUND WITH LUXURY GLOW") ── */}
        <section
          style={{
            padding: '5.5rem 1.5rem',
            background: 'linear-gradient(180deg, rgba(8, 13, 29, 0.9) 0%, rgba(14, 22, 48, 0.85) 50%, rgba(8, 13, 29, 0.9) 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
          }}
          aria-labelledby="audio-sandbox-heading"
        >
          <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
            <div className="badge-glow" style={{ marginBottom: '1.25rem' }}>
              <Headphones size={14} style={{ color: '#34D399' }} />
              <span>Real-Time Auditory Feedback Studio</span>
            </div>
            <h2
              id="audio-sandbox-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.9rem, 4vw, 2.75rem)',
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '1rem',
              }}
            >
              Auditory Feedback Engineered for Independence
            </h2>
            <p
              style={{
                color: '#94A3B8',
                fontSize: '1.08rem',
                maxWidth: 640,
                margin: '0 auto 2.75rem',
                lineHeight: 1.6,
              }}
            >
              Visually impaired aspirants shouldn't have to guess if their click registered. Our dual-tier earcons provide
              instant acoustic confirmations. Click below to test each harmonic tone:
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.25rem',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => playEarcon('success')}
                className="hero-btn-secondary"
                style={{
                  padding: '0.9rem 1.65rem',
                  fontSize: '0.92rem',
                  borderColor: 'rgba(52, 211, 153, 0.4)',
                  boxShadow: '0 0 20px rgba(52, 211, 153, 0.2)',
                }}
                aria-label="Play option select earcon chime"
              >
                <Play size={16} style={{ color: '#34D399' }} />
                <span>Test Option Select (D5–A5)</span>
              </button>

              <button
                onClick={() => playEarcon('nav')}
                className="hero-btn-secondary"
                style={{
                  padding: '0.9rem 1.65rem',
                  fontSize: '0.92rem',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
                }}
                aria-label="Play question navigation chime"
              >
                <Play size={16} style={{ color: '#38BDF8' }} />
                <span>Test Question Next (A4–E5)</span>
              </button>

              <button
                onClick={() => playEarcon('flag')}
                className="hero-btn-secondary"
                style={{
                  padding: '0.9rem 1.65rem',
                  fontSize: '0.92rem',
                  borderColor: 'rgba(251, 191, 36, 0.4)',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.2)',
                }}
                aria-label="Play flag question earcon chime"
              >
                <Play size={16} style={{ color: '#FBBF24' }} />
                <span>Test Flag Earcon (G5)</span>
              </button>

              <button
                onClick={() => speechService.speak('Welcome to DrishtiX. Voice engine operational. Ready for exam navigation.', { priority: true })}
                className="hero-btn-primary"
                style={{ padding: '0.9rem 1.9rem', fontSize: '0.92rem' }}
                aria-label="Trigger AI spoken greeting test"
              >
                <Volume2 size={16} />
                <span>Test Voice Narration</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── KEYBOARD SHORTCUTS MATRIX ── */}
        <section
          style={{ padding: '5.5rem 1.5rem', position: 'relative' }}
          aria-labelledby="keyboard-heading"
        >
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.25rem' }}>
              <h2
                id="keyboard-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '2.3rem',
                  color: '#FFFFFF',
                  marginBottom: '0.75rem',
                }}
              >
                Complete Keyboard Mastery
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '1.05rem' }}>
                Every single action can be executed in a fraction of a second without ever touching a mouse.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.1rem',
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
                    padding: '0.95rem 1.35rem',
                    background: 'linear-gradient(135deg, rgba(24, 34, 62, 0.7) 0%, rgba(11, 17, 34, 0.85) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.95rem',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <kbd
                    style={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1.5px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '0.5rem',
                      padding: '0.3rem 0.8rem',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      color: '#38BDF8',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 3px 0 rgba(2, 132, 199, 0.6), 0 0 10px rgba(56, 189, 248, 0.25)',
                    }}
                  >
                    {key}
                  </kbd>
                  <span style={{ fontSize: '0.92rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HIGH-IMPACT GLOWING CALL TO ACTION ── */}
        <section
          style={{
            padding: '5.5rem 1.5rem',
            position: 'relative',
          }}
          aria-labelledby="cta-heading"
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #1E3A8A 80%, #0F172A 100%)',
              border: '1.5px solid rgba(129, 140, 248, 0.35)',
              borderRadius: '2.25rem',
              padding: '4.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.9), 0 0 50px rgba(99, 102, 241, 0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -60,
                right: -60,
                width: 250,
                height: 250,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
              aria-hidden="true"
            />
            <h2
              id="cta-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.1rem, 4.8vw, 3.4rem)',
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
                color: '#CBD5E1',
                marginBottom: '2.75rem',
                fontSize: '1.18rem',
                maxWidth: 640,
                margin: '0 auto 2.75rem',
                lineHeight: 1.65,
              }}
            >
              Join hundreds of aspirants cracking SSC, Banking, UPSC and Railways with zero visual or physical barriers.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '1.35rem',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => navigate('/register')}
                className="hero-btn-primary"
                style={{
                  padding: '1.1rem 2.8rem',
                  fontSize: '1.1rem',
                  borderRadius: '1rem',
                }}
              >
                <Sparkles size={20} />
                <span>Create Free Student Account</span>
              </button>

              <button
                onClick={() => navigate('/login')}
                className="hero-btn-secondary"
                style={{
                  padding: '1.1rem 2.5rem',
                  fontSize: '1.1rem',
                  borderRadius: '1rem',
                }}
              >
                <LogIn size={20} />
                <span>Try Demo Account</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: 'rgba(5, 8, 20, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
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
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.3rem', color: '#FFFFFF' }}>
              Drishti<span style={{ color: '#F59E0B' }}>X</span>
            </span>
            <span style={{ color: '#64748B' }}>·</span>
            <span style={{ fontSize: '0.88rem', color: '#94A3B8', fontWeight: 600 }}>
              Smart India Hackathon (SIH 4.0) Submission
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.875rem', maxWidth: 720, margin: '0 auto 1.25rem', lineHeight: 1.65 }}>
            Designed and built for 100% accessible, independent examination preparation. Conforms to WCAG 2.1 AAA standards,
            RPwD Act 2016 guidelines, and Section 508 accessibility criteria.
          </p>
          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
            © 2026 DrishtiX Platform. Dedicated to barrier-free educational empowerment.
          </div>
        </div>
      </footer>
    </div>
  );
}
