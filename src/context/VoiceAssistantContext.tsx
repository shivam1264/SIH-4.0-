import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { globalVoiceService, EngineType } from '../services/globalVoiceService';
import { classifyVoiceIntent, ConversationalMemory } from '../services/voiceCommandClassifier';
import { speechService } from '../services/speechService';
import { useAccessibility } from './AccessibilityContext';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { audioCueService } from '../services/audioCueService';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';
import { Mic, MicOff, Volume2, Sparkles, X } from 'lucide-react';

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
  const { logout } = useAuth();

  const accessRef = useRef({ prefs, setTheme, setFontSize, setVoiceRate, resetToDefaults, logout });
  accessRef.current = { prefs, setTheme, setFontSize, setVoiceRate, resetToDefaults, logout };

  const [active, setActive] = useState(true);
  const [engine, setEngine] = useState<EngineType>('none');
  const [status, setStatus] = useState('Listening...');
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastSpoken, setLastSpoken] = useState('');
  const [currentPage, setCurrentPage] = useState('App');
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<any>(null);

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
      try { audioCueService.voiceStop(); } catch (e) {}
      screenReaderAnnouncer.announcePolite('Voice assistant deactivated.');
      speak('Voice assistant muted.');
    } else {
      await enableMicrophone();
      await globalVoiceService.start();
      setActive(true);
      try { audioCueService.voiceActivate(); } catch (e) {}
      screenReaderAnnouncer.announcePolite('Voice assistant activated.');
      speak('Voice assistant active. Listening now.');
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
    const unregister = globalVoiceService.register((rawText: string) => {
      const activePage = currentPageRef.current;
      const currentItems = pageRegistryRef.current.get(activePage) || [];
      const currentRoute = location.pathname;

      console.log(`[VoiceAssistant] Transcript: "${rawText}" on [${activePage}] (route=${currentRoute})`);

      // 1. Pass to semantic intent classifier with conversational memory
      const intent = classifyVoiceIntent(rawText, {
        route: currentRoute,
        activePage,
        conversationalState: conversationalMemoryRef.current,
      });

      console.log('[VoiceAssistant] Classified Intent:', intent.type, intent);

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

      // Handle Help & Feature Guidance
      if (intent.type === 'HELP') {
        const sampleQuestions = currentItems.map(i => i.triggers[0]).slice(0, 3).join(', ');
        const helpMsg = sampleQuestions
          ? `You can say Open Mock Tests, Open Dashboard, Practice Drills, or on this screen say: ${sampleQuestions}.`
          : intent.speechFeedback || 'You can say Open Mock Tests, Open Dashboard, AI Practice, Show Results, or Accessibility Settings.';
        speak(helpMsg, true);
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
        } catch {}
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

      if (intent.type === 'OPEN_NOTIFICATIONS') {
        const wantsToRead = /\b(read|sunao|bol\s*kar|padho)\b/i.test(rawText);
        const notifBtn = document.getElementById('drishtix-notifications-trigger') as HTMLButtonElement | null;

        if (wantsToRead) {
          const allNotifs = notificationService.getAll();
          const unread = allNotifs.filter(n => !n.read);

          if (unread.length === 0) {
            speak('You have no unread notifications.');
          } else {
            let text = `You have ${unread.length} unread notification${unread.length > 1 ? 's' : ''}. `;
            unread.forEach((n, i) => {
              text += `Notification ${i + 1}: ${n.title}. ${n.message}. `;
              notificationService.markAsRead(n.id);
            });
            speak(text, true);
          }
        } else {
          if (notifBtn) {
            notifBtn.click();
          } else {
            speak(intent.speechFeedback);
          }
        }
        return true;
      }

      if (intent.type === 'LOGOUT') {
        speak('Logging out. Goodbye.', true);
        accessRef.current.logout();
        navigate('/login');
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
        const targetId = intent.targetExamId || conversationalMemoryRef.current.lastTargetExamId || 'ssc-reasoning-01';
        const targetTitle = intent.targetExamTitle || conversationalMemoryRef.current.lastTargetExamTitle || 'mock';
        conversationalMemoryRef.current.lastTargetExamId = targetId;
        conversationalMemoryRef.current.lastTargetExamTitle = targetTitle;
        speak(intent.speechFeedback || `Starting the ${targetTitle} mock test.`, true);
        navigate(`/exam/${targetId}`);
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
        speak('Light mode activated.', true);
        return true;
      }

      if (intent.type === 'THEME_DARK') {
        accessRef.current.setTheme('dark');
        speak('Dark mode activated.', true);
        return true;
      }

      if (intent.type === 'THEME_CONTRAST') {
        accessRef.current.setTheme('high-contrast');
        speak('High contrast theme activated.', true);
        return true;
      }

      if (intent.type === 'THEME_YELLOW') {
        accessRef.current.setTheme('yellow-black');
        speak('Yellow on black theme activated.', true);
        return true;
      }

      if (intent.type === 'FONT_NORMAL') {
        accessRef.current.setFontSize('default');
        speak('Font size set to normal 100 percent.', true);
        return true;
      }

      if (intent.type === 'FONT_LARGE') {
        accessRef.current.setFontSize('large');
        speak('Font size set to large 115 percent.', true);
        return true;
      }

      if (intent.type === 'FONT_XLARGE') {
        accessRef.current.setFontSize('xlarge');
        speak('Font size set to extra large 135 percent.', true);
        return true;
      }

      if (intent.type === 'FONT_HUGE') {
        accessRef.current.setFontSize('xxlarge');
        speak('Font size set to huge 150 percent.', true);
        return true;
      }

      if (intent.type === 'VOICE_FASTER') {
        const curRate = accessRef.current.prefs.voiceRate;
        const newRate = Math.min(1.8, Number((curRate + 0.15).toFixed(2)));
        accessRef.current.setVoiceRate(newRate);
        speak(`Voice speed increased to ${newRate}x.`, true);
        return true;
      }

      if (intent.type === 'VOICE_SLOWER') {
        const curRate = accessRef.current.prefs.voiceRate;
        const newRate = Math.max(0.6, Number((curRate - 0.15).toFixed(2)));
        accessRef.current.setVoiceRate(newRate);
        speak(`Voice speed decreased to ${newRate}x.`, true);
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

      // If utterance was genuinely ambiguous (e.g. "open it", "start it", "do that")
      if (intent.type === 'CLARIFY_AMBIGUOUS') {
        speak(intent.speechFeedback, true);
        return true;
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

    // Keyboard shortcut: Press 'V' anytime to toggle voice
    function onKeyDown(e: KeyboardEvent) {
      if (
        (e.key === 'v' || e.key === 'V') &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        toggleVoice();
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
          {/* Transcript Toast Pill */}
          {showToast && lastTranscript && (
            <div
              className="fade-in"
              style={{
                pointerEvents: 'auto',
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(59, 130, 246, 0.5)',
                color: '#F8FAFC',
                borderRadius: '999px',
                padding: '0.45rem 1rem',
                fontSize: '0.82rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                maxWidth: 340,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#38BDF8',
                  boxShadow: '0 0 8px #38BDF8',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600, color: '#93C5FD', flexShrink: 0 }}>Heard:</span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                "{lastTranscript}"
              </span>
            </div>
          )}

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
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onClick={toggleVoice}
            role="button"
            tabIndex={0}
            aria-label={`Voice Assistant: ${active ? status : 'Muted'}. Press V to toggle.`}
            title={`Press V to toggle. Status: ${status}`}
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
                    ? engine === 'groq'
                      ? 'Cloud AI Voice'
                      : engine === 'whisper'
                      ? 'Whisper AI Voice'
                      : 'Web Speech Voice'
                    : 'Voice Muted'}
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
                          ? '#1D4ED8'
                          : '#065F46',
                      color: engine === 'groq' ? '#EEF2FF' : '#E0F2FE',
                      fontWeight: 600,
                    }}
                  >
                    {engine === 'groq' ? 'WHISPER LARGE-V3' : engine === 'whisper' ? 'LOCAL AI' : 'BROWSER'}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: active ? (engine === 'groq' ? '#C7D2FE' : '#93C5FD') : '#64748B' }}>
                {active ? `${currentPage} • Press V` : 'Click or Press V to listen'}
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
      )}
    </VoiceAssistantContext.Provider>
  );
}
