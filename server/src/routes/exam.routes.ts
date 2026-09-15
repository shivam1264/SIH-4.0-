import { Router } from 'express';
import { db } from '../data/db.js';
import type { Exam, CandidateAttemptLog } from '../types/index.js';

const router = Router();

// List exams
router.get('/', (req, res) => {
  const { category, status } = req.query;
  let exams = [...db.get().exams];

  if (category && category !== 'all') {
    exams = exams.filter(e => e.category === category);
  }
  if (status && status !== 'all') {
    exams = exams.filter(e => e.status === status);
  }

  return res.json({ count: exams.length, exams });
});

// Get single exam with questions
router.get('/:id', (req, res) => {
  const exam = db.get().exams.find(e => e.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }
  return res.json({ exam });
});

// Create exam
router.post('/', (req, res) => {
  try {
    const {
      title,
      category,
      subject,
      subjects,
      durationMinutes,
      totalMarks,
      passingMarks,
      scheduledDate,
      difficulty,
      questions,
      instructions,
      description,
      totalQuestions,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const resolvedSubject =
      subject ||
      (Array.isArray(subjects) && subjects.length ? subjects[0] : null) ||
      category ||
      'General Studies';

    const qArray = Array.isArray(questions) ? questions : [];

    const newExam: any = {
      id: req.body.id || `exam-custom-${Date.now()}`,
      title: String(title).trim(),
      category: category || 'General Competitive',
      subject: resolvedSubject,
      subjects: Array.isArray(subjects) && subjects.length ? subjects : [resolvedSubject],
      durationMinutes: Number(durationMinutes) || 30,
      totalQuestions: qArray.length || Number(totalQuestions) || 20,
      totalMarks: Number(totalMarks) || (qArray.length ? qArray.length * 2 : 20),
      passingMarks: Number(passingMarks) || (qArray.length ? Math.round(qArray.length * 0.7 * 2) : 14),
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      status: 'active',
      difficulty: difficulty || 'Medium',
      description:
        description ||
        `${category || 'General'} practice mock test with ${qArray.length || 20} questions.`,
      questions: qArray,
      instructions:
        typeof instructions === 'string'
          ? instructions
          : Array.isArray(instructions)
          ? instructions.join(' ')
          : 'Accessible mock test with audio narration enabled. Time multiplier 1.5x applied for PwD candidates.',
      accessibilitySettings: {
        screenReaderOptimized: true,
        extraTimeApproved: true,
        voiceNavigationAllowed: true,
      },
      published: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    db.update(data => {
      const existingIdx = data.exams.findIndex(e => e.id === newExam.id);
      if (existingIdx >= 0) {
        data.exams[existingIdx] = newExam;
      } else {
        data.exams.unshift(newExam);
      }
    });

    return res.status(201).json({ success: true, exam: newExam });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create exam' });
  }
});

// Update exam
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const index = db.get().exams.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  db.update(data => {
    data.exams[index] = {
      ...data.exams[index],
      ...req.body,
    };
  });

  return res.json({ success: true, exam: db.get().exams[index] });
});

// Delete exam
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = db.get().exams.length;

  db.update(data => {
    data.exams = data.exams.filter(e => e.id !== id);
  });

  if (db.get().exams.length === initialLen) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  return res.json({ success: true, message: 'Exam deleted successfully' });
});

// Submit candidate attempt
router.post('/:id/submit', (req, res) => {
  try {
    const { id } = req.params;
    const { answers, candidateName, rollNo, timeTakenMinutes, speechCommandsUsed } = req.body;

    const exam = db.get().exams.find(e => e.id === id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    let correctCount = 0;
    const details = exam.questions.map((q, idx) => {
      const selected = answers?.[q.id] ?? answers?.[idx];
      const isCorrect = selected !== undefined && Number(selected) === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = Math.max(1, exam.questions.length);
    const marksPerQuestion = exam.totalMarks / totalQuestions;
    const score = Math.round(correctCount * marksPerQuestion);
    const percentage = Math.round((score / exam.totalMarks) * 100);
    const passed = score >= exam.passingMarks;

    const newLog: CandidateAttemptLog = {
      id: `att_${Date.now()}`,
      candidateName: candidateName || 'Anonymous Candidate',
      rollNo: rollNo || 'PWD-2026-DEMO',
      examTitle: exam.title,
      examId: exam.id,
      score,
      totalMarks: exam.totalMarks,
      percentage,
      passed,
      completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      timeTakenMinutes: Number(timeTakenMinutes) || 45,
      speechCommandsUsed: Number(speechCommandsUsed) || 0,
      audioIntegrityStatus: 'Clean',
    };

    db.update(data => {
      data.attemptLogs.unshift(newLog);
    });

    return res.json({
      success: true,
      score,
      totalMarks: exam.totalMarks,
      percentage,
      passed,
      correctCount,
      totalQuestions,
      attemptLog: newLog,
      details,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Submission failed' });
  }
});

export default router;
