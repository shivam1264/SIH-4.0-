/**
 * SIGHT-EXAM AI Universal API Client
 * Connects React frontend to Node.js + Express backend (http://localhost:5000/api)
 * Includes resilient fallback to offline mock data if backend server is offline.
 */

import {
  EXAMS as FALLBACK_EXAMS,
  MOCK_ADMIN_STUDENTS,
  MOCK_CURRICULUM_SUBJECTS,
  MOCK_ATTEMPT_LOGS,
  MOCK_PRONUNCIATION_RULES,
  MOCK_ADMIN_ANNOUNCEMENTS,
} from '../data/mockData';
import type {
  User,
  AdminStudent,
  ImpairmentTier,
  Exam,
  Question,
  CandidateAttemptLog,
  CurriculumSubject,
  PronunciationRule,
  AdminAnnouncement,
} from '../types';

const API_BASE = 'http://localhost:5000/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('sight_exam_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ── AUTHENTICATION API ─────────────────────────────────────────────
export const authApi = {
  async login(email: string, password?: string): Promise<{ token: string; user: User }> {
    try {
      const res = await request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.token) {
        localStorage.setItem('sight_exam_jwt_token', res.token);
      }
      return res;
    } catch (err) {
      console.warn('[API] Backend offline, falling back to local auth simulation:', err);
      // Fallback: Admin or Student login
      const clean = email.toLowerCase().trim();
      const isAdmin = clean.includes('admin');
      const user: User = {
        id: isAdmin ? 'usr_admin' : 'usr_student',
        name: isAdmin ? 'Admin User' : 'Rahul Sharma',
        email: clean,
        role: isAdmin ? 'admin' : 'student',
        examInterests: ['SSC CGL', 'UPSC Prelims'],
        createdAt: new Date().toISOString(),
        totalAttempts: 4,
        avgScore: 78,
      };
      return { token: 'mock-local-token', user };
    }
  },

  async register(data: Partial<User> & { password?: string }): Promise<{ token: string; user: User }> {
    try {
      const res = await request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.token) {
        localStorage.setItem('sight_exam_jwt_token', res.token);
      }
      return res;
    } catch (err) {
      console.warn('[API] Backend offline, falling back to local registration:', err);
      const user: User = {
        id: `usr_${Date.now()}`,
        name: data.name || 'Candidate',
        email: data.email || 'candidate@student.in',
        role: data.role || 'student',
        examInterests: data.examInterests || ['SSC CGL'],
        createdAt: new Date().toISOString(),
        totalAttempts: 0,
        avgScore: 0,
      };
      return { token: 'mock-local-token', user };
    }
  },
};

// ── STUDENTS API ───────────────────────────────────────────────────
export const studentsApi = {
  async getAll(): Promise<AdminStudent[]> {
    try {
      const res = await request<{ students: any[] }>('/students');
      return (res.students || []).map((s: any) => {
        const extraMinutes = s.accommodations?.extraTimeMinutes ?? 30;
        let multiplier: 1.0 | 1.33 | 1.5 | 2.0 = 1.5;
        if (extraMinutes >= 60) multiplier = 2.0;
        else if (extraMinutes >= 30) multiplier = 1.5;
        else if (extraMinutes >= 20) multiplier = 1.33;
        else if (extraMinutes === 0) multiplier = 1.0;

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          rollNo: s.rollNo,
          impairmentTier: (s.impairmentTier?.toLowerCase().includes('legal') ? 'Legally Blind' :
                          s.impairmentTier?.toLowerCase().includes('total') ? 'Total Blindness' :
                          s.impairmentTier?.toLowerCase().includes('color') ? 'Color Vision Deficient' :
                          'Low Vision') as ImpairmentTier,
          accommodations: {
            extraTimeMultiplier: multiplier,
            screenReader: (s.accommodations?.screenReader || 'Built-in SIGHT Voice') as any,
            speechRate: s.accommodations?.speechRate ?? 1.0,
            highContrast: Boolean(s.accommodations?.highContrast),
            brailleDisplay: Boolean(s.accommodations?.brailleDisplay),
            audioDescriptions: s.accommodations?.audioDescriptions ?? true,
          },
          pwdVerified: s.pwdVerified ?? (s.status === 'Verified'),
          certificateId: s.certificateId || `PWD-IN-${s.rollNo?.replace(/[^0-9]/g, '') || '2026'}`,
          registeredDate: s.registeredDate || s.registeredAt || '2026-08-10',
          totalAttempts: s.totalAttempts ?? s.examsCompleted ?? 0,
          avgScore: s.avgScore ?? 75,
          lastActive: s.lastActive || '2 hours ago',
          status: s.status || 'Active',
        };
      });
    } catch (err) {
      console.warn('[API] Backend unreachable, using fallback students:', err);
      return MOCK_ADMIN_STUDENTS;
    }
  },

  async create(data: Partial<AdminStudent>): Promise<AdminStudent> {
    try {
      const res = await request<{ student: AdminStudent }>('/students', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.student;
    } catch (err) {
      console.warn('[API] Using local student creation fallback');
      const fallback: AdminStudent = {
        id: `std_${Date.now()}`,
        name: data.name || 'New Student',
        email: data.email || 'student@pwd.in',
        rollNo: data.rollNo || `PWD-2026-${Math.floor(100 + Math.random() * 900)}`,
        impairmentTier: data.impairmentTier || 'Low Vision',
        accommodations: data.accommodations || {
          extraTimeMultiplier: 1.5,
          screenReader: 'Built-in SIGHT Voice',
          speechRate: 1,
          highContrast: false,
          brailleDisplay: false,
          audioDescriptions: true,
        },
        pwdVerified: true,
        certificateId: 'PWD-MH-2024-8831',
        registeredDate: new Date().toISOString().split('T')[0],
        totalAttempts: 0,
        avgScore: 0,
        lastActive: 'Just now',
        status: 'Active',
      };
      return fallback;
    }
  },

  async update(id: string, data: Partial<AdminStudent>): Promise<AdminStudent> {
    const res = await request<{ student: AdminStudent }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.student;
  },

  async delete(id: string): Promise<void> {
    await request(`/students/${id}`, { method: 'DELETE' });
  },
};

