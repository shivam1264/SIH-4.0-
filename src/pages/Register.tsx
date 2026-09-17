import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, AlertTriangle, Check, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { speechService } from '../services/speechService';

const EXAM_OPTIONS = ['SSC', 'Banking', 'Railway', 'UPSC', 'State PSC', 'Teaching'];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [pass, setPass]             = useState('');
  const [confirm, setConfirm]       = useState('');
  const [selectedExams, setSelectedExams] = useState<string[]>(['SSC', 'Banking']);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    document.title = 'Create Account — DrishtiX';
    speechService.speak('Registration page opened. Welcome to DrishtiX. Please enter your name, email, password, and choose your target exams.', { priority: true });
  }, []);

  const toggleExam = (exam: string) => {
    setSelectedExams(prev => {
      const next = prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam];
      speechService.speak(next.includes(exam) ? `${exam} selected.` : `${exam} removed.`);
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address.');
    if (pass.length < 6) return setError('Password must be at least 6 characters.');
    if (pass !== confirm) return setError('Passwords do not match.');
    if (selectedExams.length === 0) return setError('Please select at least one target examination.');

    setLoading(true);
    const result = await register(name.trim(), email, pass);
    setLoading(false);
    if (result.ok) {
      speechService.speak(`Welcome ${name.trim()}! Your target exams are ${selectedExams.join(' and ')}. Opening accessibility setup now.`, {
        priority: true,
        onEnd: () => navigate('/onboarding'),
      });
      setTimeout(() => navigate('/onboarding'), 2200);
    } else {
      setError(result.error ?? 'Registration failed.');
      speechService.speak(result.error ?? 'Registration failed.');
    }
  }

  const formFields = [
    { id: 'reg-name',    label: 'Full Name',        type: 'text',     val: name,    set: setName,    ph: 'Aryan Sharma',            autoC: 'name', prompt: 'Please enter your name.' },
    { id: 'reg-email',   label: 'Email Address',    type: 'email',    val: email,   set: setEmail,   ph: 'you@example.com',         autoC: 'email', prompt: 'Enter your email.' },
    { id: 'reg-pass',    label: 'Password',         type: 'password', val: pass,    set: setPass,    ph: '6+ characters',           autoC: 'new-password', prompt: 'Create a password.' },
    { id: 'reg-confirm', label: 'Confirm Password', type: 'password', val: confirm, set: setConfirm, ph: 'Repeat your password',    autoC: 'new-password', prompt: 'Confirm your password.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <div style={{ width: 68, height: 68, borderRadius: '1rem', background: '#fff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '5px' }}>
              <img src="/drishtix-logo.png" alt="DrishtiX Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span>Drishti</span><span style={{ color: '#F59E0B' }}>X</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            Beyond Barriers, Brighter Futures
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {error && (
            <div role="alert" style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '0.6rem', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {formFields.map((f, idx) => (
              <div key={f.id} style={{ marginBottom: '1rem' }}>
                <label htmlFor={f.id} style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--text)' }}>
                  {f.label}
                </label>
                <input
                  id={f.id}
                  type={f.type}
                  required
                  className="input-field"
                  value={f.val}
                  onChange={e => {
                    f.set(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const next = formFields[idx + 1];
                      if (next) {
                        document.getElementById(next.id)?.focus();
                      } else {
                        handleSubmit(e);
                      }
                    }
                  }}
                  onFocus={() => speechService.speak(f.prompt)}
                  placeholder={f.ph}
                  autoComplete={f.autoC}
                />
              </div>
            ))}

            {/* Target Exams Selection (Step 3 in user journey) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text)' }}>
                Which examination are you preparing for?
              </label>
              <div
                role="group"
                aria-label="Select target examinations"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}
              >
                {EXAM_OPTIONS.map(exam => {
                  const selected = selectedExams.includes(exam);
                  return (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => toggleExam(exam)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '2rem',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: selected ? 'var(--primary-light)' : 'var(--bg-card)',
                        color: selected ? 'var(--primary)' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      aria-pressed={selected}
                    >
                      {selected ? <Check size={13} /> : '+ '} {exam}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Selected: {selectedExams.join(', ') || 'None'}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {loading ? <><Loader2 size={16} className="spin" /> Creating account…</> : <>Continue to Setup <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
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
