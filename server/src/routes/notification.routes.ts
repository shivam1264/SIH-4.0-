import { Router } from 'express';
import { db } from '../data/db.js';
import type { AdminAnnouncement } from '../types/index.js';

const router = Router();

router.get('/', (req, res) => {
  return res.json({ announcements: db.get().announcements });
});

router.post('/', (req, res) => {
  try {
    const { title, message, targetTier, priority } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const newAnn: AdminAnnouncement = {
      id: `ann-${Date.now()}`,
      title: String(title).trim(),
      message: String(message).trim(),
      date: new Date().toISOString().split('T')[0],
      targetTier: targetTier || 'All',
      priority: priority || 'Normal',
    };

    db.update(data => {
      data.announcements.unshift(newAnn);
    });

    return res.status(201).json({ success: true, announcement: newAnn });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to post announcement' });
  }
});

export default router;
