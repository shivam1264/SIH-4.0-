import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Volume2,
  Play,
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  FileText,
  X,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { MOCK_PYQS, EXAMS } from '../data/mockData';
import { pyqsApi } from '../services/api';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';
import { useAccessibility } from '../context/AccessibilityContext';
import { usePageVoice } from '../hooks/usePageVoice';
import type { PYQPaper } from '../types';

const CATEGORIES = ['All', 'SSC', 'Banking', 'UPSC', 'Railway'] as const;
const YEARS = ['All', '2024', '2023', '2022'] as const;

export default function PreviousYearPapers() {
  const navigate = useNavigate();
  const { prefs } = useAccessibility();

  const [papers, setPapers] = useState<PYQPaper[]>(MOCK_PYQS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaperForSolutions, setSelectedPaperForSolutions] = useState<PYQPaper | null>(null);

  // Load from API with fallback
  useEffect(() => {
    document.title = 'Previous Year Solved Papers (PYQs) — DrishtiX';
    pyqsApi.getAll().then(data => {
      if (data && data.length > 0) {
        setPapers(data);
      }
    }).catch(err => {
      console.warn('[PYQs] API fetch error, using built-in mock papers:', err);
    });
  }, []);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchYear = selectedYear === 'All' || String(p.year) === selectedYear;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || p.title.toLowerCase().includes(q) || p.examName.toLowerCase().includes(q) || p.topicsCovered.some(t => t.toLowerCase().includes(q));
      return matchCat && matchYear && matchQuery;
    });
  }, [papers, selectedCategory, selectedYear, searchQuery]);

  // Page orientation briefing on mount
  useEffect(() => {
    const summary = `Previous Year Solved Papers archive. Displaying ${filteredPapers.length} authentic past year exam papers from SSC CGL, IBPS PO, RRB NTPC, and UPSC CSE. Press number keys 1 to ${filteredPapers.length} to inspect a paper, or press Enter to launch simulation mode.`;
    if (prefs.voiceMode || prefs.autoReadQuestion) {
      const timer = setTimeout(() => {
        speechService.speak(summary, { priority: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Audio summary of a paper
  const handlePlayPaperSummary = (p: PYQPaper) => {
    audioCueService.select();
    const narration = `${p.title}. Year ${p.year}. Category ${p.category}. ${p.totalQuestions} questions. ${p.durationMinutes} minutes duration. Topics covered: ${p.topicsCovered.join(', ')}. Audio Summary: ${p.audioSummaryText}`;
    screenReaderAnnouncer.announcePolite(`Playing paper overview: ${p.title}`);
    speechService.speak(narration, { priority: true });
  };

  // Launch mock simulation mode
  const handleStartSimulation = (p: PYQPaper) => {
    audioCueService.select();
    speechService.speak(`Launching mock simulation mode for ${p.title}.`, { priority: true });
    // Determine linked exam ID
    const targetExamId = p.linkedExamId || (
      p.category === 'SSC' ? 'ssc-reasoning-01' :
      p.category === 'Banking' ? 'banking-quant-01' :
      p.category === 'UPSC' ? 'upsc-gs1-01' :
      p.category === 'Railway' ? 'railway-gk-01' : 'ssc-reasoning-01'
    );
    navigate(`/exam/${targetExamId}?autostart=true`);
  };

  // Voice commands integration
  usePageVoice('PreviousYearPapers', [
    {
      triggers: ['start paper 1', 'attempt paper 1', 'pehla paper', 'first paper'],
      answer: () => {
        if (filteredPapers[0]) {
          handleStartSimulation(filteredPapers[0]);
          return `Starting ${filteredPapers[0].title}.`;
        }
        return 'No past papers found.';
      },
    },
    {
      triggers: ['start paper 2', 'attempt paper 2', 'dusra paper'],
      answer: () => {
        if (filteredPapers[1]) {
          handleStartSimulation(filteredPapers[1]);
          return `Starting ${filteredPapers[1].title}.`;
        }
        return 'Second past paper not found.';
      },
    },
    {
      triggers: ['filter ssc', 'ssc papers'],
      answer: () => 'Showing SSC CGL and CHSL past year papers.',
      action: () => setSelectedCategory('SSC'),
    },
    {
      triggers: ['filter banking', 'ibps papers', 'bank papers'],
      answer: () => 'Showing Banking PO and Clerk past year papers.',
      action: () => setSelectedCategory('Banking'),
    },
    {
      triggers: ['filter upsc', 'upsc papers', 'civil services'],
      answer: () => 'Showing UPSC Civil Services past year papers.',
      action: () => setSelectedCategory('UPSC'),
    },
    {
      triggers: ['filter railway', 'rrb papers', 'ntpc papers'],
      answer: () => 'Showing Railway RRB NTPC past year papers.',
      action: () => setSelectedCategory('Railway'),
    },
    {
      triggers: ['all papers', 'clear filters', 'reset filters'],
      answer: () => 'Displaying all past year papers.',
      action: () => { setSelectedCategory('All'); setSelectedYear('All'); setSearchQuery(''); },
    },
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setSelectedPaperForSolutions(null);
        speechService.stop();
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        const target = filteredPapers[idx];
        if (target) {
          e.preventDefault();
          handlePlayPaperSummary(target);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filteredPapers]);

  return (
    <AppLayout title="Previous Year Solved Papers (PYQs)">
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>

        {/* Hero Banner */}
        <div
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, #831843 0%, #BE185D 50%, #E11D48 100%)',
            borderRadius: '1.25rem',
            padding: '2rem 2.25rem',
            color: '#fff',
            marginBottom: '1.75rem',
            boxShadow: '0 12px 32px -4px rgba(190, 24, 93, 0.35)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
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
              <Award size={14} /> OFFICIAL NATIONAL EXAM PAPERS ARCHIVE
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, marginBottom: '0.65rem', lineHeight: 1.25 }}>
              Previous Year Solved Papers & Simulation Arena
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#FFE4E6', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Solve authentic question papers from SSC CGL, IBPS PO, RRB NTPC, and UPSC Civil Services with official verified answer keys and audio step explanations.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  if (filteredPapers[0]) handleStartSimulation(filteredPapers[0]);
                }}
                className="btn-primary"
                style={{
                  background: '#FFFFFF',
                  color: '#9F1239',
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
                aria-label="Launch first past paper in simulation mode"
              >
                <Play size={16} fill="#9F1239" />
                <span>Simulate Featured Paper (2024 CGL)</span>
              </button>

              <button
                onClick={() => navigate('/exams')}
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
                <span>Full Mock Catalog</span>
                <ArrowRight size={15} />
              </button>
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
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search official papers by year, exam, or topic (e.g. 2023, Syllogism, CGL)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.75rem', width: '100%', fontSize: '0.88rem' }}
                aria-label="Search previous year papers"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  aria-label="Clear search query"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Total Results */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {filteredPapers.length} of {papers.length} Official Papers
            </div>
          </div>

          {/* Category & Year Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginRight: '0.2rem' }}>
                Category:
              </span>
              {CATEGORIES.map(cat => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      audioCueService.select();
                      speechService.speak(`Category filtered to ${cat}`);
                    }}
                    style={{
                      background: active ? '#BE185D' : 'var(--bg-surface)',
                      color: active ? '#ffffff' : 'var(--text)',
                      border: active ? '1px solid #BE185D' : '1px solid var(--border)',
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

            {/* Year Selector */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                Year:
              </span>
              {YEARS.map(yr => {
                const active = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    onClick={() => {
                      setSelectedYear(yr);
                      audioCueService.select();
                      speechService.speak(`Year set to ${yr}`);
                    }}
                    style={{
                      background: active ? '#1E293B' : 'var(--bg-surface)',
                      color: active ? '#ffffff' : 'var(--text)',
                      border: active ? '1px solid #1E293B' : '1px solid var(--border)',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '0.45rem',
                      fontSize: '0.76rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                    aria-pressed={active}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredPapers.map((p, idx) => {
            const diffColor = p.difficulty === 'Easy' ? '#16A34A' : p.difficulty === 'Medium' ? '#D97706' : '#DC2626';
            const diffBg = p.difficulty === 'Easy' ? '#F0FDF4' : p.difficulty === 'Medium' ? '#FFFBEB' : '#FEF2F2';

            return (
              <div
                key={p.id}
                className="card card-interactive fade-in"
                style={{
                  padding: '1.35rem',
                  borderRadius: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: 'rgba(190, 24, 93, 0.1)',
                          color: '#BE185D',
                          borderRadius: '999px',
                          padding: '0.2rem 0.65rem',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        {p.category} • {p.year}
                      </span>
                      <span
                        style={{
                          background: diffBg,
                          color: diffColor,
                          border: `1px solid ${diffColor}40`,
                          borderRadius: '999px',
                          padding: '0.15rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {p.difficulty}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {p.shift || 'Official Paper'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                    {p.title}
                  </h3>

                  {/* Specs Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-surface)',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.65rem',
                      border: '1px solid var(--border)',
                      fontSize: '0.78rem',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text)' }}>
                      <HelpCircle size={14} color="#BE185D" />
                      <span><strong>{p.totalQuestions}</strong> Questions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text)' }}>
                      <Clock size={14} color="#059669" />
                      <span><strong>{p.durationMinutes}</strong> Minutes</span>
                    </div>
                  </div>

                  {/* Topics Covered */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Key Sections & Topics:
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {p.topicsCovered.map(topic => (
                        <span
                          key={topic}
                          style={{
                            fontSize: '0.7rem',
                            background: 'var(--bg-surface)',
                            color: 'var(--text)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.35rem',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => handleStartSimulation(p)}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      padding: '0.65rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      background: 'linear-gradient(135deg, #BE185D, #9F1239)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(190, 24, 93, 0.3)',
                    }}
                    aria-label={`Attempt ${p.title} as timed simulation test`}
                  >
                    <Play size={14} fill="#ffffff" />
                    <span>Attempt Mock</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPaperForSolutions(p);
                      audioCueService.select();
                      speechService.speak(`Viewing official answer key and solutions for ${p.title}`);
                    }}
                    className="btn-secondary"
                    style={{
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    title="View Answer Key & Step-by-Step Solutions"
                    aria-label={`View solutions for ${p.title}`}
                  >
                    <FileText size={15} />
                    <span>Key & Sol</span>
                  </button>

                  <button
                    onClick={() => handlePlayPaperSummary(p)}
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
                    title="Listen to paper structure summary aloud"
                    aria-label={`Listen to summary of ${p.title}`}
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search State */}
        {filteredPapers.length === 0 && (
          <div
            className="card fade-in"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              borderRadius: '1rem',
              marginTop: '1.5rem',
            }}
          >
            <FileSpreadsheet size={48} color="#BE185D" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              No past papers matched your criteria
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Try selecting a different year or category, or reset all active filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedYear('All');
                setSearchQuery('');
                speechService.speak('Filters reset to show all past papers.');
              }}
              className="btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', background: '#BE185D' }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Solved Key & Explanations Modal */}
        {selectedPaperForSolutions && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="solutions-modal-title"
          >
            <div
              className="card fade-in"
              style={{
                width: '100%',
                maxWidth: 780,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '1.25rem',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-surface)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#BE185D', textTransform: 'uppercase' }}>
                    OFFICIAL VERIFIED ANSWER KEY & STEP SOLUTIONS
                  </span>
                  <h2 id="solutions-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.2rem' }}>
                    {selectedPaperForSolutions.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedPaperForSolutions(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
                  aria-label="Close solutions modal (Escape)"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, fontSize: '0.9rem', lineHeight: 1.65 }}>
                <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', color: '#9D174D' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem', marginBottom: '0.25rem' }}>
                    EXAM AUDIT & DIFFICULTY TREND:
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem' }}>
                    {selectedPaperForSolutions.audioSummaryText}
                  </p>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem' }}>
                  High-Frequency Questions & Verified Explanations:
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--primary)' }}>Q1. General Studies / Reasoning</span>
                      <span style={{ color: '#16A34A' }}>Official Correct: Option B</span>
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' }}>
                      Which constitutional amendment made Right to Education a Fundamental Right under Article 21A?
                    </p>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <strong>Verified Solution:</strong> The 86th Constitutional Amendment Act of 2002 inserted Article 21A, providing free and compulsory education for all children between the ages of 6 and 14 years.
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--primary)' }}>Q2. Quantitative Aptitude</span>
                      <span style={{ color: '#16A34A' }}>Official Correct: Option A</span>
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' }}>
                      If price of sugar increases by 20%, by what percent must consumption be reduced to keep expenditure constant?
                    </p>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <strong>Verified Solution:</strong> Formula: [R / (100 + R)] × 100% = [20 / 120] × 100% = 16.67% (or 16 2/3%).
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--primary)' }}>Q3. Logical Deductions</span>
                      <span style={{ color: '#16A34A' }}>Official Correct: Option C</span>
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' }}>
                      Statements: All books are papers. Some papers are desks. Conclusion: Some desks are books.
                    </p>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <strong>Verified Solution:</strong> The middle term 'papers' is not distributed in either premise. Therefore, no definite relation exists between desks and books. Conclusion does not follow.
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-surface)',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Certified by DrishtiX Central Exam Authority
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      const p = selectedPaperForSolutions;
                      setSelectedPaperForSolutions(null);
                      handleStartSimulation(p);
                    }}
                    className="btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.55rem 1.25rem', background: '#BE185D' }}
                  >
                    <Play size={15} fill="#fff" /> Start Timed Mock
                  </button>
                  <button
                    onClick={() => setSelectedPaperForSolutions(null)}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
