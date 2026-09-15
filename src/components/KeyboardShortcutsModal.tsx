import React, { useEffect } from 'react';
import {
  Keyboard,
  X,
  Volume2,
  CheckCircle2,
  HelpCircle,
  Zap,
  Mic,
  ArrowRight,
  Flag,
  Send,
  Calculator,
  Eye,
  FileText
} from 'lucide-react';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    audioCueService.select();
    speechService.speak(
      'Keyboard shortcuts guide opened. You can navigate the exam completely without a mouse using 1 to 4 for options, N for next, P for previous, R to read aloud, and S to submit. Press Escape to close this guide.',
      { priority: true }
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutSections = [
    {
      title: 'Option Selection',
      icon: CheckCircle2,
      color: '#2563EB',
      items: [
        { keys: ['1', 'A'], desc: 'Select Option A' },
        { keys: ['2', 'B'], desc: 'Select Option B' },
        { keys: ['3', 'C'], desc: 'Select Option C' },
        { keys: ['4', 'D'], desc: 'Select Option D' },
        { keys: ['↑', '↓'], desc: 'Cycle cyclically through options A to D' },
        { keys: ['Enter'], desc: 'Confirm selection and advance to next' },
      ],
    },
    {
      title: 'Question Navigation',
      icon: ArrowRight,
      color: '#059669',
      items: [
        { keys: ['N', '→'], desc: 'Next question' },
        { keys: ['P', '←'], desc: 'Previous question' },
        { keys: ['F'], desc: 'Toggle flag (Mark for Review)' },
        { keys: ['S'], desc: 'Open Submit Examination confirmation dialog' },
      ],
    },
    {
      title: 'Speech & Audio Assistance',
      icon: Volume2,
      color: '#7C3AED',
      items: [
        { keys: ['R'], desc: 'Read question and options aloud' },
        { keys: ['V'], desc: 'Toggle microphone speech recognition on / off' },
        { keys: ['M'], desc: 'Verbalize mathematical formula phonetically' },
        { keys: ['E'], desc: 'AI Explain / Simplify question text' },
        { keys: ['D'], desc: 'Describe visual diagram aloud' },
      ],
    },
    {
      title: 'General & Accessibility',
      icon: Zap,
      color: '#D97706',
      items: [
        { keys: ['?'], desc: 'Open this Keyboard Shortcuts cheat sheet' },
        { keys: ['Esc'], desc: 'Close open dialogs, menus, or overlays' },
        { keys: ['Tab'], desc: 'Move accessible focus forward' },
        { keys: ['Shift + Tab'], desc: 'Move accessible focus backward' },
      ],
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        className="card fade-in"
        style={{
          width: '100%',
          maxWidth: 680,
          background: 'var(--bg-card)',
          border: '2px solid var(--primary)',
          borderRadius: '1rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
            padding: '1.25rem 1.5rem',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '0.5rem',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Keyboard size={20} color="#fff" />
            </div>
            <div>
              <h2
                id="shortcuts-modal-title"
                style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}
              >
                Keyboard-Only Examination Navigation
              </h2>
              <p style={{ fontSize: '0.78rem', margin: 0, opacity: 0.9 }}>
                Complete mouse-free controls optimized for Visually Impaired & Blind candidates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ color: '#fff', padding: '0.35rem', borderRadius: '0.4rem' }}
            aria-label="Close shortcuts dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {shortcutSections.map(sec => {
              const Icon = sec.icon;
              return (
                <div
                  key={sec.title}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: sec.color,
                      marginBottom: '0.75rem',
                      borderBottom: '1px solid var(--border)',
                      paddingBottom: '0.4rem',
                    }}
                  >
                    <Icon size={16} />
                    <span>{sec.title}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sec.items.map(item => (
                      <div
                        key={item.desc}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{item.desc}</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {item.keys.map(k => (
                            <kbd
                              key={k}
                              style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                padding: '0.15rem 0.45rem',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--primary)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              }}
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Press <kbd style={{ padding: '0.1rem 0.3rem', border: '1px solid var(--border)', borderRadius: '3px' }}>?</kbd> anytime to reopen this cheatsheet.
          </span>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.15rem' }}
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
