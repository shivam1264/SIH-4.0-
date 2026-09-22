// ── Real-World AI Natural Language Understanding (NLU) Service for Drishti ──
// Employs Cloud LLM Semantic Parsing to understand natural human speech, colloquialisms,
// Hindi/Hinglish phrasing, implied meanings, and emotional/accessibility needs.
// Integrates seamless 2-tier fallback to deterministic classifier when offline.

import { VoiceIntent, VoiceContext, classifyVoiceIntent } from './voiceCommandClassifier';
import { groqVoiceService } from './groqVoiceService';

export interface DrishtiNluResult extends VoiceIntent {
  source: 'ai-nlu' | 'local-heuristic';
  reasoning?: string;
  latencyMs?: number;
}

const GROQ_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const NLU_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-120b',
];
const TIMEOUT_MS = 2200; // Cap to ensure responsive voice UI

class DrishtiNluService {
  private _enabled = true;
  private _cache = new Map<string, DrishtiNluResult>();

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('DRISHTI_AI_NLU_ENABLED');
      this._enabled = stored !== 'false';
    }
  }

  public isEnabled(): boolean {
    return this._enabled;
  }

  public setEnabled(val: boolean) {
    this._enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('DRISHTI_AI_NLU_ENABLED', val ? 'true' : 'false');
    }
  }

  public isAvailable(): boolean {
    return groqVoiceService.isAvailable();
  }

  /**
   * Understands natural language speech using Real-World AI NLU with automatic offline fallback.
   */
  public async understand(
    rawText: string,
    context?: VoiceContext
  ): Promise<DrishtiNluResult> {
    const text = rawText?.trim();
    if (!text) {
      return {
        ...classifyVoiceIntent('', context),
        source: 'local-heuristic',
      };
    }

    // Check fast in-memory cache for repeated exact commands
    const cacheKey = `${text.toLowerCase()}|${context?.route || ''}|${context?.examState || ''}|${context?.currentQuestionIndex ?? ''}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)!;
    }

    // 1. FAST DETERMINISTIC BYPASS FOR KNOWN EXAM & SYSTEM COMMANDS
    // Prevents sending standard commands across the network to LLMs (eliminates 429 errors & latency)
    const deterministic = classifyVoiceIntent(text, context);
    const deterministicActions = new Set([
      'NEXT_QUESTION', 'PREV_QUESTION', 'SELECT_OPTION', 'CHANGE_ANSWER',
      'CLEAR_ANSWER', 'FLAG_QUESTION', 'READ_QUESTION', 'REPEAT_QUESTION',
      'REPEAT_LAST', 'READ_OPTIONS', 'TIME_REMAINING', 'EXAM_STATUS',
      'UNANSWERED_COUNT', 'GOTO_QUESTION', 'START_EXAM', 'INITIATE_SUBMIT',
      'CONFIRM_SUBMIT', 'CANCEL_SUBMIT', 'THEME_LIGHT', 'THEME_DARK',
      'THEME_CONTRAST', 'THEME_YELLOW', 'FONT_NORMAL', 'FONT_LARGE',
      'FONT_XLARGE', 'FONT_HUGE', 'VOICE_FASTER', 'VOICE_SLOWER',
      'OPEN_DASHBOARD', 'OPEN_MOCK_TESTS', 'OPEN_PRACTICE', 'OPEN_RESULTS',
      'OPEN_PERFORMANCE', 'OPEN_PROFILE', 'OPEN_SETTINGS', 'OPEN_STUDY_MATERIALS',
      'OPEN_PYQS', 'OPEN_EXAM_HISTORY', 'OPEN_NOTIFICATIONS', 'READ_NOTIFICATIONS', 'CLOSE_NOTIFICATIONS', 'NAVIGATE_BACK',
      'STOP_SPEAKING', 'STOP_VOICE', 'DRISHTI_WAKE', 'DRISHTI_INTRO', 'HELP',
      'SCROLL_DOWN', 'SCROLL_UP', 'SCROLL_TOP', 'SCROLL_BOTTOM',
      'AUTO_SCROLL_START', 'AUTO_SCROLL_STOP', 'AUTO_SCROLL_FASTER', 'AUTO_SCROLL_SLOWER',
      'SCROLL_TO_SECTION', 'EXPLAIN_PAGE'
    ]);

    if (deterministic.confidence >= 0.90 && deterministicActions.has(deterministic.type)) {
      const res: DrishtiNluResult = {
        ...deterministic,
        source: 'local-heuristic',
        latencyMs: 0,
      };
      this._cache.set(cacheKey, res);
      return res;
    }

    // If AI NLU is disabled or offline, use deterministic classifier
    if (!this._enabled || !groqVoiceService.isAvailable()) {
      const heuristic = classifyVoiceIntent(text, context);
      const res: DrishtiNluResult = { ...heuristic, source: 'local-heuristic' };
      this._cache.set(cacheKey, res);
      return res;
    }

    const startTime = Date.now();


    try {
      const aiResult = await this._callAiNlu(text, context);
      if (aiResult) {
        aiResult.latencyMs = Date.now() - startTime;
        this._cache.set(cacheKey, aiResult);
        return aiResult;
      }
    } catch (err) {
      console.warn('[DrishtiNLU] AI NLU request error or timeout, falling back to local heuristic:', err);
    }

    // Fallback to local heuristic classifier
    const fallback = classifyVoiceIntent(text, context);
    const result: DrishtiNluResult = {
      ...fallback,
      source: 'local-heuristic',
      latencyMs: Date.now() - startTime,
    };
    this._cache.set(cacheKey, result);
    return result;
  }

  private async _callAiNlu(
    text: string,
    context?: VoiceContext
  ): Promise<DrishtiNluResult | null> {
    const apiKey = groqVoiceService.getApiKey();
    if (!apiKey) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const systemPrompt = `You are 'Drishti', a real-world conversational AI voice accessibility assistant for candidates with visual or motor disabilities taking competitive exams.
Analyze the candidate's natural speech utterance (including colloquial expressions, emotional context, physical accessibility needs, Hindi/Hinglish slang, and indirect intent) in the given application context, and determine their intended action.

Context:
- Current Route: ${context?.route || '/'}
- Exam State: ${context?.examState || 'none'}
- Current Question Index: ${context?.currentQuestionIndex ?? 'none'}
- Total Questions: ${context?.totalQuestions ?? 'none'}
- Current Answer: ${context?.currentAnswer || 'none'}
- Active Page: ${context?.activePage || 'App'}

Available Intent Types:
- START_EXAM: Candidate wants to begin/start/launch their test or exam.
- OPEN_MOCK_TESTS: Candidate wants to see/browse/open the exam catalog without auto-starting.
- OPEN_DASHBOARD: Candidate wants to go home, main page, or dashboard.
- OPEN_PRACTICE: Candidate wants practice drills or question bank.
- OPEN_RESULTS: Candidate wants their scorecard, marks, or past results.
- OPEN_PERFORMANCE: Candidate wants analytics, accuracy matrix, or diagnostic report.
- OPEN_PROFILE: Candidate wants candidate profile or personal info.
- OPEN_SETTINGS: Candidate wants accessibility settings or preferences.
- OPEN_STUDY_MATERIALS: Candidate wants study notes, books, or materials.
- OPEN_PYQS: Candidate wants past year question papers.
- OPEN_EXAM_HISTORY: Candidate wants past attempt logs or history.
- OPEN_NOTIFICATIONS: Candidate wants to check, read, or listen to notifications/announcements.
- NAVIGATE_BACK: Candidate wants to go back to the previous screen.
- LOGOUT: Candidate wants to log out of the platform.
- NEXT_QUESTION: Candidate wants to advance to the next question.
- PREV_QUESTION: Candidate wants to go back to the previous question.
- SELECT_OPTION: Candidate wants to choose an option (targetOption: 'A' | 'B' | 'C' | 'D').
- CHANGE_ANSWER: Candidate wants to change or correct their previous answer to a new option.
- CLEAR_ANSWER: Candidate wants to erase, remove, or clear their current answer.
- FLAG_QUESTION: Candidate wants to mark or flag for review.
- READ_QUESTION: Candidate wants the question read aloud or repeated.
- READ_OPTIONS: Candidate wants only the 4 options read aloud.
- TIME_REMAINING: Candidate wants to know remaining time or clock.
- EXAM_STATUS: Candidate wants to know current question progress/number.
- UNANSWERED_COUNT: Candidate wants to know how many questions are left unanswered.
- VERBALIZE_MATH: Candidate wants the math equation/formula explained or read phonetically.
- DESCRIBE_DIAGRAM: Candidate wants visual charts, graphs, or images described.
- EXPLAIN_QUESTION: Candidate wants AI to simplify or explain the question concept.
- INITIATE_SUBMIT: Candidate wants to finish, hand in, or submit their test.
- CONFIRM_SUBMIT: In submit dialog, candidate confirms submission (yes/confirm).
- CANCEL_SUBMIT: In submit dialog, candidate cancels submission (no/continue/resume).
- THEME_YELLOW: Dark or black background with bright yellow text/letters (often requested for severe eye strain, photophobia, low vision).
- THEME_CONTRAST: Standard black and white high contrast mode.
- THEME_DARK: Standard dark theme/mode.
- THEME_LIGHT: Standard light theme/mode.
- FONT_HUGE, FONT_LARGE, FONT_NORMAL: Text scaling adjustments.
- VOICE_FASTER, VOICE_SLOWER: Voice speed tuning.
- SCROLL_DOWN: Candidate wants to scroll down the page.
- SCROLL_UP: Candidate wants to scroll up the page.
- SCROLL_TOP: Candidate wants to jump/scroll to top of page.
- SCROLL_BOTTOM: Candidate wants to jump/scroll to bottom of page.
- AUTO_SCROLL_START: Candidate wants hands-free continuous auto-scrolling to start.
- AUTO_SCROLL_STOP: Candidate wants auto-scrolling or scrolling to stop.
- AUTO_SCROLL_FASTER: Candidate wants scroll speed increased.
- AUTO_SCROLL_SLOWER: Candidate wants scroll speed decreased.
- SCROLL_TO_SECTION: Candidate wants to jump to section (targetSection: "options" | "question" | "submit" | "instructions" | "overview").
- CLICK_ELEMENT: Candidate wants to click or press a specific button/link (targetElement: "<label or button text>").
- FOCUS_NEXT: Candidate wants to focus next interactive element.
- FOCUS_PREV: Candidate wants to focus previous interactive element.
- STOP_SPEAKING: Candidate wants Drishti to silence or shut up immediately.
- STOP_VOICE: Candidate wants to mute the microphone.
- DRISHTI_WAKE: Candidate just said "Drishti" or "Hey Drishti" to get attention.
- DRISHTI_INTRO: Candidate asks who Drishti is or what she can do.
- HELP: Candidate asks for guidance or instructions.
- UNRECOGNIZED: Utterance cannot be understood or is irrelevant.

Return JSON ONLY with this exact structure:
{
  "type": "<IntentType>",
  "targetOption": "A" | "B" | "C" | "D" | null,
  "targetSection": "options" | "question" | "submit" | "instructions" | "overview" | null,
  "targetElement": string | null,
  "speechFeedback": "<Empathetic, clear, concise voice response spoken back to candidate>",
  "confidence": number,
  "reasoning": "<Short explanation>"
}`;

      const modelsToTry = NLU_MODELS;
      let content: string | null = null;

      for (const model of modelsToTry) {
        const modelController = new AbortController();
        const modelTimeoutId = setTimeout(() => modelController.abort(), 2400);

        try {
          const response = await fetch(GROQ_COMPLETIONS_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              temperature: 0.1,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text },
              ],
              response_format: { type: 'json_object' },
            }),
            signal: modelController.signal,
          });

          clearTimeout(modelTimeoutId);

          if (response.ok) {
            const data = await response.json();
            content = data.choices?.[0]?.message?.content;
            if (content) break;
          } else {
            console.warn(`[DrishtiNLU] Model ${model} returned status ${response.status}`);
          }
        } catch (mErr) {
          clearTimeout(modelTimeoutId);
          console.warn(`[DrishtiNLU] Error with model ${model}:`, mErr);
        }
      }

      if (!content) return null;

      const parsed = JSON.parse(content);
      if (!parsed.type || parsed.type === 'UNRECOGNIZED') {
        return null;
      }

      // Action code derivation
      let action = parsed.type;
      if (parsed.type === 'SELECT_OPTION' && parsed.targetOption) {
        action = `SELECT_${parsed.targetOption}`;
      } else if (parsed.type === 'CHANGE_ANSWER' && parsed.targetOption) {
        action = `SELECT_${parsed.targetOption}`;
      } else if (parsed.type === 'NEXT_QUESTION') {
        action = 'NEXT';
      } else if (parsed.type === 'PREV_QUESTION') {
        action = 'PREV';
      } else if (parsed.type === 'INITIATE_SUBMIT') {
        action = 'SUBMIT';
      } else if (parsed.type === 'CONFIRM_SUBMIT') {
        action = 'CONFIRM_YES';
      } else if (parsed.type === 'CANCEL_SUBMIT') {
        action = 'CANCEL_NO';
      } else if (parsed.type === 'TIME_REMAINING') {
        action = 'TIME';
      }

      return {
        type: parsed.type,
        action,
        label: parsed.type.replace(/_/g, ' '),
        speechFeedback: parsed.speechFeedback || '',
        targetOption: parsed.targetOption || undefined,
        targetSection: parsed.targetSection || undefined,
        targetElement: parsed.targetElement || undefined,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
        rawText: text,
        source: 'ai-nlu',
        reasoning: parsed.reasoning,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('[DrishtiNLU] Request timed out, using heuristic fallback');
      }
      return null;
    }
  }
}

export const drishtiNluService = new DrishtiNluService();
