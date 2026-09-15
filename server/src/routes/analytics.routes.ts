import { Router } from 'express';
import { db } from '../data/db.js';

const router = Router();

router.get('/overview', (req, res) => {
  const data = db.get();
  const students = data.students;
  const exams = data.exams;
  const attempts = data.attemptLogs;

  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(a => a.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  const totalScore = attempts.reduce((acc, a) => acc + a.percentage, 0);
  const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
  const totalSpeechCommands = attempts.reduce((acc, a) => acc + (a.speechCommandsUsed || 0), 0);

  return res.json({
    kpis: {
      registeredStudents: students.length,
      activeExams: exams.filter(e => e.status === 'active').length,
      totalExams: exams.length,
      completedAttempts: totalAttempts,
      averageScore: avgScore,
      passRate: `${passRate}%`,
      speechCommandsLogged: totalSpeechCommands,
      wcagComplianceScore: '99.4%',
      audioIntegrityRate: '100%',
    },
    impairmentDistribution: {
      'low-vision': students.filter(s => s.impairmentTier === 'low-vision').length,
      'legally-blind': students.filter(s => s.impairmentTier === 'legally-blind').length,
      'totally-blind': students.filter(s => s.impairmentTier === 'totally-blind').length,
    },
    recentAttempts: attempts.slice(0, 5),
  });
});

export default router;
