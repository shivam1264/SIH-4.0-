import { Router } from 'express';
import { db } from '../data/db.js';
import type { AdminStudent } from '../types/index.js';

const router = Router();

// Get all candidates with optional filter
router.get('/', (req, res) => {
  const { search, tier, status } = req.query;
  let students = [...db.get().students];

  if (tier && tier !== 'all') {
    students = students.filter(s => s.impairmentTier === tier);
  }
  if (status && status !== 'all') {
    students = students.filter(s => s.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    students = students.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }

  return res.json({ count: students.length, students });
});

// Get single candidate
router.get('/:id', (req, res) => {
  const student = db.get().students.find(s => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Candidate not found' });
  }
  return res.json({ student });
});

// Create candidate
router.post('/', (req, res) => {
  try {
    const { name, email, rollNo, impairmentTier, accommodations } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const newStudent: AdminStudent = {
      id: `std_${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      rollNo: rollNo || `PWD-2026-${Math.floor(100 + Math.random() * 900)}`,
      impairmentTier: impairmentTier || 'low-vision',
      accommodations: accommodations || {
        extraTimeMinutes: 30,
        speechRate: 1.0,
        preferredTheme: 'default',
        highContrast: false,
        assignedScribe: false,
      },
      examsAssigned: 0,
      examsCompleted: 0,
      avgScore: 0,
      status: 'Active',
      registeredAt: new Date().toISOString().split('T')[0],
    };

    db.update(data => {
      data.students.unshift(newStudent);
    });

    return res.status(201).json({ success: true, student: newStudent });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create candidate' });
  }
});

// Update candidate
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const index = db.get().students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  db.update(data => {
    data.students[index] = {
      ...data.students[index],
      ...req.body,
    };
  });

  return res.json({ success: true, student: db.get().students[index] });
});

// Delete candidate
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = db.get().students.length;

  db.update(data => {
    data.students = data.students.filter(s => s.id !== id);
  });

  if (db.get().students.length === initialLen) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  return res.json({ success: true, message: 'Candidate removed successfully' });
});

export default router;
