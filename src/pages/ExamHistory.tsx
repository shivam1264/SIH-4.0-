import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Award,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Square,
  Search,
  RotateCcw,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  ShieldCheck,
  Mic,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { attemptsApi } from '../services/api';
import { speechService } from '../services/speechService';
import type { CandidateAttemptLog } from '../types';

export default function ExamHistory() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<CandidateAttemptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    loadAttempts();
  }, []);

  async function loadAttempts() {
    setLoading(true);
    try {
      const data = await attemptsApi.getAll();
      setAttempts(data);
    } catch (err) {
      console.warn('Failed to load attempts:', err);
    } finally {
      setLoading(false);
    }
  }

  function handlePlayAudio(item: CandidateAttemptLog) {
    if (speakingId === item.id) {
      speechService.stop();
      setSpeakingId(null);
      return;
    }

    speechService.stop();
    setSpeakingId(item.id);

    const timeMin = Math.round(item.timeSpentSeconds / 60);
    const narration = `Exam Attempt Record for ${item.examTitle}. Submitted on ${item.submittedAt}. Score: ${item.score} out of ${item.maxScore}, giving ${item.percentage} percent. Status: ${item.status}. Time taken: ${timeMin} minutes. Voice commands registered: ${item.audioAlertsCount}.`;

    speechService.speak(narration, {
      priority: true,
      onEnd: () => setSpeakingId(null),
    });
  }

  const filteredAttempts = useMemo(() => {
    return attempts.filter(item => {
      const matchesStatus =
        statusFilter === 'All' ||
        item.status.toLowerCase().includes(statusFilter.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.examTitle.toLowerCase().includes(q) ||
        (item.studentRoll && item.studentRoll.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [attempts, statusFilter, searchQuery]);

  // Aggregate stats
  const totalAttempts = attempts.length;
  const avgScore = totalAttempts ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts) : 0;
  const totalVoiceCmds = attempts.reduce((sum, a) => sum + (a.audioAlertsCount || 0), 0);
  const passedCount = attempts.filter(a => a.percentage >= 40).length;

  return (
    <AppLayout title="Exam History">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Banner */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '0.6rem',
                  background: 'linear-gradient(135deg, #059669, #10B981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Clock size={20} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                Exam History & Previous Attempts
              </h1>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 700 }}>
              Verify past mock test attempts, review question solutions, check time allocations, and listen to voice-assisted score breakdowns.
            </p>
          </div>

          <button
            onClick={() => navigate('/exams')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '0.6rem',
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
            <span>Take New Mock Test</span>
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="card card-interactive card-fade-blue" style={{ padding: '1.25rem', borderRadius: '0.85rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Total Exams Attempted
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
              {totalAttempts}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16A34A', marginTop: '0.2rem', fontWeight: 600 }}>
              {passedCount} qualified / passed
            </div>
          </div>

          <div className="card card-interactive card-fade-amber" style={{ padding: '1.25rem', borderRadius: '0.85rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Average Performance
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: avgScore >= 70 ? '#16A34A' : '#D97706' }}>
              {avgScore}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Based on all recorded submissions
            </div>
          </div>

          <div className="card card-interactive card-fade-purple" style={{ padding: '1.25rem', borderRadius: '0.85rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Voice Interactions Used
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#9333EA' }}>
              {totalVoiceCmds}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Speech recognition commands verified
            </div>
          </div>

          <div className="card card-interactive card-fade-emerald" style={{ padding: '1.25rem', borderRadius: '0.85rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
              PwD Accommodation Status
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
              <ShieldCheck size={20} />
              Compensatory Active
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Extra time & screen reader verified
            </div>
          </div>
        </div>

        {/* Controls: Search and Status */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 500 }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search previous attempts by exam title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                borderRadius: '0.65rem',
                border: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(8px)',
                color: 'var(--text)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              aria-label="Search exam attempts"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['All', 'Completed', 'Flagged'].map(status => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: active ? 700 : 500,
                    border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: active ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(6px)',
                    color: active ? '#fff' : 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Attempt Records List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading candidate attempt records...
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Clock size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <h3 style={{ margin: 0, color: 'var(--text)' }}>No exam attempts found</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              You haven't attempted any mock examinations matching these filters yet.
            </p>
            <button
              onClick={() => navigate('/exams')}
              style={{
                marginTop: '0.5rem',
                padding: '0.55rem 1.2rem',
                borderRadius: '0.5rem',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Browse Available Exams
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredAttempts.map(item => {
              const isSpeaking = speakingId === item.id;
              const minutes = Math.round(item.timeSpentSeconds / 60);
              const isPassed = item.percentage >= 40;

              return (
                <div
                  key={item.id}
                  className="card card-interactive"
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: '1rem',
                    border: isSpeaking ? '2px solid #059669' : '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.2rem',
                    boxShadow: isSpeaking ? '0 6px 20px rgba(5,150,105,0.15)' : undefined,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Left info */}
                  <div style={{ minWidth: 280, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.3rem',
                          background: isPassed ? '#DCFCE7' : '#FEE2E2',
                          color: isPassed ? '#16A34A' : '#DC2626',
                        }}
                      >
                        {item.status}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.submittedAt}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
                      {item.examTitle}
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} />
                        <span>{minutes} mins spent</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Mic size={14} />
                        <span>{item.audioAlertsCount} voice commands</span>
                      </div>
                      {item.studentRoll && (
                        <div>
                          <span>Roll: {item.studentRoll}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      background: 'rgba(0,0,0,0.02)',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Raw Score</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                        {item.score} / {item.maxScore}
                      </div>
                    </div>
                    <div style={{ height: 28, width: 1, background: 'var(--border)' }} />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Accuracy</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isPassed ? '#16A34A' : '#DC2626' }}>
                        {item.percentage}%
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      onClick={() => handlePlayAudio(item)}
                      style={{
                        padding: '0.55rem 0.85rem',
                        borderRadius: '0.55rem',
                        border: '1px solid var(--border)',
                        background: isSpeaking ? '#ECFDF5' : 'var(--card-bg)',
                        color: isSpeaking ? '#059669' : 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                      }}
                      aria-label={isSpeaking ? 'Stop audio' : `Listen to score summary for ${item.examTitle}`}
                    >
                      {isSpeaking ? <Square size={14} fill="#059669" /> : <Volume2 size={14} />}
                      <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate(`/results/${item.id}`);
                      }}
                      style={{
                        padding: '0.55rem 1rem',
                        borderRadius: '0.55rem',
                        border: 'none',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={14} />
                      <span>Review Solutions</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
