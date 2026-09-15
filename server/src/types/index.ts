export type ImpairmentTier = 'low-vision' | 'legally-blind' | 'totally-blind';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  impairmentTier?: ImpairmentTier;
  extraTimeMultiplier?: number;
  highContrastDefault?: boolean;
  screenReaderOptimized?: boolean;
  avatar?: string;
}

export interface Question {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctAnswer: number;
  explanation: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  phoneticAudioText?: string;
  hints?: string[];
  approved?: boolean;
}

export interface Exam {
  id: string;
  title: string;
  category: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  scheduledDate: string;
  status: 'upcoming' | 'active' | 'completed';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: Question[];
  instructions?: string[];
  accessibilitySettings?: {
    screenReaderOptimized: boolean;
    extraTimeApproved: boolean;
    voiceNavigationAllowed: boolean;
  };
}

export interface StudentAccommodations {
  extraTimeMinutes: number;
  speechRate: number;
  preferredTheme: 'default' | 'dark' | 'high-contrast' | 'yellow-black';
  highContrast: boolean;
  assignedScribe: boolean;
  scribeName?: string;
}

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  impairmentTier: ImpairmentTier;
  accommodations: StudentAccommodations;
  examsAssigned: number;
  examsCompleted: number;
  avgScore: number;
  status: 'Active' | 'Verified' | 'Pending Review';
  registeredAt: string;
}

export interface CandidateAttemptLog {
  id: string;
  candidateName: string;
  rollNo: string;
  examTitle: string;
  examId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  timeTakenMinutes: number;
  speechCommandsUsed: number;
  audioIntegrityStatus: 'Clean' | 'Flagged Disconnection' | 'Background Noise Alert';
}

export interface CurriculumSubject {
  id: string;
  name: string;
  code: string;
  totalQuestions: number;
  topics: { id: string; name: string; questionsCount: number }[];
}

export interface PronunciationRule {
  id: string;
  token: string;
  spokenAs: string;
  category: 'Math Symbol' | 'Scientific Abbreviation' | 'Latin Tech Term';
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  date: string;
  targetTier: 'All' | ImpairmentTier;
  priority: 'Normal' | 'Urgent';
}

export interface ComplianceReport {
  id: string;
  period: string;
  auditor: string;
  score: number;
  status: 'Certified' | 'Under Review';
  violationsFound: number;
  remediated: number;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
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
