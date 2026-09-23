import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Home,
  Sun,
  Moon,
  Contrast,
  Mic,
  MicOff,
  Keyboard,
  X,
  Volume2,
  ChevronRight,
  Shield,
  Bell,
  CheckCircle2,
  Sparkles,
  Compass,
  Radio,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { speechService } from '../services/speechService';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';
import { audioCueService } from '../services/audioCueService';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title = 'Dashboard' }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const { prefs, setTheme, setFontSize } = useAccessibility();
  const { active: voiceActive, status: voiceStatus, engine, toggleVoice, lastTranscript } = useVoiceAssistant();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const isAdminRoute = location.pathname.startsWith('/admin') || user?.role === 'admin';

  // Register screen reader elements
  useEffect(() => {
    if (politeRef.current && assertiveRef.current) {
      screenReaderAnnouncer.registerElements(politeRef.current, assertiveRef.current);
    }
  }, []);

  // Automatic spoken page orientation on route changes
  useEffect(() => {
    screenReaderAnnouncer.handleRouteChange(location.pathname, prefs.voiceMode);
  }, [location.pathname, prefs.voiceMode]);

  // Global accessibility hotkeys (B / O for orientation, Alt+1 to Alt+6 for navigation)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'b' || e.key === 'B' || e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        audioCueService.pageOrient();
        screenReaderAnnouncer.orientCurrentPage(location.pathname, true);
      }
      if (e.key === '?' || (e.altKey && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
      if (e.altKey && e.key === '1') { e.preventDefault(); audioCueService.navigation(); navigate('/dashboard'); }
      if (e.altKey && e.key === '2') { e.preventDefault(); audioCueService.navigation(); navigate('/exams'); }
      if (e.altKey && e.key === '3') { e.preventDefault(); audioCueService.navigation(); navigate('/practice'); }
      if (e.altKey && e.key === '4') { e.preventDefault(); audioCueService.navigation(); navigate('/study-materials'); }
      if (e.altKey && e.key === '5') { e.preventDefault(); audioCueService.navigation(); navigate('/pyqs'); }
      if (e.altKey && e.key === '6') { e.preventDefault(); audioCueService.navigation(); navigate('/performance'); }
      if (e.altKey && e.key === '7') { e.preventDefault(); audioCueService.navigation(); navigate('/history'); }
      if (e.altKey && e.key === '8') { e.preventDefault(); audioCueService.navigation(); navigate('/results'); }
      if (e.altKey && e.key === '9') { e.preventDefault(); audioCueService.navigation(); navigate('/settings'); }
      if (e.altKey && e.key === '0') { e.preventDefault(); audioCueService.navigation(); navigate('/profile'); }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [location.pathname, navigate]);

  function cycleTheme() {
    audioCueService.select();
    if (prefs.theme === 'default') {
      setTheme('dark');
      speechService.speak('Dark mode activated.');
    } else if (prefs.theme === 'dark') {
      setTheme('high-contrast');
      speechService.speak('High contrast theme activated.');
    } else if (prefs.theme === 'high-contrast') {
      setTheme('yellow-black');
      speechService.speak('Yellow on black theme activated.');
    } else {
      setTheme('default');
      speechService.speak('Light theme activated.');
    }
  }

  function cycleFontSize() {
    audioCueService.select();
    if (prefs.fontSize === 'default') {
      setFontSize('large');
      speechService.speak('Text size large 115 percent.');
    } else if (prefs.fontSize === 'large') {
      setFontSize('xlarge');
      speechService.speak('Text size extra large 135 percent.');
    } else if (prefs.fontSize === 'xlarge') {
      setFontSize('xxlarge');
      speechService.speak('Text size maximum 150 percent.');
    } else {
      setFontSize('default');
      speechService.speak('Text size normal 100 percent.');
    }
  }

  const handleOrientClick = () => {
    audioCueService.pageOrient();
    screenReaderAnnouncer.orientCurrentPage(location.pathname, true);
  };

  const shortcuts = [
    { key: 'Alt + D / V', desc: 'Wake / Toggle Drishti AI Voice Assistant' },
    { key: 'B / O', desc: 'Hear spoken page orientation and available options' },
    { key: 'Esc', desc: 'Immediately silence speech / close dialogs' },
    { key: '? / Alt + K', desc: 'Open full platform keyboard & voice shortcuts guide' },
    { key: 'Alt + 1 to 6', desc: 'Direct vocal jump to Dashboard, Exams, Practice, Results, Settings, Profile' },
    { key: '1-4 / A-D', desc: 'Select option A, B, C, or D in exam & practice drills' },
    { key: 'N / P', desc: 'Next or Previous question' },
    { key: 'R', desc: 'Read question and options aloud' },
    { key: 'F', desc: 'Flag / unflag question for review' },
    { key: 'T', desc: 'Hear remaining exam time with PwD compensatory allocation' },
    { key: 'M / D', desc: 'Verbalize math formulas / Describe diagram audio' },
    { key: 'S / Alt + S', desc: 'Submit examination with two-step voice protection' },
  ];


  return (
    <div className="app-layout">
      {/* Visually Impaired Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only"
        style={{
          position: 'fixed',
          top: '0.6rem',
          left: '0.6rem',
          zIndex: 99999,
          padding: '0.65rem 1.25rem',
          background: 'var(--primary, #2563EB)',
          color: '#ffffff',
          fontWeight: 800,
          borderRadius: '0.5rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          textDecoration: 'none',
          outline: '3px solid #ffffff',
        }}
      >
        Skip to Main Educational Content (Enter)
      </a>

      {/* Screen Reader ARIA Live Announcers */}
      <div
        id="sr-polite-announcements"
        ref={politeRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      <div
        id="sr-assertive-announcements"
        ref={assertiveRef}
        className="sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      />

      {/* Desktop sidebar */}
      <div
        className="hidden md:block"
        style={{
          width: 'var(--sidebar-width, 276px)',
          minWidth: 'var(--sidebar-width, 276px)',
          maxWidth: 'var(--sidebar-width, 276px)',
          height: '100vh',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Sidebar />
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, backdropFilter: 'blur(3px)' }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      {sidebarOpen && (
        <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 'var(--sidebar-width, 276px)', zIndex: 201, overflow: 'auto', background: 'var(--bg-sidebar)', boxShadow: '4px 0 24px rgba(0,0,0,0.2)' }}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Container */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', overflow: 'hidden', minWidth: 0, flex: 1 }}>
        {/* Fixed Executive Header & Voice Accessibility Cockpit */}
        <header
          role="banner"
          style={{
            height: 60,
            maxHeight: 60,
            padding: '0 1rem',
            background: 'var(--bg-header)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '2px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            flexShrink: 0,
            boxSizing: 'border-box',
            overflow: 'visible',
            gap: '0.75rem',
          }}
        >
          {/* Left: Mobile Menu & Clean Minimal Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flexShrink: 1 }}>
            <button
              className="btn-ghost md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              style={{ padding: '0.45rem', minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={22} />
            </button>

            <nav
              aria-label="Breadcrumb navigation"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <button
                type="button"
                onClick={() => navigate(isAdminRoute ? '/admin?tab=dashboard' : '/dashboard')}
                aria-label="Go to Dashboard (Alt + 1)"
                title="Go to Dashboard (Alt + 1)"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  minWidth: 36,
                  minHeight: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--breadcrumb-home, #8D3C1B)',
                  borderRadius: '0.375rem',
                  transition: 'transform 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <Home size={22} strokeWidth={2.4} />
              </button>

              <ChevronRight
                size={16}
                strokeWidth={2.4}
                style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                aria-hidden="true"
              />

              {title !== 'Dashboard' ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => navigate(isAdminRoute ? '/admin?tab=dashboard' : '/dashboard')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                    }}
                    className="hidden sm:inline"
                    title="Dashboard"
                  >
                    Dashboard
                  </button>
                  <ChevronRight
                    size={16}
                    strokeWidth={2.4}
                    className="hidden sm:inline"
                    style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <h1
                    style={{
                      margin: 0,
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: 'var(--text)',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {title}
                  </h1>
                </div>
              ) : (
                <h1
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    color: 'var(--text)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Dashboard
                </h1>
              )}
            </nav>
          </div>

          {/* Center/Right: Accessible Voice & Assistive Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>

            {/* Persistent Drishti AI Voice Assistant Status Badge */}
            <button
              onClick={toggleVoice}
              className="btn-ghost"
              style={{
                padding: '0.35rem 0.75rem',
                minHeight: 40,
                borderRadius: '999px',
                border: voiceActive ? '1.5px solid #22C55E' : '1.5px solid var(--border)',
                background: voiceActive ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-surface)',
                color: voiceActive ? (prefs.theme === 'yellow-black' ? '#FFFF00' : '#15803D') : 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: voiceActive ? '0 0 12px rgba(34, 197, 94, 0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}
              aria-label={`Drishti AI Voice Assistant: ${voiceActive ? 'Active and listening' : 'Muted'}. Press Alt + D or V to toggle.`}
              title="Drishti AI Voice Assistant (Press Alt+D or V anytime)"
            >
              {voiceActive ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: 16 }}>
                    <span style={{ width: 3, height: '100%', background: '#22C55E', borderRadius: 2, animation: 'soundwave 0.8s ease-in-out infinite alternate' }} />
                    <span style={{ width: 3, height: '60%', background: '#22C55E', borderRadius: 2, animation: 'soundwave 0.6s ease-in-out infinite alternate 0.2s' }} />
                    <span style={{ width: 3, height: '85%', background: '#22C55E', borderRadius: 2, animation: 'soundwave 0.7s ease-in-out infinite alternate 0.4s' }} />
                  </div>
                  <Mic size={15} color="#22C55E" />
                  <span className="hidden sm:inline font-bold">Drishti Active</span>
                </>
              ) : (
                <>
                  <MicOff size={15} style={{ opacity: 0.6 }} />
                  <span className="hidden sm:inline" style={{ color: 'var(--text-muted)' }}>Drishti Muted</span>
                </>
              )}
              <kbd style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 800 }}>
                V
              </kbd>
            </button>

            {/* Quick "Orient Me" Spoken Page Briefing Button */}
            <button
              onClick={handleOrientClick}
              className="btn-ghost"
              style={{
                padding: '0.35rem 0.65rem',
                minHeight: 40,
                borderRadius: '0.5rem',
                border: '1.5px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
              aria-label="Hear spoken page orientation and available actions (Hotkey: O or B)"
              title="Spoken Page Orientation (Press O or B)"
            >
              <Compass size={16} color="var(--primary)" />
              <span className="hidden md:inline">Orient Me</span>
              <kbd style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 800 }}>
                O
              </kbd>
            </button>

            {/* Quick Text Size Scaler */}
            <button
              className="btn-ghost"
              onClick={cycleFontSize}
              style={{
                padding: '0.35rem 0.55rem',
                minHeight: 40,
                minWidth: 42,
                fontSize: '0.8rem',
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border)',
                borderRadius: '0.5rem',
                fontWeight: 700,
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                whiteSpace: 'nowrap',
              }}
              aria-label={`Current font scaling: ${prefs.fontSize === 'default' ? '100%' : prefs.fontSize === 'large' ? '115%' : prefs.fontSize === 'xlarge' ? '135%' : '150%'}. Click to enlarge font.`}
              title="Toggle Font Size (100% → 115% → 135% → 150%)"
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>A</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>
                {prefs.fontSize === 'default' ? '100%' : prefs.fontSize === 'large' ? '115%' : prefs.fontSize === 'xlarge' ? '135%' : '150%'}
              </span>
            </button>

            {/* Quick Theme Switcher */}
            <button
              className="btn-ghost"
              onClick={cycleTheme}
              style={{
                padding: '0.4rem',
                minHeight: 40,
                minWidth: 40,
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={`Current theme: ${prefs.theme}. Click to cycle light, dark, high-contrast, yellow on black.`}
              title="Cycle Color Theme (Light → Dark → High Contrast → Yellow on Black)"
            >
              {prefs.theme === 'default' && <Sun size={17} style={{ color: '#D97706' }} />}
              {prefs.theme === 'dark' && <Moon size={17} style={{ color: '#60A5FA' }} />}
              {(prefs.theme === 'high-contrast' || prefs.theme === 'yellow-black') && <Contrast size={17} style={{ color: 'var(--primary)' }} />}
            </button>

            {/* Platform Keyboard & Voice Shortcuts Guide */}
            <button
              className="btn-ghost"
              onClick={() => {
                audioCueService.select();
                setShowShortcutsModal(true);
              }}
              style={{
                padding: '0.4rem',
                minHeight: 40,
                minWidth: 40,
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Platform Keyboard & Voice Shortcuts (Press ? or Alt+K)"
              title="Keyboard & Voice Shortcuts (? / Alt+K)"
            >
              <Keyboard size={17} />
            </button>

            {/* User Profile Avatar */}
            <div
              onClick={() => {
                audioCueService.navigation();
                isAdminRoute ? navigate('/admin?tab=profile') : navigate('/profile');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.2rem 0.55rem 0.2rem 0.25rem',
                minHeight: 40,
                borderRadius: '9999px',
                border: '1.5px solid var(--border)',
                cursor: 'pointer',
                marginLeft: '0.2rem',
                background: 'var(--bg-surface)',
              }}
              title="Profile & Disability Accommodations (Alt + 6)"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  isAdminRoute ? navigate('/admin?tab=profile') : navigate('/profile');
                }
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: isAdminRoute ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isAdminRoute ? 'AD' : user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <span className="hidden md:inline" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>
                {isAdminRoute ? 'Admin' : user?.name || 'Student'}
              </span>
            </div>
          </div>
        </header>

        <style>{`
          @keyframes soundwave {
            0% { height: 25%; }
            50% { height: 100%; }
            100% { height: 40%; }
          }
        `}</style>


        {/* Main Content Area - Scrollable underneath fixed header */}
        <main
          id="main-content"
          style={{
            flex: 1,
            height: 'calc(100vh - 56px)',
            padding: '1.75rem 1.5rem 3rem',
            overflowY: 'auto',
            background: 'transparent',
          }}
        >
          {children}
        </main>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="shortcuts-dialog-title">
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Keyboard size={20} color="var(--primary)" />
                <h2 id="shortcuts-dialog-title" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)' }}>
                  Platform Keyboard Shortcuts
                </h2>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setShowShortcutsModal(false)}
                aria-label="Close shortcuts dialog"
                style={{ padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              DrishtiX is 100% operable without touching a mouse. Use these keystrokes at any point:
            </p>

            <div
              data-scrollable="true"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '55vh', overflowY: 'auto' }}
            >
              {shortcuts.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '0.4rem', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>{s.desc}</span>
                  <kbd style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '0.3rem', padding: '0.2rem 0.5rem', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn-primary" onClick={() => setShowShortcutsModal(false)}>
                Got it, close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 769px) {
          .app-layout { grid-template-columns: var(--sidebar-width, 276px) 1fr; height: 100vh; max-height: 100vh; overflow: hidden; width: 100%; }
          .hidden.md\\:block { display: block !important; }
          .md\\:hidden { display: none !important; }
        }
        @media (max-width: 768px) {
          .app-layout { grid-template-columns: 1fr; height: 100vh; max-height: 100vh; overflow: hidden; width: 100%; }
          .hidden.md\\:block { display: none !important; }
          .md\\:hidden { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
