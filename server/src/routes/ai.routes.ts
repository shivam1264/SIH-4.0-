import { Router } from 'express';
import type { Question } from '../types/index.js';

const router = Router();

// Domain question generator templates
const TEMPLATES: Record<string, { q: string; opts: [string, string, string, string]; correct: number; exp: string }[]> = {
  Polity: [
    {
      q: 'Under the Constitution of India, which writ is issued by courts to enforce the performance of a public duty?',
      opts: ['Habeas Corpus', 'Mandamus', 'Quo-Warranto', 'Certiorari'],
      correct: 1,
      exp: 'Mandamus is a judicial command issued to any constitutional, statutory or non-statutory authority to perform a public duty.',
    },
    {
      q: 'Who presides over a joint sitting of both Houses of Parliament under Article 108?',
      opts: ['The President of India', 'The Vice-President of India', 'The Speaker of Lok Sabha', 'The Chief Justice of India'],
      correct: 2,
      exp: 'Under Article 118(4), the Speaker of Lok Sabha presides over a joint sitting.',
    },
    {
      q: 'Which constitutional amendment lowered the voting age in India from 21 to 18 years?',
      opts: ['42nd Amendment Act', '44th Amendment Act', '61st Amendment Act', '73rd Amendment Act'],
      correct: 2,
      exp: 'The 61st Constitutional Amendment Act 1988 amended Article 326 to reduce the voting age from 21 to 18 years.',
    },
  ],
  Economy: [
    {
      q: 'Which index is primarily used by the Reserve Bank of India to measure headline retail inflation?',
      opts: ['Wholesale Price Index (WPI)', 'Consumer Price Index Combined (CPI-C)', 'Index of Industrial Production (IIP)', 'Gross Domestic Product Deflator'],
      correct: 1,
      exp: 'The RBI adopted CPI Combined as the key metric for monetary policy based on the Urjit Patel Committee recommendations.',
    },
    {
      q: 'What is the statutory minimum Cash Reserve Ratio (CRR) required to be maintained by scheduled commercial banks?',
      opts: ['Fixed by RBI Monetary Policy Committee', 'Always 10%', 'Fixed at 0% by Parliament', 'Determined by World Bank'],
      correct: 0,
      exp: 'CRR is the share of Net Demand and Time Liabilities (NDTL) that banks must keep with the RBI as cash balance, decided periodically by the MPC.',
    },
  ],
  Environment: [
    {
      q: 'The Ramsar Convention is an international treaty dedicated to the conservation and sustainable use of which ecosystem?',
      opts: ['Tropical Rainforests', 'Coral Reefs', 'Wetlands', 'Glacial Permafrost'],
      correct: 2,
      exp: 'Signed in Ramsar, Iran in 1971, this intergovernmental treaty specifically protects wetlands of international ecological significance.',
    },
  ],
  Science: [
    {
      q: 'What is the standard frequency range of human audible sound waves?',
      opts: ['20 Hz to 20,000 Hz', '200 Hz to 2,000 Hz', '2 Hz to 20 Hz', '20 kHz to 200 kHz'],
      correct: 0,
      exp: 'Human hearing normally ranges from 20 Hertz to 20,000 Hertz (20 kHz). Infrasound is below 20Hz and ultrasound is above 20kHz.',
    },
    {
      q: 'Which organelle in eukaryotic cells is primarily responsible for ATP generation through cellular respiration?',
      opts: ['Ribosome', 'Mitochondria', 'Endoplasmic Reticulum', 'Golgi Apparatus'],
      correct: 1,
      exp: 'Mitochondria produce cellular energy through oxidative phosphorylation and the Krebs cycle, earning them the title of the powerhouse of the cell.',
    },
  ],
  History: [
    {
      q: 'Who founded the Brahmo Samaj in 1828 to propagate monotheism and eradicate social evils like Sati?',
      opts: ['Swami Vivekananda', 'Raja Ram Mohan Roy', 'Ishwar Chandra Vidyasagar', 'Dayananda Saraswati'],
      correct: 1,
      exp: 'Raja Ram Mohan Roy founded the Brahmo Sabha (later Brahmo Samaj) in Calcutta in 1828 and was pivotal in the abolition of Sati in 1829.',
    },
  ],
  Math: [
    {
      q: 'If the price of a commodity increases by 25%, by what percentage must consumption be reduced so that total expenditure remains unchanged?',
      opts: ['20%', '25%', '15%', '16.67%'],
      correct: 0,
      exp: 'Reduction percentage = [R / (100 + R)] * 100 = [25 / 125] * 100 = 20%.',
    },
    {
      q: 'A trader sells an article for ₹840 at a gain of 20%. What was the cost price of the article?',
      opts: ['₹680', '₹700', '₹720', '₹750'],
      correct: 1,
      exp: 'Cost Price = Selling Price / 1.20 = 840 / 1.20 = ₹700.',
    },
  ],
  Reasoning: [
    {
      q: 'Statements: All books are papers. Some papers are notebooks. Which conclusion definitely follows?',
      opts: ['Some notebooks are books', 'Some papers are books', 'All notebooks are books', 'No paper is a book'],
      correct: 1,
      exp: 'Since All books are papers, the converse "Some papers are books" is directly and unconditionally true.',
    },
  ],
  Accessibility: [
    {
      q: 'Under the Rights of Persons with Disabilities (RPwD) Act 2016, how much compensatory extra time is mandated for benchmark disability candidates?',
      opts: ['10 minutes per hour', '15 minutes per hour', 'Not less than 20 minutes per hour', '30 minutes total for whole test'],
      correct: 2,
      exp: 'Ministry of Social Justice & Empowerment guidelines mandate a minimum of 20 minutes compensatory extra time per hour of examination.',
    },
  ],
};

