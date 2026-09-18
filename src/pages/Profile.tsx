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
  Clock,
  Shield,
  Sliders,
  Check,
  Volume2,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { usePageVoice } from '../hooks/usePageVoice';
import { speechService } from '../services/speechService';
import { MOCK_ATTEMPTS, EXAMS, AI_RECOMMENDATIONS } from '../data/mockData';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prefs } = useAccessibility();
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(user?.name ?? '');

  // Candidate Accommodation Profile State
  const [impairmentTier, setImpairmentTier] = useState<string>(() => {
    return localStorage.getItem('sight_impairment_tier') || 'Low Vision';
  });
  const [udidNumber, setUdidNumber] = useState<string>(() => {
    return localStorage.getItem('sight_udid_number') || 'DL04202400987654';
  });
  const [extraTimeMultiplier, setExtraTimeMultiplier] = useState<number>(() => {
    return parseFloat(localStorage.getItem('sight_time_multiplier') || '1.5');
  });
  const [screenReaderPref, setScreenReaderPref] = useState<string>(() => {
    return localStorage.getItem('sight_screen_reader_pref') || 'Built-in SIGHT Voice';
  });
  const [autonomousMode, setAutonomousMode] = useState<boolean>(() => {
    return localStorage.getItem('sight_autonomous_mode') !== 'false';
  });
  const [isSavedAccommodations, setIsSavedAccommodations] = useState(false);

  const saveAccommodations = () => {
    localStorage.setItem('sight_impairment_tier', impairmentTier);
    localStorage.setItem('sight_udid_number', udidNumber);
    localStorage.setItem('sight_time_multiplier', extraTimeMultiplier.toString());
    localStorage.setItem('sight_screen_reader_pref', screenReaderPref);
    localStorage.setItem('sight_autonomous_mode', autonomousMode.toString());
    setIsSavedAccommodations(true);
    speechService.speak(
      `Accommodations updated. Extra time set to ${extraTimeMultiplier}x. Autonomous Scribe-Free Mode ${
        autonomousMode ? 'enabled' : 'disabled'
      }.`,
      { priority: true }
    );
    setTimeout(() => setIsSavedAccommodations(false), 2500);
  };

  useEffect(() => {
    document.title = 'Profile — DrishtiX';
  }, []);

  const attempts = MOCK_ATTEMPTS;
  const avg = Math.round(
    attempts.reduce((s, a) => s + a.percentage, 0) / (attempts.length || 1)
  );

  usePageVoice('Profile', [
    {
      triggers: ['name', 'naam', 'mera naam', 'candidate name', 'who am i'],
      answer: () => `Candidate name is ${name || user?.name || 'Rahul Sharma'}. Role: Student, WCAG Ready.`,
    },
    {
      triggers: ['email', 'mera email', 'mail id'],
      answer: () => `Registered email address is ${user?.email || 'shivam@example.com'}.`,
    },
    {
      triggers: ['target exam', 'target', 'target exams', 'lakshya'],
      answer: () => `Target competitive exams: ${user?.examInterests?.join(', ') || 'SSC CGL, UPSC Prelims'}.`,
    },
    {
      triggers: ['udid', 'udid number', 'disability certificate', 'certificate number', 'udid card'],
      answer: () => `Your Government UDID Certificate Number is ${udidNumber}, verified under Rights of Persons with Disabilities Act 2016.`,
    },
    {
      triggers: ['extra time 1.5', 'extra time 1.5x', 'pwd default', 'default extra time', 'compensatory time 1.5'],
      answer: () => 'Compensatory extra time set to 1.5x PwD default (+30 minutes per hour). Say save changes to apply.',
      action: () => setExtraTimeMultiplier(1.5),
    },
    {
      triggers: ['extra time 1.33', 'extra time 1.33x', 'extra time 20 minutes', 'compensatory time 1.33'],
      answer: () => 'Compensatory extra time set to 1.33x (+20 minutes per hour). Say save changes to apply.',
      action: () => setExtraTimeMultiplier(1.33),
    },
    {
      triggers: ['extra time 2', 'extra time 2x', 'extra time double', 'double time', 'compensatory time 2'],
      answer: () => 'Compensatory extra time set to 2.0x Double Time. Say save changes to apply.',
      action: () => setExtraTimeMultiplier(2.0),
    },
    {
      triggers: ['extra time standard', 'standard time', 'extra time 1.0', '1x time', 'normal time'],
      answer: () => 'Compensatory time set to 1.0x standard time. Say save changes to apply.',
      action: () => setExtraTimeMultiplier(1.0),
    },
    {
      triggers: ['autonomous mode', 'scribe mode', 'scribe free', 'toggle scribe', 'toggle autonomous'],
      answer: () => `Autonomous Scribe-Free Mode ${!autonomousMode ? 'enabled' : 'disabled'}. Say save changes to apply.`,
      action: () => setAutonomousMode(prev => !prev),
    },
    {
      triggers: ['save changes', 'save profile', 'save accommodations', 'save preferences', 'save'],
      answer: () => 'Saving accommodation profile changes now.',
      action: () => saveAccommodations(),
    },
    {
      triggers: ['start ssc exam', 'start ready exam', 'start reasoning exam'],
      answer: () => 'Starting SSC CGL General Intelligence and Reasoning mock exam.',
      action: () => navigate('/exam/ssc-reasoning-01'),
    },
    {
      triggers: ['view all exams', 'all exams', 'all mock tests', 'exam library'],
      answer: () => 'Opening mock exams catalog.',
      action: () => navigate('/exams'),
    },
    {
      triggers: ['score', 'average score', 'performance', 'level'],
      answer: () => `Average evaluation score is ${avg} percent across ${attempts.length} attempted mock examinations.`,
    },
    {
      triggers: ['settings', 'accessibility settings', 'preference'],
      answer: () => 'Opening accessibility settings.',
      action: () => navigate('/settings'),
    },
    {
      triggers: ['summary', 'profile summary', 'read profile', 'overview'],
      answer: () => `Candidate profile for ${name || user?.name || 'Rahul Sharma'}. Impairment tier: ${impairmentTier}. UDID: ${udidNumber}. Compensatory time: ${extraTimeMultiplier}x. Autonomous scribe mode: ${autonomousMode ? 'active' : 'inactive'}. Total exams attempted: ${attempts.length}. Average score: ${avg} percent.`,
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

            {/* Candidate Accessibility Profile & Accommodation Management Card */}
            <div
              className="card fade-in"
              style={{
                padding: '1.25rem 1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                border: '1.5px solid var(--primary)',
                background: 'var(--bg-card)',
                borderRadius: '0.85rem',
              }}
              role="region"
              aria-label="Candidate Accessibility Profile and Accommodation Settings"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} color="var(--primary)" />
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                      PwD Accessibility & Accommodation Profile
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Rights of Persons with Disabilities (PwD) Act 2016 Certified Accommodations
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {isSavedAccommodations && (
                    <span className="badge badge-green fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                      <Check size={12} /> Saved!
                    </span>
                  )}
                  <button
                    onClick={saveAccommodations}
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Impairment Tier */}
                <div>
                  <label htmlFor="impairment-tier" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Visual Impairment Tier
                  </label>
                  <select
                    id="impairment-tier"
                    value={impairmentTier}
                    onChange={e => setImpairmentTier(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.825rem', padding: '0.45rem 0.75rem' }}
                  >
                    <option value="Low Vision">Low Vision (Partial Sight)</option>
                    <option value="Legally Blind">Legally Blind (High Magnification Required)</option>
                    <option value="Total Blindness">Total Blindness (Screen Reader & Audio Only)</option>
                    <option value="Color Vision Deficient">Color Vision Deficient (Deuteranopia/Protanopia)</option>
                  </select>
                </div>

                {/* Government UDID Certificate Number */}
                <div>
                  <label htmlFor="udid-number" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Govt. Disability Certificate / UDID Card No.
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      id="udid-number"
                      value={udidNumber}
                      onChange={e => setUdidNumber(e.target.value)}
                      className="input-field"
                      style={{ fontSize: '0.825rem', padding: '0.45rem 0.75rem', flex: 1 }}
                      placeholder="e.g. DL04202400987654"
                    />
                    <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem', flexShrink: 0 }}>
                      Verified ✓
                    </span>
                  </div>
                </div>

                {/* Compensatory Time Multiplier */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Compensatory Extra Time Allocation
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[
                      { val: 1.0, label: '1.0x (Standard)' },
                      { val: 1.33, label: '1.33x (+20m/h)' },
                      { val: 1.5, label: '1.5x (PwD Default)' },
                      { val: 2.0, label: '2.0x (Double)' },
                    ].map(m => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setExtraTimeMultiplier(m.val)}
                        style={{
                          flex: 1,
                          padding: '0.4rem 0.2rem',
                          borderRadius: '0.45rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: extraTimeMultiplier === m.val ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                          background: extraTimeMultiplier === m.val ? 'var(--primary-light)' : 'var(--bg-surface)',
                          color: 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Screen Reader / Assistive Tech */}
                <div>
                  <label htmlFor="screen-reader-select" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Preferred Assistive Technology
                  </label>
                  <select
                    id="screen-reader-select"
                    value={screenReaderPref}
                    onChange={e => setScreenReaderPref(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.825rem', padding: '0.45rem 0.75rem' }}
                  >
                    <option value="Built-in SIGHT Voice">Built-in DrishtiX Voice Synthesizer</option>
                    <option value="NVDA">NVDA (NonVisual Desktop Access)</option>
                    <option value="JAWS">JAWS (Job Access With Speech)</option>
                    <option value="VoiceOver">Apple VoiceOver / TalkBack</option>
                    <option value="Refreshable Braille">Refreshable Braille Display (BRLTTY)</option>
                  </select>
                </div>
              </div>

              {/* Autonomous Mode Toggle Checkbox */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.6rem',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Shield size={14} color="var(--primary)" /> Autonomous Scribe-Free Exam Mode
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Candidate is certified to complete examinations independently without a human scribe. Answers are verbally confirmed and voice actions are logged.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autonomousMode}
                  onChange={e => setAutonomousMode(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  aria-label="Toggle Autonomous Scribe-Free Exam Mode"
                />
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
