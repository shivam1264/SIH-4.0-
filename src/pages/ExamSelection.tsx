import React, { useEffect, useState, useRef } from 'react';
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
  ArrowRight
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { speechService } from '../services/speechService';
import { usePageVoice } from '../hooks/usePageVoice';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { EXAMS } from '../data/mockData';
import type { Exam } from '../types';

const CATEGORIES = ['All', 'SSC', 'Banking', 'UPSC', 'Railway'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

function ExamCard({ exam, onStart }: { exam: Exam; onStart: () => void }) {
  const catThemes: Record<
    string,
    { bg: string; text: string; gradient: string; icon: React.ComponentType<{ size?: number; color?: string }> }
  > = {
    SSC: { bg: '#EFF6FF', text: '#2563EB', gradient: 'linear-gradient(90deg, #2563EB, #3B82F6)', icon: FileText },
    Banking: { bg: '#FFF7ED', text: '#EA580C', gradient: 'linear-gradient(90deg, #EA580C, #F97316)', icon: Calculator },
    UPSC: { bg: '#FEF3C7', text: '#D97706', gradient: 'linear-gradient(90deg, #D97706, #F59E0B)', icon: Landmark },
    Railway: { bg: '#ECFDF5', text: '#059669', gradient: 'linear-gradient(90deg, #059669, #10B981)', icon: BookOpen },
  };

  const theme = catThemes[exam.category] || catThemes['SSC'];
  const CategoryIcon = theme.icon;

  const diffColor =
    exam.difficulty === 'Easy'
      ? { bg: '#DCFCE7', text: '#16A34A' }
      : exam.difficulty === 'Medium'
      ? { bg: '#FEF3C7', text: '#D97706' }
      : { bg: '#FEE2E2', text: '#DC2626' };

  return (
    <article
      className="card card-interactive fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1.4rem',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        borderRadius: '0.85rem',
        border: '1px solid var(--border)',
      }}
    >
      {/* Category accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5px',
          background: theme.gradient,
        }}
        aria-hidden="true"
      />

      <div>
        {/* Top Badges & Category Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                background: theme.bg,
                color: theme.text,
                fontWeight: 800,
                fontSize: '0.72rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                lineHeight: 1.2,
              }}
            >
              {exam.category}
            </span>
            <span
              style={{
                background: diffColor.bg,
                color: diffColor.text,
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
              }}
            >
              {exam.difficulty}
            </span>
          </div>

          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '0.5rem',
              background: theme.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CategoryIcon size={18} color={theme.text} />
          </div>
        </div>

        {/* Title & Description */}
        <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.45rem', lineHeight: 1.35 }}>
          {exam.title}
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1rem' }}>
          {exam.description}
        </p>

        {/* Metadata Chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            fontSize: '0.78rem',
            background: 'var(--bg-surface)',
            padding: '0.75rem',
            borderRadius: '0.55rem',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text)' }}>
            <HelpCircle size={14} color="#2563EB" aria-hidden="true" />
            <span style={{ fontWeight: 600 }}>{exam.totalQuestions} Questions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text)' }}>
            <Clock size={14} color="#2563EB" aria-hidden="true" />
            <span style={{ fontWeight: 600 }}>{exam.durationMinutes} Minutes</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-muted)',
              gridColumn: '1 / -1',
            }}
          >
            <BookOpen size={14} color="#7C3AED" aria-hidden="true" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {exam.subjects.join(', ')}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '0.7rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 700,
          fontSize: '0.875rem',
          background: '#2563EB',
          color: '#fff',
          border: 'none',
          borderRadius: '0.6rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
        }}
        aria-label={`Start mock examination: ${exam.title}`}
      >
        <Play size={14} fill="currentColor" /> Start Mock Examination
      </button>
    </article>
  );
}

export default function ExamSelection() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('All');
  const [diff, setDiff] = useState('All');
  const [search, setSearch] = useState('');
  const { active: voiceActive, toggleVoice, status: voiceStatus } = useVoiceAssistant();
  const isStartingRef = useRef(false);

  const announcement =
    'Mock Test Library. Available examinations are: SSC General Awareness, Banking Quantitative Aptitude, Railway General Knowledge, UPSC General Studies. Say Open SSC, or click to start.';

  useEffect(() => {
    document.title = 'Choose Mock Test — SIGHT-EXAM AI';

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
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [announcement, voiceActive, toggleVoice]);

  const startExamWithAnnouncement = (exam: Exam) => {
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
        const exam = EXAMS.find(x => x.category === 'SSC') || EXAMS[0];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['bank', 'banking', 'ibps', 'po', 'second', 'dusra', 'open banking', 'open bank', '2'],
      answer: () => 'Starting Banking Quantitative Aptitude Examination.',
      action: () => {
        const exam = EXAMS.find(x => x.category === 'Banking') || EXAMS[1];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['upsc', 'civil', 'prelims', 'third', 'teesra', 'open upsc', '3'],
      answer: () => 'Starting UPSC General Studies Examination.',
      action: () => {
        const exam = EXAMS.find(x => x.category === 'UPSC') || EXAMS[2];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['railway', 'rrb', 'ntpc', 'fourth', 'chautha', 'open railway', '4'],
      answer: () => 'Starting Railway Mock Examination.',
      action: () => {
        const exam = EXAMS.find(x => x.category === 'Railway') || EXAMS[3];
        startExamWithAnnouncement(exam);
      },
    },
    {
      triggers: ['kitne exam', 'total exam', 'available exam', 'list', 'konsa exam', 'exams batao'],
      answer: () => `Library me kul 4 mock examinations hain: SSC General Awareness, Banking Aptitude, UPSC General Studies, aur Railway General Knowledge.`,
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

  const filtered = EXAMS.filter(e => {
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
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.25rem',
            alignItems: 'center',
            background: 'var(--bg-card)',
            borderRadius: '0.85rem',
            border: '1px solid var(--border)',
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
                style={{ padding: '0.6rem 0.9rem 0.6rem 2.2rem', fontSize: '0.875rem' }}
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
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: cat === c ? '1px solid #2563EB' : '1px solid var(--border)',
                      background: cat === c ? '#EFF6FF' : 'var(--bg-surface)',
                      color: cat === c ? '#2563EB' : 'var(--text)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
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
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: diff === d ? '1px solid #2563EB' : '1px solid var(--border)',
                      background: diff === d ? '#EFF6FF' : 'var(--bg-surface)',
                      color: diff === d ? '#2563EB' : 'var(--text)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
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
    </AppLayout>
  );
}
