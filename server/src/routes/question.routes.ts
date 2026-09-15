import { Router } from 'express';
import { db } from '../data/db.js';
import type { Question } from '../types/index.js';

const router = Router();

// List question bank
router.get('/', (req, res) => {
  const { topic, difficulty, search } = req.query;
  let questions = [...db.get().questionBank];

  if (topic && topic !== 'all') {
    questions = questions.filter(q => q.topic === topic);
  }
  if (difficulty && difficulty !== 'all') {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  if (search) {
    const q = String(search).toLowerCase();
    questions = questions.filter(
      item => item.text.toLowerCase().includes(q) || item.topic?.toLowerCase().includes(q)
    );
  }

  return res.json({ count: questions.length, questions });
});

// Add question
router.post('/', (req, res) => {
  try {
    const { text, options, correctAnswer, explanation, topic, difficulty, phoneticAudioText } = req.body;
    if (!text || !Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ error: 'Text and exactly 4 options are required' });
    }

    const newQuestion: Question = {
      id: `qb-${Date.now()}`,
      text: String(text).trim(),
      options: options as [string, string, string, string],
      correctAnswer: Number(correctAnswer) || 0,
      explanation: String(explanation || ''),
      topic: topic || 'General',
      difficulty: difficulty || 'Medium',
      phoneticAudioText: phoneticAudioText || text,
      approved: true,
    };

    db.update(data => {
      data.questionBank.unshift(newQuestion);
    });

    return res.status(201).json({ success: true, question: newQuestion });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add question' });
  }
});

// Bulk import questions
router.post('/bulk', (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Array of questions required' });
    }

    const created: Question[] = questions.map(q => ({
      id: `qb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: String(q.text || '').trim(),
      options: (q.options || ['', '', '', '']) as [string, string, string, string],
      correctAnswer: Number(q.correctAnswer) || 0,
      explanation: String(q.explanation || ''),
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'Medium',
      phoneticAudioText: q.phoneticAudioText || q.text,
      approved: true,
    }));

    db.update(data => {
      data.questionBank.unshift(...created);
    });

    return res.status(201).json({ success: true, count: created.length, questions: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Bulk import failed' });
  }
});

// Delete question
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = db.get().questionBank.length;

  db.update(data => {
    data.questionBank = data.questionBank.filter(q => q.id !== id);
  });

  if (db.get().questionBank.length === initialLen) {
    return res.status(404).json({ error: 'Question not found' });
  }

  return res.json({ success: true, message: 'Question removed successfully' });
});

export default router;
