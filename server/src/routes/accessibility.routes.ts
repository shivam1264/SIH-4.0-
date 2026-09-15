import { Router } from 'express';
import { db } from '../data/db.js';
import type { PronunciationRule } from '../types/index.js';

const router = Router();

router.get('/rules', (req, res) => {
  return res.json({ rules: db.get().pronunciationRules });
});

router.post('/rules', (req, res) => {
  try {
    const { token, spokenAs, category } = req.body;
    if (!token || !spokenAs) {
      return res.status(400).json({ error: 'Token and spokenAs are required' });
    }

    const newRule: PronunciationRule = {
      id: `pr-${Date.now()}`,
      token: String(token).trim(),
      spokenAs: String(spokenAs).trim(),
      category: category || 'Math Symbol',
    };

    db.update(data => {
      data.pronunciationRules.push(newRule);
    });

    return res.status(201).json({ success: true, rule: newRule });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add rule' });
  }
});

router.delete('/rules/:id', (req, res) => {
  const { id } = req.params;
  db.update(data => {
    data.pronunciationRules = data.pronunciationRules.filter(r => r.id !== id);
  });
  return res.json({ success: true, message: 'Pronunciation rule removed' });
});

export default router;
