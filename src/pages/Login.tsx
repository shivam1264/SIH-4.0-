import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, AlertTriangle, Loader2, LogIn, User, ShieldCheck, ArrowLeft, Sparkles, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import { usePageVoice } from '../hooks/usePageVoice';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const performLogin = useCallback(async (targetEmail: string, targetPass: string, welcomeMsg?: string) => {
    setError('');
    setLoading(true);
    if (welcomeMsg) {
      speechService.speak(welcomeMsg, { priority: true });
    }
    const result = await login(targetEmail, targetPass);
    setLoading(false);
    if (result.ok) {
      audioCueService.success();
      if (result.role === 'admin') {
        speechService.speak('Welcome Administrator. Opening Management Cockpit.', { priority: true });
        navigate('/admin?tab=dashboard', { replace: true });
      } else {
        speechService.speak('Welcome Aryan. Opening Student Dashboard.', { priority: true });
        navigate('/dashboard', { replace: true });
      }
    } else {
      audioCueService.error();
      const errText = result.error ?? 'Login failed. Please check credentials.';
      setError(errText);
      speechService.speak(errText, { priority: true });
    }
  }, [login, navigate]);

  usePageVoice('Login', [
    {
      triggers: ['login as student', 'student login', 'demo student', 'student demo', 'sign in student', 'candidate login'],
      answer: () => 'Signing in as candidate Aryan Sharma.',
      action: () => performLogin('aryan@example.com', 'student123', 'Signing in as candidate Aryan Sharma.'),
    },
    {
      triggers: ['login as admin', 'admin login', 'demo admin', 'admin demo', 'sign in admin', 'administrator login'],
      answer: () => 'Signing in as Examination Administrator.',
      action: () => performLogin('admin@drishtix.in', 'admin123', 'Signing in as Examination Administrator.'),
    },
    {
      triggers: ['register', 'create account', 'sign up', 'new account', 'open register'],
      answer: () => 'Opening registration page.',
      action: () => navigate('/register'),
    },
    {
      triggers: ['go home', 'back to home', 'main page'],
      answer: () => 'Going back to home page.',
      action: () => navigate('/'),
    },
  ]);

  useEffect(() => {
    emailRef.current?.focus();
    document.title = 'Sign In — DrishtiX Accessible Platform';
    const timer = setTimeout(() => {
      speechService.speak('Sign In to DrishtiX. Press Alt S for instant Student Demo login, or Alt A for Admin Demo login.', { priority: false });
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Global hotkeys for accessible instant demo logins
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && (e.key === 's' || e.key === 'S' || e.key === '1')) {
        e.preventDefault();
        performLogin('aryan@example.com', 'student123', 'Signing in as candidate Aryan Sharma.');
      } else if (e.altKey && (e.key === 'a' || e.key === 'A' || e.key === '2')) {
        e.preventDefault();
        performLogin('admin@drishtix.in', 'admin123', 'Signing in as Examination Administrator.');
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, performLogin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      speechService.speak('Please enter your registered email address.');
      return;
    }
    if (!pass) {
      setError('Please enter your password.');
      speechService.speak('Please enter your password.');
      return;
    }
    await performLogin(email, pass);
  }

  function handleDemoClick(role: 'student' | 'admin') {
    if (role === 'student') {
      setEmail('aryan@example.com');
      setPass('student123');
      performLogin('aryan@example.com', 'student123', 'Signing in as candidate Aryan Sharma.');
    } else {
      setEmail('admin@drishtix.in');
      setPass('admin123');
      performLogin('admin@drishtix.in', 'admin123', 'Signing in as Examination Administrator.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '1rem', background: '#fff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '6px' }}>
              <img src="/drishtix-logo.png" alt="DrishtiX Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span>Drishti</span><span style={{ color: '#F59E0B' }}>X</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            Accessible Competitive Examination Platform
          </p>
        </div>

        <div className="card" style={{ padding: '2rem', border: '1.5px solid var(--border)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}>
          {/* Error Live Region */}
          {error && (
            <div role="alert" style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '0.6rem', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="login-email" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>
                Email Address
              </label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                required
                className="input-field"
                value={email}
                onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
                onFocus={() => speechService.speak('Email field focused. Enter email, or press Alt S for student demo or Alt A for admin demo.')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('login-pass')?.focus();
                  }
                }}
                placeholder="you@example.com"
                autoComplete="email"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="login-pass" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>
                Password
              </label>
              <input
                id="login-pass"
                type="password"
                required
                className="input-field"
                value={pass}
                onChange={e => { setPass(e.target.value); if (error) setError(''); }}
                onFocus={() => speechService.speak('Password field focused. Enter your password.')}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              {loading ? <><Loader2 size={16} className="spin" /> Signing in…</> : <><LogIn size={16} /> Sign In to Portal</>}
            </button>
          </form>

          {/* Instant 1-Click Demo Logins */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Instant 1-Click Demo Login
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                RPwD Ready
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleDemoClick('student')}
                disabled={loading}
                title="Instant login as Candidate Aryan Sharma (Alt+S)"
                style={{
                  fontSize: '0.82rem',
                  padding: '0.65rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  cursor: 'pointer',
                  border: '1.5px solid var(--border)',
                  borderRadius: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: 'var(--text)' }}>
                  <User size={15} color="#2563EB" /> Student Demo
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Press <kbd style={{ padding: '0.1rem 0.3rem', background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)', fontSize: '0.68rem', fontWeight: 700 }}>Alt+S</kbd>
                </span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleDemoClick('admin')}
                disabled={loading}
                title="Instant login as Examination Administrator (Alt+A)"
                style={{
                  fontSize: '0.82rem',
                  padding: '0.65rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  cursor: 'pointer',
                  border: '1.5px solid var(--border)',
                  borderRadius: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: 'var(--text)' }}>
                  <ShieldCheck size={15} color="#059669" /> Admin Demo
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Press <kbd style={{ padding: '0.1rem 0.3rem', background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)', fontSize: '0.68rem', fontWeight: 700 }}>Alt+A</kbd>
                </span>
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one free</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={13} /> Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
