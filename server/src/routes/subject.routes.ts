import { Router } from 'express';
import { db } from '../data/db.js';
import type { CurriculumSubject } from '../types/index.js';

const router = Router();

// List subjects
router.get('/', (req, res) => {
  return res.json({ subjects: db.get().subjects });
});

// Add subject
router.post('/', (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and Code are required' });
    }

    const newSub: CurriculumSubject = {
      id: `sub-${Date.now()}`,
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      totalQuestions: 0,
      topics: [],
    };

    db.update(data => {
      data.subjects.push(newSub);
    });

    return res.status(201).json({ success: true, subject: newSub });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add subject' });
  }
});

// Add topic to subject
router.post('/:id/topics', (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Topic name is required' });
    }

    const sub = db.get().subjects.find(s => s.id === id);
    if (!sub) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const newTopic = {
      id: `top-${Date.now()}`,
      name: String(name).trim(),
      questionsCount: 0,
    };

    db.update(data => {
      const subject = data.subjects.find(s => s.id === id);
      if (subject) {
        subject.topics.push(newTopic);
      }
    });

    return res.status(201).json({ success: true, topic: newTopic });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add topic' });
  }
});

export default router;