// ── EXAMS API ──────────────────────────────────────────────────────
export const examsApi = {
  async getAll(): Promise<Exam[]> {
    try {
      const res = await request<{ exams: Exam[] }>('/exams');
      return res.exams;
    } catch (err) {
      console.warn('[API] Using fallback exams');
      return FALLBACK_EXAMS;
    }
  },

  async getById(id: string): Promise<Exam | undefined> {
    try {
      const res = await request<{ exam: Exam }>(`/exams/${id}`);
      return res.exam;
    } catch (err) {
      return FALLBACK_EXAMS.find(e => e.id === id);
    }
  },

  async create(exam: Partial<Exam>): Promise<Exam> {
    const res = await request<{ exam: Exam }>('/exams', {
      method: 'POST',
      body: JSON.stringify(exam),
    });
    return res.exam;
  },

  async delete(id: string): Promise<void> {
    await request(`/exams/${id}`, { method: 'DELETE' });
  },

  async submit(id: string, payload: any): Promise<any> {
    try {
      return await request(`/exams/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[API] Offline submission calculation fallback:', err);
      return { success: true, score: 80, percentage: 80, passed: true };
    }
  },
};

// ── QUESTION BANK API ──────────────────────────────────────────────
export const questionsApi = {
  async getAll(): Promise<Question[]> {
    try {
      const res = await request<{ questions: Question[] }>('/questions');
      return res.questions;
    } catch (err) {
      return FALLBACK_EXAMS.flatMap(e => e.questions);
    }
  },

  async create(question: Partial<Question>): Promise<Question> {
    const res = await request<{ question: Question }>('/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    });
    return res.question;
  },

  async bulkImport(questions: Question[]): Promise<number> {
    const res = await request<{ count: number }>('/questions/bulk', {
      method: 'POST',
      body: JSON.stringify({ questions }),
    });
    return res.count;
  },

  async delete(id: string): Promise<void> {
    await request(`/questions/${id}`, { method: 'DELETE' });
  },
};

// ── AI QUESTION GENERATOR API ──────────────────────────────────────
export const aiApi = {
  async getStatus(): Promise<{ geminiConfigured: boolean; model: string; mode: string }> {
    try {
      return await request<{ geminiConfigured: boolean; model: string; mode: string }>('/ai/status');
    } catch {
      return { geminiConfigured: false, model: 'gemini-1.5-flash', mode: 'offline-fallback' };
    }
  },

  async generateQuestions(params: {
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    count: number;
    focusArea?: string;
  }): Promise<Question[]> {
    try {
      const res = await request<{ questions: any[]; source?: string }>('/ai/generate-questions', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      const optLabels = ['A', 'B', 'C', 'D'] as const;
      return res.questions.map((q: any) => {
        if (Array.isArray(q.options) && typeof q.options[0] === 'string') {
          const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
          return {
            id: q.id,
            subject: 'General Awareness',
            topic: q.topic || params.topic,
            text: q.text,
            phoneticText: q.phoneticAudioText || q.text,
            options: q.options.map((opt: string, idx: number) => ({
              id: optLabels[idx] || 'A',
              text: opt,
              phoneticText: `Option ${optLabels[idx] || 'A'}: ${opt}`,
            })),
            correct: optLabels[correctIdx] || 'A',
            explanation: q.explanation || '',
            difficulty: q.difficulty || params.difficulty,
          };
        }
        return q;
      });
    } catch (err) {
      console.warn('[API] Using local AI generator fallback');
      const sampleTexts = [
        'Fundamental Rights & Judicial Review',
        'Directive Principles of State Policy',
        'Preamble and Basic Structure',
        'Union Executive Powers',
      ];
      const optLabels: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      return Array.from({ length: params.count }).map((_, i) => ({
        id: `local-gen-${Date.now()}-${i + 1}`,
        subject: 'Polity' as const,
        topic: params.topic,
        text: `[AI Generated] Under ${params.topic}, what is the constitutional mechanism for safeguarding equality?`,
        phoneticText: `Under ${params.topic}, what is the constitutional mechanism for safeguarding equality?`,
        options: sampleTexts.map((text, idx) => ({
          id: optLabels[idx],
          text,
          phoneticText: `Option ${optLabels[idx]}: ${text}`,
        })),
        correct: 'A' as const,
        explanation: 'Article 14 to 18 guarantee equality before law and prohibit discrimination.',
        difficulty: params.difficulty,
        tags: ['AI Generated', params.topic],
      }));
    }
  },
};

// ── CURRICULUM SUBJECTS API ────────────────────────────────────────
export const subjectsApi = {
  async getAll(): Promise<CurriculumSubject[]> {
    try {
      const res = await request<{ subjects: any[] }>('/subjects');
      return res.subjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.code || 'GEN-101',
        description: s.description || `${s.name} curriculum and topics`,
        topics: Array.isArray(s.topics)
          ? s.topics.map((t: any) => ({
              id: t.id,
              name: t.name,
              weightagePercent: t.weightagePercent || 25,
              questionCount: t.questionCount || t.questionsCount || 15,
              struggleRate: t.struggleRate || 20,
            }))
          : [],
      }));
    } catch (err) {
      return MOCK_CURRICULUM_SUBJECTS;
    }
  },

  async create(data: { name: string; code: string }): Promise<CurriculumSubject> {
    const res = await request<{ subject: CurriculumSubject }>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.subject;
  },

  async addTopic(subjectId: string, name: string): Promise<any> {
    const res = await request<{ topic: any }>(`/subjects/${subjectId}/topics`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return res.topic;
  },
};

// ── ATTEMPTS & AUDIT API ───────────────────────────────────────────
export const attemptsApi = {
  async getAll(): Promise<CandidateAttemptLog[]> {
    try {
      const res = await request<{ attempts: any[] }>('/attempts');
      return res.attempts.map((att: any) => ({
        id: att.id,
        studentName: att.studentName || att.candidateName || 'Student Candidate',
        studentRoll: att.studentRoll || att.rollNo || 'PWD-2026-000',
        impairmentTier: att.impairmentTier || 'Low Vision',
        examId: att.examId || 'exam-1',
        examTitle: att.examTitle || 'Practice Examination',
        score: att.score ?? 0,
        maxScore: att.maxScore || att.totalMarks || 100,
        percentage: att.percentage ?? Math.round(((att.score || 0) / (att.maxScore || att.totalMarks || 100)) * 100),
        timeSpentSeconds: att.timeSpentSeconds || (att.timeTakenMinutes ? att.timeTakenMinutes * 60 : 600),
        flags: Array.isArray(att.flags)
          ? att.flags
          : att.audioIntegrityStatus && att.audioIntegrityStatus !== 'Clean'
          ? [att.audioIntegrityStatus]
          : [],
        audioAlertsCount: att.audioAlertsCount || att.speechCommandsUsed || 0,
        submittedAt: att.submittedAt || att.completedAt || '2026-09-12 14:30',
        status: (att.status as any) || (att.passed ? 'Completed' : 'Flagged for Review'),
      }));
    } catch (err) {
      return MOCK_ATTEMPT_LOGS;
    }
  },
};

// ── ACCESSIBILITY & NOTIFICATIONS API ──────────────────────────────
export const accessibilityApi = {
  async getPronunciationRules(): Promise<PronunciationRule[]> {
    try {
      const res = await request<{ rules: PronunciationRule[] }>('/accessibility/rules');
      return res.rules;
    } catch (err) {
      return MOCK_PRONUNCIATION_RULES;
    }
  },

  async addPronunciationRule(rule: Partial<PronunciationRule>): Promise<PronunciationRule> {
    const res = await request<{ rule: PronunciationRule }>('/accessibility/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
    return res.rule;
  },
};

export const notificationsApi = {
  async getAll(): Promise<AdminAnnouncement[]> {
    try {
      const res = await request<{ announcements: AdminAnnouncement[] }>('/notifications');
      return res.announcements;
    } catch (err) {
      return MOCK_ADMIN_ANNOUNCEMENTS;
    }
  },

  async post(announcement: Partial<AdminAnnouncement>): Promise<AdminAnnouncement> {
    const res = await request<{ announcement: AdminAnnouncement }>('/notifications', {
      method: 'POST',
      body: JSON.stringify(announcement),
    });
    return res.announcement;
  },
};
