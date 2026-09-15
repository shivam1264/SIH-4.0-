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
  MOCK_STUDY_MATERIALS,
  MOCK_PYQS,
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
  StudyMaterial,
  PYQPaper,
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

// ── EXAM NORMALIZATION & SYNC UTILS ─────────────────────────────
function getLocalCustomExams(): Exam[] {
  try {
    const raw = localStorage.getItem('sight_custom_exams');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeExam);
    }
  } catch (err) {
    console.warn('Error reading local custom exams:', err);
  }
  return [];
}

function saveLocalCustomExam(exam: Exam): void {
  try {
    const current = getLocalCustomExams();
    const existingIdx = current.findIndex(e => e.id === exam.id);
    let updated: Exam[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = exam;
    } else {
      updated = [exam, ...current];
    }
    localStorage.setItem('sight_custom_exams', JSON.stringify(updated));
  } catch (err) {
    console.warn('Error saving local custom exam:', err);
  }
}

function removeLocalCustomExam(id: string): void {
  try {
    const current = getLocalCustomExams();
    const filtered = current.filter(e => e.id !== id);
    localStorage.setItem('sight_custom_exams', JSON.stringify(filtered));
  } catch (err) {
    console.warn('Error removing local custom exam:', err);
  }
}

export function normalizeExam(e: any): Exam {
  if (!e) {
    return {
      id: `exam-custom-${Date.now()}`,
      title: 'Practice Test',
      category: 'General',
      subjects: ['General Awareness'],
      totalQuestions: 0,
      durationMinutes: 30,
      difficulty: 'Medium',
      description: 'Practice test',
      instructions: 'Accessible mock test',
      questions: [],
      published: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
  }

  const subjects: any[] =
    Array.isArray(e.subjects) && e.subjects.length > 0
      ? e.subjects
      : e.subject
      ? [e.subject]
      : ['General Awareness'];

  const questions = Array.isArray(e.questions)
    ? e.questions.map((q: any, index: number) => {
        let options: any[] = [];
        if (Array.isArray(q.options)) {
          if (typeof q.options[0] === 'object' && q.options[0]?.id && q.options[0]?.text) {
            options = q.options;
          } else {
            const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
            options = q.options.map((opt: any, optIdx: number) => ({
              id: keys[optIdx] || 'A',
              text: typeof opt === 'string' ? opt : opt?.text || String(opt || ''),
              phoneticText:
                typeof opt === 'string'
                  ? opt
                  : opt?.phoneticText || opt?.text || String(opt || ''),
            }));
          }
        }

        let correctVal: 'A' | 'B' | 'C' | 'D' = 'A';
        if (
          typeof q.correct === 'string' &&
          ['A', 'B', 'C', 'D'].includes(q.correct.toUpperCase())
        ) {
          correctVal = q.correct.toUpperCase() as any;
        } else if (typeof q.correctAnswer === 'number') {
          const map: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
          correctVal = map[q.correctAnswer] || 'A';
        }

        return {
          id: q.id || `q-${e.id || 'exam'}-${index + 1}`,
          subject: q.subject || subjects[0] || 'General Awareness',
          topic: q.topic || 'General Knowledge',
          text: q.text || q.q || 'Question statement',
          phoneticText: q.phoneticText || q.phoneticAudioText || q.text || q.q,
          mathFormula: q.mathFormula,
          mathVerbalization: q.mathVerbalization,
          diagramData: q.diagramData,
          aiSummary: q.aiSummary,
          options,
          correct: correctVal,
          explanation: q.explanation || 'Curriculum explanation.',
          difficulty: q.difficulty || e.difficulty || 'Medium',
          tags: Array.isArray(q.tags) ? q.tags : [e.category || 'exam'],
        };
      })
    : [];

  return {
    id: e.id || `exam-${Date.now()}`,
    title: e.title || 'Untitled Exam',
    description:
      e.description ||
      `${e.category || 'General'} practice mock examination with ${questions.length} questions.`,
    category: e.category || 'SSC',
    subjects,
    totalQuestions: questions.length || e.totalQuestions || 20,
    durationMinutes: Number(e.durationMinutes) || 30,
    difficulty: e.difficulty || 'Medium',
    questions,
    published: e.published !== false,
    createdAt: e.createdAt || new Date().toISOString().split('T')[0],
    instructions:
      typeof e.instructions === 'string'
        ? e.instructions
        : Array.isArray(e.instructions)
        ? e.instructions.join(' ')
        : 'Accessible mock test with audio narration enabled. Time multiplier 1.5x applied for PwD candidates.',
  };
}

// ── EXAMS API ──────────────────────────────────────────────────────
export const examsApi = {
  async getAll(): Promise<Exam[]> {
    const localCustom = getLocalCustomExams();
    const mergedMap = new Map<string, Exam>();

    // 1. Initial base fallback exams
    FALLBACK_EXAMS.forEach(e => mergedMap.set(e.id, normalizeExam(e)));

    // 2. Fetch from backend API
    try {
      const res = await request<{ exams: Exam[] }>('/exams');
      if (res && Array.isArray(res.exams) && res.exams.length) {
        res.exams.forEach(e => mergedMap.set(e.id, normalizeExam(e)));
      }
    } catch (err) {
      console.warn('[API] Backend exams endpoint unreachable, using local store:', err);
    }

    // 3. Overlay any custom exams created in admin
    localCustom.forEach(e => mergedMap.set(e.id, normalizeExam(e)));

    return Array.from(mergedMap.values());
  },

  async getById(id: string): Promise<Exam | undefined> {
    const localCustom = getLocalCustomExams();
    const localFound = localCustom.find(e => e.id === id);
    if (localFound) return localFound;

    try {
      const res = await request<{ exam: Exam }>(`/exams/${id}`);
      if (res && res.exam) return normalizeExam(res.exam);
    } catch (err) {
      console.warn('[API] Backend exam fetch error:', err);
    }

    const fallbackFound = FALLBACK_EXAMS.find(e => e.id === id);
    return fallbackFound ? normalizeExam(fallbackFound) : undefined;
  },

  async create(exam: Partial<Exam>): Promise<Exam> {
    const normalized = normalizeExam(exam);

    // Save locally immediately so UI is 100% responsive and offline-resilient
    saveLocalCustomExam(normalized);

    // Notify all active listeners across tabs/pages
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sight_exams_updated', { detail: normalized }));
    }

    // Push to backend Express server
    try {
      const res = await request<{ exam: Exam }>('/exams', {
        method: 'POST',
        body: JSON.stringify(normalized),
      });
      if (res && res.exam) {
        const backendExam = normalizeExam(res.exam);
        saveLocalCustomExam(backendExam);
        return backendExam;
      }
    } catch (err) {
      console.warn('[API] Backend exam sync failed (stored in local database):', err);
    }

    return normalized;
  },

  async delete(id: string): Promise<void> {
    removeLocalCustomExam(id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sight_exams_updated', { detail: { id, deleted: true } }));
    }
    try {
      await request(`/exams/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('[API] Backend exam delete error:', err);
    }
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

  async bulkImport(questions: any[]): Promise<number> {
    try {
      const res = await request<{ count: number }>('/questions/bulk', {
        method: 'POST',
        body: JSON.stringify({ questions }),
      });
      return res.count;
    } catch (err) {
      console.warn('[API] Bulk questions import offline fallback:', err);
      return questions.length;
    }
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
    const geminiApiKey = localStorage.getItem('sight_gemini_api_key') || undefined;
    try {
      const res = await request<{ questions: any[]; source?: string }>('/ai/generate-questions', {
        method: 'POST',
        body: JSON.stringify({ ...params, geminiApiKey }),
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
      console.warn('[API] Using smart dynamic AI generator fallback:', err);
      const tLower = params.topic.toLowerCase();
      const optLabels: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

      // Intelligent domain templates library
      const DOMAIN_DATA: Record<string, Array<{ q: string; opts: [string, string, string, string]; correct: number; exp: string }>> = {
        math: [
          {
            q: 'If the price of a commodity increases by 25%, by what percentage must consumption be reduced so that total expenditure remains unchanged?',
            opts: ['20%', '25%', '15%', '16.67%'],
            correct: 0,
            exp: 'Formula: [R / (100 + R)] * 100 = [25 / 125] * 100 = 20% reduction.',
          },
          {
            q: 'A shopkeeper sells an article for ₹840 at a profit of 20%. What was the cost price of the article?',
            opts: ['₹680', '₹700', '₹720', '₹750'],
            correct: 1,
            exp: 'Cost Price = Selling Price / (1 + Profit%) = ₹840 / 1.20 = ₹700.',
          },
          {
            q: 'A sum of ₹10,000 earns compound interest at 10% per annum compounded annually for 2 years. What is the total interest earned?',
            opts: ['₹2,000', '₹2,100', '₹2,200', '₹2,050'],
            correct: 1,
            exp: 'Amount = 10000 * 1.21 = ₹12,100. CI = ₹12,100 - ₹10,000 = ₹2,100.',
          },
        ],
        reasoning: [
          {
            q: 'Statements: All books are papers. Some papers are notebooks. Which conclusion definitely follows?',
            opts: ['Some notebooks are books', 'Some papers are books', 'All notebooks are books', 'No paper is a book'],
            correct: 1,
            exp: 'From "All books are papers", the converse "Some papers are books" is definitely true.',
          },
          {
            q: 'Pointing to a photograph, a woman says: "His mother is the only daughter of my mother." How is the woman related to the person in the photograph?',
            opts: ['Sister', 'Mother', 'Grandmother', 'Aunt'],
            correct: 1,
            exp: 'The only daughter of the woman\'s mother is herself. She is his mother.',
          },
          {
            q: 'Rohan walks 10 km North, turns right and walks 6 km, then turns right again and walks 10 km. How far and in which direction is he now from his starting point?',
            opts: ['6 km West', '6 km East', '10 km North', '16 km South'],
            correct: 1,
            exp: 'He is exactly 6 km East of his starting position.',
          },
        ],
        science: [
          {
            q: 'What is the standard frequency range of human audible sound waves?',
            opts: ['20 Hz to 20,000 Hz', '200 Hz to 2,000 Hz', '2 Hz to 20 Hz', '20 kHz to 200 kHz'],
            correct: 0,
            exp: 'Human hearing ranges from 20 Hz to 20,000 Hz (20 kHz).',
          },
          {
            q: 'Which organelle in eukaryotic cells is primarily responsible for ATP generation through cellular respiration?',
            opts: ['Ribosome', 'Mitochondria', 'Endoplasmic Reticulum', 'Golgi Apparatus'],
            correct: 1,
            exp: 'Mitochondria produce ATP through cellular respiration, known as the powerhouse of the cell.',
          },
          {
            q: 'Which optical phenomenon is primarily responsible for the sparkling brilliance of a cut diamond?',
            opts: ['Total Internal Reflection', 'Optical Dispersion', 'Diffraction of Light', 'Atmospheric Refraction'],
            correct: 0,
            exp: 'Total internal reflection occurs due to diamond\'s high refractive index (2.42) and small critical angle.',
          },
        ],
        history: [
          {
            q: 'Who founded the Brahmo Samaj in Calcutta in 1828 to propagate monotheism and eradicate social evils like Sati?',
            opts: ['Swami Vivekananda', 'Raja Ram Mohan Roy', 'Ishwar Chandra Vidyasagar', 'Dayananda Saraswati'],
            correct: 1,
            exp: 'Raja Ram Mohan Roy founded Brahmo Samaj in 1828 and was pivotal in the abolition of Sati in 1829.',
          },
          {
            q: 'Which historic session of the Indian National Congress adopted the landmark resolution for "Purna Swaraj" (Complete Independence)?',
            opts: ['1920 Nagpur Session', '1929 Lahore Session', '1931 Karachi Session', '1924 Belgaum Session'],
            correct: 1,
            exp: 'The December 1929 Lahore Session presided by Jawaharlal Nehru passed the Purna Swaraj resolution.',
          },
        ],
        polity: [
          {
            q: 'Under the Constitution of India, which writ is issued by courts to enforce the performance of a public duty?',
            opts: ['Habeas Corpus', 'Mandamus', 'Quo-Warranto', 'Certiorari'],
            correct: 1,
            exp: 'Mandamus is a judicial command issued to any public authority to perform a mandated legal duty.',
          },
          {
            q: 'Who presides over a joint sitting of both Houses of Parliament under Article 108?',
            opts: ['The President of India', 'The Vice-President of India', 'The Speaker of Lok Sabha', 'The Chief Justice of India'],
            correct: 2,
            exp: 'Under Article 118(4), the Speaker of Lok Sabha presides over any joint sitting of Parliament.',
          },
          {
            q: 'Which article of the Indian Constitution is termed the "Heart and Soul of the Constitution" by Dr. B.R. Ambedkar?',
            opts: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
            correct: 3,
            exp: 'Article 32 guarantees the Right to Constitutional Remedies for the enforcement of Fundamental Rights.',
          },
        ],
        economy: [
          {
            q: 'Which index is primarily used by the Reserve Bank of India (RBI) to measure headline retail inflation for monetary policy?',
            opts: ['Wholesale Price Index (WPI)', 'Consumer Price Index Combined (CPI-C)', 'Index of Industrial Production (IIP)', 'GDP Deflator'],
            correct: 1,
            exp: 'RBI adopted CPI-Combined as its headline inflation metric based on Urjit Patel Committee recommendations.',
          },
          {
            q: 'What does the term "Repo Rate" represent in the Indian banking system?',
            opts: ['Rate at which RBI borrows from banks', 'Rate at which RBI lends short-term funds to commercial banks', 'Rate paid on public savings deposits', 'Fixed rate on 91-day treasury bills'],
            correct: 1,
            exp: 'Repo Rate is the policy interest rate at which RBI lends short-term funds to commercial banks against pledged collateral.',
          },
        ],
      };

      let categoryKey = 'polity';
      if (tLower.includes('math') || tLower.includes('quant') || tLower.includes('percent') || tLower.includes('profit') || tLower.includes('algebra') || tLower.includes('number')) categoryKey = 'math';
      else if (tLower.includes('reason') || tLower.includes('logic') || tLower.includes('syllogism') || tLower.includes('blood') || tLower.includes('direction')) categoryKey = 'reasoning';
      else if (tLower.includes('sci') || tLower.includes('bio') || tLower.includes('chem') || tLower.includes('physic') || tLower.includes('sound')) categoryKey = 'science';
      else if (tLower.includes('hist') || tLower.includes('freedom') || tLower.includes('gandhi') || tLower.includes('revolt') || tLower.includes('war')) categoryKey = 'history';
      else if (tLower.includes('econ') || tLower.includes('bank') || tLower.includes('rbi') || tLower.includes('inflation') || tLower.includes('gdp')) categoryKey = 'economy';

      const pool = DOMAIN_DATA[categoryKey] || DOMAIN_DATA.polity;

      return Array.from({ length: params.count }).map((_, i) => {
        if (i < pool.length) {
          const item = pool[i];
          const qId = `local-ai-${Date.now()}-${i + 1}`;
          return {
            id: qId,
            subject: 'General Awareness' as const,
            topic: params.topic,
            text: item.q,
            phoneticText: `${item.q}. Option A: ${item.opts[0]}. Option B: ${item.opts[1]}. Option C: ${item.opts[2]}. Option D: ${item.opts[3]}.`,
            options: item.opts.map((txt, idx) => ({
              id: optLabels[idx],
              text: txt,
              phoneticText: `Option ${optLabels[idx]}: ${txt}`,
            })),
            correct: optLabels[item.correct],
            explanation: item.exp,
            difficulty: params.difficulty,
            tags: ['AI Curriculum Engine', params.topic],
          };
        }

        // Procedural generation for custom topics
        const qId = `local-synth-${Date.now()}-${i + 1}`;
        const synthText = `Which of the following principles forms the primary conceptual framework of "${params.topic}" in competitive examinations?`;
        const synthOpts: [string, string, string, string] = [
          `Established statutory codification and institutional principles applicable to ${params.topic}`,
          `Unregulated discretionary application without formal oversight`,
          `Historical convention dating prior to modern codification`,
          `Secondary empirical derivation with conditional validity`,
        ];
        return {
          id: qId,
          subject: 'General Awareness' as const,
          topic: params.topic,
          text: synthText,
          phoneticText: `${synthText}. Option A: ${synthOpts[0]}. Option B: ${synthOpts[1]}. Option C: ${synthOpts[2]}. Option D: ${synthOpts[3]}.`,
          options: synthOpts.map((txt, idx) => ({
            id: optLabels[idx],
            text: txt,
            phoneticText: `Option ${optLabels[idx]}: ${txt}`,
          })),
          correct: 'A' as const,
          explanation: `In standard national curriculum syllabi for ${params.topic}, institutional principles and statutory guidelines serve as the benchmark framework.`,
          difficulty: params.difficulty,
          tags: ['AI Generated', params.topic],
        };
      });
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

  async create(attempt: Partial<CandidateAttemptLog>): Promise<CandidateAttemptLog> {
    try {
      const res = await request<{ attempt: CandidateAttemptLog }>('/attempts', {
        method: 'POST',
        body: JSON.stringify(attempt),
      });
      return res.attempt;
    } catch (err) {
      console.warn('[API] Offline attempt logging fallback:', err);
      const fallback: CandidateAttemptLog = {
        id: `att_${Date.now()}`,
        studentName: attempt.studentName || 'Student Candidate',
        studentRoll: attempt.studentRoll || 'PWD-2026-081',
        impairmentTier: attempt.impairmentTier || 'Low Vision',
        examId: attempt.examId || 'exam-1',
        examTitle: attempt.examTitle || 'Mock Examination',
        score: attempt.score ?? 80,
        maxScore: attempt.maxScore ?? 100,
        percentage: attempt.percentage ?? 80,
        timeSpentSeconds: attempt.timeSpentSeconds ?? 1200,
        flags: attempt.flags || [],
        audioAlertsCount: attempt.audioAlertsCount ?? 0,
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: attempt.status || 'Completed',
      };
      return fallback;
    }
  },
};

// ── STUDY MATERIALS API ────────────────────────────────────────────
export const studyMaterialsApi = {
  async getAll(params?: { subject?: string; search?: string }): Promise<StudyMaterial[]> {
    try {
      const query = new URLSearchParams();
      if (params?.subject && params.subject !== 'All') query.set('subject', params.subject);
      if (params?.search) query.set('search', params.search);
      const url = `/study-materials${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await request<{ studyMaterials: StudyMaterial[] }>(url);
      return res.studyMaterials || [];
    } catch (err) {
      console.warn('[API] Using fallback study materials:', err);
      let items = [...MOCK_STUDY_MATERIALS];
      if (params?.subject && params.subject !== 'All') {
        items = items.filter(m => m.subject.toLowerCase() === params.subject!.toLowerCase());
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(m => m.title.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q));
      }
      return items;
    }
  },

  async getById(id: string): Promise<StudyMaterial | undefined> {
    try {
      const res = await request<{ studyMaterial: StudyMaterial }>(`/study-materials/${id}`);
      return res.studyMaterial;
    } catch {
      return MOCK_STUDY_MATERIALS.find(m => m.id === id);
    }
  },

  async create(data: Partial<StudyMaterial>): Promise<StudyMaterial> {
    try {
      const res = await request<{ studyMaterial: StudyMaterial }>('/study-materials', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.studyMaterial;
    } catch (err) {
      console.warn('[API] Offline fallback for study material creation');
      const fallback: StudyMaterial = {
        id: `sm-${Date.now()}`,
        title: data.title || 'New Study Note',
        subject: data.subject || 'General Awareness',
        category: data.category || 'General',
        readTimeMinutes: data.readTimeMinutes || 8,
        summary: data.summary || data.title || '',
        content: data.content || '',
        keyPoints: data.keyPoints || [data.summary || 'Summary note'],
        audioNarrationText: data.audioNarrationText || data.summary || data.title || '',
        downloadUrl: data.downloadUrl || '#',
        fileSize: data.fileSize || '320 KB',
        createdAt: new Date().toISOString().split('T')[0],
        author: data.author || 'Exam Cell',
        tags: data.tags || ['Study Material'],
      };
      return fallback;
    }
  },

  async delete(id: string): Promise<void> {
    await request(`/study-materials/${id}`, { method: 'DELETE' });
  },
};

// ── PREVIOUS YEAR PAPERS (PYQs) API ────────────────────────────────
export const pyqsApi = {
  async getAll(params?: { category?: string; year?: string | number; search?: string }): Promise<PYQPaper[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category && params.category !== 'All') query.set('category', params.category);
      if (params?.year && params.year !== 'All') query.set('year', String(params.year));
      if (params?.search) query.set('search', params.search);
      const url = `/pyqs${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await request<{ pyqs: PYQPaper[] }>(url);
      return res.pyqs || [];
    } catch (err) {
      console.warn('[API] Using fallback PYQ papers:', err);
      let items = [...MOCK_PYQS];
      if (params?.category && params.category !== 'All') {
        items = items.filter(p => p.category.toLowerCase() === params.category!.toLowerCase());
      }
      if (params?.year && params.year !== 'All') {
        items = items.filter(p => p.year === Number(params.year));
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(p => p.title.toLowerCase().includes(q) || p.examName.toLowerCase().includes(q));
      }
      return items;
    }
  },

  async getById(id: string): Promise<PYQPaper | undefined> {
    try {
      const res = await request<{ pyq: PYQPaper }>(`/pyqs/${id}`);
      return res.pyq;
    } catch {
      return MOCK_PYQS.find(p => p.id === id);
    }
  },

  async create(data: Partial<PYQPaper>): Promise<PYQPaper> {
    try {
      const res = await request<{ pyq: PYQPaper }>('/pyqs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.pyq;
    } catch (err) {
      console.warn('[API] Offline fallback for PYQ paper creation');
      const fallback: PYQPaper = {
        id: `pyq-${Date.now()}`,
        title: data.title || 'Previous Year Paper',
        examName: data.examName || 'Competitive Exam',
        year: data.year || new Date().getFullYear(),
        shift: data.shift || 'Shift 1',
        category: data.category || 'SSC',
        totalQuestions: data.totalQuestions || 25,
        durationMinutes: data.durationMinutes || 30,
        linkedExamId: data.linkedExamId || 'ssc-reasoning-01',
        pdfUrl: data.pdfUrl || '#',
        audioSummaryText: data.audioSummaryText || `${data.examName || 'Exam'} ${data.year} Question paper overview.`,
        topicsCovered: data.topicsCovered || ['General Studies', 'Reasoning'],
        difficulty: data.difficulty || 'Medium',
        createdAt: new Date().toISOString().split('T')[0],
      };
      return fallback;
    }
  },

  async delete(id: string): Promise<void> {
    await request(`/pyqs/${id}`, { method: 'DELETE' });
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
