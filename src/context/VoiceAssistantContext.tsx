import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { globalVoiceService, EngineType } from '../services/globalVoiceService';
import { speechService } from '../services/speechService';
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
      speak('Voice assistant muted.');
    } else {
      await enableMicrophone();
      await globalVoiceService.start();
      setActive(true);
      speak('Voice assistant active. Listening now.');
    }
  }, [speak]);

  const registerPageContext = useCallback((pageName: string, items: PageQAItem[]) => {
    pageRegistryRef.current.set(pageName, items);
    setCurrentPage(pageName);

    return () => {
      pageRegistryRef.current.delete(pageName);
    };
  }, []);

  // ── Unified Single Dispatcher: Page Q&A First, then Global Nav ──
  useEffect(() => {
    const unregister = globalVoiceService.register((rawText: string) => {
      const text = rawText.toLowerCase().trim();
      const activePage = currentPageRef.current;
      const currentItems = pageRegistryRef.current.get(activePage) || [];

      console.log(`[VoiceAssistant] Testing transcript "${text}" on page [${activePage}] with ${currentItems.length} items`);

      const isQuestion =
        text.includes('kitne') ||
        text.includes('kitna') ||
        text.includes('kya') ||
        text.includes('kaun') ||
        text.includes('how') ||
        text.includes('what') ||
        text.includes('batao') ||
        text.includes('sunao') ||
        text.includes('padho');

      // ── PRIORITY 1: Sidebar & Page Navigation Commands ──
      // 1. Mock Tests / Exam Library
      if (
        !isQuestion &&
        (text.includes('mock test') ||
          text.includes('mock tests') ||
          text.includes('exam library') ||
          text.includes('exams') ||
          text.includes('pariksha') ||
          text === 'mock tests' ||
          text === 'mock test')
      ) {
        speak('Opening Mock Exam Library');
        navigate('/exams');
        return true;
      }
      if (
        text.includes('open mock') ||
        text.includes('go to mock') ||
        text.includes('open exam') ||
        text.includes('show exam') ||
        text.includes('mock test par jao') ||
        text.includes('mock test kholo')
      ) {
        speak('Opening Mock Exam Library');
        navigate('/exams');
        return true;
      }

      // 2. AI Practice Drills
      if (
        !isQuestion &&
        (text.includes('practice drill') ||
          text.includes('practice') ||
          text.includes('abhyas') ||
          text.includes('drills') ||
          text === 'ai practice' ||
          text === 'practice')
      ) {
        speak('Opening AI Practice Drills');
        navigate('/practice');
        return true;
      }
      if (
        text.includes('open practice') ||
        text.includes('go to practice') ||
        text.includes('start practice') ||
        text.includes('practice kholo') ||
        text.includes('practice par jao')
      ) {
        speak('Opening AI Practice Drills');
        navigate('/practice');
        return true;
      }

      // 3. Performance Analytics
      if (
        !isQuestion &&
        (text.includes('performance') ||
          text.includes('analytics') ||
          text.includes('pradarshan') ||
          text === 'performance')
      ) {
        speak('Opening Performance Analytics');
        navigate('/performance');
        return true;
      }
      if (
        text.includes('open performance') ||
        text.includes('go to performance') ||
        text.includes('performance kholo') ||
        text.includes('performance par jao') ||
        text.includes('show performance')
      ) {
        speak('Opening Performance Analytics');
        navigate('/performance');
        return true;
      }

      // 4. Candidate Profile
      if (
        !isQuestion &&
        (text.includes('profile') ||
          text.includes('meri profile') ||
          text === 'profile')
      ) {
        speak('Opening Candidate Profile');
        navigate('/profile');
        return true;
      }
      if (
        text.includes('open profile') ||
        text.includes('go to profile') ||
        text.includes('profile kholo') ||
        text.includes('profile par jao')
      ) {
        speak('Opening Candidate Profile');
        navigate('/profile');
        return true;
      }

      // 5. Accessibility Settings
      if (
        !isQuestion &&
        (text.includes('setting') ||
          text.includes('accessibility') ||
          text === 'settings')
      ) {
        speak('Opening Accessibility Settings');
        navigate('/settings');
        return true;
      }
      if (
        text.includes('open setting') ||
        text.includes('go to setting') ||
        text.includes('settings kholo') ||
        text.includes('settings par jao')
      ) {
        speak('Opening Accessibility Settings');
        navigate('/settings');
        return true;
      }

      // 6. Dashboard / Home
      if (
        text.includes('dashboard') ||
        text.includes('go home') ||
        text.includes('main page') ||
        text.includes('home jao') ||
        text === 'home'
      ) {
        speak('Opening Dashboard');
        navigate('/dashboard');
        return true;
      }

      // 7. Go Back
      if (
        text.includes('go back') ||
        text.includes('piche jao') ||
        text.includes('peeche') ||
        text.includes('previous page') ||
        text === 'back'
      ) {
        speak('Going back');
        navigate(-1);
        return true;
      }

      // ── PRIORITY 2: Check Current Page Q&A ──
      for (const item of currentItems) {
        const matched = item.triggers.some(trig => {
          const t = trig.toLowerCase().trim();
          if (text.includes(t)) return true;
          const trigWords = t.split(' ');
          if (trigWords.length > 1 && trigWords.every(w => text.includes(w))) {
            return true;
          }
          return false;
        });

        if (matched) {
          console.log(`[VoiceAssistant] ✅ Page [${activePage}] handled trigger:`, item.triggers[0]);
          try {
            const res = item.answer();
            if (typeof res === 'string') {
              speak(res, true);
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

      // Repeat
      if (
        text.includes('repeat') ||
        text.includes('phir se bolo') ||
        text.includes('dobara bolo') ||
        text.includes('again')
      ) {
        const last = globalVoiceService.getLastSpoken();
        if (last) {
          speak(last, true);
        } else {
          speak('Nothing to repeat yet.');
        }
        return true;
      }

      // Stop Audio
      if (
        text.includes('stop speaking') ||
        text.includes('chup') ||
        text.includes('quiet') ||
        text.includes('shant') ||
        text.includes('mute audio')
      ) {
        speechService.stop();
        return true;
      }

      // Help
      if (
        text.includes('help') ||
        text.includes('madad') ||
        text.includes('what can i say') ||
        text.includes('kya bol sakta') ||
        text.includes('commands')
      ) {
        const pageItems = pageRegistryRef.current.get(currentPageRef.current) || [];
        const sampleQuestions = pageItems
          .map(i => i.triggers[0])
          .slice(0, 3)
          .join(', ');
        const helpMsg = `Aap Dashboard, Exams, Practice ya Profile bol sakte hain. Is page par pooch sakte hain: ${sampleQuestions || 'kuch bhi'}.`;
        speak(helpMsg, true);
        return true;
      }

      return false;
    });

    return () => {
      unregister();
    };
  }, [navigate, speak]);

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
                ? engine === 'whisper'
                  ? 'linear-gradient(135deg, #0F172A, #1E293B)'
                  : 'linear-gradient(135deg, #064E3B, #0F172A)'
                : '#1E293B',
              border: active
                ? engine === 'whisper'
                  ? '1.5px solid #3B82F6'
                  : '1.5px solid #10B981'
                : '1px solid #475569',
              borderRadius: '999px',
              padding: '0.4rem 0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: active
                ? '0 6px 22px rgba(37, 99, 235, 0.4)'
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
                  ? engine === 'whisper'
                    ? 'linear-gradient(135deg, #2563EB, #38BDF8)'
                    : 'linear-gradient(135deg, #059669, #34D399)'
                  : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: active ? '0 0 10px rgba(59, 130, 246, 0.6)' : 'none',
              }}
            >
              {active ? <Mic size={15} color="#fff" /> : <MicOff size={15} color="#94A3B8" />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.78rem', color: active ? '#F8FAFC' : '#94A3B8' }}>
                  {active
                    ? engine === 'whisper'
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
                      background: engine === 'whisper' ? '#1D4ED8' : '#065F46',
                      color: '#E0F2FE',
                      fontWeight: 600,
                    }}
                  >
                    {engine === 'whisper' ? 'LOCAL AI' : 'BROWSER'}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: active ? '#93C5FD' : '#64748B' }}>
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
                  background: engine === 'whisper' ? '#38BDF8' : '#34D399',
                  boxShadow: engine === 'whisper' ? '0 0 8px #38BDF8' : '0 0 8px #34D399',
                }}
              />
            )}
          </div>
        </div>
      )}
    </VoiceAssistantContext.Provider>
  );
}
