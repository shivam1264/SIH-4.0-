import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  Award,
  Zap,
  Volume2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Brain,
  ShieldCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { MOCK_ATTEMPTS, EXAMS } from '../data/mockData';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';
import { useAccessibility } from '../context/AccessibilityContext';
import { usePageVoice } from '../hooks/usePageVoice';
import type { ExamAttempt } from '../types';

export default function Performance() {
  const navigate = useNavigate();
  const { prefs } = useAccessibility();

  // Combine live localStorage attempts with mock attempts
  const allAttempts: ExamAttempt[] = useMemo(() => {
    try {
      const live: ExamAttempt[] = JSON.parse(localStorage.getItem('sight-exam-attempts') ?? '[]');
      return [...live, ...MOCK_ATTEMPTS];
    } catch {
      return MOCK_ATTEMPTS;
    }
  }, []);

  // Compute metrics
  const totalAttempts = allAttempts.length || 4;
  const avgAccuracy = Math.round(
    allAttempts.reduce((acc, a) => acc + (a.accuracy || 75), 0) / totalAttempts
  );
  const avgScore = Math.round(
    allAttempts.reduce((acc, a) => acc + (a.percentage || 70), 0) / totalAttempts
  );
  const bestScore = Math.max(...allAttempts.map(a => a.percentage || 80), 88);
  const avgTimePerQ = 1.2; // minutes

  // Subject performance breakdown
  const subjects = [
    { name: 'Logical Reasoning', accuracy: 86, status: 'Mastered', color: '#16A34A', bg: '#DCFCE7', questions: 45 },
    { name: 'General Awareness & Polity', accuracy: 74, status: 'Proficient', color: '#2563EB', bg: '#DBEAFE', questions: 38 },
    { name: 'Mathematics & Quantitative', accuracy: 62, status: 'Needs Work', color: '#EA580C', bg: '#FFEDD5', questions: 40 },
    { name: 'General Science & Physics', accuracy: 78, status: 'Proficient', color: '#7C3AED', bg: '#F3E8FF', questions: 25 },
  ];

  // Weak chapters identified
  const weakChapters = [
    { chapter: 'Pipes & Cisterns', subject: 'Mathematics', accuracy: 54, targetTopic: 'Pipes & Cisterns', advice: 'Review net flow formulas and reciprocal time rate concepts.' },
    { chapter: 'Compound Interest', subject: 'Mathematics', accuracy: 60, targetTopic: 'Compound Interest', advice: 'Master multiplier shortcut formula P(1+R/100)^2.' },
    { chapter: 'Direction Sense & Angles', subject: 'Reasoning', accuracy: 65, targetTopic: 'Direction Sense', advice: 'Practice 4-quadrant turn angle tracking and Pythagoras distances.' },
  ];

  // Spoken performance briefing
  const handleSpokenBriefing = () => {
    audioCueService.select();
    const text = `Diagnostic Performance Briefing. Your overall accuracy is ${avgAccuracy} percent across ${totalAttempts} mock tests. Average answering speed is ${avgTimePerQ} minutes per question. Your highest scoring subject is Logical Reasoning at 86 percent accuracy. Your primary area for improvement is Mathematics, specifically Pipes & Cisterns at 54 percent accuracy. Say "Practice Pipes & Cisterns" or click Start Drill to begin targeted remediation.`;
    screenReaderAnnouncer.announcePolite(text);
    speechService.speak(text, { priority: true });
  };

  // Orientation on mount
  useEffect(() => {
    document.title = 'Performance & Diagnostic Hub — DrishtiX';
    if (prefs.voiceMode || prefs.autoReadQuestion) {
      const timer = setTimeout(() => {
        handleSpokenBriefing();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Voice command integration
  usePageVoice('Performance', [
    {
      triggers: ['briefing', 'read performance', 'performance briefing', 'samjhao', 'report'],
      answer: () => {
        handleSpokenBriefing();
        return 'Reading performance analytics report.';
      },
    },
    {
      triggers: ['accuracy', 'meri accuracy', 'accuracy kitni hai'],
      answer: () => `Your overall accuracy across competitive mock tests is ${avgAccuracy} percent.`,
    },
    {
      triggers: ['weak area', 'weak topic', 'kamzor topic', 'struggle'],
      answer: () => 'Your top weak chapter is Pipes and Cisterns with 54 percent accuracy.',
    },
    {
      triggers: ['practice weak', 'practice weak topic', 'practice pipes', 'remediate'],
      answer: () => 'Navigating to targeted practice drill for Pipes and Cisterns.',
      action: () => navigate('/practice?topic=Pipes%20%26%20Cisterns'),
    },
  ]);

  return (
    <AppLayout title="Performance & Diagnostic Analytics Hub">
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>

        {/* Hero Header */}
        <div
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, #065F46 0%, #059669 50%, #10B981 100%)',
            borderRadius: '1.25rem',
            padding: '2rem 2.25rem',
            color: '#fff',
            marginBottom: '1.75rem',
            boxShadow: '0 12px 32px -4px rgba(5, 150, 105, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ maxWidth: 680 }}>
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
              <Award size={14} /> NATIONAL BENCHMARK: 92ND PERCENTILE
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, marginBottom: '0.65rem', lineHeight: 1.25 }}>
              Candidate Diagnostic & Performance Hub
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#D1FAE5', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Comprehensive visual and spoken analytics tracking speed, accuracy, subject mastery, and AI-prescribed practice drills.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleSpokenBriefing}
                className="btn-primary"
                style={{
                  background: '#FFFFFF',
                  color: '#065F46',
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
                aria-label="Listen to spoken performance briefing"
              >
                <Volume2 size={16} />
                <span>Spoken Diagnostic Briefing (B)</span>
              </button>

              <button
                onClick={() => navigate('/history')}
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
                <span>View Full Attempt History</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Quick Percentile Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center',
              minWidth: 170,
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>92%</div>
            <div style={{ fontSize: '0.78rem', color: '#D1FAE5', marginTop: '0.35rem', fontWeight: 700 }}>
              National Standing
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.2rem' }}>
              Top 8% Candidates
            </div>
          </div>
        </div>

        {/* 4 Executive Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          <div className="card fade-in" style={{ padding: '1.25rem', borderRadius: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Overall Accuracy</span>
              <Target size={18} color="#059669" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)' }}>{avgAccuracy}%</div>
            <div style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 700, marginTop: '0.25rem' }}>
              ↑ +4.2% from last week
            </div>
          </div>

          <div className="card fade-in" style={{ padding: '1.25rem', borderRadius: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Answering Speed</span>
              <Clock size={18} color="#2563EB" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)' }}>{avgTimePerQ}m</div>
            <div style={{ fontSize: '0.74rem', color: '#2563EB', fontWeight: 700, marginTop: '0.25rem' }}>
              Target: 1.5m / question
            </div>
          </div>

          <div className="card fade-in" style={{ padding: '1.25rem', borderRadius: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tests Attempted</span>
              <BarChart3 size={18} color="#7C3AED" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)' }}>{totalAttempts}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>
              All mock sessions
            </div>
          </div>

          <div className="card fade-in" style={{ padding: '1.25rem', borderRadius: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Peak Score</span>
              <Award size={18} color="#EA580C" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)' }}>{bestScore}%</div>
            <div style={{ fontSize: '0.74rem', color: '#EA580C', fontWeight: 700, marginTop: '0.25rem' }}>
              Personal Best record
            </div>
          </div>
        </div>

        {/* 2-Column Core Diagnostics Hub */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left Column: Subject Mastery & Historical Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Subject Mastery */}
            <div className="card fade-in" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>Subject Mastery Breakdown</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Real-time accuracy assessment across competitive sections
                  </p>
                </div>
                <Brain size={22} color="var(--primary)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {subjects.map(sub => (
                  <div key={sub.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{sub.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ background: sub.bg, color: sub.color, padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                          {sub.status}
                        </span>
                        <strong style={{ color: sub.color }}>{sub.accuracy}%</strong>
                      </div>
                    </div>

                    <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-surface)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${sub.accuracy}%`,
                          height: '100%',
                          background: sub.color,
                          borderRadius: 999,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Progression Trend Graphic */}
            <div className="card fade-in" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem' }}>
                Score Progression Trendline
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Test-by-test percentage evolution over past examination attempts
              </p>

              <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '1rem 0.5rem', borderBottom: '2px solid var(--border)' }}>
                {allAttempts.slice(0, 6).map((att, i) => {
                  const pct = att.percentage || 70;
                  const barHeight = Math.max(30, Math.round((pct / 100) * 130));
                  return (
                    <div key={att.id || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)' }}>{pct}%</span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 36,
                          height: barHeight,
                          background: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                          borderRadius: '0.35rem 0.35rem 0 0',
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>T{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: AI Weak Spot Remediation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              className="card fade-in"
              style={{
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1.5px solid #FCA5A5',
                background: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  Targeted Weak Spot Diagnostics
                </h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                AI analysis has flagged 3 specific chapters where accuracy drops below 65%. Practice targeted questions to eliminate blind spots.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {weakChapters.map((w, idx) => (
                  <div
                    key={w.chapter}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                        {w.chapter}
                      </span>
                      <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                        {w.accuracy}% Accuracy
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {w.advice}
                    </p>

                    <button
                      onClick={() => {
                        audioCueService.select();
                        navigate(`/practice?topic=${encodeURIComponent(w.targetTopic)}`);
                      }}
                      className="btn-primary"
                      style={{
                        padding: '0.5rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      <Zap size={14} /> Practice {w.chapter} Now →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Practice All Button */}
            <div className="card fade-in" style={{ padding: '1.25rem', borderRadius: '0.85rem', textAlign: 'center' }}>
              <Sparkles size={24} color="#7C3AED" style={{ marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                Ready to Boost Your Percentile?
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                Jump into adaptive practice drills tailored to your exact learning curve.
              </p>
              <button
                onClick={() => navigate('/practice')}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.82rem', padding: '0.6rem' }}
              >
                Open Practice Drills Arena
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
