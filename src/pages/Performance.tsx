import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Trophy,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  ClipboardList,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Award,
  Sparkles,
  Volume2,
  Target,
  Search,
  Filter,
  RotateCcw,
  AlertTriangle,
  Zap,
  Check,
  Brain,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { MOCK_ATTEMPTS, AI_RECOMMENDATIONS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { speechService } from '../services/speechService';
import { usePageVoice } from '../hooks/usePageVoice';

export default function Performance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const attempts = MOCK_ATTEMPTS;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScore, setFilterScore] = useState<'all' | 'passed' | 'review'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'score-desc' | 'score-asc'>('date-desc');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    document.title = 'Performance & Diagnostic Matrix — DrishtiX';
  }, []);

  // Global KPIs Calculation
  const avg = Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / (attempts.length || 1));
  const best = Math.max(...attempts.map(a => a.percentage));
  const totalCorrect = attempts.reduce((s, a) => s + Math.round(a.score / 2), 0);
  const totalQs = attempts.reduce((s, a) => s + Math.round(a.maxScore / 2), 0);
  const accuracy = Math.round((totalCorrect / (totalQs || 1)) * 100);
  const avgSpeed = Math.round(attempts.reduce((s, a) => s + a.avgTimePerQ, 0) / (attempts.length || 1));

  // Best exam title
  const bestAttempt = attempts.find(a => a.percentage === best);

  // Subject Aggregation
  const subjectAgg: Record<string, { correct: number; total: number; strongTopics: Set<string>; weakTopics: Set<string> }> = {};
  attempts.forEach(a => {
    a.subjectBreakdown.forEach(s => {
      if (!subjectAgg[s.subject]) {
        subjectAgg[s.subject] = {
          correct: 0,
          total: 0,
          strongTopics: new Set<string>(),
          weakTopics: new Set<string>()
        };
      }
      subjectAgg[s.subject].correct += s.correct;
      subjectAgg[s.subject].total += s.total;
    });

    a.strongTopics?.forEach(t => {
      // Find subject for this topic or add to best matching
      Object.keys(subjectAgg).forEach(sub => subjectAgg[sub].strongTopics.add(t));
    });
    a.weakTopics?.forEach(t => {
      Object.keys(subjectAgg).forEach(sub => subjectAgg[sub].weakTopics.add(t));
    });
  });

  const subjectList = Object.entries(subjectAgg).map(([name, data]) => ({
    name,
    accuracy: Math.round((data.correct / (data.total || 1)) * 100),
    correct: data.correct,
    total: data.total,
  }));
  subjectList.sort((a, b) => b.accuracy - a.accuracy);
  const bestSub = subjectList[0]?.name || 'Quantitative Aptitude';
  const worstSub = subjectList[subjectList.length - 1]?.name || 'History';

  // Extract all unique weak topics from attempts
  const allWeakTopics = Array.from(new Set(attempts.flatMap(a => a.weakTopics || [])));
  const allStrongTopics = Array.from(new Set(attempts.flatMap(a => a.strongTopics || [])));

  // Filtered and Sorted Attempts
  const filteredAttempts = useMemo(() => {
    return attempts
      .filter(a => {
        const matchesQuery = a.examTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesScore =
          filterScore === 'all'
            ? true
            : filterScore === 'passed'
            ? a.percentage >= 70
            : a.percentage < 70;
        return matchesQuery && matchesScore;
      })
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.percentage - a.percentage;
        if (sortBy === 'score-asc') return a.percentage - b.percentage;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }, [attempts, searchQuery, filterScore, sortBy]);

  // Voice narration text
  const spokenSummary = `Performance Diagnostic Summary. You have evaluated ${attempts.length} mock examinations. Your average score is ${avg} percent, and your personal best is ${best} percent in ${bestAttempt?.examTitle?.split('—')[0]?.trim() || 'mock tests'}. Your overall question accuracy is ${accuracy} percent with an average solving speed of ${avgSpeed} seconds per question. Your highest proficiency is in ${bestSub}, while your primary focus area is ${worstSub}.`;

  const handleSpeakSummary = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speechService.speak(spokenSummary, {
      priority: true,
      onEnd: () => setIsSpeaking(false)
    });
  };

  // Universal Keyboard Accessibility in Performance
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'b' || e.key === 'B' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleSpeakSummary();
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        navigate('/practice');
        return;
      }
      if (e.key === 'd' || e.key === 'D' || e.key === 'Escape') {
        e.preventDefault();
        navigate('/dashboard');
        return;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSpeakSummary, navigate]);

  // Voice Assistant Hooks
  usePageVoice('Performance', [
    {
      triggers: ['voice briefing', 'read briefing', 'briefing', 'press r', 'audio briefing', 'read my report'],
      answer: () => '',
      action: () => handleSpeakSummary(),
    },
    {
      triggers: ['benchmark', 'target benchmark', 'what is the benchmark', 'target score'],
      answer: () => `Target benchmark is 70 percent. Your current overall average is ${avg} percent, which is ${Math.abs(70 - avg)} percent ${avg >= 70 ? 'above' : 'approaching'} your target benchmark.`,
    },
    {
      triggers: ['accuracy', 'accuracy rate', 'question accuracy', 'sahi percentage'],
      answer: () => `Question accuracy rate is ${accuracy} percent, with ${totalCorrect} correct answers out of ${totalQs} total questions evaluated.`,
    },
    {
      triggers: ['highest score', 'best score', 'personal record', 'top score'],
      answer: () => `Your highest mock evaluation is ${best} percent in ${bestAttempt?.examTitle?.split('—')[0]?.trim() || 'mock test'}.`,
    },
    {
      triggers: ['score', 'average score', 'overall score', 'marks', 'kitna score', 'mera score'],
      answer: () => `Your overall average score is ${avg} percent across ${attempts.length} completed mock examinations.`,
    },
    {
      triggers: ['subject mastery', 'subjects', 'all subjects', 'subject breakdown'],
      answer: () => `Subject mastery breakdown: ${subjectList.map(s => `${s.name}: ${s.accuracy} percent`).join(', ')}.`,
    },
    {
      triggers: ['best subject', 'strong subject', 'achha subject', 'strength', 'strongest subject'],
      answer: () => `Your strongest discipline is ${bestSub} with highest proficiency.`,
    },
    {
      triggers: ['weak subject', 'kamjor subject', 'weakness', 'kisme kam marks', 'weakest subject', 'focus area'],
      answer: () => `Your primary focus area is ${worstSub}. Recommended review topics: ${allWeakTopics.slice(0, 3).join(', ')}.`,
    },
    {
      triggers: ['score progression', 'trajectory', 'progress', 'score trend'],
      answer: () => `Score progression trajectory: across ${attempts.length} evaluations, your results are ${attempts.map(a => `${a.percentage} percent in ${a.examTitle.split('—')[0].trim()}`).join(', ')}.`,
    },
    {
      triggers: ['speed', 'kitna time', 'solving speed', 'pacing'],
      answer: () => `Your average solving speed is ${avgSpeed} seconds per question.`,
    },
    {
      triggers: ['kitne exam', 'kitne test', 'total test', 'kitne mock test', 'exams attempted'],
      answer: () => `You have evaluated a total of ${attempts.length} mock examinations.`,
    },
    {
      triggers: ['summary', 'batao', 'overview', 'haal', 'read summary'],
      answer: () => spokenSummary,
    },
    {
      triggers: ['practice', 'abhyas', 'start practice', 'drills', 'ai drills'],
      answer: () => 'Opening AI Practice Drills section.',
      action: () => navigate('/practice'),
    },
  ]);

  // Chart calculation
  const BAR_MAX = 100;
  const chartBars = attempts.map(a => {
    const isPassed = a.percentage >= 70;
    const isModerate = a.percentage >= 50;
    return {
      id: a.id,
      label: a.examTitle.split('—')[0].trim(),
      subLabel: a.examTitle.includes('—') ? a.examTitle.split('—')[1].trim() : '',
      percentage: a.percentage,
      accuracy: a.accuracy,
      date: new Date(a.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      color: isPassed ? '#10B981' : isModerate ? '#F59E0B' : '#EF4444',
      gradient: isPassed
        ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
        : isModerate
        ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)'
        : 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
    };
  });

  return (
    <AppLayout title="Performance">
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* ── 1. Hero Analytics & Diagnostic Header ── */}
        <section
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #4F46E5 100%)',
            borderRadius: '0.9rem',
            padding: '1.1rem 1.4rem',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            position: 'relative',
            overflow: 'hidden',
          }}
          aria-label="Performance header"
        >
          {/* Subtle decorative background glow */}
          <div
            style={{
              position: 'absolute',
              right: '-50px',
              top: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', zIndex: 1 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '0.65rem',
                background: 'rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Sparkles size={22} color="#FFFFFF" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h1
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    lineHeight: 1.2,
                    color: '#FFFFFF',
                  }}
                >
                  Performance & Accuracy Diagnostics
                </h1>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.15rem 0.5rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '999px',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  Live Analytics
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                Comprehensive trajectory diagnostics, subject proficiency breakdown & AI study directives
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.6rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              <Target size={14} color="#6EE7B7" />
              <span>Target Benchmark: <strong>70%</strong></span>
            </div>

            <button
              onClick={handleSpeakSummary}
              style={{
                background: isSpeaking ? '#FFFFFF' : 'rgba(255, 255, 255, 0.18)',
                color: isSpeaking ? '#1E3A8A' : '#FFFFFF',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '0.45rem 0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderRadius: '0.6rem',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSpeaking ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              }}
              title="Speak Diagnostic Summary (Press R or click)"
              aria-label={isSpeaking ? 'Stop voice summary' : 'Read performance summary aloud'}
            >
              <Volume2 size={15} className={isSpeaking ? 'pulse-fast' : ''} />
              {isSpeaking ? 'Stop Audio' : 'Voice Briefing (R)'}
            </button>
          </div>
        </section>

        {/* ── 2. Top Executive KPI Metric Cards (Compact 4-Column Grid) ── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '1rem',
          }}
          aria-label="Key Performance Indicators"
        >
          {/* Card 1: Total Attempted */}
          <div
            className="card card-interactive fade-in card-fade-blue"
            style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '0.55rem',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #DBEAFE',
                }}
              >
                <FileText size={18} color="#2563EB" />
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                }}
              >
                {attempts.length} Complete
              </span>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.95rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginBottom: '0.15rem',
                }}
              >
                {attempts.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Total Mock Exams Attempted
              </div>
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                borderTop: '1px solid var(--border)',
                paddingTop: '0.5rem',
              }}
            >
              <Check size={12} strokeWidth={3} /> 100% Submission Success Rate
            </div>
          </div>

          {/* Card 2: Average Score */}
          <div
            className="card card-interactive fade-in card-fade-purple"
            style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '0.55rem',
                  background: '#F5F3FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #EDE9FE',
                }}
              >
                <TrendingUp size={18} color="#7C3AED" />
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  background: '#F5F3FF',
                  color: '#6D28D9',
                  border: '1px solid #DDD6FE',
                }}
              >
                {avg >= 70 ? 'Target Met' : 'Approaching Target'}
              </span>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.95rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginBottom: '0.15rem',
                }}
              >
                {avg}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Average Overall Score
              </div>
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#6D28D9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border)',
                paddingTop: '0.5rem',
              }}
            >
              <span>Target: 70%</span>
              <span style={{ color: avg >= 70 ? '#16A34A' : '#D97706' }}>
                {avg >= 70 ? 'Optimal' : `${70 - avg}% to Target`}
              </span>
            </div>
          </div>

          {/* Card 3: Personal Best */}
          <div
            className="card card-interactive fade-in card-fade-emerald"
            style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '0.55rem',
                  background: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #D1FAE5',
                }}
              >
                <Trophy size={18} color="#059669" />
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  background: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                }}
              >
                Personal Record
              </span>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.95rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginBottom: '0.15rem',
                }}
              >
                {best}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Highest Mock Evaluation
              </div>
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                borderTop: '1px solid var(--border)',
                paddingTop: '0.5rem',
              }}
              title={bestAttempt?.examTitle}
            >
              In: {bestAttempt?.examTitle?.split('—')[0]?.trim() || 'Mock Evaluation'}
            </div>
          </div>

          {/* Card 4: Question Accuracy */}
          <div
            className="card card-interactive fade-in card-fade-orange"
            style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '0.55rem',
                  background: '#FFF7ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #FFEDD5',
                }}
              >
                <CheckCircle2 size={18} color="#EA580C" />
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  background: '#FFF7ED',
                  color: '#C2410C',
                  border: '1px solid #FED7AA',
                }}
              >
                {avgSpeed}s / Q Avg
              </span>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.95rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginBottom: '0.15rem',
                }}
              >
                {accuracy}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Question Accuracy Rate
              </div>
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border)',
                paddingTop: '0.5rem',
              }}
            >
              <span>{totalCorrect} / {totalQs} Correct</span>
              <span style={{ color: '#EA580C' }}>{Math.round(totalCorrect / (attempts.length || 1))} / exam avg</span>
            </div>
          </div>
        </section>

        {/* ── 3. Two-Column Analytics Layout (Trajectory Chart & Subject Mastery) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: '1.25rem',
          }}
        >
          {/* Left: Score Progression Trajectory Bar Chart */}
          <section
            className="card fade-in"
            style={{
              padding: '1.35rem 1.4rem',
              borderRadius: '0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            aria-label="Score Progression Chart"
          >
            {/* Chart Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '0.5rem',
                    background: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={18} color="#2563EB" />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.08rem',
                      color: 'var(--text)',
                      margin: 0,
                    }}
                  >
                    Score Progression Trajectory
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Chronological performance across mock evaluations
                  </p>
                </div>
              </div>

              {/* Legend Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#059669' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> ≥ 70% Target
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#D97706' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} /> 50–69%
                </span>
              </div>
            </div>

            {/* Chart Graphic Area with Gridlines & Target Cutoff */}
            <div
              style={{
                position: 'relative',
                height: 180,
                padding: '0.5rem 0.5rem 0 2rem',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '1rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {/* Horizontal Reference Lines */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '100%',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* 100% line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>100%</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.6 }} />
                </div>
                {/* 70% Target Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '30%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 700, width: 24, textAlign: 'right' }}>70%</span>
                  <div style={{ flex: 1, height: 1, borderTop: '1.5px dashed rgba(16, 185, 129, 0.6)' }} />
                  <span
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: -9,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      background: '#ECFDF5',
                      color: '#047857',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '999px',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    Cutoff Benchmark
                  </span>
                </div>
                {/* 50% line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>50%</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.4 }} />
                </div>
                {/* 0% line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>0%</span>
                  <div style={{ flex: 1, height: 1, background: 'transparent' }} />
                </div>
              </div>

              {/* Bars */}
              {chartBars.map((bar) => {
                const heightPx = (bar.percentage / BAR_MAX) * 140;
                return (
                  <div
                    key={bar.id}
                    style={{
                      flex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    {/* Score Tooltip Pill above bar */}
                    <div
                      style={{
                        marginBottom: '0.35rem',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: bar.color,
                        background: 'var(--bg-card)',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '0.35rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                        border: `1px solid ${bar.color}40`,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {bar.percentage}%
                    </div>

                    {/* The Visual Bar */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 48,
                        height: `${heightPx}px`,
                        background: bar.gradient,
                        borderRadius: '0.45rem 0.45rem 0 0',
                        boxShadow: `0 4px 12px ${bar.color}35`,
                        transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                      }}
                      title={`${bar.label}: ${bar.percentage}% Score, ${bar.accuracy}% Accuracy`}
                      onClick={() => navigate(`/results/${bar.id}`)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom Labels Row */}
            <div style={{ display: 'flex', gap: '1rem', paddingLeft: '2rem', paddingTop: '0.75rem' }}>
              {chartBars.map((bar) => (
                <div
                  key={bar.id}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/results/${bar.id}`)}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={bar.label}
                  >
                    {bar.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {bar.date}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Insight Footer */}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.6rem',
                background: 'rgba(37, 99, 235, 0.05)',
                border: '1px solid rgba(37, 99, 235, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.76rem',
              }}
            >
              <span style={{ color: 'var(--text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Zap size={14} color="#2563EB" /> <strong>Trend Trajectory:</strong>
                {chartBars[chartBars.length - 1].percentage >= chartBars[0].percentage ? (
                  <span style={{ color: '#059669', fontWeight: 700 }}>
                    +{chartBars[chartBars.length - 1].percentage - chartBars[0].percentage}% net gain from Exam #1
                  </span>
                ) : (
                  <span style={{ color: '#D97706', fontWeight: 700 }}>
                    Fluctuating trajectory across subjects
                  </span>
                )}
              </span>
              <button
                onClick={() => navigate('/exams')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Attempt New Mock <ArrowRight size={12} />
              </button>
            </div>
          </section>

          {/* Right: Subject Mastery Matrix */}
          <section
            className="card fade-in"
            style={{
              padding: '1.35rem 1.4rem',
              borderRadius: '0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            aria-label="Subject Mastery Matrix"
          >
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '0.5rem',
                      background: '#F5F3FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpen size={18} color="#7C3AED" />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 800,
                        fontSize: '1.08rem',
                        color: 'var(--text)',
                        margin: 0,
                      }}
                    >
                      Subject Mastery Matrix
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Skill accuracy across disciplines
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    background: '#F3E8FF',
                    color: '#7C3AED',
                    borderRadius: '999px',
                  }}
                >
                  {subjectList.length} Subjects
                </span>
              </div>

              {/* Subject List with Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {subjectList.map((subj) => {
                  const isStrong = subj.accuracy >= 70;
                  const isModerate = subj.accuracy >= 50;
                  const color = isStrong ? '#059669' : isModerate ? '#D97706' : '#EF4444';
                  const bgTrack = isStrong ? '#D1FAE5' : isModerate ? '#FEF3C7' : '#FEE2E2';
                  const badgeText = isStrong ? 'Proficient' : isModerate ? 'Developing' : 'Needs Practice';

                  return (
                    <div
                      key={subj.name}
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: '0.65rem',
                        background: 'rgba(0,0,0,0.015)',
                        border: '1px solid var(--border)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>
                            {subj.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '999px',
                              background: bgTrack,
                              color: color,
                            }}
                          >
                            {badgeText}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: '0.86rem',
                              fontWeight: 800,
                              color: color,
                            }}
                          >
                            {subj.accuracy}%
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            ({subj.correct}/{subj.total})
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div
                        style={{
                          height: 6,
                          borderRadius: 999,
                          background: 'var(--border)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 999,
                            width: `${subj.accuracy}%`,
                            background: color,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct practice action footer */}
            <div
              style={{
                marginTop: '1rem',
                borderTop: '1px solid var(--border)',
                paddingTop: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Lowest scoring: <strong style={{ color: '#EF4444' }}>{worstSub}</strong>
              </div>
              <button
                onClick={() => navigate('/practice')}
                style={{
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  borderRadius: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Practice Weak Subjects <ArrowRight size={12} />
              </button>
            </div>
          </section>
        </div>

        {/* ── 4. AI Diagnostic Insights & Targeted Action Plan ── */}
        <section
          className="card fade-in"
          style={{
            borderRadius: '0.85rem',
            padding: '1.25rem 1.4rem',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(124,58,237,0.05) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
            gap: '1.25rem',
            alignItems: 'center',
          }}
          aria-label="AI Diagnostic Insights"
        >
          {/* Left: Weakness & Opportunity Directive */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: '#EDE9FE',
                  color: '#6D28D9',
                }}
              >
                <Brain size={12} /> AI Diagnostic Directive
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Targeting +12% Score Improvement
              </span>
            </div>

            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text)',
                margin: '0 0 0.4rem 0',
              }}
            >
              Focus Area: Strengthen {worstSub} & Speed Optimization
            </h3>

            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Your accuracy in <strong>{worstSub}</strong> is currently at its lowest. Key question errors stem from{' '}
              {allWeakTopics.slice(0, 3).map((t, idx) => (
                <span
                  key={t}
                  style={{
                    display: 'inline-block',
                    padding: '0.05rem 0.4rem',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    borderRadius: '0.3rem',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    marginRight: '0.3rem',
                    border: '1px solid #FECACA',
                  }}
                >
                  {t}
                </span>
              ))}
              . Practicing 15 targeted questions will raise your overall performance above the 75% threshold.
            </p>
          </div>

          {/* Right: Direct Action Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              justifyContent: 'center',
              background: 'var(--bg-card)',
              padding: '1rem 1.15rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>
                Recommended Action Plan
              </span>
              <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 700 }}>
                High Impact
              </span>
            </div>

            <button
              onClick={() => navigate('/practice')}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.55rem',
                padding: '0.6rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={15} /> Launch Targeted Practice Drills
            </button>

            <button
              onClick={() => navigate('/exams')}
              style={{
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '0.55rem',
                padding: '0.5rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCcw size={13} /> Retake Lowest Scoring Mock Exam
            </button>
          </div>
        </section>

        {/* ── 5. Detailed Examination History & Review (Restructured Table) ── */}
        <section
          className="card fade-in"
          style={{
            padding: '1.35rem 1.4rem',
            borderRadius: '0.85rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
          aria-label="Detailed Examination History"
        >
          {/* Header with Title and Filtering Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.85rem',
              marginBottom: '1.15rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '0.5rem',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardList size={18} color="#2563EB" />
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: 'var(--text)',
                    margin: 0,
                  }}
                >
                  Detailed Examination History
                </h2>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Showing {filteredAttempts.length} of {attempts.length} evaluated attempts
                </span>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {/* Search input */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Search
                  size={14}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.65rem' }}
                />
                <input
                  type="text"
                  placeholder="Filter by exam name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.35rem 0.65rem 0.35rem 2rem',
                    fontSize: '0.76rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    outline: 'none',
                    width: 180,
                  }}
                  aria-label="Filter exams by title"
                />
              </div>

              {/* Filter Pills: All / Passed / Review */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--bg)',
                  padding: '0.15rem',
                  borderRadius: '0.55rem',
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() => setFilterScore('all')}
                  style={{
                    background: filterScore === 'all' ? 'var(--bg-card)' : 'transparent',
                    color: filterScore === 'all' ? '#2563EB' : 'var(--text-muted)',
                    fontWeight: filterScore === 'all' ? 700 : 500,
                    border: 'none',
                    borderRadius: '0.4rem',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    boxShadow: filterScore === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  All ({attempts.length})
                </button>
                <button
                  onClick={() => setFilterScore('passed')}
                  style={{
                    background: filterScore === 'passed' ? 'var(--bg-card)' : 'transparent',
                    color: filterScore === 'passed' ? '#059669' : 'var(--text-muted)',
                    fontWeight: filterScore === 'passed' ? 700 : 500,
                    border: 'none',
                    borderRadius: '0.4rem',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    boxShadow: filterScore === 'passed' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  Passed ≥70%
                </button>
                <button
                  onClick={() => setFilterScore('review')}
                  style={{
                    background: filterScore === 'review' ? 'var(--bg-card)' : 'transparent',
                    color: filterScore === 'review' ? '#D97706' : 'var(--text-muted)',
                    fontWeight: filterScore === 'review' ? 700 : 500,
                    border: 'none',
                    borderRadius: '0.4rem',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    boxShadow: filterScore === 'review' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  Needs Review
                </button>
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                aria-label="Sort attempts"
              >
                <option value="date-desc">Newest First</option>
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }} role="table">
              <thead>
                <tr
                  style={{
                    borderBottom: '1.5px solid var(--border)',
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>Examination</th>
                  <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>Attempt Date</th>
                  <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>Score & Marks</th>
                  <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>Accuracy</th>
                  <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>Solving Speed</th>
                  <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <AlertTriangle size={24} color="#D97706" style={{ marginBottom: '0.4rem', display: 'inline-block' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>No examination attempts match your search</div>
                      <button
                        onClick={() => { setSearchQuery(''); setFilterScore('all'); }}
                        style={{
                          marginTop: '0.6rem',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          borderRadius: '0.45rem',
                          padding: '0.3rem 0.75rem',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((a) => {
                    const isPassed = a.percentage >= 70;
                    const isModerate = a.percentage >= 50;
                    const scoreColor = isPassed ? '#059669' : isModerate ? '#D97706' : '#EF4444';
                    const scoreBg = isPassed ? '#ECFDF5' : isModerate ? '#FFFBEB' : '#FEF2F2';
                    const scoreBorder = isPassed ? '#A7F3D0' : isModerate ? '#FDE68A' : '#FECACA';

                    // Parse exam category tag
                    const category = a.examTitle.split('—')[0].trim();
                    const subTitle = a.examTitle.includes('—') ? a.examTitle.split('—')[1].trim() : '';

                    return (
                      <tr
                        key={a.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 0.15s ease',
                        }}
                        className="table-row-hover"
                      >
                        {/* Exam Title & Tag */}
                        <td style={{ padding: '0.85rem 0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '0.35rem',
                                background: '#EFF6FF',
                                color: '#1D4ED8',
                                border: '1px solid #BFDBFE',
                                textTransform: 'uppercase',
                                flexShrink: 0,
                              }}
                            >
                              {category}
                            </span>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>
                                {subTitle || category}
                              </div>
                              {a.weakTopics && a.weakTopics.length > 0 && (
                                <div style={{ fontSize: '0.68rem', color: '#DC2626', marginTop: '0.2rem' }}>
                                  Review topics: {a.weakTopics.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Attempt Date */}
                        <td style={{ padding: '0.85rem 0.8rem', color: 'var(--text-muted)' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {new Date(a.submittedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {new Date(a.submittedAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Score & Marks */}
                        <td style={{ padding: '0.85rem 0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                background: scoreBg,
                                color: scoreColor,
                                border: `1px solid ${scoreBorder}`,
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                fontFamily: "'Outfit', sans-serif",
                              }}
                            >
                              {a.percentage}%
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {a.score}/{a.maxScore} pts
                            </span>
                          </div>
                        </td>

                        {/* Accuracy */}
                        <td style={{ padding: '0.85rem 0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <div
                              style={{
                                width: 36,
                                height: 5,
                                borderRadius: 999,
                                background: 'var(--border)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${a.accuracy}%`,
                                  background: a.accuracy >= 70 ? '#10B981' : '#F59E0B',
                                }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.8rem' }}>
                              {a.accuracy}%
                            </span>
                          </div>
                        </td>

                        {/* Speed */}
                        <td style={{ padding: '0.85rem 0.8rem', color: 'var(--text-muted)' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              color: 'var(--text)',
                            }}
                          >
                            <Clock size={13} color="var(--text-muted)" /> {a.avgTimePerQ}s / Q
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 0.8rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                            <button
                              onClick={() => navigate(`/results/${a.id}`)}
                              style={{
                                background: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #DBEAFE',
                                borderRadius: '0.45rem',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                transition: 'all 0.15s ease',
                              }}
                              title="View questions and step-by-step solutions"
                            >
                              Review <ArrowRight size={12} />
                            </button>

                            <button
                              onClick={() => navigate(`/exam/${a.examId}`)}
                              style={{
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border)',
                                borderRadius: '0.45rem',
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.15s ease',
                              }}
                              title="Retake this mock examination"
                            >
                              <RotateCcw size={12} /> Retake
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
