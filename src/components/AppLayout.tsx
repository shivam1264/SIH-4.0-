import React, { useState } from 'react';
import {
  Menu,
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
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAccessibility } from '../context/AccessibilityContext';
import { speechService } from '../services/speechService';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title = 'Dashboard' }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const { prefs, setTheme, setFontSize, toggleVoice } = useAccessibility();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdminRoute = location.pathname.startsWith('/admin') || user?.role === 'admin';

  function cycleTheme() {
    if (prefs.theme === 'default') setTheme('dark');
    else if (prefs.theme === 'dark') setTheme('high-contrast');
    else setTheme('default');
  }

  function cycleFontSize() {
    if (prefs.fontSize === 'default') setFontSize('large');
    else if (prefs.fontSize === 'large') setFontSize('xlarge');
    else setFontSize('default');
  }

  const shortcuts = [
    { key: 'V', desc: 'Toggle Voice Guidance & Speech commands' },
    { key: 'B', desc: 'Hear spoken audio briefing for current page' },
    { key: 'R', desc: 'Read question or section aloud' },
    { key: '1-4', desc: 'Select option A, B, C, or D in exam' },
    { key: 'Alt + N', desc: 'Navigate to Next question' },
    { key: 'Alt + P', desc: 'Navigate to Previous question' },
    { key: 'Alt + S', desc: 'Submit examination with confirmation' },
    { key: 'Tab', desc: 'Move focus forward across elements' },
    { key: 'Shift + Tab', desc: 'Move focus backward' },
    { key: 'Enter / Space', desc: 'Activate selected button or control' },
  ];

  return (
    <div className="app-layout">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
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
        <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 280, zIndex: 201, overflow: 'auto', background: 'var(--bg-sidebar)', boxShadow: '4px 0 24px rgba(0,0,0,0.2)' }}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Container */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
        {/* Fixed Executive Header Bar */}
        <header
          role="banner"
          style={{
            height: 56,
            padding: '0 1.25rem',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            flexShrink: 0,
          }}
        >
          {/* Left: Mobile Menu & Clean Minimal Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <button
              className="btn-ghost md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={20} />
            </button>

            <nav
              aria-label="Breadcrumb"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.88rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                {isAdminRoute ? 'Admin' : 'Portal'}
              </span>
              <span style={{ color: 'var(--text-muted)', opacity: 0.35 }}>/</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                {title}
              </span>
            </nav>
          </div>

          {/* Right: Clean & Compact Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            {/* Admin Notifications */}
            {isAdminRoute && (
              <button
                className="btn-ghost"
                onClick={() => navigate('/admin?tab=notifications')}
                style={{
                  position: 'relative',
                  padding: '0.4rem',
                  borderRadius: '0.5rem',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Notifications"
                title="Notifications (3 unread)"
              >
                <Bell size={17} />
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#EF4444',
                  }}
                />
              </button>
            )}

            {/* Quick Voice Mode Button */}
            <button
              className="btn-ghost"
              onClick={() => {
                toggleVoice();
                speechService.speak(prefs.voiceMode ? 'Voice guidance muted.' : 'Voice guidance active. Press V anytime.');
              }}
              style={{
                fontSize: '0.78rem',
                padding: '0.32rem 0.65rem',
                border: prefs.voiceMode ? '1px solid #86EFAC' : '1px solid var(--border)',
                background: prefs.voiceMode ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-surface)',
                color: prefs.voiceMode ? '#16A34A' : 'var(--text)',
                borderRadius: '0.45rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
              aria-label={prefs.voiceMode ? 'Voice Guidance Active' : 'Voice Guidance Muted'}
              title="Voice Guidance (Shortcut: V)"
            >
              {prefs.voiceMode ? (
                <>
                  <Mic size={14} color="#16A34A" />
                  <span className="hidden sm:inline">Voice On</span>
                </>
              ) : (
                <>
                  <MicOff size={14} style={{ opacity: 0.6 }} />
                  <span className="hidden sm:inline">Voice Off</span>
                </>
              )}
            </button>

            {/* Quick Text Size Switcher */}
            <button
              className="btn-ghost"
              onClick={cycleFontSize}
              style={{
                padding: '0.32rem 0.55rem',
                fontSize: '0.78rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.45rem',
                fontWeight: 600,
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                whiteSpace: 'nowrap',
              }}
              aria-label={`Font size: ${prefs.fontSize}`}
              title="Toggle Font Size"
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>A</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>
                {prefs.fontSize === 'default' ? '100%' : prefs.fontSize === 'large' ? '115%' : '135%'}
              </span>
            </button>

            {/* Quick Theme Switcher */}
            <button
              className="btn-ghost"
              onClick={cycleTheme}
              style={{
                padding: '0.4rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.45rem',
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={`Theme: ${prefs.theme}`}
              title="Toggle Theme"
            >
              {prefs.theme === 'default' && <Sun size={15} style={{ color: '#D97706' }} />}
              {prefs.theme === 'dark' && <Moon size={15} style={{ color: '#60A5FA' }} />}
              {(prefs.theme === 'high-contrast' || prefs.theme === 'yellow-black') && <Contrast size={15} style={{ color: 'var(--primary)' }} />}
            </button>

            {/* Keyboard Shortcuts Dialog Button */}
            <button
              className="btn-ghost"
              onClick={() => setShowShortcutsModal(true)}
              style={{
                padding: '0.4rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.45rem',
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Keyboard Shortcuts"
              title="Keyboard Shortcuts"
            >
              <Keyboard size={15} />
            </button>

            {/* User Profile Avatar */}
            <div
              onClick={() => (isAdminRoute ? navigate('/admin?tab=profile') : navigate('/profile'))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.2rem 0.5rem 0.2rem 0.25rem',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                marginLeft: '0.2rem',
                background: 'var(--bg-surface)',
              }}
              title="Profile"
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isAdminRoute ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isAdminRoute ? 'AD' : user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <span className="hidden md:inline" style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text)' }}>
                {isAdminRoute ? 'Admin' : user?.name || 'Student'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area - Scrollable underneath fixed header */}
        <main
          id="main-content"
          style={{
            flex: 1,
            height: 'calc(100vh - 56px)',
            padding: '1.75rem 1.5rem 3rem',
            overflowY: 'auto',
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
              SIGHT-EXAM AI is 100% operable without touching a mouse. Use these keystrokes at any point:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '55vh', overflowY: 'auto' }}>
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
        @media (min-width: 768px) {
          .app-layout { grid-template-columns: 260px 1fr; height: 100vh; max-height: 100vh; overflow: hidden; }
          .hidden.md\\:block { display: block !important; }
          .md\\:hidden { display: none !important; }
        }
        @media (max-width: 767px) {
          .app-layout { grid-template-columns: 1fr; height: 100vh; max-height: 100vh; overflow: hidden; }
          .hidden.md\\:block { display: none !important; }
          .md\\:hidden { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
