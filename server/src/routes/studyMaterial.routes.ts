import { Router } from 'express';
import { db } from '../data/db.js';
import type { StudyMaterial } from '../types/index.js';

const router = Router();

// List all study materials with search & subject filter
router.get('/', (req, res) => {
  const { subject, category, search } = req.query;
  let items = [...(db.get().studyMaterials || [])];

  if (subject && subject !== 'All') {
    items = items.filter(m => m.subject.toLowerCase() === String(subject).toLowerCase());
  }

  if (category && category !== 'All') {
    items = items.filter(m => m.category.toLowerCase().includes(String(category).toLowerCase()));
  }

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  return res.json({ count: items.length, studyMaterials: items });
});

// Single study material
router.get('/:id', (req, res) => {
  const item = (db.get().studyMaterials || []).find(m => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Study material not found' });
  }
  return res.json({ studyMaterial: item });
});

// Create study material (Admin)
router.post('/', (req, res) => {
  const {
    title,
    subject = 'General Awareness',
    category = 'General Study',
    readTimeMinutes = 8,
    summary,
    content,
    keyPoints = [],
    audioNarrationText,
    downloadUrl,
    fileSize,
    author = 'Exam Content Cell',
    tags = [],
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const newMaterial: StudyMaterial = {
    id: `sm-${Date.now()}`,
    title,
    subject,
    category,
    readTimeMinutes: Number(readTimeMinutes) || 8,
    summary: summary || title,
    content,
    keyPoints: Array.isArray(keyPoints) && keyPoints.length ? keyPoints : [summary || title],
    audioNarrationText: audioNarrationText || summary || title,
    downloadUrl: downloadUrl || '#',
    fileSize: fileSize || '350 KB',
    createdAt: new Date().toISOString().split('T')[0],
    author,
    tags: Array.isArray(tags) ? tags : [subject, category],
  };

  db.update(data => {
    if (!data.studyMaterials) data.studyMaterials = [];
    data.studyMaterials.unshift(newMaterial);
  });

  return res.status(201).json({
    success: true,
    message: 'Study material created successfully',
    studyMaterial: newMaterial,
  });
});

// Delete study material (Admin)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const initialCount = (db.get().studyMaterials || []).length;

  db.update(data => {
    data.studyMaterials = (data.studyMaterials || []).filter(m => m.id !== id);
  });

  if ((db.get().studyMaterials || []).length === initialCount) {
    return res.status(404).json({ error: 'Study material not found' });
  }

  return res.json({ success: true, message: 'Study material deleted' });
});

export default router;
