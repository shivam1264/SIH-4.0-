import React, { useState } from 'react';
import { Volume2, Calculator, Copy, Check, Sparkles } from 'lucide-react';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';

interface AccessibleMathViewerProps {
  formula: string;
  verbalization?: string;
  title?: string;
  inline?: boolean;
}

/**
 * Converts mathematical and LaTeX-like expressions into natural, phonetic spoken English
 */
export function verbalizeMathExpression(input: string): string {
  if (!input) return '';

  let speech = input;

  // Fractions: \frac{numerator}{denominator}
  speech = speech.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, 'fraction: $1 over $2, end fraction');

  // Square roots: \sqrt{expression}
  speech = speech.replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1, end root');
  speech = speech.replace(/sqrt\(([^)]+)\)/g, 'square root of $1, end root');

  // Exponents / Powers: x^2, x^{n+1}
  speech = speech.replace(/([a-zA-Z0-9]+)\^2\b/g, '$1 squared');
  speech = speech.replace(/([a-zA-Z0-9]+)\^3\b/g, '$1 cubed');
  speech = speech.replace(/([a-zA-Z0-9]+)\^\{([^}]+)\}/g, '$1 to the power of $2');
  speech = speech.replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '$1 to the power of $2');

  // Subscripts: x_1, a_{ij}
  speech = speech.replace(/([a-zA-Z0-9]+)_\{([^}]+)\}/g, '$1 sub $2');
  speech = speech.replace(/([a-zA-Z0-9]+)_([a-zA-Z0-9]+)/g, '$1 sub $2');

  // Common math symbols
  const symbolMap: Record<string, string> = {
    '\\pm': ' plus or minus ',
    '\\times': ' multiplied by ',
    '\\div': ' divided by ',
    '\\cdot': ' dot product with ',
    '\\leq': ' is less than or equal to ',
    '\\geq': ' is greater than or equal to ',
    '\\neq': ' is not equal to ',
    '\\approx': ' is approximately equal to ',
    '\\infty': ' infinity ',
    '\\pi': ' pi ',
    '\\theta': ' theta ',
    '\\alpha': ' alpha ',
    '\\beta': ' beta ',
    '\\Delta': ' delta ',
    '\\sum': ' summation ',
    '\\int': ' integral of ',
    '\\in': ' belongs to ',
    '\\subset': ' is a subset of ',
    '\\cup': ' union ',
    '\\cap': ' intersection ',
    '\\equiv': ' is equivalent to ',
    '=': ' equals ',
    '+': ' plus ',
    '-': ' minus ',
    '*': ' multiplied by ',
    '/': ' divided by ',
    '<': ' is less than ',
    '>': ' is greater than ',
    '²': ' squared ',
    '³': ' cubed ',
    '√': ' square root of ',
    '±': ' plus or minus ',
    'π': ' pi ',
  };

  for (const [sym, spoken] of Object.entries(symbolMap)) {
    speech = speech.split(sym).join(spoken);
  }

  // Clean redundant whitespace and brackets
  speech = speech
    .replace(/[{}\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return speech;
}

export default function AccessibleMathViewer({
  formula,
  verbalization,
  title = 'Mathematical Expression',
  inline = false,
}: AccessibleMathViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const spokenText = verbalization || verbalizeMathExpression(formula);

  const handleSpeakFormula = () => {
    audioCueService.select();
    setIsSpeaking(true);
    speechService.speak(`Mathematical formula: ${spokenText}`, {
      priority: true,
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <span
        className="inline-math"
        style={{
          fontFamily: "'Courier New', monospace",
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '0.1rem 0.4rem',
          fontWeight: 700,
          color: 'var(--primary)',
          cursor: 'pointer',
        }}
        onClick={handleSpeakFormula}
        role="button"
        tabIndex={0}
        aria-label={`Formula: ${spokenText}. Click or press to verbalize.`}
      >
        {formula}
      </span>
    );
  }

  return (
    <div
      className="card fade-in"
      style={{
        background: 'var(--bg-surface)',
        border: '1.5px solid var(--primary)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        margin: '0.75rem 0',
        boxShadow: 'var(--shadow-sm)',
      }}
      role="region"
      aria-label={`${title}: ${spokenText}`}
    >
      {/* Formula Header Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.6rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
          <Calculator size={15} />
          <span>{title}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={handleCopy}
            className="btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            aria-label="Copy raw formula text"
          >
            {copied ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleSpeakFormula}
            className="btn-primary"
            style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.65rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: isSpeaking ? '#16A34A' : 'var(--primary)',
            }}
            aria-label={`Verbalize formula aloud. Press M or click here.`}
          >
            <Volume2 size={14} className={isSpeaking ? 'mic-pulse' : ''} />
            <span>{isSpeaking ? 'Reading Formula…' : 'Verbalize Formula (M)'}</span>
          </button>
        </div>
      </div>

      {/* Visual Mathematical Notation Rendering */}
      <div
        style={{
          fontFamily: "'Cambria Math', 'STIX Two Math', 'Times New Roman', serif",
          fontSize: '1.25rem',
          fontWeight: 700,
          textAlign: 'center',
          padding: '0.75rem 0.5rem',
          color: 'var(--text)',
          letterSpacing: '0.04em',
          background: 'var(--bg-card)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
          overflowX: 'auto',
        }}
        aria-hidden="true"
      >
        {formula}
      </div>

      {/* Phonetic Spoken Transcript */}
      <div
        style={{
          marginTop: '0.6rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.4rem',
          lineHeight: 1.45,
          background: 'rgba(37,99,235,0.06)',
          padding: '0.45rem 0.65rem',
          borderRadius: '0.4rem',
        }}
      >
        <Sparkles size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
        <span>
          <strong style={{ color: 'var(--text)' }}>Speech Verbalization:</strong> "{spokenText}"
        </span>
      </div>
    </div>
  );
}
