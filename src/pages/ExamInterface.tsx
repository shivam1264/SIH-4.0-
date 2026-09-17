import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  XCircle,
  Clock,
  Flag,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Zap,
  Send,
  HelpCircle,
  FileText,
  BarChart3,
  Terminal,
  Play,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Keyboard,
  Calculator,
  Eye,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { EXAMS, MOCK_ATTEMPTS } from '../data/mockData';
import { examsApi, attemptsApi } from '../services/api';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { classifyVoiceCommand, classifyVoiceIntent, VoiceCommandMatch } from '../services/voiceCommandClassifier';
import { drishtiNluService, DrishtiNluResult } from '../services/drishtiNluService';
import { globalVoiceService } from '../services/globalVoiceService';
import PreExamCalibrationWizard from '../components/PreExamCalibrationWizard';
import AccessibleMathViewer, { verbalizeMathExpression } from '../components/AccessibleMathViewer';
import AccessibleDiagramViewer from '../components/AccessibleDiagramViewer';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';
import type { Exam, ExamAttempt, SubjectBreakdown } from '../types';

export default function ExamInterface() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { prefs } = useAccessibility();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | undefined>(() => {
    return EXAMS.find(e => e.id === examId);
  });
  const [isFetchingExam, setIsFetchingExam] = useState<boolean>(!exam);

  useEffect(() => {
    if (!examId) return;
    examsApi.getById(examId).then(found => {
      if (found) {
        setExam(found);
      }
      setIsFetchingExam(false);
    }).catch(() => {
      setIsFetchingExam(false);
    });
  }, [examId]);

  // Compensatory extra time & autonomous mode state
  const [timeMultiplier, setTimeMultiplier] = useState<number>(() => {
    const saved = localStorage.getItem('sight_time_multiplier');
    return saved ? parseFloat(saved) : 1.5;
  });
  const [autonomousMode, setAutonomousMode] = useState<boolean>(() => {
    return localStorage.getItem('sight_autonomous_mode') !== 'false';
  });
  const [showCalibrationWizard, setShowCalibrationWizard] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showAiExplainer, setShowAiExplainer] = useState(false);
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const [voiceAuditLog, setVoiceAuditLog] = useState<{ time: string; action: string; command: string }[]>([]);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState('');

  const [current, setCurrent]           = useState(0);
  const [answers, setAnswers]           = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flagged, setFlagged]           = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft]         = useState(() => {
    const baseMin = exam?.durationMinutes ?? 10;
    const mult = parseFloat(localStorage.getItem('sight_time_multiplier') || '1.5');
    return Math.round(baseMin * 60 * mult);
  });
  const [voiceActive, setVoiceActive]   = useState(true);
  const [voiceText, setVoiceText]       = useState('');
  const [lastAction, setLastAction]     = useState('');
  const [voiceError, setVoiceError]     = useState('');
  const [micVolume, setMicVolume]       = useState(0);
  const [isSpeakingAloud, setIsSpeakingAloud] = useState(false);
  const [engineState, setEngineState]   = useState<'idle' | 'listening' | 'speech' | 'error'>('idle');
  const [showPalette, setShowPalette]   = useState(false);
  const [showSubmitDlg, setShowSubmitDlg] = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [started, setStarted]           = useState(false);
  const questionRef                     = useRef<HTMLDivElement>(null);
  const recogRef                        = useRef<any>(null);
  const audioContextRef                 = useRef<AudioContext | null>(null);
  const mediaStreamRef                  = useRef<MediaStream | null>(null);
  const animFrameRef                    = useRef<number | null>(null);
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime                       = useRef(Date.now());
  const examStartTimestampRef           = useRef<number>(Date.now());
  const totalAllocatedSecondsRef        = useRef<number>(Math.round((exam?.durationMinutes ?? 10) * 60 * 1.5));
  const questionTimes                   = useRef<Record<string, number>>({});
  const qStartTime                      = useRef(Date.now());

  const [autoAdvance, setAutoAdvance]   = useState(false);
  const [autoAdvanceMsg, setAutoAdvanceMsg] = useState('');
  const autoAdvanceTimerRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoAdvancingRef              = useRef(false);

  // Synchronous refs to prevent React stale closure bugs in persistent SpeechRecognition callbacks
  const currentRef        = useRef(current);
  const examRef           = useRef(exam);
  const answersRef        = useRef(answers);
  const flaggedRef        = useRef(flagged);
  const voiceActiveRef    = useRef(voiceActive);
  const showSubmitDlgRef  = useRef(showSubmitDlg);
  const timeLeftRef       = useRef(timeLeft);
  const lastCmdRef        = useRef<{ cmd: string; time: number }>({ cmd: '', time: 0 });
  const isSpeakingAloudRef = useRef(false);
  const restartTimerRef   = useRef<any>(null);
  const startedRef        = useRef(started);

  const isMountedRef      = useRef(true);
  const isListeningRef    = useRef(false);

  currentRef.current       = current;
  examRef.current          = exam;
  answersRef.current       = answers;
  flaggedRef.current       = flagged;
  voiceActiveRef.current   = voiceActive;
  showSubmitDlgRef.current = showSubmitDlg;
  timeLeftRef.current      = timeLeft;
  isSpeakingAloudRef.current = isSpeakingAloud;
  startedRef.current       = started;

  const enableMicrophone = async () => {
    try {
      if (!globalVoiceService.isActive()) {
        await globalVoiceService.start();
      }
    } catch (err) {
      console.warn('[Microphone] enableMicrophone error:', err);
      return false;
    }
    return true;
  };

  const startExamNow = useCallback(async () => {
    if (startedRef.current) return;
    const now = Date.now();
    const baseMin = examRef.current?.durationMinutes ?? 10;
    const totalAlloc = Math.round(baseMin * 60 * timeMultiplier);

    startTime.current = now;
    examStartTimestampRef.current = now;
    totalAllocatedSecondsRef.current = totalAlloc;
    setTimeLeft(totalAlloc);
    timeLeftRef.current = totalAlloc;

    setStarted(true);
    startedRef.current = true;
    setVoiceActive(true);
    voiceActiveRef.current = true;

    // Persist active exam session for reload recovery
    if (examRef.current) {
      try {
        localStorage.setItem(`drishtix_active_exam_${examRef.current.id}`, JSON.stringify({
          examId: examRef.current.id,
          examTitle: examRef.current.title,
          examStartTimestamp: now,
          totalAllocatedSeconds: totalAlloc,
          currentQuestionIndex: 0,
          answers: {},
          flagged: {},
          questionTimes: {},
          lastUpdated: now,
        }));
      } catch {}
    }

    await enableMicrophone();
    audioCueService.examStart();
    const qCount = examRef.current?.questions.length ?? 10;
    speechService.speak(`Your ${qCount}-question mock test has started in Autonomous Scribe-Free Mode with ${timeMultiplier}x time allocation. Good luck!`, { priority: true });
  }, [timeMultiplier]);

  const verbalizeCurrentFormula = useCallback(() => {
    const ex = examRef.current;
    if (!ex) return;
    const cur = currentRef.current;
    const q = ex.questions[cur];
    if (q?.mathFormula) {
      const spoken = q.mathVerbalization || verbalizeMathExpression(q.mathFormula);
      speechService.speak(`Mathematical formula: ${spoken}`, { priority: true });
    } else {
      speechService.speak('No mathematical formula present in this question.');
    }
  }, []);

  const describeCurrentDiagram = useCallback(() => {
    const ex = examRef.current;
    if (!ex) return;
    const cur = currentRef.current;
    const q = ex.questions[cur];
    if (q?.diagramData) {
      const dataStr = q.diagramData.dataTable?.map(d => `${d.label}: ${d.value}`).join(', ') || '';
      speechService.speak(`Visual diagram description: ${q.diagramData.altDescription}. ${dataStr ? 'Data values: ' + dataStr : ''}`, { priority: true });
    } else {
      speechService.speak('No visual diagram present in this question.');
    }
  }, []);

  const explainCurrentQuestion = useCallback(() => {
    const ex = examRef.current;
    if (!ex) return;
    const cur = currentRef.current;
    const q = ex.questions[cur];
    setShowAiExplainer(true);
    speechService.speak(
      `Exam Integrity Notice: During an active examination, AI cannot provide solutions or hints. This is a ${q.difficulty} question from ${q.subject}, topic ${q.topic}. You can say read question, read options, explain formula, or describe diagram.`,
      { priority: true }
    );
  }, []);

  // Real-Exam Proctoring Safeguard: Window Focus / Tab-Switch Detection
  useEffect(() => {
    if (!started || submitted) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setProctorWarnings(w => {
          const next = w + 1;
          audioCueService.error();
          speechService.speak(
            `Proctoring Alert! Examination window focus lost. Warning ${next}. Please return to the examination screen immediately.`,
            { priority: true }
          );
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started, submitted]);

  useEffect(() => {
    const unsub = speechService.onStop(() => {
      setIsSpeakingAloud(false);
      isSpeakingAloudRef.current = false;
    });
    return unsub;
  }, []);

  const readPreExamOverview = useCallback(() => {
    const ex = examRef.current;
    if (!ex) return;
    speechService.speak(
      `${ex.title}. ${ex.totalQuestions} questions, duration ${Math.round(ex.durationMinutes * timeMultiplier)} minutes with ${timeMultiplier}x PwD time allocation. Say "Start the exam", press Enter to begin, or press C to calibrate accessibility.`,
      { priority: true }
    );
  }, [timeMultiplier]);

  // Step 16: Spoken Submit Status & Action Guidance
  const readSubmitStatus = useCallback(() => {
    const ex = examRef.current;
    if (!ex) return;
    const attemptedCount = Object.keys(answersRef.current).length;
    const totalCount = ex.questions.length;
    const unansweredCount = totalCount - attemptedCount;
    const flaggedCount = Object.values(flaggedRef.current).filter(Boolean).length;
    const m = Math.floor(timeLeftRef.current / 60);
    const s = timeLeftRef.current % 60;

    const msg = `Submit Examination confirmation dialog. You have answered ${attemptedCount} of ${totalCount} questions. ${unansweredCount} questions are unanswered, and ${flaggedCount} questions are marked for review. You have ${m} minutes and ${s} seconds remaining. To submit your exam, say Yes, or press Enter. To continue the exam, say Cancel, or press Escape.`;
    speechService.speak(msg, true);
  }, []);

  // Automatically speak out the summary and available actions when Submit Dialog opens
  useEffect(() => {
    if (showSubmitDlg) {
      readSubmitStatus();
    }
  }, [showSubmitDlg, readSubmitStatus]);

  // Cleanup recognition & timers on unmount + gesture unlock for hands-free start
  useEffect(() => {
    isMountedRef.current = true;
    const unlockGesture = async () => {
      await enableMicrophone();
      window.removeEventListener('click', unlockGesture);
      window.removeEventListener('keydown', unlockGesture);
    };
    window.addEventListener('click', unlockGesture, { once: true });
    window.addEventListener('keydown', unlockGesture, { once: true });

    return () => {
      isMountedRef.current = false;
      voiceActiveRef.current = false;
      isListeningRef.current = false;
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      try { recogRef.current?.abort(); } catch {}
      recogRef.current = null;
      window.removeEventListener('click', unlockGesture);
      window.removeEventListener('keydown', unlockGesture);
    };
  }, []);

  // Configure speech service
  useEffect(() => {
    speechService.configure(prefs.voiceRate, prefs.voicePitch, prefs.voiceName);
    speechService.setEnabled(prefs.voiceMode || prefs.audioFeedback);
  }, [prefs]);

  // Redirect if exam not found
  useEffect(() => {
    if (!exam) { navigate('/exams'); return; }
    document.title = `${exam.title} — DrishtiX`;
  }, [exam, navigate]);

  // Reload recovery on mount
  useEffect(() => {
    if (!exam || startedRef.current || submitted) return;
    const sessionKey = `drishtix_active_exam_${exam.id}`;
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return;

    try {
      const session = JSON.parse(raw);
      if (session.examId === exam.id && session.examStartTimestamp) {
        const elapsed = Math.floor((Date.now() - session.examStartTimestamp) / 1000);
        const allocated = session.totalAllocatedSeconds || (exam.durationMinutes * 60);
        const remaining = allocated - elapsed;

        if (remaining > 0) {
          console.log('[ExamInterface] Recovering active exam session from reload:', session);
          startTime.current = session.examStartTimestamp;
          examStartTimestampRef.current = session.examStartTimestamp;
          totalAllocatedSecondsRef.current = allocated;
          setTimeLeft(remaining);
          timeLeftRef.current = remaining;
          setAnswers(session.answers || {});
          answersRef.current = session.answers || {};
          setFlagged(session.flagged || {});
          flaggedRef.current = session.flagged || {};
          const savedCur = Math.min(Math.max(0, session.currentQuestionIndex || 0), exam.questions.length - 1);
          setCurrent(savedCur);
          currentRef.current = savedCur;
          if (session.questionTimes) {
            questionTimes.current = session.questionTimes;
          }
          setStarted(true);
          startedRef.current = true;
          setVoiceActive(true);
          voiceActiveRef.current = true;
          enableMicrophone();

          const m = Math.floor(remaining / 60);
          const resumeMsg = `Exam session recovered. Resuming at question ${savedCur + 1} of ${exam.questions.length}. You have ${m} minutes remaining.`;
          speechService.speak(resumeMsg, { priority: true });
          setScreenReaderAnnouncement(resumeMsg);
        } else {
          console.warn('[ExamInterface] Recovered exam session expired.');
          localStorage.removeItem(sessionKey);
        }
      }
    } catch (err) {
      console.warn('[ExamInterface] Error restoring active exam session:', err);
    }
  }, [exam, submitted]);

  // Persist ongoing exam state to recover from accidental reload or browser close
  useEffect(() => {
    if (!started || submitted || !exam) return;
    try {
      const sessionKey = `drishtix_active_exam_${exam.id}`;
      const savedRaw = localStorage.getItem(sessionKey);
      let baseObj: any = {};
      if (savedRaw) {
        try { baseObj = JSON.parse(savedRaw); } catch {}
      }
      const updated = {
        ...baseObj,
        examId: exam.id,
        examTitle: exam.title,
        examStartTimestamp: examStartTimestampRef.current,
        totalAllocatedSeconds: totalAllocatedSecondsRef.current,
        currentQuestionIndex: current,
        answers,
        flagged,
        questionTimes: questionTimes.current,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(sessionKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('[ExamInterface] Failed to persist active exam state:', e);
    }
  }, [started, submitted, exam, current, answers, flagged]);

  // BroadcastChannel for multi-tab coordination and concurrency integrity
  useEffect(() => {
    if (!exam || !started || submitted) return;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`drishtix_exam_tab_${exam.id}`);
      channel.postMessage({ type: 'TAB_ACTIVE', timestamp: Date.now() });

      channel.onmessage = (event) => {
        if (event.data?.type === 'TAB_ACTIVE') {
          console.warn('[ExamInterface] Detected concurrent tab for the same exam.');
          speechService.speak('Notice: This examination is open in another window.', { priority: false });
        }
      };
    } catch (e) {
      // BroadcastChannel fallback if not supported
    }

    return () => {
      channel?.close();
    };
  }, [exam, started, submitted]);

  // Auto-read exam instructions upon opening pre-exam screen
  useEffect(() => {
    if (started || !exam) return;
    const timer = setTimeout(() => {
      readPreExamOverview();
    }, 450);
    return () => clearTimeout(timer);
  }, [exam, started, readPreExamOverview]);

  // Pre-exam keyboard shortcut (Enter / Space starts exam)
  useEffect(() => {
    if (started) return;
    function onPreExamKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startExamNow();
      }
    }
    window.addEventListener('keydown', onPreExamKey);
    return () => window.removeEventListener('keydown', onPreExamKey);
  }, [started, startExamNow]);

  // Auto-read question when page changes
  useEffect(() => {
    if (!started || !exam) return;
    const q = exam.questions[current];
    if (!q) return;
    qStartTime.current = Date.now();
    setVoiceText('');

    const wasAuto = isAutoAdvancingRef.current;
    isAutoAdvancingRef.current = false;

    // Read question whenever autoAdvance is active, voiceMode is active, or autoReadQuestion is enabled
    const shouldRead = autoAdvance || prefs.autoReadQuestion || prefs.voiceMode || voiceActive;

    if (shouldRead) {
      const prefix = wasAuto ? 'Your next question is: ' : '';
      const optionText = q.options.map(o => `Option ${o.id}: ${o.text}`).join('. ');
      setIsSpeakingAloud(true);
      isSpeakingAloudRef.current = true;
      speechService.speak(
        `${prefix}Question ${current + 1} of ${exam.questions.length}. ${q.phoneticText ?? q.text}. ${optionText}`,
        {
          priority: true,
          onEnd: () => {
            setIsSpeakingAloud(false);
            isSpeakingAloudRef.current = false;
            audioCueService.select();
          }
        }
      );
    }
    audioCueService.navigation();
    questionRef.current?.focus();
  }, [current, started, exam, autoAdvance]);

  // Timer (Authoritative Wall-Clock Calculation)
  useEffect(() => {
    if (!started) return;
    audioCueService.examStart();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - examStartTimestampRef.current) / 1000);
      const remaining = Math.max(0, totalAllocatedSecondsRef.current - elapsed);
      setTimeLeft(remaining);
      timeLeftRef.current = remaining;

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        handleAutoSubmit();
        return;
      }
      if (prefs.timerWarnings && (remaining === 300 || remaining === 60)) {
        audioCueService.timerWarning();
        speechService.speak(remaining === 300 ? 'Five minutes remaining' : 'One minute remaining', true);
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, prefs.timerWarnings]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!started) return;
    function onKey(e: KeyboardEvent) {
      if (showSubmitDlg) {
        if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setShowSubmitDlg(false);
          speechService.speak('Resuming examination.');
          return;
        }
        if (e.key === 'Enter' || e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          submitExam();
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          readSubmitStatus();
          return;
        }
        return;
      }

      // ── Alt combos (highest priority, prevent defaults) ──────
      if (e.altKey) {
        switch (e.key) {
          case 'n': case 'N': e.preventDefault(); goNext(); return;
          case 'p': case 'P': e.preventDefault(); goPrev(); return;
          case 'r': case 'R': e.preventDefault(); readQuestion(); return;
          case 'f': case 'F': e.preventDefault(); toggleFlag(); return;
          case 's': case 'S': e.preventDefault(); setShowSubmitDlg(true); return;
          case 'v': case 'V': e.preventDefault(); toggleVoice(); return;
        }
      }

      // Don't intercept when user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      switch (e.key) {
        // Number keys & letter keys → select option
        case '1': selectOption('A'); break;
        case '2': selectOption('B'); break;
        case '3': selectOption('C'); break;
        case '4': selectOption('D'); break;
        // Arrow Up/Down navigate options A→B→C→D cyclically
        case 'ArrowDown': {
          e.preventDefault();
          if (!exam) break;
          const opts: ('A'|'B'|'C'|'D')[] = ['A','B','C','D'];
          const qid = exam.questions[current].id;
          const ci = opts.indexOf(answers[qid] ?? 'A');
          selectOption(opts[(ci + 1) % 4]);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (!exam) break;
          const opts2: ('A'|'B'|'C'|'D')[] = ['A','B','C','D'];
          const qid2 = exam.questions[current].id;
          const ci2 = opts2.indexOf(answers[qid2] ?? 'D');
          selectOption(opts2[(ci2 + 3) % 4]);
          break;
        }
        // Enter confirms current selection and advances
        case 'Enter':
          e.preventDefault();
          if (answers[exam?.questions[current].id ?? '']) goNext();
          break;
        // Navigation
        case 'ArrowRight': case 'n': case 'N': goNext(); break;
        case 'ArrowLeft':  case 'p': case 'P': goPrev(); break;
        // Actions
        case 't': case 'T': e.preventDefault(); readTimeLeft(); break;
        case 'f': case 'F': toggleFlag(); break;
        case 'r': case 'R': readQuestion(); break;
        case 'v': case 'V': toggleVoice(); break;
        case 's': case 'S': e.preventDefault(); setShowSubmitDlg(true); break;
        case 'm': case 'M': verbalizeCurrentFormula(); break;
        case 'd': case 'D': describeCurrentDiagram(); break;
        case 'e': case 'E': explainCurrentQuestion(); break;
        case '?': case '/': setShowShortcutsModal(true); break;
        case 'c': case 'C': setShowCalibrationWizard(true); break;
        case 'Escape':
          setShowPalette(false);
          setShowShortcutsModal(false);
          setShowCalibrationWizard(false);
          setShowAiExplainer(false);
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, current, showSubmitDlg, voiceActive, answers, flagged, exam, verbalizeCurrentFormula, describeCurrentDiagram, explainCurrentQuestion]);

  function selectOption(opt: 'A' | 'B' | 'C' | 'D') {
    const ex = examRef.current;
    if (!ex) return;
    const cur = currentRef.current;
    const q = ex.questions[cur];
    if (!q) return;

    // Reset previous auto advance timer if user quickly re-picks
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    // Synchronous state and ref update
    setAnswers(a => ({ ...a, [q.id]: opt }));
    answersRef.current = { ...answersRef.current, [q.id]: opt };
    audioCueService.select();
    setLastAction(`Selected Option ${opt}`);

    // Programmatically focus and simulate tap animation on button element immediately
    try {
      const optBtn = document.getElementById(`exam-opt-${opt}`) as HTMLButtonElement | null;
      if (optBtn) {
        optBtn.focus();
        optBtn.style.transform = 'scale(0.97)';
        setTimeout(() => { if (optBtn) optBtn.style.transform = ''; }, 180);
      }
    } catch {}

    if (autoAdvance) {
      const isLastQuestion = cur >= ex.questions.length - 1;
      if (isLastQuestion) {
        setAutoAdvanceMsg(`Option ${opt} selected • Last question completed!`);
        speechService.speak(`Option ${opt} selected. Last question completed. Opening submit confirmation.`, true);
        autoAdvanceTimerRef.current = setTimeout(() => {
          setShowSubmitDlg(true);
          setAutoAdvanceMsg('');
        }, 1500);
      } else {
        isAutoAdvancingRef.current = true;
        setAutoAdvanceMsg(`Option ${opt} selected • Moving to next question in 2 seconds…`);
        // Delay TTS to avoid aborting SpeechRecognition (Chrome synth.cancel bug)
        setTimeout(() => speechService.speak(`Option ${opt} selected.`, true), 600);
        autoAdvanceTimerRef.current = setTimeout(() => {
          recordQTime();
          setCurrent(c => c + 1);
          setAutoAdvanceMsg('');
        }, 2000);
      }
    } else {
      // Delay TTS confirmation so SpeechRecognition can cleanly process before synth.cancel fires
      setTimeout(() => speechService.speak(`Option ${opt} selected.`), 600);
    }
  }

  function goNext() {
    const ex = examRef.current;
    if (!ex) return;
    recordQTime();
    setCurrent(c => {
      if (c < ex.questions.length - 1) return c + 1;
      setShowSubmitDlg(true);
      return c;
    });
  }

  function goPrev() {
    recordQTime();
    setCurrent(c => (c > 0 ? c - 1 : 0));
  }

  function toggleFlag() {
    const ex = examRef.current;
    if (!ex) return;
    const cur = currentRef.current;
    const qid = ex.questions[cur].id;
    setFlagged(f => {
      const nextState = !f[qid];
      speechService.speak(nextState ? 'Flagged for review' : 'Unflagged');
      return { ...f, [qid]: nextState };
    });
    audioCueService.select();
  }

  const readTimeLeft = useCallback(() => {
    const m = Math.floor(timeLeftRef.current / 60);
    const s = timeLeftRef.current % 60;
    speechService.speak(`Time remaining: ${m} minutes and ${s} seconds.`, { priority: true });
  }, []);

  function readQuestion() {
    const ex = examRef.current;
    if (!ex) return;
    const cur = currentRef.current;
    const q = ex.questions[cur];
    if (!q) return;

    // Verbalize math formulas and units phonetically
    const qText = speechService.mathToPhonetic(q.phoneticText ?? q.text);
    const optionText = q.options.map(o => `Option ${o.id}: ${speechService.mathToPhonetic(o.text)}`).join('. ');
    const ans = answersRef.current[q.id];
    const isFlagged = flaggedRef.current[q.id];

    let extraHints = '';
    if (q.mathFormula) extraHints += ' Note: Mathematical formula present. Press M to hear formula breakdown.';
    if (q.diagramData) extraHints += ' Note: Visual diagram present. Press D to hear diagram description.';
    if (isFlagged) extraHints += ' This question is flagged for review.';

    setIsSpeakingAloud(true);
    isSpeakingAloudRef.current = true;
    setVoiceText('');
    speechService.speak(
      `Question ${cur + 1} of ${ex.questions.length}. ${qText}. ${optionText}.${ans ? ' Selected answer: Option ' + ans + '.' : ''}${extraHints}`,
      {
        priority: true,
        onEnd: () => {
          setIsSpeakingAloud(false);
          isSpeakingAloudRef.current = false;
          audioCueService.select();
        }
      }
    );
  }

  // Autonomous Question Audio-Reading & Focus Management on Question Transition
  useEffect(() => {
    if (!started || submitted) return;
    const ex = examRef.current;
    if (!ex) return;
    const q = ex.questions[current];
    if (!q) return;

    // Focus the question card for native screen readers
    try {
      questionRef.current?.focus();
    } catch {}

    const ans = answersRef.current[q.id];
    const isFlagged = flaggedRef.current[q.id];
    const liveText = `Question ${current + 1} of ${ex.questions.length}. ${q.text}. Options: ${q.options.map(o => `${o.id}: ${o.text}`).join(', ')}.${ans ? ' Answered Option ' + ans + '.' : ' Not yet answered.'}${isFlagged ? ' Flagged for review.' : ''}`;
    setScreenReaderAnnouncement(liveText);

    // If autoReadQuestion or autonomousMode is active, automatically read out the question!
    if (prefs.autoReadQuestion || autonomousMode) {
      try {
        audioCueService.navigation();
      } catch {}
      const timer = setTimeout(() => {
        readQuestion();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [current, started, submitted, prefs.autoReadQuestion, autonomousMode]);

  function recordQTime() {
    const ex = examRef.current;
    if (!ex) return;
    const cur = currentRef.current;
    const qid = ex.questions[cur]?.id;
    if (qid) {
      questionTimes.current[qid] = (questionTimes.current[qid] ?? 0) + Math.round((Date.now() - qStartTime.current) / 1000);
    }
    qStartTime.current = Date.now();
  }



  function handleVoiceCmd(cmd: string) {
    // When Submit Dialog is open, handle Yes / No / Cancel / Repeat
    if (showSubmitDlgRef.current) {
      if (cmd === 'CONFIRM_YES' || cmd === 'SUBMIT') {
        submitExam();
        return;
      }
      if (cmd === 'CANCEL_NO' || cmd === 'PREV') {
        setShowSubmitDlg(false);
        speechService.speak('Resuming examination.');
        return;
      }
      if (cmd === 'READ') {
        readSubmitStatus();
        return;
      }
    }

    if (cmd.startsWith('GOTO_')) {
      const n = parseInt(cmd.replace('GOTO_', ''), 10) - 1;
      const ex = examRef.current;
      if (ex && n >= 0 && n < ex.questions.length) {
        recordQTime();
        setCurrent(n);
        speechService.speak(`Question ${n + 1}`);
        audioCueService.navigation();
      }
      return;
    }
    switch (cmd) {
      case 'SELECT_A': selectOption('A'); break;
      case 'SELECT_B': selectOption('B'); break;
      case 'SELECT_C': selectOption('C'); break;
      case 'SELECT_D': selectOption('D'); break;
      case 'NEXT':     goNext(); break;
      case 'PREV':     goPrev(); break;
      case 'FLAG':     toggleFlag(); break;
      case 'READ':     readQuestion(); break;
      case 'SUBMIT':   setShowSubmitDlg(true); break;
      case 'CLEAR': {
        const ex = examRef.current;
        if (ex) {
          const cur = currentRef.current;
          setAnswers(a => { const n = { ...a }; delete n[ex.questions[cur].id]; return n; });
          audioCueService.select();
        }
        break;
      }
      case 'TIME': {
        const m = Math.floor(timeLeftRef.current / 60);
        const s = timeLeftRef.current % 60;
        speechService.speak(`You have ${m} minutes and ${s} seconds remaining.`, true);
        break;
      }
      case 'READ_OPTIONS': {
        const ex = examRef.current;
        if (ex) {
          const cur = currentRef.current;
          const q = ex.questions[cur];
          if (q) {
            const opts = q.options.map(o => `Option ${o.id}: ${o.text}`).join('. ');
            speechService.speak(`Options are: ${opts}`, true);
          }
        }
        break;
      }
      case 'MATH':      verbalizeCurrentFormula(); break;
      case 'DIAGRAM':   describeCurrentDiagram(); break;
      case 'EXPLAIN':   explainCurrentQuestion(); break;
      case 'SHORTCUTS': setShowShortcutsModal(true); break;
      case 'START_EXAM':
        if (!startedRef.current) {
          startExamNow();
        } else {
          speechService.speak('Exam is already in progress');
        }
        break;
      case 'STOP_VOICE': toggleVoice(); break;
    }

    // Record voice activity audit trail for autonomous proctoring transparency
    setVoiceAuditLog(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), action: cmd, command: cmd }
    ]);
  }

  async function toggleVoice() {
    if (globalVoiceService.isActive()) {
      globalVoiceService.stop();
      setVoiceActive(false);
      voiceActiveRef.current = false;
      isListeningRef.current = false;
      setMicVolume(0);
      setEngineState('idle');
      audioCueService.voiceStop();
      speechService.speak('Voice off');
      setVoiceText('');
    } else {
      await globalVoiceService.start();
      setVoiceActive(true);
      voiceActiveRef.current = true;
      isListeningRef.current = true;
      setEngineState('listening');
      audioCueService.voiceActivate();
      speechService.speak('Voice active');
    }
  }

  // Dynamic audio indicator (driven directly by SpeechRecognition events, zero hardware lock)
  useEffect(() => {
    if (!started || !voiceActive) {
      setMicVolume(0);
      return;
    }

    const interval = setInterval(() => {
      if (engineState === 'speech') {
        setMicVolume(Math.floor(55 + Math.random() * 35));
      } else if (engineState === 'listening') {
        setMicVolume(Math.floor(8 + Math.random() * 12));
      } else {
        setMicVolume(0);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [started, voiceActive, engineState]);

  // ── Shared transcript processor (used by both Whisper & Chrome Web Speech) ──
  const processTranscript = useCallback(async (clean: string): Promise<boolean> => {
    if (!clean) return false;
    console.log(`[ExamInterface Voice] 🗣️ Heard: "${clean}" (started=${startedRef.current})`);

    // 1. Universal Interruption: If exam question or audio is playing, halt speech immediately
    if (speechService.isSpeaking || isSpeakingAloudRef.current) {
      console.log('[ExamInterface Voice] 🛑 Reading interrupted by incoming command:', clean);
      speechService.stop();
      setIsSpeakingAloud(false);
      isSpeakingAloudRef.current = false;
    }

    // Explicit standalone stop / silence command
    if (/^(?:stop|chup|ruko|pause|quiet|shant|stop speaking|stop audio|stop reading)$/i.test(clean)) {
      audioCueService.select();
      setVoiceText('Reading stopped. Speak your answer now.');
      return true;
    }

    setVoiceText(clean);

    // 2. Pre-exam screen commands (Before candidate enters the exam)
    if (!startedRef.current) {
      const preIntent = await drishtiNluService.understand(clean, {
        examState: 'not-started',
        route: '/exam/',
      });

      console.log(`[ExamInterface Pre-Exam] Intent [${preIntent.source}]:`, preIntent.type, preIntent);

      // Explicit Start Command ONLY
      if (preIntent.type === 'START_EXAM' && !preIntent.isNegated) {
        console.log('[ExamInterface Voice] 🚀 Pre-exam START triggered from verified intent');
        startExamNow();
        return true;
      }

      // "Open mock test" or "go back" on pre-exam screen goes back to library without starting
      if (preIntent.type === 'OPEN_MOCK_TESTS' || preIntent.type === 'NAVIGATE_BACK') {
        speechService.speak('Mock test opened.');
        navigate('/exams');
        return true;
      }

      // Read instructions / overview
      if (
        preIntent.type === 'READ_QUESTION' ||
        clean.includes('instruction') ||
        clean.includes('overview') ||
        clean.includes('info')
      ) {
        readPreExamOverview();
        return true;
      }

      return false;
    }

    // 3. Submit confirmation dialog (Strict affirmative/negative safety)
    if (showSubmitDlgRef.current) {
      const dlgIntent = await drishtiNluService.understand(clean, {
        examState: 'submit-dialog',
        route: '/exam/',
        isModalOpen: true,
      });

      console.log(`[ExamInterface SubmitDialog] Intent [${dlgIntent.source}]:`, dlgIntent.type);

      if (dlgIntent.type === 'CONFIRM_SUBMIT') {
        submitExam();
        return true;
      }
      if (dlgIntent.type === 'CANCEL_SUBMIT') {
        setShowSubmitDlg(false);
        speechService.speak('Resuming examination.');
        return true;
      }
      if (dlgIntent.type === 'READ_QUESTION' || clean.includes('status') || clean.includes('sunao')) {
        readSubmitStatus();
        return true;
      }
      return false;
    }

    // 4. In-Exam Command Processing using Drishti Real-World AI NLU
    const ex = examRef.current;
    const cur = currentRef.current;
    const curQ = ex?.questions[cur];

    const intent = await drishtiNluService.understand(clean, {
      examState: 'in-progress',
      route: '/exam/',
      currentQuestionIndex: cur,
      totalQuestions: ex?.questions.length,
      currentAnswer: curQ ? answersRef.current[curQ.id] : undefined,
    });

    console.log(`[ExamInterface Voice] Intent [${intent.source}]: ${intent.type} (negated=${intent.isNegated}) from "${clean}"`);

    // Guard against unsupported sequential commands
    if (intent.type === 'SEQUENTIAL_UNSUPPORTED') {
      speechService.speak('Please give one command at a time.');
      return true;
    }

    // Guard against negated actions (e.g. "don't submit the exam", "don't select A")
    if (intent.isNegated) {
      speechService.speak('Understood, action cancelled.');
      return true;
    }

    // A. Next Question
    if (intent.type === 'NEXT_QUESTION') {
      goNext();
      return true;
    }

    // B. Previous Question
    if (intent.type === 'PREV_QUESTION') {
      goPrev();
      return true;
    }

    // C. Read or Repeat Question
    if (intent.type === 'READ_QUESTION' || intent.type === 'REPEAT_QUESTION') {
      readQuestion();
      return true;
    }

    // D. Option Selection or Answer Change (e.g. "Select option B", "Change my answer to C")
    if (intent.type === 'SELECT_OPTION' || intent.type === 'CHANGE_ANSWER') {
      if (intent.targetOption) {
        selectOption(intent.targetOption);
        return true;
      }
    }

    // E. Clear / Deselect Answer
    if (intent.type === 'CLEAR_ANSWER') {
      if (ex && curQ) {
        setAnswers(a => {
          const n = { ...a };
          delete n[curQ.id];
          return n;
        });
        answersRef.current = { ...answersRef.current };
        delete answersRef.current[curQ.id];
        audioCueService.select();
        speechService.speak(intent.speechFeedback || 'Answer cleared.');
        setLastAction('Cleared Answer');
      }
      return true;
    }

    // F. Flag Question
    if (intent.type === 'FLAG_QUESTION') {
      toggleFlag();
      return true;
    }

    // G. Submit Exam (Initiate Confirmation Modal)
    if (intent.type === 'INITIATE_SUBMIT') {
      setShowSubmitDlg(true);
      speechService.speak(
        'You are about to submit the examination. No further changes can be made. Say confirm submission to continue, or say cancel to return.',
        { priority: true }
      );
      return true;
    }

    // H. Time Remaining
    if (intent.type === 'TIME_REMAINING') {
      const m = Math.floor(timeLeftRef.current / 60);
      const s = timeLeftRef.current % 60;
      speechService.speak(`You have ${m} minutes and ${s} seconds remaining.`, { priority: true });
      return true;
    }

    // I. Read Options
    if (intent.type === 'READ_OPTIONS') {
      if (curQ) {
        const opts = curQ.options.map(o => `Option ${o.id}: ${o.text}`).join('. ');
        speechService.speak(`Options are: ${opts}`, { priority: true });
      }
      return true;
    }

    // J. Goto Question Number
    if (intent.type === 'GOTO_QUESTION' && intent.targetQuestionNumber !== undefined) {
      const n = intent.targetQuestionNumber - 1;
      if (ex && n >= 0 && n < ex.questions.length) {
        recordQTime();
        setCurrent(n);
        speechService.speak(`Question ${n + 1}.`);
        audioCueService.navigation();
      }
      return true;
    }

    // K. Assistive Verbalization
    if (intent.type === 'VERBALIZE_MATH') { verbalizeCurrentFormula(); return true; }
    if (intent.type === 'DESCRIBE_DIAGRAM') { describeCurrentDiagram(); return true; }
    if (intent.type === 'EXPLAIN_QUESTION') { explainCurrentQuestion(); return true; }
    if (intent.type === 'SHOW_SHORTCUTS') { setShowShortcutsModal(true); return true; }
    if (intent.type === 'STOP_VOICE') { toggleVoice(); return true; }

    // L. Verbatim Option Text Matching (Candidate spoke the text of an option)
    if (curQ) {
      for (const opt of curQ.options) {
        const optClean = opt.text.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
        if (optClean && (clean === optClean || clean.includes(optClean) || (optClean.length >= 4 && optClean.includes(clean)))) {
          selectOption(opt.id as 'A' | 'B' | 'C' | 'D');
          return true;
        }
      }
    }

    // M. Clarification for genuinely ambiguous inputs (e.g. "open it", "start it")
    if (intent.type === 'CLARIFY_AMBIGUOUS') {
      speechService.speak("I didn't understand. Please say that again.");
      return true;
    }

    return false;
  }, [
    goNext,
    goPrev,
    navigate,
    readPreExamOverview,
    readQuestion,
    readSubmitStatus,
    selectOption,
    startExamNow,
    submitExam,
    toggleFlag,
    toggleVoice,
    verbalizeCurrentFormula,
    describeCurrentDiagram,
    explainCurrentQuestion,
  ]);

  // ── Unified Global Voice Engine ─────────────────────────────────
  useEffect(() => {
    // Ensure global voice service is running
    if (!globalVoiceService.isActive()) {
      globalVoiceService.start();
    }

    const unsubTranscript = globalVoiceService.subscribeTranscript((t) => {
      setVoiceText(t);
    });

    const unsubStatus = globalVoiceService.subscribeStatus((status) => {
      if (status.toLowerCase().includes('listening') || status.toLowerCase().includes('ready')) {
        setEngineState('listening');
        setVoiceError('');
      } else if (status.toLowerCase().includes('mute')) {
        setEngineState('idle');
      } else {
        setEngineState('speech');
      }
    });

    const unsubSpeechStop = speechService.onStop(() => {
      setIsSpeakingAloud(false);
      isSpeakingAloudRef.current = false;
    });

    // Register our high-priority exam transcript handler
    const unregister = globalVoiceService.register(async (rawText: string) => {
      const clean = rawText.toLowerCase().trim();
      return await processTranscript(clean);
    });

    return () => {
      unregister();
      unsubTranscript();
      unsubStatus();
      unsubSpeechStop();
    };
  }, [processTranscript]);

  function handleAutoSubmit() { submitExam(); }

  function submitExam() {
    if (!exam || !user) return;
    clearInterval(timerRef.current!);
    recogRef.current?.stop();
    speechService.stop();
    setSubmitted(true);
    recordQTime();

    // Calculate results
    let correct = 0;
    const subjectMap: Record<string, { correct: number; total: number }> = {};
    exam.questions.forEach(q => {
      const subj = q.subject;
      if (!subjectMap[subj]) subjectMap[subj] = { correct: 0, total: 0 };
      subjectMap[subj].total++;
      if (answers[q.id] === q.correct) { correct++; subjectMap[subj].correct++; }
    });

    const attempted = Object.keys(answers).length;
    const percentage = Math.round((correct / exam.questions.length) * 100);
    const accuracy   = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const totalTime  = Math.round((Date.now() - startTime.current) / 1000);
    const avgTime    = attempted > 0 ? Math.round(totalTime / attempted) : 0;

    const subjectBreakdown: SubjectBreakdown[] = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      correct: data.correct,
      total: data.total,
      percentage: Math.round((data.correct / data.total) * 100),
      status: data.correct / data.total >= 0.7 ? 'strong' : data.correct / data.total >= 0.4 ? 'moderate' : 'weak',
    }));

    const weakTopics = exam.questions
      .filter(q => answers[q.id] !== q.correct)
      .map(q => q.topic)
      .filter((t, i, arr) => arr.indexOf(t) === i);

    const strongTopics = exam.questions
      .filter(q => answers[q.id] === q.correct)
      .map(q => q.topic)
      .filter((t, i, arr) => arr.indexOf(t) === i);

    const attempt: ExamAttempt = {
      id: `att-live-${Date.now()}`,
      examId: exam.id, examTitle: exam.title,
      studentId: user.id,
      startedAt: new Date(startTime.current).toISOString(),
      submittedAt: new Date().toISOString(),
      answers: exam.questions.map(q => ({
        questionId: q.id, chosen: answers[q.id] ?? null,
        timeSpentSeconds: questionTimes.current[q.id] ?? 0, flagged: flagged[q.id] ?? false,
      })),
      score: correct * 2, maxScore: exam.questions.length * 2,
      percentage, accuracy, avgTimePerQ: avgTime,
      subjectBreakdown, weakTopics, strongTopics,
    };

    // Remove active in-progress exam session
    try {
      localStorage.removeItem(`drishtix_active_exam_${exam.id}`);
    } catch {}

    // Store attempt
    const stored = JSON.parse(localStorage.getItem('sight-exam-attempts') ?? '[]');
    stored.unshift(attempt);
    localStorage.setItem('sight-exam-attempts', JSON.stringify(stored));

    // Also sync to backend API
    attemptsApi.create({
      id: attempt.id,
      examId: exam.id,
      examTitle: exam.title,
      score: correct * 2,
      maxScore: exam.questions.length * 2,
      percentage,
      timeSpentSeconds: Math.round((Date.now() - startTime.current) / 1000),
      status: 'Completed',
      flags: [],
      audioAlertsCount: voiceAuditLog.length,
    }).catch(err => console.warn('[ExamInterface] Backend attempt sync fallback:', err));

    audioCueService.examSubmit();
    speechService.speak(`Exam submitted. You scored ${percentage} percent. ${correct} correct out of ${exam.questions.length}.`, true);

    setTimeout(() => navigate(`/results/${attempt.id}`), 1200);
  }

  if (isFetchingExam) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader2 size={36} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 700 }}>Loading Examination Environment...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Synchronizing questions, audio phonetic cues, and compensatory timer.</p>
        </div>
      </div>
    );
  }

  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: '2.5rem 2rem' }}>
          <AlertTriangle size={42} color="#EF4444" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Examination Not Ready or Empty</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            The requested test contains no active questions yet. Please return to the Mock Tests library or ask your administrator.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/exams')}
            style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
          >
            Return to Mock Tests Library
          </button>
        </div>
      </div>
    );
  }

  // Start screen
  if (!started) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '2rem' }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '1rem', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <FileText size={32} strokeWidth={2} />
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)', marginBottom: '0.5rem' }}>{exam.title}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>{exam.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                [<HelpCircle size={22} color="var(--primary)" />, 'Questions', `${exam.totalQuestions}`],
                [<Clock size={22} color="var(--secondary)" />, 'Duration', `${exam.durationMinutes} min`],
                [<BarChart3 size={22} color="var(--warning)" />, 'Difficulty', exam.difficulty],
                [<Terminal size={22} color="var(--accent)" />, 'Controls', 'Keys 1-4, N, P, F, R, V'],
              ].map(([icon, label, val], idx) => (
                <div key={idx} style={{ background: 'var(--bg-surface)', borderRadius: '0.6rem', padding: '0.85rem', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>{icon}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.875rem' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--primary-light)', borderRadius: '0.6rem', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.8rem', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 700 }}>
                <Terminal size={16} /> Keyboard Shortcuts Reference
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem' }}>
                {[
                  ['1 / 2 / 3 / 4', 'Select A / B / C / D'],
                  ['↑ ↓ Arrow Keys', 'Cycle through options'],
                  ['Enter', 'Confirm & go to next'],
                  ['Alt + N', 'Next question'],
                  ['Alt + P', 'Previous question'],
                  ['Alt + R', 'Read question aloud'],
                  ['Alt + F', 'Flag for review'],
                  ['Alt + S', 'Submit exam'],
                  ['Alt + V', 'Toggle voice mode'],
                  ['V', 'Toggle voice (shorthand)'],
                  ['F', 'Flag (shorthand)'],
                  ['R', 'Read (shorthand)'],
                ].map(([key, action]) => (
                  <div key={key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.2rem 0' }}>
                    <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{key}</kbd>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.77rem' }}>{action}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', marginBottom: '0.4rem', fontWeight: 700 }}>
                  <Mic size={15} /> Voice Commands
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {['"Start the exam"', '"Select A"', '"Select B"', '"Select C"', '"Select D"', '"Next question"', '"Previous"', '"Read question"', '"How much time is left?"', '"Flag question"', '"Submit exam"'].map(cmd => (
                    <span key={cmd} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.15rem 0.6rem', fontSize: '0.72rem', color: 'var(--text)', fontStyle: 'italic' }}>{cmd}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Hands-free Voice Start Banner */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1.5px solid #10B981',
              borderRadius: '0.6rem',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              color: '#047857',
              fontSize: '0.85rem',
              fontWeight: 700
            }}>
              <span className="mic-pulse" style={{ display: 'inline-flex', padding: '0.3rem', borderRadius: '50%', background: '#10B981', color: '#fff' }}>
                <Mic size={15} />
              </span>
              <span>🎙️ Voice Active: Say <u>"Start the Exam"</u> or press <u>Enter</u> to begin hands-free!</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => navigate('/exams')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowLeft size={16} /> Cancel
              </button>
              <button
                className="btn-ghost"
                onClick={readPreExamOverview}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                aria-label="Read exam instructions aloud"
              >
                <Volume2 size={16} /> Read Info
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowCalibrationWizard(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                aria-label="Calibrate accessibility hardware and accommodations"
              >
                <ShieldCheck size={16} /> Calibrate Accessibility (C)
              </button>
              <button
                id="begin-exam-btn"
                className="btn-primary"
                onClick={startExamNow}
                style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                autoFocus
              >
                <Play size={16} /> Begin Exam
              </button>
            </div>
          </div>
        </div>
        {/* Pre-Exam Calibration Wizard Modal */}
        <PreExamCalibrationWizard
          isOpen={showCalibrationWizard}
          onClose={() => setShowCalibrationWizard(false)}
          onComplete={({ timeMultiplier: tm, autonomousMode: am }) => {
            setTimeMultiplier(tm);
            setAutonomousMode(am);
            setShowCalibrationWizard(false);
            setTimeLeft(Math.round(exam.durationMinutes * 60 * tm));
            startExamNow();
          }}
          examTitle={exam.title}
        />
      </div>
    );
  }

  const q = exam.questions[current];
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const timerColor = timeLeft <= 60 ? 'var(--danger)' : timeLeft <= 300 ? 'var(--warning)' : 'var(--accent)';
  const attempted = Object.keys(answers).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Screen Reader Only Accessible Live Announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {screenReaderAnnouncement || `Question ${current + 1} of ${exam.questions.length}. ${lastAction}`}
      </div>

      {/* Exam header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{exam.title}</span>
          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>Q {current + 1}/{exam.questions.length}</span>
          {autonomousMode && (
            <span className="badge badge-green" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={12} /> Autonomous Mode
            </span>
          )}
          {proctorWarnings > 0 && (
            <span className="badge badge-red" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              ⚠️ Proctor Warning ({proctorWarnings})
            </span>
          )}
          {flagged[q.id] && (
            <span className="badge badge-amber" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Flag size={12} fill="currentColor" /> Flagged
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Timer */}
          <div style={{ background: `${timerColor}20`, border: `2px solid ${timerColor}`, borderRadius: '0.5rem', padding: '0.35rem 0.75rem', fontFamily: 'monospace', fontWeight: 900, fontSize: '1.05rem', color: timerColor, display: 'flex', alignItems: 'center', gap: '0.35rem' }} aria-label={`Time remaining: ${mins} minutes and ${secs} seconds`} aria-live="off">
            <Clock size={15} /> {mins}:{secs}
          </div>
          {/* Keyboard shortcuts helper button */}
          <button
            className="btn-ghost"
            onClick={() => setShowShortcutsModal(true)}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            aria-label="Open Keyboard Shortcuts Guide (?)"
          >
            <Keyboard size={14} /> Keys (?)
          </button>
          {/* Voice toggle */}
          <button className={voiceActive ? 'btn-primary mic-pulse' : 'btn-secondary'} onClick={toggleVoice} aria-pressed={voiceActive} aria-label={voiceActive ? 'Voice commands active. Click to disable.' : 'Click to enable voice commands'} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {voiceActive ? <><Mic size={15} /> Listening</> : <><MicOff size={15} /> Voice Off</>}
          </button>
          {/* Auto Advance Toggle */}
          <button
            className={autoAdvance ? 'badge badge-green' : 'badge badge-blue'}
            onClick={() => {
              const next = !autoAdvance;
              setAutoAdvance(next);
              speechService.speak(next ? 'Auto advance turned on' : 'Auto advance turned off');
            }}
            aria-pressed={autoAdvance}
            aria-label={autoAdvance ? 'Auto-advance is ON. Selecting an option automatically moves to the next question. Click to toggle.' : 'Auto-advance is OFF. Click to toggle.'}
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', cursor: 'pointer', border: '1px solid currentColor', background: autoAdvance ? 'var(--accent-light)' : 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title="When ON, selecting an option automatically advances and reads the next question"
          >
            <Zap size={13} /> Auto-Next: {autoAdvance ? 'ON' : 'OFF'}
          </button>
          {/* Palette */}
          <button className="btn-ghost" onClick={() => setShowPalette(!showPalette)} aria-label="Toggle question palette" aria-expanded={showPalette} style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LayoutGrid size={15} /> {attempted}/{exam.questions.length}
          </button>
          <button className="btn-secondary" onClick={() => setShowSubmitDlg(true)} style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Send size={14} /> Submit
          </button>
        </div>
      </header>

      {/* Voice HUD */}
      {voiceActive && (
        <div style={{
          background: isSpeakingAloud ? 'rgba(245,158,11,0.08)' : 'rgba(37,99,235,0.08)',
          borderBottom: isSpeakingAloud ? '2px solid rgba(245,158,11,0.3)' : '2px solid rgba(37,99,235,.25)',
          padding: '0.65rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Real Audio Volume Wave Bars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '22px' }} title={`Live Mic Volume: ${micVolume}%`}>
            {[0.3, 0.6, 1.0, 0.7, 0.9, 0.5, 0.8, 0.4].map((scale, i) => {
              const h = Math.max(4, Math.round(scale * (Math.max(micVolume, engineState === 'speech' ? 65 : 0) / 100) * 22));
              return (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: `${h}px`,
                    background: micVolume > 10 || engineState === 'speech' ? '#10B981' : 'var(--primary)',
                    borderRadius: 2,
                    transition: 'height 0.08s ease'
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mic size={16} color={micVolume > 10 || engineState === 'speech' ? '#10B981' : 'var(--primary)'} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
              {isSpeakingAloud
                ? '🔊 Reading question...'
                : engineState === 'speech'
                ? 'Hearing sound...'
                : 'Listening for "Option A", "B", "Next", "Flag"'}
            </span>
          </div>

          {/* If reading question aloud, provide instant STOP button so user can speak */}
          {isSpeakingAloud && (
            <button
              onClick={() => { speechService.stop(); setIsSpeakingAloud(false); }}
              style={{
                background: '#F59E0B',
                color: '#fff',
                border: 'none',
                padding: '0.25rem 0.65rem',
                borderRadius: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              title="Stop reading aloud so you can answer immediately"
            >
              Stop Reading & Talk
            </button>
          )}

          {/* Real Mic Level indicator */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.45rem',
            padding: '0.2rem 0.55rem',
            fontSize: '0.74rem',
            color: micVolume > 5 ? '#059669' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <span>Mic Volume:</span>
            <strong style={{ color: micVolume > 5 ? '#10B981' : 'var(--text-muted)' }}>{micVolume}%</strong>
            {micVolume === 0 && (
              <span style={{ color: '#D97706', fontSize: '0.7rem' }}>(Silent • Check Windows mic)</span>
            )}
          </div>

          {/* Live Transcript */}
          {voiceText ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Heard:</span>
              <strong style={{ color: 'var(--primary)' }}>"{voiceText}"</strong>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isSpeakingAloud ? 'Wait for speech or click Stop to talk' : 'Speak "A", "B", "C", "D"'}
            </span>
          )}

          {/* Last Executed Action Badge */}
          {lastAction && (
            <span className="badge badge-green fade-in" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.65rem', border: '1px solid var(--accent)' }}>
              Action: {lastAction}
            </span>
          )}

          {voiceError && (
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, background: '#FEE2E2', padding: '0.2rem 0.5rem', borderRadius: '0.3rem' }}>
              ⚠️ {voiceError}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '1.5rem', gap: '1.5rem' }}>
        {/* Question area */}
        <main id="main-content" style={{ flex: 1, minWidth: 0 }}>
          <div className="card fade-in" ref={questionRef} tabIndex={-1} aria-live="polite" aria-label={`Question ${current + 1} of ${exam.questions.length}`}>
            {/* Auto Advance Transition Banner */}
            {autoAdvanceMsg && (
              <div className="fade-in" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                <Loader2 size={16} className="animate-spin" />
                <span>{autoAdvanceMsg}</span>
              </div>
            )}

            {/* Question meta */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{q.subject}</span>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{q.topic}</span>
              <span className={`badge badge-${q.difficulty === 'Easy' ? 'green' : q.difficulty === 'Medium' ? 'amber' : 'red'}`} style={{ fontSize: '0.7rem' }}>{q.difficulty}</span>
            </div>

            {/* Question number + text */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                QUESTION {current + 1} OF {exam.questions.length}
              </h2>
              <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{q.text}</p>
            </div>

            {/* Accessible Mathematical Formula Rendering & Verbalizer */}
            {q.mathFormula && (
              <AccessibleMathViewer
                formula={q.mathFormula}
                verbalization={q.mathVerbalization}
                title="Mathematical Question Expression"
              />
            )}

            {/* Accessible Graphical / Diagram Representation */}
            {q.diagramData && (
              <AccessibleDiagramViewer diagram={q.diagramData} />
            )}

            {/* Exam Integrity & Question Info Callout */}
            {showAiExplainer && (
              <div
                className="fade-in"
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1.5px solid var(--primary)',
                  borderRadius: '0.65rem',
                  padding: '0.85rem 1.1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '0.2rem' }}>
                      Exam Integrity Notice & Question Info:
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>
                      During an active examination, AI hints and answers are restricted to preserve testing integrity. Question Topic: <strong>{q.topic}</strong> ({q.difficulty} difficulty, {q.subject}). Step-by-step solutions are unlocked upon final submission.
                    </p>
                  </div>
                </div>
                <button
                  className="btn-ghost"
                  onClick={() => setShowAiExplainer(false)}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Accessible Quick Assist Action Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button
                onClick={explainCurrentQuestion}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                aria-label="View question info and exam integrity guidelines (E)"
              >
                <ShieldCheck size={13} color="var(--primary)" /> Question Info (E)
              </button>
              <button
                onClick={readQuestion}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                aria-label="Read question and options aloud (R)"
              >
                <Volume2 size={13} /> Read Aloud (R)
              </button>
              {q.mathFormula && (
                <button
                  onClick={verbalizeCurrentFormula}
                  className="btn-ghost"
                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', border: '1px solid var(--primary)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  aria-label="Verbalize mathematical formula phonetically (M)"
                >
                  <Calculator size={13} /> Verbalize Math (M)
                </button>
              )}
              {q.diagramData && (
                <button
                  onClick={describeCurrentDiagram}
                  className="btn-ghost"
                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', border: '1px solid var(--secondary)', color: 'var(--secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  aria-label="Describe visual diagram aloud (D)"
                >
                  <Eye size={13} /> Describe Diagram (D)
                </button>
              )}
            </div>

            {/* Voice Status Pill directly on the question card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.65rem',
              background: voiceActive ? (micVolume > 5 ? 'rgba(16,185,129,0.1)' : 'rgba(37,99,235,0.06)') : 'var(--bg-surface)',
              border: voiceActive ? (micVolume > 5 ? '1.5px solid rgba(16,185,129,0.4)' : '1.5px solid rgba(37,99,235,0.25)') : '1px dashed var(--border)',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: voiceActive ? (micVolume > 5 ? '#10B981' : '#3B82F6') : '#94A3B8',
                  display: 'inline-block'
                }} className={voiceActive ? 'mic-pulse' : ''} />
                <span style={{ fontWeight: 600, color: voiceActive ? (isSpeakingAloud ? '#D97706' : micVolume > 5 ? '#065F46' : 'var(--text)') : 'var(--text-muted)' }}>
                  {voiceActive
                    ? (isSpeakingAloud
                        ? '🔊 Reading question & options... (Please listen, then speak answer)'
                        : voiceText
                        ? `Heard: "${voiceText}"`
                        : `🎤 Ready for answer (${micVolume}% volume) • Speak "Option A", "B", "1", "2" or value`)
                    : 'Voice is currently OFF. Click button or press V to enable'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {answers[q.id] && (
                  <span className="badge badge-green fade-in" style={{ fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem' }}>
                    <CheckCircle2 size={13} /> Selected: Option {answers[q.id]}
                  </span>
                )}
                {isSpeakingAloud && (
                  <button
                    onClick={() => { speechService.stop(); setIsSpeakingAloud(false); }}
                    style={{
                      background: '#F59E0B',
                      color: '#fff',
                      border: 'none',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '0.45rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Stop Voice
                  </button>
                )}
                <button
                  onClick={toggleVoice}
                  style={{
                    background: voiceActive ? 'rgba(16,185,129,0.15)' : 'var(--primary)',
                    color: voiceActive ? '#059669' : '#fff',
                    border: 'none',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '0.45rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {voiceActive ? <><Mic size={13} /> Mic On (V)</> : <><MicOff size={13} /> Turn Mic ON (V)</>}
                </button>
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} role="radiogroup" aria-label="Answer options">
              {q.options.map(opt => {
                const isSelected = answers[q.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={`exam-opt-${opt.id}`}
                    data-option={opt.id}
                    type="button"
                    className={`exam-option${isSelected ? ' selected' : ''}`}
                    onClick={() => selectOption(opt.id as 'A' | 'B' | 'C' | 'D')}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Option ${opt.id}: ${opt.text}`}
                    style={{
                      transition: 'all 0.18s ease-in-out',
                      border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                      boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,0.25)' : 'none',
                    }}
                  >
                    <span
                      className="option-letter"
                      aria-hidden="true"
                      style={{
                        background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                        color: isSelected ? '#fff' : 'var(--text)',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)'
                      }}
                    >
                      {isSelected ? '✓' : opt.id}
                    </span>
                    <span style={{ fontSize: '0.98rem', color: 'var(--text)', lineHeight: 1.5, fontWeight: isSelected ? 700 : 500 }}>
                      {opt.text}
                    </span>
                    {isSelected && (
                      <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={13} /> Selected
                      </span>
                    )}
                    <kbd style={{ marginLeft: isSelected ? '0.5rem' : 'auto', fontSize: '0.7rem', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', fontFamily: 'monospace', flexShrink: 0 }}>
                      {opt.id === 'A' ? '1' : opt.id === 'B' ? '2' : opt.id === 'C' ? '3' : '4'}
                    </kbd>
                  </button>
                );
              })}
            </div>

            {/* Controls row */}
            <div style={{ marginTop: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-ghost" onClick={goPrev} disabled={current === 0} aria-label="Previous question" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ChevronLeft size={16} /> Prev
                </button>
                <button className="btn-ghost" onClick={toggleFlag} aria-label={flagged[q.id] ? 'Unflag question' : 'Flag for review'} aria-pressed={flagged[q.id]} style={{ fontSize: '0.875rem', color: flagged[q.id] ? 'var(--warning)' : undefined, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Flag size={15} fill={flagged[q.id] ? 'currentColor' : 'none'} />
                  {flagged[q.id] ? 'Flagged' : 'Flag'}
                </button>
                <button className="btn-ghost" onClick={readQuestion} aria-label="Read question aloud" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Volume2 size={15} /> Read
                </button>
              </div>
              <button className="btn-primary" onClick={goNext} aria-label={current === exam.questions.length - 1 ? 'Finish and submit' : 'Next question'} style={{ padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {current === exam.questions.length - 1 ? <><CheckCircle2 size={16} /> Finish</> : <>Next <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: '1rem' }}>
            <div className="progress-bar" aria-label={`Progress: ${attempted} of ${exam.questions.length} answered`}>
              <div className="progress-fill" style={{ width: `${(attempted / exam.questions.length) * 100}%` }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{attempted} answered · {Object.values(flagged).filter(Boolean).length} flagged · {exam.questions.length - attempted} remaining</p>
          </div>
        </main>

        {/* Question Palette (sidebar) */}
        {showPalette && (
          <aside style={{ width: 180, flexShrink: 0 }} aria-label="Question palette">
            <div className="card" style={{ padding: '1rem', position: 'sticky', top: '5rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>Question Palette</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                {exam.questions.map((question, i) => {
                  const isAnswered = !!answers[question.id];
                  const isFlagged  = !!flagged[question.id];
                  const isCurrent  = i === current;
                  return (
                    <button
                      key={question.id}
                      onClick={() => { recordQTime(); setCurrent(i); }}
                      aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ', not answered'}${isFlagged ? ', flagged' : ''}`}
                      aria-current={isCurrent ? 'true' : undefined}
                      style={{
                        width: '100%', aspectRatio: '1', borderRadius: '0.35rem', border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isCurrent ? 'var(--primary)' : isAnswered ? 'var(--accent-light)' : isFlagged ? 'var(--warning-light)' : 'var(--bg-surface)',
                        color: isCurrent ? '#fff' : isAnswered ? 'var(--accent)' : isFlagged ? 'var(--warning)' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                      }}
                    >
                      <span>{i + 1}</span>
                      {isFlagged && <Flag size={10} fill="currentColor" />}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-light)', display: 'inline-block' }} /> Answered</div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--warning-light)', display: 'inline-block' }} /> Flagged</div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'inline-block' }} /> Not visited</div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Submit dialog */}
      {showSubmitDlg && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="submit-dlg-title">
          <div className="modal-box" style={{ maxWidth: 460, border: '2px solid var(--primary)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 id="submit-dlg-title" style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)' }}>Submit Exam?</h2>
              <button
                className="btn-ghost"
                onClick={readSubmitStatus}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                aria-label="Read status and choices aloud (Press R)"
              >
                <Volume2 size={15} /> Read Aloud (R)
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Review your attempt before submitting. You can continue or confirm submission.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                [<CheckCircle2 size={24} color="var(--accent)" />, 'Answered', `${attempted}`, 'var(--accent)'],
                [<XCircle size={24} color="var(--danger)" />, 'Unanswered', `${exam.questions.length - attempted}`, 'var(--danger)'],
                [<Flag size={24} color="var(--warning)" fill="currentColor" />, 'Flagged', `${Object.values(flagged).filter(Boolean).length}`, 'var(--warning)'],
                [<Clock size={24} color={timerColor} />, 'Time Left', `${mins}:${secs}`, timerColor],
              ].map(([icon, label, val, color], idx) => (
                <div key={idx} style={{ textAlign: 'center', padding: '0.85rem', background: 'var(--bg-surface)', borderRadius: '0.6rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>{icon}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: String(color) }}>{val}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Voice & Keyboard guidance prompt */}
            <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: 'var(--primary)' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mic size={15} /> Voice & Keyboard Options:
              </div>
              <div style={{ lineHeight: 1.6 }}>• To Submit: Press <kbd style={{ fontWeight: 700 }}>Enter</kbd> or say <strong>"Yes" / "Submit"</strong></div>
              <div style={{ lineHeight: 1.6 }}>• To Continue: Press <kbd style={{ fontWeight: 700 }}>Esc</kbd> or say <strong>"Cancel" / "Continue"</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowSubmitDlg(false);
                  speechService.speak('Resuming examination.');
                }}
                style={{ padding: '0.75rem 1.25rem' }}
                aria-label="Continue Exam. Press Escape or say Cancel"
              >
                Continue Exam (Esc)
              </button>
              <button
                className="btn-primary"
                onClick={submitExam}
                autoFocus
                style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                aria-label="Confirm Submit. Press Enter or say Yes"
              >
                <CheckCircle2 size={16} /> Confirm Submit (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting overlay */}
      {submitted && (
        <div className="modal-overlay" role="status" aria-live="assertive">
          <div className="modal-box" style={{ textAlign: 'center', maxWidth: 320, border: '2px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--accent)' }}>
              <CheckCircle2 size={56} />
            </div>
            <h2 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>Exam Submitted!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Calculating your results…</p>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
