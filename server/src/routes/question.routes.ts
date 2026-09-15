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

    const created: Question[] = questions.map((q: any) => {
      // Handle options as array of strings, or array of objects, or separate optA..optD fields
      let opts: [string, string, string, string] = ['', '', '', ''];
      if (Array.isArray(q.options)) {
        opts = [
          typeof q.options[0] === 'object' ? q.options[0]?.text || '' : String(q.options[0] || ''),
          typeof q.options[1] === 'object' ? q.options[1]?.text || '' : String(q.options[1] || ''),
          typeof q.options[2] === 'object' ? q.options[2]?.text || '' : String(q.options[2] || ''),
          typeof q.options[3] === 'object' ? q.options[3]?.text || '' : String(q.options[3] || ''),
        ];
      } else if (q.optA || q.optionA) {
        opts = [
          String(q.optA || q.optionA || ''),
          String(q.optB || q.optionB || ''),
          String(q.optC || q.optionC || ''),
          String(q.optD || q.optionD || ''),
        ];
      }

      // Handle correct answer as 0..3 index, or 'A'..'D', or 1..4
      let correct = 0;
      const rawAns = q.correctAnswer ?? q.correct ?? q.answer ?? q.ans;
      if (typeof rawAns === 'string') {
        const letter = rawAns.trim().toUpperCase();
        if (letter === 'A' || letter === '0' || letter === '1') correct = 0;
        else if (letter === 'B' || letter === '2') correct = 1;
        else if (letter === 'C' || letter === '3') correct = 2;
        else if (letter === 'D' || letter === '4') correct = 3;
        else {
          const matchIdx = opts.findIndex(o => o.toLowerCase() === rawAns.trim().toLowerCase());
          if (matchIdx >= 0) correct = matchIdx;
        }
      } else if (typeof rawAns === 'number') {
        correct = rawAns >= 1 && rawAns <= 4 ? rawAns - 1 : Math.max(0, Math.min(3, rawAns));
      }

      const qText = String(q.text || q.q || q.question || '').trim();
      const phonetic = q.phoneticAudioText || q.phoneticAudioPreview || q.phoneticText ||
        `Question: ${qText}. Option A: ${opts[0]}. Option B: ${opts[1]}. Option C: ${opts[2]}. Option D: ${opts[3]}. Correct is Option ${String.fromCharCode(65 + correct)}.`;

      return {
        id: `qb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text: qText,
        options: opts,
        correctAnswer: correct,
        explanation: String(q.explanation || q.solution || 'Standard curriculum explanation.'),
        topic: q.topic || q.subject || 'General',
        difficulty: (['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium') as 'Easy' | 'Medium' | 'Hard',
        phoneticAudioText: phonetic,
        approved: true,
      };
    });

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
