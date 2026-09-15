import { Router } from 'express';
import { db } from '../data/db.js';
import type { PYQPaper } from '../types/index.js';

const router = Router();

// List all PYQs with filters
router.get('/', (req, res) => {
  const { category, year, examName, search } = req.query;
  let items = [...(db.get().pyqs || [])];

  if (category && category !== 'All') {
    items = items.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (year && year !== 'All') {
    items = items.filter(p => p.year === Number(year));
  }

  if (examName && examName !== 'All') {
    items = items.filter(p => p.examName.toLowerCase().includes(String(examName).toLowerCase()));
  }

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.examName.toLowerCase().includes(q) ||
      (p.topicsCovered && p.topicsCovered.some(t => t.toLowerCase().includes(q)))
    );
  }

  return res.json({ count: items.length, pyqs: items });
});

// Single PYQ
router.get('/:id', (req, res) => {
  const item = (db.get().pyqs || []).find(p => p.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'PYQ paper not found' });
  }
  return res.json({ pyq: item });
});

// Create PYQ (Admin)
router.post('/', (req, res) => {
  const {
    title,
    examName,
    year = new Date().getFullYear(),
    shift = 'Shift 1',
    category = 'SSC',
    totalQuestions = 25,
    durationMinutes = 30,
    linkedExamId,
    pdfUrl,
    audioSummaryText,
    topicsCovered = [],
    difficulty = 'Medium',
  } = req.body;

  if (!title || !examName) {
    return res.status(400).json({ error: 'Title and exam name are required' });
  }

  const newPyq: PYQPaper = {
    id: `pyq-${Date.now()}`,
    title,
    examName,
    year: Number(year) || new Date().getFullYear(),
    shift,
    category,
    totalQuestions: Number(totalQuestions) || 25,
    durationMinutes: Number(durationMinutes) || 30,
    linkedExamId: linkedExamId || 'ssc-reasoning-01',
    pdfUrl: pdfUrl || '#',
    audioSummaryText: audioSummaryText || `${examName} ${year} ${shift} previous year question paper with ${totalQuestions} questions.`,
    topicsCovered: Array.isArray(topicsCovered) && topicsCovered.length ? topicsCovered : ['General Intelligence', 'General Awareness'],
    difficulty,
    createdAt: new Date().toISOString().split('T')[0],
  };

  db.update(data => {
    if (!data.pyqs) data.pyqs = [];
    data.pyqs.unshift(newPyq);
  });

  return res.status(201).json({
    success: true,
    message: 'Previous year paper created successfully',
    pyq: newPyq,
  });
});

// Delete PYQ (Admin)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const initialCount = (db.get().pyqs || []).length;

  db.update(data => {
    data.pyqs = (data.pyqs || []).filter(p => p.id !== id);
  });

  if ((db.get().pyqs || []).length === initialCount) {
    return res.status(404).json({ error: 'PYQ paper not found' });
  }

  return res.json({ success: true, message: 'PYQ paper deleted' });
});

export default router;
