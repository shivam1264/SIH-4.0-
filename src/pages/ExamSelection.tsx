import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Clock,
  BookOpen,
  Target,
  Play,
  Volume2,
  Square,
  Mic,
  MicOff,
  Search,
  X,
  HelpCircle,
  Sparkles,
  Calculator,
  Landmark,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import PreExamCalibrationWizard from '../components/PreExamCalibrationWizard';
import { speechService } from '../services/speechService';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';
import { audioCueService } from '../services/audioCueService';
import { usePageVoice } from '../hooks/usePageVoice';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { globalVoiceService } from '../services/globalVoiceService';
import { classifyVoiceIntent } from '../services/voiceCommandClassifier';
import { EXAMS } from '../data/mockData';
import { examsApi } from '../services/api';
import type { Exam } from '../types';

const INITIAL_CATEGORIES = ['All', 'SSC', 'Banking', 'UPSC', 'Railway', 'Defence', 'State PSC'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

interface ExamCardProps {
  exam: Exam;
  index: number;
  total: number;
  onStart: () => void;
}

function ExamCard({ exam, index, total, onStart }: ExamCardProps) {
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
    Defence: {
      cardBg: 'linear-gradient(155deg, #ffffff 0%, #f4fbf7 45%, #ecfdf5 100%)',
      cardBorder: 'rgba(16, 185, 129, 0.32)',
      glowGradient: 'radial-gradient(circle at 95% 5%, rgba(6, 95, 70, 0.14) 0%, transparent 60%)',
      ribbonGradient: 'linear-gradient(90deg, #065F46 0%, #047857 50%, #10B981 100%)',
      badgeBg: 'rgba(6, 95, 70, 0.09)',
      badgeText: '#065F46',
      badgeBorder: 'rgba(6, 95, 70, 0.28)',
      iconBgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      iconColor: '#065F46',
      iconBorder: 'rgba(6, 95, 70, 0.25)',
      iconShadow: '0 4px 14px rgba(6, 95, 70, 0.16)',
      metaBg: 'rgba(255, 255, 255, 0.78)',
      metaBorder: 'rgba(6, 95, 70, 0.16)',
      btnGradient: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
      btnShadow: '0 6px 18px -2px rgba(6, 95, 70, 0.45)',
      btnShadowHover: '0 10px 26px -2px rgba(6, 95, 70, 0.55)',
      accentColor: '#065F46',
      icon: ShieldCheck,
    },
    'State PSC': {
      cardBg: 'linear-gradient(155deg, #ffffff 0%, #faf5ff 45%, #f3e8ff 100%)',
      cardBorder: 'rgba(147, 51, 234, 0.32)',
      glowGradient: 'radial-gradient(circle at 95% 5%, rgba(126, 34, 206, 0.14) 0%, transparent 60%)',
      ribbonGradient: 'linear-gradient(90deg, #6B21A8 0%, #7E22CE 50%, #A855F7 100%)',
      badgeBg: 'rgba(126, 34, 206, 0.09)',
      badgeText: '#6B21A8',
      badgeBorder: 'rgba(126, 34, 206, 0.28)',
      iconBgGradient: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
      iconColor: '#7E22CE',
      iconBorder: 'rgba(126, 34, 206, 0.25)',
      iconShadow: '0 4px 14px rgba(126, 34, 206, 0.16)',
      metaBg: 'rgba(255, 255, 255, 0.78)',
      metaBorder: 'rgba(126, 34, 206, 0.16)',
      btnGradient: 'linear-gradient(135deg, #7E22CE 0%, #6B21A8 100%)',
      btnShadow: '0 6px 18px -2px rgba(126, 34, 206, 0.45)',
      btnShadowHover: '0 10px 26px -2px rgba(126, 34, 206, 0.55)',
      accentColor: '#7E22CE',
      icon: Layers,
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

  const handleStart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    audioCueService.start();
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
    }
    onStart();
  };

  const handleToggleAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    audioCueService.toggle();
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      screenReaderAnnouncer.announcePolite(`Stopped audio overview for ${exam.title}.`);
    } else {
      setIsPlayingAudio(true);
      const text = `Mock test ${index + 1} of ${total}: ${exam.title}. Category: ${exam.category}. Difficulty level: ${exam.difficulty}. Consists of ${exam.totalQuestions} questions with duration ${exam.durationMinutes} minutes. Covering subjects: ${exam.subjects.join(', ')}. Description: ${exam.description}. Press Enter or press key ${index + 1} to begin examination.`;
      speechService.speak(text, {
        priority: true,
        onEnd: () => setIsPlayingAudio(false),
      });
      screenReaderAnnouncer.announcePolite(text);
    }
  };

  return (
    <article
      tabIndex={0}
      role="article"
      aria-label={`Exam ${index + 1} of ${total}: ${exam.title}. Category ${exam.category}. Difficulty ${exam.difficulty}. ${exam.totalQuestions} questions, ${exam.durationMinutes} minutes. Covering ${exam.subjects.join(', ')}. Press Enter to start examination, or press L to listen to audio overview.`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStart();
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          handleToggleAudio();
        }
      }}
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
        cursor: 'default',
        outline: 'none',
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
            {/* Direct Number Key Badge */}
            <span
              style={{
                background: 'rgba(15, 23, 42, 0.07)',
                color: 'var(--text)',
                border: '1px solid rgba(15, 23, 42, 0.15)',
                fontWeight: 800,
                fontSize: '0.74rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '999px',
                lineHeight: 1.2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
              title={`Exam #${index + 1} — Press number key ${index + 1} to launch directly`}
              aria-label={`Exam number ${index + 1}. Press key ${index + 1} to start.`}
            >
              <span style={{ fontSize: '0.68rem', opacity: 0.6 }} aria-hidden="true">#</span>
              <span>{index + 1}</span>
            </span>

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
            aria-hidden="true"
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
          onClick={handleStart}
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
          aria-label={`Start mock examination ${exam.title}. Press number key ${index + 1} or Enter`}
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
          <span
            style={{
              fontSize: '0.72rem',
              opacity: 0.9,
              background: 'rgba(255, 255, 255, 0.22)',
              padding: '0.12rem 0.45rem',
              borderRadius: '0.35rem',
              fontWeight: 700,
              letterSpacing: '0.03em',
            }}
            aria-hidden="true"
          >
            Key [{index + 1}]
          </span>
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
          onClick={handleToggleAudio}
          title={isPlayingAudio ? 'Stop audio overview (Press L)' : `Listen to overview of ${exam.title} (Press L)`}
          aria-label={isPlayingAudio ? `Stop audio overview of ${exam.title}` : `Listen to overview of ${exam.title} (Press L)`}
          style={{
            width: 44,
            height: 44,
            borderRadius: '0.75rem',
            background: isPlayingAudio ? 'rgba(22, 163, 74, 0.14)' : 'rgba(255, 255, 255, 0.85)',
            border: `1.5px solid ${isPlayingAudio ? '#16A34A' : theme.cardBorder}`,
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
          {isPlayingAudio ? (
            <Square size={16} fill="currentColor" aria-hidden="true" />
          ) : (
            <Volume2 size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
}

export default function ExamSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialDifficulty = searchParams.get('difficulty') || 'All';
  const [cat, setCat] = useState(initialCategory);
  const [diff, setDiff] = useState(initialDifficulty);
  const [search, setSearch] = useState('');
  const [examsList, setExamsList] = useState<Exam[]>(EXAMS);
  const { active: voiceActive, toggleVoice, status: voiceStatus } = useVoiceAssistant();
  const isStartingRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showCalibrationWizard, setShowCalibrationWizard] = useState(false);
  const [selectedExamForCalibration, setSelectedExamForCalibration] = useState<Exam | null>(null);

  useEffect(() => {
    const fetchExams = () => {
      examsApi
        .getAll()
        .then(res => {
          if (res && res.length) setExamsList(res);
        })
        .catch(() => setExamsList(EXAMS));
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

  // Filtered examinations list based on Category, Difficulty, and Search
  const filtered = useMemo(() => {
    return examsList.filter(e => {
      const catOk = cat === 'All' || e.category === cat;
      const diffOk = diff === 'All' || e.difficulty === diff;
      const searchOk =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.subjects && e.subjects.some(s => s.toLowerCase().includes(search.toLowerCase())));
      return catOk && diffOk && searchOk;
    });
  }, [examsList, cat, diff, search]);

  const handleResetFilters = () => {
    audioCueService.filter();
    setCat('All');
    setDiff('All');
    setSearch('');
    const msg = `All filters reset. Showing all ${examsList.length} mock examinations.`;
    speechService.speak(msg, { priority: true });
    screenReaderAnnouncer.announcePolite(msg);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    audioCueService.filter();
    setCat(selectedCategory);
    const count = examsList.filter(e => {
      const catOk = selectedCategory === 'All' || e.category === selectedCategory;
      const diffOk = diff === 'All' || e.difficulty === diff;
      const searchOk =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.subjects && e.subjects.some(s => s.toLowerCase().includes(search.toLowerCase())));
      return catOk && diffOk && searchOk;
    }).length;
    const text = `Filtered by category: ${selectedCategory}. ${count} mock test${count === 1 ? '' : 's'} available.`;
    speechService.speak(text, { priority: true });
    screenReaderAnnouncer.announcePolite(text);
  };

  const handleDifficultySelect = (selectedDifficulty: string) => {
    audioCueService.filter();
    setDiff(selectedDifficulty);
    const count = examsList.filter(e => {
      const catOk = cat === 'All' || e.category === cat;
      const diffOk = selectedDifficulty === 'All' || e.difficulty === selectedDifficulty;
      const searchOk =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.subjects && e.subjects.some(s => s.toLowerCase().includes(search.toLowerCase())));
      return catOk && diffOk && searchOk;
    }).length;
    const text = `Filtered by difficulty: ${selectedDifficulty}. ${count} mock test${count === 1 ? '' : 's'} available.`;
    speechService.speak(text, { priority: true });
    screenReaderAnnouncer.announcePolite(text);
  };

  useEffect(() => {
    const qCat = searchParams.get('category');
    const qDiff = searchParams.get('difficulty');
    if (qCat && qCat !== cat) handleCategorySelect(qCat);
    if (qDiff && qDiff !== diff) handleDifficultySelect(qDiff);
  }, [searchParams]);

  useEffect(() => {
    const unregister = globalVoiceService.register((text: string, parsedCommand?: any) => {
      const cmd = parsedCommand || classifyVoiceIntent(text);
      if (cmd?.type === 'FILTER_CATEGORY' && cmd.targetCategory) {
        handleCategorySelect(cmd.targetCategory);
        return true;
      }
      if (cmd?.type === 'FILTER_DIFFICULTY' && cmd.targetDifficulty) {
        handleDifficultySelect(cmd.targetDifficulty);
        return true;
      }
      if (cmd?.type === 'RESET_FILTERS') {
        handleResetFilters();
        return true;
      }
      return false;
    });
    return unregister;
  }, [examsList, diff, cat]);

  const speakFilteredExams = () => {
    if (filtered.length === 0) {
      const msg = `No mock examinations found matching your active filters: Category ${cat}, Difficulty ${diff}${search ? `, Search term "${search}"` : ''}. Press Escape or click Reset Filters to view all examinations.`;
      speechService.speak(msg, { priority: true });
      screenReaderAnnouncer.announcePolite(msg);
      return;
    }
    const listDescriptions = filtered
      .map(
        (e, i) =>
          `Number ${i + 1}: ${e.title}, ${e.category} category, ${e.difficulty} difficulty, ${e.totalQuestions} questions, ${e.durationMinutes} minutes`
      )
      .join('. ');
    const msg = `Showing ${filtered.length} mock test${filtered.length === 1 ? '' : 's'}. ${listDescriptions}. Press number keys 1 to ${filtered.length} to begin an exam, say Open followed by exam name, or press C to calibrate accessibility accommodations.`;
    speechService.speak(msg, { priority: true });
    screenReaderAnnouncer.announcePolite(msg);
  };

  const startExamWithAnnouncement = (exam: Exam) => {
    // Check if candidate has completed accessibility calibration
    const hasCalibrated = localStorage.getItem('sight_exam_calibrated') === 'true';
    if (!hasCalibrated) {
      audioCueService.navigation();
      setSelectedExamForCalibration(exam);
      setShowCalibrationWizard(true);
      return;
    }

    if (isStartingRef.current) return;
    isStartingRef.current = true;
    audioCueService.start();
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

  // Spoken orientation on initial component mount
  useEffect(() => {
    document.title = 'Choose Mock Test — DrishtiX';

    const timer = setTimeout(() => {
      const welcome = `Mock Examination Library loaded. Showing ${examsList.length} available competitive examinations. Press 1 to ${examsList.length} to start directly, press R to read all exams aloud, press C to calibrate accessibility hardware, or press slash to search.`;
      speechService.speak(welcome, { priority: false });
      screenReaderAnnouncer.announcePolite(welcome);
    }, 450);

    return () => {
      clearTimeout(timer);
      speechService.stop();
    };
  }, [examsList.length]);

  // Debounced live screen reader feedback on search changes
  useEffect(() => {
    if (!search) return;
    const timer = setTimeout(() => {
      screenReaderAnnouncer.announcePolite(
        `Search for "${search}" returned ${filtered.length} mock test${filtered.length === 1 ? '' : 's'}.`
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [search, filtered.length]);

  // Universal Single Consolidated Keyboard Listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Yield entirely if the modal calibration wizard is open
      if (showCalibrationWizard) return;

      const target = e.target as HTMLElement;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      // If user is currently typing in an input field
      if (isInput) {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (search) {
            setSearch('');
            speechService.speak('Search cleared.');
            screenReaderAnnouncer.announcePolite('Search cleared.');
          } else {
            target.blur();
          }
        }
        return;
      }

      // Hotkey: Number keys 1 to 9 launch from the CURRENTLY FILTERED list
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (filtered[idx]) {
          e.preventDefault();
          startExamWithAnnouncement(filtered[idx]);
        } else if (idx < examsList.length) {
          e.preventDefault();
          const note = `Exam number ${idx + 1} is hidden by your current filters. ${filtered.length} exams visible. Press R to read available exams.`;
          speechService.speak(note);
          screenReaderAnnouncer.announcePolite(note);
        }
        return;
      }

      // Hotkey: C -> Calibrate Hardware & Accessibility Accommodations
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setSelectedExamForCalibration(filtered[0] || examsList[0] || EXAMS[0]);
        setShowCalibrationWizard(true);
        speechService.speak('Opening accessibility calibration.');
        screenReaderAnnouncer.announcePolite('Opening accessibility calibration.');
        return;
      }

      // Hotkey: R or B -> Read Filtered Exams Aloud
      if (e.key === 'r' || e.key === 'R' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        speakFilteredExams();
        return;
      }

      // Hotkey: V -> Toggle Voice Assistant
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        toggleVoice();
        return;
      }

      // Hotkey: / or S -> Focus Search Examination Input
      if (e.key === '/' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        searchInputRef.current?.focus();
        speechService.speak('Search examinations.');
        screenReaderAnnouncer.announcePolite('Search examinations input focused.');
        return;
      }

      // Hotkey: ? -> Spoken Shortcuts Guide
      if (e.key === '?') {
        e.preventDefault();
        const help = `Mock Test shortcuts: Press 1 to ${Math.max(1, filtered.length)} to start an exam. Press R to read exams aloud. Press C to calibrate accessibility accommodations. Press slash to search. Press V to toggle voice assistant. Press Escape to clear filters or return to dashboard.`;
        speechService.speak(help, { priority: true });
        screenReaderAnnouncer.announcePolite(help);
        return;
      }

      // Hotkey: Escape -> Clear active filters or navigate to Dashboard
      if (e.key === 'Escape') {
        e.preventDefault();
        if (cat !== 'All' || diff !== 'All' || search !== '') {
          handleResetFilters();
        } else {
          speechService.speak('Returning to student dashboard.');
          navigate('/dashboard');
        }
        return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showCalibrationWizard, filtered, examsList, search, cat, diff, toggleVoice, navigate]);

  // Integrated Voice Commands (English & Hindi/Hinglish)
  usePageVoice('ExamSelection', [
    {
      triggers: [
        'start test 1',
        'open test 1',
        'test 1',
        'first test',
        'first exam',
        'start first exam',
        'start first test',
        'pehla test',
        'open first exam',
      ],
      answer: () => (filtered[0] ? `Starting ${filtered[0].title}.` : 'No mock test available at position 1.'),
      action: () => {
        if (filtered[0]) startExamWithAnnouncement(filtered[0]);
      },
    },
    {
      triggers: [
        'start test 2',
        'open test 2',
        'test 2',
        'second test',
        'second exam',
        'start second exam',
        'dusra test',
        'open second exam',
      ],
      answer: () => (filtered[1] ? `Starting ${filtered[1].title}.` : 'No mock test available at position 2.'),
      action: () => {
        if (filtered[1]) startExamWithAnnouncement(filtered[1]);
      },
    },
    {
      triggers: [
        'start test 3',
        'open test 3',
        'test 3',
        'third test',
        'third exam',
        'start third exam',
        'tisra test',
        'open third exam',
      ],
      answer: () => (filtered[2] ? `Starting ${filtered[2].title}.` : 'No mock test available at position 3.'),
      action: () => {
        if (filtered[2]) startExamWithAnnouncement(filtered[2]);
      },
    },
    {
      triggers: [
        'start test 4',
        'open test 4',
        'test 4',
        'fourth test',
        'fourth exam',
        'start fourth exam',
        'chautha test',
        'open fourth exam',
      ],
      answer: () => (filtered[3] ? `Starting ${filtered[3].title}.` : 'No mock test available at position 4.'),
      action: () => {
        if (filtered[3]) startExamWithAnnouncement(filtered[3]);
      },
    },
    {
      triggers: [
        'start test 5',
        'open test 5',
        'test 5',
        'fifth test',
        'fifth exam',
        'start fifth exam',
        'panchva test',
        'open fifth exam',
      ],
      answer: () => (filtered[4] ? `Starting ${filtered[4].title}.` : 'No mock test available at position 5.'),
      action: () => {
        if (filtered[4]) startExamWithAnnouncement(filtered[4]);
      },
    },
    {
      triggers: [
        'start test 6',
        'open test 6',
        'test 6',
        'sixth test',
        'sixth exam',
        'start sixth exam',
        'chatha test',
        'chhatha test',
        'open sixth exam',
      ],
      answer: () => (filtered[5] ? `Starting ${filtered[5].title}.` : 'No mock test available at position 6.'),
      action: () => {
        if (filtered[5]) startExamWithAnnouncement(filtered[5]);
      },
    },
    {
      triggers: ['start the mock test', 'start mock test', 'start exam', 'shuru karo', 'start test', 'begin exam'],
      answer: () => (filtered[0] ? `Starting ${filtered[0].title}.` : 'No mock test available.'),
      action: () => {
        if (filtered[0]) startExamWithAnnouncement(filtered[0]);
      },
    },
    {
      triggers: ['start ssc', 'open ssc', 'start ssc exam', 'start ssc mock test', 'ssc shuru karo'],
      answer: () => 'Starting SSC Mock Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'SSC') || examsList[0];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['start banking', 'open banking', 'start bank exam', 'start banking mock test', 'banking shuru karo'],
      answer: () => 'Starting Banking Quantitative Aptitude Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'Banking') || examsList[1];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['start upsc', 'open upsc', 'start upsc exam', 'start upsc mock test', 'upsc shuru karo'],
      answer: () => 'Starting UPSC General Studies Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'UPSC') || examsList[2];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['start railway', 'open railway', 'start railway exam', 'start railway mock test', 'railway shuru karo'],
      answer: () => 'Starting Railway Mock Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'Railway') || examsList[3];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['start defence', 'open defence', 'start defence exam', 'start nda exam', 'start cds exam', 'defence shuru karo'],
      answer: () => 'Starting Defence NDA and CDS Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'Defence') || examsList[4];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['start state psc', 'open state psc', 'start psc exam', 'start state psc exam', 'state psc shuru karo'],
      answer: () => 'Starting State PSC Examination.',
      action: () => {
        const exam = examsList.find(x => x.category === 'State PSC') || examsList[5];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['show ssc', 'filter ssc', 'ssc category', 'ssc exams', 'ssc details'],
      answer: () => 'Filtering by SSC category.',
      action: () => handleCategorySelect('SSC'),
    },
    {
      triggers: ['show banking', 'filter banking', 'banking category', 'banking exams', 'banking details'],
      answer: () => 'Filtering by Banking category.',
      action: () => handleCategorySelect('Banking'),
    },
    {
      triggers: ['show upsc', 'filter upsc', 'upsc category', 'upsc exams', 'upsc details'],
      answer: () => 'Filtering by UPSC category.',
      action: () => handleCategorySelect('UPSC'),
    },
    {
      triggers: ['show railway', 'filter railway', 'railway category', 'railway exams', 'railway details'],
      answer: () => 'Filtering by Railway category.',
      action: () => handleCategorySelect('Railway'),
    },
    {
      triggers: ['show defence', 'filter defence', 'defence category', 'defence exams', 'defence details'],
      answer: () => 'Filtering by Defence category.',
      action: () => handleCategorySelect('Defence'),
    },
    {
      triggers: ['show state psc', 'filter state psc', 'state psc category', 'state psc exams', 'psc exams', 'state psc details'],
      answer: () => 'Filtering by State PSC category.',
      action: () => handleCategorySelect('State PSC'),
    },
    {
      triggers: ['show all exams', 'all exams', 'all categories', 'reset filter', 'reset filters', 'clear filters'],
      answer: () => 'Showing all available mock examinations.',
      action: () => handleResetFilters(),
    },
    {
      triggers: ['easy', 'easy exams', 'easy tests', 'sabse aasan', 'saral'],
      answer: () => 'Filtering by Easy difficulty level.',
      action: () => handleDifficultySelect('Easy'),
    },
    {
      triggers: ['medium', 'medium exams', 'medium difficulty'],
      answer: () => 'Filtering by Medium difficulty level.',
      action: () => handleDifficultySelect('Medium'),
    },
    {
      triggers: ['hard', 'hard exams', 'tough', 'sabse kathin', 'mushkil'],
      answer: () => 'Filtering by Hard difficulty level.',
      action: () => handleDifficultySelect('Hard'),
    },
    {
      triggers: ['read exams', 'list exams', 'available exams', 'kitne exam', 'summary', 'overview', 'briefing', 'announcement', 'batao', 'sunao'],
      answer: () => `Mock Test Library currently has ${filtered.length} tests matching your selection.`,
      action: () => speakFilteredExams(),
    },
    {
      triggers: ['calibrate', 'calibration', 'open calibration', 'hardware test', 'accessibility settings'],
      answer: () => 'Opening pre-exam accessibility calibration wizard.',
      action: () => {
        setSelectedExamForCalibration(filtered[0] || examsList[0] || EXAMS[0]);
        setShowCalibrationWizard(true);
      },
    },
    {
      triggers: ['help', 'shortcuts', 'keyboard help', 'madad'],
      answer: () => 'Press number keys 1 to 6 to launch exams directly. Press R to read exams. Press C to calibrate. Press slash to search.',
    },
  ]);

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
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '0.55rem',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(6px)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
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
                  lineHeight: 1.2,
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
                setSelectedExamForCalibration(filtered[0] || examsList[0] || EXAMS[0]);
                setShowCalibrationWizard(true);
                speechService.speak('Opening pre-exam accessibility calibration.');
                screenReaderAnnouncer.announcePolite('Opening pre-exam accessibility calibration.');
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
              aria-label="Calibrate accessibility hardware and accommodations (Press C)"
            >
              <ShieldCheck size={15} aria-hidden="true" /> Calibrate (C)
            </button>
            <button
              onClick={speakFilteredExams}
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
              aria-label="Read available exams aloud (Press R)"
            >
              <Volume2 size={15} aria-hidden="true" /> Read Exams (R)
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
          aria-label="Voice command assistant status and controls"
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
              aria-hidden="true"
            >
              <Mic size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span
                style={{ fontWeight: 700, fontSize: '0.85rem', color: voiceActive ? '#059669' : 'var(--text)' }}
                aria-live="polite"
              >
                Speech Guidance: {voiceActive ? voiceStatus : 'Press V for Voice Commands'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                (Say: "Open SSC", "Open Banking", "Open UPSC")
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              toggleVoice();
              const nextState = !voiceActive;
              const msg = nextState ? 'Voice assistant activated. Listening for commands.' : 'Voice assistant deactivated.';
              speechService.speak(msg);
              screenReaderAnnouncer.announcePolite(msg);
            }}
            aria-pressed={voiceActive}
            aria-label={voiceActive ? 'Deactivate speech guidance (Press V)' : 'Activate speech guidance (Press V)'}
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
              boxShadow: voiceActive ? '0 0 10px rgba(16,185,129,0.2)' : 'none',
            }}
          >
            {voiceActive ? <Mic size={14} className="mic-pulse" aria-hidden="true" /> : <MicOff size={14} aria-hidden="true" />}
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
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '0.35rem',
              }}
            >
              Search Examination <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>(Press / or S)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={searchInputRef}
                id="exam-search"
                type="search"
                className="input-field"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by exam name or category…"
                style={{ padding: '0.65rem 2.2rem 0.65rem 2.2rem', fontSize: '0.875rem', borderRadius: '0.65rem' }}
                aria-label="Search examination by name, subject, or category"
                aria-describedby="search-hint"
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                aria-hidden="true"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    searchInputRef.current?.focus();
                    speechService.speak('Search cleared.');
                    screenReaderAnnouncer.announcePolite('Search cleared.');
                  }}
                  aria-label="Clear search input text"
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.2rem',
                    borderRadius: '50%',
                  }}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              )}
              <span id="search-hint" className="sr-only">
                Type exam name or subject to filter results in real time. Press Escape to clear.
              </span>
            </div>
          </div>

          {/* Category Tabs */}
          <div>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Filter by Category
              </legend>
              <div
                role="radiogroup"
                aria-label="Filter mock tests by category"
                style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}
              >
                {availableCategories.map((c: string) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={cat === c}
                    aria-label={`Category filter: ${c}${cat === c ? ', selected' : ''}`}
                    onClick={() => handleCategorySelect(c)}
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
              <div
                role="radiogroup"
                aria-label="Filter mock tests by difficulty level"
                style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}
              >
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={diff === d}
                    aria-label={`Difficulty filter: ${d}${diff === d ? ', selected' : ''}`}
                    onClick={() => handleDifficultySelect(d)}
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
                  >
                    {d}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {/* Status Count & Active Filters Bar */}
        <div
          style={{
            marginBottom: '1rem',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
          role="status"
          aria-live="polite"
        >
          <span>
            Showing <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> available mock test{filtered.length === 1 ? '' : 's'}
            {(cat !== 'All' || diff !== 'All' || search) && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>
                (Active:{cat !== 'All' ? ` Category: ${cat}` : ''}{diff !== 'All' ? ` Difficulty: ${diff}` : ''}{search ? ` Search: "${search}"` : ''})
              </span>
            )}
          </span>
          {(cat !== 'All' || diff !== 'All' || search) && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563EB',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.4rem',
              }}
              aria-label="Clear active filters and show all exams (Press Escape)"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Reset All Filters (Esc)</span>
            </button>
          )}
        </div>

        {/* ── 4. Exam Cards Grid ── */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filtered.map((e, idx) => (
              <ExamCard
                key={e.id}
                exam={e}
                index={idx}
                total={filtered.length}
                onStart={() => startExamWithAnnouncement(e)}
              />
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '3.5rem 2rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              border: '1.5px dashed var(--border)',
              borderRadius: '1rem',
            }}
            role="alert"
            aria-live="assertive"
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
              <Search size={44} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem' }}>
              No Mock Tests Found
            </h2>
            <p style={{ fontSize: '0.88rem', marginBottom: '1.25rem', maxWidth: 440, margin: '0 auto 1.25rem' }}>
              No examinations match your current filters ({cat !== 'All' ? `Category: ${cat}, ` : ''}{diff !== 'All' ? `Difficulty: ${diff}, ` : ''}{search ? `Search: "${search}"` : ''}).
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                padding: '0.6rem 1.35rem',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.65rem',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
              aria-label="Reset all filters to view all available examinations (Press Escape)"
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>Reset Filters (Esc)</span>
            </button>
          </div>
        )}
      </div>

      <PreExamCalibrationWizard
        isOpen={showCalibrationWizard}
        onClose={() => setShowCalibrationWizard(false)}
        onComplete={() => {
          setShowCalibrationWizard(false);
          const targetExam = selectedExamForCalibration || filtered[0] || examsList[0] || EXAMS[0];
          navigate(`/exam/${targetExam.id}?autostart=true`);
        }}
        examTitle={selectedExamForCalibration?.title || 'Mock Examination'}
      />
    </AppLayout>
  );
}
