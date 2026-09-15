import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, AlertTriangle, Loader2, LogIn, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); document.title = 'Sign In — DrishtiX'; }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, pass);
    setLoading(false);
    if (result.ok) {
      if (result.role === 'admin') {
        navigate('/admin?tab=dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.error ?? 'Login failed.');
    }
  }

  function fillDemo(role: 'student' | 'admin') {
    if (role === 'student') { setEmail('aryan@example.com'); setPass('student123'); }
    else { setEmail('admin@drishtix.in'); setPass('admin123'); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '1rem', background: '#fff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '6px' }}>
              <img src="/drishtix-icon.png" alt="DrishtiX Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span>Drishti</span><span style={{ color: '#F59E0B' }}>X</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em' }}>Beyond Barriers, Brighter Futures</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {/* Error */}
          {error && (
            <div role="alert" style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '0.6rem', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="login-email" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>Email Address</label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                required
                className="input-field"
                value={email}
                onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
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
              <label htmlFor="login-pass" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>Password</label>
              <input
                id="login-pass"
                type="password"
                required
                className="input-field"
                value={pass}
                onChange={e => { setPass(e.target.value); if (error) setError(''); }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              {loading ? <><Loader2 size={16} className="spin" /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>Quick Demo Access:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => fillDemo('student')} style={{ fontSize: '0.8rem', padding: '0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                <User size={14} /> Student Demo
              </button>
              <button className="btn-secondary" onClick={() => fillDemo('admin')} style={{ fontSize: '0.8rem', padding: '0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={14} /> Admin Demo
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
