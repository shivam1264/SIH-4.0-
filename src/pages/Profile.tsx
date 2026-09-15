import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  BarChart3,
  Bot,
  Calendar,
  Target,
  BookOpen,
  Edit3,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { usePageVoice } from '../hooks/usePageVoice';
import { MOCK_ATTEMPTS, EXAMS, AI_RECOMMENDATIONS } from '../data/mockData';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prefs } = useAccessibility();
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(user?.name ?? '');

  useEffect(() => {
    document.title = 'Profile — SIGHT-EXAM AI';
  }, []);

  const attempts = MOCK_ATTEMPTS;
  const avg = Math.round(
    attempts.reduce((s, a) => s + a.percentage, 0) / (attempts.length || 1)
  );

  usePageVoice('Profile', [
    {
      triggers: ['name', 'naam', 'mera naam', 'candidate name'],
      answer: () => `Aapka registered naam ${name || user?.name || 'Candidate'} hai.`,
    },
    {
      triggers: ['email', 'mera email', 'mail id'],
      answer: () => `Aapka email address ${user?.email || 'shivam@example.com'} hai.`,
    },
    {
      triggers: ['target exam', 'target', 'lakshya', 'kis exam ki taiyari'],
      answer: () => `Aapke target exams ${user?.examInterests?.join(', ') || 'SSC CGL, Banking PO aur Railways'} hain.`,
    },
    {
      triggers: ['disability', 'accommodation', 'suvidha', 'extra time'],
      answer: () => `Aapke profile me visual accessibility modes aur speech guidance support active hai.`,
    },
    {
      triggers: ['score', 'average score', 'performance', 'level'],
      answer: () => `Aapka average score ${avg} percent hai. Aapne ${attempts.length} exams complete kiye hain.`,
    },
    {
      triggers: ['settings', 'accessibility settings', 'preference'],
      answer: () => 'Accessibility settings kholi ja rahi hain.',
      action: () => navigate('/settings'),
    },
  ]);

  return (
    <AppLayout title="Profile">
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        {/* Page title line */}
        <div style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1.6rem',
                fontWeight: 900,
                color: 'var(--text)',
                lineHeight: 1.2,
              }}
            >
              Candidate Profile & Overview
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Manage your personal details, target exams, and monitor academic progress.
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate('/settings')}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
          >
            Accessibility Settings →
          </button>
        </div>

        {/* 2-Column Zero-Scroll Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)',
            gap: '1.25rem',
            alignItems: 'stretch',
          }}
        >
          {/* Left Column: Candidate Identity & Preferences */}
          <div
            className="card fade-in"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              {/* Avatar + Main Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.65rem',
                    color: '#fff',
                    fontWeight: 900,
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                  }}
                  aria-hidden="true"
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editName ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        className="input-field"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.9rem' }}
                        aria-label="Edit your name"
                        autoFocus
                      />
                      <button
                        className="btn-primary"
                        onClick={() => setEditName(false)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h2
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {name}
                      </h2>
                      <button
                        className="btn-ghost"
                        onClick={() => setEditName(true)}
                        aria-label="Edit name"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', color: 'var(--primary)' }}
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </p>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-blue" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                      {user?.role}
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                      WCAG Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Exam Interests */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  padding: '0.9rem',
                  borderRadius: '0.6rem',
                  border: '1px solid var(--border)',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700,
                    fontSize: '0.825rem',
                    color: 'var(--text)',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Target size={14} color="var(--primary)" />
                  <span>Target Exam Categories</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {user?.examInterests?.map(e => (
                    <span
                      key={e}
                      className="badge"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {/* System Info List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                  <span>Voice Navigation:</span>
                  <strong style={{ color: prefs.voiceMode ? 'var(--accent)' : 'var(--text)' }}>
                    {prefs.voiceMode ? 'Active (ON)' : 'Muted (Press V)'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                  <span>Current Theme:</span>
                  <strong style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{prefs.theme}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                  <span>Text Size:</span>
                  <strong style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{prefs.fontSize}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                  <span>Member Since:</span>
                  <strong style={{ color: 'var(--text)' }}>
                    {new Date(user?.createdAt ?? '').toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              </div>
            </div>

            <button
              className="btn-secondary"
              onClick={() => navigate('/settings')}
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: '0.8rem',
                padding: '0.55rem',
              }}
            >
              Update Preferences
            </button>
          </div>

          {/* Right Column: Performance KPIs & Quick Exam Access */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top 3 Compact Stat Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.85rem',
              }}
            >
              <div
                className="card card-interactive fade-in"
                style={{
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '0.5rem',
                    background: '#2563EB15',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>
                    {attempts.length}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Exams Attempted
                  </div>
                </div>
              </div>

              <div
                className="card card-interactive fade-in"
                style={{
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '0.5rem',
                    background: '#05966915',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BarChart3 size={20} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: '#059669', lineHeight: 1.1 }}>
                    {avg}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Average Score
                  </div>
                </div>
              </div>

              <div
                className="card card-interactive fade-in"
                style={{
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '0.5rem',
                    background: '#7C3AED15',
                    color: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: '#7C3AED', lineHeight: 1.1 }}>
                    {AI_RECOMMENDATIONS.length}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    AI Focus Drills
                  </div>
                </div>
              </div>
            </div>

            {/* Available Mock Tests List (Compact, zero-overflow) */}
            <div
              className="card fade-in"
              style={{
                padding: '1.25rem 1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={18} color="var(--primary)" />
                  <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                    Ready Mock Examinations
                  </h2>
                </div>
                <button
                  className="btn-ghost"
                  onClick={() => navigate('/exams')}
                  style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}
                >
                  View All Exams →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {EXAMS.map(e => (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-surface)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {e.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span>{e.totalQuestions} Questions</span>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={11} /> {e.durationMinutes} min
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                      <span
                        className={`badge badge-${
                          e.difficulty === 'Easy'
                            ? 'green'
                            : e.difficulty === 'Medium'
                            ? 'amber'
                            : 'red'
                        }`}
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                      >
                        {e.difficulty}
                      </span>
                      <button
                        className="btn-primary"
                        onClick={() => navigate(`/exam/${e.id}`)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.75rem',
                          gap: '0.3rem',
                        }}
                        aria-label={`Start ${e.title}`}
                      >
                        <Play size={11} fill="currentColor" /> Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
