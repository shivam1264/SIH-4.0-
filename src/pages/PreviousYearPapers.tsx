import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Calendar,
  Layers,
  Volume2,
  Square,
  Play,
  Search,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  Filter,
  X,
  Zap,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { pyqsApi } from '../services/api';
import { speechService } from '../services/speechService';
import { usePageVoice } from '../hooks/usePageVoice';
import type { PYQPaper } from '../types';

export default function PreviousYearPapers() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<PYQPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedPaperModal, setSelectedPaperModal] = useState<PYQPaper | null>(null);

  // Speech Narration state
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    loadPapers();
  }, []);

  async function loadPapers() {
    setLoading(true);
    try {
      const data = await pyqsApi.getAll();
      setPapers(data);
    } catch (err) {
      console.warn('Failed to load PYQs:', err);
    } finally {
      setLoading(false);
    }
  }

  function handlePlayAudio(item: PYQPaper) {
    if (speakingId === item.id) {
      speechService.stop();
      setSpeakingId(null);
      return;
    }

    speechService.stop();
    setSpeakingId(item.id);

    const narration = item.audioSummaryText || `${item.title}. Exam: ${item.examName}. Year: ${item.year}. Shift: ${item.shift || 'General'}. Topics covered: ${item.topicsCovered.join(', ')}. Difficulty: ${item.difficulty}. Duration: ${item.durationMinutes} minutes.`;
    speechService.speak(narration, {
      priority: true,
      onEnd: () => setSpeakingId(null),
    });
  }

  const filteredPapers = useMemo(() => {
    return papers.filter(item => {
      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesYear =
        selectedYear === 'All' ||
        String(item.year) === selectedYear;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.examName.toLowerCase().includes(q) ||
        item.topicsCovered.some(t => t.toLowerCase().includes(q));

      return matchesCategory && matchesYear && matchesSearch;
    });
  }, [papers, selectedCategory, selectedYear, searchQuery]);

  // Universal Keyboard Accessibility in Previous Year Papers
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key, 10) - 1;
        const target = filteredPapers[idx];
        if (target) {
          e.preventDefault();
          navigate(`/exam/${target.linkedExamId || 'ssc-reasoning-01'}`);
        }
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (filteredPapers.length > 0) {
          handlePlayAudio(filteredPapers[0]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate('/dashboard');
        return;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filteredPapers]);

  const categories = ['All', 'SSC', 'UPSC', 'Banking', 'Railway'];
  const years = ['All', '2024', '2023', '2022'];

  usePageVoice('PreviousYearPapers', [
    {
      triggers: ['start paper', 'start pyq', 'attempt paper', 'start past year paper', 'start exam'],
      answer: () => 'Starting previous year paper mock examination.',
      action: () => navigate('/exam/ssc-reasoning-01'),
    },
    {
      triggers: ['listen to paper', 'listen', 'play paper audio', 'audio summary'],
      answer: () => {
        if (papers.length > 0) {
          handlePlayAudio(papers[0]);
          return '';
        }
        return 'No previous year papers available to narrate.';
      },
    },
    {
      triggers: ['show ssc papers', 'filter ssc', 'ssc pyq', 'ssc papers'],
      answer: () => 'Filtering by SSC previous year question papers.',
      action: () => setSelectedCategory('SSC'),
    },
    {
      triggers: ['show upsc papers', 'filter upsc', 'upsc pyq', 'upsc papers'],
      answer: () => 'Filtering by UPSC previous year question papers.',
      action: () => setSelectedCategory('UPSC'),
    },
    {
      triggers: ['show banking papers', 'filter banking', 'bank pyq', 'banking papers'],
      answer: () => 'Filtering by Banking previous year question papers.',
      action: () => setSelectedCategory('Banking'),
    },
    {
      triggers: ['show railway papers', 'filter railway', 'rrb pyq', 'railway papers'],
      answer: () => 'Filtering by Railway RRB previous year question papers.',
      action: () => setSelectedCategory('Railway'),
    },
    {
      triggers: ['show all papers', 'all pyqs', 'reset filter', 'all papers'],
      answer: () => 'Showing all previous year question papers across all examination categories.',
      action: () => {
        setSelectedCategory('All');
        setSelectedYear('All');
      },
    },
    {
      triggers: ['summary', 'overview', 'how many papers', 'read summary'],
      answer: () => `Previous year papers library contains ${papers.length} verified past exam papers with full solution keys, compensatory time support, and voice navigation.`,
    },
  ]);

  return (
    <AppLayout title="Previous Year Papers">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Banner */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)',
            border: '1px solid rgba(234, 88, 12, 0.2)',
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
                  background: 'linear-gradient(135deg, #EA580C, #F97316)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)',
                }}
              >
                <FileText size={20} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                Previous Year Question Papers (PYQs)
              </h1>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 700 }}>
              Attempt verified past competitive exam papers in an interactive accessible mode with compensatory time, voice navigation, and detailed solution explanations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#EA580C',
                background: '#FFF7ED',
                border: '1px solid #FFEDD5',
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
              }}
            >
              <Zap size={15} />
              Timed CBT Simulation Ready
            </span>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 500 }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search PYQs by exam name, year, or topic..."
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
                aria-label="Search previous year papers"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Year:
              </span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                style={{
                  padding: '0.5rem 0.8rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: 'var(--text)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categories.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: active ? 700 : 500,
                    border: active ? '1px solid #EA580C' : '1px solid var(--border)',
                    background: active ? 'linear-gradient(135deg, #EA580C, #F97316)' : 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(6px)',
                    color: active ? '#fff' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading previous year question papers...
          </div>
        ) : filteredPapers.length === 0 ? (
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
            <FileText size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <h3 style={{ margin: 0, color: 'var(--text)' }}>No question papers found</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Try adjusting your year or exam category filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedYear('All'); }}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: '#EA580C',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {filteredPapers.map(item => {
              const isSpeaking = speakingId === item.id;
              const catLower = (item.category || '').toLowerCase();
              const fadeClass = catLower.includes('ssc')
                ? 'card-fade-blue'
                : catLower.includes('bank')
                ? 'card-fade-orange'
                : catLower.includes('upsc')
                ? 'card-fade-amber'
                : catLower.includes('rail')
                ? 'card-fade-emerald'
                : catLower.includes('defence')
                ? 'card-fade-indigo'
                : 'card-fade-purple';

              const diffColor =
                item.difficulty === 'Easy'
                  ? { bg: '#DCFCE7', text: '#16A34A' }
                  : item.difficulty === 'Medium'
                  ? { bg: '#FEF3C7', text: '#D97706' }
                  : { bg: '#FEE2E2', text: '#DC2626' };

              return (
                <article
                  key={item.id}
                  className={`card card-interactive ${fadeClass}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.35rem',
                    borderRadius: '1rem',
                    border: isSpeaking ? '2px solid #EA580C' : undefined,
                    boxShadow: isSpeaking ? '0 6px 20px rgba(234, 88, 12, 0.2)' : undefined,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Header badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '0.35rem',
                            background: 'rgba(234, 88, 12, 0.1)',
                            color: '#EA580C',
                          }}
                        >
                          {item.category}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.35rem',
                            background: diffColor.bg,
                            color: diffColor.text,
                          }}
                        >
                          {item.difficulty}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Calendar size={13} />
                        <span>{item.year}</span>
                      </div>
                    </div>

                    {/* Paper Title */}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem 0', lineHeight: 1.35 }}>
                      {item.title}
                    </h3>

                    {/* Meta info */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} />
                        <span>{item.durationMinutes} Mins</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Layers size={13} />
                        <span>{item.totalQuestions} Questions</span>
                      </div>
                      {item.shift && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span>• {item.shift}</span>
                        </div>
                      )}
                    </div>

                    {/* Topics Pill tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                      {item.topicsCovered.map((topic, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.3rem',
                            background: 'rgba(0,0,0,0.04)',
                            color: 'var(--text-muted)',
                            fontWeight: 500,
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    {/* Audio Overview Button */}
                    <button
                      onClick={() => handlePlayAudio(item)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.55rem',
                        border: '1px solid var(--border)',
                        background: isSpeaking ? '#FEF2F2' : 'var(--card-bg)',
                        color: isSpeaking ? '#EF4444' : 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                      }}
                      title="Listen audio overview of this paper"
                      aria-label={isSpeaking ? 'Stop audio' : `Listen overview of ${item.title}`}
                    >
                      {isSpeaking ? <Square size={14} fill="#EF4444" /> : <Volume2 size={14} />}
                      <span>{isSpeaking ? 'Stop' : 'Audio'}</span>
                    </button>

                    {/* Blueprint Modal button */}
                    <button
                      onClick={() => setSelectedPaperModal(item)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.55rem',
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)',
                        color: 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Details
                    </button>

                    {/* Attempt Mock Test */}
                    <button
                      onClick={() => {
                        const targetId = item.linkedExamId || 'ssc-reasoning-01';
                        navigate(`/exam/${targetId}`);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.85rem',
                        borderRadius: '0.55rem',
                        border: 'none',
                        background: 'linear-gradient(135deg, #EA580C, #F97316)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                      }}
                    >
                      <Play size={14} fill="#fff" />
                      <span>Attempt PYQ</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Paper Details Modal */}
        {selectedPaperModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedPaperModal.title}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1rem',
              backdropFilter: 'blur(3px)',
            }}
          >
            <div
              className="card fade-in"
              style={{
                width: '100%',
                maxWidth: 650,
                borderRadius: '1.2rem',
                overflow: 'hidden',
                background: 'var(--card-bg)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(234, 88, 12, 0.05)',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#EA580C',
                      background: 'rgba(234, 88, 12, 0.1)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.25rem',
                    }}
                  >
                    {selectedPaperModal.examName} • {selectedPaperModal.year}
                  </span>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.35rem 0 0 0', color: 'var(--text)' }}>
                    {selectedPaperModal.title}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedPaperModal(null)}
                  style={{
                    border: 'none',
                    background: 'rgba(0,0,0,0.06)',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text)',
                  }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Duration</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{selectedPaperModal.durationMinutes} mins</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Questions</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{selectedPaperModal.totalQuestions} MCQs</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Shift / Session</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>{selectedPaperModal.shift || 'Regular'}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem 0' }}>
                    Topics Evaluated in this Paper
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedPaperModal.topicsCovered.map((topic, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.7rem',
                          borderRadius: '0.45rem',
                          background: 'rgba(234, 88, 12, 0.08)',
                          color: '#EA580C',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(0,0,0,0.02)',
                    padding: '0.9rem',
                    borderRadius: '0.65rem',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: 'var(--text)' }}>Accessibility Note:</strong> PwD candidates attempting this paper will automatically receive their designated time multiplier (e.g. 1.5x / 2.0x compensatory time) and full voice navigation assistance.
                </div>
              </div>

              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  onClick={() => setSelectedPaperModal(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '0.55rem',
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const targetId = selectedPaperModal.linkedExamId || 'ssc-reasoning-01';
                    navigate(`/exam/${targetId}`);
                  }}
                  style={{
                    padding: '0.55rem 1.2rem',
                    borderRadius: '0.55rem',
                    border: 'none',
                    background: '#EA580C',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Play size={14} fill="#fff" />
                  <span>Start Mock Exam Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
