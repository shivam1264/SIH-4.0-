import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Award,
  Search,
  CheckCircle2,
  Calendar,
  Volume2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Target,
  FileText,
  BarChart3,
  ChevronRight,
  Zap,
  Filter
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { MOCK_ATTEMPTS, EXAMS } from '../data/mockData';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';
import { useAccessibility } from '../context/AccessibilityContext';
import { usePageVoice } from '../hooks/usePageVoice';
import type { ExamAttempt } from '../types';

export default function History() {
  const navigate = useNavigate();
  const { prefs } = useAccessibility();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Load and merge live attempts from localStorage with seed mock attempts
  const allAttempts: ExamAttempt[] = useMemo(() => {
    try {
      const live: ExamAttempt[] = JSON.parse(localStorage.getItem('sight-exam-attempts') ?? '[]');
      return [...live, ...MOCK_ATTEMPTS];
    } catch {
      return MOCK_ATTEMPTS;
    }
  }, []);

  // Filtered attempts
  const filteredAttempts = useMemo(() => {
    return allAttempts.filter(a => {
      const exam = EXAMS.find(e => e.id === a.examId);
      const category = exam?.category || 'General';
      const matchCat = selectedCategory === 'All' || category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || a.examTitle.toLowerCase().includes(q) || category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [allAttempts, selectedCategory, searchQuery]);

  // Audio briefing on mount
  useEffect(() => {
    document.title = 'Examination Attempt History & Logs — DrishtiX';
    const total = allAttempts.length;
    const highest = Math.max(...allAttempts.map(a => a.percentage || 70), 80);
    const summary = `Examination Attempt History. You have recorded ${total} mock examination attempts. Your highest score is ${highest} percent. Select any exam attempt to review your question-by-question solutions or retake the test.`;

    if (prefs.voiceMode || prefs.autoReadQuestion) {
      const timer = setTimeout(() => {
        speechService.speak(summary, { priority: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const getTimeSpentMinutes = (a: ExamAttempt): number => {
    if (a.answers && a.answers.length > 0) {
      const totalSecs = a.answers.reduce((acc, ans) => acc + (ans.timeSpentSeconds || 0), 0);
      if (totalSecs > 0) return Math.round(totalSecs / 60);
    }
    if (a.avgTimePerQ && a.answers) {
      return Math.round((a.avgTimePerQ * a.answers.length) / 60);
    }
    return 12;
  };

  const getAttemptDate = (a: ExamAttempt): string => {
    const d = a.submittedAt || a.startedAt;
    return d ? new Date(d).toLocaleDateString() : 'Recent';
  };

  // Spoken summary of a single attempt
  const handleSpeakAttempt = (a: ExamAttempt) => {
    audioCueService.select();
    const text = `Attempt record for ${a.examTitle}. Date: ${getAttemptDate(a)}. Score: ${a.score} out of ${a.maxScore}, which is ${a.percentage} percent. Accuracy: ${a.accuracy} percent. Time spent: ${getTimeSpentMinutes(a)} minutes. Press R to view complete solutions breakdown.`;
    screenReaderAnnouncer.announcePolite(text);
    speechService.speak(text, { priority: true });
  };

  // Voice command integration
  usePageVoice('History', [
    {
      triggers: ['read history', 'history briefing', 'attempts', 'samjhao'],
      answer: () => {
        const total = allAttempts.length;
        const highest = Math.max(...allAttempts.map(a => a.percentage || 70), 80);
        return `You have completed ${total} mock tests. Your peak score is ${highest} percent.`;
      },
    },
    {
      triggers: ['review first test', 'review test 1', 'pehla attempt'],
      answer: () => {
        if (filteredAttempts[0]) {
          navigate(`/results/${filteredAttempts[0].id}`);
          return `Opening scorecard for ${filteredAttempts[0].examTitle}.`;
        }
        return 'No past attempts found.';
      },
    },
    {
      triggers: ['retake latest', 'retake exam', 'retake test'],
      answer: () => {
        if (filteredAttempts[0]) {
          navigate(`/exam/${filteredAttempts[0].examId}?autostart=true`);
          return `Retaking ${filteredAttempts[0].examTitle}.`;
        }
        return 'No exam found to retake.';
      },
    },
  ]);

  return (
    <AppLayout title="Examination Attempt History & Logs">
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>

        {/* Hero Header */}
        <div
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
            borderRadius: '1.25rem',
            padding: '2rem 2.25rem',
            color: '#fff',
            marginBottom: '1.75rem',
            boxShadow: '0 12px 32px -4px rgba(67, 56, 202, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.18)',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: '0.85rem',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Clock size={14} /> CHRONOLOGICAL ATTEMPT LEDGER
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, marginBottom: '0.65rem', lineHeight: 1.25 }}>
              Examination Attempt History & Solutions Log
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#E0E7FF', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Inspect detailed scorecards, solution keys, pacing benchmarks, and PwD compensatory time allocations across all your mock sessions.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/exams')}
                className="btn-primary"
                style={{
                  background: '#FFFFFF',
                  color: '#312E81',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.65rem',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                }}
              >
                <Zap size={16} />
                <span>Take a New Mock Test</span>
              </button>

              <button
                onClick={() => navigate('/performance')}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.65rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <span>Performance Analytics Hub</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Quick Counter Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center',
              minWidth: 170,
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{allAttempts.length}</div>
            <div style={{ fontSize: '0.78rem', color: '#E0E7FF', marginTop: '0.35rem', fontWeight: 700 }}>
              Completed Sessions
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div
          className="card fade-in"
          style={{
            padding: '1.25rem',
            borderRadius: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search history by test name or category (e.g. SSC, Banking, Reasoning)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.75rem', width: '100%', fontSize: '0.88rem' }}
                aria-label="Search exam attempt history"
              />
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Displaying {filteredAttempts.length} of {allAttempts.length} Attempt Records
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Category:</span>
            {['All', 'SSC', 'Banking', 'UPSC', 'Railway'].map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: active ? '#4338CA' : 'var(--bg-surface)',
                    color: active ? '#ffffff' : 'var(--text)',
                    border: active ? '1px solid #4338CA' : '1px solid var(--border)',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                  }}
                  aria-pressed={active}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Attempts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAttempts.map((a, index) => {
            const exam = EXAMS.find(e => e.id === a.examId);
            const scoreColor = a.percentage >= 80 ? '#16A34A' : a.percentage >= 60 ? '#2563EB' : a.percentage >= 40 ? '#D97706' : '#DC2626';
            const scoreBg = a.percentage >= 80 ? '#DCFCE7' : a.percentage >= 60 ? '#DBEAFE' : a.percentage >= 40 ? '#FEF3C7' : '#FEE2E2';

            return (
              <div
                key={a.id || index}
                className="card card-interactive fade-in"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                {/* Left info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 280 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '0.75rem',
                      background: scoreBg,
                      color: scoreColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{a.percentage}%</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>Score</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                      <span
                        style={{
                          background: 'rgba(67, 56, 202, 0.1)',
                          color: '#4338CA',
                          borderRadius: '999px',
                          padding: '0.15rem 0.55rem',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                        }}
                      >
                        {exam?.category || 'Mock Exam'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} /> {getAttemptDate(a)}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.35rem 0' }}>
                      {a.examTitle}
                    </h3>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>Score: <strong style={{ color: 'var(--text)' }}>{a.score}/{a.maxScore}</strong></span>
                      <span>Accuracy: <strong style={{ color: 'var(--text)' }}>{a.accuracy}%</strong></span>
                      <span>Time: <strong style={{ color: 'var(--text)' }}>{getTimeSpentMinutes(a)}m</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleSpeakAttempt(a)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '0.55rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Hear attempt details aloud"
                    aria-label={`Listen to details for ${a.examTitle}`}
                  >
                    <Volume2 size={16} />
                  </button>

                  <button
                    onClick={() => navigate(`/results/${a.id}`)}
                    className="btn-primary"
                    style={{
                      padding: '0.55rem 1rem',
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <FileText size={14} /> Review Solutions
                  </button>

                  <button
                    onClick={() => navigate(`/exam/${a.examId}?autostart=true`)}
                    className="btn-secondary"
                    style={{
                      padding: '0.55rem 0.9rem',
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <RotateCcw size={14} /> Retake Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAttempts.length === 0 && (
          <div
            className="card fade-in"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              borderRadius: '1rem',
              marginTop: '1.5rem',
            }}
          >
            <Clock size={48} color="#4338CA" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              No examination attempts found
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Start an exam from the Mock Tests library to record your first verified session.
            </p>
            <button
              onClick={() => navigate('/exams')}
              className="btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
            >
              Browse Available Exams
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
