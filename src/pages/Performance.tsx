import React, { useEffect } from 'react';
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
  Clock,
  Award,
  Sparkles,
  Volume2
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { MOCK_ATTEMPTS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { speechService } from '../services/speechService';
import { usePageVoice } from '../hooks/usePageVoice';

export default function Performance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const attempts = MOCK_ATTEMPTS;

  useEffect(() => {
    document.title = 'Performance Analytics — SIGHT-EXAM AI';
  }, []);

  const BAR_MAX = 100;
  const chartBars = attempts.map(a => ({
    label: a.examTitle.split('—')[0].trim(),
    fullName: a.examTitle,
    percentage: a.percentage,
    color: a.percentage >= 70 ? '#059669' : a.percentage >= 50 ? '#D97706' : '#EF4444',
  }));

  const avg = Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / (attempts.length || 1));
  const best = Math.max(...attempts.map(a => a.percentage));
  const totalCorrect = attempts.reduce((s, a) => s + Math.round(a.score / 2), 0);
  const totalQs = attempts.reduce((s, a) => s + Math.round(a.maxScore / 2), 0);
  const accuracy = Math.round((totalCorrect / (totalQs || 1)) * 100);

  // Subject aggregation
  const subjectAgg: Record<string, { correct: number; total: number }> = {};
  attempts.forEach(a => {
    a.subjectBreakdown.forEach(s => {
      if (!subjectAgg[s.subject]) subjectAgg[s.subject] = { correct: 0, total: 0 };
      subjectAgg[s.subject].correct += s.correct;
      subjectAgg[s.subject].total += s.total;
    });
  });

  const spokenSummary = `Performance Overview. You have completed ${attempts.length} exams. Your average score is ${avg} percent, and your personal best is ${best} percent. Overall question accuracy is ${accuracy} percent.`;

  const subjectList = Object.entries(subjectAgg).map(([name, data]) => ({
    name,
    accuracy: Math.round((data.correct / (data.total || 1)) * 100),
  }));
  subjectList.sort((a, b) => b.accuracy - a.accuracy);
  const bestSub = subjectList[0]?.name || 'Quantitative Aptitude';
  const worstSub = subjectList[subjectList.length - 1]?.name || 'History';

  usePageVoice('Performance', [
    {
      triggers: ['score', 'average score', 'marks', 'kitna score', 'mera score'],
      answer: () => `Aapka overall average score ${avg} percent hai, aur personal best ${best} percent raha hai.`,
    },
    {
      triggers: ['best score', 'highest score', 'top score'],
      answer: () => `Aapka highest score ${best} percent hai.`,
    },
    {
      triggers: ['accuracy', 'accuracy kitni', 'sahi percentage'],
      answer: () => `Aapki total question accuracy ${accuracy} percent hai.`,
    },
    {
      triggers: ['kitne exam', 'kitne test', 'total test', 'kitne mock test', 'kitne diye'],
      answer: () => `Aapne kul ${attempts.length} mock examinations complete kiye hain.`,
    },
    {
      triggers: ['best subject', 'strong subject', 'achha subject', 'strength'],
      answer: () => `Aapka sabse strong subject ${bestSub} hai. Isme aapki accuracy best hai.`,
    },
    {
      triggers: ['weak subject', 'kamjor subject', 'weakness', 'kisme kam marks'],
      answer: () => `Aapka weakest subject ${worstSub} hai. Isme aapko practice badhani chahiye.`,
    },
    {
      triggers: ['summary', 'batao', 'overview', 'haal'],
      answer: () => spokenSummary,
    },
    {
      triggers: ['practice', 'abhyas', 'start practice'],
      answer: () => 'Practice section open kiya ja raha hai.',
      action: () => navigate('/practice'),
    },
  ]);

  return (
    <AppLayout title="Performance">
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        {/* ── 1. Hero Analytics Banner (Compact) ── */}
        <div
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #4F46E5 100%)',
            borderRadius: '0.85rem',
            padding: '0.85rem 1.25rem',
            color: '#fff',
            marginBottom: '1.25rem',
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
              <Sparkles size={18} />
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
                Performance & Accuracy Diagnostics
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
                Analytics
              </span>
            </div>
          </div>

          <button
            onClick={() => speechService.speak(spokenSummary, { priority: true })}
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
            aria-label="Read performance summary aloud"
          >
            <Volume2 size={15} /> Spoken Summary (R)
          </button>
        </div>

        {/* ── 2. Metric Stat Cards Row ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Card 1 */}
          <div
            className="card card-interactive fade-in"
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '0.6rem',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={20} color="#2563EB" />
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: '#F0FDF4',
                  color: '#16A34A',
                }}
              >
                Total Attempted
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  marginBottom: '0.2rem',
                }}
              >
                {attempts.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Examinations Completed
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div
            className="card card-interactive fade-in"
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '0.6rem',
                  background: '#F5F3FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 size={20} color="#7C3AED" />
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: '#F5F3FF',
                  color: '#7C3AED',
                }}
              >
                Average Performance
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  marginBottom: '0.2rem',
                }}
              >
                {avg}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Average Overall Score
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div
            className="card card-interactive fade-in"
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '0.6rem',
                  background: '#F0FDF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trophy size={20} color="#16A34A" />
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: '#F0FDF4',
                  color: '#16A34A',
                }}
              >
                Personal Best
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  marginBottom: '0.2rem',
                }}
              >
                {best}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Highest Mock Score
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div
            className="card card-interactive fade-in"
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '0.6rem',
                  background: '#FFF7ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={20} color="#EA580C" />
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: '#FFF7ED',
                  color: '#EA580C',
                }}
              >
                {totalCorrect}/{totalQs} Correct
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  marginBottom: '0.2rem',
                }}
              >
                {accuracy}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Overall Accuracy Rate
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Two-Column Analytics Layout ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Left: Score Trajectory Bar Chart */}
          <div
            className="card fade-in"
            style={{
              padding: '1.5rem',
              borderRadius: '0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} color="#2563EB" />
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                  Score Progression Trajectory
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Avg: <strong style={{ color: '#2563EB' }}>{avg}%</strong>
              </span>
            </div>

            {/* Bars container */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem', height: 160, paddingBottom: '0.5rem' }}>
              {chartBars.map((bar, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: bar.color }}>
                    {bar.percentage}%
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 48,
                      background: bar.color,
                      borderRadius: '0.4rem 0.4rem 0 0',
                      height: `${(bar.percentage / BAR_MAX) * 125}px`,
                      transition: 'height 0.8s ease',
                      boxShadow: `0 2px 8px ${bar.color}35`,
                    }}
                    aria-label={`${bar.fullName}: ${bar.percentage}%`}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '0.65rem' }}>
              {chartBars.map((bar, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bar.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Subject Mastery Breakdown */}
          <div
            className="card fade-in"
            style={{
              padding: '1.5rem',
              borderRadius: '0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <BookOpen size={20} color="#7C3AED" />
              <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                Subject Mastery Distribution
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(subjectAgg).map(([subj, data]) => {
                const pct = Math.round((data.correct / (data.total || 1)) * 100);
                const color = pct >= 70 ? '#059669' : pct >= 50 ? '#D97706' : '#EF4444';
                return (
                  <div key={subj}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
                        {subj}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color }}>
                        {pct}% ({data.correct}/{data.total})
                      </span>
                    </div>
                    <div
                      style={{
                        height: 7,
                        borderRadius: 999,
                        background: '#E2E8F0',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 999,
                          width: `${pct}%`,
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
        </div>

        {/* ── 4. Detailed History Table ── */}
        <div
          className="card fade-in"
          style={{
            padding: '1.5rem',
            borderRadius: '0.85rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={20} color="#2563EB" />
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
                Detailed Examination History
              </h2>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Showing {attempts.length} evaluated attempts
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }} role="table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>EXAMINATION</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>ATTEMPT DATE</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>SCORE</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>ACCURACY</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>SPEED</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(a => {
                  const scoreColor = a.percentage >= 70 ? '#059669' : a.percentage >= 50 ? '#D97706' : '#EF4444';
                  const scoreBg = a.percentage >= 70 ? '#ECFDF5' : a.percentage >= 50 ? '#FFFBEB' : '#FEF2F2';
                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                        {a.examTitle}
                      </td>
                      <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(a.submittedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '0.85rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            background: scoreBg,
                            color: scoreColor,
                            fontWeight: 800,
                            fontSize: '0.8rem',
                          }}
                        >
                          {a.percentage}%
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                        {a.accuracy}%
                      </td>
                      <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={12} /> {a.avgTimePerQ}s / Q
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                        <button
                          onClick={() => navigate(`/results/${a.id}`)}
                          style={{
                            background: '#EFF6FF',
                            color: '#2563EB',
                            border: '1px solid #DBEAFE',
                            borderRadius: '0.5rem',
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          Review Solution <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
