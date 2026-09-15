import { Router } from 'express';
import { db } from '../data/db.js';

const router = Router();

// List attempts
router.get('/', (req, res) => {
  const { rollNo, examId } = req.query;
  let attempts = [...db.get().attemptLogs];

  if (rollNo) {
    attempts = attempts.filter(a => a.rollNo === rollNo);
  }
  if (examId) {
    attempts = attempts.filter(a => a.examId === examId);
  }

  return res.json({ count: attempts.length, attempts });
});

// Record new attempt
router.post('/', (req, res) => {
  const {
    candidateName = 'Rahul Sharma',
    rollNo = 'PWD-2026-081',
    examTitle = 'Mock Examination',
    examId = 'exam-1',
    score = 0,
    totalMarks = 100,
    percentage,
    passed = true,
    timeTakenMinutes = 20,
    speechCommandsUsed = 0,
    audioIntegrityStatus = 'Clean',
  } = req.body;

  const calculatedPercentage = percentage ?? Math.round((Number(score) / Number(totalMarks)) * 100);

  const newLog = {
    id: `att_${Date.now()}`,
    candidateName,
    rollNo,
    examTitle,
    examId,
    score: Number(score),
    totalMarks: Number(totalMarks),
    percentage: calculatedPercentage,
    passed: passed ?? calculatedPercentage >= 40,
    completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    timeTakenMinutes: Number(timeTakenMinutes),
    speechCommandsUsed: Number(speechCommandsUsed),
    audioIntegrityStatus: audioIntegrityStatus || 'Clean',
  };

  db.update(data => {
    if (!data.attemptLogs) data.attemptLogs = [];
    data.attemptLogs.unshift(newLog);
  });

  return res.status(201).json({
    success: true,
    message: 'Attempt logged successfully',
    attempt: newLog,
  });
});

export default router;