// ── GEMINI API GENERATOR ──────────────────────────────────────────────
async function generateWithGemini(
  apiKey: string,
  topic: string,
  difficulty: string,
  count: number,
  focusArea?: string
): Promise<Question[] | null> {
  const prompt = `You are an expert exam author for Indian competitive exams (UPSC, SSC, Banking, Railway, RPwD).
Generate ${count} high quality, accurate multiple choice questions on the topic: "${topic}"${focusArea ? ` with special focus on: "${focusArea}"` : ''}.
Difficulty level: ${difficulty}.
Ensure questions are clear, accessible for visually impaired candidates listening via screen reader, and unambiguous.

Return ONLY a valid JSON array of objects with exactly this structure:
[
  {
    "text": "Full question statement here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 0,
    "explanation": "Clear explanation of why this answer is correct."
  }
]
correctAnswer must be a zero-based integer index (0 for Option A, 1 for Option B, 2 for Option C, 3 for Option D).
Do not include any Markdown formatting, backticks, or text outside the JSON array.`;

  const models = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.7-flash'];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Gemini API] Model ${model} failed status ${response.status}: ${errText}`);
        continue;
      }

      const data: any = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        console.warn(`[Gemini API] Empty candidate text from ${model}`);
        continue;
      }

      let parsed: any[];
      try {
        parsed = JSON.parse(candidateText.trim());
      } catch {
        const cleaned = candidateText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        continue;
      }

      const questions: Question[] = parsed.map((item, idx) => {
        const qText = String(item.text || `Question on ${topic}`);
        const opts: [string, string, string, string] = [
          String(item.options?.[0] || 'Option A'),
          String(item.options?.[1] || 'Option B'),
          String(item.options?.[2] || 'Option C'),
          String(item.options?.[3] || 'Option D'),
        ];
        const correct = typeof item.correctAnswer === 'number' && item.correctAnswer >= 0 && item.correctAnswer <= 3
          ? item.correctAnswer
          : 0;

        return {
          id: `ai-gemini-${Date.now()}-${idx + 1}`,
          text: qText,
          options: opts,
          correctAnswer: correct,
          explanation: String(item.explanation || 'Refer standard study material.'),
          topic: String(topic),
          difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
          phoneticAudioText: `${qText}. Option A: ${opts[0]}. Option B: ${opts[1]}. Option C: ${opts[2]}. Option D: ${opts[3]}.`,
          approved: false,
        };
      });

      return questions;
    } catch (error: any) {
      console.warn(`[Gemini API] Exception during generation with model ${model}:`, error.message);
    }
  }
  return null;
}

