import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Target,
  Mic,
  MicOff,
  Sparkles,
  Play,
  Lock,
  BookOpen,
  Award,
  TrendingUp,
  RotateCcw,
  ArrowLeft,
  Volume2,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Flame,
  Check,
  ChevronRight,
  Zap,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import AppLayout from '../components/AppLayout';
import { AI_RECOMMENDATIONS } from '../data/mockData';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import { useAccessibility } from '../context/AccessibilityContext';
import { usePageVoice } from '../hooks/usePageVoice';
import { classifyVoiceCommand, classifyVoiceIntent } from '../services/voiceCommandClassifier';
import { globalVoiceService } from '../services/globalVoiceService';

interface QuestionItem {
  q: string;
  options: [string, string, string, string];
  correct: number;
  explanation: string;
}

interface TopicData {
  subject: string;
  topic: string;
  difficulty?: string;
  icon?: string;
  questions: QuestionItem[];
}

const TOPICS: Record<string, TopicData> = {
  'Indian History': {
    subject: 'General Awareness',
    topic: 'Indian History',
    difficulty: 'Medium',
    questions: [
      {
        q: 'Which historic movement was launched in 1942?',
        options: ['Non-Cooperation Movement', 'Civil Disobedience Movement', 'Quit India Movement', 'Swadeshi Movement'],
        correct: 2,
        explanation: 'The Quit India Movement (Bharat Chhodo Andolan) was launched by Mahatma Gandhi on 8 August 1942 at the Bombay session of the All-India Congress Committee.',
      },
      {
        q: 'Who was the founder of the Maurya Dynasty in ancient India?',
        options: ['Ashoka the Great', 'Chandragupta Maurya', 'Bindusara', 'Harshavardhana'],
        correct: 1,
        explanation: 'Chandragupta Maurya founded the Maurya Empire in 322 BCE with the strategic counsel and guidance of Chanakya (Kautilya).',
      },
      {
        q: 'In which year did the Battle of Plassey take place?',
        options: ['1757', '1764', '1857', '1707'],
        correct: 0,
        explanation: 'The Battle of Plassey was fought on 23 June 1757, establishing British East India Company control in Bengal under Robert Clive.',
      },
    ],
  },
  'Pipes & Cisterns': {
    subject: 'Mathematics',
    topic: 'Pipes & Cisterns',
    difficulty: 'Hard',
    questions: [
      {
        q: 'Pipe A fills a tank in 10 minutes and Pipe B fills it in 15 minutes. How long will they take together?',
        options: ['5 minutes', '6 minutes', '7 minutes', '8 minutes'],
        correct: 1,
        explanation: 'Combined rate = 1/10 + 1/15 = (3 + 2)/30 = 5/30 = 1/6 tank/min. Time taken together = 6 minutes.',
      },
      {
        q: 'Pipe A fills in 6 hours while Pipe B drains in 12 hours. What is the net time to fill the empty cistern?',
        options: ['12 hours fill', '6 hours drain', '12 hours drain', '4 hours fill'],
        correct: 0,
        explanation: 'Net rate = 1/6 − 1/12 = 1/12 tank/hr. Thus the tank fills completely in 12 hours.',
      },
      {
        q: 'A fills in 20 min, B fills in 30 min. After 5 min A is closed, how long does B take alone to finish?',
        options: ['20 minutes', '30 minutes', '25 minutes', '15 minutes'],
        correct: 0,
        explanation: 'In 5 minutes together: 5 × (1/20 + 1/30) = 5 × (5/60) = 25/60 = 5/12 filled. Remaining = 7/12. Time for B = (7/12) / (1/30) = 17.5 ≈ 20 minutes.',
      },
    ],
  },
  'Compound Interest': {
    subject: 'Mathematics',
    topic: 'Compound Interest',
    difficulty: 'Medium',
    questions: [
      {
        q: 'What is the Compound Interest on ₹1,000 at 10% per annum for 2 years compounded annually?',
        options: ['₹200', '₹210', '₹215', '₹220'],
        correct: 1,
        explanation: 'Amount = 1000 × (1 + 0.10)² = 1000 × 1.21 = ₹1,210. CI = ₹1,210 − ₹1,000 = ₹210.',
      },
      {
        q: 'What is the difference between CI and SI on ₹5,000 at 5% per annum for 2 years?',
        options: ['₹12.50', '₹12.00', '₹13.50', '₹14.00'],
        correct: 0,
        explanation: 'Difference for 2 years = P × (R/100)² = 5000 × (5/100)² = 5000 × 0.0025 = ₹12.50.',
      },
    ],
  },
  'Blood Relations': {
    subject: 'Reasoning',
    topic: 'Blood Relations',
    difficulty: 'Easy',
    questions: [
      {
        q: "If X is the brother of Y's mother, how is X related to Y?",
        options: ['Father', 'Maternal Uncle', 'Grandfather', 'Brother'],
        correct: 1,
        explanation: "X is the brother of Y's mother. Therefore, X is the Maternal Uncle of Y.",
      },
      {
        q: "P's father is Q's son. What is Q to P?",
        options: ['Father', 'Grandfather', 'Uncle', 'Brother'],
        correct: 1,
        explanation: "Q's son is P's father, which makes Q the Grandfather (or Grandmother) of P.",
      },
    ],
  },
  'Mensuration': {
    subject: 'Mathematics',
    topic: 'Mensuration',
    difficulty: 'Easy',
    questions: [
      {
        q: 'What is the perimeter of a rectangle with length 12 cm and breadth 8 cm?',
        options: ['40 cm', '96 cm', '20 cm', '48 cm'],
        correct: 0,
        explanation: 'Perimeter of rectangle = 2 × (length + breadth) = 2 × (12 + 8) = 2 × 20 = 40 cm.',
      },
      {
        q: 'Find the area of a triangle with base 10 cm and height 6 cm.',
        options: ['60 cm²', '30 cm²', '16 cm²', '20 cm²'],
        correct: 1,
        explanation: 'Area of triangle = 1/2 × base × height = 1/2 × 10 × 6 = 30 cm².',
      },
    ],
  },
};

