import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  AdminStudent,
  Exam,
  Question,
  CandidateAttemptLog,
  CurriculumSubject,
  PronunciationRule,
  AdminAnnouncement,
  ComplianceReport,
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Store consistently in server/data/store.json so user can easily view and manage it
const DATA_FILE = path.resolve(__dirname, '../../data/store.json');

export interface DatabaseSchema {
  users: (User & { passwordHash?: string })[];
  students: AdminStudent[];
  exams: Exam[];
  questionBank: Question[];
  attemptLogs: CandidateAttemptLog[];
  subjects: CurriculumSubject[];
  pronunciationRules: PronunciationRule[];
  announcements: AdminAnnouncement[];
  complianceReports: ComplianceReport[];
}

const INITIAL_DATA: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin',
      name: 'Admin User',
      email: 'admin@sightexamai.in',
      role: 'admin',
      // Default dev password: admin123
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    },
    {
      id: 'usr_rahul',
      name: 'Rahul Sharma',
      email: 'rahul@student.in',
      role: 'student',
      impairmentTier: 'legally-blind',
      extraTimeMultiplier: 1.5,
      highContrastDefault: false,
      screenReaderOptimized: true,
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    },
    {
      id: 'usr_priya',
      name: 'Priya Verma',
      email: 'priya@student.in',
      role: 'student',
      impairmentTier: 'totally-blind',
      extraTimeMultiplier: 2.0,
      highContrastDefault: true,
      screenReaderOptimized: true,
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    },
  ],
  students: [
    {
      id: 'std_1',
      name: 'Rahul Sharma',
      email: 'rahul@student.in',
      rollNo: 'PWD-2026-081',
      impairmentTier: 'legally-blind',
      accommodations: { extraTimeMinutes: 30, speechRate: 1.0, preferredTheme: 'default', highContrast: false, assignedScribe: false },
      examsAssigned: 4,
      examsCompleted: 3,
      avgScore: 82,
      status: 'Verified',
      registeredAt: '2026-08-10',
    },
    {
      id: 'std_2',
      name: 'Priya Verma',
      email: 'priya@student.in',
      rollNo: 'PWD-2026-094',
      impairmentTier: 'totally-blind',
      accommodations: { extraTimeMinutes: 45, speechRate: 0.9, preferredTheme: 'high-contrast', highContrast: true, assignedScribe: true, scribeName: 'Amit Scribe' },
      examsAssigned: 5,
      examsCompleted: 4,
      avgScore: 91,
      status: 'Verified',
      registeredAt: '2026-08-12',
    },
    {
      id: 'std_3',
      name: 'Aakash Patel',
      email: 'aakash@student.in',
      rollNo: 'PWD-2026-112',
      impairmentTier: 'low-vision',
      accommodations: { extraTimeMinutes: 20, speechRate: 1.1, preferredTheme: 'yellow-black', highContrast: true, assignedScribe: false },
      examsAssigned: 3,
      examsCompleted: 2,
      avgScore: 74,
      status: 'Active',
      registeredAt: '2026-08-15',
    },
  ],
  exams: [
    {
      id: 'exam-1',
      title: 'UPSC Civil Services — General Studies Paper I',
      category: 'Civil Services',
      subject: 'General Studies',
      durationMinutes: 120,
      totalMarks: 200,
      passingMarks: 66,
      scheduledDate: '2026-09-20',
      status: 'active',
      difficulty: 'Hard',
      questions: [
        {
          id: 'q1',
          text: 'Under Article 21 of the Constitution of India, which fundamental right is explicitly protected?',
          options: ['Right to Property', 'Protection of Life and Personal Liberty', 'Right to Freedom of Religion', 'Right to Constitutional Remedies'],
          correctAnswer: 1,
          explanation: 'Article 21 guarantees that no person shall be deprived of his life or personal liberty except according to procedure established by law.',
          topic: 'Constitutional Law',
          difficulty: 'Medium',
          phoneticAudioText: 'Under Article twenty-one of the Constitution of India, which fundamental right is explicitly protected?',
        },
        {
          id: 'q2',
          text: 'Which landmark Supreme Court judgment declared the Right to Privacy as a Fundamental Right under Article 21?',
          options: ['Kesavananda Bharati Case', 'K.S. Puttaswamy v. Union of India', 'Maneka Gandhi Case', 'Golaknath Case'],
          correctAnswer: 1,
          explanation: 'The 9-judge bench in K.S. Puttaswamy (2017) unanimously affirmed Privacy as a fundamental right.',
          topic: 'Judicial Landmark Cases',
          difficulty: 'Medium',
          phoneticAudioText: 'Which landmark Supreme Court judgment declared the Right to Privacy as a Fundamental Right under Article 21?',
        },
        {
          id: 'q3',
          text: 'What is the standard monetary policy target of the Reserve Bank of India (RBI) under the Monetary Policy Framework Agreement?',
          options: ['Inflation at 2% (+/- 1%)', 'Inflation at 4% (+/- 2%)', 'GDP growth at 8%', 'Fiscal deficit below 3%'],
          correctAnswer: 1,
          explanation: 'The RBI inflation target is CPI 4% with a tolerance band of +/- 2% (2% to 6%).',
          topic: 'Indian Economy',
          difficulty: 'Easy',
          phoneticAudioText: 'What is the standard monetary policy target of the Reserve Bank of India under the Monetary Policy Framework Agreement?',
        },
      ],
      instructions: [
        'Voice Guidance and screen reader support are enabled for this exam.',
        'Use voice commands like "Option A", "Next question", or press number keys 1 to 4.',
        'PwD candidates receive sanctioned compensatory time automatically.',
      ],
    },
    {
      id: 'exam-2',
      title: 'SSC CGL — General Awareness & Reasoning Practice',
      category: 'Staff Selection',
      subject: 'General Awareness',
      durationMinutes: 60,
      totalMarks: 100,
      passingMarks: 40,
      scheduledDate: '2026-09-25',
      status: 'upcoming',
      difficulty: 'Medium',
      questions: [
        {
          id: 'q4',
          text: 'Which Indian River is known as the "Dakshin Ganga"?',
          options: ['Godavari', 'Krishna', 'Cauvery', 'Narmada'],
          correctAnswer: 0,
          explanation: 'Godavari is known as Dakshin Ganga due to its large size and extent in Peninsular India.',
          topic: 'Indian Geography',
          difficulty: 'Easy',
          phoneticAudioText: 'Which Indian River is known as the Dakshin Ganga?',
        },
        {
          id: 'q5',
          text: 'In which year did the Constitution of India come into effect?',
          options: ['1947', '1949', '1950', '1952'],
          correctAnswer: 2,
          explanation: 'The Constitution came into full effect on 26th January 1950, celebrated as Republic Day.',
          topic: 'Indian Polity',
          difficulty: 'Easy',
          phoneticAudioText: 'In which year did the Constitution of India come into effect?',
        },
      ],
      instructions: [
        'Press V anytime to toggle audio playback of questions and options.',
        'All mathematical terms are phonetically described for clarity.',
      ],
    },
  ],
  questionBank: [
    {
      id: 'qb-1',
      text: 'What is the primary function of the Preamble in the Indian Constitution?',
      options: ['It gives executive power to Parliament', 'It sets out the ideals and guiding principles', 'It overrides fundamental rights', 'It defines penal laws'],
      correctAnswer: 1,
      explanation: 'The Preamble embodies the philosophy and core values of the Constitution.',
      topic: 'Polity',
      difficulty: 'Easy',
      phoneticAudioText: 'What is the primary function of the Preamble in the Indian Constitution?',
      approved: true,
    },
    {
      id: 'qb-2',
      text: 'Which of the following is an example of an In Situ conservation method for biodiversity?',
      options: ['Botanical Garden', 'National Park', 'Zoological Park', 'Seed Bank'],
      correctAnswer: 1,
      explanation: 'National Parks protect species within their natural habitat (in situ).',
      topic: 'Environment & Ecology',
      difficulty: 'Medium',
      phoneticAudioText: 'Which of the following is an example of an In Situ conservation method for biodiversity?',
      approved: true,
    },
    {
      id: 'qb-3',
      text: 'What is the acceleration due to gravity on the Earth’s surface approximately?',
      options: ['9.8 m/s²', '8.9 m/s²', '10.5 m/s²', '7.6 m/s²'],
      correctAnswer: 0,
      explanation: 'Standard gravity is approximately 9.8 meters per second squared.',
      topic: 'Physics',
      difficulty: 'Easy',
      phoneticAudioText: 'What is the acceleration due to gravity on the Earth surface approximately? Option A: nine point eight meters per second squared.',
      approved: true,
    },
  ],
  attemptLogs: [
    {
      id: 'att_101',
      candidateName: 'Rahul Sharma',
      rollNo: 'PWD-2026-081',
      examTitle: 'UPSC Civil Services — GS Paper I',
      examId: 'exam-1',
      score: 164,
      totalMarks: 200,
      percentage: 82,
      passed: true,
      completedAt: '2026-09-12 14:30',
      timeTakenMinutes: 105,
      speechCommandsUsed: 42,
      audioIntegrityStatus: 'Clean',
    },
    {
      id: 'att_102',
      candidateName: 'Priya Verma',
      rollNo: 'PWD-2026-094',
      examTitle: 'SSC CGL — General Awareness',
      examId: 'exam-2',
      score: 92,
      totalMarks: 100,
      percentage: 92,
      passed: true,
      completedAt: '2026-09-12 16:15',
      timeTakenMinutes: 48,
      speechCommandsUsed: 68,
      audioIntegrityStatus: 'Clean',
    },
  ],
  subjects: [
    {
      id: 'sub-1',
      name: 'Indian Polity & Governance',
      code: 'POL-101',
      totalQuestions: 48,
      topics: [
        { id: 't1', name: 'Constitutional Framework', questionsCount: 18 },
        { id: 't2', name: 'Fundamental Rights & Duties', questionsCount: 16 },
        { id: 't3', name: 'Union Judiciary & Supreme Court', questionsCount: 14 },
      ],
    },
    {
      id: 'sub-2',
      name: 'Modern Indian History',
      code: 'HIS-201',
      totalQuestions: 36,
      topics: [
        { id: 't4', name: 'Freedom Struggle & National Movement', questionsCount: 20 },
        { id: 't5', name: 'Post-Independence Consolidation', questionsCount: 16 },
      ],
    },
  ],
  pronunciationRules: [
    { id: 'pr-1', token: 'H₂O', spokenAs: 'H two O (water molecule)', category: 'Scientific Abbreviation' },
    { id: 'pr-2', token: '±', spokenAs: 'plus or minus', category: 'Math Symbol' },
    { id: 'pr-3', token: '√', spokenAs: 'square root of', category: 'Math Symbol' },
    { id: 'pr-4', token: 'Art.', spokenAs: 'Article', category: 'Latin Tech Term' },
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'UPSC CSE 2026 Scribe Allocation Verification',
      message: 'All Totally Blind candidates eligible for designated scribes must confirm credentials before 18th Sept.',
      date: '2026-09-12',
      targetTier: 'totally-blind',
      priority: 'Urgent',
    },
    {
      id: 'ann-2',
      title: 'Voice Assistant Speech Engine Upgrade',
      message: 'Speech recognition confidence improved to 99.4%. Acoustic feedback tones are now active.',
      date: '2026-09-10',
      targetTier: 'All',
      priority: 'Normal',
    },
  ],
  complianceReports: [
    {
      id: 'aud-1',
      period: 'Q3 2026 (July - September)',
      auditor: 'Ministry of Social Justice & PwD Cell',
      score: 99.4,
      status: 'Certified',
      violationsFound: 2,
      remediated: 2,
    },
  ],
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not read store.json, creating initial store:', err);
    }
    this.saveData(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  private saveData(data: DatabaseSchema) {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write store.json:', err);
    }
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public update(updater: (data: DatabaseSchema) => void): DatabaseSchema {
    updater(this.data);
    this.saveData(this.data);
    return this.data;
  }
}

export const db = new Database();
