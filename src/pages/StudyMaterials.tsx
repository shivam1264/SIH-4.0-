import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Square,
  Search,
  Download,
  Clock,
  CheckCircle2,
  Bookmark,
  FileText,
  Sparkles,
  ArrowRight,
  Filter,
  X,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { studyMaterialsApi } from '../services/api';
import { speechService } from '../services/speechService';
import { useAccessibility } from '../context/AccessibilityContext';
import { usePageVoice } from '../hooks/usePageVoice';
import type { StudyMaterial } from '../types';

function getSubjectTheme(subject: string = '', category: string = '') {
  const text = `${subject} ${category}`.toLowerCase();
  if (text.includes('math') || text.includes('quant') || text.includes('percentage') || text.includes('interest')) {
    return {
      fadeClass: 'card-fade-orange',
      badgeBg: 'rgba(249, 115, 22, 0.12)',
      badgeColor: '#C2410C',
      badgeBorder: 'rgba(249, 115, 22, 0.25)',
      buttonBg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      buttonColor: '#FFFFFF',
      accentColor: '#EA580C',
      highlightBg: 'rgba(249, 115, 22, 0.04)',
      highlightBorder: 'rgba(249, 115, 22, 0.18)',
    };
  }
  if (text.includes('polity') || text.includes('constitution') || text.includes('law')) {
    return {
      fadeClass: 'card-fade-blue',
      badgeBg: 'rgba(37, 99, 235, 0.12)',
      badgeColor: '#1D4ED8',
      badgeBorder: 'rgba(37, 99, 235, 0.25)',
      buttonBg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      buttonColor: '#FFFFFF',
      accentColor: '#2563EB',
      highlightBg: 'rgba(37, 99, 235, 0.04)',
      highlightBorder: 'rgba(37, 99, 235, 0.18)',
    };
  }
  if (text.includes('bank') || text.includes('rbi') || text.includes('finance') || text.includes('economy')) {
    return {
      fadeClass: 'card-fade-emerald',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      badgeColor: '#047857',
      badgeBorder: 'rgba(16, 185, 129, 0.25)',
      buttonBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      buttonColor: '#FFFFFF',
      accentColor: '#059669',
      highlightBg: 'rgba(16, 185, 129, 0.04)',
      highlightBorder: 'rgba(16, 185, 129, 0.18)',
    };
  }
  if (text.includes('reason') || text.includes('logic') || text.includes('puzzle')) {
    return {
      fadeClass: 'card-fade-purple',
      badgeBg: 'rgba(139, 92, 246, 0.12)',
      badgeColor: '#6D28D9',
      badgeBorder: 'rgba(139, 92, 246, 0.25)',
      buttonBg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      buttonColor: '#FFFFFF',
      accentColor: '#7C3AED',
      highlightBg: 'rgba(139, 92, 246, 0.04)',
      highlightBorder: 'rgba(139, 92, 246, 0.18)',
    };
  }
  if (text.includes('history') || text.includes('freedom') || text.includes('ancient')) {
    return {
      fadeClass: 'card-fade-rose',
      badgeBg: 'rgba(244, 63, 94, 0.12)',
      badgeColor: '#BE123C',
      badgeBorder: 'rgba(244, 63, 94, 0.25)',
      buttonBg: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
      buttonColor: '#FFFFFF',
      accentColor: '#E11D48',
      highlightBg: 'rgba(244, 63, 94, 0.04)',
      highlightBorder: 'rgba(244, 63, 94, 0.18)',
    };
  }
  return {
    fadeClass: 'card-fade-blue',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeColor: '#1D4ED8',
    badgeBorder: 'rgba(59, 130, 246, 0.25)',
    buttonBg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    buttonColor: '#FFFFFF',
    accentColor: '#2563EB',
    highlightBg: 'rgba(59, 130, 246, 0.04)',
    highlightBorder: 'rgba(59, 130, 246, 0.18)',
  };
}

