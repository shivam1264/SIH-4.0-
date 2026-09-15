import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  BarChart3,
  FileText,
  HelpCircle,
  Bot,
  Users,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Loader2,
  Edit3,
  Plus,
  Check,
  Search,
  Volume2,
  Eye,
  Bell,
  FileSpreadsheet,
  Download,
  Settings as SettingsIcon,
  RefreshCw,
  Send,
  BookOpen,
  GraduationCap,
  Award,
  Accessibility,
  Key,
  Shield,
  Trash2,
  X,
  ChevronRight,
  Info,
  LogOut,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { DraggableQuickActions } from '../components/DraggableQuickActions';
import {
  EXAMS as INITIAL_EXAMS,
  MOCK_ATTEMPTS,
  MOCK_ADMIN_STUDENTS,
  MOCK_CURRICULUM_SUBJECTS,
  MOCK_ATTEMPT_LOGS,
  MOCK_PRONUNCIATION_RULES,
  MOCK_ADMIN_ANNOUNCEMENTS,
  MOCK_COMPLIANCE_REPORTS,
} from '../data/mockData';
import { speechService } from '../services/speechService';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import {
  studentsApi,
  examsApi,
  questionsApi,
  aiApi,
  subjectsApi,
  attemptsApi,
  notificationsApi,
  accessibilityApi,
} from '../services/api';
import type {
  Exam,
  AdminStudent,
  CurriculumSubject,
  CandidateAttemptLog,
  PronunciationRule,
  AdminAnnouncement,
  ComplianceReport,
  ImpairmentTier,
} from '../types';

interface AIQuestionDraft {
  id: string;
  q: string;
  options: [string, string, string, string];
  correct: number;
  explanation: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  approved: boolean;
  phoneticAudioPreview?: string;
}

export interface PopularExamItem {
  name: string;
  category: string;
  short: string;
}

export const POPULAR_EXAMS_DATABASE: PopularExamItem[] = [
  // Medical & Healthcare
  { name: 'NEET UG (Medical Entrance Exam)', category: 'Medical', short: 'NEET UG' },
  { name: 'NEET PG (Medical Post Graduate)', category: 'Medical', short: 'NEET PG' },
  { name: 'AIIMS Nursing & Paramedical', category: 'Medical', short: 'AIIMS' },

  // Engineering & Technical
  { name: 'JEE Main (Joint Entrance Examination)', category: 'Engineering', short: 'JEE Main' },
  { name: 'JEE Advanced (IIT Entrance)', category: 'Engineering', short: 'JEE Advanced' },
  { name: 'GATE (Graduate Aptitude Test in Engineering)', category: 'Engineering', short: 'GATE' },
  { name: 'BITSAT (BITS Engineering Entrance)', category: 'Engineering', short: 'BITSAT' },
  { name: 'ISRO Scientist / Engineer Test', category: 'Engineering', short: 'ISRO' },

  // Civil Services & Defence
  { name: 'UPSC Civil Services Examination (CSE / IAS / IPS)', category: 'UPSC', short: 'UPSC CSE' },
  { name: 'UPSC NDA (National Defence Academy)', category: 'Defence', short: 'NDA' },
  { name: 'UPSC CDS (Combined Defence Services)', category: 'Defence', short: 'CDS' },
  { name: 'AFCAT (Air Force Common Admission Test)', category: 'Defence', short: 'AFCAT' },
  { name: 'State PSC (UPPSC / BPSC / MPPSC / MPSC / RPSC)', category: 'State PSC', short: 'State PSC' },
  { name: 'State Police Constable / Sub-Inspector (SI)', category: 'Police', short: 'Police Bharti' },
  { name: 'Agniveer Scheme Defence Recruitment', category: 'Defence', short: 'Agniveer' },

  // Staff Selection Commission (SSC)
  { name: 'SSC CGL (Combined Graduate Level)', category: 'SSC', short: 'SSC CGL' },
  { name: 'SSC CHSL (10+2 Higher Secondary)', category: 'SSC', short: 'SSC CHSL' },
  { name: 'SSC MTS (Multi Tasking Staff)', category: 'SSC', short: 'SSC MTS' },
  { name: 'SSC GD Constable (Paramilitary)', category: 'SSC', short: 'SSC GD' },
  { name: 'SSC CPO (Central Police Organisation SI)', category: 'SSC', short: 'SSC CPO' },

  // Banking & Insurance
  { name: 'IBPS PO (Probationary Officer)', category: 'Banking', short: 'IBPS PO' },
  { name: 'IBPS Clerk (Clerical Cadre)', category: 'Banking', short: 'IBPS Clerk' },
  { name: 'SBI PO (State Bank of India PO)', category: 'Banking', short: 'SBI PO' },
  { name: 'SBI Clerk (Junior Associates)', category: 'Banking', short: 'SBI Clerk' },
  { name: 'RBI Grade B Officer', category: 'Banking', short: 'RBI Grade B' },
  { name: 'IBPS RRB (Regional Rural Banks Officer / Assistant)', category: 'Banking', short: 'IBPS RRB' },
  { name: 'LIC AAO (Assistant Administrative Officer)', category: 'Banking', short: 'LIC AAO' },

  // Railways (RRB)
  { name: 'RRB NTPC (Non-Technical Popular Categories)', category: 'Railway', short: 'RRB NTPC' },
  { name: 'RRB Group D (Level 1 Posts)', category: 'Railway', short: 'RRB Group D' },
  { name: 'RRB ALP (Assistant Loco Pilot)', category: 'Railway', short: 'RRB ALP' },
  { name: 'RRB JE (Junior Engineer)', category: 'Railway', short: 'RRB JE' },

  // Law, Management & University
  { name: 'CLAT (Common Law Admission Test)', category: 'Law', short: 'CLAT' },
  { name: 'AILET (All India Law Entrance Test)', category: 'Law', short: 'AILET' },
  { name: 'CAT (Common Admission Test for IIMs)', category: 'Management', short: 'CAT' },
  { name: 'CUET UG (Common University Entrance Test Under Graduate)', category: 'University', short: 'CUET UG' },
  { name: 'CUET PG (Common University Entrance Test Post Graduate)', category: 'University', short: 'CUET PG' },

  // Teaching & Eligibility
  { name: 'CTET (Central Teacher Eligibility Test)', category: 'Teaching', short: 'CTET' },
  { name: 'State TET (UPTET / REET / Super TET)', category: 'Teaching', short: 'State TET' },
  { name: 'UGC NET / JRF (Assistant Professor)', category: 'Teaching', short: 'UGC NET' },
  { name: 'CSIR NET (Junior Research Fellowship in Science)', category: 'Teaching', short: 'CSIR NET' },
  { name: 'KVS / NVS Teacher Recruitment (PGT / TGT / PRT)', category: 'Teaching', short: 'KVS / NVS' },
];

