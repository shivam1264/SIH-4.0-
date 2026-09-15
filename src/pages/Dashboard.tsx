import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  BarChart3,
  Trophy,
  Target,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  Play,
  Headphones,
  Mic,
  MicOff,
  Calculator,
  Landmark,
  TrendingUp,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { speechService } from '../services/speechService';
import { usePageVoice } from '../hooks/usePageVoice';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { MOCK_ATTEMPTS, EXAMS } from '../data/mockData';

// ── Hero Illustration Component ──
function HeroIllustration() {
  return (
    <div
      style={{
        position: 'relative',
        width: 380,
        height: 175,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {/* Soundwave badge */}
      <div
        style={{
          position: 'absolute',
          top: 25,
          left: 85,
          background: '#2563EB',
          borderRadius: '0.85rem',
          padding: '0.35rem 0.65rem',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
          zIndex: 2,
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        <span style={{ width: 3, height: 10, background: '#fff', borderRadius: 2 }} />
        <span style={{ width: 3, height: 18, background: '#fff', borderRadius: 2 }} />
        <span style={{ width: 3, height: 12, background: '#fff', borderRadius: 2 }} />
        <span style={{ width: 3, height: 22, background: '#fff', borderRadius: 2 }} />
        <span style={{ width: 3, height: 14, background: '#fff', borderRadius: 2 }} />
        <span style={{ width: 3, height: 8, background: '#fff', borderRadius: 2 }} />
      </div>

      {/* SVG Character (Headphones + Laptop) */}
      <svg
        width="210"
        height="175"
        viewBox="0 0 210 175"
        fill="none"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Soft glow circle behind student */}
        <circle cx="105" cy="90" r="68" fill="rgba(255,255,255,0.12)" />

        {/* Torso / Clothes */}
        <path d="M55 175 C55 135, 70 125, 105 125 C140 125, 155 135, 155 175 Z" fill="#0F172A" />
        <path d="M70 140 C80 130, 130 130, 140 140 L145 175 L65 175 Z" fill="#1E3A8A" />

        {/* Neck */}
        <rect x="95" y="102" width="20" height="25" rx="5" fill="#FBBF24" />

        {/* Face */}
        <ellipse cx="105" cy="85" rx="26" ry="30" fill="#FDE68A" />
        {/* Smile & Eyes */}
        <ellipse cx="97" cy="82" rx="2.5" ry="3.5" fill="#1E293B" />
        <ellipse cx="113" cy="82" rx="2.5" ry="3.5" fill="#1E293B" />
        <path d="M101 93 Q105 98 109 93" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Hair */}
        <path d="M79 76 C79 55, 91 46, 107 46 C123 46, 135 55, 135 76 C130 68, 123 65, 115 68 C107 65, 93 67, 85 75 Z" fill="#0F172A" />
        <path d="M79 76 C77 82, 78 90, 80 92 C81 86, 83 80, 87 78 Z" fill="#0F172A" />
        <path d="M131 76 C133 82, 132 90, 130 92 C129 86, 127 80, 123 78 Z" fill="#0F172A" />

        {/* Headphones band */}
        <path d="M77 80 C77 58, 87 48, 105 48 C123 48, 133 58, 133 80" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Left earcup */}
        <rect x="71" y="72" width="12" height="24" rx="6" fill="#0284C7" />
        <rect x="73" y="75" width="8" height="18" rx="4" fill="#E0F2FE" />
        {/* Right earcup */}
        <rect x="127" y="72" width="12" height="24" rx="6" fill="#0284C7" />
        <rect x="129" y="75" width="8" height="18" rx="4" fill="#E0F2FE" />

        {/* Laptop Screen back */}
        <path d="M125 110 L175 110 L170 155 L120 155 Z" fill="#334155" />
        {/* Screen inside */}
        <path d="M128 114 L171 114 L167 151 L124 151 Z" fill="#1E293B" />
        <circle cx="147" cy="132" r="5" fill="#60A5FA" />
        {/* Laptop keyboard base */}
        <path d="M100 155 L180 155 L195 175 L85 175 Z" fill="#475569" />
        {/* Hands */}
        <ellipse cx="110" cy="162" rx="10" ry="6" fill="#FDE68A" />
        <ellipse cx="135" cy="162" rx="10" ry="6" fill="#FDE68A" />
      </svg>

      {/* Script Quote on right */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '-5px',
          position: 'relative',
          zIndex: 2,
          userSelect: 'none',
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive, sans-serif",
            fontSize: '1.45rem',
            lineHeight: 1.15,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            transform: 'rotate(-4deg)',
            textShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontWeight: 700,
          }}
        >
          <div>Same</div>
          <div>Opportunities</div>
          <div style={{ fontSize: '1.6rem', color: '#fff' }}>Brighter</div>
          <div style={{ fontSize: '1.6rem', color: '#fff' }}>Futures</div>
        </div>
        {/* Yellow swoosh */}
        <svg width="100" height="14" viewBox="0 0 100 14" fill="none" style={{ marginTop: '2px', transform: 'rotate(-4deg)' }}>
          <path d="M5 8 C 30 14, 70 12, 95 3" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// ── Metric StatCard Component ──
interface StatCardProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconBg: string;
  iconColor: string;
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
  value: string | number;
  label: string;
  chartGraphic?: React.ReactNode;
}

function StatCard({
  icon: IconComponent,
  iconBg,
  iconColor,
  badgeText,
  badgeBg,
  badgeColor,
  value,
  label,
  chartGraphic,
}: StatCardProps) {
  return (
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
      {/* Top Row: Icon + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '0.6rem',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconComponent size={20} color={iconColor} />
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            background: badgeBg,
            color: badgeColor,
            lineHeight: 1.2,
          }}
        >
          {badgeText}
        </span>
      </div>

      {/* Bottom Row: Value + Label + Graphic */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
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
            {value}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {label}
          </div>
        </div>

        {chartGraphic && (
          <div style={{ paddingBottom: '0.15rem' }} aria-hidden="true">
            {chartGraphic}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prefs } = useAccessibility();

  // Automatically redirect Admin to Admin Control Center
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin?tab=dashboard', { replace: true });
    }
  }, [user, navigate]);

  const attempts = MOCK_ATTEMPTS.filter(
    a => a.studentId === user?.id || user?.role === 'student'
  );

  const { active: voiceActive, toggleVoice, status: voiceStatus } = useVoiceAssistant();

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
    : 66;
  const bestScore = 80;

  const briefingText = `Dashboard. Your current score is ${avgScore} percent. You have completed ${
    attempts.length || 4
  } tests. Your weak topics are Pipes and Cisterns and History. You have recommended practice sessions ready. Say Start practice, or Show exams.`;

  // Register Dashboard Q&A with Global Voice Assistant
  usePageVoice('Dashboard', [
    {
      triggers: ['score', 'marks', 'kitna score', 'average score', 'numbers', 'mera score'],
      answer: () => `Aapka current average score ${avgScore} percent hai, aur personal best ${bestScore} percent hai.`,
    },
    {
      triggers: ['kitne test', 'kitne exam', 'kitne mock test', 'total test complete', 'kitne diye', 'test kitne'],
      answer: () => `Aapne kul ${attempts.length || 4} mock tests complete kiye hain.`,
    },
    {
      triggers: ['weak', 'kamjori', 'weak topic', 'weakness', 'kya sudharu'],
      answer: () => `Aapke weak topics Pipes and Cisterns aur Indian History hain. Inme practice ki zarurat hai.`,
    },
    {
      triggers: ['streak', 'daily streak', 'lagatar'],
      answer: () => `Aapki daily streak saat din ki hai. Shandar consistency!`,
    },
    {
      triggers: ['briefing', 'summary', 'overview', 'batao', 'aaj ka', 'haal'],
      answer: () => briefingText,
    },
    {
      triggers: ['practice', 'abhyas', 'start practice', 'practice karo'],
      answer: () => 'Practice section khola ja raha hai.',
      action: () => navigate('/practice'),
    },
    {
      triggers: ['show exam', 'open exam', 'exams', 'pariksha', 'test library'],
      answer: () => 'Mock exam library kholi ja rahi hai.',
      action: () => navigate('/exams'),
    },
    {
      triggers: ['analytics', 'performance', 'pradarshan'],
      answer: () => 'Performance analytics par le ja rahe hain.',
      action: () => navigate('/performance'),
    },
  ]);

  // Announce Dashboard briefing on mount
  useEffect(() => {
    document.title = 'Dashboard — SIGHT-EXAM AI';
    const timer = setTimeout(() => {
      speechService.speak(briefingText, { priority: true });
    }, 500);
    return () => {
      clearTimeout(timer);
      speechService.stop();
    };
  }, []);

  return (
    <AppLayout title="Dashboard">
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {/* ── 1. Hero Banner ── */}
        <div
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 40%, #6366F1 75%, #8B5CF6 100%)',
            borderRadius: '1.25rem',
            padding: '2rem 2.25rem',
            color: '#fff',
            marginBottom: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(37,99,235,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* Left Hero Content */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.25rem 0.75rem',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>Candidate Portal • Ready to Learn</span>
            </div>

            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '2.1rem',
                fontWeight: 900,
                marginBottom: '0.45rem',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Welcome back, {user?.name?.split(' ')[0] || 'Aryan'}! 👋
            </h1>

            <p style={{ opacity: 0.95, fontSize: '0.92rem', maxWidth: 500, lineHeight: 1.55, marginBottom: '1.35rem' }}>
              You have completed <strong>{attempts.length || 4} full mock exams</strong> with an average accuracy of{' '}
              <strong>{avgScore}%</strong>. Let's make today count!
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/exams')}
                style={{
                  background: '#fff',
                  color: '#2563EB',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  padding: '0.65rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '0.65rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                }}
              >
                <Play size={15} fill="#2563EB" /> Start New Mock
              </button>

              <button
                onClick={() => speechService.speak(briefingText, { priority: true })}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '0.65rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '0.65rem',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                }}
                aria-label="Repeat spoken dashboard briefing. Shortcut key B."
              >
                <Headphones size={16} /> Spoken Briefing (B)
              </button>
            </div>
          </div>

          {/* Right Hero Illustration */}
          <HeroIllustration />
        </div>

        {/* ── 2. Speech Guidance Banner ── */}
        <div
          className="card fade-in"
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.85rem',
          }}
          role="region"
          aria-label="Voice command assistant"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mic size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                Speech Guidance: {voiceActive ? (voiceStatus || 'Listening…') : 'Press V for Voice Commands'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Try voice commands: "Start practice", "Show exams", "Show my performance", "Briefing"
              </div>
            </div>
          </div>

          <button
            onClick={() => toggleVoice()}
            style={{
              background: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              padding: '0.5rem 1rem',
              borderRadius: '0.65rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
            }}
          >
            {voiceActive ? <MicOff size={15} /> : <Mic size={15} />}
            <span>{voiceActive ? 'Mic Off' : 'Mic On (V)'}</span>
          </button>
        </div>

        {/* ── 3. Row of 4 Metric Stat Cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Card 1: Tests Attempted */}
          <StatCard
            icon={FileText}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            badgeText="↑ +2 this week"
            badgeBg="#F0FDF4"
            badgeColor="#16A34A"
            value={attempts.length || 4}
            label="Tests Attempted"
          />

          {/* Card 2: Average Score */}
          <StatCard
            icon={BarChart3}
            iconBg="#F5F3FF"
            iconColor="#7C3AED"
            badgeText="Cumulative"
            badgeBg="#F5F3FF"
            badgeColor="#7C3AED"
            value={`${avgScore}%`}
            label="Average Score"
            chartGraphic={
              <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
                <path
                  d="M2 18 C 14 8, 24 22, 38 12 C 46 6, 52 14, 58 8"
                  stroke="#A855F7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M54 8 L58 8 L58 12"
                  stroke="#A855F7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />

          {/* Card 3: Best Score */}
          <StatCard
            icon={Trophy}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            badgeText="Personal Best"
            badgeBg="#F0FDF4"
            badgeColor="#16A34A"
            value={`${bestScore}%`}
            label="Best Score"
            chartGraphic={
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                <path
                  d="M4 20 L24 10 L32 14 L44 4"
                  stroke="#22C55E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M36 4 L44 4 L44 12"
                  stroke="#22C55E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />

          {/* Card 4: Focus Areas Detected */}
          <StatCard
            icon={Target}
            iconBg="#FFF7ED"
            iconColor="#EA580C"
            badgeText="AI Analyzed"
            badgeBg="#FFF7ED"
            badgeColor="#EA580C"
            value="4"
            label="Focus Areas Detected"
            chartGraphic={
              <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                <rect x="4" y="14" width="4" height="10" rx="2" fill="#F97316" fillOpacity="0.4" />
                <rect x="12" y="8" width="4" height="16" rx="2" fill="#F97316" fillOpacity="0.7" />
                <rect x="20" y="2" width="4" height="22" rx="2" fill="#F97316" />
              </svg>
            }
          />
        </div>

        {/* ── 4. Two-Column Main Content Hub ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: '1.25rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Available Mock Examinations */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <BookOpen size={20} color="#2563EB" />
                <h2 style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1.15rem' }}>
                  Available Mock Examinations
                </h2>
              </div>
              <button
                className="btn-ghost"
                onClick={() => navigate('/exams')}
                style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                All Exams <ArrowRight size={13} />
              </button>
            </div>

            {/* 2x2 Grid of Exams */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {/* Card 1: SSC CGL */}
              <div
                className="card card-interactive fade-in"
                style={{
                  padding: '1.1rem',
                  borderRadius: '0.85rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/exam/ssc-reasoning-01')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: '#FEF3C7',
                          color: '#D97706',
                        }}
                      >
                        Medium
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} /> 12m
                      </span>
                    </div>

                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '0.5rem',
                        background: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText size={18} color="#3B82F6" />
                    </div>
                  </div>

                  <h3 style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.35 }}>
                    SSC CGL — General Intelligence & Reasoning
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>10 Questions</span>
                  <span style={{ color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    Start <ArrowRight size={12} />
                  </span>
                </div>
              </div>

              {/* Card 2: Banking PO */}
              <div
                className="card card-interactive fade-in"
                style={{
                  padding: '1.1rem',
                  borderRadius: '0.85rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/exam/banking-quant-01')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                        }}
                      >
                        Hard
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} /> 15m
                      </span>
                    </div>

                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '0.5rem',
                        background: '#FFF7ED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Calculator size={18} color="#EA580C" />
                    </div>
                  </div>

                  <h3 style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.35 }}>
                    Banking PO — Quantitative Aptitude
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>8 Questions</span>
                  <span style={{ color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    Start <ArrowRight size={12} />
                  </span>
                </div>
              </div>

              {/* Card 3: UPSC Prelims */}
              <div
                className="card card-interactive fade-in"
                style={{
                  padding: '1.1rem',
                  borderRadius: '0.85rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/exam/upsc-gs1-01')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                        }}
                      >
                        Hard
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} /> 16m
                      </span>
                    </div>

                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '0.5rem',
                        background: '#FEF3C7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Landmark size={18} color="#D97706" />
                    </div>
                  </div>

                  <h3 style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.35 }}>
                    UPSC Prelims — General Studies (History & Polity)
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>10 Questions</span>
                  <span style={{ color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    Start <ArrowRight size={12} />
                  </span>
                </div>
              </div>

              {/* Card 4: Railway RRB */}
              <div
                className="card card-interactive fade-in"
                style={{
                  padding: '1.1rem',
                  borderRadius: '0.85rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/exam/railway-gk-01')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: '#DCFCE7',
                          color: '#16A34A',
                        }}
                      >
                        Easy
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} /> 10m
                      </span>
                    </div>

                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '0.5rem',
                        background: '#ECFDF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BookOpen size={18} color="#059669" />
                    </div>
                  </div>

                  <h3 style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.35 }}>
                    Railway RRB — General Knowledge & Current Affairs
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>8 Questions</span>
                  <span style={{ color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    Start <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Recommendations */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#7C3AED" />
                <h2 style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1.15rem' }}>
                  AI Recommendations
                </h2>
              </div>
              <button
                className="btn-ghost"
                onClick={() => navigate('/practice')}
                style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                All Drills <ArrowRight size={13} />
              </button>
            </div>

            {/* AI Recommendation Card */}
            <div
              className="card card-interactive fade-in"
              style={{
                padding: '1.5rem',
                borderRadius: '0.85rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Badges Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span
                    style={{
                      background: '#FEE2E2',
                      color: '#EF4444',
                      borderRadius: '999px',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <TrendingUp size={12} /> HIGH PRIORITY
                  </span>
                  <span
                    style={{
                      background: '#EFF6FF',
                      color: '#2563EB',
                      borderRadius: '999px',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    Practice
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Targeted Remediation
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.45rem' }}>
                  Master Pipes & Cisterns
                </h3>
                <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  Your accuracy in Pipes & Cisterns is 0%. Practice 15 targeted questions to build formula fluency before your next Banking mock.
                </p>
              </div>

              {/* Progress & Target Stats */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                    marginBottom: '0.45rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div>
                    Current Accuracy: <strong style={{ color: '#EF4444' }}>0%</strong>
                  </div>
                  <div>
                    Goal: <strong style={{ color: '#16A34A' }}>70%</strong>
                  </div>
                </div>

                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: '#E2E8F0',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '6%',
                      height: '100%',
                      background: '#EF4444',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>

              {/* Big Start Practice Button */}
              <button
                onClick={() => navigate('/practice')}
                style={{
                  background: 'linear-gradient(90deg, #F87171 0%, #EF4444 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.65rem',
                  padding: '0.75rem 1rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                  cursor: 'pointer',
                  marginTop: '0.25rem',
                }}
              >
                <Target size={16} /> Start Practice Now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
