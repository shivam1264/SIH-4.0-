import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { globalVoiceService, EngineType } from '../services/globalVoiceService';
import { classifyVoiceIntent, ConversationalMemory } from '../services/voiceCommandClassifier';
import { drishtiNluService, DrishtiNluResult } from '../services/drishtiNluService';
import { speechService } from '../services/speechService';
import { useAccessibility } from './AccessibilityContext';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { audioCueService } from '../services/audioCueService';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';
import { drishtiActionService } from '../services/drishtiActionService';
import { Mic, MicOff, Volume2, Sparkles, X, BrainCircuit, Play, Pause, ChevronDown, ChevronUp, Move, HelpCircle, Check, Compass, Radio } from 'lucide-react';

import {
  resolvePageNameFromRoute,
  isQuestionOrQuery,
  askPageQuestion,
} from '../services/pageKnowledgeService';
import { EXAMS } from '../data/mockData';

export interface PageQAItem {
  triggers: string[];
  answer: () => string | Promise<string>;
  action?: () => void;
  description?: string;
}

interface VoiceAssistantContextType {
  active: boolean;
  engine: EngineType;
  status: string;
  lastTranscript: string;
  lastSpoken: string;
  lastNluResult: DrishtiNluResult | null;
  currentPage: string;
  toggleVoice: () => void;
  speak: (text: string, priority?: boolean) => void;
  registerPageContext: (pageName: string, items: PageQAItem[]) => () => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | null>(null);

export function useVoiceAssistant() {
  const ctx = useContext(VoiceAssistantContext);
  if (!ctx) {
    throw new Error('useVoiceAssistant must be used within VoiceAssistantProvider');
  }
  return ctx;
}

export function VoiceAssistantProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    prefs,
    setTheme,
    setFontSize,
    setVoiceRate,
    resetToDefaults,
  } = useAccessibility();
  const { user, login, logout } = useAuth();

  const accessRef = useRef({ prefs, setTheme, setFontSize, setVoiceRate, resetToDefaults, login, logout, user });
  accessRef.current = { prefs, setTheme, setFontSize, setVoiceRate, resetToDefaults, login, logout, user };

  const [active, setActive] = useState(true);
  const [engine, setEngine] = useState<EngineType>('none');
  const [status, setStatus] = useState('Listening...');
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastSpoken, setLastSpoken] = useState('');
  const [lastNluResult, setLastNluResult] = useState<DrishtiNluResult | null>(null);
  const [currentPage, setCurrentPage] = useState('App');
  const [showToast, setShowToast] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(1.0);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [modalTab, setModalTab] = useState<'exam' | 'nav' | 'access' | 'hindi'>('exam');
  const toastTimeoutRef = useRef<any>(null);


  useEffect(() => {
    return drishtiActionService.onAutoScrollChange((active, speed) => {
      setIsAutoScrolling(active);
      setAutoScrollSpeed(speed);
    });
  }, []);

  const currentPageRef = useRef('App');
  currentPageRef.current = currentPage;

  // Active page QA registry
  const pageRegistryRef = useRef<Map<string, PageQAItem[]>>(new Map());

  const speak = useCallback((text: string, priority = true) => {
    setLastSpoken(text);
    globalVoiceService.speak(text, priority);
  }, []);

  const enableMicrophone = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      }
    } catch (err) {
      console.warn('[VoiceAssistant] Microphone request notice:', err);
    }
    return false;
  };

  const toggleVoice = useCallback(async () => {
    if (globalVoiceService.isActive()) {
      globalVoiceService.stop();
      setActive(false);
      try { audioCueService.voiceStop(); } catch (e) { }
      screenReaderAnnouncer.announcePolite('Drishti voice assistant deactivated.');
      speak('Drishti muted. Press Alt+D or V to activate.');
    } else {
      await enableMicrophone();
      await globalVoiceService.start();
      setActive(true);
      try { audioCueService.voiceActivate(); } catch (e) { }
      const candidate = accessRef.current.user?.name ? accessRef.current.user.name.split(' ')[0] : '';
      const greeting = candidate ? `Hello ${candidate}. ` : '';
      screenReaderAnnouncer.announcePolite('Drishti voice assistant activated.');
      speak(`${greeting}Drishti active. Listening now. Say Drishti start exam or ask me anything.`);
    }
  }, [speak]);

  const registerPageContext = useCallback((pageName: string, items: PageQAItem[]) => {
    pageRegistryRef.current.set(pageName, items);
    if (currentPageRef.current !== pageName) {
      setCurrentPage(pageName);
    }

    return () => {
      pageRegistryRef.current.delete(pageName);
    };
  }, []);

  const conversationalMemoryRef = useRef<ConversationalMemory>({});

  // ── Unified Intent Dispatcher: Context-aware Navigation, Controls & Q&A ──
  useEffect(() => {
    const unregister = globalVoiceService.register(async (rawText: string, parsedCommand?: any) => {
      const activePage = currentPageRef.current;
      const currentItems = pageRegistryRef.current.get(activePage) || [];
      const currentRoute = location.pathname;

      if (parsedCommand?.action === 'SCROLL_DOWN') {
        drishtiActionService.scrollDown();
        speak('Scrolling down.');
        return true;
      }
      if (parsedCommand?.action === 'SCROLL_UP') {
        drishtiActionService.scrollUp();
        speak('Scrolling up.');
        return true;
      }
      if (parsedCommand?.action === 'SCROLL_TOP') {
        drishtiActionService.scrollToTop();
        speak('Scrolled to top.');
        return true;
      }
      if (parsedCommand?.action === 'SCROLL_BOTTOM') {
        drishtiActionService.scrollToBottom();
        speak('Scrolled to bottom.');
        return true;
      }
      if (parsedCommand?.action === 'AUTO_SCROLL_START') {
        drishtiActionService.startAutoScroll();
        speak('Auto scrolling started.');
        return true;
      }
      if (parsedCommand?.action === 'AUTO_SCROLL_STOP') {
        drishtiActionService.stopAutoScroll();
        speak('Auto scrolling stopped.');
        return true;
      }

      console.log(`[VoiceAssistant] Transcript: "${rawText}" on [${activePage}] (route=${currentRoute})`);

      // 1. Pass to Real-World AI NLU with conversational memory and automatic offline fallback
      const intent = await drishtiNluService.understand(rawText, {
        route: currentRoute,
        activePage,
        conversationalState: conversationalMemoryRef.current,
      });

      setLastNluResult(intent);
      console.log(`[VoiceAssistant] Drishti Intent [${intent.source}]:`, intent.type, intent);

      // Handle unsupported sequential commands safely without unpredictable execution
      if (intent.type === 'SEQUENTIAL_UNSUPPORTED') {
        speak(intent.speechFeedback, true);
        return true;
      }

      // If command was negated (e.g. "Don't open results", "Don't start it") and has no positive alternative
      if (intent.isNegated) {
        speak('Understood, action cancelled.', true);
        return true;
      }

      // Handle Voice / Speech control
      if (intent.type === 'STOP_SPEAKING') {
        speechService.stop();
        return true;
      }
      if (intent.type === 'STOP_VOICE') {
        toggleVoice();
        return true;
      }

      // Handle Drishti Wake Word (Standalone Alexa / Siri / Assistant style)
      if (intent.type === 'DRISHTI_WAKE') {
        const candidate = accessRef.current.user?.name ? accessRef.current.user.name.split(' ')[0] : '';
        const msg = candidate
          ? `I'm listening, ${candidate}. How can I help you? You can say start exam, read notifications, open practice, or ask for help.`
          : intent.speechFeedback || "I'm listening. How can I help you? You can say start exam, read notifications, open practice, or ask for help.";
        speak(msg, true);
        return true;
      }

      // Handle Drishti Persona Introduction
      if (intent.type === 'DRISHTI_INTRO') {
        const candidate = accessRef.current.user?.name ? accessRef.current.user.name.split(' ')[0] : '';
        const greeting = candidate ? `Hello ${candidate}! ` : '';
        speak(`${greeting}I am Drishti, your personalized AI accessibility exam assistant on DrishtiX. You can speak to me naturally or use keyboard shortcuts. Say 'Drishti start exam', 'Drishti read notifications', 'Drishti next question', or 'Drishti help' anytime!`, true);
        return true;
      }

      // Handle Repeat
      if (intent.type === 'REPEAT_QUESTION' && !currentRoute.startsWith('/exam/')) {
        const last = globalVoiceService.getLastSpoken();
        if (last) {
          speak(last, true);
        } else {
          speak('Nothing to repeat yet.');
        }
        return true;
      }

      // Handle Help & Feature Guidance / Voice Command Modal
      if (intent.type === 'HELP' || intent.type === 'SHOW_SHORTCUTS') {
        setShowCommandModal(true);
        audioCueService.notification();
        const sampleQuestions = currentItems.map(i => i.triggers[0]).slice(0, 3).join(', ');
        const helpMsg = sampleQuestions
          ? `Opening Drishti voice command guide. On this screen you can say: ${sampleQuestions}, or say option B, next question, time remaining.`
          : 'Opening Drishti voice command guide. You can say option B, next question, time remaining, or go to practice.';
        speak(helpMsg, true);
        return true;
      }

      // ── Handle Page Orientation & Explanation Intent ──
      if (intent.type === 'EXPLAIN_PAGE') {
        audioCueService.pageOrient();
        const info = screenReaderAnnouncer.orientCurrentPage(location.pathname, true);
        if (!info) {
          speechService.setPageExplaining(true, activePage);
          speak(`You are currently on the ${activePage} screen. You can navigate, scroll, or ask any question.`, true);
        }
        return true;
      }

      // ── Priority: Check Current Page Registered Sub-features & Q&A Items ──
      // This ensures page-specific sub-features (e.g. "listen", "review solutions", "take new test",
      // "set extra time 1.5x", "save changes", "benchmark", "accuracy") execute immediately.
      const cleanText = rawText.toLowerCase().trim();
      for (const item of currentItems) {
        const matched = item.triggers.some(trig => {
          const t = trig.toLowerCase().trim();
          if (cleanText === t) return true;
          if (cleanText.includes(t)) return true;
          const trigWords = t.split(' ');
          if (trigWords.length > 1 && trigWords.every(w => cleanText.includes(w))) {
            return true;
          }
          return false;
        });

        if (matched) {
          console.log(`[VoiceAssistant] ✅ Page [${activePage}] handled trigger:`, item.triggers[0]);
          try {
            const res = item.answer();
            if (typeof res === 'string') {
              if (res) speak(res, true);
            } else if (res && typeof res.then === 'function') {
              res.then(ans => {
                if (ans) speak(ans, true);
              });
            }
          } catch (err) {
            console.error('[VoiceAssistant] Error in QA answer:', err);
          }

          if (item.action) {
            try {
              item.action();
            } catch (err) {
              console.error('[VoiceAssistant] Error in QA action:', err);
            }
          }
          return true; // Handled by active page!
        }
      }

      // ── Priority Page Q&A Intelligence ("is page me kya likha hai", "what is on this screen", etc.) ──
      if (
        isQuestionOrQuery(rawText) &&
        !intent.action &&
        (intent.type as string) !== 'NEXT_QUESTION' &&
        (intent.type as string) !== 'PREV_QUESTION' &&
        (intent.type as string) !== 'SELECT_OPTION' &&
        (intent.type as string) !== 'GOTO_QUESTION'
      ) {
        const effectivePage = resolvePageNameFromRoute(currentRoute, activePage);
        console.log(`[VoiceAssistant] 🧠 Priority Page Q&A query for [${effectivePage}]: "${rawText}"`);
        const answer = await askPageQuestion(effectivePage, rawText);
        if (answer) {
          speak(answer, true);
          return true;
        }
      }

      // ── Handle Exam Status Queries ──
      if (intent.type === 'EXAM_STATUS') {
        if (!currentRoute.startsWith('/exam/') && !currentRoute.startsWith('/practice/')) {
          speak('You are not currently in an active exam.', true);
          return true;
        }
        // Exam state is stored in localStorage by the ExamEngine (or we could fetch from DOM if needed)
        // Since we don't have direct access to ExamEngine state in this context easily, we can read the ARIA status or simple DOM elements.
        const progressEl = document.querySelector('[role="progressbar"][aria-valuenow]') as HTMLElement;
        const totalTextEl = document.querySelector('[aria-label^="Question"]'); // Fallback logic

        let msg = 'I cannot determine your exact question number right now.';
        if (progressEl) {
          const current = progressEl.getAttribute('aria-valuenow');
          const max = progressEl.getAttribute('aria-valuemax');
          if (current && max) {
            msg = `You are on question ${current} out of ${max}.`;
          }
        }
        speak(msg, true);
        return true;
      }

      if (intent.type === 'UNANSWERED_COUNT') {
        if (!currentRoute.startsWith('/exam/') && !currentRoute.startsWith('/practice/')) {
          speak('You are not currently in an active exam.', true);
          return true;
        }
        // Count unanswered questions by counting un-answered buttons in the palette
        // The palette buttons usually have an aria-label like "Question 5, unanswered"
        const unansweredButtons = document.querySelectorAll('button[aria-label*="unanswered"], button[aria-label*="not answered"]');
        const answeredButtons = document.querySelectorAll('button[aria-label*="answered"]:not([aria-label*="unanswered"]):not([aria-label*="not answered"])');

        if (unansweredButtons.length > 0) {
          speak(`You have ${unansweredButtons.length} unanswered questions remaining.`, true);
        } else if (answeredButtons.length > 0) {
          speak('You have answered all questions. You can review your answers or say Submit Exam.', true);
        } else {
          speak('I cannot determine the number of unanswered questions right now.', true);
        }
        return true;
      }

      // ── Handle Global Navigation Intents ──
      if (intent.type === 'OPEN_DASHBOARD') {
        speak(intent.speechFeedback);
        navigate('/dashboard');
        return true;
      }

      // ── Handle Specific Exam Overview Open (without auto-starting) ──
      if (intent.type === 'OPEN_EXAM_OVERVIEW') {
        const targetId = intent.targetExamId || 'ssc-reasoning-01';
        conversationalMemoryRef.current.lastTargetExamId = targetId;
        conversationalMemoryRef.current.lastTargetExamTitle = intent.targetExamTitle || 'Mock Test';
        speak(intent.speechFeedback);
        navigate(intent.targetPage || `/exam/${targetId}`);
        return true;
      }

      if (intent.type === 'OPEN_MOCK_TESTS') {
        conversationalMemoryRef.current.lastSubject = 'Mock Tests';
        speak(intent.speechFeedback);
        navigate('/exams');
        return true;
      }

      if (intent.type === 'OPEN_PRACTICE') {
        speak(intent.speechFeedback);
        navigate('/practice');
        return true;
      }

      if (intent.type === 'OPEN_STUDY_MATERIALS') {
        speak(intent.speechFeedback);
        navigate('/study-materials');
        return true;
      }

      if (intent.type === 'OPEN_PYQS') {
        speak(intent.speechFeedback);
        navigate('/pyqs');
        return true;
      }

      if (intent.type === 'OPEN_RESULTS') {
        try {
          const liveAttempts = JSON.parse(localStorage.getItem('sight-exam-attempts') ?? '[]');
          if (liveAttempts && liveAttempts.length > 0 && liveAttempts[0]?.id) {
            speak(intent.speechFeedback);
            navigate(`/results/${liveAttempts[0].id}`);
            return true;
          }
        } catch { }
        speak(intent.speechFeedback);
        navigate('/history');
        return true;
      }

      if (intent.type === 'OPEN_PERFORMANCE') {
        speak(intent.speechFeedback);
        navigate('/performance');
        return true;
      }

      if (intent.type === 'OPEN_EXAM_HISTORY') {
        speak(intent.speechFeedback);
        navigate('/history');
        return true;
      }

      if (intent.type === 'OPEN_PROFILE') {
        speak(intent.speechFeedback);
        navigate('/profile');
        return true;
      }

      if (intent.type === 'OPEN_SETTINGS') {
        speak(intent.speechFeedback);
        navigate('/settings');
        return true;
      }

      if (intent.type === 'READ_NOTIFICATIONS' || (intent.type === 'OPEN_NOTIFICATIONS' && /\b(read|sunao|bol\s*kar|padho|batao)\b/i.test(rawText))) {
        drishtiActionService.readNotifications(intent.targetNotificationIndex);
        return true;
      }

      if (intent.type === 'CLOSE_NOTIFICATIONS') {
        drishtiActionService.closeNotifications();
        return true;
      }

      if (intent.type === 'OPEN_NOTIFICATIONS') {
        drishtiActionService.openNotifications();
        return true;
      }

      if (intent.type === 'LOGOUT') {
        speak('Logging out. Goodbye.', true);
        accessRef.current.logout();
        navigate('/login');
        return true;
      }

      if (intent.type === 'OPEN_LOGIN') {
        speak(intent.speechFeedback || 'Opening login page.');
        navigate('/login');
        return true;
      }

      if (intent.type === 'OPEN_REGISTER') {
        speak(intent.speechFeedback || 'Opening registration page.');
        navigate('/register');
        return true;
      }

      if (intent.type === 'DEMO_STUDENT_LOGIN') {
        speak('Signing in as candidate Aryan Sharma. Opening student dashboard.', true);
        try {
          await accessRef.current.login('aryan@example.com', 'student123');
        } catch {}
        navigate('/dashboard');
        return true;
      }

      if (intent.type === 'DEMO_ADMIN_LOGIN') {
        speak('Signing in as Examination Administrator. Opening management cockpit.', true);
        try {
          await accessRef.current.login('admin@drishtix.in', 'admin123');
        } catch {}
        navigate('/admin?tab=dashboard');
        return true;
      }

      if (intent.type === 'OPEN_ADMIN') {
        speak(intent.speechFeedback || 'Opening admin management cockpit.');
        navigate('/admin?tab=dashboard');
        return true;
      }

      if (intent.type === 'FILTER_CATEGORY') {
        speak(intent.speechFeedback || `Filtering by ${intent.targetCategory} category.`);
        if (currentRoute !== '/exams') {
          navigate(`/exams?category=${encodeURIComponent(intent.targetCategory || '')}`);
        }
        return true;
      }

      if (intent.type === 'FILTER_DIFFICULTY') {
        speak(intent.speechFeedback || `Filtering by ${intent.targetDifficulty} difficulty.`);
        if (currentRoute !== '/exams') {
          navigate(`/exams?difficulty=${encodeURIComponent(intent.targetDifficulty || '')}`);
        }
        return true;
      }

      if (intent.type === 'RESET_FILTERS') {
        speak(intent.speechFeedback || 'Showing all available mock examinations.');
        if (currentRoute !== '/exams') {
          navigate('/exams');
        }
        return true;
      }

      if (intent.type === 'NAVIGATE_BACK') {
        // If in full exam screen, previous question is handled by ExamInterface.
        // On non-exam screens, navigate back.
        if (!currentRoute.startsWith('/exam/')) {
          speak(intent.speechFeedback);
          navigate(-1);
          return true;
        }
      }

      // Explicit Start Mock Test command when NOT already taking an exam
      if (intent.type === 'START_EXAM' && !currentRoute.startsWith('/exam/')) {
        const resolvedTargetId =
          intent.targetExamId ||
          (intent.targetExamIndex !== undefined && EXAMS[intent.targetExamIndex]?.id) ||
          conversationalMemoryRef.current.lastTargetExamId;

        const resolvedTargetTitle =
          intent.targetExamTitle ||
          (resolvedTargetId ? EXAMS.find(e => e.id === resolvedTargetId)?.title : undefined) ||
          conversationalMemoryRef.current.lastTargetExamTitle;

        if (resolvedTargetId) {
          conversationalMemoryRef.current.lastTargetExamId = resolvedTargetId;
          if (resolvedTargetTitle) conversationalMemoryRef.current.lastTargetExamTitle = resolvedTargetTitle;
          speak(intent.speechFeedback || `Starting the ${resolvedTargetTitle || 'mock'} examination.`, true);
          navigate(`/exam/${resolvedTargetId}`);
          return true;
        }

        if (currentRoute === '/exams') {
          // Candidate is on the exams page but didn't specify which one
          speak('Please choose which mock test to start: Test 1 SSC Reasoning, Test 2 Banking, Test 3 UPSC, Test 4 Railway, Test 5 Defence, or Test 6 State PSC.', true);
          return true;
        }

        // If on generic screen (Dashboard, Home, Settings) without specific target exam,
        // navigate to /exams catalogue so a timed live test is never started accidentally
        conversationalMemoryRef.current.lastSubject = 'Mock Tests';
        speak('Opening mock test library. Please choose an exam to begin.', true);
        navigate('/exams');
        return true;
      }

      // Universal Repeat Last spoken text
      if (intent.type === 'REPEAT_LAST') {
        const ok = speechService.repeatLast();
        if (!ok) {
          speak('Nothing to repeat yet.');
        }
        return true;
      }

      // ── Handle Universal Accessibility & Theme Controls ──
      if (intent.type === 'THEME_LIGHT') {
        accessRef.current.setTheme('default');
        speak(intent.speechFeedback || 'Light mode activated.', true);
        return true;
      }

      if (intent.type === 'THEME_DARK') {
        accessRef.current.setTheme('dark');
        speak(intent.speechFeedback || 'Dark mode activated.', true);
        return true;
      }

      if (intent.type === 'THEME_CONTRAST') {
        accessRef.current.setTheme('high-contrast');
        speak(intent.speechFeedback || 'High contrast theme activated.', true);
        return true;
      }

      if (intent.type === 'THEME_YELLOW') {
        accessRef.current.setTheme('yellow-black');
        speak(intent.speechFeedback || 'Yellow on black theme activated.', true);
        return true;
      }

      if (intent.type === 'FONT_NORMAL') {
        accessRef.current.setFontSize('default');
        speak(intent.speechFeedback || 'Font size set to normal 100 percent.', true);
        return true;
      }

      if (intent.type === 'FONT_LARGE') {
        accessRef.current.setFontSize('large');
        speak(intent.speechFeedback || 'Font size set to large 115 percent.', true);
        return true;
      }

      if (intent.type === 'FONT_XLARGE') {
        accessRef.current.setFontSize('xlarge');
        speak(intent.speechFeedback || 'Font size set to extra large 135 percent.', true);
        return true;
      }

      if (intent.type === 'FONT_HUGE') {
        accessRef.current.setFontSize('xxlarge');
        speak(intent.speechFeedback || 'Font size set to huge 150 percent.', true);
        return true;
      }

      if (intent.type === 'VOICE_FASTER') {
        const curRate = accessRef.current.prefs.voiceRate;
        const newRate = Math.min(1.8, Number((curRate + 0.15).toFixed(2)));
        accessRef.current.setVoiceRate(newRate);
        speak(intent.speechFeedback || `Voice speed increased to ${newRate}x.`, true);
        return true;
      }

      if (intent.type === 'VOICE_SLOWER') {
        const curRate = accessRef.current.prefs.voiceRate;
        const newRate = Math.max(0.6, Number((curRate - 0.15).toFixed(2)));
        accessRef.current.setVoiceRate(newRate);
        speak(intent.speechFeedback || `Voice speed decreased to ${newRate}x.`, true);
        return true;
      }

      if (intent.type === 'VOICE_SAMPLE') {
        speechService.configure(
          accessRef.current.prefs.voiceRate,
          accessRef.current.prefs.voicePitch,
          accessRef.current.prefs.voiceName
        );
        speak('Welcome to DrishtiX. Beyond Barriers, Brighter Futures. Audio guidance is active and calibrated.', true);
        return true;
      }

      if (intent.type === 'RESET_SETTINGS') {
        accessRef.current.resetToDefaults();
        speak('Accessibility preferences reset to default values.', true);
        return true;
      }

      if (intent.type === 'VOICE_BRIEFING' && !currentRoute.startsWith('/performance')) {
        speak('Opening performance diagnostics for voice briefing.');
        navigate('/performance');
        return true;
      }

      // ── AUTONOMOUS VOICE SCROLLING & ACTION ENGINE ──
      if (intent.type === 'SCROLL_DOWN') {
        drishtiActionService.scrollDown();
        speak('Scrolling down.');
        return true;
      }

      if (intent.type === 'SCROLL_UP') {
        drishtiActionService.scrollUp();
        speak('Scrolling up.');
        return true;
      }

      if (intent.type === 'SCROLL_TOP') {
        drishtiActionService.scrollToTop();
        speak('Scrolled to top.');
        return true;
      }

      if (intent.type === 'SCROLL_BOTTOM') {
        drishtiActionService.scrollToBottom();
        speak('Scrolled to bottom.');
        return true;
      }

      if (intent.type === 'AUTO_SCROLL_START') {
        drishtiActionService.startAutoScroll();
        speak('Auto scrolling started.');
        return true;
      }

      if (intent.type === 'AUTO_SCROLL_STOP') {
        drishtiActionService.stopAutoScroll();
        speak('Auto scrolling stopped.');
        return true;
      }

      if (intent.type === 'AUTO_SCROLL_FASTER') {
        const newSpeed = drishtiActionService.adjustSpeed(0.25);
        speak(`Scroll speed increased to ${newSpeed.toFixed(1)}x.`);
        return true;
      }

      if (intent.type === 'AUTO_SCROLL_SLOWER') {
        const newSpeed = drishtiActionService.adjustSpeed(-0.25);
        speak(`Scroll speed decreased to ${newSpeed.toFixed(1)}x.`);
        return true;
      }

      if (intent.type === 'SCROLL_TO_SECTION') {
        const sec = intent.targetSection || '';
        const ok = drishtiActionService.scrollToSection(sec);
        if (ok) {
          speak(`Scrolled to ${sec}.`);
        } else {
          speak(`Section ${sec} not found on this screen.`);
        }
        return true;
      }

      if (intent.type === 'CLICK_ELEMENT') {
        const target = intent.targetElement || '';
        const res = drishtiActionService.clickElementByVoice(target);
        speak(res.message);
        return true;
      }

      if (intent.type === 'FOCUS_NEXT') {
        drishtiActionService.focusNext();
        speak('Focused next item.');
        return true;
      }

      if (intent.type === 'FOCUS_PREV') {
        drishtiActionService.focusPrev();
        speak('Focused previous item.');
        return true;
      }

      // If utterance was genuinely ambiguous (e.g. "open it", "start it", "do that")
      if (intent.type === 'CLARIFY_AMBIGUOUS') {

        speak(intent.speechFeedback, true);
        return true;
      }

      // ── UNIVERSAL SIDEBAR PAGE Q&A INTELLIGENCE FALLBACK ──
      // Answers any question or inquiry about the active sidebar page in Hindi or English
      if (rawText && rawText.trim().length > 1) {
        const effectivePage = resolvePageNameFromRoute(currentRoute, activePage);
        console.log(`[VoiceAssistant] 🤖 Unhandled query resolved via Page Intelligence [${effectivePage}]: "${rawText}"`);
        const answer = await askPageQuestion(effectivePage, rawText);
        if (answer) {
          speak(answer, true);
          return true;
        }
      }

      return false;
    });

    return () => {
      unregister();
    };
  }, [navigate, speak, location.pathname, toggleVoice]);

  // Subscriptions & User Gesture Unlock
  useEffect(() => {
    const unsubEngine = globalVoiceService.subscribeEngine(setEngine);
    const unsubStatus = globalVoiceService.subscribeStatus(setStatus);
    const unsubTranscript = globalVoiceService.subscribeTranscript(t => {
      setLastTranscript(t);
      setShowToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3500);
    });

    // Auto-start on mount or on first user gesture
    const startOrUnlock = async () => {
      if (!globalVoiceService.isActive()) {
        await globalVoiceService.start();
      }
    };

    startOrUnlock();

    const unlockOnGesture = () => {
      startOrUnlock();
      window.removeEventListener('click', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
    };
    window.addEventListener('click', unlockOnGesture, { once: true });
    window.addEventListener('keydown', unlockOnGesture, { once: true });

    // Global accessibility keyboard shortcuts for Drishti Assistant
    function onKeyDown(e: KeyboardEvent) {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Escape key: immediately silence any ongoing speech (like tapping Siri / Alexa)
      if (e.key === 'Escape') {
        speechService.stop();
        return;
      }

      // Alt + D: Toggle / Wake Drishti Voice Assistant from anywhere
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleVoice();
        return;
      }

      // Alt + N: Read Notifications via Drishti
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        const candidate = accessRef.current.user?.name ? accessRef.current.user.name.split(' ')[0] : '';
        const allNotifs = notificationService.getAll();
        const unread = allNotifs.filter(n => !n.read);
        if (unread.length === 0) {
          const prefix = candidate ? `${candidate}, you` : 'You';
          speak(`${prefix} have no unread notifications.`);
        } else {
          const prefix = candidate ? `${candidate}, you` : 'You';
          let text = `${prefix} have ${unread.length} unread notification${unread.length > 1 ? 's' : ''}. `;
          unread.forEach((n, i) => {
            text += `Notification ${i + 1}: ${n.title}. ${n.message}. `;
            notificationService.markAsRead(n.id);
          });
          speak(text, true);
        }
        return;
      }

      // V key (when not typing in an input): Toggle Voice Assistant
      if (!isInput && !e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'v' || e.key === 'V')) {
        toggleVoice();
        return;
      }
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      unsubEngine();
      unsubStatus();
      unsubTranscript();
      window.removeEventListener('click', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
      window.removeEventListener('keydown', onKeyDown);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [toggleVoice]);

  // Don't show floating widget during full exam screen
  const isExamRunning = location.pathname.startsWith('/exam/');

  return (
    <VoiceAssistantContext.Provider
      value={{
        active,
        engine,
        status,
        lastTranscript,
        lastSpoken,
        lastNluResult,
        currentPage,
        toggleVoice,
        speak,
        registerPageContext,
      }}
    >
      {children}

      {/* ── Global Floating Voice Indicator & Controls ── */}
      {!isExamRunning && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 22,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px',
            pointerEvents: 'none',
          }}
        >
          {/* Auto-Scrolling HUD Pill */}
          {isAutoScrolling && (
            <div
              className="fade-in"
              style={{
                pointerEvents: 'auto',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.95))',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(59, 130, 246, 0.7)',
                color: '#F8FAFC',
                borderRadius: '999px',
                padding: '0.4rem 0.9rem',
                fontSize: '0.8rem',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ChevronDown size={16} className="animate-bounce" color="#60A5FA" />
              <span style={{ fontWeight: 600, color: '#93C5FD' }}>
                Auto-Scrolling ({autoScrollSpeed.toFixed(1)}x)
              </span>
              <button
                onClick={() => drishtiActionService.stopAutoScroll()}
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#FCA5A5',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: 4,
                }}
                title="Stop auto scroll"
              >
                Pause
              </button>
            </div>
          )}
          {/* Transcript Toast Pill */}
          {showToast && lastTranscript && (
            <div
              className="fade-in"
              style={{
                pointerEvents: 'auto',
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(12px)',
                border: lastNluResult?.source === 'ai-nlu'
                  ? '1.5px solid rgba(168, 85, 247, 0.6)'
                  : '1.5px solid rgba(59, 130, 246, 0.5)',
                color: '#F8FAFC',
                borderRadius: '999px',
                padding: '0.45rem 1rem',
                fontSize: '0.82rem',
                boxShadow: lastNluResult?.source === 'ai-nlu'
                  ? '0 8px 24px rgba(168, 85, 247, 0.25)'
                  : '0 8px 24px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                maxWidth: 380,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: lastNluResult?.source === 'ai-nlu' ? '#C084FC' : '#38BDF8',
                  boxShadow: lastNluResult?.source === 'ai-nlu' ? '0 0 8px #C084FC' : '0 0 8px #38BDF8',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600, color: lastNluResult?.source === 'ai-nlu' ? '#E9D5FF' : '#93C5FD', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                {lastNluResult?.source === 'ai-nlu' ? <Sparkles size={13} color="#C084FC" /> : null}
                Drishti heard:
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{lastTranscript}"
              </span>
              {lastNluResult?.source === 'ai-nlu' && (
                <span
                  style={{
                    fontSize: '0.62rem',
                    background: 'rgba(168, 85, 247, 0.25)',
                    color: '#F3E8FF',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    padding: '1px 6px',
                    borderRadius: 999,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                  }}
                  title={lastNluResult.reasoning || 'Understood via Groq AI Semantic Parser'}
                >
                  AI NLU {lastNluResult.latencyMs ? `• ${lastNluResult.latencyMs}ms` : ''}
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
            {/* Command Guide Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                audioCueService.notification();
                setShowCommandModal(true);
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.96)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                transition: 'transform 0.15s ease',
              }}
              aria-label="Open Voice Commands Guide"
              title="Voice Commands Guide (Say 'Help' or 'Commands')"
            >
              <HelpCircle size={18} color="var(--primary, #38BDF8)" />
            </button>

            {/* Persistent Voice Assistant Floating Bar */}
            <div
              style={{
                pointerEvents: 'auto',
                background: active
                  ? engine === 'groq'
                    ? 'linear-gradient(135deg, #1E1B4B, #312E81)'
                    : engine === 'whisper'
                      ? 'linear-gradient(135deg, #0F172A, #1E293B)'
                      : 'linear-gradient(135deg, #064E3B, #0F172A)'
                  : '#1E293B',
                border: active
                  ? engine === 'groq'
                    ? '1.5px solid #818CF8'
                    : engine === 'whisper'
                      ? '1.5px solid #3B82F6'
                      : '1.5px solid #10B981'
                  : '1px solid #475569',
                borderRadius: '999px',
                padding: '0.4rem 0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: active
                  ? engine === 'groq'
                    ? '0 6px 22px rgba(99, 102, 241, 0.5)'
                    : '0 6px 22px rgba(37, 99, 235, 0.4)'
                  : '0 4px 14px rgba(0,0,0,0.25)',
                color: '#fff',
                fontSize: '0.8rem',
                cursor: status.toLowerCase().includes('processing') ? 'not-allowed' : 'pointer',
                opacity: status.toLowerCase().includes('processing') ? 0.85 : 1,
                transition: 'all 0.25s ease',
              }}
              onClick={status.toLowerCase().includes('processing') ? undefined : toggleVoice}
              role="button"
              tabIndex={0}
              aria-label={`Drishti AI Assistant: ${active ? status : 'Muted'}. Say Drishti or press Alt+D or V.`}
              title={`Drishti AI Assistant. Say 'Drishti start exam', 'Drishti read notification', or press Alt+D / V.`}
            >
              {/* Mic Icon */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: active
                    ? engine === 'groq'
                      ? 'linear-gradient(135deg, #6366F1, #A855F7)'
                      : engine === 'whisper'
                        ? 'linear-gradient(135deg, #2563EB, #38BDF8)'
                        : 'linear-gradient(135deg, #059669, #34D399)'
                    : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: active
                    ? engine === 'groq'
                      ? '0 0 10px rgba(168, 85, 247, 0.6)'
                      : '0 0 10px rgba(59, 130, 246, 0.6)'
                    : 'none',
                }}
              >
                {active ? <Mic size={15} color="#fff" /> : <MicOff size={15} color="#94A3B8" />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', color: active ? '#F8FAFC' : '#94A3B8' }}>
                    {active
                      ? 'Drishti AI Assistant'
                      : 'Drishti Muted'}
                  </span>
                  {active && (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '999px',
                        background:
                          engine === 'groq'
                            ? '#4338CA'
                            : engine === 'whisper'
                              ? '#0284C7'
                              : '#065F46',
                        color: engine === 'groq' ? '#EEF2FF' : '#E0F2FE',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                      }}
                    >
                      {engine === 'groq' ? 'GROQ CLOUD' : engine === 'whisper' ? 'OFFLINE WHISPER' : 'BROWSER'}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.68rem', color: active ? (status.toLowerCase().includes('offline') ? '#FBBF24' : engine === 'groq' ? '#C7D2FE' : '#93C5FD') : '#64748B' }}>
                  {active ? status : 'Press Alt+D or V to wake Drishti'}
                </span>
              </div>

              {/* Glowing pulse indicator when active */}
              {active && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background:
                      engine === 'groq'
                        ? '#A855F7'
                        : engine === 'whisper'
                          ? '#38BDF8'
                          : '#34D399',
                    boxShadow:
                      engine === 'groq'
                        ? '0 0 8px #A855F7'
                        : engine === 'whisper'
                          ? '0 0 8px #38BDF8'
                          : '0 0 8px #34D399',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Drishti Voice Command Center Modal ── */}
      {showCommandModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-modal-title"
          style={{ zIndex: 100000 }}
          onClick={() => setShowCommandModal(false)}
        >
          <div
            className="modal-box"
            style={{ maxWidth: 650, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={20} />
                </div>
                <div>
                  <h2 id="voice-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                    Drishti Voice Command Center
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Universally accessible voice navigation & hands-free examination
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setShowCommandModal(false)}
                aria-label="Close voice commands modal"
                style={{ padding: '0.4rem', minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Navigation Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem', marginBottom: '0.85rem', overflowX: 'auto' }}>
              {[
                { id: 'exam', label: 'Exam Taking' },
                { id: 'nav', label: 'Navigation' },
                { id: 'access', label: 'Accessibility' },
                { id: 'hindi', label: 'Hindi / हिंदी' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  className={`btn-ghost ${modalTab === tab.id ? 'active' : ''}`}
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: modalTab === tab.id ? 'var(--primary)' : 'var(--bg-surface)',
                    color: modalTab === tab.id ? '#fff' : 'var(--text)',
                    border: '1.5px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Commands Body */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem', paddingRight: '0.2rem' }}>
              {modalTab === 'exam' && (
                <>
                  {[
                    { cmd: 'Option B / Lock B', desc: 'Select option B for current question immediately' },
                    { cmd: 'Next question / Agla sawal', desc: 'Save answer and move to the next question' },
                    { cmd: 'Previous question / Pichla sawal', desc: 'Return to previous question' },
                    { cmd: 'Question 5 / Sawal number 5', desc: 'Directly jump to specific question index' },
                    { cmd: 'Read question / Repeat', desc: 'Speaks current question, equation verbalization and options' },
                    { cmd: 'Time left / Kitna time bacha hai', desc: 'Announces exact remaining exam time with compensatory time' },
                    { cmd: 'Verbalize formula', desc: 'Reads complex math equations in clear spoken words' },
                    { cmd: 'Describe diagram', desc: 'Gives spatial audio description of visual diagrams' },
                    { cmd: 'Flag question / Mark for review', desc: 'Tags question for later review' },
                    { cmd: 'Submit exam / Confirm submit', desc: 'Opens two-step protected submission with vocal confirmation' },
                  ].map(c => (
                    <div key={c.cmd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>{c.desc}</span>
                      <kbd style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '0.35rem', whiteSpace: 'nowrap' }}>
                        "{c.cmd}"
                      </kbd>
                    </div>
                  ))}
                </>
              )}

              {modalTab === 'nav' && (
                <>
                  {[
                    { cmd: 'Open mock test / Pariksha kholo', desc: 'Navigates directly to the competitive mock exams catalog' },
                    { cmd: 'Open practice / Abhyas shuru karo', desc: 'Opens AI interactive practice drill module' },
                    { cmd: 'Dashboard / Home par jao', desc: 'Returns to student dashboard overview' },
                    { cmd: 'Results / Natija dikhao', desc: 'Opens scorecard, analytics, and solution review' },
                    { cmd: 'Orient page / Where am I?', desc: 'Audibly describes current page layout, active tab, and key actions' },
                    { cmd: 'Scroll down / Scroll up', desc: 'Voice-controlled smooth scrolling across the page' },
                    { cmd: 'Read notifications', desc: 'Speaks unread platform and exam notices aloud' },
                    { cmd: 'Profile / Accommodations', desc: 'Opens candidate profile and PwD verification details' },
                  ].map(c => (
                    <div key={c.cmd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>{c.desc}</span>
                      <kbd style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '0.35rem', whiteSpace: 'nowrap' }}>
                        "{c.cmd}"
                      </kbd>
                    </div>
                  ))}
                </>
              )}

              {modalTab === 'access' && (
                <>
                  {[
                    { cmd: 'High contrast / Yellow on black', desc: 'Switches to WCAG AAA compliant high-contrast color themes' },
                    { cmd: 'Light mode / Dark mode', desc: 'Toggles between standard clean light and dark palettes' },
                    { cmd: 'Font huge / Font large / Normal', desc: 'Scales entire platform typography (100% to 150%)' },
                    { cmd: 'Voice faster / Speak faster', desc: 'Increases text-to-speech reading rate (+0.15x)' },
                    { cmd: 'Voice slower / Speak slower', desc: 'Slows down text-to-speech reading pace (-0.15x)' },
                    { cmd: 'Stop speaking / Be quiet', desc: 'Immediately cuts off current speech synthesis (same as Esc)' },
                    { cmd: 'Reset settings', desc: 'Restores all accessibility preferences to default calibrated states' },
                  ].map(c => (
                    <div key={c.cmd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>{c.desc}</span>
                      <kbd style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '0.35rem', whiteSpace: 'nowrap' }}>
                        "{c.cmd}"
                      </kbd>
                    </div>
                  ))}
                </>
              )}

              {modalTab === 'hindi' && (
                <>
                  {[
                    { cmd: 'दृष्टि अगला सवाल', desc: 'Moves to next question in Hindi' },
                    { cmd: 'ऑप्शन बी लॉक करो', desc: 'Locks option B in Hindi' },
                    { cmd: 'कितना समय बचा है?', desc: 'Asks remaining exam time in Hindi' },
                    { cmd: 'सवाल फिर से पढ़ो', desc: 'Repeats the question and all options in Hindi' },
                    { cmd: 'फार्मूला समझाओ', desc: 'Verbalizes mathematical equations in Hindi' },
                    { cmd: 'प्रैक्टिस शुरू करो', desc: 'Opens practice drills module' },
                    { cmd: 'मॉक टेस्ट खोलो', desc: 'Opens competitive examinations catalog' },
                    { cmd: 'हाई कंट्रास्ट करो', desc: 'Toggles high contrast theme in Hindi' },
                    { cmd: 'चुप रहो / आवाज़ बंद', desc: 'Silences speech synthesis' },
                  ].map(c => (
                    <div key={c.cmd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>{c.desc}</span>
                      <kbd style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '0.35rem', whiteSpace: 'nowrap' }}>
                        "{c.cmd}"
                      </kbd>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '0.85rem', marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  audioCueService.voiceActivate();
                  speak('Testing Drishti audio guidance. Your microphone and speech synthesizer are calibrated.');
                }}
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Volume2 size={15} /> Test Speech Audio
              </button>
              <button
                className="btn-primary"
                onClick={() => setShowCommandModal(false)}
                style={{ fontSize: '0.8rem', padding: '0.45rem 1.1rem' }}
              >
                Done (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </VoiceAssistantContext.Provider>
  );
}