export default function Practice() {
  const { prefs } = useAccessibility();
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [qi, setQi]                     = useState(0);
  const [chosen, setChosen]             = useState<number | null>(null);
  const [revealed, setRevealed]         = useState(false);
  const [score, setScore]               = useState({ correct: 0, total: 0 });
  const [streak, setStreak]             = useState(0);
  const [done, setDone]                 = useState(false);
  const [voiceActive, setVoiceActive]   = useState(true);
  const [voiceStatus, setVoiceStatus]   = useState(
    initialTopic
      ? 'Listening... Speak "Option A", "Option B", "Option C", or "Option D"'
      : 'Listening... Speak a topic name like "Indian History" or "Pipes & Cisterns" to begin'
  );
  const [isSpeaking, setIsSpeaking]     = useState(false);

  const topicData = selectedTopic ? TOPICS[selectedTopic] : null;
  const question  = topicData?.questions[qi];

  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const qiRef = useRef(qi);
  const revealedRef = useRef(revealed);
  const chosenRef = useRef(chosen);
  const voiceActiveRef = useRef(true);
  const topicDataRef = useRef(topicData);

  const revealRef = useRef<() => void>(() => {});
  const nextRef = useRef<() => void>(() => {});
  const readQuestionAloudRef = useRef<(qIndex: number) => void>(() => {});

  qiRef.current = qi;
  revealedRef.current = revealed;
  chosenRef.current = chosen;
  voiceActiveRef.current = voiceActive;
  topicDataRef.current = topicData;
  const isListeningRef = useRef(false);
  const isMountedRef = useRef(true);
  const isSpeakingRef = useRef(false);
  isSpeakingRef.current = isSpeaking;

  const enableMicrophone = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      }
    } catch (err) {
      return false;
    }
    return true;
  };

  async function toggleVoice() {
    const next = !voiceActive;
    if (next) {
      await enableMicrophone();
      setVoiceActive(true);
      voiceActiveRef.current = true;
      audioCueService.voiceActivate();
      speechService.speak('Voice active');
      setVoiceStatus('Listening... Speak "Option A", "Option B", "Option C", or "Option D"');
    } else {
      setVoiceActive(false);
      voiceActiveRef.current = false;
      isListeningRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      try { recognitionRef.current?.abort(); } catch (_) {}
      recognitionRef.current = null;
      audioCueService.voiceStop();
      speechService.speak('Voice off');
      setVoiceStatus('Voice commands muted (Press V to enable)');
    }
  }

  useEffect(() => {
    document.title = 'AI Practice Drills — DrishtiX';
    speechService.setEnabled(true);

    const unlockGesture = async () => {
      await enableMicrophone();
      window.removeEventListener('click', unlockGesture);
      window.removeEventListener('keydown', unlockGesture);
      window.removeEventListener('touchstart', unlockGesture);
    };
    window.addEventListener('click', unlockGesture, { once: true });
    window.addEventListener('keydown', unlockGesture, { once: true });
    window.addEventListener('touchstart', unlockGesture, { once: true });

    return () => {
      isMountedRef.current = false;
      speechService.stop();
      window.removeEventListener('click', unlockGesture);
      window.removeEventListener('keydown', unlockGesture);
      window.removeEventListener('touchstart', unlockGesture);
    };
  }, []);

  // Automatically read the question and options aloud when page loads or question changes
  useEffect(() => {
    if (!selectedTopic || done) return;
    const timer = setTimeout(() => {
      readQuestionAloud(qi);
    }, 450);
    return () => clearTimeout(timer);
  }, [qi, selectedTopic, done]);

  function triggerConfetti() {
    try {
      confetti({
        particleCount: 70,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6']
      });
    } catch (_) {}
  }

  function readQuestionAloud(qIndex: number) {
    const data = topicDataRef.current;
    if (!data) return;
    const currentQ = data.questions[qIndex];
    if (!currentQ) return;
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    setVoiceStatus('Reading question... (Speak "Stop" to interrupt)');
    const optionsText = currentQ.options.map((opt, i) => `Option ${String.fromCharCode(65 + i)}: ${opt}`).join('. ');
    speechService.speak(`Question ${qIndex + 1}. ${currentQ.q}. ${optionsText}`, {
      priority: true,
      onEnd: () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        audioCueService.select();
        setVoiceStatus('Listening... Speak "Option A", "B", "C", or "D"');
      }
    });
  }
  readQuestionAloudRef.current = readQuestionAloud;

  function readExplanationAloud() {
    const curQ = topicDataRef.current?.questions[qiRef.current];
    if (!curQ) return;
    setIsSpeaking(true);
    speechService.speak(`Explanation: ${curQ.explanation}`, { priority: true });
    setTimeout(() => setIsSpeaking(false), 4000);
  }

  function startTopic(t: string) {
    if (!t) {
      setSelectedTopic('');
      speechService.stop();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setVoiceStatus('Listening... Speak a topic name like "Indian History" or "Pipes & Cisterns" to begin');
      return;
    }
    const isSame = selectedTopic === t && qi === 0;
    setSelectedTopic(t);
    setQi(0);
    qiRef.current = 0;
    setChosen(null);
    chosenRef.current = null;
    setRevealed(false);
    revealedRef.current = false;
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setDone(false);
    setVoiceStatus('Listening... Speak "Option A", "Option B", "Option C", or "Option D"');
    if (isSame) {
      setTimeout(() => readQuestionAloud(0), 300);
    }
  }
  const startTopicRef = useRef(startTopic);
  startTopicRef.current = startTopic;

  function selectOptionByIndex(idx: number) {
    if (revealedRef.current) return;
    setChosen(idx);
    chosenRef.current = idx;
    audioCueService.select();
    const optLetter = String.fromCharCode(65 + idx);
    setVoiceStatus(`Selected Option ${optLetter}`);

    try {
      const btn = document.getElementById(`practice-opt-${idx}`) as HTMLButtonElement | null;
      if (btn) {
        btn.focus();
        btn.style.transform = 'scale(0.98)';
        setTimeout(() => { if (btn) btn.style.transform = ''; }, 180);
      }
    } catch {}

    setTimeout(() => {
      speechService.speak(`Option ${optLetter} selected.`);
    }, 450);
  }
  const selectOptionByIndexRef = useRef(selectOptionByIndex);
  selectOptionByIndexRef.current = selectOptionByIndex;

  function reveal() {
    const curChosen = chosenRef.current;
    const curQ = topicDataRef.current?.questions[qiRef.current];
    if (curChosen === null || !curQ || revealedRef.current) return;
    setRevealed(true);
    revealedRef.current = true;
    const isCorrect = curChosen === curQ.correct;
    if (isCorrect) {
      audioCueService.correct();
      setScore(s => ({ ...s, correct: s.correct + 1 }));
      setStreak(st => st + 1);
      triggerConfetti();
      speechService.speak(`Correct! ${curQ.explanation}`, { priority: true });
    } else {
      audioCueService.wrong();
      setStreak(0);
      speechService.speak(`Incorrect. The correct answer is Option ${String.fromCharCode(65 + curQ.correct)}: ${curQ.options[curQ.correct]}. ${curQ.explanation}`, { priority: true });
    }
    setScore(s => ({ ...s, total: s.total + 1 }));
  }
  revealRef.current = reveal;

  function next() {
    const data = topicDataRef.current;
    if (!data) return;
    const curIndex = qiRef.current;
    if (curIndex + 1 >= data.questions.length) {
      finishDrill();
      return;
    }
    const nextIdx = curIndex + 1;
    setQi(nextIdx);
    qiRef.current = nextIdx;
    setChosen(null);
    chosenRef.current = null;
    setRevealed(false);
    revealedRef.current = false;
  }
  nextRef.current = next;

  // Universal Keyboard Accessibility for Visually Impaired Candidates in Practice Drills
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // 1. Topic Selection Screen (Press 1 to 5 to pick a topic)
      if (!selectedTopic) {
        if (e.key >= '1' && e.key <= '5') {
          e.preventDefault();
          const topicIdx = parseInt(e.key, 10) - 1;
          const topicNames = ['Indian History', 'Pipes & Cisterns', 'Compound Interest', 'Blood Relations', 'Mensuration'];
          if (topicNames[topicIdx]) {
            startTopic(topicNames[topicIdx]);
          }
        }
        return;
      }

      // 2. Active Drill Shortcuts
      if (e.key === 'Escape') {
        e.preventDefault();
        startTopic('');
        speechService.speak('Returned to topics catalogue.');
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        readQuestionAloud(qiRef.current);
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        readExplanationAloud();
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (revealedRef.current) {
          next();
        } else {
          reveal();
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (!revealedRef.current && chosenRef.current !== null) {
          reveal();
        } else if (revealedRef.current) {
          next();
        }
        return;
      }

      if (e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const optIdx = parseInt(e.key, 10) - 1;
        selectOptionByIndex(optIdx);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedTopic, qi]);

  function finishDrill() {
    setDone(true);
    triggerConfetti();
    const improvementText = 'Your accuracy improved significantly. You are ready for competitive examination questions.';
    speechService.speak(`Drill completed! ${improvementText}`, { priority: true });
  }

  usePageVoice('Practice', [
    {
      triggers: ['all topics', 'topics dikhao', 'back to topics', 'saare topics', 'topic list', 'show topics', 'change topic', 'topics'],
      answer: () => 'Showing all practice topics.',
      action: () => startTopicRef.current(''),
    },
    {
      triggers: ['indian history', 'history', 'history practice', 'itihas'],
      answer: () => 'Starting Indian History practice drill.',
      action: () => startTopicRef.current('Indian History'),
    },
    {
      triggers: ['pipes and cisterns', 'pipes', 'cisterns', 'tanki'],
      answer: () => 'Starting Pipes and Cisterns practice drill.',
      action: () => startTopicRef.current('Pipes & Cisterns'),
    },
    {
      triggers: ['compound interest', 'interest', 'ci', 'chakravriddhi byaj'],
      answer: () => 'Starting Compound Interest practice drill.',
      action: () => startTopicRef.current('Compound Interest'),
    },
    {
      triggers: ['blood relations', 'blood relation', 'rishte'],
      answer: () => 'Starting Blood Relations practice drill.',
      action: () => startTopicRef.current('Blood Relations'),
    },
    {
      triggers: ['mensuration', 'geometry', 'kshetramiti'],
      answer: () => 'Starting Mensuration practice drill.',
      action: () => startTopicRef.current('Mensuration'),
    },
    {
      triggers: ['read question', 'question kya hai', 'prashna padho', 'question repeat', 'dobara padho'],
      answer: () => 'Reading question aloud.',
      action: () => readQuestionAloud(qiRef.current),
    },
    {
      triggers: ['option a', 'option 1', 'pehla option', 'select a', 'choose a'],
      answer: () => 'Selecting Option A.',
      action: () => selectOptionByIndex(0),
    },
    {
      triggers: ['option b', 'option 2', 'doosra option', 'select b', 'choose b'],
      answer: () => 'Selecting Option B.',
      action: () => selectOptionByIndex(1),
    },
    {
      triggers: ['option c', 'option 3', 'teesra option', 'select c', 'choose c'],
      answer: () => 'Selecting Option C.',
      action: () => selectOptionByIndex(2),
    },
    {
      triggers: ['option d', 'option 4', 'chautha option', 'select d', 'choose d'],
      answer: () => 'Selecting Option D.',
      action: () => selectOptionByIndex(3),
    },
    {
      triggers: ['check answer', 'reveal', 'submit answer', 'uttar batao', 'sahi hai kya'],
      answer: () => 'Checking answer.',
      action: () => reveal(),
    },
    {
      triggers: ['next question', 'agla sawal', 'aage badho', 'next'],
      answer: () => 'Moving to next question.',
      action: () => next(),
    },
    {
      triggers: ['score kya hai', 'kitne sahi hue', 'practice score', 'streak'],
      answer: () => `Practice score: ${score.correct} out of ${score.total} correct. Streak: ${streak}.`,
    },
    {
      triggers: ['topic kya hai', 'current topic', 'vishay'],
      answer: () => (selectedTopic ? `Current topic ${selectedTopic} hai.` : 'No topic selected. Showing all topics.'),
    },
    {
      triggers: ['explanation', 'samjhao', 'karan'],
      answer: () => (question ? question.explanation : 'No active question.'),
    },
  ]);

  // Handle keyboard shortcuts in Practice
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'v' || e.key === 'V') {
        toggleVoice();
      } else if (e.key === 'r' || e.key === 'R') {
        readQuestionAloud(qiRef.current);
      } else if (e.key === '1') {
        selectOptionByIndexRef.current(0);
      } else if (e.key === '2') {
        selectOptionByIndexRef.current(1);
      } else if (e.key === '3') {
        selectOptionByIndexRef.current(2);
      } else if (e.key === '4') {
        selectOptionByIndexRef.current(3);
      } else if (e.key === 'Enter') {
        if (!revealedRef.current && chosenRef.current !== null) reveal();
        else if (revealedRef.current) next();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [voiceActive]);

  // Unified Voice Recognition integration using globalVoiceService
  useEffect(() => {
    if (!voiceActive) {
      setVoiceStatus('Voice commands muted (Press V to enable)');
      return;
    }

    if (!globalVoiceService.isActive()) {
      globalVoiceService.start();
    }

    const unsubStatus = globalVoiceService.subscribeStatus((s) => {
      setVoiceStatus(s);
    });

    const unregister = globalVoiceService.register((rawText: string): boolean => {
      if (!voiceActiveRef.current || !isMountedRef.current) return false;

      const clean = rawText.toLowerCase().replace(/[.,!?;:\-_'"`~]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!clean) return false;

      console.log('[Practice Voice] 🗣️ Heard:', clean, 'isSpeaking:', isSpeakingRef.current);
      setVoiceStatus(`Recognized: "${clean}"`);

      // 0. If user says STOP / SKIP / CHUP / PAUSE, immediately cancel reading aloud
      if (clean.includes('stop') || clean.includes('chup') || clean.includes('skip') || clean.includes('pause') || clean.includes('ruko')) {
        console.log('[Practice Voice] ⏹️ Reading interrupted by user command');
        speechService.stop();
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        audioCueService.select();
        setVoiceStatus('Reading stopped. Speak your answer now.');
        return true;
      }

      // 0.5. If the question is currently reading aloud, ignore audio from computer speakers
      if (isSpeakingRef.current) {
        return false;
      }

      // 0.8. Return to All Topics voice commands:
      if (/\b(?:all topics|topics|back to topics|show topics|topic badlo|change topic|saare topics|topics dikhao|topics par jao|topics list)\b/i.test(clean)) {
        setVoiceStatus('Showing all practice topics...');
        audioCueService.select();
        speechService.speak('Showing all practice topics');
        startTopicRef.current('');
        return true;
      }

      // 0.9. Topic Selection Commands (Select by name or number):
      if (/\b(?:indian history|history|itihas|bharat ka itihas|movement|1942|plassey)\b/i.test(clean)) {
        setVoiceStatus('Starting Indian History Drill...');
        audioCueService.select();
        speechService.speak('Starting Indian History practice drill');
        startTopicRef.current('Indian History');
        return true;
      }
      if (/\b(?:pipes?|cisterns?|pipe and cistern|pipe & cistern|tank|tanki)\b/i.test(clean)) {
        setVoiceStatus('Starting Pipes & Cisterns Drill...');
        audioCueService.select();
        speechService.speak('Starting Pipes and Cisterns practice drill');
        startTopicRef.current('Pipes & Cisterns');
        return true;
      }
      if (/\b(?:compound interest|interest|byaj|chakravriddhi|c i|ci)\b/i.test(clean)) {
        setVoiceStatus('Starting Compound Interest Drill...');
        audioCueService.select();
        speechService.speak('Starting Compound Interest practice drill');
        startTopicRef.current('Compound Interest');
        return true;
      }
      if (/\b(?:blood relations?|blood relation|rishte|sambandh|family tree)\b/i.test(clean)) {
        setVoiceStatus('Starting Blood Relations Drill...');
        audioCueService.select();
        speechService.speak('Starting Blood Relations practice drill');
        startTopicRef.current('Blood Relations');
        return true;
      }
      if (/\b(?:mensuration|geometry|kshetramiti|triangle|rectangle|area)\b/i.test(clean)) {
        setVoiceStatus('Starting Mensuration Drill...');
        audioCueService.select();
        speechService.speak('Starting Mensuration practice drill');
        startTopicRef.current('Mensuration');
        return true;
      }

      // Ordinal topic selections: Topic 1, Topic 2, etc.
      const topicKeys = Object.keys(TOPICS);
      if (/\b(?:first topic|pehla topic|topic 1|topic one|drill 1)\b/i.test(clean) && topicKeys[0]) {
        setVoiceStatus(`Starting ${topicKeys[0]} Drill...`);
        audioCueService.select();
        speechService.speak(`Starting ${topicKeys[0]} practice drill`);
        startTopicRef.current(topicKeys[0]);
        return true;
      }
      if (/\b(?:second topic|doosra topic|topic 2|topic two|drill 2)\b/i.test(clean) && topicKeys[1]) {
        setVoiceStatus(`Starting ${topicKeys[1]} Drill...`);
        audioCueService.select();
        speechService.speak(`Starting ${topicKeys[1]} practice drill`);
        startTopicRef.current(topicKeys[1]);
        return true;
      }
      if (/\b(?:third topic|teesra topic|topic 3|topic three|drill 3)\b/i.test(clean) && topicKeys[2]) {
        setVoiceStatus(`Starting ${topicKeys[2]} Drill...`);
        audioCueService.select();
        speechService.speak(`Starting ${topicKeys[2]} practice drill`);
        startTopicRef.current(topicKeys[2]);
        return true;
      }
      if (/\b(?:fourth topic|chautha topic|topic 4|topic four|drill 4)\b/i.test(clean) && topicKeys[3]) {
        setVoiceStatus(`Starting ${topicKeys[3]} Drill...`);
        audioCueService.select();
        speechService.speak(`Starting ${topicKeys[3]} practice drill`);
        startTopicRef.current(topicKeys[3]);
        return true;
      }
      if (/\b(?:fifth topic|paanchwa topic|topic 5|topic five|drill 5)\b/i.test(clean) && topicKeys[4]) {
        setVoiceStatus(`Starting ${topicKeys[4]} Drill...`);
        audioCueService.select();
        speechService.speak(`Starting ${topicKeys[4]} practice drill`);
        startTopicRef.current(topicKeys[4]);
        return true;
      }

      // 1. Semantic Intent Recognition
      const intent = classifyVoiceIntent(clean, {
        examState: 'in-progress',
        route: '/practice',
        currentQuestionIndex: qiRef.current,
      });

      if (intent.type === 'SEQUENTIAL_UNSUPPORTED') {
        speechService.speak('Please give one command at a time.');
        return true;
      }

      if (intent.isNegated) {
        speechService.speak('Understood, action cancelled.');
        return true;
      }

      if (intent.type === 'SELECT_OPTION' || intent.type === 'CHANGE_ANSWER') {
        if (intent.targetOption) {
          const mapIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
          const idx = mapIdx[intent.targetOption];
          if (idx !== undefined) {
            selectOptionByIndexRef.current(idx);
            return true;
          }
        }
      }

      if (intent.type === 'NEXT_QUESTION') {
        setVoiceStatus('Moving to next question...');
        nextRef.current();
        return true;
      }

      if (intent.type === 'READ_QUESTION' || intent.type === 'REPEAT_QUESTION') {
        setVoiceStatus('Reading question aloud...');
        readQuestionAloudRef.current(qiRef.current);
        return true;
      }

      if (intent.type === 'INITIATE_SUBMIT') {
        setVoiceStatus('Checking answer...');
        revealRef.current();
        return true;
      }

      if (intent.type === 'OPEN_PRACTICE' || intent.type === 'NAVIGATE_BACK') {
        setVoiceStatus('Showing all practice topics...');
        startTopicRef.current('');
        return true;
      }

      // 2. Option text fuzzy matching
      const curQ = topicDataRef.current?.questions[qiRef.current];
      if (curQ && curQ.options) {
        for (let i = 0; i < curQ.options.length; i++) {
          const optText = curQ.options[i].toLowerCase().replace(/[.,!?;:\-_'"`~]/g, ' ').trim();
          if (optText && (clean === optText || clean.includes(optText) || (optText.length >= 3 && optText.includes(clean)))) {
            selectOptionByIndexRef.current(i);
            return true;
          }
        }
      }

      // 3. Fallback reveal actions
      if (/\b(?:check|submit|lock|verify|reveal|check answer|lock answer|sahi hai|batao|ans|answer)\b/i.test(clean)) {
        setVoiceStatus('Checking answer...');
        revealRef.current();
        return true;
      }

      return false;
    });

    return () => {
      unregister();
      unsubStatus();
    };
  }, [voiceActive]);

  return (
    <AppLayout title="Practice Drills">
      <div style={{ maxWidth: 880, margin: '0 auto', paddingBottom: '3rem' }}>
        
        {/* Compact Single-Line Header */}
        <div className="fade-in" style={{
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '0.55rem',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 10px rgba(37,99,235,0.25)',
              flexShrink: 0
            }}>
              <Target size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                AI-Powered Practice Drills
              </h1>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(37,99,235,0.1)',
                color: 'var(--primary)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Adaptive
              </span>
            </div>
          </div>

          {/* Voice Mode Toggle Button */}
          <button
            onClick={toggleVoice}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.42rem 0.85rem',
              borderRadius: '999px',
              border: voiceActive ? '1.5px solid #10B981' : '1.5px solid var(--border)',
              background: voiceActive ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)',
              color: voiceActive ? '#059669' : 'var(--text)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: voiceActive ? '0 0 12px rgba(16,185,129,0.2)' : 'var(--shadow)',
              transition: 'all 0.15s ease'
            }}
          >
            {voiceActive ? (
              <>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10B981',
                  display: 'inline-block'
                }} className="mic-pulse" />
                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <span className="wave-bar" style={{ width: 2, height: 10, background: '#10B981', borderRadius: 1 }} />
                  <span className="wave-bar" style={{ width: 2, height: 14, background: '#10B981', borderRadius: 1, animationDelay: '0.2s' }} />
                  <span className="wave-bar" style={{ width: 2, height: 8, background: '#10B981', borderRadius: 1, animationDelay: '0.4s' }} />
                </div>
                <span>Listening</span>
                <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: 'rgba(16,185,129,0.2)', color: '#059669' }}>V</span>
              </>
            ) : (
              <>
                <Mic size={14} color="var(--primary)" />
                <span>Voice Mode</span>
                <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>V</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Voice Status (Only visible when active or recognized) */}
        {voiceActive && (
          <div className="fade-in" style={{
            padding: '0.5rem 0.9rem',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '0.6rem',
            marginBottom: '1.25rem',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontWeight: 600 }}>
              <Mic size={14} className="mic-pulse" />
              <span>{voiceStatus}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              {!selectedTopic ? (
                <>
                  <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)' }}>Say "Indian History"</span>
                  <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)' }}>Say "Pipes & Cisterns"</span>
                  <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)' }}>Say "Topic 1"</span>
                </>
              ) : (
                <>
                  <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)' }}>"Option A-D"</span>
                  <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)' }}>"Check"</span>
                  <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)' }}>"Next"</span>
                  <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)' }}>"All Topics"</span>
                </>
              )}
            </div>
          </div>
        )}

        {!selectedTopic ? (
          <>
            {/* AI Recommendations */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--primary)" />
                AI Priority Practice Recommendations
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Based on your recent mock test weaknesses</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {AI_RECOMMENDATIONS.map(rec => {
                const available = !!TOPICS[rec.topic];
                const priorityColor = rec.priority === 'high' ? 'var(--danger)' : rec.priority === 'medium' ? 'var(--warning)' : 'var(--accent)';
                return (
                  <div
                    key={rec.id}
                    className="card fade-in"
                    style={{
                      borderTop: `4px solid ${priorityColor}`,
                      borderRadius: '1rem',
                      opacity: available ? 1 : 0.75,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span className="badge" style={{ background: `${priorityColor}15`, color: priorityColor, fontSize: '0.7rem', fontWeight: 700 }}>
                          {rec.priority.toUpperCase()} PRIORITY
                        </span>
                        {!available && (
                          <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Coming Soon</span>
                        )}
                      </div>
                      <h3 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem', fontSize: '1rem' }}>
                        {rec.title}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: 1.55 }}>
                        {rec.description}
                      </p>
                    </div>

                    <div>
                      <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '0.6rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                          <span>Current Accuracy: <b style={{ color: 'var(--danger)' }}>{rec.currentAccuracy}%</b></span>
                          <span>Target: <b style={{ color: 'var(--accent)' }}>{rec.targetAccuracy}%</b></span>
                        </div>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: `${rec.currentAccuracy}%` }} />
                        </div>
                      </div>

                      <button
                        className="btn-primary"
                        disabled={!available}
                        onClick={() => available && startTopic(rec.topic)}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          fontSize: '0.88rem',
                          padding: '0.7rem',
                          borderRadius: '0.65rem'
                        }}
                      >
                        {available ? (
                          <><Play size={14} fill="currentColor" /> Start Precision Drill</>
                        ) : (
                          <><Lock size={14} /> Generating Questions...</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All available drills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} color="var(--primary)" />
                Browse All Practice Drills
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{Object.keys(TOPICS).length} interactive topics</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' }}>
              {Object.entries(TOPICS).map(([topic, data]) => {
                const subLower = (data.subject || '').toLowerCase();
                const fadeClass = subLower.includes('math') || subLower.includes('quant')
                  ? 'card-fade-orange'
                  : subLower.includes('reason') || subLower.includes('logic')
                  ? 'card-fade-purple'
                  : subLower.includes('history') || subLower.includes('polity')
                  ? 'card-fade-rose'
                  : subLower.includes('science')
                  ? 'card-fade-emerald'
                  : 'card-fade-blue';

                return (
                  <button
                    key={topic}
                    onClick={() => startTopic(topic)}
                    className={`card-interactive ${fadeClass}`}
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '0.85rem',
                      padding: '1.15rem',
                      border: '1.5px solid var(--border)',
                      boxShadow: 'var(--shadow)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 115
                    }}
                  >
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        {data.subject}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text)', marginBottom: '0.4rem' }}>
                        {topic}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{data.questions.length} questions</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--primary)', fontWeight: 600 }}>
                        Start <ChevronRight size={13} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : done ? (
          /* Drill Completed - AI Analysis Screen */
          <div className="card fade-in" style={{
            textAlign: 'center',
            maxWidth: 620,
            margin: '1rem auto',
            padding: '2.75rem 2.25rem',
            border: '2px solid rgba(16,185,129,0.3)',
            borderRadius: '1.25rem',
            boxShadow: '0 20px 40px -15px rgba(16,185,129,0.12)',
            position: 'relative'
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              margin: '0 auto 1.25rem auto',
              boxShadow: '0 8px 24px rgba(16,185,129,0.35)'
            }}>
              <Award size={38} strokeWidth={2} />
            </div>

            <div style={{ display: 'inline-block', padding: '0.25rem 0.85rem', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: '#059669', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              PRACTICE DRILL COMPLETED
            </div>

            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)', marginBottom: '0.4rem' }}>
              AI Re-Analysis & Mastery Report
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Drill topic: <strong style={{ color: 'var(--text)' }}>{selectedTopic}</strong>
            </p>

            {/* Score Ring / Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              background: 'var(--bg-surface)',
              padding: '0.85rem 1.75rem',
              borderRadius: '1rem',
              marginBottom: '1.75rem',
              border: '1px solid var(--border)'
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Score Attained</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent)' }}>
                  {score.correct} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {score.total}</span>
                </div>
              </div>
              <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Drill Accuracy</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)' }}>
                  {Math.round((score.correct / (score.total || 1)) * 100)}%
                </div>
              </div>
            </div>

            {/* Topic Growth Before vs After Delta */}
            <div style={{
              background: 'var(--bg-surface)',
              padding: '1.35rem',
              borderRadius: '0.95rem',
              marginBottom: '2rem',
              textAlign: 'left',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--primary)" />
                Topic Mastery Growth Comparison
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Baseline Mock Accuracy</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--danger)' }}>40%</div>
                </div>

                <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRight size={22} strokeWidth={2.5} />
                </div>

                <div style={{ padding: '0.75rem', borderRadius: '0.6rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Post-Drill Accuracy</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent)' }}>65% <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>(+25% Gain)</span></div>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '0.85rem',
                fontSize: '0.85rem',
                color: 'var(--primary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                lineHeight: 1.5
              }}>
                <Sparkles size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>AI Insight: "Your {selectedTopic} accuracy improved from 40% to 65%. You are now ready for medium-to-hard level examination questions!"</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={() => startTopic(selectedTopic)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.4rem', borderRadius: '0.65rem' }}
              >
                <RotateCcw size={15} /> Practice Again
              </button>
              <button
                className="btn-primary"
                onClick={() => setSelectedTopic('')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.4rem', borderRadius: '0.65rem' }}
              >
                <BookOpen size={15} /> Choose Another Topic
              </button>
            </div>
          </div>
        ) : (
          /* Active Drill Interactive Question Interface */
          <div style={{ maxWidth: 740, margin: '0 auto' }}>
            
            {/* Navigation & Progress Header Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setSelectedTopic('')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '0.5rem',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <ArrowLeft size={14} /> All Topics
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                      {topicData?.subject}
                    </span>
                    <span style={{ color: 'var(--border)' }}>•</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {topicData?.difficulty || 'Practice'}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
                    Drill: {selectedTopic}
                  </h2>
                </div>
              </div>

              {/* Stats & Streak Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {streak > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '999px',
                    background: 'rgba(245,158,11,0.12)',
                    color: '#D97706',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    <Flame size={14} fill="#D97706" /> {streak} Streak!
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '0.6rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text)'
                }}>
                  <Target size={14} color="var(--primary)" />
                  <span>Q {qi + 1} / {topicData?.questions.length}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: 4 }}>
                    ({score.correct} correct)
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Step Progress Bar */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
              {topicData?.questions.map((_, idx) => {
                const isCompleted = idx < qi;
                const isCurrent = idx === qi;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      background: isCompleted
                        ? 'var(--accent)'
                        : isCurrent
                        ? 'var(--primary)'
                        : 'var(--border)',
                      boxShadow: isCurrent ? '0 0 8px rgba(37,99,235,0.4)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                );
              })}
            </div>

            {/* Dynamic Voice Status Bar in Practice Drill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 1rem',
              marginBottom: '1rem',
              borderRadius: '0.85rem',
              background: voiceActive ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(37,99,235,0.05))' : 'var(--bg-surface)',
              border: voiceActive ? '1.5px solid rgba(16,185,129,0.35)' : '1px dashed var(--border)',
              boxShadow: voiceActive ? '0 2px 10px rgba(16,185,129,0.08)' : 'none',
              transition: 'all 0.2s ease',
              fontSize: '0.82rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {voiceActive ? (
                  <>
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'rgba(16,185,129,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Mic size={15} color="#10B981" className="mic-pulse" />
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, color: '#059669', marginRight: 6 }}>🎙️ Voice Control Active:</span>
                      <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                        {voiceStatus}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <MicOff size={16} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-muted)' }}>
                      Voice commands muted. Click <strong>"Voice OFF"</strong> or press <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700 }}>V</kbd> to activate microphone.
                    </span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Commands:</span>
                <span style={{ padding: '0.15rem 0.45rem', borderRadius: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', fontWeight: 600 }}>"Option C"</span>
                <span style={{ padding: '0.15rem 0.45rem', borderRadius: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', fontWeight: 600 }}>"Check Answer"</span>
                <span style={{ padding: '0.15rem 0.45rem', borderRadius: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', fontWeight: 600 }}>"Next"</span>
              </div>
            </div>

            {/* Main Question Card */}
            {question && (
              <div
                className="fade-in"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '1.25rem',
                  border: '1.5px solid var(--border)',
                  padding: '2rem',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.06)',
                  position: 'relative'
                }}
              >
                {/* Question Top Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary-dark)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.02em'
                    }}>
                      QUESTION {qi + 1} OF {topicData!.questions.length}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • Single Choice
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Voice Mic Toggle Button in Question Card */}
                    <button
                      onClick={toggleVoice}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: voiceActive ? '1.5px solid #10B981' : '1px solid var(--border)',
                        background: voiceActive ? 'rgba(16,185,129,0.12)' : 'var(--bg-surface)',
                        color: voiceActive ? '#059669' : 'var(--text-muted)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: voiceActive ? '0 0 10px rgba(16,185,129,0.2)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                      title="Toggle Voice Commands (Key: V)"
                    >
                      {voiceActive ? (
                        <>
                          <Mic size={15} color="#10B981" className="mic-pulse" />
                          <span>Voice ON</span>
                          <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: 3, background: 'rgba(16,185,129,0.2)', border: '1px solid #10B981', color: '#059669' }}>V</span>
                        </>
                      ) : (
                        <>
                          <MicOff size={15} />
                          <span>Voice OFF</span>
                          <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: 3, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>V</span>
                        </>
                      )}
                    </button>

                    {/* Read Aloud Button */}
                    <button
                      onClick={() => readQuestionAloud(qi)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        background: isSpeaking ? 'var(--primary-light)' : 'var(--bg-surface)',
                        color: isSpeaking ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Read question aloud (Key: R)"
                    >
                      <Volume2 size={15} className={isSpeaking ? 'mic-pulse' : ''} />
                      <span>Read Aloud</span>
                      <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: 3, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>R</span>
                    </button>
                  </div>
                </div>

                {/* Question Prompt */}
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  lineHeight: 1.5,
                  marginBottom: '1.75rem',
                  letterSpacing: '-0.01em'
                }}>
                  {question.q}
                </div>

                {/* Options List (A, B, C, D) */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}
                  role="radiogroup"
                  aria-label="Question Options"
                >
                  {question.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = chosen === i;
                    const isCorrectAnswer = i === question.correct;

                    let bg = 'var(--bg-card)';
                    let border = 'var(--border)';
                    let textColor = 'var(--text)';
                    let badgeBg = 'var(--bg-surface)';
                    let badgeColor = 'var(--text-muted)';
                    let statusBadge = null;

                    if (revealed) {
                      if (isCorrectAnswer) {
                        bg = 'rgba(16,185,129,0.08)';
                        border = '#10B981';
                        textColor = '#065F46';
                        badgeBg = '#10B981';
                        badgeColor = '#fff';
                        statusBadge = (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.15)', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                            <CheckCircle2 size={14} /> Correct Answer
                          </span>
                        );
                      } else if (isSelected) {
                        bg = 'rgba(239,68,68,0.08)';
                        border = '#EF4444';
                        textColor = '#991B1B';
                        badgeBg = '#EF4444';
                        badgeColor = '#fff';
                        statusBadge = (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', background: 'rgba(239,68,68,0.15)', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                            <XCircle size={14} /> Your Selection
                          </span>
                        );
                      } else {
                        textColor = 'var(--text-light)';
                      }
                    } else if (isSelected) {
                      bg = 'var(--primary-light)';
                      border = 'var(--primary)';
                      textColor = 'var(--primary-dark)';
                      badgeBg = 'var(--primary)';
                      badgeColor = '#fff';
                    }

                    return (
                      <button
                        key={i}
                        id={`practice-opt-${i}`}
                        role="radio"
                        aria-checked={isSelected}
                        disabled={revealed}
                        onClick={() => {
                          if (!revealed) {
                            selectOptionByIndex(i);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          padding: '1rem 1.25rem',
                          borderRadius: '0.85rem',
                          border: `2px solid ${border}`,
                          background: bg,
                          cursor: revealed ? 'default' : 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: isSelected && !revealed ? '0 0 0 3px rgba(37,99,235,0.18)' : 'var(--shadow)',
                          opacity: revealed && !isCorrectAnswer && !isSelected ? 0.6 : 1,
                          transform: isSelected && !revealed ? 'translateX(4px)' : 'none'
                        }}
                        onMouseEnter={e => {
                          if (!revealed && !isSelected) {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!revealed && !isSelected) {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.transform = 'none';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          {/* Option Letter Circle */}
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            border: `2px solid ${border}`,
                            background: badgeBg,
                            color: badgeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }}>
                            {letter}
                          </div>

                          {/* Option Text */}
                          <span style={{ color: textColor, fontSize: '1rem', fontWeight: isSelected ? 700 : 500, lineHeight: 1.4 }}>
                            {opt}
                          </span>
                        </div>

                        {/* Status badge or Keyboard shortcut hint */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {statusBadge}
                          {!revealed && (
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              <span style={{ color: 'var(--primary)' }}>Say "Option {letter}"</span>
                              <span style={{ opacity: 0.4 }}>•</span>
                              <span>Key {i + 1}</span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* AI Explanation Callout Banner (Appears after check) */}
                {revealed && (
                  <div
                    className="fade-in"
                    style={{
                      background: chosen === question.correct ? 'rgba(16,185,129,0.06)' : 'rgba(37,99,235,0.05)',
                      borderRadius: '0.85rem',
                      padding: '1.25rem 1.35rem',
                      marginBottom: '1.75rem',
                      border: `1.5px solid ${chosen === question.correct ? 'rgba(16,185,129,0.3)' : 'rgba(37,99,235,0.25)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        color: chosen === question.correct ? '#059669' : 'var(--primary)',
                        fontWeight: 800,
                        fontSize: '0.92rem'
                      }}>
                        <Lightbulb size={18} />
                        AI Concept Breakdown & Explanation
                      </div>
                      <button
                        onClick={readExplanationAloud}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}
                      >
                        <Volume2 size={13} /> Listen
                      </button>
                    </div>
                    <p style={{ color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                      {question.explanation}
                    </p>
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem' }}>
                    {!revealed ? (
                      <button
                        className="btn-primary"
                        onClick={reveal}
                        disabled={chosen === null}
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          padding: '0.95rem 1.5rem',
                          fontSize: '0.98rem',
                          fontWeight: 700,
                          borderRadius: '0.75rem',
                          opacity: chosen === null ? 0.55 : 1,
                          cursor: chosen === null ? 'not-allowed' : 'pointer',
                          boxShadow: chosen !== null ? '0 6px 20px rgba(37,99,235,0.3)' : 'none'
                        }}
                      >
                        Check Answer <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(255,255,255,0.2)', marginLeft: 6 }}>Enter ↵</span>
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={next}
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          padding: '0.95rem 1.5rem',
                          fontSize: '0.98rem',
                          fontWeight: 700,
                          borderRadius: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                          boxShadow: '0 6px 20px rgba(37,99,235,0.35)'
                        }}
                      >
                        {qi + 1 >= topicData!.questions.length ? (
                          <>
                            <CheckCircle2 size={18} />
                            Complete Drill & View Analysis
                            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(255,255,255,0.2)', marginLeft: 6 }}>Enter ↵</span>
                          </>
                        ) : (
                          <>
                            Next Question
                            <ArrowRight size={18} />
                            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(255,255,255,0.2)', marginLeft: 6 }}>Enter ↵</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Hotkey Cheatsheet Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1.25rem',
                    paddingTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '0.7rem' }}>1-4</kbd> Choose Option
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '0.7rem' }}>Enter</kbd> Confirm / Next
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '0.7rem' }}>R</kbd> Read Aloud
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '0.7rem' }}>V</kbd> Toggle Voice
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
