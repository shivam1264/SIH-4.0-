import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ThumbsUp,
  BarChart3,
  TrendingDown,
  Target,
  CheckCircle2,
  Clock,
  Check,
  X,
  MinusCircle,
  Sparkles,
  AlertTriangle,
  Award,
  BookOpen,
  FileText,
  Search,
  ArrowRight
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { MOCK_ATTEMPTS, EXAMS } from '../data/mockData';
import { usePageVoice } from '../hooks/usePageVoice';
import type { ExamAttempt } from '../types';

export default function Results() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [exam, setExam] = useState(EXAMS[0]);
  const [showSolutions, setShowSolutions] = useState(false);

  useEffect(() => {
    document.title = 'Results — DrishtiX';
    // Check live attempts (localStorage) first
    const liveAttempts: ExamAttempt[] = JSON.parse(localStorage.getItem('sight-exam-attempts') ?? '[]');
    const all = [...liveAttempts, ...MOCK_ATTEMPTS];
    const found = all.find(a => a.id === attemptId);
    if (found) {
      setAttempt(found);
      const e = EXAMS.find(e => e.id === found.examId);
      if (e) setExam(e);
    }
  }, [attemptId]);

  if (!attempt) {
    return (
      <AppLayout title="Results">
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
            <Search size={48} strokeWidth={1.5} />
          </div>
          <p>Result not found. <button className="btn-ghost" onClick={() => navigate('/performance')} style={{ color: 'var(--primary)' }}>View all results</button></p>
        </div>
      </AppLayout>
    );
  }

  const grade = attempt.percentage >= 80 ? { label: 'Excellent', color: 'var(--accent)', bg: 'var(--accent-light)', icon: Trophy }
    : attempt.percentage >= 60 ? { label: 'Good', color: 'var(--primary)', bg: 'var(--primary-light)', icon: ThumbsUp }
    : attempt.percentage >= 40 ? { label: 'Average', color: 'var(--warning)', bg: 'var(--warning-light)', icon: BarChart3 }
    : { label: 'Needs Work', color: 'var(--danger)', bg: 'var(--danger-light)', icon: TrendingDown };

  const GradeIcon = grade.icon;

  const statItems = [
    { label: 'Score', value: `${attempt.score}/${attempt.maxScore}`, icon: Target, color: grade.color },
    { label: 'Accuracy', value: `${attempt.accuracy}%`, icon: CheckCircle2, color: 'var(--accent)' },
    { label: 'Avg Time/Q', value: `${attempt.avgTimePerQ}s`, icon: Clock, color: 'var(--primary)' },
    { label: 'Correct', value: String(Math.round(attempt.score / 2)), icon: Check, color: 'var(--accent)' },
    { label: 'Wrong', value: String(exam.questions.length - Math.round(attempt.score / 2) - (exam.questions.length - attempt.answers.filter(a => a.chosen).length)), icon: X, color: 'var(--danger)' },
    { label: 'Unattempted', value: String(exam.questions.length - attempt.answers.filter(a => a.chosen).length), icon: MinusCircle, color: 'var(--text-muted)' },
  ];

  const correctCount = Math.round(attempt.score / 2);
  const unattemptedCount = exam.questions.length - attempt.answers.filter(a => a.chosen).length;
  const wrongCount = exam.questions.length - correctCount - unattemptedCount;

  usePageVoice('Results', [
    {
      triggers: ['score', 'marks', 'kitne marks', 'result', 'mera score', 'percentage'],
      answer: () => `Aapko ${attempt.score} out of ${attempt.maxScore} marks mile hain, jo ki ${attempt.percentage} percent hai. Performance ${grade.label} hai.`,
    },
    {
      triggers: ['correct', 'sahi', 'kitne sahi', 'right'],
      answer: () => `Aapne ${correctCount} questions sahi kiye hain.`,
    },
    {
      triggers: ['wrong', 'galat', 'kitne galat'],
      answer: () => `Aapke ${wrongCount} questions galat hue hain.`,
    },
    {
      triggers: ['accuracy', 'accuracy kitni'],
      answer: () => `Aapki accuracy ${attempt.accuracy} percent rahi.`,
    },
    {
      triggers: ['time', 'kitna time', 'samay'],
      answer: () => `Average time per question ${attempt.avgTimePerQ} seconds tha.`,
    },
    {
      triggers: ['solution', 'answers', 'uttar', 'solutions dikhao', 'show solution'],
      answer: () => 'Solutions display kiye ja rahe hain.',
      action: () => setShowSolutions(true),
    },
    {
      triggers: ['hide solution', 'solutions band karo', 'chupao'],
      answer: () => 'Solutions hide kar diye gaye hain.',
      action: () => setShowSolutions(false),
    },
    {
      triggers: ['summary', 'batao', 'overview'],
      answer: () => `Exam summary: Score ${attempt.percentage} percent, ${correctCount} correct, ${wrongCount} wrong. Grade: ${grade.label}.`,
    },
    {
      triggers: ['retake', 'try again', 'dobara', 'phir se'],
      answer: () => 'Exam dobara shuru kiya ja raha hai.',
      action: () => navigate(`/exam/${attempt.examId}`),
    },
  ]);

  return (
    <AppLayout title="Your Results">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Result header */}
        <div className="card fade-in" style={{ textAlign: 'center', marginBottom: '1.5rem', background: `linear-gradient(135deg, ${grade.bg}, var(--bg-card))`, borderColor: grade.color }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.6rem', color: grade.color }} aria-hidden="true">
            <GradeIcon size={52} strokeWidth={1.75} />
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', fontWeight: 900, color: grade.color }} aria-label={`Your score: ${attempt.percentage} percent`}>{attempt.percentage}%</h1>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.35rem' }}>{grade.label}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{attempt.examTitle}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem' }}>Submitted {new Date(attempt.submittedAt).toLocaleString('en-IN')}</p>
        </div>

        {/* Score breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {statItems.map(s => {
            const IconComponent = s.icon;
            return (
              <div key={s.label} className="card fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ color: s.color, opacity: 0.9 }} aria-hidden="true">
                  <IconComponent size={22} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: s.color, fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Subject breakdown */}
          <div className="card fade-in">
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="var(--primary)" />
              Subject-wise Analysis
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {attempt.subjectBreakdown.map(s => {
                const c = s.status === 'strong' ? 'var(--accent)' : s.status === 'moderate' ? 'var(--warning)' : 'var(--danger)';
                return (
                  <div key={s.subject}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{s.subject}</span>
                      <span style={{ color: c, fontWeight: 700 }}>{s.correct}/{s.total} ({s.percentage}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div style={{ height: '100%', borderRadius: 999, width: `${s.percentage}%`, background: c, transition: 'width 0.7s ease' }} />
                    </div>
                    <div className={`badge badge-${s.status === 'strong' ? 'green' : s.status === 'moderate' ? 'amber' : 'red'}`} style={{ fontSize: '0.65rem', marginTop: '0.3rem' }}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Analysis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {attempt.weakTopics.length > 0 && (
              <div className="card fade-in" style={{ borderLeft: '4px solid var(--danger)' }}>
                <h2 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={17} />
                  AI: Focus Areas
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attempt.weakTopics.slice(0, 4).map(t => (
                    <div key={t} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.825rem' }}>
                      <AlertTriangle size={14} color="var(--danger)" aria-hidden="true" />
                      <span style={{ color: 'var(--text)' }}>{t}</span>
                      <button className="btn-ghost" onClick={() => navigate('/practice')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', marginLeft: 'auto', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        Practice <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {attempt.strongTopics.length > 0 && (
              <div className="card fade-in" style={{ borderLeft: '4px solid var(--accent)' }}>
                <h2 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={17} />
                  Strong Topics
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {attempt.strongTopics.slice(0, 6).map(t => (
                    <span key={t} className="badge badge-green" style={{ fontSize: '0.7rem' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="card fade-in" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} />
                AI Recommendation
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {attempt.percentage >= 70
                  ? 'Great performance! Focus on consistently weak topics and attempt a harder mock.'
                  : attempt.percentage >= 50
                    ? 'Good effort. Revise weak topics daily for 20 minutes before your next attempt.'
                    : 'Foundational concepts need review. Start with topic-wise practice drills recommended below.'}
              </p>
            </div>
          </div>
        </div>

        {/* Solutions toggle */}
        <div className="card fade-in" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSolutions ? '1.25rem' : 0 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="var(--primary)" />
              Detailed Solutions
            </h2>
            <button className="btn-secondary" onClick={() => setShowSolutions(!showSolutions)} aria-expanded={showSolutions} style={{ fontSize: '0.8rem' }}>
              {showSolutions ? 'Hide Solutions' : 'View Solutions'}
            </button>
          </div>
          {showSolutions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {exam.questions.map((q, i) => {
                const userAnswer = attempt.answers.find(a => a.questionId === q.id);
                const isCorrect = userAnswer?.chosen === q.correct;
                const isSkipped = !userAnswer?.chosen;
                const borderColor = isSkipped ? 'var(--border)' : isCorrect ? 'var(--accent)' : 'var(--danger)';
                return (
                  <div key={q.id} style={{ borderLeft: `4px solid ${borderColor}`, paddingLeft: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>Q{i + 1}.</span>
                      {isSkipped ? (
                        <span className="badge" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Skipped</span>
                      ) : isCorrect ? (
                        <span className="badge badge-green" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Check size={12} /> Correct
                        </span>
                      ) : (
                        <span className="badge badge-red" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <X size={12} /> Wrong (You: {userAnswer?.chosen}, Correct: {q.correct})
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{q.text}</p>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '0.6rem 0.85rem', borderRadius: '0.4rem' }}>
                      <strong style={{ color: 'var(--accent)' }}>Explanation: </strong>{q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => navigate('/exams')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} /> Try Another Mock
          </button>
          <button className="btn-primary" onClick={() => navigate('/practice')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={16} /> Start Practice Drills
          </button>
          <button className="btn-ghost" onClick={() => navigate('/performance')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} /> View All Results
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
