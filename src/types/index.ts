// ─────────────────────────────────────────────
//  Core domain types for SIGHT-EXAM AI
// ─────────────────────────────────────────────

export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  examInterests: string[];
  createdAt: string;
  totalAttempts: number;
  avgScore: number;
}

// ── Accessibility ──────────────────────────────
export type ThemeMode = 'default' | 'dark' | 'high-contrast' | 'yellow-black';
export type FontSize  = 'default' | 'large' | 'xlarge' | 'xxlarge';
export type TextSize = FontSize;
export type Spacing   = 'default' | 'wide' | 'xwide' | 'normal' | 'relaxed' | 'loose';
export type FontFamily = 'inter' | 'atkinson';

export interface AccessibilityPrefs {
  theme: ThemeMode;
  fontSize: FontSize;
  spacing: Spacing;
  fontFamily: FontFamily;
  voiceMode: boolean;
  voiceRate: number;       // 0.75 – 2.0
  voicePitch: number;      // 0.8 – 1.2
  voiceName?: string;      // selected high quality voice name
  highFocus: boolean;
  reduceMotion: boolean;
  audioFeedback: boolean;
  autoReadQuestion: boolean;
  autoRead?: boolean;
  timerWarnings: boolean;
}

// ── Exam ───────────────────────────────────────
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Subject = 'Mathematics' | 'Reasoning' | 'English' | 'General Awareness'
  | 'General Science' | 'General Knowledge' | 'Physics' | 'Environment'
  | 'History' | 'Geography' | 'Polity' | 'Economics' | 'Computer';

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
  phoneticText?: string;
}

export interface DiagramData {
  type: 'bar' | 'pie' | 'geometry' | 'venn' | 'line';
  title: string;
  altDescription: string;
  dataTable: { label: string; value: string | number }[];
  svgContent?: string;
}

export interface Question {
  id: string;
  subject: Subject;
  topic: string;
  text: string;
  phoneticText?: string;
  mathFormula?: string;
  mathVerbalization?: string;
  diagramData?: DiagramData;
  aiSummary?: string;
  options: QuestionOption[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: Difficulty;
  tags: string[];
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  category: string;
  subjects: Subject[];
  totalQuestions: number;
  durationMinutes: number;
  difficulty: Difficulty;
  questions: Question[];
  published: boolean;
  createdAt: string;
  instructions?: string;
}


// ── Attempt ────────────────────────────────────
export interface QuestionAnswer {
  questionId: string;
  chosen: 'A' | 'B' | 'C' | 'D' | null;
  timeSpentSeconds: number;
  flagged: boolean;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  startedAt: string;
  submittedAt: string;
  answers: QuestionAnswer[];
  score: number;           // raw
  maxScore: number;
  percentage: number;
  accuracy: number;        // correct/attempted
  avgTimePerQ: number;
  subjectBreakdown: SubjectBreakdown[];
  weakTopics: string[];
  strongTopics: string[];
}

export interface SubjectBreakdown {
  subject: string;
  correct: number;
  total: number;
  percentage: number;
  status: 'weak' | 'moderate' | 'strong';
}

// ── AI ─────────────────────────────────────────
export interface AIRecommendation {
  id: string;
  studentId: string;
  type: 'practice' | 'mock' | 'revision';
  title: string;
  description: string;
  subject: Subject;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  targetAccuracy: number;
  currentAccuracy: number;
  createdAt: string;
}

// ── Active Exam State ──────────────────────────
export interface ActiveExamState {
  exam: Exam;
  currentIndex: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  flagged: Record<string, boolean>;
  visited: Record<string, boolean>;
  timeRemaining: number;   // seconds
  startedAt: number;       // Date.now()
  questionTimes: Record<string, number>;
  questionStart: number;
}

// ── Admin Panel Specific Types ─────────────────
export type ImpairmentTier = 'Low Vision' | 'Legally Blind' | 'Total Blindness' | 'Color Vision Deficient';

export interface StudentAccommodations {
  extraTimeMultiplier: 1.0 | 1.33 | 1.5 | 2.0;
  screenReader: 'NVDA' | 'JAWS' | 'VoiceOver' | 'Built-in SIGHT Voice' | 'None';
  speechRate: number;
  highContrast: boolean;
  brailleDisplay: boolean;
  audioDescriptions: boolean;
  autonomousExamMode?: boolean;
  udidNumber?: string;
}

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  impairmentTier: ImpairmentTier;
  accommodations: StudentAccommodations;
  pwdVerified: boolean;
  certificateId: string;
  registeredDate: string;
  totalAttempts: number;
  avgScore: number;
  lastActive: string;
  status: 'Active' | 'Pending Verification' | 'Suspended';
}

export interface CurriculumTopic {
  id: string;
  name: string;
  weightagePercent: number;
  questionCount: number;
  struggleRate: number; // percentage of students struggling
}

export interface CurriculumSubject {
  id: string;
  name: Subject;
  code: string;
  description: string;
  topics: CurriculumTopic[];
}

export interface CandidateAttemptLog {
  id: string;
  studentName: string;
  studentRoll: string;
  impairmentTier: ImpairmentTier;
  examId: string;
  examTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds: number;
  flags: string[];
  audioAlertsCount: number;
  submittedAt: string;
  status: 'Completed' | 'Flagged for Review' | 'Auto-Submitted';
}

export interface PronunciationRule {
  id: string;
  symbol: string;
  phoneticReplacement: string;
  category: 'Math' | 'Logic' | 'Greek' | 'Exam Notation';
  exampleUsage: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  targetAudience: 'All Students' | 'Active Exam Halls' | 'Low Vision Tier' | 'Total Blindness Tier';
  priority: 'Normal' | 'High' | 'Emergency Audio Broadcast';
  isVoiceBroadcast: boolean;
  createdAt: string;
  readCount: number;
}

export interface ComplianceReport {
  id: string;
  title: string;
  category: 'WCAG 2.1 AA Audit' | 'PwD Act 2016 Compliance' | 'Exam Fairness & Proctoring' | 'Student Progress Ledger';
  format: 'PDF' | 'CSV' | 'JSON';
  status: 'Ready' | 'Generating';
  fileSize: string;
  generatedDate: string;
}

// ── Study Materials ────────────────────────────
export interface StudyMaterial {
  id: string;
  title: string;
  subject: Subject;
  category: string;
  readTimeMinutes: number;
  summary: string;
  content: string;
  keyPoints: string[];
  audioNarrationText: string;
  downloadUrl?: string;
  fileSize?: string;
  createdAt: string;
  author?: string;
  tags: string[];
}

// ── Previous Year Papers (PYQs) ────────────────
export interface PYQPaper {
  id: string;
  title: string;
  examName: string;
  year: number;
  shift?: string;
  category: string;
  totalQuestions: number;
  durationMinutes: number;
  linkedExamId?: string;
  pdfUrl?: string;
  audioSummaryText: string;
  topicsCovered: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  createdAt: string;
}