// Check AI status
router.get('/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
  return res.json({
    geminiConfigured: hasKey,
    model: 'gemini-flash-latest',
    mode: hasKey ? 'live-gemini-ai' : 'domain-template-engine',
  });
});

router.post('/generate-questions', async (req, res) => {
  try {
    const { topic = 'General Studies', difficulty = 'Medium', count = 3, focusArea } = req.body;
    const num = Math.min(25, Math.max(1, Number(count) || 3));

    // Try Google Gemini Live AI if GEMINI_API_KEY is available
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey && geminiKey.length > 5) {
      console.log(`[AI] Generating ${num} questions on "${topic}" using Google Gemini Live API...`);
      const geminiQuestions = await generateWithGemini(geminiKey, String(topic), String(difficulty), num, focusArea);
      if (geminiQuestions && geminiQuestions.length > 0) {
        console.log(`[AI] Successfully generated ${geminiQuestions.length} live questions via Gemini!`);
        return res.json({
          success: true,
          source: 'gemini-flash-latest',
          count: geminiQuestions.length,
          topic,
          difficulty,
          questions: geminiQuestions,
        });
      }
      console.warn('[AI] Gemini generation returned empty/null, falling back to domain templates.');
    }

    // Fallback to domain templates
    const tLower = String(topic).toLowerCase();
    let categoryKey = 'Polity';
    if (tLower.includes('math') || tLower.includes('percent') || tLower.includes('profit') || tLower.includes('arithmetic') || tLower.includes('quant')) {
      categoryKey = 'Math';
    } else if (tLower.includes('reason') || tLower.includes('logic') || tLower.includes('syllogism')) {
      categoryKey = 'Reasoning';
    } else if (tLower.includes('econ') || tLower.includes('bank') || tLower.includes('inflation') || tLower.includes('gdp') || tLower.includes('rbi')) {
      categoryKey = 'Economy';
    } else if (tLower.includes('sci') || tLower.includes('sound') || tLower.includes('bio') || tLower.includes('cell') || tLower.includes('physics')) {
      categoryKey = 'Science';
    } else if (tLower.includes('hist') || tLower.includes('freedom') || tLower.includes('samaj') || tLower.includes('revolt') || tLower.includes('mughal')) {
      categoryKey = 'History';
    } else if (tLower.includes('disab') || tLower.includes('pwd') || tLower.includes('access') || tLower.includes('blind') || tLower.includes('act')) {
      categoryKey = 'Accessibility';
    } else if (tLower.includes('env') || tLower.includes('ramsar') || tLower.includes('forest') || tLower.includes('climate')) {
      categoryKey = 'Environment';
    } else {
      categoryKey = Object.keys(TEMPLATES).find(k => tLower.includes(k.toLowerCase())) || 'Polity';
    }
    const pool = TEMPLATES[categoryKey] || TEMPLATES.Polity;

    const generated: Question[] = [];
    for (let i = 0; i < num; i++) {
      const base = pool[i % pool.length];
      const qId = `ai-gen-${Date.now()}-${i + 1}`;
      const questionText = focusArea ? `[Focus: ${focusArea}] ${base.q}` : base.q;

      generated.push({
        id: qId,
        text: questionText,
        options: [...base.opts] as [string, string, string, string],
        correctAnswer: base.correct,
        explanation: base.exp,
        topic: String(topic),
        difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
        phoneticAudioText: `${questionText}. Option A: ${base.opts[0]}. Option B: ${base.opts[1]}. Option C: ${base.opts[2]}. Option D: ${base.opts[3]}.`,
        approved: false,
      });
    }

    return res.json({
      success: true,
      source: 'domain-templates',
      count: generated.length,
      topic,
      difficulty,
      questions: generated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI Generation failed' });
  }
});

export default router;
