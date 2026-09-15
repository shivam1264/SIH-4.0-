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

// Single attempt
router.get('/:id', (req, res) => {
  const attempt = db.get().attemptLogs.find(a => a.id === req.params.id);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt record not found' });
  }
  return res.json({ attempt });
});

export default router;
