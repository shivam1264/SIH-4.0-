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
    id,
    candidateName,
    studentName,
    rollNo,
    studentRoll,
    examTitle = 'Mock Examination',
    examId = 'exam-1',
    score = 0,
    totalMarks,
    maxScore,
    percentage,
    passed,
    status,
    timeTakenMinutes,
    timeSpentSeconds,
    speechCommandsUsed,
    audioAlertsCount,
    audioIntegrityStatus = 'Clean',
  } = req.body;

  const actualName = studentName || candidateName || 'Aryan Sharma';
  const actualRoll = studentRoll || rollNo || 'PWD-2026-081';
  const actualMaxScore = Number(maxScore || totalMarks || 100);
  const actualScore = Number(score ?? 0);
  const calculatedPercentage = percentage ?? Math.round((actualScore / actualMaxScore) * 100);
  const actualMinutes = timeTakenMinutes ? Number(timeTakenMinutes) : timeSpentSeconds ? Math.round(Number(timeSpentSeconds) / 60) : 15;
  const actualCommands = Number(audioAlertsCount ?? speechCommandsUsed ?? 0);

  const newLog = {
    id: id || `att_${Date.now()}`,
    candidateName: actualName,
    studentName: actualName,
    rollNo: actualRoll,
    studentRoll: actualRoll,
    examTitle,
    examId,
    score: actualScore,
    maxScore: actualMaxScore,
    totalMarks: actualMaxScore,
    percentage: calculatedPercentage,
    passed: passed ?? (status === 'Completed' || calculatedPercentage >= 40),
    status: status || (calculatedPercentage >= 40 ? 'Completed' : 'Flagged for Review'),
    completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    timeTakenMinutes: actualMinutes,
    timeSpentSeconds: timeSpentSeconds ? Number(timeSpentSeconds) : actualMinutes * 60,
    speechCommandsUsed: actualCommands,
    audioAlertsCount: actualCommands,
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
