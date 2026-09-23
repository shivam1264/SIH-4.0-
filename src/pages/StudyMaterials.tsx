import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Clock,
  Tag,
  Filter,
  CheckCircle2,
  ArrowRight,
  Headphones,
  X,
  FileText,
  Share2,
  SlidersHorizontal,
  Bookmark,
  ChevronDown
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { MOCK_STUDY_MATERIALS } from '../data/mockData';
import { studyMaterialsApi } from '../services/api';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';
import { useAccessibility } from '../context/AccessibilityContext';
import { usePageVoice } from '../hooks/usePageVoice';
import type { StudyMaterial, Subject } from '../types';

const SUBJECT_OPTIONS = ['All', 'General Awareness', 'Mathematics', 'Reasoning', 'General Science'] as const;

export default function StudyMaterials() {
  const navigate = useNavigate();
  const { prefs } = useAccessibility();

  const [materials, setMaterials] = useState<StudyMaterial[]>(MOCK_STUDY_MATERIALS);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeReadingId, setActiveReadingId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('drishti_bookmarked_materials') || '[]');
    } catch {
      return [];
    }
  });

  // Load from API with fallback
  useEffect(() => {
    document.title = 'Study Materials & Audio Revision Notes — DrishtiX';
    studyMaterialsApi.getAll().then(data => {
      if (data && data.length > 0) {
        setMaterials(data);
      }
    }).catch(err => {
      console.warn('[StudyMaterials] API fetch error, using built-in mock materials:', err);
    });
  }, []);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSubject = selectedSubject === 'All' || m.subject === selectedSubject || (selectedSubject === 'General Science' && m.subject === 'General Science');
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || m.title.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q));
      return matchSubject && matchQuery;
    });
  }, [materials, selectedSubject, searchQuery]);

  // Page orientation audio briefing
  useEffect(() => {
    const summary = `Study Materials library opened. Showing ${filteredMaterials.length} high-yield audio revision notes across Quantitative Aptitude, Indian Polity, and General Science. Press 1 to 5 to filter subjects, or press Space to listen to the first study guide.`;
    if (prefs.voiceMode || prefs.autoReadQuestion) {
      const timer = setTimeout(() => {
        speechService.speak(summary, { priority: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Toggle bookmark
  const toggleBookmark = (id: string, title: string) => {
    audioCueService.select();
    setBookmarkedIds(prev => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('drishti_bookmarked_materials', JSON.stringify(updated));
      const msg = exists ? `Removed "${title}" from saved notes.` : `Saved "${title}" to your offline revision book.`;
      speechService.speak(msg);
      screenReaderAnnouncer.announcePolite(msg);
      return updated;
    });
  };

  // Play audio narration for a note
  const handlePlayAudio = (m: StudyMaterial) => {
    if (activeReadingId === m.id && isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      setActiveReadingId(null);
      speechService.speak('Audio paused.');
      return;
    }

    speechService.stop();
    setIsPlayingAudio(true);
    setActiveReadingId(m.id);
    audioCueService.select();

    const narration = `${m.title}. Estimated reading time: ${m.readTimeMinutes} minutes. Subject: ${m.subject}. Summary: ${m.summary}. Key Points: ${m.keyPoints.join('. ')}. Detailed Content: ${m.audioNarrationText || m.content}`;
    
    screenReaderAnnouncer.announcePolite(`Playing audio guide: ${m.title}`);
    speechService.speak(narration, {
      priority: true,
      onEnd: () => {
        setIsPlayingAudio(false);
        setActiveReadingId(null);
      }
    });
  };

  // Stop active speech
  const handleStopAudio = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    setActiveReadingId(null);
    speechService.speak('Audio stopped.');
  };

  // Voice command integration
  usePageVoice('StudyMaterials', [
    {
      triggers: ['read note 1', 'play note 1', 'pehla note', 'first note'],
      answer: () => {
        if (filteredMaterials[0]) {
          handlePlayAudio(filteredMaterials[0]);
          return `Playing ${filteredMaterials[0].title}.`;
        }
        return 'No study materials found.';
      },
    },
    {
      triggers: ['read note 2', 'play note 2', 'dusra note', 'second note'],
      answer: () => {
        if (filteredMaterials[1]) {
          handlePlayAudio(filteredMaterials[1]);
          return `Playing ${filteredMaterials[1].title}.`;
        }
        return 'Second study material not found.';
      },
    },
    {
      triggers: ['stop audio', 'pause audio', 'ruko', 'chup'],
      answer: () => {
        handleStopAudio();
        return 'Audio stopped.';
      },
    },
    {
      triggers: ['filter maths', 'mathematics notes', 'quant notes'],
      answer: () => 'Filtering by Mathematics and Quantitative Aptitude.',
      action: () => setSelectedSubject('Mathematics'),
    },
    {
      triggers: ['filter polity', 'constitution notes', 'general awareness'],
      answer: () => 'Filtering by General Awareness and Indian Polity.',
      action: () => setSelectedSubject('General Awareness'),
    },
    {
      triggers: ['show all notes', 'all notes', 'clear filter'],
      answer: () => 'Showing all available study materials.',
      action: () => { setSelectedSubject('All'); setSearchQuery(''); },
    },
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === ' ') {
        e.preventDefault();
        if (filteredMaterials[0]) handlePlayAudio(filteredMaterials[0]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleStopAudio();
        setSelectedMaterial(null);
        return;
      }
      if (e.key >= '1' && e.key <= '5') {
        const idx = parseInt(e.key, 10) - 1;
        if (SUBJECT_OPTIONS[idx]) {
          e.preventDefault();
          setSelectedSubject(SUBJECT_OPTIONS[idx]);
          audioCueService.select();
          speechService.speak(`Filtering by ${SUBJECT_OPTIONS[idx]}.`);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filteredMaterials]);

  return (
    <AppLayout title="Study Materials & Audio Revision Notes">
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>
        
        {/* Header Hero Banner */}
        <div
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
            borderRadius: '1.25rem',
            padding: '2rem 2.25rem',
            color: '#fff',
            marginBottom: '1.75rem',
            boxShadow: '0 12px 32px -4px rgba(37, 99, 235, 0.35)',
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
              <Headphones size={14} /> AUDIO-NARRATED ACCESSIBLE REVISION VAULT
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, marginBottom: '0.65rem', lineHeight: 1.25 }}>
              Study Materials & Spoken Formula Guides
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#DBEAFE', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Master high-yield competitive exam concepts with natural text-to-speech narration, verified constitutional provisions, and quantitative formula cheat-sheets.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  if (filteredMaterials[0]) handlePlayAudio(filteredMaterials[0]);
                }}
                className="btn-primary"
                style={{
                  background: '#FFFFFF',
                  color: '#1E40AF',
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
                aria-label="Listen to featured guide aloud. Shortcut Space key."
              >
                {isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
                <span>{isPlayingAudio ? 'Pause Narration' : 'Listen to Featured Note (Space)'}</span>
              </button>

              <button
                onClick={() => navigate('/practice')}
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
                <span>Practice Weak Chapters</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Subject Filter Bar */}
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
                placeholder="Search notes by formula, topic, or keyword (e.g. Writs, Profit & Loss, Sound)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.75rem', width: '100%', fontSize: '0.88rem' }}
                aria-label="Search study notes by keyword or subject"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  aria-label="Clear search input"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Total Results Counter */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {filteredMaterials.length} of {materials.length} Guides
            </div>
          </div>

          {/* Subject Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginRight: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={14} /> Subject Filter:
            </span>
            {SUBJECT_OPTIONS.map((sub, idx) => {
              const active = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedSubject(sub);
                    audioCueService.select();
                    speechService.speak(`Filter set to ${sub}`);
                  }}
                  style={{
                    background: active ? 'var(--primary)' : 'var(--bg-surface)',
                    color: active ? '#ffffff' : 'var(--text)',
                    border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  aria-pressed={active}
                  title={`Shortcut key ${idx + 1}`}
                >
                  {sub} <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>({idx + 1})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Floating Active Player Banner (if playing) */}
        {isPlayingAudio && (
          <div
            className="fade-in"
            style={{
              position: 'sticky',
              top: '1rem',
              zIndex: 30,
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '0.85rem',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              border: '1.5px solid #3B82F6',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Volume2 className="mic-pulse" size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: 700 }}>
                  NOW READING ALOUD
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                  {materials.find(m => m.id === activeReadingId)?.title || 'Study Guide'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                onClick={handleStopAudio}
                className="btn-danger"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                aria-label="Stop audio reading. Shortcut Escape."
              >
                <X size={14} /> Stop (Esc)
              </button>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredMaterials.map((m, index) => {
            const isReading = activeReadingId === m.id && isPlayingAudio;
            const isBookmarked = bookmarkedIds.includes(m.id);

            return (
              <div
                key={m.id}
                className="card card-interactive fade-in"
                style={{
                  padding: '1.4rem',
                  borderRadius: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isReading ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: isReading ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-card)',
                  gap: '1rem',
                }}
              >
                <div>
                  {/* Top Header Badge & Bookmark */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: 'rgba(37, 99, 235, 0.1)',
                          color: 'var(--primary)',
                          borderRadius: '999px',
                          padding: '0.2rem 0.65rem',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        {m.subject}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Clock size={12} /> {m.readTimeMinutes} min read
                      </span>
                    </div>

                    <button
                      onClick={() => toggleBookmark(m.id, m.title)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isBookmarked ? '#F59E0B' : 'var(--text-muted)',
                        padding: '0.2rem',
                      }}
                      title={isBookmarked ? 'Saved to bookmarks' : 'Save note'}
                      aria-label={`${isBookmarked ? 'Remove' : 'Add'} bookmark for ${m.title}`}
                    >
                      <Bookmark size={18} fill={isBookmarked ? '#F59E0B' : 'none'} />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                    {m.title}
                  </h3>

                  {/* Summary */}
                  <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.9rem' }}>
                    {m.summary}
                  </p>

                  {/* Key Points Preview */}
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid var(--border)',
                      marginBottom: '0.9rem',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Key Takeaways:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {m.keyPoints.slice(0, 3).map((pt, i) => (
                        <li key={i} style={{ marginBottom: '0.2rem' }}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Tag Chips */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {m.tags.slice(0, 4).map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.68rem',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-muted)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '0.35rem',
                          border: '1px solid var(--border)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => handlePlayAudio(m)}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      background: isReading ? 'linear-gradient(135deg, #10B981, #059669)' : undefined,
                    }}
                    aria-label={`Listen to ${m.title} read aloud`}
                  >
                    {isReading ? <Pause size={15} /> : <Volume2 size={15} />}
                    <span>{isReading ? 'Pause Audio' : 'Listen Aloud'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMaterial(m);
                      audioCueService.select();
                      speechService.speak(`Opened full guide: ${m.title}`);
                    }}
                    className="btn-secondary"
                    style={{
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    aria-label={`Read full text guide for ${m.title}`}
                  >
                    <FileText size={15} />
                    <span>Read Guide</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search State */}
        {filteredMaterials.length === 0 && (
          <div
            className="card fade-in"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              borderRadius: '1rem',
              marginTop: '1.5rem',
            }}
          >
            <BookOpen size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              No study materials match your search
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Try searching with general keywords like "Formula", "Polity", or "Speed", or reset your active filters.
            </p>
            <button
              onClick={() => {
                setSelectedSubject('All');
                setSearchQuery('');
                speechService.speak('Filters reset to show all notes.');
              }}
              className="btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
            >
              Reset Filters & Show All
            </button>
          </div>
        )}

        {/* Full Material Reading Modal */}
        {selectedMaterial && (
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
            aria-labelledby="material-modal-title"
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
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {selectedMaterial.subject} • {selectedMaterial.category}
                  </span>
                  <h2 id="material-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.2rem' }}>
                    {selectedMaterial.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedMaterial(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
                  aria-label="Close reading guide (Escape)"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, lineHeight: 1.7, fontSize: '0.92rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text)' }}>
                    SUMMARY:
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {selectedMaterial.summary}
                  </p>
                </div>

                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', marginBottom: '1.5rem' }}>
                  {selectedMaterial.content}
                </div>

                {/* Key Points */}
                <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', padding: '1.2rem', borderRadius: '0.75rem' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    KEY AUDITORY REVISION POINTS:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text)' }}>
                    {selectedMaterial.keyPoints.map((pt, i) => (
                      <li key={i} style={{ marginBottom: '0.35rem' }}>{pt}</li>
                    ))}
                  </ul>
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
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Author: {selectedMaterial.author || 'DrishtiX Research Board'}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => handlePlayAudio(selectedMaterial)}
                    className="btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.55rem 1.25rem' }}
                  >
                    <Volume2 size={16} /> Listen Aloud
                  </button>
                  <button
                    onClick={() => setSelectedMaterial(null)}
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