export default function StudyMaterials() {
  const { prefs } = useAccessibility();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [activeReadingItem, setActiveReadingItem] = useState<StudyMaterial | null>(null);

  // Audio Player State
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(prefs.voiceRate || 1.0);

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    setLoading(true);
    try {
      const data = await studyMaterialsApi.getAll();
      setMaterials(data);
    } catch (err) {
      console.warn('Failed to fetch study materials:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle TTS Audio playback
  function handlePlayAudio(item: StudyMaterial) {
    if (speakingId === item.id) {
      speechService.stop();
      setSpeakingId(null);
      return;
    }

    speechService.stop();
    setSpeakingId(item.id);

    const narration = item.audioNarrationText || `${item.title}. ${item.summary}. Key Points: ${item.keyPoints.join('. ')}`;
    speechService.configure(speechRate, 1.0);
    speechService.speak(narration, {
      priority: true,
      onEnd: () => setSpeakingId(null),
    });
  }

  function handleStopAllAudio() {
    speechService.stop();
    setSpeakingId(null);
  }

  function openReader(item: StudyMaterial) {
    setActiveReadingItem(item);
    if (prefs.autoReadQuestion || prefs.voiceMode) {
      setTimeout(() => handlePlayAudio(item), 300);
    }
  }

  useEffect(() => {
    const unsub = speechService.onStop(() => setSpeakingId(null));
    return unsub;
  }, []);

  // Universal Keyboard Accessibility for Visually Impaired Candidates in Study Materials
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (activeReadingItem) {
        if (e.key === 'Escape') {
          e.preventDefault();
          speechService.stop();
          setSpeakingId(null);
          setActiveReadingItem(null);
          return;
        }
        if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          handlePlayAudio(activeReadingItem);
          return;
        }
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          speechService.stop();
          const points = `Key Highlights: ${activeReadingItem.keyPoints.join('. ')}`;
          speechService.speak(points, { priority: true });
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          const speeds = [0.75, 1.0, 1.25, 1.5];
          const nextSpeed = speeds[(speeds.indexOf(speechRate) + 1) % speeds.length] || 1.0;
          setSpeechRate(nextSpeed);
          speechService.configure(nextSpeed, 1.0);
          speechService.speak(`Speed ${nextSpeed}x`);
          return;
        }
        return;
      }

      // Catalog view shortcuts
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key, 10) - 1;
        if (materials[idx]) {
          e.preventDefault();
          openReader(materials[idx]);
        }
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (materials.length > 0) {
          handlePlayAudio(materials[0]);
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeReadingItem, materials, speakingId, speechRate, prefs.autoReadQuestion, prefs.voiceMode]);

  usePageVoice('StudyMaterials', [
    {
      triggers: ['read notes', 'read study notes', 'play notes', 'listen to notes', 'listen', 'play audio notes'],
      answer: () => {
        if (materials.length > 0) {
          handlePlayAudio(materials[0]);
          return '';
        }
        return 'No study materials available to read.';
      },
    },
    {
      triggers: ['stop audio', 'stop reading', 'mute reading'],
      answer: () => 'Audio reading stopped.',
      action: () => handleStopAllAudio(),
    },
    {
      triggers: ['show all notes', 'all subjects', 'all notes', 'reset filter'],
      answer: () => 'Showing all study materials across all subjects.',
      action: () => setSelectedSubject('All'),
    },
    {
      triggers: ['science notes', 'filter science', 'general science', 'science'],
      answer: () => 'Filtering by General Science study materials.',
      action: () => setSelectedSubject('Science'),
    },
    {
      triggers: ['polity notes', 'filter polity', 'indian polity', 'polity'],
      answer: () => 'Filtering by Indian Polity study materials.',
      action: () => setSelectedSubject('Polity'),
    },
    {
      triggers: ['banking notes', 'filter banking', 'economy notes', 'banking'],
      answer: () => 'Filtering by Banking and Economy study materials.',
      action: () => setSelectedSubject('Banking'),
    },
    {
      triggers: ['reasoning notes', 'filter reasoning', 'logic notes', 'reasoning'],
      answer: () => 'Filtering by Reasoning study materials.',
      action: () => setSelectedSubject('Reasoning'),
    },
    {
      triggers: ['summary', 'read summary', 'overview', 'how many notes'],
      answer: () => `Study Materials library has ${materials.length} comprehensive audio notes available with key point summaries and voice narration.`,
    },
  ]);

  // Filter materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      const matchesSubject =
        selectedSubject === 'All' ||
        item.subject.toLowerCase() === selectedSubject.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keyPoints.some(k => k.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));

      return matchesSubject && matchesSearch;
    });
  }, [materials, selectedSubject, searchQuery]);

  const subjects = ['All', 'General Awareness', 'Mathematics', 'Reasoning', 'History', 'General Science'];

  return (
    <AppLayout title="Study Materials">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Header Banner */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
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
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                }}
              >
                <BookOpen size={20} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                Accessible Study Materials & Learning Content
              </h1>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 700 }}>
              Audio-narrated core revision notes, formulas, and landmark summaries optimized for screen reader users and candidates requiring auditory learning aids.
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
                color: '#16A34A',
                background: '#DCFCE7',
                border: '1px solid #BBF7D0',
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
              }}
            >
              <CheckCircle2 size={15} />
              Screen Reader & Voice Verified
            </span>
          </div>
        </div>

        {/* Global Floating Audio Controller if playing */}
        {speakingId && (
          <div
            className="fade-in"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              padding: '0.85rem 1.25rem',
              borderRadius: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              position: 'sticky',
              top: 70,
              zIndex: 40,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ animation: 'spin 2s linear infinite' }}>
                <Volume2 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  Now Reading: {materials.find(m => m.id === speakingId)?.title || 'Study Material'}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  Press Stop button or use screen reader navigation anytime.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Speed:</span>
                {[0.8, 1.0, 1.25, 1.5].map(rate => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeechRate(rate);
                      const currentItem = materials.find(m => m.id === speakingId);
                      if (currentItem) {
                        handlePlayAudio(currentItem);
                      }
                    }}
                    style={{
                      border: 'none',
                      background: speechRate === rate ? '#fff' : 'transparent',
                      color: speechRate === rate ? 'var(--primary)' : '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <button
                onClick={handleStopAllAudio}
                style={{
                  background: '#EF4444',
                  color: '#fff',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                }}
              >
                <Square size={14} fill="#fff" />
                Stop Audio
              </button>
            </div>
          </div>
        )}

        {/* Search & Subject Tabs Controls */}
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
                placeholder="Search notes, topics, formulas, writs..."
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
                aria-label="Search study materials"
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

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {filteredMaterials.length} accessible {filteredMaterials.length === 1 ? 'guide' : 'guides'}
            </div>
          </div>

          {/* Subject Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {subjects.map(subj => {
              const active = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  {subj}
                </button>
              );
            })}
          </div>
        </div>

        {/* Materials Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading accessible study materials...
          </div>
        ) : filteredMaterials.length === 0 ? (
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
            <BookOpen size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <h3 style={{ margin: 0, color: 'var(--text)' }}>No study materials found</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Try adjusting your search query or switching subject filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedSubject('All'); }}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: 'var(--primary)',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))', gap: '1rem' }}>
            {filteredMaterials.map(item => {
              const isSpeaking = speakingId === item.id;
              const theme = getSubjectTheme(item.subject, item.category);

              return (
                <article
                  key={item.id}
                  className={`card card-interactive ${theme.fadeClass}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.05rem 1.15rem',
                    borderRadius: '0.85rem',
                    border: isSpeaking ? '2px solid var(--primary)' : undefined,
                    boxShadow: isSpeaking ? '0 6px 20px rgba(37,99,235,0.2)' : undefined,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Header tags: Matching Tinted Badge & Read Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '0.18rem 0.5rem',
                          borderRadius: '0.35rem',
                          background: theme.badgeBg,
                          color: theme.badgeColor,
                          border: `1px solid ${theme.badgeBorder}`,
                        }}
                      >
                        {item.category}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        <Clock size={12} strokeWidth={2.2} />
                        <span>{item.readTimeMinutes} min read</span>
                      </div>
                    </div>

                    {/* Title with Outfit Bold Typography */}
                    <h3
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '0.98rem',
                        fontWeight: 800,
                        color: 'var(--text)',
                        margin: '0 0 0.35rem 0',
                        lineHeight: 1.3,
                        letterSpacing: '-0.015em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    {/* Concise Summary */}
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        margin: '0 0 0.65rem 0',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.summary}
                    </p>

                    {/* Compact Key Highlights Shelf */}
                    {item.keyPoints && item.keyPoints.length > 0 && (
                      <div
                        style={{
                          background: theme.highlightBg,
                          borderRadius: '0.55rem',
                          padding: '0.45rem 0.65rem',
                          marginBottom: '0.75rem',
                          border: `1px solid ${theme.highlightBorder}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            color: theme.accentColor,
                            marginBottom: '0.25rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Sparkles size={10} strokeWidth={2.5} />
                          <span>Key Highlights</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {item.keyPoints.slice(0, 2).map((point, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.35rem',
                                fontSize: '0.74rem',
                                color: 'var(--text)',
                                lineHeight: 1.35,
                              }}
                            >
                              <span style={{ color: theme.accentColor, fontWeight: 900, lineHeight: 1.2 }}>•</span>
                              <span
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {point}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <button
                      onClick={() => handlePlayAudio(item)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.42rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: isSpeaking ? '1px solid #EF4444' : 'none',
                        background: isSpeaking ? '#FEF2F2' : theme.buttonBg,
                        color: isSpeaking ? '#EF4444' : theme.buttonColor,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        boxShadow: isSpeaking ? 'none' : '0 2px 6px rgba(0,0,0,0.1)',
                        transition: 'all 0.15s ease',
                      }}
                      aria-label={isSpeaking ? `Stop reading ${item.title}` : `Listen aloud to ${item.title}`}
                    >
                      {isSpeaking ? (
                        <>
                          <Square size={13} fill="#EF4444" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} />
                          <span>Listen Aloud</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openReader(item)}
                      style={{
                        padding: '0.42rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = theme.accentColor;
                        e.currentTarget.style.color = theme.accentColor;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text)';
                      }}
                      aria-label={`Open full reader for ${item.title}`}
                    >
                      <FileText size={13} />
                      <span>Read</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Accessible Full Screen / Modal Reading Drawer */}
        {activeReadingItem && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeReadingItem.title}
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
                maxWidth: 800,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '1.2rem',
                overflow: 'hidden',
                background: 'var(--card-bg)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
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
                  background: 'rgba(37,99,235,0.04)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        background: 'rgba(37,99,235,0.1)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.25rem',
                      }}
                    >
                      {activeReadingItem.subject}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • {activeReadingItem.readTimeMinutes} min audio read
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                    {activeReadingItem.title}
                  </h2>
                </div>

                <button
                  onClick={() => setActiveReadingItem(null)}
                  style={{
                    border: 'none',
                    background: 'rgba(0,0,0,0.06)',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text)',
                  }}
                  aria-label="Close reading view"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content Body */}
              <div
                style={{
                  padding: '1.5rem',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {/* Audio Narration Action Bar */}
                <div
                  style={{
                    background: 'rgba(37,99,235,0.06)',
                    border: '1px solid rgba(37,99,235,0.2)',
                    borderRadius: '0.75rem',
                    padding: '0.85rem 1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Volume2 size={20} color="var(--primary)" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>
                      Audio Narration Assistant
                    </span>
                  </div>

                  <button
                    onClick={() => handlePlayAudio(activeReadingItem)}
                    style={{
                      background: speakingId === activeReadingItem.id ? '#EF4444' : 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                    }}
                  >
                    {speakingId === activeReadingItem.id ? (
                      <>
                        <Square size={14} fill="#fff" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="#fff" />
                        <span>Read Lesson Aloud</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Key Takeaways */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem 0' }}>
                    Key Exam Highlights
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {activeReadingItem.keyPoints.map((pt, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          fontSize: '0.88rem',
                          color: 'var(--text)',
                        }}
                      >
                        <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Lesson Text */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem 0' }}>
                    Detailed Lesson Notes
                  </h4>
                  <div
                    style={{
                      fontSize: '0.92rem',
                      lineHeight: 1.7,
                      color: 'var(--text)',
                      whiteSpace: 'pre-line',
                      background: 'rgba(0,0,0,0.02)',
                      padding: '1.2rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {activeReadingItem.content}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
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
                  onClick={() => setActiveReadingItem(null)}
                  style={{
                    padding: '0.55rem 1.2rem',
                    borderRadius: '0.6rem',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Done Reading
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
