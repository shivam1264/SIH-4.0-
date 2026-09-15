import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Keyboard,
  BookOpen,
  Target,
  Contrast,
  Bell,
  BarChart3,
  ShieldCheck,
  Eye,
  Award,
  ArrowRight,
  Sparkles,
  LogIn
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { speechService } from '../services/speechService';
import { classifyVoiceCommand } from '../services/voiceCommandClassifier';
import { globalVoiceService } from '../services/globalVoiceService';

function FeatureCard({ icon: IconComponent, title, description }: { icon: React.ComponentType<{ size?: number; color?: string }>; title: string; description: string }) {
  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      <div style={{ color: 'var(--primary)' }} aria-hidden="true">
        <IconComponent size={28} />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { prefs, setTheme } = useAccessibility();
  const [activeTheme, setActiveTheme] = useState(prefs.theme);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Press V for Voice Guidance');
  const recognitionRef = useRef<any>(null);

  // Step 1: Spoken Welcome & Screen Reader Announcement
  useEffect(() => {
    document.title = 'DrishtiX — Beyond Barriers, Brighter Futures';
    const welcomeText = 'Welcome to DrishtiX. Beyond Barriers, Brighter Futures. An accessible examination platform for independent learning. Get Started button. Login button. Press V to start voice guidance.';

    // Screen reader announcement
    const announce = document.createElement('div');
    announce.setAttribute('role', 'status');
    announce.setAttribute('aria-live', 'polite');
    announce.textContent = welcomeText;
    announce.style.position = 'absolute';
    announce.style.left = '-9999px';
    document.body.appendChild(announce);

    // Audio greeting (polite, gentle)
    const timer = setTimeout(() => {
      speechService.speak(welcomeText, { priority: true });
    }, 400);

    return () => {
      clearTimeout(timer);
      document.body.removeChild(announce);
      speechService.stop();
    };
  }, []);

  // Step 2: V Key listener to activate voice guidance
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'v' || e.key === 'V') {
        setVoiceEnabled(prev => {
          const next = !prev;
          if (next) {
            speechService.speak('Voice guidance enabled. You can navigate using keyboard or voice commands. Say Help to hear available commands.', { priority: true });
            setVoiceStatus('Listening… Say Help, Login, Register or Start');
          } else {
            speechService.speak('Voice guidance disabled.');
            setVoiceStatus('Press V for Voice Guidance');
          }
          return next;
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Voice commands on Landing Page using Global Voice
  useEffect(() => {
    if (!voiceEnabled) return;

    const unregister = globalVoiceService.register((rawText: string) => {
      const transcript = rawText.trim().toLowerCase();
      setVoiceStatus(`Recognized: "${transcript}"`);

      if (transcript.includes('help') || transcript.includes('madad')) {
        speechService.speak('You can say Login, Register, Accessibility Settings or Start.', { priority: true });
        return true;
      } else if (transcript.includes('login') || transcript.includes('sign in')) {
        speechService.speak('Opening login page.', {
          priority: true,
          onEnd: () => navigate('/login'),
        });
        setTimeout(() => navigate('/login'), 1200);
        return true;
      } else if (transcript.includes('register') || transcript.includes('sign up') || transcript.includes('get started')) {
        speechService.speak('Opening registration page.', {
          priority: true,
          onEnd: () => navigate('/register'),
        });
        setTimeout(() => navigate('/register'), 1200);
        return true;
      } else if (transcript.includes('setting') || transcript.includes('accessibility')) {
        speechService.speak('Opening accessibility settings.', {
          priority: true,
          onEnd: () => navigate('/settings'),
        });
        setTimeout(() => navigate('/settings'), 1200);
        return true;
      } else if (transcript.includes('start') || transcript.includes('exam') || transcript.includes('mock') || transcript.includes('ssc')) {
        speechService.speak('Opening mock examination library.', {
          priority: true,
          onEnd: () => navigate('/exams'),
        });
        setTimeout(() => navigate('/exams'), 1200);
        return true;
      }
      return false;
    });

    return unregister;
  }, [voiceEnabled, navigate]);

  const FEATURES = [
    { icon: Mic, title: 'Voice-Controlled Exams', description: 'Control every aspect of your exam using natural voice commands. Say "Read question", "Select option A", "Flag this", and more.' },
    { icon: Keyboard, title: 'Full Keyboard Navigation', description: 'Complete keyboard operability with Arrow keys, Spacebar, Tab, and custom hotkeys — no mouse ever required.' },
    { icon: BookOpen, title: 'Math Reading Engine', description: 'Complex equations like ₹5,000 at 8% p.a. are converted to natural speech so you hear every detail accurately.' },
    { icon: Target, title: 'AI Performance Analysis', description: 'After every mock, our AI identifies your weak topics, compares subject-wise performance, and creates a personalised study plan.' },
    { icon: Contrast, title: '4 Accessibility Themes', description: 'Default, Dark Mode, High Contrast (WCAG AAA), and Yellow-on-Black — switchable anytime with keyboard shortcuts.' },
    { icon: Bell, title: 'Audio Earcons & Alerts', description: 'Distinct tones for navigation, correct answers, warnings and timer alerts so you always know your exam status.' },
    { icon: BarChart3, title: 'Adaptive Practice Drills', description: 'AI picks topics where you scored below 60% and serves targeted practice questions to fill those gaps fast.' },
    { icon: ShieldCheck, title: 'WCAG 2.1 AA Certified', description: 'Built to meet international web accessibility guidelines with ARIA roles, semantic HTML, and focus management throughout.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Skip Nav */}
      <a href="#main-content" className="skip-nav">Skip to main content</a>

      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '0.65rem', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '3px' }} aria-hidden="true">
              <img src="/drishtix-icon.png" alt="DrishtiX Emblem" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.25rem', lineHeight: 1.1, display: 'flex', alignItems: 'center' }}>
                <span style={{ color: 'var(--text)' }}>Drishti</span>
                <span style={{ color: '#F59E0B' }}>X</span>
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.04em', fontWeight: 700 }}>
                BEYOND BARRIERS, BRIGHTER FUTURES
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme switcher */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {(['default', 'dark', 'high-contrast', 'yellow-black'] as const).map(t => (
                <button key={t} title={`${t} theme`} aria-label={`Switch to ${t} theme`}
                  onClick={() => { setTheme(t); setActiveTheme(t); }}
                  style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${activeTheme === t ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer',
                    background: t === 'default' ? '#F8FAFC' : t === 'dark' ? '#0F172A' : t === 'high-contrast' ? '#000' : '#000',
                    outline: activeTheme === t ? '2px solid var(--focus-ring)' : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
            <button className="btn-ghost" onClick={() => navigate('/login')} style={{ fontSize: '0.875rem' }}>Sign In</button>
            <button className="btn-primary" onClick={() => navigate('/register')} style={{ fontSize: '0.875rem' }}>Get Started Free</button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="hero-gradient" style={{ padding: '5rem 1.5rem', textAlign: 'center' }} aria-labelledby="hero-heading">
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="badge badge-blue fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
              <Award size={15} /> India's First Fully Accessible AI Exam Platform
            </div>
            <h1 id="hero-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, color: 'var(--text)', marginBottom: '1.5rem' }} className="fade-in">
              Exams{' '}
              <span style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Without Barriers
              </span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 600, margin: '0 auto 2.5rem' }} className="fade-in">
              Prepare for SSC, Banking, UPSC and Railway exams independently using voice commands, keyboard navigation, and AI-powered personalised learning — no mouse, no assistance needed.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }} className="fade-in">
              <button className="btn-primary" onClick={() => navigate('/register')} style={{ padding: '0.9rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} /> Start Your Journey
              </button>
              <button className="btn-secondary" onClick={() => navigate('/login')} style={{ padding: '0.9rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogIn size={18} /> Demo Login
              </button>
            </div>
            <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Demo: <strong>aryan@example.com</strong> / <strong>student123</strong>
            </p>
          </div>
        </section>

        {/* Stats */}
        <section style={{ background: 'var(--bg-card)', padding: '3rem 1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} aria-label="Platform statistics">
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}>
            <StatBadge value="4" label="Exam Categories" />
            <StatBadge value="36+" label="Practice Questions" />
            <StatBadge value="WCAG 2.1 AA" label="Accessibility Standard" />
            <StatBadge value="4" label="UI Themes" />
            <StatBadge value="100%" label="Screen Reader Compatible" />
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '5rem 1.5rem', background: 'var(--bg)' }} aria-labelledby="features-heading">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 id="features-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text)', marginBottom: '1rem' }}>
                Every Feature Built for Independence
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
                We didn't add accessibility as an afterthought. Every interaction is designed from the ground up for screen readers, keyboard users, and voice-first operation.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section style={{ padding: '5rem 1.5rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }} aria-labelledby="how-heading">
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 id="how-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, textAlign: 'center', marginBottom: '3rem', color: 'var(--text)' }}>
              From Registration to Result in 5 Steps
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { n: '1', title: 'Register & Configure', desc: 'Set up your accessibility preferences — theme, font size, voice mode, and keyboard shortcuts — all in one guided setup.' },
                { n: '2', title: 'Choose Your Exam', desc: 'Browse SSC, Banking, UPSC or Railway mock tests. Use voice command "Start mock test" or Tab to navigate the list.' },
                { n: '3', title: 'Attempt Independently', desc: 'Voice commands read questions aloud. Press 1-4 to select answers, F to flag, N/P to navigate, and S to submit.' },
                { n: '4', title: 'Receive AI Analysis', desc: 'Our AI identifies weak topics, compares subject accuracy, and highlights exactly where you lost marks.' },
                { n: '5', title: 'Practice & Improve', desc: 'Targeted practice drills fix your weak areas. Attempt another mock and watch your score improve over time.' },
              ].map(step => (
                <div key={step.n} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0 }} aria-hidden="true">{step.n}</div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>{step.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Keyboard Reference */}
        <section style={{ padding: '4rem 1.5rem', background: 'var(--bg)' }} aria-labelledby="keyboard-heading">
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 id="keyboard-heading" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '2rem', textAlign: 'center', marginBottom: '2rem', color: 'var(--text)' }}>
              Keyboard Shortcuts Reference
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {[
                ['1, 2, 3, 4', 'Select answer options A, B, C, D'],
                ['N / →',      'Next question'],
                ['P / ←',      'Previous question'],
                ['F',          'Flag / unflag current question'],
                ['R',          'Read question aloud (TTS)'],
                ['V',          'Toggle voice command mode'],
                ['S',          'Submit exam (confirm dialog)'],
                ['Esc',        'Close modal / cancel action'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.6rem' }}>
                  <kbd style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0.35rem', padding: '0.2rem 0.55rem', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{key}</kbd>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '5rem 1.5rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', textAlign: 'center' }} aria-labelledby="cta-heading">
          <h2 id="cta-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            Ready to Take Control of Your Exam Preparation?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '2rem', fontSize: '1.1rem' }}>Join and experience truly independent, accessible exam preparation.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ background: '#fff', color: '#1D4ED8', border: '2px solid #fff', borderRadius: '0.6rem', padding: '0.9rem 2rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              Create Free Account
            </button>
            <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '0.6rem', padding: '0.9rem 2rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              Try Demo Account
            </button>
          </div>
        </section>
      </main>

      <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          © 2026 DrishtiX · Beyond Barriers, Brighter Futures · Built for SIH 4.0 · WCAG 2.1 AA Compliant · Dedicated to barrier-free accessibility
        </p>
      </footer>

      {/* Floating Voice Guidance Bar (Step 2) */}
      <aside
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          right: '1.25rem',
          zIndex: 999,
          background: 'var(--bg-card)',
          border: '2px solid var(--primary)',
          borderRadius: '2rem',
          padding: '0.65rem 1.25rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backdropFilter: 'blur(8px)',
        }}
        aria-live="polite"
        role="status"
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: voiceEnabled ? '#22C55E' : '#94A3B8', animation: voiceEnabled ? 'pulse 1.5s infinite' : 'none' }} />
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text)' }}>
          {voiceStatus}
        </span>
        <button
          className="btn-primary"
          onClick={() => {
            const next = !voiceEnabled;
            setVoiceEnabled(next);
            if (next) {
              speechService.speak('Voice guidance enabled. You can navigate using keyboard or voice commands. Say Help to hear available commands.', { priority: true });
              setVoiceStatus('Listening… Say Help, Login, Register or Start');
            } else {
              speechService.speak('Voice guidance disabled.');
              setVoiceStatus('Press V for Voice Guidance');
            }
          }}
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          aria-label={voiceEnabled ? 'Turn off voice guidance' : 'Turn on voice guidance, or press V'}
        >
          {voiceEnabled ? <><MicOff size={13} /> Mute Voice</> : <><Mic size={13} /> Voice (V)</>}
        </button>
      </aside>
    </div>
  );
}