export type AdminTab =
  | 'dashboard'
  | 'students'
  | 'exams'
  | 'questions'
  | 'ai-generator'
  | 'subjects'
  | 'attempts'
  | 'analytics'
  | 'accessibility'
  | 'notifications'
  | 'reports'
  | 'settings'
  | 'profile';

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const tabParam = (searchParams.get('tab') as AdminTab) || 'dashboard';
  const [activeTab, setActiveTabState] = useState<AdminTab>(tabParam);

  // Sync tab with URL
  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    document.title = `Admin ${activeTab.toUpperCase()} — SIGHT-EXAM AI`;
  }, [activeTab]);

  // Synchronize with Node.js + Express backend on mount
  useEffect(() => {
    studentsApi.getAll().then(res => { if (res && res.length) setStudents(res); }).catch(() => { });
    examsApi.getAll().then(res => { if (res && res.length) setExams(res); }).catch(() => { });
    subjectsApi.getAll().then(res => { if (res && res.length) { setSubjects(res); setSelectedSubject(res[0]); } }).catch(() => { });
    attemptsApi.getAll().then(res => { if (res && res.length) setAttemptLogs(res); }).catch(() => { });
    notificationsApi.getAll().then(res => { if (res && res.length) setAnnouncements(res); }).catch(() => { });
    accessibilityApi.getPronunciationRules().then(res => { if (res && res.length) setPronunciationRules(res); }).catch(() => { });
  }, []);

  // ─────────────────────────────────────────────
  //  State: Examinations
  // ─────────────────────────────────────────────
  const [examCategories, setExamCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('sight_exam_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch { }
    }
    return ['SSC', 'Banking', 'Railway', 'UPSC', 'State PSC', 'Defence', 'Teaching / TET', 'NEET', 'GATE', 'CUET'];
  });
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [examCategoryFilter, setExamCategoryFilter] = useState('All');
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCategory, setNewExamCategory] = useState('SSC');
  const [newExamDuration, setNewExamDuration] = useState('30');
  const [newExamDifficulty, setNewExamDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newExamQuestionsCount, setNewExamQuestionsCount] = useState('20');
  const [newExamInstructions, setNewExamInstructions] = useState('Accessible mock test with audio narration enabled. Time multiplier 1.5x applied for PwD candidates.');

  // ─────────────────────────────────────────────
  //  State: Students
  // ─────────────────────────────────────────────
  const [students, setStudents] = useState<AdminStudent[]>(MOCK_ADMIN_STUDENTS);
  const [studentSearch, setStudentSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<AdminStudent | null>(null);

  // ─────────────────────────────────────────────
  //  State: Question Bank & AI Generator
  // ─────────────────────────────────────────────
  const [questionBank, setQuestionBank] = useState<AIQuestionDraft[]>([
    {
      id: 'q-bank-1',
      q: 'Which Article of the Indian Constitution provides for the Right to Constitutional Remedies?',
      options: ['Article 19', 'Article 21', 'Article 32', 'Article 44'],
      correct: 2,
      explanation: 'Dr. B.R. Ambedkar called Article 32 the "Heart and Soul of the Constitution" because it guarantees the right to approach the Supreme Court for Fundamental Rights.',
      topic: 'Indian Constitution & Articles',
      difficulty: 'Medium',
      approved: true,
      phoneticAudioPreview: 'Question: Which Article of the Indian Constitution provides for the Right to Constitutional Remedies? Option A: Article 19. Option B: Article 21. Option C: Article 32. Option D: Article 44. Correct is Option C: Article 32.',
    },
    {
      id: 'q-bank-2',
      q: 'All pens are books. All books are dictionaries. Which conclusion follows? I. Some pens are dictionaries. II. All dictionaries are pens.',
      options: ['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither I nor II follows'],
      correct: 0,
      explanation: 'Pens is a proper subset of books which is a subset of dictionaries. Hence Some pens are dictionaries follows strictly.',
      topic: 'Syllogisms & Verbal Logic',
      difficulty: 'Easy',
      approved: true,
      phoneticAudioPreview: 'All pens are books. All books are dictionaries. Conclusion 1: Some pens are dictionaries. Conclusion 2: All dictionaries are pens. Only conclusion 1 follows.',
    },
    {
      id: 'q-bank-3',
      q: 'A shopkeeper marks goods 40% above cost price and allows a 25% discount. What is his net profit or loss percentage?',
      options: ['5% Profit', '5% Loss', '10% Profit', '15% Profit'],
      correct: 0,
      explanation: 'Let CP = 100. MP = 140. SP = 140 * 0.75 = 105. Profit = 5%.',
      topic: 'Percentages & Profit/Loss',
      difficulty: 'Medium',
      approved: true,
      phoneticAudioPreview: 'A shopkeeper marks goods 40 percent above cost price and allows a 25 percent discount. What is his net profit or loss percentage? Answer is 5 percent profit.',
    },
  ]);

  const [questionSearch, setQuestionSearch] = useState('');
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [qCorrect, setQCorrect] = useState(0);
  const [qTopic, setQTopic] = useState('Percentages & Profit/Loss');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [qExplanation, setQExplanation] = useState('');

  // AI Generator specific
  const [aiPrompt, setAiPrompt] = useState('Indian Constitution & Fundamental Rights');
  const [aiCount, setAiCount] = useState<number | string>(3);
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [aiModel, setAiModel] = useState('Google Gemini 1.5 Flash (Phonetic & Audio-ready)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ geminiConfigured: boolean; model: string; mode: string }>({
    geminiConfigured: false,
    model: 'gemini-1.5-flash',
    mode: 'checking',
  });
  const [generatedDrafts, setGeneratedDrafts] = useState<AIQuestionDraft[]>([
    {
      id: 'ai-draft-1',
      q: 'Who appoints the Chief Election Commissioner and Election Commissioners of India?',
      options: ['The Prime Minister', 'The President of India', 'The Chief Justice of India', 'The Lok Sabha Speaker'],
      correct: 1,
      explanation: 'Under Article 324(2) of the Constitution, the President appoints the Chief Election Commissioner and other Commissioners.',
      topic: 'Indian Constitution & Articles',
      difficulty: 'Medium',
      approved: false,
      phoneticAudioPreview: 'Who appoints the Chief Election Commissioner and Election Commissioners of India? Option B: The President of India.',
    },
    {
      id: 'ai-draft-2',
      q: 'Which constitutional amendment lowered the voting age in India from 21 to 18 years?',
      options: ['42nd Amendment', '44th Amendment', '61st Amendment', '73rd Amendment'],
      correct: 2,
      explanation: 'The 61st Constitutional Amendment Act of 1988 reduced the voting age for Lok Sabha and Legislative Assemblies from 21 to 18.',
      topic: 'Indian Constitution & Articles',
      difficulty: 'Medium',
      approved: false,
      phoneticAudioPreview: 'Which constitutional amendment lowered the voting age in India from 21 to 18 years? The 61st Amendment.',
    },
  ]);

  // ─────────────────────────────────────────────
  //  State: Subjects & Topics
  // ─────────────────────────────────────────────
  const [subjects, setSubjects] = useState<CurriculumSubject[]>(MOCK_CURRICULUM_SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState<CurriculumSubject>(MOCK_CURRICULUM_SUBJECTS[0]);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicWeightage, setNewTopicWeightage] = useState('20');

  // ─────────────────────────────────────────────
  //  State: Attempts & Results
  // ─────────────────────────────────────────────
  const [attemptLogs, setAttemptLogs] = useState<CandidateAttemptLog[]>(MOCK_ATTEMPT_LOGS);
  const [attemptFilter, setAttemptFilter] = useState<'All' | 'Completed' | 'Flagged for Review'>('All');
  const [viewAttemptModal, setViewAttemptModal] = useState<CandidateAttemptLog | null>(null);

  // ─────────────────────────────────────────────
  //  State: Accessibility & Pronunciation
  // ─────────────────────────────────────────────
  const [pronunciationRules, setPronunciationRules] = useState<PronunciationRule[]>(MOCK_PRONUNCIATION_RULES);
  const [newRuleSymbol, setNewRuleSymbol] = useState('');
  const [newRulePhonetic, setNewRulePhonetic] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<'Math' | 'Logic' | 'Greek' | 'Exam Notation'>('Math');

  // ─────────────────────────────────────────────
  //  State: Notifications & Announcements
  // ─────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>(MOCK_ADMIN_ANNOUNCEMENTS);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'Normal' | 'High' | 'Emergency Audio Broadcast'>('Normal');
  const [announcementTarget, setAnnouncementTarget] = useState<'All Students' | 'Active Exam Halls' | 'Low Vision Tier' | 'Total Blindness Tier'>('All Students');
  const [isAudioBroadcast, setIsAudioBroadcast] = useState(false);

  // ─────────────────────────────────────────────
  //  State: Reports
  // ─────────────────────────────────────────────
  const [reports] = useState<ComplianceReport[]>(MOCK_COMPLIANCE_REPORTS);

  // ─────────────────────────────────────────────
  //  State: Settings
  // ─────────────────────────────────────────────
  const [selectedTTSVoice, setSelectedTTSVoice] = useState('Google UK English Female');
  const [proctoringSensitivity, setProctoringSensitivity] = useState<'Low' | 'Standard' | 'Strict'>('Standard');
  const [autoSessionTimeout, setAutoSessionTimeout] = useState('60');

  // ─────────────────────────────────────────────
  //  Fetch AI status
  // ─────────────────────────────────────────────
  useEffect(() => {
    aiApi.getStatus().then(status => {
      setGeminiStatus(status);
      if (status.geminiConfigured) {
        setAiModel('Google Gemini 1.5 Flash (Live AI Active)');
      } else {
        setAiModel('Domain Template Engine (GEMINI_API_KEY optional)');
      }
    }).catch(() => { });
  }, []);

  // ─────────────────────────────────────────────
  //  Speech test helper
  // ─────────────────────────────────────────────
  const testSpeech = (text: string) => {
    speechService.speak(text, true);
  };

  // Handlers
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;

    let finalCategory = newExamCategory;
    if (isAddingCustomCategory && customCategoryInput.trim()) {
      finalCategory = customCategoryInput.trim();
      if (!examCategories.includes(finalCategory)) {
        const updated = [...examCategories, finalCategory];
        setExamCategories(updated);
        try { localStorage.setItem('sight_exam_categories', JSON.stringify(updated)); } catch { }
      }
    }

    const created: Exam = {
      id: `exam-custom-${Date.now()}`,
      title: newExamTitle.trim(),
      category: finalCategory,
      durationMinutes: parseInt(newExamDuration) || 30,
      totalQuestions: parseInt(newExamQuestionsCount) || 20,
      difficulty: newExamDifficulty,
      description: `${finalCategory} full practice exam. ${newExamQuestionsCount} questions in ${newExamDuration} minutes.`,
      instructions: newExamInstructions,
      subjects: ['General Awareness', 'Reasoning'],
      questions: [],
      published: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setExams([created, ...exams]);
    setShowAddExamModal(false);
    setNewExamTitle('');
    setIsAddingCustomCategory(false);
    setCustomCategoryInput('');
    toast.success(`Exam "${created.title}" (${finalCategory}) successfully created and scheduled!`, 'Exam Created');
  };

  const handleAddQuestionToBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !optA.trim() || !optB.trim()) return;
    const newQ: AIQuestionDraft = {
      id: `q-man-${Date.now()}`,
      q: qText.trim(),
      options: [optA.trim(), optB.trim(), optC.trim() || 'None of these', optD.trim() || 'All of these'],
      correct: qCorrect,
      explanation: qExplanation.trim() || 'Standard curriculum explanation.',
      topic: qTopic,
      difficulty: qDifficulty,
      approved: true,
      phoneticAudioPreview: `Question: ${qText}. Option A: ${optA}. Option B: ${optB}. Correct is Option ${String.fromCharCode(65 + qCorrect)}.`,
    };
    setQuestionBank([newQ, ...questionBank]);
    setShowAddQuestionModal(false);
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setQExplanation('');
    toast.success('Question successfully saved into official Question Bank!', 'Question Saved');
  };

  const handleGenerateAIQuestions = async () => {
    setIsGenerating(true);
    const targetTopic = aiPrompt.trim() || 'Indian Constitution & Articles';
    const targetCount = Math.max(1, Math.min(25, Number(aiCount) || 3));
    try {
      const generated = await aiApi.generateQuestions({
        topic: targetTopic,
        difficulty: aiDifficulty,
        count: targetCount,
      });
      const drafts: AIQuestionDraft[] = generated.map((q: any) => {
        let optStrings: [string, string, string, string];
        if (Array.isArray(q.options) && typeof q.options[0] === 'object' && q.options[0]?.text) {
          optStrings = [
            q.options[0]?.text || 'Option A',
            q.options[1]?.text || 'Option B',
            q.options[2]?.text || 'Option C',
            q.options[3]?.text || 'Option D',
          ];
        } else if (Array.isArray(q.options) && typeof q.options[0] === 'string') {
          optStrings = [
            q.options[0] || 'Option A',
            q.options[1] || 'Option B',
            q.options[2] || 'Option C',
            q.options[3] || 'Option D',
          ];
        } else {
          optStrings = ['Option A', 'Option B', 'Option C', 'Option D'];
        }
        let correctIndex = 0;
        if (typeof q.correct === 'string') {
          correctIndex = q.correct === 'B' ? 1 : q.correct === 'C' ? 2 : q.correct === 'D' ? 3 : 0;
        } else if (typeof q.correctAnswer === 'number') {
          correctIndex = q.correctAnswer;
        }
        return {
          id: q.id,
          q: q.text,
          options: optStrings,
          correct: correctIndex,
          explanation: q.explanation || '',
          topic: q.topic || targetTopic,
          difficulty: q.difficulty || 'Medium',
          approved: false,
          phoneticAudioPreview: q.phoneticText || q.phoneticAudioText,
        };
      });
      setGeneratedDrafts([...drafts, ...generatedDrafts]);
      toast.success(
        `Generated ${drafts.length} accessible AI question drafts on "${targetTopic}".`,
        'AI Generation Complete'
      );
    } catch (err) {
      console.warn('Backend AI generation error, using fallback:', err);
      const newAIQ: AIQuestionDraft = {
        id: `ai-gen-${Date.now()}`,
        q: 'Under the PwD Act 2016, how much compensatory time is guaranteed per hour of examination for benchmark disability candidates?',
        options: ['10 minutes per hour', '15 minutes per hour', '20 minutes per hour', '30 minutes per hour'],
        correct: 2,
        explanation: 'The Ministry of Social Justice & Empowerment guidelines specify compensatory time of not less than 20 minutes per hour of examination for persons with benchmark disabilities.',
        topic: targetTopic,
        difficulty: 'Medium',
        approved: false,
        phoneticAudioPreview: 'Under the PwD Act 2016, how much compensatory time is guaranteed per hour of examination for benchmark disability candidates? Correct answer is Option C: 20 minutes per hour.',
      };
      setGeneratedDrafts([newAIQ, ...generatedDrafts]);
    } finally {
      setIsGenerating(false);
    }
  };

  const approveDraftToBank = (draftId: string) => {
    const draft = generatedDrafts.find(d => d.id === draftId);
    if (!draft) return;
    setQuestionBank([{ ...draft, approved: true }, ...questionBank]);
    setGeneratedDrafts(generatedDrafts.filter(d => d.id !== draftId));
    const optLabels: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    questionsApi.create({
      subject: 'Polity',
      text: draft.q,
      options: draft.options.map((txt, idx) => ({
        id: optLabels[idx],
        text: txt,
        phoneticText: `Option ${optLabels[idx]}: ${txt}`,
      })),
      correct: optLabels[draft.correct] || 'A',
      explanation: draft.explanation,
      topic: draft.topic,
      difficulty: draft.difficulty,
      phoneticText: draft.phoneticAudioPreview,
      tags: ['AI Generated', draft.topic],
    }).catch(e => console.warn('Questions API sync fallback:', e));
    toast.success('AI Question approved and transferred to official Question Bank!', 'Question Approved');
  };

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMsg.trim()) return;
    const newAnc: AdminAnnouncement = {
      id: `anc-${Date.now()}`,
      title: announcementTitle.trim(),
      message: announcementMsg.trim(),
      targetAudience: announcementTarget,
      priority: announcementPriority,
      isVoiceBroadcast: isAudioBroadcast,
      createdAt: 'Just now',
      readCount: 0,
    };
    setAnnouncements([newAnc, ...announcements]);
    notificationsApi.post(newAnc).catch(err => console.warn('Notification API sync fallback:', err));
    if (isAudioBroadcast) {
      speechService.speak(`Emergency audio announcement: ${newAnc.title}. ${newAnc.message}`, true);
    }
    setAnnouncementTitle('');
    setAnnouncementMsg('');
    toast.success('Announcement broadcasted to student portals and screen readers!', 'Broadcast Sent');
  };

  const handleAddPronunciationRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleSymbol.trim() || !newRulePhonetic.trim()) return;
    const rule: PronunciationRule = {
      id: `rule-${Date.now()}`,
      symbol: newRuleSymbol.trim(),
      phoneticReplacement: newRulePhonetic.trim(),
      category: newRuleCategory,
      exampleUsage: `${newRuleSymbol} in formula → ${newRulePhonetic}`,
    };
    setPronunciationRules([...pronunciationRules, rule]);
    accessibilityApi.addPronunciationRule(rule).catch(err => console.warn('Accessibility API sync fallback:', err));
    setNewRuleSymbol('');
    setNewRulePhonetic('');
    toast.success(`Pronunciation rule added! "${rule.symbol}" will now be voiced as "${rule.phoneticReplacement}".`, 'Rule Added');
  };

  const handleUpdateStudentAccommodations = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEdit) return;
    setStudents(students.map(s => (s.id === selectedStudentForEdit.id ? selectedStudentForEdit : s)));
    setSelectedStudentForEdit(null);
    toast.success('Student accommodation profile successfully updated and pushed to live exam engine!', 'Accommodations Updated');
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    const newTopic = {
      id: `top-${Date.now()}`,
      name: newTopicName.trim(),
      weightagePercent: parseInt(newTopicWeightage) || 15,
      questionCount: 0,
      struggleRate: 0,
    };
    const updated = {
      ...selectedSubject,
      topics: [...selectedSubject.topics, newTopic],
    };
    setSubjects(subjects.map(s => (s.id === selectedSubject.id ? updated : s)));
    setSelectedSubject(updated);
    setShowAddTopicModal(false);
    setNewTopicName('');
    toast.success(`Topic "${newTopic.name}" added to ${selectedSubject.name}!`, 'Topic Added');
  };

  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    students: 'Students',
    exams: 'Examinations',
    questions: 'Question Bank',
    'ai-generator': 'AI Generator',
    subjects: 'Subjects & Topics',
    attempts: 'Attempts & Logs',
    analytics: 'Analytics',
    accessibility: 'Accessibility',
    notifications: 'Notifications',
    reports: 'Reports',
    settings: 'Settings',
    profile: 'Admin Profile',
  };

  return (
    <AppLayout title={tabTitles[activeTab] || 'Dashboard'}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* ══════════════════════════════════════════════════════════
            MODULE 1: 🏠 DASHBOARD
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="fade-in">
            {/* Executive Banner */}
            <div
              className="fade-in"
              style={{
                marginBottom: '1.5rem',
                padding: '1.4rem 1.75rem',
                background: 'linear-gradient(135deg, #1E3A8A 0%, #4338CA 50%, #6D28D9 100%)',
                borderRadius: '1rem',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(30,58,138,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={28} color="#fff" /> SIGHT-EXAM AI Admin Control Center
                  </h1>
                  <p style={{ opacity: 0.9, fontSize: '0.86rem' }}>
                    Accessible Examination Platform for the Visually Impaired • Manage Students, Exams, AI Generation & Audits
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    onClick={() => setShowAddExamModal(true)}
                    style={{ background: '#fff', color: '#1E3A8A', border: '2px solid #fff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                  >
                    <Plus size={16} /> Create Exam
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveTab('ai-generator')}
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.6)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                  >
                    <Bot size={16} /> AI Generator
                  </button>
                </div>
              </div>
            </div>

            {/* Live Monitoring & Clean KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              {[
                { label: 'Students', value: students.length, icon: Users, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
                { label: 'Live Exams', value: exams.length, icon: FileText, color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' },
                { label: 'Questions', value: questionBank.length, icon: BookOpen, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
                { label: 'Avg Score', value: '74.2%', icon: Target, color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
                { label: 'Accessibility', value: '99.4%', icon: Accessibility, color: '#0891B2', bg: 'rgba(8, 145, 178, 0.1)' },
                { label: 'Completion', value: '94.8%', icon: CheckCircle2, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },
              ].map(card => {
                const CardIcon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="card fade-in"
                    style={{
                      padding: '1.1rem 1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      borderRadius: '0.85rem',
                      border: '1px solid var(--border)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.01em' }}>
                        {card.label}
                      </span>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '0.6rem',
                          background: card.bg,
                          color: card.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CardIcon size={18} strokeWidth={2.2} />
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>
                      {card.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions & Assistive Services Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
              {/* Real-time Accessibility Engine Status */}
              <div className="card fade-in" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                      <Zap size={18} color="var(--primary)" />
                      Assistive Services Health
                    </h3>
                    <span className="badge badge-green" style={{ fontSize: '0.66rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                      Operational
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '0.55rem', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '0.45rem', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Volume2 size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Web Speech Synthesizer</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Natural Voice (0.96x rate)</div>
                        </div>
                      </div>
                      <button
                        className="btn-ghost"
                        onClick={() => testSpeech('SIGHT-EXAM AI speech synthesis engine is fully operational.')}
                        style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', color: 'var(--primary)', fontWeight: 600 }}
                      >
                        Test Voice
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '0.55rem', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '0.45rem', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Sparkles size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Phonetic Math Parser</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(pronunciationRules?.length || 0)} Pronunciation rules active</div>
                        </div>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: '0.66rem' }}>Active</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '0.55rem', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '0.45rem', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bot size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>AI Content Pipeline</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gemini Pro with audio narration check</div>
                        </div>
                      </div>
                      <span className="badge badge-blue" style={{ fontSize: '0.66rem' }}>Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean AI Diagnostics & Remediation Card */}
              <div
                className="card fade-in"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1.5px solid rgba(217, 119, 6, 0.3)',
                  background: 'linear-gradient(180deg, rgba(254, 243, 199, 0.18) 0%, var(--bg-card) 100%)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                      <Target size={18} color="#D97706" />
                      AI Learning Diagnostics
                    </h3>
                    <span className="badge badge-amber" style={{ fontSize: '0.66rem' }}>Action Needed</span>
                  </div>

                  <div style={{ padding: '0.75rem 0.85rem', background: 'var(--bg-surface)', borderRadius: '0.6rem', border: '1px solid var(--border)', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                      <AlertTriangle size={15} color="#D97706" />
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text)' }}>
                        65% Candidates Struggling in Quantitative Aptitude
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                      Missing intermediate audio cues in <em>Percentage</em> and <em>Pipes & Cisterns</em>. Generate targeted remedial drill sets to bridge the gap.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    ✨ Auto-crafts step-by-step audio explanations
                  </span>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setActiveTab('ai-generator');
                      setAiPrompt('Generate 10 beginner-to-medium remediation questions on Percentage and Profit & Loss with step-by-step audio explanations');
                    }}
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                  >
                    <Bot size={15} /> Generate Remediation Drills
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Exam Submissions & Telemetry Table */}
            <div className="card fade-in" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '0.55rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--text)', margin: 0 }}>
                      Candidate Exam Submissions & Telemetry
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Real-time proctoring telemetry, scorecards, and accessibility audit flags
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                    {attemptLogs.length} Verified Submissions
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 0.85rem', borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem', fontWeight: 700, fontSize: '0.74rem' }}>Candidate</th>
                      <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, fontSize: '0.74rem' }}>Impairment Tier</th>
                      <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, fontSize: '0.74rem' }}>Examination</th>
                      <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, fontSize: '0.74rem' }}>Score</th>
                      <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, fontSize: '0.74rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, fontSize: '0.74rem' }}>Audio Proctoring</th>
                      <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem', fontWeight: 700, fontSize: '0.74rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attemptLogs.map((log, idx) => {
                      const initials = log.studentName
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom: idx !== attemptLogs.length - 1 ? '1px solid var(--border)' : 'none',
                            transition: 'background 0.12s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(67, 56, 202, 0.03)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Candidate Avatar & Info */}
                          <td style={{ padding: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: idx % 2 === 0 ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : 'linear-gradient(135deg, #059669, #10B981)',
                                  color: '#fff',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.85rem' }}>
                                  {log.studentName}
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  {log.studentRoll}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Impairment Tier */}
                          <td style={{ padding: '0.85rem' }}>
                            <span className="badge badge-blue" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem' }}>
                              <Eye size={12} /> {log.impairmentTier}
                            </span>
                          </td>

                          {/* Examination */}
                          <td style={{ padding: '0.85rem', color: 'var(--text)', fontWeight: 600, fontSize: '0.82rem' }}>
                            {log.examTitle}
                          </td>

                          {/* Score Pill */}
                          <td style={{ padding: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: log.percentage >= 70 ? '#16A34A' : '#D97706' }}>
                                {log.score}/{log.maxScore}
                              </span>
                              <span
                                className={`badge badge-${log.percentage >= 70 ? 'green' : 'amber'}`}
                                style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.4rem' }}
                              >
                                {log.percentage}%
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '0.85rem' }}>
                            <span
                              className={`badge badge-${log.status === 'Completed' ? 'green' : log.status === 'Flagged for Review' ? 'amber' : 'blue'}`}
                              style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem' }}
                            >
                              <CheckCircle2 size={12} /> {log.status}
                            </span>
                          </td>

                          {/* Audio Proctoring Flags */}
                          <td style={{ padding: '0.85rem' }}>
                            {(log.flags?.length || 0) > 0 ? (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#DC2626',
                                  background: 'rgba(220, 38, 38, 0.08)',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.4rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <AlertTriangle size={12} /> {log.flags.length} Flagged
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#16A34A',
                                  background: 'rgba(22, 163, 74, 0.08)',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.4rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <ShieldCheck size={12} /> Clean Telemetry
                              </span>
                            )}
                          </td>

                          {/* Inspect Action Button */}
                          <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                            <button
                              className="btn-secondary"
                              onClick={() => setViewAttemptModal(log)}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.32rem 0.65rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontWeight: 600,
                                borderRadius: '0.45rem',
                              }}
                            >
                              <Eye size={13} /> View Log
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 2: 👥 STUDENTS & ACCOMMODATIONS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'students' && (
          <div className="fade-in">
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--text)', margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>
                  Candidate Accommodations Registry
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Official registry of compensatory time and assistive technology allocations under the Rights of Persons with Disabilities (PwD) Act
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#475569',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.375rem',
                  }}
                >
                  {students.length} Registered Candidates
                </span>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                <div style={{ position: 'relative', width: 340 }}>
                  <Search size={14} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search candidate name or ID…"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    style={{ paddingLeft: '2.1rem', paddingRight: '0.75rem', paddingBlock: '0.45rem', fontSize: '0.82rem', width: '100%', borderRadius: '0.4rem' }}
                  />
                </div>

                <select
                  className="input-field"
                  value={tierFilter}
                  onChange={e => setTierFilter(e.target.value)}
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', borderRadius: '0.4rem', width: 210 }}
                >
                  <option value="All">All Disability Categories</option>
                  <option value="Low Vision">Low Vision</option>
                  <option value="Legally Blind">Legally Blind</option>
                  <option value="Total Blindness">Total Blindness</option>
                  <option value="Color Vision Deficient">Color Vision Deficient</option>
                </select>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Showing{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {
                    students.filter(s => {
                      const matchSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.rollNo.toLowerCase().includes(studentSearch.toLowerCase());
                      const matchTier = tierFilter === 'All' || s.impairmentTier === tierFilter;
                      return matchSearch && matchTier;
                    }).length
                  }
                </strong>{' '}
                of {students.length} candidates
              </div>
            </div>

            {/* Students Table */}
            <div className="card fade-in" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '0.65rem' }}>
              <div style={{ width: '100%', overflowX: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.65rem 0.65rem', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Candidate Profile</th>
                      <th style={{ padding: '0.65rem 0.65rem', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Impairment</th>
                      <th style={{ padding: '0.65rem 0.65rem', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Extra Time</th>
                      <th style={{ padding: '0.65rem 0.65rem', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Speech Rate</th>
                      <th style={{ padding: '0.65rem 0.65rem', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Certificate</th>
                      <th style={{ padding: '0.65rem 0.65rem', textAlign: 'right', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter(s => {
                        const matchSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.rollNo.toLowerCase().includes(studentSearch.toLowerCase());
                        const matchTier = tierFilter === 'All' || s.impairmentTier === tierFilter;
                        return matchSearch && matchTier;
                      })
                      .map((student, idx, arr) => {
                        const initials = student.name
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        const extraMins = Math.round((student.accommodations.extraTimeMultiplier - 1) * 60);

                        // Color-coded professional palettes
                        const avatarPalette = [
                          { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' }, // Soft Blue
                          { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' }, // Soft Purple
                          { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' }, // Soft Emerald
                          { bg: '#FFF7ED', color: '#C2410C', border: '#FFEDD5' }, // Soft Amber
                        ];
                        const avStyle = avatarPalette[idx % avatarPalette.length];

                        const getTierBadge = (tier: string) => {
                          switch (tier) {
                            case 'Total Blindness':
                              return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
                            case 'Legally Blind':
                              return { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' };
                            case 'Low Vision':
                              return { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' };
                            default:
                              return { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
                          }
                        };
                        const tierStyle = getTierBadge(student.impairmentTier);

                        return (
                          <tr
                            key={student.id}
                            style={{
                              borderBottom: idx !== arr.length - 1 ? '1px solid var(--border)' : 'none',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.015)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            {/* Candidate Profile: Name & Registration ID */}
                            <td style={{ padding: '0.65rem 0.65rem', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: avStyle.bg,
                                    color: avStyle.color,
                                    border: `1.5px solid ${avStyle.border}`,
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {initials}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.84rem' }}>
                                    {student.name}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    {student.rollNo}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Impairment Category */}
                            <td style={{ padding: '0.65rem 0.65rem', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  color: tierStyle.color,
                                  background: tierStyle.bg,
                                  border: `1px solid ${tierStyle.border}`,
                                  padding: '0.18rem 0.5rem',
                                  borderRadius: '0.35rem',
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {student.impairmentTier}
                              </span>
                            </td>

                            {/* Compensatory Time */}
                            <td style={{ padding: '0.65rem 0.65rem', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: '#15803D',
                                    background: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    padding: '0.18rem 0.45rem',
                                    borderRadius: '0.35rem',
                                    fontSize: '0.78rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                  }}
                                >
                                  <Clock size={11} />
                                  +{extraMins}m/hr
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  ({student.accommodations.extraTimeMultiplier}×)
                                </span>
                              </div>
                            </td>

                            {/* Speech Rate */}
                            <td style={{ padding: '0.65rem 0.65rem', color: 'var(--text)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: '#0F172A',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    padding: '0.18rem 0.45rem',
                                    borderRadius: '0.35rem',
                                    fontSize: '0.76rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <Volume2 size={11} color="var(--primary)" />
                                  {student.accommodations.speechRate}×
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  TTS
                                </span>
                              </div>
                            </td>

                            {/* PwD Certificate Status */}
                            <td style={{ padding: '0.65rem 0.65rem', whiteSpace: 'nowrap' }}>
                              {student.pwdVerified ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      background: '#F0FDF4',
                                      border: '1px solid #BBF7D0',
                                      padding: '0.16rem 0.45rem',
                                      borderRadius: '9999px',
                                    }}
                                  >
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#15803D' }}>Verified</span>
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    {student.certificateId}
                                  </span>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    background: '#FFFBEB',
                                    border: '1px solid #FDE68A',
                                    padding: '0.16rem 0.45rem',
                                    borderRadius: '9999px',
                                  }}
                                >
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#B45309' }}>Under Verification</span>
                                </div>
                              )}
                            </td>

                            {/* Actions Button */}
                            <td style={{ padding: '0.65rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                className="btn-secondary"
                                onClick={() => setSelectedStudentForEdit(student)}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.28rem 0.6rem',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '0.375rem',
                                  fontWeight: 600,
                                  background: '#FFFFFF',
                                  color: '#0F172A',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.borderColor = 'var(--primary)';
                                  e.currentTarget.style.color = 'var(--primary)';
                                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.04)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.borderColor = '#CBD5E1';
                                  e.currentTarget.style.color = '#0F172A';
                                  e.currentTarget.style.background = '#FFFFFF';
                                }}
                              >
                                <SlidersHorizontal size={11} />
                                Configure
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Accommodations Modal */}
            {selectedStudentForEdit && (
              <div className="modal-overlay" role="dialog" aria-modal="true">
                <div className="modal-box" style={{ maxWidth: 540 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Accessibility size={20} color="var(--primary)" />
                      <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
                        Accommodations for {selectedStudentForEdit.name}
                      </h3>
                    </div>
                    <button className="btn-ghost" onClick={() => setSelectedStudentForEdit(null)}>
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateStudentAccommodations} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Impairment Tier</label>
                      <select
                        className="input-field"
                        value={selectedStudentForEdit.impairmentTier}
                        onChange={e => setSelectedStudentForEdit({ ...selectedStudentForEdit, impairmentTier: e.target.value as ImpairmentTier })}
                      >
                        <option value="Low Vision">Low Vision</option>
                        <option value="Legally Blind">Legally Blind</option>
                        <option value="Total Blindness">Total Blindness</option>
                        <option value="Color Vision Deficient">Color Vision Deficient</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Compensatory Extra Time</label>
                        <select
                          className="input-field"
                          value={selectedStudentForEdit.accommodations.extraTimeMultiplier}
                          onChange={e => setSelectedStudentForEdit({
                            ...selectedStudentForEdit,
                            accommodations: { ...selectedStudentForEdit.accommodations, extraTimeMultiplier: parseFloat(e.target.value) as any }
                          })}
                        >
                          <option value="1.0">Standard Time (1.0x)</option>
                          <option value="1.33">1.33x (+20 min/hour)</option>
                          <option value="1.5">1.50x (+30 min/hour)</option>
                          <option value="2.0">2.00x (+60 min/hour - Double Time)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Screen Reader Integration</label>
                        <select
                          className="input-field"
                          value={selectedStudentForEdit.accommodations.screenReader}
                          onChange={e => setSelectedStudentForEdit({
                            ...selectedStudentForEdit,
                            accommodations: { ...selectedStudentForEdit.accommodations, screenReader: e.target.value as any }
                          })}
                        >
                          <option value="NVDA">NVDA Screen Reader</option>
                          <option value="JAWS">JAWS Accessibility</option>
                          <option value="VoiceOver">Apple VoiceOver</option>
                          <option value="Built-in SIGHT Voice">Built-in SIGHT Voice Guide</option>
                          <option value="None">None (Visual Only)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Voice Speech Rate ({selectedStudentForEdit.accommodations.speechRate}x)</label>
                        <input
                          type="range"
                          min="0.8"
                          max="2.0"
                          step="0.1"
                          value={selectedStudentForEdit.accommodations.speechRate}
                          onChange={e => setSelectedStudentForEdit({
                            ...selectedStudentForEdit,
                            accommodations: { ...selectedStudentForEdit.accommodations, speechRate: parseFloat(e.target.value) }
                          })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>PwD Certificate Verification</label>
                        <select
                          className="input-field"
                          value={selectedStudentForEdit.pwdVerified ? 'yes' : 'no'}
                          onChange={e => setSelectedStudentForEdit({ ...selectedStudentForEdit, pwdVerified: e.target.value === 'yes' })}
                        >
                          <option value="yes">Verified (Government UDID)</option>
                          <option value="no">Pending Medical Verification</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <button type="button" className="btn-secondary" onClick={() => setSelectedStudentForEdit(null)}>Cancel</button>
                      <button type="submit" className="btn-primary">Save Accommodations</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 3: 📝 EXAMINATIONS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'exams' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>Examinations & Mock Catalog</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Configure accessible online exams with time limits, phonetic voice prompts, and categories
                </p>
              </div>
              <button className="btn-primary" onClick={() => setShowAddExamModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={16} /> Create Exam
              </button>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.25rem' }}>Categories:</span>
              {['All', ...examCategories].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setExamCategoryFilter(cat)}
                  style={{
                    padding: '0.28rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: examCategoryFilter === cat ? 700 : 500,
                    borderRadius: '9999px',
                    border: '1.5px solid',
                    borderColor: examCategoryFilter === cat ? 'var(--primary)' : 'var(--border)',
                    background: examCategoryFilter === cat ? 'var(--primary)' : 'var(--bg-surface)',
                    color: examCategoryFilter === cat ? '#fff' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {exams
                .filter(e => examCategoryFilter === 'All' || e.category.toLowerCase() === examCategoryFilter.toLowerCase())
                .map(e => (
                  <div key={e.id} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="badge badge-blue">{e.category}</span>
                      <span className="badge badge-amber">{e.difficulty}</span>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{e.title}</h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{e.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} /> {e.durationMinutes} Mins</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><HelpCircle size={13} /> {e.totalQuestions} Questions</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Live & Published</span>
                      <button
                        className="btn-ghost"
                        onClick={() => testSpeech(`Exam: ${e.title}. Category ${e.category}. Duration ${e.durationMinutes} minutes. Total questions ${e.totalQuestions}.`)}
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}
                      >
                        <Volume2 size={13} /> Voice Briefing
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 4: 📚 QUESTION BANK
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'questions' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>Question Bank & Audio Approvals</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Verified questions with phonetic voice accessibility checks
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search question statement…"
                  value={questionSearch}
                  onChange={e => setQuestionSearch(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', width: 220 }}
                />
                <button className="btn-primary" onClick={() => setShowAddQuestionModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                  <Plus size={15} /> Add Question
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questionBank
                .filter(q => q.q.toLowerCase().includes(questionSearch.toLowerCase()))
                .map((q, idx) => (
                  <div key={q.id} className="card fade-in" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span className="badge badge-blue">{q.topic}</span>
                        <span className="badge badge-amber">{q.difficulty}</span>
                        <span className="badge badge-green">Voice-Narration Ready</span>
                      </div>
                      <button
                        className="btn-ghost"
                        onClick={() => testSpeech(q.phoneticAudioPreview || q.q)}
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}
                      >
                        <Volume2 size={14} /> Listen Speech Preview
                      </button>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.6rem' }}>
                      {idx + 1}. {q.q}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.45rem 0.7rem',
                            borderRadius: '0.4rem',
                            background: i === q.correct ? 'var(--accent-light)' : 'var(--bg-surface)',
                            border: `1px solid ${i === q.correct ? 'var(--accent)' : 'var(--border)'}`,
                            fontSize: '0.82rem',
                            fontWeight: i === q.correct ? 700 : 400,
                            color: i === q.correct ? 'var(--accent)' : 'var(--text)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>{String.fromCharCode(65 + i)}. {opt}</span>
                          {i === q.correct && <Check size={13} strokeWidth={3} />}
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}>
                      <strong style={{ color: 'var(--accent)' }}>Explanation: </strong> {q.explanation}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 5: 🤖 AI QUESTION GENERATOR
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'ai-generator' && (
          <div className="fade-in">
            <div className="card fade-in" style={{ padding: '1.75rem', marginBottom: '2rem', border: '2px solid var(--secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ color: 'var(--secondary)' }}>
                  <Bot size={32} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
                    AI Curriculum & Question Generator
                  </h2>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) auto auto auto', gap: '0.6rem', marginTop: '1rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input-field"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Topic: e.g. Fundamental Rights, Economics, General Science..."
                  style={{ padding: '0.7rem 1rem', fontSize: '0.85rem' }}
                />
                <select
                  className="input-field"
                  value={aiDifficulty}
                  onChange={e => setAiDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                  style={{ padding: '0.7rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
                  title="Question Difficulty"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '0.45rem 0.65rem',
                  }}
                  title="Type any number of questions to generate (1-25)"
                >
                  <label htmlFor="ai-question-count-input" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Count:
                  </label>
                  <input
                    id="ai-question-count-input"
                    type="number"
                    min={1}
                    max={25}
                    value={aiCount}
                    onChange={e => setAiCount(e.target.value)}
                    onBlur={() => {
                      const n = parseInt(String(aiCount), 10);
                      if (isNaN(n) || n < 1) setAiCount(1);
                      else if (n > 25) setAiCount(25);
                      else setAiCount(n);
                    }}
                    style={{
                      width: '48px',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Qs</span>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleGenerateAIQuestions}
                  disabled={isGenerating}
                  style={{ padding: '0.7rem 1.25rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {isGenerating ? <><Loader2 size={16} className="spin" /> Generating…</> : <><Sparkles size={16} /> Generate with AI</>}
                </button>
              </div>
            </div>

            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '1rem' }}>
              Candidate Drafts Awaiting Admin Approval
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {generatedDrafts.map((draft, idx) => (
                <div key={draft.id} className="card fade-in" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="badge badge-blue">{draft.topic}</span>
                      <span className="badge badge-amber">{draft.difficulty}</span>
                      <span className="badge badge-green">AI Model Generated</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-ghost"
                        onClick={() => testSpeech(draft.phoneticAudioPreview || draft.q)}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Volume2 size={13} /> Listen Preview
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => approveDraftToBank(draft.id)}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <CheckCircle2 size={13} /> Approve to Question Bank
                      </button>
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
                    Q{idx + 1}. {draft.q}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {draft.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.4rem',
                          background: oIdx === draft.correct ? 'var(--accent-light)' : 'var(--bg-surface)',
                          border: `1px solid ${oIdx === draft.correct ? 'var(--accent)' : 'var(--border)'}`,
                          fontSize: '0.85rem',
                          color: oIdx === draft.correct ? 'var(--accent)' : 'var(--text)',
                          fontWeight: oIdx === draft.correct ? 700 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                        {oIdx === draft.correct && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.6rem 0.85rem', borderRadius: '0.5rem' }}>
                    <strong style={{ color: 'var(--accent)' }}>AI Explanation Grounding: </strong>
                    {draft.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 6: 📖 SUBJECTS & TOPICS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'subjects' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>Curriculum Subjects & Topic Taxonomy</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Organize syllabus structure, exam weightages, and candidate struggle indicators
                </p>
              </div>
              <button className="btn-primary" onClick={() => setShowAddTopicModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                <Plus size={15} /> Add Topic to Subject
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem' }}>
              {/* Subject List Selector */}
              <div className="card fade-in" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', padding: '0.4rem 0.6rem' }}>
                  CURRICULUM SUBJECTS
                </div>
                {subjects.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubject(sub)}
                    className={selectedSubject.id === sub.id ? 'sidebar-link active' : 'sidebar-link'}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.84rem',
                      fontWeight: selectedSubject.id === sub.id ? 700 : 500,
                    }}
                  >
                    <span>{sub.name}</span>
                    <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{sub.topics.length}</span>
                  </button>
                ))}
              </div>

              {/* Topics Breakdown Table */}
              <div className="card fade-in">
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                    {selectedSubject.name} ({selectedSubject.code})
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedSubject.description}</p>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.6rem' }}>Topic Name</th>
                        <th style={{ padding: '0.6rem' }}>Exam Weightage</th>
                        <th style={{ padding: '0.6rem' }}>Questions in Bank</th>
                        <th style={{ padding: '0.6rem' }}>Student Struggle Rate</th>
                        <th style={{ padding: '0.6rem' }}>Intervention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSubject.topics.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.65rem', fontWeight: 600, color: 'var(--text)' }}>{t.name}</td>
                          <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>{t.weightagePercent}%</td>
                          <td style={{ padding: '0.65rem' }}>{t.questionCount} Questions</td>
                          <td style={{ padding: '0.65rem', color: t.struggleRate > 50 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: t.struggleRate > 50 ? 700 : 400 }}>
                            {t.struggleRate}% struggling
                          </td>
                          <td style={{ padding: '0.65rem' }}>
                            <span className={`badge badge-${t.struggleRate > 50 ? 'red' : 'green'}`} style={{ fontSize: '0.68rem' }}>
                              {t.struggleRate > 50 ? 'High Priority AI Drills' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Add Topic Modal */}
            {showAddTopicModal && (
              <div className="modal-overlay" role="dialog" aria-modal="true">
                <div className="modal-box" style={{ maxWidth: 440 }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1rem' }}>
                    Add Topic to {selectedSubject.name}
                  </h3>
                  <form onSubmit={handleAddTopic} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Topic Title</label>
                      <input className="input-field" required value={newTopicName} onChange={e => setNewTopicName(e.target.value)} placeholder="e.g. Ratio and Proportion" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Weightage Percentage (%)</label>
                      <input className="input-field" type="number" required value={newTopicWeightage} onChange={e => setNewTopicWeightage(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button type="button" className="btn-secondary" onClick={() => setShowAddTopicModal(false)}>Cancel</button>
                      <button type="submit" className="btn-primary">Save Topic</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 7: 📊 ATTEMPTS & RESULTS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'attempts' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>Candidate Attempts & Audio Telemetry</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Audit logs of submitted exams, audio interruptions, and screen reader restarts
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['All', 'Completed', 'Flagged for Review'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setAttemptFilter(f)}
                    className={attemptFilter === f ? 'btn-primary' : 'btn-ghost'}
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="card fade-in">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.7rem' }}>Candidate</th>
                      <th style={{ padding: '0.7rem' }}>Exam Paper</th>
                      <th style={{ padding: '0.7rem' }}>Score</th>
                      <th style={{ padding: '0.7rem' }}>Time Spent</th>
                      <th style={{ padding: '0.7rem' }}>Audio Proctoring Flags</th>
                      <th style={{ padding: '0.7rem' }}>Status</th>
                      <th style={{ padding: '0.7rem', textAlign: 'right' }}>Scorecard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attemptLogs
                      .filter(l => attemptFilter === 'All' || l.status === attemptFilter)
                      .map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.7rem', fontWeight: 600, color: 'var(--text)' }}>
                            <div>{log.studentName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.studentRoll}</div>
                          </td>
                          <td style={{ padding: '0.7rem', color: 'var(--text)' }}>{log.examTitle}</td>
                          <td style={{ padding: '0.7rem', fontWeight: 700, color: log.percentage >= 70 ? 'var(--accent)' : 'var(--warning)' }}>
                            {log.score}/{log.maxScore} ({log.percentage}%)
                          </td>
                          <td style={{ padding: '0.7rem', color: 'var(--text-muted)' }}>
                            {Math.floor(log.timeSpentSeconds / 60)}m {log.timeSpentSeconds % 60}s
                          </td>
                          <td style={{ padding: '0.7rem' }}>
                            {(log.flags?.length || 0) > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {log.flags?.map((fl, i) => (
                                  <span key={i} style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <AlertTriangle size={12} /> {fl}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}>Normal</span>
                            )}
                          </td>
                          <td style={{ padding: '0.7rem' }}>
                            <span className={`badge badge-${log.status === 'Completed' ? 'green' : log.status === 'Flagged for Review' ? 'amber' : 'blue'}`} style={{ fontSize: '0.68rem' }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.7rem', textAlign: 'right' }}>
                            <button
                              className="btn-secondary"
                              onClick={() => setViewAttemptModal(log)}
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inspect Attempt Modal */}
            {viewAttemptModal && (
              <div className="modal-overlay" role="dialog" aria-modal="true">
                <div className="modal-box" style={{ maxWidth: 520 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
                      Attempt Log: {viewAttemptModal.studentName}
                    </h3>
                    <button className="btn-ghost" onClick={() => setViewAttemptModal(null)}><X size={18} /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                      <div><strong>Examination:</strong> {viewAttemptModal.examTitle}</div>
                      <div><strong>Roll Number:</strong> {viewAttemptModal.studentRoll}</div>
                      <div><strong>Impairment Category:</strong> {viewAttemptModal.impairmentTier}</div>
                      <div><strong>Total Time:</strong> {Math.floor(viewAttemptModal.timeSpentSeconds / 60)} minutes</div>
                    </div>

                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Proctoring & Audio Log</h4>
                      {(viewAttemptModal.flags?.length || 0) > 0 ? (
                        <div style={{ padding: '0.6rem', background: 'var(--danger-light)', borderRadius: '0.4rem', border: '1px solid var(--danger)', fontSize: '0.8rem', color: 'var(--danger)' }}>
                          {viewAttemptModal.flags?.map((f, idx) => (
                            <div key={idx}>• {f}</div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No suspicious events or audio anomalies reported.</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="btn-primary" onClick={() => { toast.success('Attempt verified and marked as clean!', 'Audit Verified'); setViewAttemptModal(null); }}>
                        Mark as Clean & Verified
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 8: 📈 ANALYTICS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="fade-in">
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
              Accessibility & Performance Deep-Dive Analytics
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Telemetric distribution of screen reader usage, high contrast modes, and topic difficulty curves
            </p>

            {/* Accessibility Tech Adoption Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="card fade-in">
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
                  Assistive Mode Distribution
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { mode: 'Screen Reader Mode (NVDA / JAWS)', percent: 54, count: '78 students', color: 'var(--primary)' },
                    { mode: 'Voice Narration & Speech Prompts', percent: 32, count: '46 students', color: 'var(--secondary)' },
                    { mode: 'High Contrast Colorway (Yellow on Black)', percent: 28, count: '40 students', color: 'var(--warning)' },
                    { mode: 'Braille Display Terminals', percent: 12, count: '17 students', color: 'var(--accent)' },
                  ].map(item => (
                    <div key={item.mode}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.mode}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{item.percent}% ({item.count})</span>
                      </div>
                      <div style={{ width: '100%', height: 7, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${item.percent}%`, height: '100%', background: item.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Speech Rate Adoption Spectrum */}
              <div className="card fade-in">
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
                  Candidate Audio Speech Rate Preferences
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { rate: '1.0x - 1.2x (Standard Pace)', percent: 45, color: '#10B981' },
                    { rate: '1.3x - 1.5x (Fluent Screen Reader User)', percent: 38, color: 'var(--primary)' },
                    { rate: '1.6x - 2.0x (Advanced Power User)', percent: 17, color: 'var(--accent)' },
                  ].map(item => (
                    <div key={item.rate}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.rate}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{item.percent}%</span>
                      </div>
                      <div style={{ width: '100%', height: 7, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${item.percent}%`, height: '100%', background: item.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic Failure Breakdown Table */}
            <div className="card fade-in">
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={18} color="var(--danger)" />
                Highest Failure & Audio Latency Topics
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem' }}>Topic Name</th>
                    <th style={{ padding: '0.6rem' }}>Subject</th>
                    <th style={{ padding: '0.6rem' }}>Struggling Ratio</th>
                    <th style={{ padding: '0.6rem' }}>Avg Time Per Question</th>
                    <th style={{ padding: '0.6rem' }}>Recommended AI Intervention</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { topic: 'Percentages & Profit/Loss', subject: 'Mathematics', struggle: '65%', time: '112 sec', intervention: 'Generate 15 Audio Step Drills' },
                    { topic: 'Pipes & Cisterns', subject: 'Mathematics', struggle: '58%', time: '98 sec', intervention: 'Generate Formula Simplification Drills' },
                    { topic: 'Ancient Indian History', subject: 'General Awareness', struggle: '44%', time: '64 sec', intervention: 'Auto-schedule Flash Revision Audio' },
                    { topic: 'Blood Relations', subject: 'Reasoning', struggle: '28%', time: '45 sec', intervention: 'Normal Audio Practice' },
                  ].map(t => (
                    <tr key={t.topic} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 600, color: 'var(--text)' }}>{t.topic}</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{t.subject}</td>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--danger)' }}>{t.struggle}</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{t.time}</td>
                      <td style={{ padding: '0.65rem' }}>
                        <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>{t.intervention}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 9: ♿ ACCESSIBILITY (Pronunciation & Policies)
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'accessibility' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>Accessibility Accommodations & Standards</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Phonetic pronunciation dictionary for screen readers & national PwD compliance rules
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                  WCAG 2.1 Level AA: 100% Pass
                </span>
              </div>
            </div>

            {/* Phonetic Pronunciation Dictionary */}
            <div className="card fade-in" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
                    Phonetic Symbol Pronunciation Dictionary
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Translates complex mathematical, logical, and exam symbols into screen-reader friendly natural speech
                  </p>
                </div>
              </div>

              {/* Add Rule Form */}
              <form onSubmit={handleAddPronunciationRule} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px auto', gap: '0.5rem', marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Symbol (e.g. %)"
                  value={newRuleSymbol}
                  onChange={e => setNewRuleSymbol(e.target.value)}
                  required
                  style={{ fontSize: '0.82rem' }}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Phonetic replacement (e.g. percent)"
                  value={newRulePhonetic}
                  onChange={e => setNewRulePhonetic(e.target.value)}
                  required
                  style={{ fontSize: '0.82rem' }}
                />
                <select
                  className="input-field"
                  value={newRuleCategory}
                  onChange={e => setNewRuleCategory(e.target.value as any)}
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="Math">Math</option>
                  <option value="Logic">Logic</option>
                  <option value="Greek">Greek</option>
                  <option value="Exam Notation">Exam Notation</option>
                </select>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  Add Rule
                </button>
              </form>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.6rem' }}>Symbol</th>
                      <th style={{ padding: '0.6rem' }}>Phonetic Voicing Rule</th>
                      <th style={{ padding: '0.6rem' }}>Category</th>
                      <th style={{ padding: '0.6rem' }}>Example Context</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Audio Test</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pronunciationRules.map(rule => (
                      <tr key={rule.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.6rem', fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                          {rule.symbol}
                        </td>
                        <td style={{ padding: '0.6rem', fontWeight: 600, color: 'var(--text)' }}>
                          "{rule.phoneticReplacement}"
                        </td>
                        <td style={{ padding: '0.6rem' }}>
                          <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{rule.category}</span>
                        </td>
                        <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{rule.exampleUsage}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                          <button
                            className="btn-ghost"
                            onClick={() => testSpeech(rule.exampleUsage)}
                            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}
                          >
                            <Volume2 size={13} /> Test Pronunciation
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 10: 🔔 NOTIFICATIONS & VOICE BROADCAST
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>Emergency Announcements & Voice Broadcast</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Push urgent alerts directly to candidate screen readers and examination halls
                </p>
              </div>
            </div>

            {/* Broadcast Composer */}
            <div className="card fade-in" style={{ padding: '1.5rem', marginBottom: '1.75rem', border: '1.5px solid var(--primary)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Send size={18} color="var(--primary)" />
                Compose Broadcast Message
              </h3>

              <form onSubmit={handleBroadcastAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Announcement Headline</label>
                  <input
                    className="input-field"
                    required
                    placeholder="e.g. Severe Network Latency — 10 Minutes Compensatory Time Granted"
                    value={announcementTitle}
                    onChange={e => setAnnouncementTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Announcement Text</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    required
                    placeholder="Full notice text that will be spoken aloud to students via TTS…"
                    value={announcementMsg}
                    onChange={e => setAnnouncementMsg(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Target Audience</label>
                    <select
                      className="input-field"
                      value={announcementTarget}
                      onChange={e => setAnnouncementTarget(e.target.value as any)}
                    >
                      <option value="All Students">All Enrolled PwD Candidates</option>
                      <option value="Active Exam Halls">Active Live Exam Halls Only</option>
                      <option value="Total Blindness Tier">Total Blindness Candidates</option>
                      <option value="Low Vision Tier">Low Vision Candidates</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Alert Priority</label>
                    <select
                      className="input-field"
                      value={announcementPriority}
                      onChange={e => setAnnouncementPriority(e.target.value as any)}
                    >
                      <option value="Normal">Normal Notification</option>
                      <option value="High">High Importance</option>
                      <option value="Emergency Audio Broadcast">Emergency Audio Voice Alert</option>
                    </select>
                  </div>

                  <div style={{ paddingTop: '1.25rem' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isAudioBroadcast}
                        onChange={e => setIsAudioBroadcast(e.target.checked)}
                      />
                      <span>Speak Immediately Aloud</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Send size={15} /> Send Broadcast Now
                  </button>
                </div>
              </form>
            </div>

            {/* Broadcast History */}
            <div className="card fade-in">
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
                Past Broadcast Notifications
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {announcements.map(a => (
                  <div key={a.id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge badge-${a.priority === 'Emergency Audio Broadcast' ? 'red' : 'blue'}`} style={{ fontSize: '0.68rem' }}>
                          {a.priority}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{a.title}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.createdAt}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.4rem' }}>
                      {a.message}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Target: <strong>{a.targetAudience}</strong></span>
                      <button className="btn-ghost" onClick={() => testSpeech(a.message)} style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                        <Volume2 size={12} /> Play Voice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 11: 📄 REPORTS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>Compliance, Audit & Exam Ledgers</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Certified accessibility compliance documentation for government accreditation & SIH reviews
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {reports.map(rep => (
                <div key={rep.id} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-blue">{rep.category}</span>
                    <span className="badge badge-green">{rep.format}</span>
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text)' }}>
                    {rep.title}
                  </h3>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Size: {rep.fileSize}</span>
                    <span>Date: {rep.generatedDate}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn-primary"
                      onClick={() => toast.info(`Downloading "${rep.title}" (${rep.format})… Certified by SIGHT-EXAM AI.`, 'Report Download')}
                      style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Download size={14} /> Download {rep.format} Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 12: ⚙ SETTINGS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="fade-in">
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
              System & Engine Configuration
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Configure AI parameters, Text-to-Speech synthesizer defaults, and security policies
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* TTS Settings */}
              <div className="card fade-in">
                <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
                  Web Speech Voice Synthesizer Tuning
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Default Voice Model</label>
                    <select
                      className="input-field"
                      value={selectedTTSVoice}
                      onChange={e => {
                        setSelectedTTSVoice(e.target.value);
                        speechService.setVoiceByName(e.target.value);
                      }}
                    >
                      <option value="Google UK English Female">Google UK English Female (Warm, Studio Acoustic)</option>
                      <option value="Microsoft Heera">Microsoft Heera (Indian English)</option>
                      <option value="Google US English">Google US English (Clear Natural)</option>
                      <option value="Microsoft Ravi">Microsoft Ravi (Indian English Male)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      className="btn-primary"
                      onClick={() => testSpeech(`This is a test of ${selectedTTSVoice}. SIGHT-EXAM AI is ready for all examinations.`)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                    >
                      <Volume2 size={15} /> Play Speech Test
                    </button>
                  </div>
                </div>
              </div>

              {/* AI & Proctoring Settings */}
              <div className="card fade-in">
                <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
                  AI Proctoring & Sensitivity Thresholds
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Audio Interruption Sensitivity</label>
                    <select
                      className="input-field"
                      value={proctoringSensitivity}
                      onChange={e => setProctoringSensitivity(e.target.value as any)}
                    >
                      <option value="Low">Low (Permits background room sound)</option>
                      <option value="Standard">Standard (Flags secondary voices & mic disconnects)</option>
                      <option value="Strict">Strict (Official Government Exam Mode)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Auto Session Timeout</label>
                    <select
                      className="input-field"
                      value={autoSessionTimeout}
                      onChange={e => setAutoSessionTimeout(e.target.value)}
                    >
                      <option value="30">30 minutes of inactivity</option>
                      <option value="60">60 minutes of inactivity</option>
                      <option value="120">120 minutes of inactivity</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODULE 13: 👤 ADMIN PROFILE
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="fade-in">
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
              Administrative Profile & Credentials
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              SIH 4.0 Nodal Officer credentials, security credentials, and session authorization
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              <div className="card fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.35rem', fontWeight: 800 }}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>{user?.name || 'Admin Officer'}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email || 'admin@sightexamai.in'}</p>
                    <span className="badge badge-green" style={{ fontSize: '0.68rem', marginTop: '0.25rem' }}>
                      Certified Super Administrator
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <div><strong>Authority:</strong> Ministry of Education & SIH 4.0 Hackathon Nodal Center</div>
                  <div><strong>Assigned Center:</strong> SIGHT-EXAM AI Central Server Hub</div>
                  <div><strong>Security Clearance:</strong> Full Exam Creation & Audit Verification</div>
                  <div><strong>Session Duration:</strong> Active (Encrypted TLS 1.3)</div>
                </div>
              </div>

              {/* Security Credentials */}
              <div className="card fade-in">
                <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Key size={18} color="var(--primary)" />
                  Admin Passcode & Key Management
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  To reset your master administrative password or rotate API keys:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => toast.info('Security verification link dispatched to authorized nodal email!', 'Security Link Sent')}
                    style={{ fontSize: '0.82rem', textAlign: 'center' }}
                  >
                    Send One-Time Password (OTP) to Registered Email
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => toast.success('API Key rotated successfully.', 'Key Rotated')}
                    style={{ fontSize: '0.82rem', textAlign: 'center', color: 'var(--primary)' }}
                  >
                    Rotate Gemini 3.8 Flash Endpoint Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODALS: CREATE EXAM
           ══════════════════════════════════════════════════════════ */}
        {showAddExamModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-box" style={{ maxWidth: 520 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <FileText size={20} color="var(--primary)" />
                  Create New Competitive Exam
                </h3>
                <button className="btn-ghost" onClick={() => setShowAddExamModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Exam Title</label>
                  <input className="input-field" required value={newExamTitle} onChange={e => setNewExamTitle(e.target.value)} placeholder="e.g. SSC General Awareness Tier 1 Mock" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Category</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCustomCategory(!isAddingCustomCategory);
                          if (!isAddingCustomCategory) setCustomCategoryInput('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          padding: 0,
                        }}
                      >
                        <Plus size={12} /> {isAddingCustomCategory ? 'Choose from list' : '+ New Category'}
                      </button>
                    </div>

                    {!isAddingCustomCategory ? (
                      <select
                        className="input-field"
                        value={newExamCategory}
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setIsAddingCustomCategory(true);
                          } else {
                            setNewExamCategory(e.target.value);
                          }
                        }}
                      >
                        {examCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__custom__">+ Add Custom / New Category...</option>
                      </select>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input
                            className="input-field"
                            autoFocus
                            placeholder="Type exam (e.g. NEET, GATE, CTET, CLAT)..."
                            value={customCategoryInput}
                            onChange={e => {
                              setCustomCategoryInput(e.target.value);
                              setShowCategorySuggestions(true);
                            }}
                            onFocus={() => setShowCategorySuggestions(true)}
                            required={isAddingCustomCategory}
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setIsAddingCustomCategory(false);
                              setShowCategorySuggestions(false);
                            }}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', flexShrink: 0 }}
                          >
                            List
                          </button>
                        </div>

                        {/* Interactive Autocomplete Suggestions Dropdown */}
                        {showCategorySuggestions && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              left: 0,
                              width: '380px',
                              minWidth: '320px',
                              maxWidth: 'calc(100vw - 40px)',
                              background: 'var(--bg-surface, #ffffff)',
                              borderRadius: '0.6rem',
                              border: '1.5px solid var(--primary, #4338CA)',
                              boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
                              zIndex: 2000,
                              maxHeight: '280px',
                              overflowY: 'auto',
                              padding: '0.4rem',
                            }}
                          >
                            {(() => {
                              const query = customCategoryInput.trim().toLowerCase();
                              const matches = query
                                ? POPULAR_EXAMS_DATABASE.filter(item =>
                                  item.name.toLowerCase().includes(query) ||
                                  item.short.toLowerCase().includes(query) ||
                                  item.category.toLowerCase().includes(query)
                                ).slice(0, 8)
                                : POPULAR_EXAMS_DATABASE.slice(0, 8);

                              return (
                                <div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.25rem 0.4rem', borderBottom: '1px solid var(--border)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{query ? `Matching Exams (${matches.length})` : 'Popular Competitive Exams to Pick:'}</span>
                                    <span
                                      onClick={e => {
                                        e.stopPropagation();
                                        setShowCategorySuggestions(false);
                                      }}
                                      style={{ cursor: 'pointer', color: 'var(--text-muted)', padding: '0 0.3rem', fontSize: '0.85rem' }}
                                    >
                                      ✕
                                    </span>
                                  </div>

                                  {matches.length > 0 ? (
                                    matches.map((item, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setCustomCategoryInput(item.short);
                                          setShowCategorySuggestions(false);
                                          if (!newExamTitle.trim()) {
                                            setNewExamTitle(`${item.short} Full Practice Mock Test`);
                                          }
                                        }}
                                        style={{
                                          padding: '0.55rem 0.65rem',
                                          borderRadius: '0.45rem',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '0.25rem',
                                          transition: 'background 0.12s ease',
                                          borderBottom: idx !== matches.length - 1 ? '1px solid var(--border)' : 'none',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(67, 56, 202, 0.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.6rem' }}>
                                          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.84rem', lineHeight: 1.35 }}>
                                            {item.name}
                                          </span>
                                          <span className="badge badge-blue" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                                            {item.category}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                          <span>Category Tag: <strong style={{ color: 'var(--primary)' }}>{item.short}</strong></span>
                                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Click to Select ✓</span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ padding: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                      Custom exam category "{customCategoryInput}" will be created.
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Difficulty</label>
                    <select className="input-field" value={newExamDifficulty} onChange={e => setNewExamDifficulty(e.target.value as any)}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Base Duration (Mins)</label>
                    <input className="input-field" type="number" required value={newExamDuration} onChange={e => setNewExamDuration(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Questions Count</label>
                    <input className="input-field" type="number" required value={newExamQuestionsCount} onChange={e => setNewExamQuestionsCount(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Spoken Instructions for Screen Readers</label>
                  <textarea className="input-field" rows={3} value={newExamInstructions} onChange={e => setNewExamInstructions(e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddExamModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save & Publish Exam</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODALS: ADD QUESTION MANUALLY
           ══════════════════════════════════════════════════════════ */}
        {showAddQuestionModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-box" style={{ maxWidth: 540 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <HelpCircle size={20} color="var(--primary)" />
                  Add Question to Bank
                </h3>
                <button className="btn-ghost" onClick={() => setShowAddQuestionModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleAddQuestionToBank} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Question Statement</label>
                  <textarea className="input-field" required rows={2} value={qText} onChange={e => setQText(e.target.value)} placeholder="Type question statement…" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>Option A</label>
                    <input className="input-field" required value={optA} onChange={e => setOptA(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>Option B</label>
                    <input className="input-field" required value={optB} onChange={e => setOptB(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>Option C</label>
                    <input className="input-field" value={optC} onChange={e => setOptC(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>Option D</label>
                    <input className="input-field" value={optD} onChange={e => setOptD(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>Correct Answer</label>
                    <select className="input-field" value={qCorrect} onChange={e => setQCorrect(parseInt(e.target.value))}>
                      <option value={0}>Option A</option>
                      <option value={1}>Option B</option>
                      <option value={2}>Option C</option>
                      <option value={3}>Option D</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>Topic</label>
                    <input className="input-field" value={qTopic} onChange={e => setQTopic(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>Difficulty</label>
                    <select className="input-field" value={qDifficulty} onChange={e => setQDifficulty(e.target.value as any)}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Concept Explanation</label>
                  <textarea className="input-field" rows={2} value={qExplanation} onChange={e => setQExplanation(e.target.value)} placeholder="Why is this answer correct?" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddQuestionModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Add to Question Bank</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Floating Draggable Quick Actions Button (Accessible on all admin pages) */}
        <DraggableQuickActions
          onCreateExam={() => setShowAddExamModal(true)}
          onOpenAiGenerator={() => setActiveTab('ai-generator')}
          onGoToStudents={() => setActiveTab('students')}
          onAddQuestion={() => setShowAddQuestionModal(true)}
          onTestVoice={() => testSpeech('SIGHT-EXAM AI voice synthesis engine is active.')}
        />
      </div>
    </AppLayout>
  );
}
