import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  BookOpen,
  Target,
  Play,
  Volume2,
  Mic,
  MicOff,
  Search,
  HelpCircle,
  Sparkles,
  Calculator,
  Landmark,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import PreExamCalibrationWizard from '../components/PreExamCalibrationWizard';
import { speechService } from '../services/speechService';
import { usePageVoice } from '../hooks/usePageVoice';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { EXAMS } from '../data/mockData';
import { examsApi } from '../services/api';
import type { Exam } from '../types';

const INITIAL_CATEGORIES = ['All', 'SSC', 'Banking', 'UPSC', 'Railway'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

function ExamCard({ exam, onStart }: { exam: Exam; onStart: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const catThemes: Record<
    string,
    {
      cardBg: string;
      cardBorder: string;
      glowGradient: string;
      ribbonGradient: string;
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      iconBgGradient: string;
      iconColor: string;
      iconBorder: string;
      iconShadow: string;
      metaBg: string;
      metaBorder: string;
      btnGradient: string;
      btnShadow: string;
      btnShadowHover: string;
      accentColor: string;
      icon: React.ComponentType<{ size?: number; color?: string }>;
    }
  > = {
    SSC: {
      cardBg: 'linear-gradient(155deg, #ffffff 0%, #f4f8ff 45%, #e1effe 100%)',
      cardBorder: 'rgba(59, 130, 246, 0.32)',
      glowGradient: 'radial-gradient(circle at 95% 5%, rgba(37, 99, 235, 0.14) 0%, transparent 60%)',
      ribbonGradient: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)',
      badgeBg: 'rgba(37, 99, 235, 0.09)',
      badgeText: '#1D4ED8',
      badgeBorder: 'rgba(37, 99, 235, 0.28)',
      iconBgGradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      iconColor: '#2563EB',
      iconBorder: 'rgba(37, 99, 235, 0.25)',
      iconShadow: '0 4px 14px rgba(37, 99, 235, 0.16)',
      metaBg: 'rgba(255, 255, 255, 0.78)',
      metaBorder: 'rgba(37, 99, 235, 0.16)',
      btnGradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      btnShadow: '0 6px 18px -2px rgba(37, 99, 235, 0.45)',
      btnShadowHover: '0 10px 26px -2px rgba(37, 99, 235, 0.55)',
      accentColor: '#2563EB',
      icon: FileText,
    },
    Banking: {
      cardBg: 'linear-gradient(155deg, #ffffff 0%, #fff9f3 45%, #ffedd5 100%)',
      cardBorder: 'rgba(249, 115, 22, 0.32)',
      glowGradient: 'radial-gradient(circle at 95% 5%, rgba(234, 88, 12, 0.14) 0%, transparent 60%)',
      ribbonGradient: 'linear-gradient(90deg, #EA580C 0%, #F97316 50%, #FB923C 100%)',
      badgeBg: 'rgba(234, 88, 12, 0.09)',
      badgeText: '#C2410C',
      badgeBorder: 'rgba(234, 88, 12, 0.28)',
      iconBgGradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
      iconColor: '#EA580C',
      iconBorder: 'rgba(234, 88, 12, 0.25)',
      iconShadow: '0 4px 14px rgba(234, 88, 12, 0.16)',
      metaBg: 'rgba(255, 255, 255, 0.78)',
      metaBorder: 'rgba(234, 88, 12, 0.16)',
      btnGradient: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
      btnShadow: '0 6px 18px -2px rgba(234, 88, 12, 0.45)',
      btnShadowHover: '0 10px 26px -2px rgba(234, 88, 12, 0.55)',
      accentColor: '#EA580C',
      icon: Calculator,
    },
    UPSC: {
      cardBg: 'linear-gradient(155deg, #ffffff 0%, #fefdf2 45%, #fef3c7 100%)',
      cardBorder: 'rgba(217, 119, 6, 0.32)',
      glowGradient: 'radial-gradient(circle at 95% 5%, rgba(217, 119, 6, 0.14) 0%, transparent 60%)',
      ribbonGradient: 'linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)',
      badgeBg: 'rgba(217, 119, 6, 0.09)',
      badgeText: '#B45309',
      badgeBorder: 'rgba(217, 119, 6, 0.28)',
      iconBgGradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      iconColor: '#B45309',
      iconBorder: 'rgba(217, 119, 6, 0.25)',
      iconShadow: '0 4px 14px rgba(217, 119, 6, 0.16)',
      metaBg: 'rgba(255, 255, 255, 0.78)',
      metaBorder: 'rgba(217, 119, 6, 0.16)',
      btnGradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
      btnShadow: '0 6px 18px -2px rgba(217, 119, 6, 0.45)',
      btnShadowHover: '0 10px 26px -2px rgba(217, 119, 6, 0.55)',
      accentColor: '#D97706',
      icon: Landmark,
    },
    Railway: {
      cardBg: 'linear-gradient(155deg, #ffffff 0%, #f2fdf6 45%, #d1fae5 100%)',
      cardBorder: 'rgba(16, 185, 129, 0.32)',
      glowGradient: 'radial-gradient(circle at 95% 5%, rgba(5, 150, 105, 0.14) 0%, transparent 60%)',
      ribbonGradient: 'linear-gradient(90deg, #059669 0%, #10B981 50%, #34D399 100%)',
      badgeBg: 'rgba(5, 150, 105, 0.09)',
      badgeText: '#047857',
      badgeBorder: 'rgba(5, 150, 105, 0.28)',
      iconBgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      iconColor: '#059669',
      iconBorder: 'rgba(5, 150, 105, 0.25)',
      iconShadow: '0 4px 14px rgba(5, 150, 105, 0.16)',
      metaBg: 'rgba(255, 255, 255, 0.78)',
      metaBorder: 'rgba(5, 150, 105, 0.16)',
      btnGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      btnShadow: '0 6px 18px -2px rgba(5, 150, 105, 0.45)',
      btnShadowHover: '0 10px 26px -2px rgba(5, 150, 105, 0.55)',
      accentColor: '#059669',
      icon: BookOpen,
    },
  };

  const theme = catThemes[exam.category] || catThemes['SSC'];
  const CategoryIcon = theme.icon;

  const diffColor =
    exam.difficulty === 'Easy'
      ? {
          bg: 'rgba(16, 185, 129, 0.08)',
          text: '#047857',
          border: 'rgba(16, 185, 129, 0.3)',
          dot: '#10B981',
        }
      : exam.difficulty === 'Medium'
      ? {
          bg: 'rgba(245, 158, 11, 0.08)',
          text: '#B45309',
          border: 'rgba(245, 158, 11, 0.3)',
          dot: '#F59E0B',
        }
      : {
          bg: 'rgba(239, 68, 68, 0.08)',
          text: '#B91C1C',
          border: 'rgba(239, 68, 68, 0.3)',
          dot: '#EF4444',
        };

  const handleListenOverview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    speechService.speak(
      `Mock test: ${exam.title}. Category: ${exam.category}. Difficulty level: ${exam.difficulty}. Consists of ${exam.totalQuestions} questions with duration ${exam.durationMinutes} minutes. Covering ${exam.subjects.join(', ')}. Press Start Mock Examination button to begin.`
    );
    setTimeout(() => setIsPlayingAudio(false), 3500);
  };

  return (
    <article
      className="card fade-in exam-card-premium"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1.2rem',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        background: `${theme.glowGradient}, ${theme.cardBg}`,
        borderRadius: '1rem',
        border: `1.5px solid ${isHovered ? theme.accentColor : theme.cardBorder}`,
        boxShadow: isHovered
          ? `${theme.btnShadowHover}, 0 2px 8px rgba(0, 0, 0, 0.04)`
          : '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.02)',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Category accent top ribbon */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: theme.ribbonGradient,
        }}
        aria-hidden="true"
      />

      <div>
        {/* Top Badges & Floating Category Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span
              style={{
                background: theme.badgeBg,
                color: theme.badgeText,
                border: `1px solid ${theme.badgeBorder}`,
                fontWeight: 800,
                fontSize: '0.74rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                lineHeight: 1.2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                letterSpacing: '0.015em',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: theme.accentColor,
                  boxShadow: `0 0 6px ${theme.accentColor}`,
                }}
                aria-hidden="true"
              />
              {exam.category}
            </span>
            <span
              style={{
                background: diffColor.bg,
                color: diffColor.text,
                border: `1px solid ${diffColor.border}`,
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: diffColor.dot,
                }}
                aria-hidden="true"
              />
              {exam.difficulty}
            </span>
          </div>

          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '0.75rem',
              background: theme.iconBgGradient,
              border: `1.5px solid ${theme.iconBorder}`,
              boxShadow: theme.iconShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'transform 0.2s ease',
              transform: isHovered ? 'scale(1.08) rotate(3deg)' : 'scale(1)',
            }}
          >
            <CategoryIcon size={20} color={theme.iconColor} />
          </div>
        </div>

        {/* Title & Description */}
        <h3
          style={{
            fontWeight: 800,
            fontSize: '1.15rem',
            color: 'var(--text)',
            marginBottom: '0.45rem',
            lineHeight: 1.36,
            letterSpacing: '-0.02em',
            transition: 'color 0.15s ease',
          }}
        >
          {exam.title}
        </h3>
        <p
          style={{
            fontSize: '0.84rem',
            color: 'var(--text-muted)',
            lineHeight: 1.62,
            marginBottom: '1.15rem',
            minHeight: '4.1rem',
          }}
        >
          {exam.description}
        </p>

        {/* Metadata Frosted Shelf */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.6rem',
            fontSize: '0.8rem',
            background: theme.metaBg,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '0.85rem',
            borderRadius: '0.75rem',
            border: `1px solid ${theme.metaBorder}`,
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HelpCircle size={15} color="#2563EB" aria-hidden="true" />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
              <strong style={{ fontWeight: 800 }}>{exam.totalQuestions}</strong> Questions
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={15} color="#059669" aria-hidden="true" />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
              <strong style={{ fontWeight: 800 }}>{exam.durationMinutes}</strong> Minutes
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-muted)',
              gridColumn: '1 / -1',
              paddingTop: '0.4rem',
              borderTop: '1px dashed rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={15} color="#7C3AED" aria-hidden="true" />
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {exam.subjects.join(' • ')}
            </span>
          </div>
        </div>
      </div>

      {/* Button Row */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
        <button
          onClick={onStart}
          className="exam-start-btn"
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: '0.8rem 1.1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            fontWeight: 800,
            fontSize: '0.9rem',
            background: theme.btnGradient,
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            boxShadow: `${theme.btnShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.35)`,
            letterSpacing: '0.015em',
            position: 'relative',
            overflow: 'hidden',
          }}
          aria-label={`Start mock examination: ${exam.title}`}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Play size={11} fill="#ffffff" color="#ffffff" style={{ marginLeft: 1 }} />
          </span>
          <span>Start Mock Examination</span>
          <ArrowRight
            size={16}
            style={{
              opacity: 0.9,
              marginLeft: 2,
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        <button
          type="button"
          onClick={handleListenOverview}
          title="Listen to examination specifications aloud"
          aria-label={`Listen to overview of ${exam.title}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: '0.75rem',
            background: 'rgba(255, 255, 255, 0.85)',
            border: `1.5px solid ${theme.cardBorder}`,
            color: isPlayingAudio ? '#16A34A' : theme.accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
        >
          <Volume2 size={18} className={isPlayingAudio ? 'animate-bounce' : ''} />
        </button>
      </div>
    </article>
  );
}

export default function ExamSelection() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('All');
  const [diff, setDiff] = useState('All');
  const [search, setSearch] = useState('');
  const [examsList, setExamsList] = useState<Exam[]>(EXAMS);
  const { active: voiceActive, toggleVoice, status: voiceStatus } = useVoiceAssistant();
  const isStartingRef = useRef(false);
  const [showCalibrationWizard, setShowCalibrationWizard] = useState(false);
  const [selectedExamForCalibration, setSelectedExamForCalibration] = useState<Exam | null>(null);

  useEffect(() => {
    const fetchExams = () => {
      examsApi.getAll().then(res => {
        if (res && res.length) setExamsList(res);
      }).catch(() => setExamsList(EXAMS));
    };
    fetchExams();
    window.addEventListener('sight_exams_updated', fetchExams);
    window.addEventListener('storage', fetchExams);
    return () => {
      window.removeEventListener('sight_exams_updated', fetchExams);
      window.removeEventListener('storage', fetchExams);
    };
  }, []);

  const availableCategories = useMemo(() => {
    const set = new Set(INITIAL_CATEGORIES);
    examsList.forEach(e => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [examsList]);

  const announcement =
    'Mock Test Library. Available examinations are: SSC General Awareness, Banking Quantitative Aptitude, Railway General Knowledge, UPSC General Studies. Say Open SSC, or click to start. Press C to calibrate accessibility.';

  useEffect(() => {
    document.title = 'Choose Mock Test — DrishtiX';

    const timer = setTimeout(() => {
      speechService.speak(announcement, { priority: true });
    }, 400);

    return () => {
      clearTimeout(timer);
      speechService.stop();
    };
  }, []);

  // Voice recognition keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'v' || e.key === 'V') {
        toggleVoice();
      } else if (e.key === 'r' || e.key === 'R') {
        speechService.speak(announcement, { priority: true });
      } else if (e.key === 'c' || e.key === 'C') {
        setSelectedExamForCalibration(examsList[0] || EXAMS[0]);
        setShowCalibrationWizard(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [announcement, voiceActive, toggleVoice, examsList]);

  const startExamWithAnnouncement = (exam: Exam) => {
    // Check if candidate has completed accessibility calibration
    const hasCalibrated = localStorage.getItem('sight_exam_calibrated') === 'true';
    if (!hasCalibrated) {
      setSelectedExamForCalibration(exam);
      setShowCalibrationWizard(true);
      return;
    }

    if (isStartingRef.current) return;
    isStartingRef.current = true;
    speechService.stop();
    speechService.speak(
      `Opening ${exam.title}. ${exam.totalQuestions} questions. ${exam.durationMinutes} minutes. Starting examination now.`,
      {
        priority: true,
        onEnd: () => navigate(`/exam/${exam.id}`),
      }
    );
    setTimeout(() => navigate(`/exam/${exam.id}`), 1400);
  };

  usePageVoice('ExamSelection', [
    {
      triggers: ['ssc', 'cgl', 'first', 'pehla', 'open ssc', 'start ssc', '1'],
      answer: () => 'Starting SSC Mock Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'SSC') || examsList[0];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['bank', 'banking', 'ibps', 'po', 'second', 'dusra', 'open banking', 'open bank', '2'],
      answer: () => 'Starting Banking Quantitative Aptitude Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'Banking') || examsList[1];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['upsc', 'civil', 'prelims', 'third', 'teesra', 'open upsc', '3'],
      answer: () => 'Starting UPSC General Studies Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'UPSC') || examsList[2];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['railway', 'rrb', 'ntpc', 'fourth', 'chautha', 'open railway', '4'],
      answer: () => 'Starting Railway Mock Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'Railway') || examsList[3];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['kitne exam', 'total exam', 'available exam', 'list', 'konsa exam', 'exams batao'],
      answer: () => `Library me kul ${examsList.length} mock examinations hain.`,
    },
    {
      triggers: ['hard', 'tough', 'sabse kathin', 'mushkil'],
      answer: () => `UPSC General Studies mock test Hard difficulty level ka hai. Isme analytical depth sabse zyada hai.`,
    },
    {
      triggers: ['easy', 'sabse aasan', 'saral'],
      answer: () => `SSC General Awareness mock test Easy difficulty level ka hai. Beginners ke liye best start hai.`,
    },
    {
      triggers: ['announcement', 'batao', 'briefing', 'sunao', 'overview'],
      answer: () => announcement,
    },
  ]);

  const filtered = examsList.filter(e => {
    const catOk = cat === 'All' || e.category === cat;
    const diffOk = diff === 'All' || e.difficulty === diff;
    const searchOk =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    return catOk && diffOk && searchOk;
  });

  return (
    <AppLayout title="Mock Tests">
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        {/* ── 1. Hero Examination Banner (Compact) ── */}
        <div
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #7C3AED 100%)',
            borderRadius: '0.85rem',
            padding: '0.85rem 1.25rem',
            color: '#fff',
            marginBottom: '1rem',
            boxShadow: '0 4px 16px rgba(37,99,235,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '0.55rem',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(6px)',
              flexShrink: 0
            }}>
              <BookOpen size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  lineHeight: 1.2
                }}
              >
                Mock Examination Library
              </h1>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '999px',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(4px)',
                }}
              >
                National Exams
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setSelectedExamForCalibration(EXAMS[0]);
                setShowCalibrationWizard(true);
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.4)',
                fontWeight: 700,
                fontSize: '0.82rem',
                padding: '0.45rem 0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderRadius: '0.55rem',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              aria-label="Calibrate accessibility hardware and accommodations (C)"
            >
              <ShieldCheck size={15} /> Calibrate (C)
            </button>
            <button
              onClick={() => speechService.speak(announcement, { priority: true })}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.3)',
                fontWeight: 600,
                fontSize: '0.82rem',
                padding: '0.45rem 0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderRadius: '0.55rem',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              aria-label="Read available exams aloud (R)"
            >
              <Volume2 size={15} /> Read Exams (R)
            </button>
          </div>
        </div>

        {/* ── 2. Speech Guidance Bar (Compact) ── */}
        <div
          className="card fade-in"
          style={{
            marginBottom: '1.25rem',
            padding: '0.55rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
          }}
          role="region"
          aria-label="Voice command assistant"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: voiceActive ? 'rgba(16,185,129,0.12)' : 'var(--primary-light)',
                color: voiceActive ? '#059669' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mic size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: voiceActive ? '#059669' : 'var(--text)' }}>
                Speech Guidance: {voiceActive ? voiceStatus : 'Press V for Voice Commands'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                (Say: "Open SSC", "Open Banking", "Open UPSC")
              </span>
            </div>
          </div>

          <button
            onClick={toggleVoice}
            style={{
              background: voiceActive ? 'rgba(16,185,129,0.12)' : 'var(--primary-light)',
              color: voiceActive ? '#059669' : 'var(--primary)',
              border: voiceActive ? '1.5px solid rgba(16,185,129,0.35)' : '1px solid rgba(37,99,235,0.2)',
              padding: '0.35rem 0.8rem',
              borderRadius: '0.55rem',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: voiceActive ? '0 0 10px rgba(16,185,129,0.2)' : 'none'
            }}
          >
            {voiceActive ? <Mic size={14} className="mic-pulse" /> : <MicOff size={14} />}
            <span>{voiceActive ? 'Listening (V)' : 'Mic On (V)'}</span>
          </button>
        </div>

        {/* ── 3. Filters & Search Strip ── */}
        <div
          className="card fade-in"
          style={{
            padding: '1.35rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            alignItems: 'center',
            background: 'linear-gradient(145deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <label
              htmlFor="exam-search"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}
            >
              Search Examination
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="exam-search"
                type="search"
                className="input-field"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by exam name or category…"
                style={{ padding: '0.65rem 0.9rem 0.65rem 2.2rem', fontSize: '0.875rem', borderRadius: '0.65rem' }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Filter by Category
              </legend>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {availableCategories.map((c: string) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '0.6rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: cat === c ? '1px solid #2563EB' : '1px solid var(--border)',
                      background: cat === c ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'var(--bg-surface)',
                      color: cat === c ? '#ffffff' : 'var(--text)',
                      boxShadow: cat === c ? '0 3px 10px rgba(37, 99, 235, 0.35)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    aria-pressed={cat === c}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Difficulty Tabs */}
          <div>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Difficulty Level
              </legend>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => setDiff(d)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '0.6rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: diff === d ? '1px solid #2563EB' : '1px solid var(--border)',
                      background: diff === d ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'var(--bg-surface)',
                      color: diff === d ? '#ffffff' : 'var(--text)',
                      boxShadow: diff === d ? '0 3px 10px rgba(37, 99, 235, 0.35)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    aria-pressed={diff === d}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {/* Status Count */}
        <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }} role="status" aria-live="polite">
          Showing <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> available mock tests
        </div>

        {/* ── 4. Exam Cards Grid ── */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filtered.map(e => (
              <ExamCard key={e.id} exam={e} onStart={() => startExamWithAnnouncement(e)} />
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: '#fff' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
              <Search size={44} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No exams found matching your selected filters.</p>
            <button
              className="btn-ghost"
              onClick={() => {
                setCat('All');
                setDiff('All');
                setSearch('');
              }}
              style={{ color: '#2563EB', fontWeight: 600 }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <PreExamCalibrationWizard
        isOpen={showCalibrationWizard}
        onClose={() => setShowCalibrationWizard(false)}
        onComplete={({ timeMultiplier, autonomousMode }) => {
          setShowCalibrationWizard(false);
          const targetExam = selectedExamForCalibration || EXAMS[0];
          navigate(`/exam/${targetExam.id}`);
        }}
        examTitle={selectedExamForCalibration?.title || 'Mock Examination'}
      />
    </AppLayout>
  );
}
