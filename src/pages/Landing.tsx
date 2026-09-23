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
  Check,
  Send,
  Bot,
  Cpu,
  User,
  Users,
  GraduationCap,
  Heart,
  Sun,
  Moon,
  Accessibility,
  Bookmark,
  ChevronUp,
  Menu,
  X
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { useAuth } from '../context/AuthContext';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import { usePageVoice } from '../hooks/usePageVoice';

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
  const { user, login } = useAuth();
  const [activeTheme, setActiveTheme] = useState(prefs.theme);
  const { active: voiceActive, toggleVoice, status: voiceStatus, engine, lastTranscript } = useVoiceAssistant();

  const handleDirectDemoLogin = async (role: 'student' | 'admin') => {
    audioCueService.select();
    if (role === 'student') {
      speechService.speak('Signing in as candidate Aryan Sharma. Opening student dashboard.', { priority: true });
      const res = await login('aryan@example.com', 'student123');
      if (res.ok) {
        audioCueService.success();
        navigate('/dashboard');
      }
    } else {
      speechService.speak('Signing in as Examination Administrator. Opening management cockpit.', { priority: true });
      const res = await login('admin@drishtix.in', 'admin123');
      if (res.ok) {
        audioCueService.success();
        navigate('/admin?tab=dashboard');
      }
    }
  };

  const handleGetStarted = async () => {
    audioCueService.select();
    if (user) {
      speechService.speak('Opening student dashboard.', { priority: true });
      navigate('/dashboard');
      return;
    }
    await handleDirectDemoLogin('student');
  };

  const handleSignIn = () => {
    audioCueService.select();
    if (user) {
      speechService.speak('Opening student dashboard.', { priority: true });
      navigate('/dashboard');
    } else {
      speechService.speak('Opening sign in page.', { priority: true });
      navigate('/login');
    }
  };

  usePageVoice('Landing', [
    {
      triggers: ['get started', 'get start', 'start now', 'begin', 'open dashboard', 'dashboard', 'go to dashboard'],
      answer: () => 'Opening student dashboard.',
      action: () => handleGetStarted(),
    },
    {
      triggers: ['login as student', 'student login', 'demo student', 'student demo', 'sign in student', 'candidate login'],
      answer: () => 'Signing in as candidate Aryan Sharma. Opening student dashboard.',
      action: () => handleDirectDemoLogin('student'),
    },
    {
      triggers: ['login as admin', 'admin login', 'demo admin', 'admin demo', 'sign in admin', 'administrator login'],
      answer: () => 'Signing in as Examination Administrator. Opening management cockpit.',
      action: () => handleDirectDemoLogin('admin'),
    },
    {
      triggers: ['login', 'sign in', 'open login', 'login page'],
      answer: () => (user ? 'Opening student dashboard.' : 'Opening sign in page.'),
      action: () => handleSignIn(),
    },
    {
      triggers: ['register', 'create account', 'sign up', 'new account', 'open register'],
      answer: () => 'Opening registration page.',
      action: () => navigate('/register'),
    },
    {
      triggers: ['mock tests', 'explore mock tests', 'open mock tests', 'exams'],
      answer: () => 'Opening mock test library.',
      action: () => navigate('/exams'),
    },
    {
      triggers: ['practice', 'practice drills', 'open practice', 'abhyas'],
      answer: () => 'Opening practice drills.',
      action: () => navigate('/practice'),
    },
    {
      triggers: ['about drishtix', 'what is drishtix', 'about platform', 'platform overview'],
      answer: () => 'DrishtiX is an accessible examination and practice platform enabling visually impaired candidates to independently prepare for and participate in competitive examinations.',
    },
  ]);

  // Ultra-Smooth Scroll Progress & Floating Cockpit State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simulated exam terminal state on the hero
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [demoQuestionIndex, setDemoQuestionIndex] = useState(0);
  const [isQuestionSpeaking, setIsQuestionSpeaking] = useState(false);

  // Interactive Auditory Studio state
  const [activeSound, setActiveSound] = useState<'success' | 'nav' | 'flag' | 'speech' | null>(null);

  const triggerSound = (type: 'success' | 'nav' | 'flag' | 'speech') => {
    setActiveSound(type);
    if (type === 'speech') {
      speechService.speak('Option B confirmed. Question flagged for review. 44 minutes remaining.', {
        priority: true,
        onEnd: () => setActiveSound(null),
      });
      setTimeout(() => setActiveSound(null), 3200);
    } else {
      playEarcon(type);
      setTimeout(() => setActiveSound(null), 450);
    }
  };

  // Interactive Keyboard Cockpit HUD state
  const [activeShortcutIndex, setActiveShortcutIndex] = useState(0);

  const KEYBOARD_SHORTCUTS = [
    {
      key: '1, 2, 3, 4',
      shortKey: '1',
      badge: 'Answer Select',
      label: 'Single-Stroke Option Pick',
      desc: 'Select options A, B, C, or D immediately without cycling through tabs or using a mouse.',
      feedback: 'Ascending Chime (D5–A5) · Instant answer registration',
      tone: 'success' as const,
      bg: 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)',
      border: '#86EFAC',
      borderBottom: '#22C55E',
      textColor: '#065F46',
      badgeColor: '#059669',
    },
    {
      key: 'N / →',
      shortKey: 'N',
      badge: 'Navigation',
      label: 'Advance to Next Question',
      desc: 'Move forward to next question with a smooth tonal glide audio confirmation.',
      feedback: 'Tonal Glide (A4–E5) · Zero screen reader lag',
      tone: 'nav' as const,
      bg: 'linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)',
      border: '#7DD3FC',
      borderBottom: '#0EA5E9',
      textColor: '#0369A1',
      badgeColor: '#0284C7',
    },
    {
      key: 'P / ←',
      shortKey: 'P',
      badge: 'Navigation',
      label: 'Previous Question Hop',
      desc: 'Hop back to the previous question smoothly with reverse audio confirmation.',
      feedback: 'Tonal Glide (E5–A4) · Jumps to previous item',
      tone: 'nav' as const,
      bg: 'linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)',
      border: '#7DD3FC',
      borderBottom: '#0EA5E9',
      textColor: '#0369A1',
      badgeColor: '#0284C7',
    },
    {
      key: 'F',
      shortKey: 'F',
      badge: 'Review Tool',
      label: 'Flag for Review',
      desc: 'Toggle review status on the current question to easily revisit before submitting.',
      feedback: 'Harmonic Bell (G5) · Item flagged on palette',
      tone: 'flag' as const,
      bg: 'linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%)',
      border: '#FCD34D',
      borderBottom: '#F59E0B',
      textColor: '#92400E',
      badgeColor: '#D97706',
    },
    {
      key: 'R',
      shortKey: 'R',
      badge: 'Auditory Math',
      label: 'Read Aloud (TTS Engine)',
      desc: 'Speaks the active question, mathematical fractions, and all options in natural speech.',
      feedback: 'Speech Synthesizer · High-fidelity math narration',
      tone: 'speech' as const,
      bg: 'linear-gradient(180deg, #FFFFFF 0%, #FFF7ED 100%)',
      border: '#FDBA74',
      borderBottom: '#F97316',
      textColor: '#9A3412',
      badgeColor: '#EA580C',
    },
    {
      key: 'V',
      shortKey: 'V',
      badge: 'Voice Assistant',
      label: 'Toggle AI Voice Guidance',
      desc: 'Activate hands-free conversational voice assistant for spoken exam commands.',
      feedback: 'Voice Assistant Engine · Listening mode toggled',
      tone: 'voice' as const,
      bg: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)',
      border: '#D8B4FE',
      borderBottom: '#A855F7',
      textColor: '#6B21A8',
      badgeColor: '#7C3AED',
    },
    {
      key: 'S',
      shortKey: 'S',
      badge: 'Submission',
      label: 'Submit Examination',
      desc: 'Triggers final exam submission modal with spoken overview of attempted items.',
      feedback: 'Submission Confirmation Dialog · Auditory recap',
      tone: 'speech' as const,
      bg: 'linear-gradient(180deg, #FFFFFF 0%, #FFF1F2 100%)',
      border: '#FDA4AF',
      borderBottom: '#F43F5E',
      textColor: '#9F1239',
      badgeColor: '#E11D48',
    },
    {
      key: 'Esc',
      shortKey: 'Esc',
      badge: 'Dialog Control',
      label: 'Cancel or Dismiss',
      desc: 'Close active modal dialogues, confirmation boxes, or calibration overlays.',
      feedback: 'Dismiss Audio Cue · Focus restored to active item',
      tone: 'nav' as const,
      bg: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)',
      border: '#CBD5E1',
      borderBottom: '#64748B',
      textColor: '#334155',
      badgeColor: '#475569',
    },
  ];

  const handleShortcutClick = (idx: number) => {
    setActiveShortcutIndex(idx);
    const sc = KEYBOARD_SHORTCUTS[idx];
    if (sc.tone === 'success' || sc.tone === 'nav' || sc.tone === 'flag') {
      playEarcon(sc.tone);
    } else if (sc.tone === 'voice') {
      toggleVoice();
    } else if (sc.tone === 'speech') {
      if (sc.shortKey === 'R') {
        speechService.speak('Question 7. A merchant purchases a smart braille device for 4,000 rupees and sells it at a 20 percent gain. What is the selling price? Option A: 4,600. Option B: 4,800.', { priority: true });
      } else {
        speechService.speak('Exam submission dialog opened. You have answered 24 out of 25 questions. Press Enter to submit or Escape to resume.', { priority: true });
      }
    }
  };

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
      'Welcome to DrishtiX. Beyond Barriers, Brighter Futures. An accessible examination platform for independent learning. Press V anytime to toggle AI voice guidance.';

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

  // Ultra-Smooth Multi-Layer Scroll Reveal & Progress Engine
  useEffect(() => {
    // 1. Immediate Proximity Check: guarantees elements on-screen or within buffer are visible immediately
    const checkAndReveal = () => {
      const elements = document.querySelectorAll(
        '.scroll-reveal, .scroll-reveal-scale, .scroll-reveal-left, .scroll-reveal-right'
      );
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= viewportHeight + 140 && rect.bottom >= -140) {
          el.classList.add('revealed');
        }
      });
    };

    // 2. High-Performance IntersectionObserver with generous 140px buffer
    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '140px 0px 140px 0px',
      threshold: 0.01,
    });

    const elements = document.querySelectorAll(
      '.scroll-reveal, .scroll-reveal-scale, .scroll-reveal-left, .scroll-reveal-right'
    );
    elements.forEach((el) => observer.observe(el));

    // 3. Continuous Scroll Progress Tracker
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const winScroll = window.scrollY || document.documentElement.scrollTop;
          const height = document.documentElement.scrollHeight - (window.innerHeight || document.documentElement.clientHeight);
          const pct = height > 0 ? (winScroll / height) * 100 : 0;
          setScrollProgress(Math.min(100, Math.max(0, pct)));
          setIsScrolled(winScroll > 75);
          checkAndReveal();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Trigger on mount, scroll, hash changes and resize
    checkAndReveal();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', checkAndReveal);
    window.addEventListener('resize', checkAndReveal);

    // Multi-stage timers: ensures lazy-loaded images, fonts, or anchor jumps never leave blank spaces
    const t1 = setTimeout(checkAndReveal, 60);
    const t2 = setTimeout(checkAndReveal, 250);
    const t3 = setTimeout(checkAndReveal, 600);
    const tFallback = setTimeout(() => {
      document
        .querySelectorAll('.scroll-reveal, .scroll-reveal-scale, .scroll-reveal-left, .scroll-reveal-right')
        .forEach((el) => el.classList.add('revealed'));
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFallback);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', checkAndReveal);
      window.removeEventListener('resize', checkAndReveal);
      observer.disconnect();
    };
  }, []);

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

  // Step 2: Global Hotkey Listener: V (Voice), R (Read Aloud), N (Next Question), 1-4 (Options), Alt+P (Practice), Alt+E (Exams), Alt+S (Student Demo), Alt+A (Admin Demo), O (Orient)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        audioCueService.start();
        speechService.speak('Opening Adaptive AI Practice Drills.', { priority: true });
        navigate('/practice');
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        audioCueService.navigation();
        speechService.speak('Opening Mock Examination Hall.', { priority: true });
        navigate('/exams');
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleDirectDemoLogin('student');
      } else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleDirectDemoLogin('admin');
      } else if (e.key === 'o' || e.key === 'O' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        audioCueService.pageOrient();
        speechService.speak('Welcome to DrishtiX. An accessible online examination and practice platform enabling visually impaired candidates to independently prepare for and participate in competitive examinations. Press Alt P for practice, Alt E for mock exams, Alt S for student demo, Alt A for admin demo, or press V for the voice assistant.', { priority: true });
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        toggleVoice();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReadDemoQuestion();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNextDemoQ();
      } else if (e.key === '1') {
        handleSelectOption('A');
      } else if (e.key === '2') {
        handleSelectOption('B');
      } else if (e.key === '3') {
        handleSelectOption('C');
      } else if (e.key === '4') {
        handleSelectOption('D');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVoice, currentQ, handleReadDemoQuestion, handleNextDemoQ, handleSelectOption, navigate, handleDirectDemoLogin]);

  // 6 Core Learning Modules with Soft Muted Pastel Palettes
  const PAGE_ECOSYSTEM = [
    {
      title: 'Live Examination Terminal',
      path: '/exams',
      badge: 'Full Exam Hall Simulation',
      accentColor: '#2563EB',
      softBg: 'linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 100%)',
      softBorder: 'rgba(37, 99, 235, 0.18)',
      badgeBg: 'rgba(37, 99, 235, 0.08)',
      iconBg: 'rgba(37, 99, 235, 0.1)',
      icon: Award,
      description:
        'Full-screen simulated exam hall with real-time countdown, question-palette navigation, audio earcons, and dual-layer voice control.',
      features: ['Math-to-Speech Engine', 'Harmonic Audio Alerts', 'Review Palette'],
      actionText: 'Explore Mock Exams',
      demoUrl: '/exam/banking-quant-01',
    },
    {
      title: 'Adaptive AI Practice Drills',
      path: '/practice',
      badge: 'Targeted Remediation',
      accentColor: '#7C3AED',
      softBg: 'linear-gradient(180deg, #FAF8FF 0%, #FFFFFF 100%)',
      softBorder: 'rgba(124, 58, 237, 0.18)',
      badgeBg: 'rgba(124, 58, 237, 0.08)',
      iconBg: 'rgba(124, 58, 237, 0.1)',
      icon: Target,
      description:
        'Continuous AI diagnostics track your weak chapters and immediately serve bite-sized 5 to 10 question targeted practice drills.',
      features: ['Sub-60% Auto-Drills', 'Step-by-Step Spoken Solutions', 'Speed Calibration'],
      actionText: 'Start AI Practice',
      demoUrl: '/practice',
    },
    {
      title: 'Performance & Diagnostic Hub',
      path: '/performance',
      badge: 'Visual & Spoken Analytics',
      accentColor: '#059669',
      softBg: 'linear-gradient(180deg, #F6FBF8 0%, #FFFFFF 100%)',
      softBorder: 'rgba(5, 150, 105, 0.18)',
      badgeBg: 'rgba(5, 150, 105, 0.08)',
      iconBg: 'rgba(5, 150, 105, 0.1)',
      icon: BarChart3,
      description:
        'In-depth performance debriefs displaying subject-wise accuracy, time-spent analysis, national benchmarks, and auditory recaps.',
      features: ['Subject Mastery Breakdown', 'Response Velocity Graphs', 'Spoken Summary'],
      actionText: 'View Analytics Suite',
      demoUrl: '/performance',
    },
    {
      title: 'Audio & Text High-Yield Notes',
      path: '/study-materials',
      badge: 'Auditory Study Guides',
      accentColor: '#D97706',
      softBg: 'linear-gradient(180deg, #FFFDF7 0%, #FFFFFF 100%)',
      softBorder: 'rgba(217, 119, 6, 0.18)',
      badgeBg: 'rgba(217, 119, 6, 0.08)',
      iconBg: 'rgba(217, 119, 6, 0.1)',
      icon: BookOpen,
      description:
        'Comprehensive formula cheat-sheets, static GK briefs, and revision summaries engineered with one-click conversational text-to-speech.',
      features: ['Spoken Complex Math', 'Topic Summaries', 'High-Contrast Reading'],
      actionText: 'Browse Study Notes',
      demoUrl: '/study-materials',
    },
    {
      title: 'Previous Year Solved Papers',
      path: '/pyqs',
      badge: '10+ Years Official Archive',
      accentColor: '#BE185D',
      softBg: 'linear-gradient(180deg, #FFF8FA 0%, #FFFFFF 100%)',
      softBorder: 'rgba(190, 24, 93, 0.18)',
      badgeBg: 'rgba(190, 24, 93, 0.08)',
      iconBg: 'rgba(190, 24, 93, 0.1)',
      icon: FileText,
      description:
        'Official archive of previous year SSC, IBPS, UPSC, and RRB questions with authentic answer keys and auditory step explanations.',
      features: ['Exam Body & Year Filters', 'Authentic Paper Structures', 'Trend Signals'],
      actionText: 'Solve Past Papers',
      demoUrl: '/pyqs',
    },
    {
      title: 'Universal Accessibility Suite',
      path: '/settings',
      badge: 'WCAG 2.1 AAA Controls',
      accentColor: '#0284C7',
      softBg: 'linear-gradient(180deg, #F6FBFE 0%, #FFFFFF 100%)',
      softBorder: 'rgba(2, 132, 199, 0.18)',
      badgeBg: 'rgba(2, 132, 199, 0.08)',
      iconBg: 'rgba(2, 132, 199, 0.1)',
      icon: Sliders,
      description:
        'Configure the system for your exact vision and motor needs: 4 high-contrast themes, speech rate slider, cursor enlargement, and hotkeys.',
      features: ['High-Contrast Themes', '0.5x – 2.0x Speech Control', 'Hotkey Customization'],
      actionText: 'Personalize Settings',
      demoUrl: '/settings',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF7F2',
        color: '#0F172A',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font)',
      }}
      className="light-mesh-grid"
    >
      {/* ── ULTRA-PREMIUM TOP GLOWING SCROLL PROGRESS BAR ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5px',
          zIndex: 9999,
          pointerEvents: 'none',
          background: 'rgba(255, 255, 255, 0.08)',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            height: '100%',
            width: `${scrollProgress}%`,
            background: 'linear-gradient(90deg, #FF5722 0%, #FF8C42 40%, #0284C7 80%, #38BDF8 100%)',
            boxShadow: '0 0 16px rgba(255, 87, 34, 0.85), 0 0 5px rgba(56, 189, 248, 0.95)',
            transition: 'width 0.08s linear',
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>

      {/* ── Soft Warm Ambient Orbs for Light Luxury Feel ── */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          left: '10%',
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(60px)',
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          top: 300,
          right: '5%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(60px)',
        }}
        aria-hidden="true"
      />

      {/* Skip Navigation for Screen Readers */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      <main id="main-content">
        {/* ── HERO SECTION: FULL-BLEED BACKGROUND WITH FLOATING NAVBAR DIRECTLY ON IMAGE (NO BOX, NO COLOR OVERLAY) ── */}
        <section
          id="home"
          className="hero-bg-responsive"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '100vh',
            backgroundImage: "url('/hero-bg.png')",
            backgroundPosition: 'right bottom',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            paddingBottom: '1rem',
            overflow: 'hidden',
          }}
          aria-labelledby="hero-heading"
        >
          {/* ── Floating Navbar Directly on Top of the Background Image ── */}
          <header
            style={{
              position: 'relative',
              width: '100%',
              zIndex: 50,
              background: 'transparent',
              padding: '1.25rem clamp(1rem, 3.5vw, 2.5rem) 0.5rem',
            }}
          >
            <div
              style={{
                maxWidth: 1440,
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                position: 'relative',
              }}
            >
              {/* Logo Brand: DrishtiX Logo (Matching Reference Mockup) */}
              <div
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '0.8rem',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(255, 107, 53, 0.15), 0 1px 3px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(255, 237, 213, 0.9)',
                    flexShrink: 0,
                    overflow: 'hidden',
                    padding: '2px',
                  }}
                  aria-hidden="true"
                >
                  <img
                    src="/drishtix-logo.png"
                    alt="DrishtiX Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                      fontWeight: 900,
                      fontSize: '1.75rem',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      letterSpacing: '-0.025em',
                    }}
                  >
                    <span className="brand-text-responsive" style={{ color: '#0A1128' }}>Drishti</span>
                    <span style={{ color: '#FF5722', fontWeight: 900 }}>X</span>
                  </div>
                  <div
                    className="brand-subtext-responsive"
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748B',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      marginTop: '2px',
                    }}
                  >
                    Exams for Every Ability
                  </div>
                </div>
              </div>

              {/* Center Navigation Links (Hidden on mobile/tablet <= 960px via .desktop-nav) */}
              <nav
                className="desktop-nav"
                style={{
                  alignItems: 'center',
                  gap: '2.25rem',
                }}
                aria-label="Main Navigation"
              >
                <a
                  href="#home"
                  style={{
                    color: '#FF5722',
                    fontWeight: 700,
                    fontSize: '0.96rem',
                    textDecoration: 'none',
                    position: 'relative',
                    paddingBottom: '5px',
                  }}
                >
                  Home
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '2.5px',
                      borderRadius: 999,
                      background: '#FF5722',
                    }}
                  />
                </a>
                <a
                  href="#features"
                  style={{
                    color: '#1E293B',
                    fontWeight: 600,
                    fontSize: '0.96rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#FF5722')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#1E293B')}
                >
                  Features
                </a>
                <a
                  href="#exams"
                  style={{
                    color: '#1E293B',
                    fontWeight: 600,
                    fontSize: '0.96rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#FF5722')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#1E293B')}
                >
                  Exams
                </a>
                <a
                  href="#how-it-works"
                  style={{
                    color: '#1E293B',
                    fontWeight: 600,
                    fontSize: '0.96rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#FF5722')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#1E293B')}
                >
                  How It Works
                </a>
                <a
                  href="#accessibility"
                  style={{
                    color: '#1E293B',
                    fontWeight: 600,
                    fontSize: '0.96rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#FF5722')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#1E293B')}
                >
                  Accessibility
                </a>
              </nav>

              {/* Right Header Actions: Desktop actions (hidden <= 960px via .header-actions-desktop) */}
              <div className="header-actions-desktop" style={{ alignItems: 'center', gap: '1.35rem' }}>
                {/* Sun / Moon Theme Toggle Pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1.5px solid rgba(0, 0, 0, 0.08)',
                    padding: '0.22rem 0.45rem',
                    borderRadius: '999px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                  title="Toggle Theme"
                  onClick={() => {
                    const nextTheme = activeTheme === 'dark' ? 'default' : 'dark';
                    setActiveTheme(nextTheme);
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: activeTheme !== 'dark' ? '#FFFFFF' : 'transparent',
                      boxShadow: activeTheme !== 'dark' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F59E0B',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Sun size={13} fill="#F59E0B" />
                  </div>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: activeTheme === 'dark' ? '#1E293B' : 'transparent',
                      boxShadow: activeTheme === 'dark' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: activeTheme === 'dark' ? '#38BDF8' : '#0F172A',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Moon size={12} fill={activeTheme === 'dark' ? '#38BDF8' : '#0F172A'} />
                  </div>
                </div>

                {/* Sign In text link */}
                <button
                  onClick={handleSignIn}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0F172A',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '0.4rem 0.6rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#FF5722')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#0F172A')}
                >
                  Sign In
                </button>

                {/* Get Started -> Orange Gradient Pill Button */}
                <button
                  className="btn-orange-gradient"
                  onClick={handleGetStarted}
                  style={{
                    padding: '0.65rem 1.65rem',
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(255, 87, 34, 0.4)',
                  }}
                >
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Mobile Right Controls: Compact Theme Toggle + Hamburger Menu Button (Shown on mobile/tablet <= 960px) */}
              <div className="mobile-menu-btn" style={{ alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    const nextTheme = activeTheme === 'dark' ? 'default' : 'dark';
                    setActiveTheme(nextTheme);
                  }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1.5px solid rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeTheme !== 'dark' ? '#F59E0B' : '#38BDF8',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                  }}
                  title="Toggle Theme"
                  aria-label="Toggle Theme"
                >
                  {activeTheme !== 'dark' ? <Sun size={17} /> : <Moon size={16} />}
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1.5px solid rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    color: '#0A1128',
                    cursor: 'pointer',
                  }}
                  aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X size={20} style={{ color: '#FF5722' }} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Glassmorphic Slide-Down Drawer */}
            {mobileMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '1rem',
                  right: '1rem',
                  marginTop: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.97)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1.5px solid rgba(255, 87, 34, 0.25)',
                  borderRadius: '1.25rem',
                  padding: '1.25rem 1rem',
                  boxShadow: '0 20px 50px -10px rgba(10, 17, 40, 0.25), 0 0 0 1px rgba(0,0,0,0.04)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  animation: 'fadeInUpSmooth 0.2s ease-out forwards',
                }}
              >
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[
                    { name: 'Home', href: '#home' },
                    { name: 'Features', href: '#features' },
                    { name: 'Exams', href: '#exams' },
                    { name: 'How It Works', href: '#how-it-works' },
                    { name: 'Accessibility', href: '#accessibility' },
                  ].map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        padding: '0.7rem 0.9rem',
                        borderRadius: '0.75rem',
                        color: '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textDecoration: 'none',
                        background: '#F8FAFC',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{item.name}</span>
                      <ChevronRight size={16} style={{ color: '#FF5722' }} />
                    </a>
                  ))}
                </nav>

                <div style={{ height: 1, background: '#E2E8F0', margin: '0.2rem 0' }} />

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleSignIn(); }}
                    className="btn-white-pill"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'center' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                    className="btn-orange-gradient"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'center' }}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Main Hero Content Container (NO BOX, NO BORDER-RADIUS, NO COLOR OVERLAY!) */}
          <div
            className="hero-container-responsive"
            style={{
              position: 'relative',
              maxWidth: 1440,
              width: '100%',
              margin: '0 auto',
              padding: '0.6rem clamp(1rem, 3vw, 2.5rem) 1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              flex: 1,
            }}
          >
            {/* Top Row: Left Content Column + Floating Cards (Absolute) */}
            <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
              {/* Left Content Column */}
              <div style={{ maxWidth: 720, textAlign: 'left' }}>
                {/* Kicker Tagline: UNIVERSALLY ACCESSIBLE DIGITAL INTERFACES • RPwD ACT 2016 COMPLIANT */}
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: '#2563EB', background: 'rgba(37, 99, 235, 0.1)', padding: '0.2rem 0.55rem', borderRadius: 999, fontWeight: 800 }}>
                    RPwD Act 2016 Compliant
                  </span>
                  <span style={{ color: '#FF5722', fontSize: '1rem', lineHeight: 0 }}>•</span>
                  <span>Universally Accessible Digital Interfaces</span>
                </div>

                {/* Main Headline: Accessible Online Examination & Practice Platform */}
                <h1
                  id="hero-heading"
                  className="hero-headline-responsive"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(2.2rem, 4.4vw, 4.2rem)',
                    fontWeight: 900,
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    color: '#0A1128',
                    marginBottom: '0.65rem',
                  }}
                >
                  <span style={{ color: '#0A1128', display: 'block' }}>Accessible Online</span>
                  <span style={{ color: '#0A1128', display: 'block' }}>Examination & Practice</span>
                  <span
                    style={{
                      display: 'block',
                      color: '#FF5722',
                      fontWeight: 900,
                    }}
                  >
                    For Visually Impaired Aspirants
                  </span>
                </h1>

                {/* Sub-headline */}
                <p
                  style={{
                    fontSize: 'clamp(0.92rem, 1.05vw, 1rem)',
                    color: '#475569',
                    lineHeight: 1.5,
                    marginBottom: '0.85rem',
                    maxWidth: 520,
                    fontWeight: 500,
                  }}
                >
                  Enabling candidates to independently prepare for and participate in competitive examinations (SSC, Banking, UPSC, Railways) through eyes-free voice navigation, mathematical equation verbalization, audio diagram descriptions, and automated compensatory time.
                </p>

                {/* Primary Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Start Voice Practice */}
                  <button
                    className="btn-orange-gradient"
                    onClick={() => {
                      audioCueService.start();
                      speechService.speak('Starting Voice Practice Drills.', { priority: true });
                      navigate('/practice');
                    }}
                    title="Start Voice Practice Drills (Alt+P or Space)"
                    style={{
                      padding: '0.75rem 1.6rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Mic size={16} />
                    <span>Start Voice Practice</span>
                    <kbd style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.35rem', borderRadius: 4, marginLeft: 2 }}>Alt+P</kbd>
                  </button>

                  {/* Explore Mock Hall */}
                  <button
                    className="btn-white-pill"
                    onClick={() => {
                      audioCueService.navigation();
                      speechService.speak('Entering Mock Examination Hall.', { priority: true });
                      navigate('/exams');
                    }}
                    title="Explore Mock Examination Hall (Alt+E)"
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Award size={16} color="#FF5722" />
                    <span>Mock Exam Hall</span>
                    <kbd style={{ fontSize: '0.65rem', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.1rem 0.35rem', borderRadius: 4, marginLeft: 2 }}>Alt+E</kbd>
                  </button>
                </div>

                {/* 1-Click Instant Demo Logins Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.85rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1-Click Demo:
                  </span>

                  <button
                    onClick={() => handleDirectDemoLogin('student')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.92)',
                      border: '1.5px solid rgba(37, 99, 235, 0.35)',
                      borderRadius: '999px',
                      padding: '0.35rem 0.8rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#1D4ED8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)',
                      transition: 'all 0.15s ease',
                    }}
                    title="Instant login as Candidate Aryan Sharma (Alt+S)"
                  >
                    <User size={13} color="#2563EB" />
                    <span>Candidate Aryan</span>
                    <kbd style={{ fontSize: '0.65rem', background: 'rgba(37,99,235,0.08)', padding: '0.05rem 0.3rem', borderRadius: 3 }}>Alt+S</kbd>
                  </button>

                  <button
                    onClick={() => handleDirectDemoLogin('admin')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.92)',
                      border: '1.5px solid rgba(5, 150, 105, 0.35)',
                      borderRadius: '999px',
                      padding: '0.35rem 0.8rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#065F46',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.08)',
                      transition: 'all 0.15s ease',
                    }}
                    title="Instant login as Examination Administrator (Alt+A)"
                  >
                    <ShieldCheck size={13} color="#059669" />
                    <span>Admin Cockpit</span>
                    <kbd style={{ fontSize: '0.65rem', background: 'rgba(5,150,105,0.08)', padding: '0.05rem 0.3rem', borderRadius: 3 }}>Alt+A</kbd>
                  </button>

                  <button
                    onClick={() => {
                      audioCueService.pageOrient();
                      speechService.speak('DrishtiX accessible exam platform. Press Alt P for practice, Alt E for exams, Alt S for student demo, Alt A for admin demo, or press V for the voice assistant.', { priority: true });
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: '1px solid #CBD5E1',
                      borderRadius: '999px',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#475569',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer',
                    }}
                    title="Spoken page orientation (Key O or B)"
                  >
                    <Volume2 size={13} />
                    <span>Orient Me</span>
                    <kbd style={{ fontSize: '0.65rem', background: '#F1F5F9', padding: '0.05rem 0.25rem', borderRadius: 3 }}>O</kbd>
                  </button>
                </div>

                {/* Unified Glassmorphic Accessibility Feature Suite Card (Compact Width, Taller Presence) */}
                <div
                  style={{
                    maxWidth: 360,
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(255, 250, 245, 0.62) 100%)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1.5px solid rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 16px 36px -8px rgba(10, 17, 40, 0.10), inset 0 1px 1.5px rgba(255, 255, 255, 1), 0 0 0 1px rgba(0, 0, 0, 0.03)',
                    borderRadius: '1.25rem',
                    padding: '0.75rem 0.85rem 0.8rem',
                  }}
                  aria-label="Key Accessibility Capabilities"
                >
                  {/* Micro Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.55rem',
                      padding: '0 0.15rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sliders size={12} color="#64748B" />
                      <span
                        style={{
                          fontSize: '0.67rem',
                          fontWeight: 800,
                          color: '#475569',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Accessibility Suite
                      </span>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.63rem',
                        fontWeight: 700,
                        color: '#059669',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '999px',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#10B981',
                          boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
                        }}
                      />
                      100% Ready
                    </span>
                  </div>

                  {/* 2-Column Grid + Full-Width Foundation Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.45rem',
                    }}
                  >
                    {[
                      {
                        icon: Mic,
                        label: 'Voice Support',
                        color: '#7C3AED',
                        bg: 'rgba(124, 58, 237, 0.12)',
                        border: 'rgba(124, 58, 237, 0.25)',
                      },
                      {
                        icon: Headphones,
                        label: 'Screen Reader',
                        color: '#0284C7',
                        bg: 'rgba(2, 132, 199, 0.12)',
                        border: 'rgba(2, 132, 199, 0.25)',
                      },
                      {
                        icon: Keyboard,
                        label: 'Keyboard Nav',
                        color: '#D97706',
                        bg: 'rgba(217, 119, 6, 0.12)',
                        border: 'rgba(217, 119, 6, 0.25)',
                      },
                      {
                        icon: Cpu,
                        label: 'AI Assistance',
                        color: '#E11D48',
                        bg: 'rgba(225, 29, 72, 0.12)',
                        border: 'rgba(225, 29, 72, 0.25)',
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.45rem 0.55rem',
                          borderRadius: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(0, 0, 0, 0.05)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                          cursor: 'default',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 0, 0, 0.07)';
                          e.currentTarget.style.borderColor = item.border;
                          e.currentTarget.style.background = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '0.45rem',
                            background: item.bg,
                            color: item.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <item.icon size={14} strokeWidth={2.4} />
                        </div>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#0A1128',
                            whiteSpace: 'nowrap',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}

                    {/* 5th Item: Spanning 2 Columns (Inclusive Design Foundation) */}
                    <div
                      style={{
                        gridColumn: 'span 2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
                        border: '1px solid rgba(5, 150, 105, 0.2)',
                        boxShadow: '0 2px 5px rgba(5, 150, 105, 0.05)',
                        cursor: 'default',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 14px rgba(5, 150, 105, 0.12)';
                        e.currentTarget.style.borderColor = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 5px rgba(5, 150, 105, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(5, 150, 105, 0.2)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '0.45rem',
                            background: 'rgba(5, 150, 105, 0.12)',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Accessibility size={14} strokeWidth={2.4} />
                        </div>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#0A1128',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          Inclusive Design
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: '#059669',
                          background: 'rgba(5, 150, 105, 0.1)',
                          padding: '0.12rem 0.45rem',
                          borderRadius: '999px',
                          letterSpacing: '0.02em',
                        }}
                      >
                        WCAG 2.1 AAA
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── FLOATING OVERLAYS (PINNED RELATIVE TO THE 1400PX CANVAS) ── */}
              <div className="hero-floating-elements">
                {/* 1. Floating Card: "Listen & Answer" (Seamless Ambient Background Blend) */}
                <div
                  className="animate-float-gentle"
                  style={{
                    position: 'absolute',
                    top: '6%',
                    left: '49%',
                    borderRadius: '1.35rem',
                    padding: '0.85rem 1.3rem',
                    width: 240,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 250, 245, 0.42) 100%)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.75)',
                    boxShadow: '0 16px 36px -8px rgba(10, 17, 40, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.95), 0 0 1px rgba(0, 0, 0, 0.04)',
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      marginBottom: '0.45rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Listen & Answer
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.65rem',
                      marginBottom: '0.45rem',
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: 'rgba(124, 58, 237, 0.12)',
                        color: '#7C3AED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Mic size={13} strokeWidth={2.3} />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        height: 24,
                        padding: '0 2px',
                      }}
                      aria-label="Audio waveform indicator"
                    >
                      {[
                        { cl: 'eq-bar-1', bg: '#38BDF8' },
                        { cl: 'eq-bar-2', bg: '#60A5FA' },
                        { cl: 'eq-bar-3', bg: '#818CF8' },
                        { cl: 'eq-bar-4', bg: '#A855F7' },
                        { cl: 'eq-bar-5', bg: '#60A5FA' },
                        { cl: 'eq-bar-6', bg: '#38BDF8' },
                        { cl: 'eq-bar-7', bg: '#818CF8' },
                      ].map((bar, i) => (
                        <div
                          key={i}
                          className={bar.cl}
                          style={{
                            width: 3,
                            background: bar.bg,
                            borderRadius: 999,
                          }}
                        />
                      ))}
                    </div>

                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingLeft: '2px',
                        boxShadow: '0 3px 8px rgba(37, 99, 235, 0.25)',
                      }}
                    >
                      <Play size={10} fill="#FFFFFF" />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.67rem',
                      fontWeight: 600,
                      color: '#64748B',
                      background: 'rgba(255, 255, 255, 0.55)',
                      padding: '0.15rem 0.6rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    <span
                      className="animate-beacon-dot"
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#10B981',
                        boxShadow: '0 0 5px rgba(16, 185, 129, 0.7)',
                      }}
                    />
                    Question 1 of 50
                  </div>
                </div>



                {/* 3. Handwriting Script: "Accessibility Creates Opportunity" with Arrow */}
                <div
                  className="animate-float-script"
                  style={{
                    position: 'absolute',
                    top: '5%',
                    left: '68%',
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    className="font-caveat"
                    style={{
                      fontSize: '2.15rem',
                      fontWeight: 700,
                      color: '#0F172A',
                      lineHeight: 1.05,
                      textAlign: 'center',
                    }}
                  >
                    Accessibility
                    <br />
                    Creates Opportunity
                  </div>
                  <svg
                    width="65"
                    height="42"
                    viewBox="0 0 65 42"
                    fill="none"
                    style={{ margin: '0 auto', display: 'block', transform: 'rotate(5deg)' }}
                    aria-hidden="true"
                  >
                    <path
                      d="M8 5 C 24 22, 42 28, 56 36"
                      stroke="#FF5722"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M46 36 L 56 36 L 52 26"
                      stroke="#FF5722"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* 4. Floating Glass Card: "Choose Your Mode" (Seamless Ambient Background Blend) */}
                <div
                  className="animate-float-slow"
                  style={{
                    position: 'absolute',
                    top: '7%',
                    right: '2.5%',
                    borderRadius: '1.25rem',
                    padding: '0.95rem 1.1rem',
                    width: 195,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 250, 245, 0.42) 100%)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.75)',
                    boxShadow: '0 16px 36px -8px rgba(10, 17, 40, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.95), 0 0 1px rgba(0, 0, 0, 0.05)',
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#0A1128',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Choose Your Mode
                    </span>
                    <span
                      className="animate-beacon-dot"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#10B981',
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
                      }}
                      title="Active"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {/* Mode 1: Voice Mode (Selected Active Glass Pill) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        padding: '0.42rem 0.65rem',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(254, 243, 199, 0.5) 100%)',
                        color: '#0A1128',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        boxShadow: '0 3px 10px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'rgba(245, 158, 11, 0.18)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#D97706',
                          flexShrink: 0,
                        }}
                      >
                        <Mic size={11} strokeWidth={2.4} />
                      </div>
                      <span>Voice Mode</span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: '#D97706',
                          background: 'rgba(245, 158, 11, 0.15)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: 999,
                        }}
                      >
                        ON
                      </span>
                    </div>

                    {/* Modes 2 to 5 (Soft Translucent Blended Items) */}
                    {[
                      { icon: Headphones, label: 'Screen Reader', iconColor: '#0284C7' },
                      { icon: Keyboard, label: 'Keyboard', iconColor: '#64748B' },
                      { icon: Eye, label: 'Visual Mode', iconColor: '#64748B' },
                      { icon: Sliders, label: 'Custom Setup', iconColor: '#64748B' },
                    ].map((mode, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          padding: '0.38rem 0.65rem',
                          borderRadius: '0.65rem',
                          color: '#475569',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                          e.currentTarget.style.color = '#0A1128';
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#475569';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <mode.icon size={13} style={{ color: mode.iconColor }} />
                        <span>{mode.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div> {/* end hero-floating-elements */}
            </div>
          </div>
        </section>

        {/* ── 2. PLATFORM FEATURES & ECOSYSTEM ── */}
        <section
          id="features"
          style={{
            padding: '5rem 1.5rem',
            position: 'relative',
          }}
          aria-labelledby="features-heading"
        >
          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2
                id="features-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.1rem, 4.5vw, 3.4rem)',
                  fontWeight: 900,
                  color: '#0A1128',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Core Features for{' '}
                <span style={{ color: '#FF5722' }}>Barrier-Free Success</span>
              </h2>
            </div>

            {/* Feature Modules Grid - Compact Height with Soft Harmonious Colors */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                gap: '1.25rem',
              }}
            >
              {PAGE_ECOSYSTEM.map((page, idx) => {
                const IconComponent = page.icon;
                return (
                  <div
                    key={page.title}
                    className={`card-light-luxury scroll-reveal hover-lift-smooth stagger-${(idx % 3) + 1}`}
                    style={{
                      background: page.softBg,
                      border: `1px solid ${page.softBorder}`,
                      borderTop: `3px solid ${page.accentColor}`,
                      borderRadius: '1.2rem',
                      padding: '1.25rem 1.45rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
                    }}
                  >
                    <div>
                      {/* Top Card Bar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '0.75rem',
                            background: page.iconBg,
                            color: page.accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComponent size={20} />
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.22rem 0.7rem',
                            borderRadius: '999px',
                            background: page.badgeBg,
                            border: `1px solid ${page.softBorder}`,
                            color: page.accentColor,
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
                          fontSize: '1.12rem',
                          color: '#0F172A',
                          marginBottom: '0.35rem',
                          lineHeight: 1.25,
                        }}
                      >
                        {page.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.86rem',
                          color: '#475569',
                          lineHeight: 1.48,
                          marginBottom: '0.75rem',
                        }}
                      >
                        {page.description}
                      </p>

                      {/* Feature Bullet Chips */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.35rem',
                          marginBottom: '0.85rem',
                        }}
                      >
                        {page.features.map((feat) => (
                          <div
                            key={feat}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              background: 'rgba(255, 255, 255, 0.85)',
                              border: '1px solid rgba(0, 0, 0, 0.05)',
                              padding: '0.18rem 0.5rem',
                              borderRadius: '0.4rem',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              color: '#334155',
                            }}
                          >
                            <CheckCircle2 size={11} style={{ color: page.accentColor }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Link */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                        paddingTop: '0.75rem',
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
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: page.accentColor,
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                        }}
                        aria-label={`Navigate to ${page.title}`}
                      >
                        <span>{page.actionText}</span>
                        <ChevronRight size={15} />
                      </button>

                      <button
                        onClick={() => navigate(page.demoUrl)}
                        className="btn-white-pill"
                        style={{
                          fontSize: '0.74rem',
                          padding: '0.32rem 0.75rem',
                          borderRadius: '0.5rem',
                          borderColor: page.softBorder,
                          color: '#1E293B',
                          background: '#FFFFFF',
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

        {/* ── 3. SIMULATED LIVE EXAM TERMINAL & PLATFORM STATS ── */}
        <section
          id="exams"
          style={{
            padding: '4rem 1.5rem 3.5rem',
            position: 'relative',
            zIndex: 3,
          }}
          aria-labelledby="exams-heading"
        >
          <span id="demo-exam-terminal" style={{ position: 'absolute', top: '-90px' }} />

          {/* Section Heading */}
          <div className="scroll-reveal" style={{ maxWidth: 1060, margin: '0 auto', textAlign: 'center', marginBottom: '2rem' }}>
            <h2
              id="exams-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 900,
                color: '#0A1128',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Live Examination{' '}
              <span style={{ color: '#FF5722' }}>Terminal Preview</span>
            </h2>
          </div>

          <div
            className="perspective-1000 scroll-reveal"
            style={{ maxWidth: 1060, margin: '0 auto' }}
          >
            {/* Live Terminal Cockpit Window */}
            <div
              className="cockpit-window-responsive"
              style={{
                background: '#FFFFFF',
                borderRadius: '1.25rem',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
                padding: '1.75rem 2rem',
                textAlign: 'left',
                position: 'relative',
              }}
            >
              {/* Terminal Title Bar / Window Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                  paddingBottom: '1.15rem',
                  marginBottom: '1.35rem',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                }}
              >
                {/* Left: Window Dots + Live Badge + Subject */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* macOS / Terminal Console Dots */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '0.25rem' }} aria-hidden="true">
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444', border: '1px solid #DC2626' }} />
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#F59E0B', border: '1px solid #D97706' }} />
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#10B981', border: '1px solid #059669' }} />
                  </div>

                  <div style={{ width: 1, height: 18, background: '#E2E8F0' }} aria-hidden="true" />

                  {/* Pulsing Live Beacon */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#059669',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
                    <span>LIVE SIMULATION</span>
                  </div>

                  {/* Subject Badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      padding: '0.25rem 0.7rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                    }}
                  >
                    <Award size={14} style={{ color: '#0284C7' }} />
                    <span>{currentQ.subject}</span>
                  </div>
                </div>

                {/* Right: Timer + AI Voice Active Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {/* Question Counter Chip */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#64748B',
                    }}
                  >
                    Question <strong>{currentQ.qNum}</strong> of {currentQ.total}
                  </div>

                  {/* Countdown Timer Chip */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#92400E',
                    }}
                  >
                    <Clock size={14} style={{ color: '#D97706' }} />
                    <span>44:18 Left</span>
                  </div>

                  {/* Live AI Voice Status Pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: voiceActive ? '#ECFDF5' : '#EFF6FF',
                      border: `1px solid ${voiceActive ? '#A7F3D0' : '#BFDBFE'}`,
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: voiceActive ? '#065F46' : '#1E40AF',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2.5, height: 14 }}>
                      <div className="sound-bar" style={{ animationDelay: '0.1s', background: voiceActive ? '#059669' : '#2563EB', height: 10 }} />
                      <div className="sound-bar" style={{ animationDelay: '0.3s', background: voiceActive ? '#059669' : '#2563EB', height: 14 }} />
                      <div className="sound-bar" style={{ animationDelay: '0.2s', background: voiceActive ? '#059669' : '#2563EB', height: 8 }} />
                      <div className="sound-bar" style={{ animationDelay: '0.4s', background: voiceActive ? '#059669' : '#2563EB', height: 12 }} />
                    </div>
                    <span>{voiceActive ? 'AI Voice Active' : 'AI Voice Ready'}</span>
                  </div>
                </div>
              </div>

              {/* Simulated Question Card */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.9rem',
                  padding: '1.4rem 1.6rem',
                  marginBottom: '1.25rem',
                }}
              >
                {/* Question Top Row: Meta Pill & Read Aloud [R] Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span
                      style={{
                        background: '#0284C7',
                        color: '#FFFFFF',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '0.4rem',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                      }}
                    >
                      Q{currentQ.qNum}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>
                      +2.00 Marks · -0.50 Neg
                    </span>
                  </div>

                  <button
                    onClick={handleReadDemoQuestion}
                    className="btn-white-pill"
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      flexShrink: 0,
                      borderRadius: '0.5rem',
                      background: isQuestionSpeaking ? '#ECFDF5' : '#FFFFFF',
                      borderColor: isQuestionSpeaking ? '#A7F3D0' : '#CBD5E1',
                      color: isQuestionSpeaking ? '#065F46' : '#1E293B',
                    }}
                    title="Read Question Aloud (Hotkey: R)"
                    aria-label="Read question aloud using Speech Engine"
                  >
                    <Volume2 size={15} style={{ color: isQuestionSpeaking ? '#059669' : '#0284C7' }} />
                    <span>{isQuestionSpeaking ? 'Speaking…' : 'Read Aloud'}</span>
                    <span className="keycap-pill">R</span>
                  </button>
                </div>

                {/* Question Text */}
                <p
                  style={{
                    fontSize: '1.14rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {currentQ.question}
                </p>

                {/* 4 Interactive Option Buttons */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                    gap: '0.85rem',
                    marginTop: '1.25rem',
                  }}
                >
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedOption === opt.key;
                    const keyNumber = idx + 1;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => handleSelectOption(opt.key as 'A' | 'B' | 'C' | 'D')}
                        className={`option-pill-light ${isSelected ? 'selected' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSelectOption(opt.key as 'A' | 'B' | 'C' | 'D');
                          }
                        }}
                        style={{
                          justifyContent: 'space-between',
                          padding: '0.85rem 1.15rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: isSelected ? '#0284C7' : '#F1F5F9',
                              color: isSelected ? '#FFFFFF' : '#475569',
                              border: `2px solid ${isSelected ? '#0284C7' : '#CBD5E1'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              flexShrink: 0,
                              boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {isSelected ? <Check size={16} /> : opt.key}
                          </div>
                          <span
                            style={{
                              fontSize: '1.02rem',
                              fontWeight: isSelected ? 800 : 600,
                              color: isSelected ? '#0369A1' : '#1E293B',
                            }}
                          >
                            {opt.text}
                          </span>
                        </div>

                        {/* Accessibility Keycap badge */}
                        <span className="keycap-pill" title={`Hotkey: ${keyNumber}`}>
                          {keyNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Terminal Action Dock & Voice Feedback */}
              <div
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  borderRadius: '0.85rem',
                  padding: '0.9rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                }}
              >
                {/* Left: Voice Recognition Feedback */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-hidden="true"
                  >
                    <Mic size={15} />
                  </div>
                  <span style={{ fontSize: '0.84rem', color: '#64748B' }}>
                    Spoken Command:{' '}
                    <strong style={{ color: '#0284C7' }}>"Select option {selectedOption}"</strong>
                  </span>
                  <span
                    style={{
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    99.8% AI Confidence
                  </span>
                </div>

                {/* Right: Tactile Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    onClick={handleNextDemoQ}
                    className="btn-white-pill"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.5rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                    title="Next Question (Hotkey: N)"
                  >
                    <span>Next Question</span>
                    <span className="keycap-pill">N</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => navigate('/exam/banking-quant-01')}
                    className="btn-orange-gradient"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.45rem 1.05rem',
                      borderRadius: '0.5rem',
                    }}
                  >
                    Full Exam Simulation
                  </button>
                </div>
              </div>
            </div>

            {/* ── 5 COMPACT STATS SPEC CARDS (DOCK-ALIGNED) ── */}
            <div
              className="stat-grid-responsive"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap: '1rem',
                marginTop: '1.5rem',
              }}
              aria-label="Platform Highlights and Specifications"
            >
              {/* Stat 1: 4 Verticals */}
              <div
                className="stat-pill-card"
                style={{
                  background: '#F0F7FF',
                  border: '1px solid #BAE6FD',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '0.5rem',
                    background: '#E0F2FE',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem',
                  }}
                  aria-hidden="true"
                >
                  <Layers size={18} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.42rem',
                    fontWeight: 900,
                    color: '#0284C7',
                    lineHeight: 1.15,
                  }}
                >
                  4 Verticals
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                  SSC, Banking, UPSC
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                  Curated Syllabus & Mocks
                </div>
              </div>

              {/* Stat 2: WCAG AAA */}
              <div
                className="stat-pill-card"
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '0.5rem',
                    background: '#DCFCE7',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem',
                  }}
                  aria-hidden="true"
                >
                  <ShieldCheck size={18} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.42rem',
                    fontWeight: 900,
                    color: '#059669',
                    lineHeight: 1.15,
                  }}
                >
                  WCAG AAA
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                  Zero Sensory Barriers
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                  Screen Reader Certified
                </div>
              </div>

              {/* Stat 3: ~200ms Voice Latency */}
              <div
                className="stat-pill-card"
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '0.5rem',
                    background: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem',
                  }}
                  aria-hidden="true"
                >
                  <Zap size={18} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.42rem',
                    fontWeight: 900,
                    color: '#D97706',
                    lineHeight: 1.15,
                  }}
                >
                  ~200ms
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                  Ultra-Low Voice Latency
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                  Whisper Large-v3 ASR
                </div>
              </div>

              {/* Stat 4: Dual Earcons */}
              <div
                className="stat-pill-card"
                style={{
                  background: '#FAF5FF',
                  border: '1px solid #E9D5FF',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '0.5rem',
                    background: '#F3E8FF',
                    color: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem',
                  }}
                  aria-hidden="true"
                >
                  <Headphones size={18} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.42rem',
                    fontWeight: 900,
                    color: '#7C3AED',
                    lineHeight: 1.15,
                  }}
                >
                  Dual Earcons
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                  Audio Feedback Cues
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                  Harmonic Audio Alerts
                </div>
              </div>

              {/* Stat 5: 100% Keyboard Navigable */}
              <div
                className="stat-pill-card"
                style={{
                  background: '#F0FDFA',
                  border: '1px solid #99F6E4',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '0.5rem',
                    background: '#CCFBF1',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem',
                  }}
                  aria-hidden="true"
                >
                  <Keyboard size={18} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.42rem',
                    fontWeight: 900,
                    color: '#0D9488',
                    lineHeight: 1.15,
                  }}
                >
                  100% Access
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                  Keyboard Navigable
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                  Zero Mouse Needed
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. HOW IT WORKS: 3-STEP ACCESSIBLE WORKFLOW & AUDITORY STUDIO ── */}
        <section
          id="how-it-works"
          style={{
            padding: '5.5rem 1.5rem',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, #FAF7F2 100%)',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            position: 'relative',
          }}
          aria-labelledby="how-it-works-heading"
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2
                id="how-it-works-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 4.2vw, 3.2rem)',
                  fontWeight: 900,
                  color: '#0A1128',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                How DrishtiX Delivers{' '}
                <span style={{ color: '#FF5722' }}>Complete Independence</span>
              </h2>
            </div>

            {/* 3-Step Journey Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '1.25rem',
                marginBottom: '3.5rem',
              }}
            >
              {/* Step 1: Calibrate Sensory Profile (Warm Amber / Peach) */}
              <div
                className="card-light-luxury scroll-reveal hover-lift-smooth stagger-1"
                style={{
                  background: 'linear-gradient(180deg, #FFFDF7 0%, #FFF7ED 100%)',
                  border: '1.5px solid rgba(234, 88, 12, 0.22)',
                  borderRadius: '1.25rem',
                  padding: '1.4rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 25px -5px rgba(234, 88, 12, 0.07)',
                  transition: 'all 0.25s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        color: '#C2410C',
                        background: '#FFEDD5',
                        border: '1px solid rgba(234, 88, 12, 0.25)',
                        padding: '0.22rem 0.65rem',
                        borderRadius: '999px',
                      }}
                    >
                      STEP 01
                    </span>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '0.75rem',
                        background: '#FFEDD5',
                        color: '#EA580C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(234, 88, 12, 0.15)',
                      }}
                      aria-hidden="true"
                    >
                      <Sliders size={20} />
                    </div>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1.18rem',
                      color: '#0F172A',
                      marginBottom: '0.45rem',
                      lineHeight: 1.3,
                    }}
                  >
                    Calibrate Sensory Profile
                  </h3>

                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: '#475569',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                    }}
                  >
                    Choose your high-contrast theme, fine-tune voice speech rate (0.5x to 2.0x), and enable dyslexia-friendly typography.
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    borderTop: '1px solid rgba(234, 88, 12, 0.15)',
                    paddingTop: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9A3412', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(234, 88, 12, 0.2)', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>✓ 4 Contrast Themes</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9A3412', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(234, 88, 12, 0.2)', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>✓ Speech Rate (0.5x–2x)</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9A3412', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(234, 88, 12, 0.2)', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>✓ Cloud Sync</span>
                </div>
              </div>

              {/* Step 2: Audio & Keyboard Exam (Cool Sky Blue) */}
              <div
                className="card-light-luxury scroll-reveal hover-lift-smooth stagger-2"
                style={{
                  background: 'linear-gradient(180deg, #F8FAFF 0%, #EFF6FF 100%)',
                  border: '1.5px solid rgba(2, 132, 199, 0.22)',
                  borderRadius: '1.25rem',
                  padding: '1.4rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 25px -5px rgba(2, 132, 199, 0.07)',
                  transition: 'all 0.25s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        color: '#0369A1',
                        background: '#E0F2FE',
                        border: '1px solid rgba(2, 132, 199, 0.25)',
                        padding: '0.22rem 0.65rem',
                        borderRadius: '999px',
                      }}
                    >
                      STEP 02
                    </span>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '0.75rem',
                        background: '#E0F2FE',
                        color: '#0284C7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)',
                      }}
                      aria-hidden="true"
                    >
                      <Headphones size={20} />
                    </div>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1.18rem',
                      color: '#0F172A',
                      marginBottom: '0.45rem',
                      lineHeight: 1.3,
                    }}
                  >
                    Audio & Keyboard Exam
                  </h3>

                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: '#475569',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                    }}
                  >
                    Solve mock exams with Math-to-Speech narration, single 1–4 hotkeys, arrow navigation, and harmonic earcon chimes.
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    borderTop: '1px solid rgba(2, 132, 199, 0.15)',
                    paddingTop: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#075985', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>✓ Math Formula TTS</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#075985', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>✓ Dual Harmonic Earcons</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#075985', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>✓ 1–4 Single Keys</span>
                </div>
              </div>

              {/* Step 3: Spoken Diagnostics & AI Drills (Emerald Mint) */}
              <div
                className="card-light-luxury scroll-reveal hover-lift-smooth stagger-3"
                style={{
                  background: 'linear-gradient(180deg, #F6FBF8 0%, #ECFDF5 100%)',
                  border: '1.5px solid rgba(5, 150, 105, 0.22)',
                  borderRadius: '1.25rem',
                  padding: '1.4rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 25px -5px rgba(5, 150, 105, 0.07)',
                  transition: 'all 0.25s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        color: '#047857',
                        background: '#D1FAE5',
                        border: '1px solid rgba(5, 150, 105, 0.25)',
                        padding: '0.22rem 0.65rem',
                        borderRadius: '999px',
                      }}
                    >
                      STEP 03
                    </span>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '0.75rem',
                        background: '#D1FAE5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)',
                      }}
                      aria-hidden="true"
                    >
                      <Zap size={20} />
                    </div>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1.18rem',
                      color: '#0F172A',
                      marginBottom: '0.45rem',
                      lineHeight: 1.3,
                    }}
                  >
                    Spoken Diagnostics & AI Drills
                  </h3>

                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: '#475569',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                    }}
                  >
                    Listen to a spoken debrief of your performance, analyze question velocity, and trigger targeted 5-minute remedial drills.
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    borderTop: '1px solid rgba(5, 150, 105, 0.15)',
                    paddingTop: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#065F46', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(5, 150, 105, 0.2)', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>✓ Spoken Debrief</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#065F46', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(5, 150, 105, 0.2)', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>✓ Sub-60% Auto Drills</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#065F46', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(5, 150, 105, 0.2)', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>✓ Speed Analytics</span>
                </div>
              </div>
            </div>

            {/* Interactive Auditory Studio - Modern Acoustic Sound Deck */}
            <div
              className="scroll-reveal"
              style={{
                maxWidth: 1060,
                margin: '2.5rem auto 0',
                padding: '1.85rem 2.25rem',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.92) 100%)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                borderRadius: '24px',
                boxShadow: '0 16px 40px -12px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative background ambient tint */}
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '220px',
                  height: '220px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.07) 0%, rgba(255,255,255,0) 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Header Bar */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '1.4rem',
                  paddingBottom: '1.15rem',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.7)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      color: '#059669',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '0.45rem',
                    }}
                  >
                    <Headphones size={13} style={{ color: '#059669' }} />
                    <span>Acoustic Lab · Zero-Latency Tone Deck</span>
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(1.3rem, 2.2vw, 1.7rem)',
                      fontWeight: 900,
                      color: '#0A1128',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Experience Real-Time{' '}
                    <span style={{ color: '#FF5722' }}>Acoustic Feedback</span>
                  </h3>
                  <p
                    style={{
                      color: '#64748B',
                      fontSize: '0.88rem',
                      margin: '0.35rem 0 0',
                      lineHeight: 1.5,
                      maxWidth: '680px',
                    }}
                  >
                    Visually impaired candidates receive instant Web Audio earcon chimes on every keystroke — eliminating screen reader lag and guess-work.
                  </p>
                </div>

                {/* Live Engine Status Capsule */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(203, 213, 225, 0.8)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
                      display: 'inline-block',
                    }}
                  />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A' }}>Web Audio Active</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>~180ms Synthesizer</div>
                  </div>
                </div>
              </div>

              {/* 4 Interactive Sound Stations Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Tile 1: Option Select */}
                <div
                  className="sound-station-card"
                  onClick={() => triggerSound('success')}
                  style={{
                    padding: '1.25rem 1.15rem',
                    borderRadius: '18px',
                    background: activeSound === 'success' ? '#F0FDF4' : 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)',
                    border: `1.5px solid ${activeSound === 'success' ? '#10B981' : 'rgba(16, 185, 129, 0.3)'}`,
                    cursor: 'pointer',
                    boxShadow: activeSound === 'success'
                      ? '0 10px 25px -5px rgba(16, 185, 129, 0.25)'
                      : '0 2px 8px rgba(16, 185, 129, 0.05)',
                    transform: activeSound === 'success' ? 'scale(0.99)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerSound('success'); } }}
                  aria-label="Test Option Select Earcon Tone D5 to A5"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: '#DCFCE7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#059669',
                        }}
                      >
                        <CheckCircle2 size={20} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#059669',
                          background: 'rgba(16, 185, 129, 0.12)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        D5 ➔ A5 SINE
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                      Option Select
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45 }}>
                      Ascending harmonic chime confirming answer keypress <span style={{ fontWeight: 700, color: '#0F172A' }}>[1–4]</span>.
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '1.15rem',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '10px',
                      background: activeSound === 'success' ? '#059669' : '#DCFCE7',
                      color: activeSound === 'success' ? '#FFFFFF' : '#059669',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {activeSound === 'success' ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '12px' }}>
                          <span style={{ width: '2px', height: '12px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate' }} />
                          <span style={{ width: '2px', height: '6px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate 0.15s' }} />
                          <span style={{ width: '2px', height: '10px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate 0.3s' }} />
                        </div>
                        <span>Playing Chime...</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} fill="#059669" />
                        <span>Play Earcon</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tile 2: Next Question Navigation */}
                <div
                  className="sound-station-card"
                  onClick={() => triggerSound('nav')}
                  style={{
                    padding: '1.25rem 1.15rem',
                    borderRadius: '18px',
                    background: activeSound === 'nav' ? '#F0F9FF' : 'linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)',
                    border: `1.5px solid ${activeSound === 'nav' ? '#0284C7' : 'rgba(14, 165, 233, 0.3)'}`,
                    cursor: 'pointer',
                    boxShadow: activeSound === 'nav'
                      ? '0 10px 25px -5px rgba(14, 165, 233, 0.25)'
                      : '0 2px 8px rgba(14, 165, 233, 0.05)',
                    transform: activeSound === 'nav' ? 'scale(0.99)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerSound('nav'); } }}
                  aria-label="Test Question Navigation Earcon Tone A4 to E5"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: '#E0F2FE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0284C7',
                        }}
                      >
                        <ChevronRight size={20} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#0284C7',
                          background: 'rgba(14, 165, 233, 0.12)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        A4 ➔ E5 GLIDE
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                      Question Hop
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45 }}>
                      Smooth triangle glide when moving forward/back <span style={{ fontWeight: 700, color: '#0F172A' }}>[N / P]</span>.
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '1.15rem',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '10px',
                      background: activeSound === 'nav' ? '#0284C7' : '#E0F2FE',
                      color: activeSound === 'nav' ? '#FFFFFF' : '#0284C7',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {activeSound === 'nav' ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '12px' }}>
                          <span style={{ width: '2px', height: '12px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate' }} />
                          <span style={{ width: '2px', height: '6px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate 0.15s' }} />
                          <span style={{ width: '2px', height: '10px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate 0.3s' }} />
                        </div>
                        <span>Playing Glide...</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} fill="#0284C7" />
                        <span>Play Earcon</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tile 3: Flag for Review */}
                <div
                  className="sound-station-card"
                  onClick={() => triggerSound('flag')}
                  style={{
                    padding: '1.25rem 1.15rem',
                    borderRadius: '18px',
                    background: activeSound === 'flag' ? '#FFFBEB' : 'linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%)',
                    border: `1.5px solid ${activeSound === 'flag' ? '#D97706' : 'rgba(245, 158, 11, 0.32)'}`,
                    cursor: 'pointer',
                    boxShadow: activeSound === 'flag'
                      ? '0 10px 25px -5px rgba(245, 158, 11, 0.25)'
                      : '0 2px 8px rgba(245, 158, 11, 0.05)',
                    transform: activeSound === 'flag' ? 'scale(0.99)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerSound('flag'); } }}
                  aria-label="Test Flag Question Earcon Tone G5"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: '#FEF3C7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#D97706',
                        }}
                      >
                        <Bookmark size={20} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#D97706',
                          background: 'rgba(245, 158, 11, 0.14)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        G5 BELL CHIME
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                      Flag for Review
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45 }}>
                      Crisp bell chime alerting candidate the item was flagged <span style={{ fontWeight: 700, color: '#0F172A' }}>[R]</span>.
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '1.15rem',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '10px',
                      background: activeSound === 'flag' ? '#D97706' : '#FEF3C7',
                      color: activeSound === 'flag' ? '#FFFFFF' : '#D97706',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {activeSound === 'flag' ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '12px' }}>
                          <span style={{ width: '2px', height: '12px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate' }} />
                          <span style={{ width: '2px', height: '6px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate 0.15s' }} />
                          <span style={{ width: '2px', height: '10px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate 0.3s' }} />
                        </div>
                        <span>Playing Chime...</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} fill="#D97706" />
                        <span>Play Earcon</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tile 4: Voice Narration */}
                <div
                  className="sound-station-card"
                  onClick={() => triggerSound('speech')}
                  style={{
                    padding: '1.25rem 1.15rem',
                    borderRadius: '18px',
                    background: activeSound === 'speech' ? '#FFF7ED' : 'linear-gradient(180deg, #FFFFFF 0%, #FFF7ED 100%)',
                    border: `1.5px solid ${activeSound === 'speech' ? '#EA580C' : 'rgba(234, 88, 12, 0.32)'}`,
                    cursor: 'pointer',
                    boxShadow: activeSound === 'speech'
                      ? '0 10px 25px -5px rgba(234, 88, 12, 0.25)'
                      : '0 2px 8px rgba(234, 88, 12, 0.05)',
                    transform: activeSound === 'speech' ? 'scale(0.99)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerSound('speech'); } }}
                  aria-label="Test AI Voice Speech Narration"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: '#FFEDD5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#EA580C',
                        }}
                      >
                        <Volume2 size={20} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#EA580C',
                          background: 'rgba(234, 88, 12, 0.14)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        AI SPEECH TTS
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                      Voice Narration
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45 }}>
                      Speaks question contents, formula math, and timer with natural prosody.
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '1.15rem',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '10px',
                      background: activeSound === 'speech' ? '#EA580C' : '#FFEDD5',
                      color: activeSound === 'speech' ? '#FFFFFF' : '#EA580C',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {activeSound === 'speech' ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '12px' }}>
                          <span style={{ width: '2px', height: '12px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate' }} />
                          <span style={{ width: '2px', height: '6px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate 0.15s' }} />
                          <span style={{ width: '2px', height: '10px', background: '#FFF', borderRadius: '2px', animation: 'soundPulse 0.4s infinite alternate 0.3s' }} />
                        </div>
                        <span>Speaking Sample...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={13} />
                        <span>Speak Sample</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Quick-Tip Footer */}
              <div
                style={{
                  marginTop: '1.4rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(226, 232, 240, 0.7)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  fontSize: '0.78rem',
                  color: '#64748B',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#059669', fontWeight: 800 }}>⚡ Pure Acoustic Autonomy:</span>
                  <span>Earcons run concurrently with NVDA, JAWS & TalkBack so candidates never lose their place.</span>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#0F172A',
                    fontWeight: 700,
                  }}
                >
                  <Check size={14} style={{ color: '#059669' }} />
                  <span>Synthesized live via Web Audio API</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. ACCESSIBILITY STANDARDS & KEYBOARD MATRIX ── */}
        <section
          id="accessibility"
          style={{
            padding: '5.5rem 1.5rem',
            position: 'relative',
            background: '#FAF7F2',
          }}
          aria-labelledby="accessibility-heading"
        >
          <span id="about" style={{ position: 'absolute', top: '-90px' }} />
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2
                id="accessibility-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  color: '#0A1128',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Complete Keyboard Mastery &{' '}
                <span style={{ color: '#FF5722' }}>WCAG AAA Standards</span>
              </h2>
            </div>

            {/* Unified Accessibility & Keyboard Cockpit Console */}
            <div
              style={{
                maxWidth: 1060,
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                gap: '1.5rem',
                alignItems: 'stretch',
              }}
            >
              {/* Panel 1: Official Statutory Compliance Matrix & Standards Passport */}
              <div
                className="scroll-reveal-left hover-lift-smooth stagger-1"
                style={{
                  background: 'linear-gradient(165deg, #F0F9FF 0%, #FFFFFF 40%, #F8FAFC 100%)',
                  border: '1.5px solid rgba(2, 132, 199, 0.22)',
                  borderRadius: '24px',
                  padding: '1.75rem 1.85rem',
                  boxShadow: '0 20px 45px -12px rgba(2, 132, 199, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Ambient top-right light blue glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: -60,
                    right: -60,
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.14) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                      border: '1px solid rgba(2, 132, 199, 0.35)',
                      padding: '0.28rem 0.8rem',
                      borderRadius: '999px',
                      color: '#0284C7',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '0.65rem',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.12)',
                    }}
                  >
                    <ShieldCheck size={13} style={{ color: '#0284C7' }} />
                    <span>Statutory Certification & Norms</span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.3rem',
                      fontWeight: 900,
                      color: '#0A1128',
                      margin: '0 0 0.35rem',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Verified Non-Visual Architecture
                  </h3>

                  <p style={{ color: '#475569', fontSize: '0.84rem', margin: '0 0 1.25rem', lineHeight: 1.45 }}>
                    Engineered to statutory Indian and global digital accessibility mandates:
                  </p>

                  {/* 4 Compliance Rows with Distinct Modern Pastel Themes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Standard 1: WCAG 2.1 AAA - Sky Blue */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.85rem',
                        alignItems: 'flex-start',
                        padding: '0.85rem 1rem',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                        border: '1.5px solid rgba(2, 132, 199, 0.28)',
                        boxShadow: '0 4px 14px -3px rgba(2, 132, 199, 0.12)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '11px',
                          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          flexShrink: 0,
                          boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                        }}
                      >
                        <Award size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                            WCAG 2.1 Level AAA
                          </span>
                          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#0284C7', background: '#FFFFFF', border: '1px solid rgba(2, 132, 199, 0.3)', padding: '0.15rem 0.55rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)' }}>
                            7:1+ CONTRAST
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                          High-contrast themes, ARIA live regions, and semantic landmark hierarchy for assistive software.
                        </p>
                      </div>
                    </div>

                    {/* Standard 2: RPwD Act 2016 - Mint Green */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.85rem',
                        alignItems: 'flex-start',
                        padding: '0.85rem 1rem',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                        border: '1.5px solid rgba(16, 185, 129, 0.28)',
                        boxShadow: '0 4px 14px -3px rgba(16, 185, 129, 0.12)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '11px',
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          flexShrink: 0,
                          boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <ShieldCheck size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                            RPwD Act 2016 Aligned
                          </span>
                          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#059669', background: '#FFFFFF', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.15rem 0.55rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(16, 185, 129, 0.08)' }}>
                            MoSJE NORMS
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                          Fully adheres to Ministry of Social Justice & Empowerment norms for Persons with Disabilities examinations.
                        </p>
                      </div>
                    </div>

                    {/* Standard 3: Section 508 & Braille - Warm Amber */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.85rem',
                        alignItems: 'flex-start',
                        padding: '0.85rem 1rem',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                        border: '1.5px solid rgba(245, 158, 11, 0.28)',
                        boxShadow: '0 4px 14px -3px rgba(245, 158, 11, 0.12)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '11px',
                          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          flexShrink: 0,
                          boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        <CheckCircle2 size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                            Section 508 & EN 301 549
                          </span>
                          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#D97706', background: '#FFFFFF', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.15rem 0.55rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(245, 158, 11, 0.08)' }}>
                            BRAILLE + NVDA
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                          Interoperable with NVDA, JAWS, VoiceOver, and refreshable braille displays.
                        </p>
                      </div>
                    </div>

                    {/* Standard 4: Motor Autonomy - Lavender Purple */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.85rem',
                        alignItems: 'flex-start',
                        padding: '0.85rem 1rem',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                        border: '1.5px solid rgba(147, 51, 234, 0.25)',
                        boxShadow: '0 4px 14px -3px rgba(147, 51, 234, 0.12)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '11px',
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          flexShrink: 0,
                          boxShadow: '0 4px 10px rgba(147, 51, 234, 0.3)',
                        }}
                      >
                        <Zap size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                            100% Keyboard Operable
                          </span>
                          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#7C3AED', background: '#FFFFFF', border: '1px solid rgba(147, 51, 234, 0.3)', padding: '0.15rem 0.55rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(147, 51, 234, 0.08)' }}>
                            ZERO MOUSE
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                          Zero mouse requirement. Single key presses trigger answers, navigation, readings, and review.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.65rem 0.95rem',
                    background: 'rgba(240, 253, 244, 0.85)',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.78rem',
                    color: '#059669',
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.06)',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Check size={16} style={{ flexShrink: 0, color: '#059669' }} />
                  <span>Audited for National Competitions (SSC, UPSC, Banking, RRB)</span>
                </div>
              </div>

              {/* Panel 2: Interactive Tactile Keyboard Cockpit & Live HUD Monitor */}
              <div
                className="scroll-reveal-right hover-lift-smooth stagger-2"
                style={{
                  background: 'linear-gradient(165deg, #FFF7ED 0%, #FFFFFF 40%, #FFFDF7 100%)',
                  border: '1.5px solid rgba(249, 115, 22, 0.22)',
                  borderRadius: '24px',
                  padding: '1.75rem 1.85rem',
                  boxShadow: '0 20px 45px -12px rgba(234, 88, 12, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Ambient top-right warm orange glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: -60,
                    right: -60,
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(249, 115, 22, 0.13) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Top Cockpit Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          background: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
                          border: '1px solid rgba(234, 88, 12, 0.35)',
                          padding: '0.28rem 0.8rem',
                          borderRadius: '999px',
                          color: '#EA580C',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                          boxShadow: '0 2px 6px rgba(234, 88, 12, 0.12)',
                        }}
                      >
                        <Keyboard size={13} style={{ color: '#EA580C' }} />
                        <span>Interactive Tactile Keypad</span>
                      </div>
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.3rem',
                          fontWeight: 900,
                          color: '#0A1128',
                          margin: 0,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        Official Exam Hall <span style={{ color: '#FF5722' }}>Keybindings</span>
                      </h3>
                    </div>

                    <button
                      onClick={() => navigate('/settings')}
                      className="btn-white-pill"
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.45rem 0.95rem',
                        borderRadius: '0.65rem',
                        background: '#FFFFFF',
                        border: '1.5px solid rgba(2, 132, 199, 0.35)',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)',
                        color: '#0284C7',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      aria-label="Customize Keyboard Shortcuts in Settings"
                    >
                      <Sliders size={13} />
                      <span>Customize in Settings →</span>
                    </button>
                  </div>

                  <p style={{ color: '#475569', fontSize: '0.82rem', margin: '0 0 1rem', lineHeight: 1.4 }}>
                    Click any mechanical keycap below to simulate live acoustic feedback and see the corresponding exam action:
                  </p>

                  {/* Tactile Keycaps Deck with Individual Color Identity & 3D Mechanical Effect */}
                  <div
                    className="keycaps-grid-responsive"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.55rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {KEYBOARD_SHORTCUTS.map((sc, idx) => {
                      const isSelected = activeShortcutIndex === idx;
                      return (
                        <button
                          key={sc.key}
                          onClick={() => handleShortcutClick(idx)}
                          style={{
                            padding: '0.65rem 0.45rem',
                            borderRadius: '12px',
                            background: isSelected
                              ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'
                              : sc.bg,
                            border: `1.5px solid ${isSelected ? '#FF5722' : sc.border}`,
                            borderBottom: `${isSelected ? '3.5px solid #EA580C' : `3.5px solid ${sc.borderBottom}`}`,
                            color: isSelected ? '#EA580C' : sc.textColor,
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            transform: isSelected ? 'translateY(1px)' : 'none',
                            boxShadow: isSelected
                              ? '0 0 0 3px rgba(255, 87, 34, 0.25), 0 6px 16px rgba(255, 87, 34, 0.2)'
                              : '0 3px 6px rgba(0, 0, 0, 0.04), inset 0 1px 0 #FFFFFF',
                          }}
                          aria-label={`Test Key ${sc.key} - ${sc.label}`}
                        >
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 900,
                              fontSize: '0.92rem',
                              lineHeight: 1.1,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {sc.key}
                          </div>
                          <div
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              marginTop: '0.3rem',
                              background: isSelected ? '#FF5722' : 'rgba(255, 255, 255, 0.85)',
                              color: isSelected ? '#FFFFFF' : sc.badgeColor,
                              border: isSelected ? 'none' : `1px solid ${sc.border}`,
                              borderRadius: '4px',
                              padding: '0.1rem 0.35rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'inline-block',
                              maxWidth: '100%',
                            }}
                          >
                            {sc.badge}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Active Key Simulator HUD Display - Sleek Midnight Cockpit */}
                {(() => {
                  const current = KEYBOARD_SHORTCUTS[activeShortcutIndex] || KEYBOARD_SHORTCUTS[0];
                  return (
                    <div
                      style={{
                        background: 'linear-gradient(145deg, #0A1128 0%, #0F172A 100%)',
                        borderRadius: '18px',
                        padding: '1.25rem 1.35rem',
                        color: '#F8FAFC',
                        border: '1.5px solid rgba(56, 189, 248, 0.25)',
                        boxShadow: '0 16px 36px -8px rgba(10, 17, 40, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        zIndex: 1,
                      }}
                    >
                      {/* Modern Top Neon Accent Line */}
                      <div
                        style={{
                          height: '2.5px',
                          width: '100%',
                          background: 'linear-gradient(90deg, #FF5722 0%, #38BDF8 50%, #10B981 100%)',
                          borderRadius: '2px',
                          marginBottom: '0.85rem',
                        }}
                      />

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.55rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <span
                            style={{
                              background: 'linear-gradient(135deg, #FF5722 0%, #EA580C 100%)',
                              color: '#FFFFFF',
                              fontFamily: 'monospace',
                              fontWeight: 900,
                              fontSize: '0.8rem',
                              padding: '0.22rem 0.6rem',
                              borderRadius: '7px',
                              boxShadow: '0 2px 8px rgba(255, 87, 34, 0.35)',
                              letterSpacing: '0.02em',
                            }}
                          >
                            KEY [{current.key}]
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC' }}>
                            {current.label}
                          </span>
                        </div>

                        <button
                          onClick={() => handleShortcutClick(activeShortcutIndex)}
                          style={{
                            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(14, 165, 233, 0.28) 100%)',
                            border: '1px solid rgba(56, 189, 248, 0.45)',
                            color: '#38BDF8',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 2px 8px rgba(56, 189, 248, 0.15)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Play size={11} fill="#38BDF8" />
                          <span>Test Audio</span>
                        </button>
                      </div>

                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.45 }}>
                        {current.desc}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.74rem',
                          color: '#38BDF8',
                          fontWeight: 600,
                          background: 'rgba(15, 23, 42, 0.85)',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(56, 189, 248, 0.22)',
                        }}
                      >
                        <Volume2 size={14} style={{ flexShrink: 0, color: '#38BDF8' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Feedback: {current.feedback}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* ── HIGH-IMPACT VIBRANT SUNRISE CALL TO ACTION ── */}
        <section
          id="impact"
          style={{
            padding: '5rem 1.5rem',
            position: 'relative',
          }}
          aria-labelledby="cta-heading"
        >
          <div
            className="scroll-reveal-scale cta-box-responsive"
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF4500 50%, #E64A19 100%)',
              borderRadius: '2.25rem',
              padding: '4.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 25px 60px -10px rgba(255, 87, 34, 0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
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
                color: '#FED7AA',
                marginBottom: '2.75rem',
                fontSize: '1.18rem',
                maxWidth: 640,
                margin: '0 auto 2.75rem',
                lineHeight: 1.65,
                fontWeight: 500,
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
                className="cta-btn-responsive"
                style={{
                  padding: '1.1rem 2.8rem',
                  fontSize: '1.1rem',
                  borderRadius: '999px',
                  background: '#FFFFFF',
                  color: '#C2410C',
                  fontWeight: 800,
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)')}
              >
                <Sparkles size={20} />
                <span>Create Free Student Account</span>
              </button>

              <button
                onClick={() => navigate('/login')}
                className="cta-btn-responsive"
                style={{
                  padding: '1.1rem 2.5rem',
                  fontSize: '1.1rem',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '2px solid rgba(255, 255, 255, 0.7)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.3)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.18)')}
              >
                <LogIn size={20} />
                <span>Try Demo Account</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER (MODERN DEEP OBSIDIAN THEME WITH 5 PILLARS NAVIGATION) ── */}
      <footer
        style={{
          background: 'linear-gradient(180deg, #0A1128 0%, #050814 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4rem 1.5rem 2.75rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        {/* Top Multi-Color Neon Accent Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2.5px',
            background: 'linear-gradient(90deg, #FF5722 0%, #38BDF8 50%, #10B981 100%)',
          }}
        />

        {/* Ambient background glow accents */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            width: 280,
            height: 180,
            background: 'radial-gradient(circle, rgba(255, 87, 34, 0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: '15%',
            width: 280,
            height: 180,
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Logo & Submission Capsule */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              marginBottom: '1.4rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Drishti<span style={{ color: '#FF5722' }}>X</span>
            </span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                padding: '0.3rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                color: '#CBD5E1',
                fontWeight: 600,
              }}
            >
              <span
                className="animate-beacon-dot"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#22C55E',
                  boxShadow: '0 0 8px #22C55E',
                  display: 'inline-block',
                }}
              />
              <span>Beyond Barriers, Brighter Futures</span>
            </div>
          </div>

          {/* 5 Core Pillars Quick Links matching Navbar */}
          <nav
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.75rem',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
            aria-label="Footer Navigation"
          >
            <a href="#home" style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none', transition: 'color 0.15s' }}>Home</a>
            <span style={{ color: 'rgba(255, 255, 255, 0.18)' }}>|</span>
            <a href="#features" style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none', transition: 'color 0.15s' }}>Features</a>
            <span style={{ color: 'rgba(255, 255, 255, 0.18)' }}>|</span>
            <a href="#exams" style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none', transition: 'color 0.15s' }}>Exams</a>
            <span style={{ color: 'rgba(255, 255, 255, 0.18)' }}>|</span>
            <a href="#how-it-works" style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none', transition: 'color 0.15s' }}>How It Works</a>
            <span style={{ color: 'rgba(255, 255, 255, 0.18)' }}>|</span>
            <a href="#accessibility" style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none', transition: 'color 0.15s' }}>Accessibility</a>
          </nav>

          {/* Direct Links to Core Learning Pages as Interactive Chips */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1.75rem',
            }}
          >
            <button
              onClick={() => navigate('/exams')}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38BDF8',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Mock Exams
            </button>
            <button
              onClick={() => navigate('/practice')}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38BDF8',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              AI Drills
            </button>
            <button
              onClick={() => navigate('/performance')}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38BDF8',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Analytics Hub
            </button>
            <button
              onClick={() => navigate('/study-materials')}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38BDF8',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Study Notes
            </button>
            <button
              onClick={() => navigate('/pyqs')}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38BDF8',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Solved Papers
            </button>
            <button
              onClick={() => navigate('/settings')}
              style={{
                background: 'rgba(255, 87, 34, 0.12)',
                border: '1px solid rgba(255, 87, 34, 0.35)',
                color: '#FF7A50',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Accessibility Suite
            </button>
          </div>

          <p style={{ color: '#94A3B8', fontSize: '0.875rem', maxWidth: 760, margin: '0 auto 1.5rem', lineHeight: 1.65 }}>
            Designed and built for 100% accessible, independent examination preparation. Conforms to{' '}
            <strong style={{ color: '#F1F5F9' }}>WCAG 2.1 AAA</strong> standards,{' '}
            <strong style={{ color: '#F1F5F9' }}>RPwD Act 2016</strong> guidelines, and{' '}
            <strong style={{ color: '#F1F5F9' }}>Section 508</strong> accessibility criteria.
          </p>

          {/* Bottom Divider & Copyright Bar */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              fontSize: '0.8rem',
              color: '#64748B',
            }}
          >
            <div>
              © 2026 DrishtiX Platform. Dedicated to barrier-free educational empowerment.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94A3B8' }}>
              <span>National Accessible Examination Architecture</span>
              <span>🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── ULTRA-PREMIUM FLOATING BACK-TO-TOP COCKPIT ORB ── */}
      <div
        className="back-to-top-orb"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 900,
          opacity: isScrolled ? 1 : 0,
          transform: isScrolled ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.8)',
          pointerEvents: isScrolled ? 'auto' : 'none',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <button
          onClick={() => {
            playEarcon('nav');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="btn-smooth hover-lift-smooth"
          title="Scroll back to top"
          aria-label="Scroll back to top"
          style={{
            position: 'relative',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255, 87, 34, 0.35)',
            boxShadow: '0 14px 38px -8px rgba(10, 17, 40, 0.18), 0 4px 14px rgba(255, 87, 34, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          {/* Circular SVG Scroll Progress Ring */}
          <svg
            width="52"
            height="52"
            viewBox="0 0 52 52"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'rotate(-90deg)',
            }}
          >
            <circle
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke="rgba(0, 0, 0, 0.06)"
              strokeWidth="2.5"
            />
            <circle
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke="url(#scrollGradientOrb)"
              strokeWidth="2.5"
              strokeDasharray={2 * Math.PI * 23}
              strokeDashoffset={2 * Math.PI * 23 * (1 - scrollProgress / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.08s linear' }}
            />
            <defs>
              <linearGradient id="scrollGradientOrb" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF5722" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
          </svg>
          <ChevronUp size={22} style={{ color: '#FF5722', position: 'relative', zIndex: 1 }} />
        </button>
      </div>
    </div>
  );
}

