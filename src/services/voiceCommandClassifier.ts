// ── Voice Command & Intent Recognition Service ───────────────────────
// Accessible, context-aware, robust intent classification for visually impaired candidates.
// Handles natural language variations, negation, contrast clauses, Whisper transcription
// errors, option changes, and safe exam lifecycle operations.

export type VoiceIntentType =
  // Navigation
  | 'OPEN_DASHBOARD'
  | 'OPEN_MOCK_TESTS'
  | 'OPEN_EXAM_OVERVIEW'
  | 'OPEN_PRACTICE'
  | 'OPEN_RESULTS'
  | 'OPEN_PERFORMANCE'
  | 'OPEN_PROFILE'
  | 'OPEN_SETTINGS'
  | 'OPEN_STUDY_MATERIALS'
  | 'OPEN_PYQS'
  | 'OPEN_EXAM_HISTORY'
  | 'OPEN_NOTIFICATIONS'
  | 'READ_NOTIFICATIONS'
  | 'CLOSE_NOTIFICATIONS'
  | 'NAVIGATE_BACK'
  | 'LOGOUT'
  // Authentication & Access
  | 'OPEN_LOGIN'
  | 'DEMO_STUDENT_LOGIN'
  | 'DEMO_ADMIN_LOGIN'
  | 'OPEN_REGISTER'
  | 'OPEN_ADMIN'
  // Practice Drills
  | 'VERIFY_ANSWER'
  | 'PRACTICE_HINT'
  | 'PRACTICE_RETRY'
  | 'PRACTICE_TOPIC'
  // Catalog Filtering
  | 'FILTER_CATEGORY'
  | 'FILTER_DIFFICULTY'
  | 'RESET_FILTERS'
  // Accessibility Toggles (Universal Voice Control)
  | 'THEME_LIGHT'
  | 'THEME_DARK'
  | 'THEME_CONTRAST'
  | 'THEME_YELLOW'
  | 'FONT_NORMAL'
  | 'FONT_LARGE'
  | 'FONT_XLARGE'
  | 'FONT_HUGE'
  | 'VOICE_FASTER'
  | 'VOICE_SLOWER'
  | 'VOICE_SAMPLE'
  | 'VOICE_BRIEFING'
  | 'RESET_SETTINGS'
  // Exam Operations
  | 'START_EXAM'
  | 'NEXT_QUESTION'
  | 'PREV_QUESTION'
  | 'SELECT_OPTION'
  | 'CHANGE_ANSWER'
  | 'CLEAR_ANSWER'
  | 'FLAG_QUESTION'
  | 'READ_QUESTION'
  | 'REPEAT_QUESTION'
  | 'REPEAT_LAST'
  | 'READ_OPTIONS'
  | 'TIME_REMAINING'
  | 'EXAM_STATUS'
  | 'UNANSWERED_COUNT'
  | 'GOTO_QUESTION'
  | 'VERBALIZE_MATH'
  | 'DESCRIBE_DIAGRAM'
  | 'EXPLAIN_QUESTION'
  | 'SHOW_SHORTCUTS'
  | 'INITIATE_SUBMIT'
  | 'CONFIRM_SUBMIT'
  | 'CANCEL_SUBMIT'
  // Voice & System Control
  | 'DRISHTI_WAKE'
  | 'DRISHTI_INTRO'
  | 'STOP_SPEAKING'
  | 'STOP_VOICE'
  | 'HELP'
  | 'SEQUENTIAL_UNSUPPORTED'
  | 'CLARIFY_AMBIGUOUS'
  // Autonomous Voice Scrolling & Action Operations
  | 'SCROLL_DOWN'
  | 'SCROLL_UP'
  | 'SCROLL_TOP'
  | 'SCROLL_BOTTOM'
  | 'AUTO_SCROLL_START'
  | 'AUTO_SCROLL_STOP'
  | 'AUTO_SCROLL_FASTER'
  | 'AUTO_SCROLL_SLOWER'
  | 'SCROLL_TO_SECTION'
  | 'CLICK_ELEMENT'
  | 'FOCUS_NEXT'
  | 'FOCUS_PREV'
  | 'EXPLAIN_PAGE'
  | 'UNRECOGNIZED';

export interface ConversationalMemory {
  lastTargetExamId?: string;
  lastTargetExamTitle?: string;
  lastSubject?: string;
  lastSpokenText?: string;
  awaitingClarification?: string;
}

export interface VoiceIntent {
  type: VoiceIntentType;
  action: string;             // Backward-compatible identifier (e.g. 'NEXT', 'SELECT_B', 'SUBMIT')
  label: string;              // UI indicator label
  speechFeedback: string;     // Short, natural TTS confirmation for screen-reader/visually impaired candidates
  targetOption?: 'A' | 'B' | 'C' | 'D';
  targetQuestionNumber?: number;
  targetNotificationIndex?: number;
  targetPage?: string;
  targetExamId?: string;
  targetExamTitle?: string;
  targetExamIndex?: number;
  targetCategory?: string;
  targetDifficulty?: string;
  targetTopic?: string;
  targetSection?: string;
  targetElement?: string;
  isNegated?: boolean;
  confidence: number;
  rawText: string;
}

export interface VoiceContext {
  route?: string;
  examState?: 'not-started' | 'in-progress' | 'submit-dialog' | 'none';
  currentQuestionIndex?: number;
  totalQuestions?: number;
  currentAnswer?: string | null;
  activePage?: string;
  isModalOpen?: boolean;
  conversationalState?: ConversationalMemory;
}

export interface VoiceCommandMatch {
  action: string;
  label: string;
  speechFeedback?: string;
  intent?: VoiceIntent;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Phonetic & Whisper Typo Normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes speech input: strips punctuation, removes contraction apostrophes cleanly,
 * normalizes spacing, and fixes common Whisper acoustic/phonetic misrecognitions.
 */
export function normalizeTranscript(raw: string): string {
  if (!raw) return '';
  let t = raw
    .toLowerCase()
    .replace(/['`]/g, '') // "don't" -> "dont", "can't" -> "cant"
    .replace(/[.!?;:\-_"~|।/\\()]/g, ' ')
    .replace(/\b(?:dristi|dhrishti|dishti|trishti|drishtee|drishty|drishtix)\b/g, 'drishti')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip conversational filler & assistant wake prefixes when followed by instructions:
  // e.g. "drishti start exam", "drishti read notification", "hey drishti next question", "please show results"
  // Keep "drishti" or "listen" when alone or when referring to standalone wake word
  t = t.replace(
    /^(?:hey\s+drishti|hello\s+drishti|hi\s+drishti|ok\s+drishti|okay\s+drishti|drishti|hey\s+drishtix|hello\s+drishtix|hi\s+drishtix|drishtix|hey\s+listen|listen\s+to\s+me|please|can\s+you\s+please|can\s+you|could\s+you|kindly|i\s+want\s+to|suno|sun|bhai)\s+/i,
    ''
  );

  // If command ends with suffix wake word like "start exam drishti" or "read notification drishti", strip suffix
  if (!/^(?:hey|hello|hi|ok|okay)?\s*drishti$/i.test(t)) {
    t = t.replace(/\s+(?:hey\s+|hello\s+|hi\s+)?drishti$/i, '');
  }

  // Fix common Whisper acoustic confusions in educational / exam vocabulary
  const wordReplacements: [RegExp, string][] = [
    [/\b(?:dash\s*board|deshboard|dashbord|dshboard)\b/g, 'dashboard'],
    [/\b(?:nex|neks|neck|text)\s+(?:question|sawal|prashna)\b/g, 'next question'],
    [/\b(?:nex|neks)\b/g, 'next'],
    [/\b(?:privious|previus|privus|pervious)\b/g, 'previous'],
    [/\b(?:rezult|rezults|resuts|rusult|rusults)\b/g, 'results'],
    [/\b(?:submition|submitt|submittion|submision)\b/g, 'submit'],
    [/\b(?:practise|prectice|prectis)\b/g, 'practice'],
    [/\b(?:optin|opshun|opsion)\b/g, 'option'],
    [/\b(?:choise|chois)\b/g, 'choice'],
    [/\b(?:anwser|answr|ans)\b/g, 'answer'],
    [/\b(?:qustion|questin|ques)\b/g, 'question'],
    [/\b(?:repeet|repat)\b/g, 'repeat'],
    [/\b(?:perfomance|performent|anlytics)\b/g, 'performance'],
    [/\b(?:setings|seting)\b/g, 'settings'],
    // Acoustic Whisper misrecognitions for scrolling
    [/\b(?:scrol|scrool|scrowl|skroll|strole)\b/g, 'scroll'],
    [/\b(?:stroll|crawl)\s+(down|up|top|bottom)\b/g, 'scroll $1'],
    [/\b(?:cold\s+down|call\s+down)\b/g, 'scroll down'],
    [/\b(?:cold\s+up|call\s+up)\b/g, 'scroll up'],
    [/\b(?:scroll\s+the\s+page\s+down|scroll\s+page\s+down|scroll\s+screen\s+down)\b/g, 'scroll down'],
    [/\b(?:scroll\s+the\s+page\s+up|scroll\s+page\s+up|scroll\s+screen\s+up)\b/g, 'scroll up'],
    [/\b(?:scroll\s+a\s+bit\s+down|scroll\s+a\s+little\s+down|scroll\s+a\s+bit|scroll\s+a\s+little|scroll\s+further)\b/g, 'scroll down'],
    [/\b(?:scroll\s+a\s+bit\s+up|scroll\s+a\s+little\s+up)\b/g, 'scroll up'],
    [/\b(?:aur\s+niche|aur\s+neeche|thoda\s+aur\s+niche|thoda\s+aur\s+neeche)\b/g, 'scroll down'],
    [/\b(?:aur\s+upar|aur\s+oopar|thoda\s+aur\s+upar|thoda\s+aur\s+oopar)\b/g, 'scroll up'],
    [/\b(?:ekdam\s+niche|ek\s+dam\s+niche|ekdam\s+neeche|ek\s+dam\s+neeche)\b/g, 'scroll to bottom'],
    [/\b(?:ekdam\s+upar|ek\s+dam\s+upar|ekdam\s+oopar|ek\s+dam\s+oopar)\b/g, 'scroll to top'],
    [/\b(?:and\s+scroll\s+down|and\s+scroll\s+up)\b/g, 'scroll down'],
    // Phonetic option letter substitutions
    [/\b(?:options?\s+ay|opt\s+a)\b/g, 'option a'],
    [/\b(?:options?\s+bee|options?\s+be|opt\s+b)\b/g, 'option b'],
    [/\b(?:options?\s+see|options?\s+sea|options?\s+si|opt\s+c)\b/g, 'option c'],
    [/\b(?:options?\s+dee|options?\s+di|opt\s+d)\b/g, 'option d'],
    // Hindi & Devanagari exam vocabulary mappings
    [/अगला\s*(सवाल|प्रश्न|क्वेश्चन)?(\s*खोलो)?/g, 'next question'],
    [/आगे\s*(बढ़ो|चलो|जाओ)/g, 'next question'],
    [/पिछला\s*(सवाल|प्रश्न|क्वेश्चन)?(\s*खोलो)?/g, 'previous question'],
    [/पीछे\s*(जाओ|चलो|आओ)/g, 'previous question'],
    [/(सवाल|प्रश्न|क्वेश्चन)\s*(पढ़कर?\s*सुनाओ|पढ़ो|सुनाओ)/g, 'read question'],
    [/(सवाल|प्रश्न|क्वेश्चन)\s*(दोबारा|फिर\s*से)\s*(पढ़ो|सुनाओ|बोलो)/g, 'repeat question'],
    [/(दोबारा|फिर\s*से)\s*(पढ़ो|बोलो|सुनाओ)/g, 'repeat question'],
    [/सवाल\s*सुनाओ/g, 'read question'],
    [/ऑप्शन\s*ए|विकल्प\s*ए/g, 'option a'],
    [/ऑप्शन\s*बी|विकल्प\s*बी/g, 'option b'],
    [/ऑप्शन\s*सी|विकल्प\s*सी/g, 'option c'],
    [/ऑप्शन\s*डी|विकल्प\s*डी/g, 'option d'],
    [/पहला\s*(ऑप्शन|विकल्प)/g, 'option a'],
    [/दूसरा\s*(ऑप्शन|विकल्प)/g, 'option b'],
    [/तीसरा\s*(ऑप्शन|विकल्प)/g, 'option c'],
    [/चौथा\s*(ऑप्शन|विकल्प)/g, 'option d'],
    [/सबमिट\s*(करो|कर\s*दो|परीक्षा)?/g, 'submit exam'],
    [/उत्तर\s*सबमिट\s*करो|आंसर\s*सबमिट\s*करो/g, 'submit exam'],
    [/जमा\s*करो/g, 'submit exam'],
    [/उत्तर\s*हटाओ|आंसर\s*क्लियर\s*करो/g, 'clear answer'],
    [/उत्तर\s*बदलो|आंसर\s*बदलो/g, 'change answer'],
    [/समय\s*कितना\s*बचा\s*है|टाइम\s*बताओ/g, 'time remaining'],
    [/कितने\s*(सवाल|प्रश्न)\s*बचे/g, 'unanswered count'],
    [/डैशबोर्ड\s*(खोलो)?/g, 'dashboard'],
    [/मॉक\s*टेस्ट\s*(खोलो)?/g, 'mock tests'],
    [/प्रैक्टिस\s*(खोलो)?/g, 'practice'],
    [/रिजल्ट\s*(खोलो)?/g, 'results'],
    [/परफॉरमेंस\s*(खोलो)?/g, 'performance'],
    [/सेटिंग्स?\s*(खोलो)?/g, 'settings'],
    [/प्रोफाइल\s*(खोलो)?/g, 'profile'],
    [/सहायता|मदद/g, 'help'],
    [/हाँ|हा/g, 'yes'],
    [/नहीं|ना/g, 'no'],
    [/रद्द\s*करो/g, 'cancel'],
    // Hindi Devanagari scrolling mappings
    [/सबसे\s*ऊपर(\s*जाओ)?/g, 'scroll to top'],
    [/एकदम\s*ऊपर/g, 'scroll to top'],
    [/सबसे\s*नीचे(\s*जाओ)?/g, 'scroll to bottom'],
    [/एकदम\s*नीचे/g, 'scroll to bottom'],
    [/और\s*नीचे|थोड़ा\s*और\s*नीचे/g, 'scroll down'],
    [/और\s*ऊपर|थोड़ा\s*और\s*ऊपर/g, 'scroll up'],
    [/नीचे\s*(करो|जाओ|ले\s*जाओ)/g, 'scroll down'],
    [/ऊपर\s*(करो|जाओ|ले\s*जाओ)/g, 'scroll up'],
    [/ऑटो\s*स्क्रॉल\s*(शुरू|चलाओ|करो)/g, 'start auto scroll'],
    [/स्क्रॉल\s*(रोको|बंद\s*करो|रोक\s*दो)/g, 'stop auto scroll'],
    // Hindi Devanagari notification mappings
    [/(?:पहला|1st)\s*(?:नोटिफिकेशन|नोटीफिकेशन)/gu, 'first notification'],
    [/(?:दूसरा|2nd)\s*(?:नोटिफिकेशन|नोटीफिकेशन)/gu, 'second notification'],
    [/(?:तीसरा|3rd)\s*(?:नोटिफिकेशन|नोटीफिकेशन)/gu, 'third notification'],
    [/(?:नोटिफिकेशन|नोटीफिकेशन)\s*(?:पढ़ो|पढो|सुनाओ|बताओ|बोलकर\s*सुनाओ)/gu, 'read notifications'],
    [/(?:नोटिफिकेशन|नोटीफिकेशन)\s*खोलो/gu, 'open notifications'],
    [/(?:नोटिफिकेशन|नोटीफिकेशन)\s*(?:बंद\s*करो|हटाओ)/gu, 'close notifications'],
    [/(?:नोटिफिकेशन|नोटीफिकेशन)/gu, 'notifications'],
  ];

  for (const [pattern, replacement] of wordReplacements) {
    t = t.replace(pattern, replacement);
  }

  return t.replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Clause & Negation Analysis
// ─────────────────────────────────────────────────────────────────────────────

interface Clause {
  text: string;
  isNegated: boolean;
}

const NEGATION_WORDS = new Set([
  "don't", 'dont', 'do not', 'never', 'should not', 'cannot', 'cant', "can't",
  'stop', 'avoid', 'not', 'no', 'mat', 'na', 'nahi', 'nahin', 'bina',
]);

const CONTRAST_SEPARATORS = [
  /\b(?:instead of|rather than|but not|but don'?t|but do not|but dont)\b/i,
  /\b(?:but|however|lekin|magar|parantu|kintu)\b/i,
  /\b(?:and instead|and go to|and go)\b/i,
  /,/i,
];

/**
 * Splits compound sentences into clauses and labels them with their negation status.
 * Example: "Don't open the results, go back to the dashboard"
 * -> Clause 1: "dont open the results" (negated = true)
 * -> Clause 2: "go back to the dashboard" (negated = false)
 */
export function parseClauses(raw: string): Clause[] {
  // Strip leading wake/assistant greetings before clause splitting so "Drishti, how much time..." isn't split into ["Drishti", "how much time..."]
  let sanitized = raw.trim();
  const strippedGreeting = sanitized.replace(/^(?:hey\s+drishti|hello\s+drishti|hi\s+drishti|ok\s+drishti|okay\s+drishti|drishti|hey\s+assistant|hello\s+assistant|please)[,\s]+/i, '');
  if (strippedGreeting) sanitized = strippedGreeting;

  // If sentence has "X instead of Y" or "X rather than Y",
  // X is the active positive intent, and Y is the rejected/negated intent.
  const contrastMatch = sanitized.match(/^(.*?)\b(?:instead of|rather than|but not)\b(.*)$/i);
  if (contrastMatch) {
    const positivePart = normalizeTranscript(contrastMatch[1]);
    const negatedPart = normalizeTranscript(contrastMatch[2]);
    const res: Clause[] = [];
    if (positivePart) res.push({ text: positivePart, isNegated: false });
    if (negatedPart) res.push({ text: negatedPart, isNegated: true });
    return res;
  }

  // Handle "X but don't Y" / "X but do not Y"
  const butDontMatch = sanitized.match(/^(.*?)\b(?:but\s+don'?t|but\s+do\s+not|but\s+never|par\s+mat|lekin\s+mat)\b(.*)$/i);
  if (butDontMatch) {
    let posPart = normalizeTranscript(butDontMatch[1]);
    const negPart = normalizeTranscript(butDontMatch[2]);
    if (posPart === 'open' && /\bstart\b/i.test(negPart)) {
      posPart = 'open mock test';
    }
    const res: Clause[] = [];
    if (posPart) res.push({ text: posPart, isNegated: false });
    if (negPart) res.push({ text: 'dont ' + negPart, isNegated: true });
    return res;
  }

  let parts: string[] = [sanitized];

  for (const sep of CONTRAST_SEPARATORS) {
    const nextParts: string[] = [];
    for (const part of parts) {
      const split = part.split(sep);
      for (const s of split) {
        const trimmed = s.trim();
        if (trimmed) nextParts.push(trimmed);
      }
    }
    parts = nextParts;
  }

  return parts.map(part => {
    const norm = normalizeTranscript(part);
    const words = norm.split(' ');

    // Affirmative stop/pause action commands that must never be flagged as negative clauses:
    const isStopActionCommand =
      /^(?:stop|ruko|band\s+karo)\s+(?:scroll|auto\s*scroll|speaking|audio|voice|reading)$/i.test(norm) ||
      /^(?:stop|ruko|chup|pause|skip)$/i.test(norm);

    // Check if the clause begins with or contains a prominent negation word
    const hasNegation = !isStopActionCommand && (
      words.slice(0, 4).some(w => NEGATION_WORDS.has(w) && w !== 'stop') ||
      /\b(?:dont|don'?t|do not|never|mat|nahi|nahin|not)\b/i.test(norm) ||
      (/\bstop\b/i.test(norm) && !isStopActionCommand)
    );
    return {
      text: norm,
      isNegated: hasNegation,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Sequential Command Detection
// ─────────────────────────────────────────────────────────────────────────────

export function isSequentialCommand(text: string): boolean {
  return /\b(?:and then|and after that|then\s+(?:go|read|select|open|start|click)|aur\s+phir|uske\s+baad)\b/i.test(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Core Intent Matchers for Single Clauses
// ─────────────────────────────────────────────────────────────────────────────

interface MatchResult {
  type: VoiceIntentType;
  action: string;
  label: string;
  speechFeedback: string;
  targetOption?: 'A' | 'B' | 'C' | 'D';
  targetQuestionNumber?: number;
  targetNotificationIndex?: number;
  targetPage?: string;
  targetExamId?: string;
  targetExamTitle?: string;
  targetExamIndex?: number;
  targetCategory?: string;
  targetDifficulty?: string;
  targetTopic?: string;
  targetSection?: string;
  targetElement?: string;
  confidence: number;
}

function matchSingleClause(rawClause: string, context?: VoiceContext): MatchResult | null {
  const t = rawClause.trim();
  if (!t) return null;

  const isExamContext =
    context?.examState === 'in-progress' ||
    (context?.route && context.route.startsWith('/exam/'));
  const isSubmitDlg = context?.examState === 'submit-dialog' || context?.isModalOpen;

  // ── SUBMIT DIALOG CONFIRMATION / CANCELLATION (Highest priority in dialog) ──
  if (isSubmitDlg) {
    if (
      /\b(yes|haan|haa|ha|confirm|confirm\s+submission|pakka|bilkul|zaroor|done|theek hai|okay|submit now|yes submit|submit\s+karo)\b/i.test(t) &&
      !/\b(option|a|b|c|d)\b/i.test(t)
    ) {
      return {
        type: 'CONFIRM_SUBMIT',
        action: 'CONFIRM_YES',
        label: 'Confirm Submit',
        speechFeedback: 'Exam submitted.',
        confidence: 0.95,
      };
    }
    if (
      /\b(no|nahi|nahin|cancel|continue|resume|wapas|ruko|mat karo|nahi karna|band karo|go back|dont submit|don'?t submit|do not submit|mat submit|no submit|cancel submit)\b/i.test(t)
    ) {
      return {
        type: 'CANCEL_SUBMIT',
        action: 'CANCEL_NO',
        label: 'Continue Exam',
        speechFeedback: 'Resuming examination.',
        confidence: 0.95,
      };
    }
  }

  // ── DRISHTI WAKE WORD ALONE (Alexa / Siri / Assistant style) ──
  if (/^(?:hey\s+drishti|hello\s+drishti|hi\s+drishti|ok\s+drishti|okay\s+drishti|drishti|hey\s+assistant|hello\s+assistant)$/i.test(t)) {
    return {
      type: 'DRISHTI_WAKE',
      action: 'DRISHTI_WAKE',
      label: 'Drishti Listening',
      speechFeedback: "I'm listening. How can I help you? You can say start exam, read notifications, open practice, or ask for help.",
      confidence: 1.0,
    };
  }

  // ── DRISHTI PERSONA INTRO ("Who are you", "What is your name") ──
  if (
    /\b(who\s+are\s+you|who\s+is\s+drishti|what\s+is\s+your\s+name|tell\s+me\s+about\s+yourself|what\s+can\s+you\s+do|who\s+made\s+you|introduce\s+yourself|apna\s+naam\s+batao|tum\s+kaun\s+ho|aap\s+kaun\s+hai)\b/i.test(t)
  ) {
    return {
      type: 'DRISHTI_INTRO',
      action: 'DRISHTI_INTRO',
      label: 'About Drishti',
      speechFeedback: "I am Drishti, your personalized AI accessibility exam assistant on DrishtiX. I help you navigate, take exams, read questions, verbalize math formulas, and manage notifications through voice or keyboard commands.",
      confidence: 0.98,
    };
  }

  // ── READ / REPEAT QUESTION / REPEAT LAST SPOKEN CONTENT ──
  if (
    /\b(repeat\s+that|repeat\s+this|repeat\s+please|repeat\s+(?:the\s+)?question|question\s+repeat(?:\s+karo)?|sawal\s+repeat(?:\s+karo)?|repeat|read\s+(?:the\s+)?question|question\s+padh(?:\s*ke)?\s*(?:sunao|padho)|padho\s+(?:sawal|question)|sawal\s+padho|sawal\s+padh(?:\s*ke)?\s*sunao|padh\s*ke\s*sunao|dobara\s+(?:padho|bolo|sunao)|phir\s+se\s+(?:padho|bolo|sunao)|read\s+again|again|sunao\s+sawal|sawal\s+sunao)\b/i.test(t) &&
    !/\b(options?\s+(?:padho|bolo|sunao)|only\s+options?|try\s+again|retry|reattempt)\b/i.test(t)
  ) {
    const isRepeatThat = /\b(repeat\s+that|repeat\s+this|repeat\s+please|dobara\s+bolo)\b/i.test(t);
    if (!isExamContext && isRepeatThat) {
      return {
        type: 'REPEAT_LAST',
        action: 'REPEAT_LAST',
        label: 'Repeat',
        speechFeedback: '', // Executed via speechService.repeatLast()
        confidence: 0.95,
      };
    }
    const isRepeat = /\b(repeat|dobara|phir\s+se|again)\b/i.test(t);
    return {
      type: isRepeat ? 'REPEAT_QUESTION' : 'READ_QUESTION',
      action: 'READ',
      label: isRepeat ? 'Repeat Question' : 'Read Question',
      speechFeedback: '', // Handled by question reading narration
      confidence: 0.95,
    };
  }

  // ── READ OPTIONS ONLY ──
  if (
    /\b(read\s+(?:the\s+)?options?|options?\s+padho|options?\s+bolo|only\s+options?|sirf\s+options?|options?\s+sunao|tell\s+(?:me\s+)?options?)\b/i.test(t)
  ) {
    return {
      type: 'READ_OPTIONS',
      action: 'READ_OPTIONS',
      label: 'Read Options',
      speechFeedback: 'Reading options.',
      confidence: 0.95,
    };
  }

  // ── NEXT QUESTION ──
  if (
    /\b(next\s+question|agla\s+question(?:\s+kholo)?|agla\s+sawal|agla\s+prashna|next\s+sawal|move\s+to\s+(?:the\s+)?next\s+question|go\s+to\s+(?:the\s+)?next\s+question|go\s+next|aage\s+badho|aage\s+chalo|aage\s+jao|forward|skip\s+question)\b/i.test(t) ||
    (isExamContext && /^(next|agla|aage|skip)$/i.test(t))
  ) {
    if (!/\b(option|a|b|c|d|dashboard|result|exam)\b/i.test(t)) {
      return {
        type: 'NEXT_QUESTION',
        action: 'NEXT',
        label: 'Next Question',
        speechFeedback: 'Next question.',
        confidence: 0.95,
      };
    }
  }

  // ── PREVIOUS QUESTION / GO BACK ──
  if (
    /\b(previous\s+question|pichla\s+question(?:\s+kholo)?|pichla\s+sawal|pichla\s+prashna|move\s+to\s+(?:the\s+)?previous\s+question|go\s+to\s+(?:the\s+)?previous\s+question|go\s+previous|prev\s+question|peeche\s+jao|piche\s+chalo|piche\s+aao|pick\s+the\s+question)\b/i.test(t) ||
    (isExamContext && /\b(previous|prev|pichla|peeche|piche|back|go back)\b/i.test(t))
  ) {
    if (!/\b(dashboard|exam|results|profile|settings|page)\b/i.test(t)) {
      return {
        type: 'PREV_QUESTION',
        action: 'PREV',
        label: 'Previous Question',
        speechFeedback: 'Previous question.',
        confidence: 0.95,
      };
    }
  }


  // ── OPTION SELECTION & OPTION CHANGE (A, B, C, D) ──
  // Check for explicit "change my answer to X" or "select option X"
  const optionMatch = extractOptionIntent(t);
  if (optionMatch) {
    return optionMatch;
  }

  // ── CLEAR / UNSELECT / CANCEL ANSWER ──
  if (
    /\b(clear\s+(?:my\s+)?answer|clear\s+selection|unselect|deselect|answer\s+hatao|selection\s+hatao|remove\s+(?:my\s+)?answer|take\s+away\s+(?:my\s+)?answer|take\s+back\s+(?:my\s+)?answer|erase\s+(?:my\s+)?answer|delete\s+(?:my\s+)?answer|hatao|reset\s+answer)\b/i.test(t) ||
    (isExamContext && !isSubmitDlg && /^(?:cancel|cancel answer|cancel selection|radd karo)$/i.test(t))
  ) {
    return {
      type: 'CLEAR_ANSWER',
      action: 'CLEAR',
      label: 'Cleared Answer',
      speechFeedback: 'Answer cleared.',
      confidence: 0.95,
    };
  }

  // ── IN-EXAM MARKS / PROGRESS / SCORE INQUIRY ──
  if (
    isExamContext &&
    /\b(marks|my\s+marks|score|my\s+score|result|results|exam\s+result|kitne\s+marks|mera\s+score|mera\s+result|check\s+result)\b/i.test(t)
  ) {
    return {
      type: 'EXAM_STATUS',
      action: 'MARKS',
      label: 'Exam Progress & Marks',
      speechFeedback: 'Announcing exam progress and marks.',
      confidence: 0.95,
    };
  }

  // ── FLAG / MARK FOR REVIEW ──
  if (
    /\b(flag\s+(?:this\s+)?question|flag|mark\s+for\s+review|review\s+later|bookmark|nishan\s+lagao|nishaan\s+lagao|baad\s+mein\s+dekhna)\b/i.test(t) &&
    !/\b(unflag)\b/i.test(t)
  ) {
    return {
      type: 'FLAG_QUESTION',
      action: 'FLAG',
      label: 'Flagged for Review',
      speechFeedback: 'Question flagged for review.',
      confidence: 0.9,
    };
  }

  // ── TIME REMAINING ──
  if (
    /\b(how\s+much\s+time|time\s+left|time\s+remaining|remaining\s+time|kitna\s+time|kitna\s+samay|time\s+batao|time\s+check)\b/i.test(t) ||
    (isExamContext && /^time$/i.test(t))
  ) {
    return {
      type: 'TIME_REMAINING',
      action: 'TIME',
      label: 'Time Remaining',
      speechFeedback: '', // Handled dynamically with time value
      confidence: 0.95,
    };
  }

  // ── EXAM STATUS / CURRENT QUESTION STATUS ──
  if (
    /\b(what\s+question\s+am\s+i\s+on|current\s+question|which\s+question|exam\s+status|status|progress|mera\s+status|kitne\s+sawal|kitne\s+questions)\b/i.test(t)
  ) {
    return {
      type: 'EXAM_STATUS',
      action: 'EXAM_STATUS',
      label: 'Exam Status',
      speechFeedback: '', // Handled dynamically
      confidence: 0.95,
    };
  }

  // ── UNANSWERED COUNT ──
  if (
    /\b(unanswered\s+count|how\s+many\s+left|left\s+to\s+answer|bache\s+hue\s+sawal|kitne\s+bache|not\s+answered)\b/i.test(t)
  ) {
    return {
      type: 'UNANSWERED_COUNT',
      action: 'UNANSWERED_COUNT',
      label: 'Unanswered Count',
      speechFeedback: '', // Handled dynamically
      confidence: 0.95,
    };
  }

  // ── JUMP TO SPECIFIC QUESTION NUMBER ──
  const qMatch = t.match(/\b(?:question|sawal|prashna|q\.?|number|no\.?)\s*(?:number|no\.?)?\s*(\d+)\b/i);
  if (qMatch) {
    const num = parseInt(qMatch[1], 10);
    if (num >= 1 && num <= 200) {
      return {
        type: 'GOTO_QUESTION',
        action: `GOTO_${num}`,
        label: `Question ${num}`,
        speechFeedback: `Question ${num}.`,
        targetQuestionNumber: num,
        confidence: 0.95,
      };
    }
  }

  // ── SUBMIT THE EXAM (Initiate Confirmation Process) ──
  if (
    /\b(submit\s+(?:the\s+)?(?:exam|test|paper|answer)|answer\s+submit(?:\s+karo)?|exam\s+submit(?:\s+karo)?|finish\s+(?:the\s+)?(?:exam|test)|end\s+exam|exam\s+khatam|paper\s+jama|jama\s+karo)\b/i.test(t) ||
    (isExamContext && /\b(submit|finish|khatam|jama)\b/i.test(t) && !/\b(how|why|when|what)\b/i.test(t))
  ) {
    // Must NOT submit accidentally if it was a question or negation
    if (!/\b(how|can i|should i|kya|when)\b/i.test(t)) {
      return {
        type: 'INITIATE_SUBMIT',
        action: 'SUBMIT',
        label: 'Submit Exam',
        speechFeedback: 'Opening submit confirmation. Say Yes to submit or No to continue.',
        confidence: 0.95,
      };
    }
  }


  // ── AMBIGUOUS TARGET WITHOUT ACTION (Do Not Guess) ──
  // If user says "the test", "mock test", "exam" without an action verb (open / start), clarify
  if (/^(?:the\s+)?(?:mock\s+)?(?:test|exam|pariksha)$/i.test(t)) {
    return {
      type: 'CLARIFY_AMBIGUOUS',
      action: 'NONE',
      label: 'Clarify Intent',
      speechFeedback: "I didn't understand. Do you want to open the test or start it?",
      confidence: 0.95,
    };
  }

  // ── SPECIFIC EXAM OPEN (Opens Pre-Exam Overview without starting) ──
  if (/\b(open|kholo|dikhao|show)\b/i.test(t) && !/\b(start|begin|shuru)\b/i.test(t)) {
    if (/\b(mathematics|maths?|math|quant|quantitative|banking\s+(?:quant|test|exam))\b/i.test(t)) {
      return {
        type: 'OPEN_EXAM_OVERVIEW',
        action: 'OPEN_EXAM_OVERVIEW',
        label: 'Mathematics Mock Test',
        speechFeedback: 'Mathematics mock test opened.',
        targetExamId: 'banking-quant-01',
        targetExamTitle: 'Banking Quantitative Aptitude',
        targetPage: '/exam/banking-quant-01',
        confidence: 0.98,
      };
    }
    if (/\b(reasoning|logic|general\s+intelligence|ssc\s+(?:reasoning|cgl|exam|test))\b/i.test(t)) {
      return {
        type: 'OPEN_EXAM_OVERVIEW',
        action: 'OPEN_EXAM_OVERVIEW',
        label: 'Reasoning Mock Test',
        speechFeedback: 'Reasoning mock test opened.',
        targetExamId: 'ssc-reasoning-01',
        targetExamTitle: 'SSC Reasoning',
        targetPage: '/exam/ssc-reasoning-01',
        confidence: 0.98,
      };
    }
    if (/\b(railway|rrb|ntpc|general\s+awareness)\b/i.test(t)) {
      return {
        type: 'OPEN_EXAM_OVERVIEW',
        action: 'OPEN_EXAM_OVERVIEW',
        label: 'Railway Mock Test',
        speechFeedback: 'Railway mock test opened.',
        targetExamId: 'railway-gk-01',
        targetExamTitle: 'Railway RRB',
        targetPage: '/exam/railway-gk-01',
        confidence: 0.98,
      };
    }
    if (/\b(upsc|civil\s+services|prelims|csat)\b/i.test(t)) {
      return {
        type: 'OPEN_EXAM_OVERVIEW',
        action: 'OPEN_EXAM_OVERVIEW',
        label: 'UPSC Mock Test',
        speechFeedback: 'UPSC mock test opened.',
        targetExamId: 'upsc-gs1-01',
        targetExamTitle: 'UPSC General Studies',
        targetPage: '/exam/upsc-gs1-01',
        confidence: 0.98,
      };
    }
    if (/\b(defence|nda|cds|armed\s+forces)\b/i.test(t)) {
      return {
        type: 'OPEN_EXAM_OVERVIEW',
        action: 'OPEN_EXAM_OVERVIEW',
        label: 'Defence Mock Test',
        speechFeedback: 'Defence mock test opened.',
        targetExamId: 'defence-nda-01',
        targetExamTitle: 'Defence NDA & CDS',
        targetPage: '/exam/defence-nda-01',
        confidence: 0.98,
      };
    }
    if (/\b(state\s+psc|psc|administrative)\b/i.test(t)) {
      return {
        type: 'OPEN_EXAM_OVERVIEW',
        action: 'OPEN_EXAM_OVERVIEW',
        label: 'State PSC Mock Test',
        speechFeedback: 'State PSC mock test opened.',
        targetExamId: 'state-psc-01',
        targetExamTitle: 'State PSC',
        targetPage: '/exam/state-psc-01',
        confidence: 0.98,
      };
    }
  }

  // ── CONVERSATIONAL PRONOUN FOLLOW-UP ("Start it", "Begin it") ──
  if (/\b(start\s+it|begin\s+it|start\s+this|begin\s+this|isko\s+shuru\s+karo|isse\s+shuru\s+karo|shuru\s+karo\s+isse)\b/i.test(t)) {
    const lastId = context?.conversationalState?.lastTargetExamId;
    const lastTitle = context?.conversationalState?.lastTargetExamTitle || 'mock';
    if (lastId) {
      return {
        type: 'START_EXAM',
        action: 'START_EXAM',
        label: `Start ${lastTitle}`,
        speechFeedback: `Starting the ${lastTitle} mock test.`,
        targetExamId: lastId,
        targetPage: `/exam/${lastId}`,
        confidence: 0.98,
      };
    }
    if (context?.route && context.route.startsWith('/exam/')) {
      return {
        type: 'START_EXAM',
        action: 'START_EXAM',
        label: 'Start Exam',
        speechFeedback: 'Starting the mock test.',
        confidence: 0.95,
      };
    }
    return {
      type: 'CLARIFY_AMBIGUOUS',
      action: 'NONE',
      label: 'Clarify Exam',
      speechFeedback: 'Which exam would you like to start? You can choose SSC Reasoning, Banking Quant, Railway, UPSC, Defence, or State PSC.',
      confidence: 0.9,
    };
  }

  // ── SPECIFIC MOCK TEST START (By Category, Subject, or Exam Number) ──
  // A. Numbered Exam Start: "start test 1", "test 2", "open test 3", "first test", "pehla test", etc.
  const testNumMatch = t.match(/\b(?:start|begin|open|launch|attempt)?\s*(?:mock\s+)?(?:test|exam|pariksha)\s*([1-6])\b/i) ||
    t.match(/^(?:test|exam|pariksha)\s*([1-6])$/i) ||
    t.match(/\b(first|second|third|fourth|fifth|sixth)\s+(?:mock\s+)?(?:test|exam|pariksha)\b/i) ||
    t.match(/\b(?:start|begin|open)?\s*(first|second|third|fourth|fifth|sixth)\s+(?:exam|test)\b/i) ||
    t.match(/\b(pehla|dusra|doosra|teesra|tisra|chautha|panchva|paanchva|chatha|chhatha)\s+(?:test|exam|pariksha)\b/i);

  if (testNumMatch) {
    const rawVal = testNumMatch[1].toLowerCase();
    let idx = 0;
    if (rawVal === '1' || rawVal === 'first' || rawVal === 'pehla') idx = 0;
    else if (rawVal === '2' || rawVal === 'second' || rawVal === 'dusra' || rawVal === 'doosra') idx = 1;
    else if (rawVal === '3' || rawVal === 'third' || rawVal === 'teesra' || rawVal === 'tisra') idx = 2;
    else if (rawVal === '4' || rawVal === 'fourth' || rawVal === 'chautha') idx = 3;
    else if (rawVal === '5' || rawVal === 'fifth' || rawVal === 'panchva' || rawVal === 'paanchva') idx = 4;
    else if (rawVal === '6' || rawVal === 'sixth' || rawVal === 'chatha' || rawVal === 'chhatha') idx = 5;

    const examIds = ['ssc-reasoning-01', 'banking-quant-01', 'upsc-gs1-01', 'railway-gk-01', 'defence-nda-01', 'state-psc-01'];
    const examTitles = ['SSC Reasoning', 'Banking Quant', 'UPSC General Studies', 'Railway RRB', 'Defence NDA & CDS', 'State PSC'];
    const chosenId = examIds[idx];
    const chosenTitle = examTitles[idx];

    return {
      type: 'START_EXAM',
      action: 'START_EXAM',
      label: `Start Test ${idx + 1}`,
      speechFeedback: `Starting ${chosenTitle} mock test.`,
      targetExamId: chosenId,
      targetExamTitle: chosenTitle,
      targetExamIndex: idx,
      targetPage: `/exam/${chosenId}`,
      confidence: 0.98,
    };
  }

  // B. Specific Category Start: "start banking", "start upsc", "start railway", "start defence", "start state psc", "start ssc"
  if (
    /\b(start|begin|launch|attempt|shuru\s+karo)\b/i.test(t) ||
    /\b(?:shuru\s+karo)\b/i.test(t) ||
    /\b(?:mock\s+test|mock\s+exam)\b/i.test(t)
  ) {
    if (/\b(banking|bank|quant|quantitative|mathematics|maths?)\b/i.test(t) && !/\b(filter|show|category)\b/i.test(t)) {
      return {
        type: 'START_EXAM',
        action: 'START_EXAM',
        label: 'Start Banking Quant',
        speechFeedback: 'Starting Banking Quantitative Aptitude mock test.',
        targetExamId: 'banking-quant-01',
        targetExamTitle: 'Banking Quantitative Aptitude',
        targetExamIndex: 1,
        targetPage: '/exam/banking-quant-01',
        confidence: 0.98,
      };
    }
    if (/\b(upsc|civil\s+services|prelims|csat|ias)\b/i.test(t) && !/\b(filter|show|category)\b/i.test(t)) {
      return {
        type: 'START_EXAM',
        action: 'START_EXAM',
        label: 'Start UPSC Prelims',
        speechFeedback: 'Starting UPSC General Studies mock test.',
        targetExamId: 'upsc-gs1-01',
        targetExamTitle: 'UPSC General Studies',
        targetExamIndex: 2,
        targetPage: '/exam/upsc-gs1-01',
        confidence: 0.98,
      };
    }
    if (/\b(railway|rrb|ntpc|group\s*d)\b/i.test(t) && !/\b(filter|show|category)\b/i.test(t)) {
      return {
        type: 'START_EXAM',
        action: 'START_EXAM',
        label: 'Start Railway RRB',
        speechFeedback: 'Starting Railway RRB mock test.',
        targetExamId: 'railway-gk-01',
        targetExamTitle: 'Railway RRB',
        targetExamIndex: 3,
        targetPage: '/exam/railway-gk-01',
        confidence: 0.98,
      };
    }
    if (/\b(defence|nda|cds|armed\s+forces)\b/i.test(t) && !/\b(filter|show|category)\b/i.test(t)) {
      return {
        type: 'START_EXAM',
        action: 'START_EXAM',
        label: 'Start Defence NDA',
        speechFeedback: 'Starting Defence NDA and CDS mock test.',
        targetExamId: 'defence-nda-01',
        targetExamTitle: 'Defence NDA & CDS',
        targetExamIndex: 4,
        targetPage: '/exam/defence-nda-01',
        confidence: 0.98,
      };
    }
    if (/\b(state\s+psc|psc|administrative)\b/i.test(t) && !/\b(filter|show|category)\b/i.test(t)) {
      return {
        type: 'START_EXAM',
        action: 'START_EXAM',
        label: 'Start State PSC',
        speechFeedback: 'Starting State PSC mock test.',
        targetExamId: 'state-psc-01',
        targetExamTitle: 'State PSC',
        targetExamIndex: 5,
        targetPage: '/exam/state-psc-01',
        confidence: 0.98,
      };
    }
    if (/\b(ssc|cgl|chsl|reasoning|general\s+intelligence)\b/i.test(t) && !/\b(filter|show|category)\b/i.test(t)) {
      return {
        type: 'START_EXAM',
        action: 'START_EXAM',
        label: 'Start SSC Reasoning',
        speechFeedback: 'Starting SSC General Intelligence and Reasoning mock test.',
        targetExamId: 'ssc-reasoning-01',
        targetExamTitle: 'SSC Reasoning',
        targetExamIndex: 0,
        targetPage: '/exam/ssc-reasoning-01',
        confidence: 0.98,
      };
    }
  }

  // ── START THE MOCK TEST (Generic Start) ──
  if (
    /\b(start\s+(?:the\s+)?(?:mock\s+)?(?:test|exam|examination|pariksha)|begin\s+(?:the\s+)?(?:mock\s+)?(?:test|exam|examination|pariksha)|ready\s+to\s+begin\s+(?:the\s+)?(?:test|exam|examination)|shuru\s+karo\s+(?:exam|pariksha|test)|chalu\s+karo\s+exam|proceed\s+to\s+exam)\b/i.test(t) ||
    (Boolean(context?.route?.startsWith('/exam/')) && context?.examState === 'not-started' && /^(start|begin|shuru|start exam|start test)$/i.test(t))
  ) {
    return {
      type: 'START_EXAM',
      action: 'START_EXAM',
      label: 'Start Exam',
      speechFeedback: 'Starting mock test.',
      confidence: 0.95,
    };
  }

  // ── NAVIGATION INTENTS (Checked with clear target words) ──

  // 1. Exam History (Must precede Mock Test library so "open exam history" is not caught as "open exam")
  if (
    /\b(open\s+exam\s+history|exam\s+history|history\s+kholo|past\s+attempts?|attempt\s+history|exam\s+logs?|history\s+par\s+jao|purani\s+attempts?(\s+dikhao)?|purane\s+attempts?|show\s+exam\s+history|previous\s+attempts?)\b/i.test(t) ||
    /^(exam history|history|past attempts)$/i.test(t)
  ) {
    return {
      type: 'OPEN_EXAM_HISTORY',
      action: 'NAVIGATE_HISTORY',
      label: 'Exam History',
      speechFeedback: 'Exam history opened.',
      targetPage: '/history',
      confidence: 0.95,
    };
  }

  // 2. Mock Test Library (Open ONLY, never start automatically)
  if (
    (/\b(open\s+(?:the\s+)?(?:mock\s+)?(?:tests?|exams?)|go\s+to\s+(?:the\s+)?(?:mock\s+)?(?:tests?|exams?)|show\s+(?:the\s+)?(?:mock\s+)?(?:tests?|exams?)|browse\s+(?:mock\s+)?(?:tests?|exams?)|view\s+(?:mock\s+)?(?:tests?|exams?)|mock\s+test\s+(?:page|library|kholo|par\s+jao)|exam\s+library)\b/i.test(t) ||
      /\b(?:open\s+but\s+dont\s+start|open\s+without\s+starting)\b/i.test(t)) &&
    !/\b(start|begin|shuru|history|past)\b/i.test(t)
  ) {
    return {
      type: 'OPEN_MOCK_TESTS',
      action: 'NAVIGATE_EXAMS',
      label: 'Mock Tests',
      speechFeedback: 'Mock test opened.',
      targetPage: '/exams',
      confidence: 0.95,
    };
  }

  // 2. Dashboard / Get Started
  if (
    (/\b(get\s+started|get\s+start|start\s+now|open\s+(?:the\s+)?dashboard|go\s+to\s+(?:the\s+)?dashboard|dashboard\s+kholo|dashboard\s+par\s+jao|main\s+dashboard|dashboard|go\s+home|main\s+page)\b/i.test(t) ||
      /^(dashboard|home|get started|get start)$/i.test(t)) &&
    !/\b(admin|performance)\b/i.test(t)
  ) {
    return {
      type: 'OPEN_DASHBOARD',
      action: 'NAVIGATE_DASHBOARD',
      label: 'Dashboard',
      speechFeedback: 'Dashboard opened.',
      targetPage: '/dashboard',
      confidence: 0.95,
    };
  }

  // 3. Results (Scorecard Review)
  if (
    /\b(show\s+(?:my\s+)?results?|open\s+(?:the\s+)?results?|view\s+(?:my\s+)?results?|my\s+results?|results?\s+kholo|results?\s+dikhao|past\s+results?|scorecard)\b/i.test(t) ||
    /^results?$/i.test(t)
  ) {
    return {
      type: 'OPEN_RESULTS',
      action: 'NAVIGATE_RESULTS',
      label: 'Results',
      speechFeedback: 'Results opened.',
      targetPage: '/history',
      confidence: 0.95,
    };
  }

  // 4. Practice Drills
  if (
    /\b(open\s+practice|go\s+to\s+practice|practice\s+drills?|ai\s+practice|abhyas|practice\s+kholo|practice\s+par\s+jao)\b/i.test(t) ||
    /^(practice|practice drills)$/i.test(t)
  ) {
    return {
      type: 'OPEN_PRACTICE',
      action: 'NAVIGATE_PRACTICE',
      label: 'AI Practice Drills',
      speechFeedback: 'Practice drills opened.',
      targetPage: '/practice',
      confidence: 0.95,
    };
  }

  // 5. Performance Analytics
  if (
    /\b(open\s+performance(?:\s+dashboard)?|show\s+performance|performance\s+analytics|pradarshan|performance\s+kholo|analytics\s+par\s+jao|report\s*card(\s+dikhao)?|mera\s+report\s*card|diagnostic\s+hub)\b/i.test(t) ||
    /^(performance|analytics|report card)$/i.test(t)
  ) {
    return {
      type: 'OPEN_PERFORMANCE',
      action: 'NAVIGATE_PERFORMANCE',
      label: 'Performance Analytics',
      speechFeedback: 'Performance analytics opened.',
      targetPage: '/performance',
      confidence: 0.95,
    };
  }

  // 6. Profile
  if (
    /\b(open\s+profile|my\s+profile|meri\s+profile|profile\s+kholo|profile\s+par\s+jao)\b/i.test(t) ||
    /^profile$/i.test(t)
  ) {
    return {
      type: 'OPEN_PROFILE',
      action: 'NAVIGATE_PROFILE',
      label: 'Candidate Profile',
      speechFeedback: 'Profile opened.',
      targetPage: '/profile',
      confidence: 0.95,
    };
  }

  // 7. Settings / Accessibility
  if (
    /\b(open\s+settings?|accessibility\s+settings?|settings?\s+kholo|settings?\s+par\s+jao)\b/i.test(t) ||
    /^(settings?|accessibility)$/i.test(t)
  ) {
    return {
      type: 'OPEN_SETTINGS',
      action: 'NAVIGATE_SETTINGS',
      label: 'Accessibility Settings',
      speechFeedback: 'Settings opened.',
      targetPage: '/settings',
      confidence: 0.95,
    };
  }

  // 8. Study Materials
  if (
    /\b(open\s+study\s+(?:materials?|vault)|study\s+(?:materials?|vault)(?:\s+kholo)?|study\s+notes|notes\s+kholo|study\s+material|kitabein|notes\s+dikhao|study\s+(?:material|vault)\s+par\s+jao)\b/i.test(t) ||
    /^(study materials?|study notes|notes|study vault)$/i.test(t)
  ) {
    return {
      type: 'OPEN_STUDY_MATERIALS',
      action: 'NAVIGATE_STUDY_MATERIALS',
      label: 'Study Materials',
      speechFeedback: 'Study materials opened.',
      targetPage: '/study-materials',
      confidence: 0.95,
    };
  }

  // 9. Past Year Papers (PYQs)
  if (
    /\b(open\s+past\s+year\s+papers?|open\s+pyqs?|show\s+previous\s+year\s+(?:questions?|papers?)|previous\s+year\s+(?:questions?|papers?)|past\s+year\s+(?:questions?|papers?)|past\s+papers?(\s+open\s+karo)?|past\s+papers?\s+kholo|pyqs?|purane\s+paper|pyq\s+kholo|pyqs?\s+par\s+jao)\b/i.test(t) ||
    /^(pyqs?|past papers?|previous year papers?)$/i.test(t)
  ) {
    return {
      type: 'OPEN_PYQS',
      action: 'NAVIGATE_PYQS',
      label: 'Past Year Papers',
      speechFeedback: 'Past year papers opened.',
      targetPage: '/pyqs',
      confidence: 0.95,
    };
  }

  // 10. Exam History
  if (
    /\b(open\s+exam\s+history|exam\s+history|history\s+kholo|past\s+attempts?|attempt\s+history|exam\s+logs?|history\s+par\s+jao)\b/i.test(t) ||
    /^(exam history|history)$/i.test(t)
  ) {
    return {
      type: 'OPEN_EXAM_HISTORY',
      action: 'NAVIGATE_HISTORY',
      label: 'Exam History',
      speechFeedback: 'Exam history opened.',
      targetPage: '/history',
      confidence: 0.95,
    };
  }

  // 11. Notifications (Read, Open, Close with Full Bilingual & Specific Index Support)
  // 11A. Read Specific Notification Index (e.g. "read first notification", "read notification 2")
  if (
    /\b(read\s+(?:the\s+)?(?:first|1st|second|2nd|third|3rd|pehla|dusra|teesra)\s+notifications?|read\s+notifications?\s+(?:number\s+)?\d+|(?:first|1st|second|2nd|third|3rd|pehla|dusra|teesra)\s+notifications?\s+(?:padho|sunao|batao)|read\s+(?:the\s+)?notifications?\s+in\s+(?:the\s+)?(?:notification\s+)?box)\b/i.test(t) ||
    /(?:^|\s)(?:पहला|दूसरा|तीसरा)\s*(?:नोटिफिकेशन|नोटीफिकेशन)\s*(?:पढ़ो|पढो|सुनाओ|बताओ)(?:\s|$)/u.test(t)
  ) {
    let notifIdx: number | undefined = undefined;
    const numDirect = t.match(/\b(?:notification\s+(?:number\s+)?(\d+)|notification\s+(\d+))\b/i) || t.match(/(?:नोटिफिकेशन|नोटीफिकेशन)\s*(\d+)/u);
    if (numDirect) {
      notifIdx = parseInt(numDirect[1] || numDirect[2], 10);
    } else if (/\b(first|1st|pehla)\b/i.test(t) || /(?:^|\s)(?:पहला|1st)(?:\s|$)/u.test(t)) {
      notifIdx = 1;
    } else if (/\b(second|2nd|dusra)\b/i.test(t) || /(?:^|\s)(?:दूसरा|2nd)(?:\s|$)/u.test(t)) {
      notifIdx = 2;
    } else if (/\b(third|3rd|teesra)\b/i.test(t) || /(?:^|\s)(?:तीसरा|3rd)(?:\s|$)/u.test(t)) {
      notifIdx = 3;
    }
    return {
      type: 'READ_NOTIFICATIONS',
      action: 'READ_NOTIFICATIONS',
      label: `Notification ${notifIdx || 1}`,
      speechFeedback: `Reading notification ${notifIdx || 1}.`,
      targetNotificationIndex: notifIdx || 1,
      confidence: 0.98,
    };
  }

  // 11B. Close Notifications
  if (
    /\b(close\s+(?:the\s+|my\s+)?notifications?|close\s+notification\s+box|hide\s+(?:the\s+|my\s+)?notifications?|notifications?\s+band\s+karo)\b/i.test(t) ||
    /(?:^|\s)(?:नोटिफिकेशन|नोटीफिकेशन)\s*बंद\s*करो(?:\s|$)/u.test(t)
  ) {
    return {
      type: 'CLOSE_NOTIFICATIONS',
      action: 'CLOSE_NOTIFICATIONS',
      label: 'Close Notifications',
      speechFeedback: 'Closing notifications.',
      confidence: 0.98,
    };
  }

  // 11C. Open / View / Read General Notifications
  if (
    /\b(open\s+(?:the\s+|my\s+)?notifications?|open\s+notification\s+box|show\s+(?:the\s+|my\s+)?notifications?|view\s+(?:the\s+|my\s+)?notifications?|check\s+(?:the\s+|my\s+)?notifications?|notifications?\s+kholo|notification\s+box|read\s+(?:the\s+|all\s+|my\s+|unread\s+|latest\s+)?notifications?|read\s+notification|read\s+notification\s+box|notifications?\s+padho|notifications?\s+sunao)\b/i.test(t) ||
    /(?:^|\s)(?:नोटिफिकेशन|नोटीफिकेशन)\s*(?:खोलो|दिखाओ|बताओ|पढ़ो|पढो|सुनाओ)(?:\s|$)/u.test(t) ||
    /^(?:notifications?|notification\s+box)$/i.test(t)
  ) {
    return {
      type: 'OPEN_NOTIFICATIONS',
      action: 'OPEN_NOTIFICATIONS',
      label: 'Notifications',
      speechFeedback: 'Opening notifications.',
      confidence: 0.98,
    };
  }


  // 12. Logout / Sign out
  if (/\b(log\s*out|sign\s*out|logout\s+karo)\b/i.test(t)) {
    return {
      type: 'LOGOUT',
      action: 'LOGOUT',
      label: 'Logout',
      speechFeedback: 'Logging out.',
      confidence: 0.95,
    };
  }

  // 13. Authentication & Access Navigation
  if (
    /\b(login\s+(?:as\s+)?student|student\s+login|demo\s+student|student\s+demo|sign\s+in\s+(?:as\s+)?student|student\s+ban\s+kar\s+login)\b/i.test(t)
  ) {
    return {
      type: 'DEMO_STUDENT_LOGIN',
      action: 'DEMO_STUDENT_LOGIN',
      label: 'Student Login',
      speechFeedback: 'Logging in as candidate Aryan Sharma.',
      targetPage: '/dashboard',
      confidence: 0.98,
    };
  }

  if (
    /\b(login\s+(?:as\s+)?admin|admin\s+login|demo\s+admin|admin\s+demo|sign\s+in\s+(?:as\s+)?admin|admin\s+ban\s+kar\s+login)\b/i.test(t)
  ) {
    return {
      type: 'DEMO_ADMIN_LOGIN',
      action: 'DEMO_ADMIN_LOGIN',
      label: 'Admin Login',
      speechFeedback: 'Logging in as Examination Administrator.',
      targetPage: '/admin?tab=dashboard',
      confidence: 0.98,
    };
  }

  if (
    /\b(open\s+login|go\s+to\s+login|login\s+page|sign\s+in\s+page|login\s+kholo|sign\s+in\s+kholo)\b/i.test(t) ||
    /^(login|sign\s*in)$/i.test(t)
  ) {
    return {
      type: 'OPEN_LOGIN',
      action: 'NAVIGATE_LOGIN',
      label: 'Sign In',
      speechFeedback: 'Opening login page.',
      targetPage: '/login',
      confidence: 0.96,
    };
  }

  if (
    /\b(open\s+register|open\s+registration|create\s+(?:an?\s+)?account|new\s+account|sign\s+up|register\s+page|khata\s+banao|registration\s+kholo)\b/i.test(t) ||
    /^(register|sign\s*up)$/i.test(t)
  ) {
    return {
      type: 'OPEN_REGISTER',
      action: 'NAVIGATE_REGISTER',
      label: 'Create Account',
      speechFeedback: 'Opening registration page.',
      targetPage: '/register',
      confidence: 0.96,
    };
  }

  if (
    /\b(open\s+admin|admin\s+dashboard|admin\s+panel|management\s+cockpit|admin\s+portal|admin\s+console|admin\s+par\s+jao)\b/i.test(t) ||
    /^admin$/i.test(t)
  ) {
    return {
      type: 'OPEN_ADMIN',
      action: 'NAVIGATE_ADMIN',
      label: 'Admin Management',
      speechFeedback: 'Opening admin management cockpit.',
      targetPage: '/admin?tab=dashboard',
      confidence: 0.96,
    };
  }

  // 14. Practice Drill Actions & Hints
  if (
    /\b(check\s+(?:my\s+)?answer|verify\s+(?:my\s+)?answer|reveal\s+(?:the\s+)?(?:answer|explanation)|submit\s+answer|uttar\s+batao|sahi\s+hai\s+kya|check\s+result|check\s+solution)\b/i.test(t)
  ) {
    return {
      type: 'VERIFY_ANSWER',
      action: 'VERIFY_ANSWER',
      label: 'Check Answer',
      speechFeedback: 'Checking your answer.',
      confidence: 0.96,
    };
  }

  if (
    /\b(give\s+me\s+(?:a\s+)?hint|hint|need\s+a\s+hint|clue|ishara|madad\s+karo)\b/i.test(t)
  ) {
    return {
      type: 'PRACTICE_HINT',
      action: 'PRACTICE_HINT',
      label: 'Hint',
      speechFeedback: 'Here is a hint for this question.',
      confidence: 0.96,
    };
  }

  if (
    /\b(try\s+again|retry|retry\s+question|phir\s+se\s+koshish|dobara\s+koshish)\b/i.test(t)
  ) {
    return {
      type: 'PRACTICE_RETRY',
      action: 'PRACTICE_RETRY',
      label: 'Try Again',
      speechFeedback: 'Retrying question.',
      confidence: 0.95,
    };
  }

  if (
    /\b(change\s+topic|switch\s+topic|next\s+topic|all\s+topics|topics\s+list|show\s+topics|topic\s+list|saare\s+topics|back\s+to\s+topics|topics\s+dikhao)\b/i.test(t)
  ) {
    return {
      type: 'PRACTICE_TOPIC',
      action: 'PRACTICE_TOPIC',
      label: 'Practice Topics',
      speechFeedback: 'Showing all practice topics.',
      confidence: 0.96,
    };
  }

  // 15. Exam Catalog Category & Difficulty Filters
  const sscCatMatch = /\b(?:show|filter|category)\s+ssc\b/i.test(t) || /\bssc\s+(?:exams?|tests?|category)\b/i.test(t);
  if (sscCatMatch) {
    return {
      type: 'FILTER_CATEGORY',
      action: 'FILTER_CATEGORY_SSC',
      label: 'SSC Exams',
      speechFeedback: 'Filtering by SSC category.',
      targetCategory: 'SSC',
      confidence: 0.96,
    };
  }
  const bankCatMatch = /\b(?:show|filter|category)\s+banking\b/i.test(t) || /\bbanking\s+(?:exams?|tests?|category)\b/i.test(t);
  if (bankCatMatch) {
    return {
      type: 'FILTER_CATEGORY',
      action: 'FILTER_CATEGORY_BANKING',
      label: 'Banking Exams',
      speechFeedback: 'Filtering by Banking category.',
      targetCategory: 'Banking',
      confidence: 0.96,
    };
  }
  const railCatMatch = /\b(?:show|filter|category)\s+railway\b/i.test(t) || /\brailway\s+(?:exams?|tests?|category)\b/i.test(t);
  if (railCatMatch) {
    return {
      type: 'FILTER_CATEGORY',
      action: 'FILTER_CATEGORY_RAILWAY',
      label: 'Railway Exams',
      speechFeedback: 'Filtering by Railway category.',
      targetCategory: 'Railway',
      confidence: 0.96,
    };
  }
  const upscCatMatch = /\b(?:show|filter|category)\s+upsc\b/i.test(t) || /\bupsc\s+(?:exams?|tests?|category)\b/i.test(t);
  if (upscCatMatch) {
    return {
      type: 'FILTER_CATEGORY',
      action: 'FILTER_CATEGORY_UPSC',
      label: 'UPSC Exams',
      speechFeedback: 'Filtering by UPSC category.',
      targetCategory: 'UPSC',
      confidence: 0.96,
    };
  }
  const defCatMatch = /\b(?:show|filter|category)\s+(?:defence|nda|cds)\b/i.test(t) || /\b(?:defence|nda|cds)\s+(?:exams?|tests?|category)\b/i.test(t);
  if (defCatMatch) {
    return {
      type: 'FILTER_CATEGORY',
      action: 'FILTER_CATEGORY_DEFENCE',
      label: 'Defence Exams',
      speechFeedback: 'Filtering by Defence category.',
      targetCategory: 'Defence',
      confidence: 0.96,
    };
  }
  const pscCatMatch = /\b(?:show|filter|category)\s+(?:state\s+psc|psc)\b/i.test(t) || /\b(?:state\s+psc|psc)\s+(?:exams?|tests?|category)\b/i.test(t);
  if (pscCatMatch) {
    return {
      type: 'FILTER_CATEGORY',
      action: 'FILTER_CATEGORY_STATE_PSC',
      label: 'State PSC Exams',
      speechFeedback: 'Filtering by State PSC category.',
      targetCategory: 'State PSC',
      confidence: 0.96,
    };
  }

  const easyDiffMatch = /\b(?:filter|show|difficulty)\s+easy\b/i.test(t) || /\beasy\s+(?:exams?|tests?|difficulty)\b/i.test(t) || /\b(?:saral|aasan)\s+(?:exams?|tests?)\b/i.test(t);
  if (easyDiffMatch) {
    return {
      type: 'FILTER_DIFFICULTY',
      action: 'FILTER_DIFFICULTY_EASY',
      label: 'Easy Exams',
      speechFeedback: 'Filtering by Easy difficulty.',
      targetDifficulty: 'Easy',
      confidence: 0.96,
    };
  }
  const medDiffMatch = /\b(?:filter|show|difficulty)\s+medium\b/i.test(t) || /\bmedium\s+(?:exams?|tests?|difficulty)\b/i.test(t) || /\bmadhyam\s+(?:exams?|tests?)\b/i.test(t);
  if (medDiffMatch) {
    return {
      type: 'FILTER_DIFFICULTY',
      action: 'FILTER_DIFFICULTY_MEDIUM',
      label: 'Medium Exams',
      speechFeedback: 'Filtering by Medium difficulty.',
      targetDifficulty: 'Medium',
      confidence: 0.96,
    };
  }
  const hardDiffMatch = /\b(?:filter|show|difficulty)\s+hard\b/i.test(t) || /\b(?:hard|tough)\s+(?:exams?|tests?|difficulty)\b/i.test(t) || /\b(?:kathin|mushkil)\s+(?:exams?|tests?)\b/i.test(t);
  if (hardDiffMatch) {
    return {
      type: 'FILTER_DIFFICULTY',
      action: 'FILTER_DIFFICULTY_HARD',
      label: 'Hard Exams',
      speechFeedback: 'Filtering by Hard difficulty.',
      targetDifficulty: 'Hard',
      confidence: 0.96,
    };
  }

  if (
    /\b(reset\s+(?:all\s+)?filters?|clear\s+(?:all\s+)?filters?|show\s+all\s+exams|all\s+exams|all\s+categories|saare\s+exam\s+dikhao)\b/i.test(t)
  ) {
    return {
      type: 'RESET_FILTERS',
      action: 'RESET_FILTERS',
      label: 'Reset Filters',
      speechFeedback: 'Showing all available mock examinations.',
      confidence: 0.96,
    };
  }

  // ── UNIVERSAL ACCESSIBILITY VOICE CONTROLS (Work from any page) ──
  // Display Theme
  if (/\b(dark\s+mode|dark\s+theme|black\s+theme|enable\s+dark|turn\s+on\s+dark|set\s+dark)\b/i.test(t)) {
    return { type: 'THEME_DARK', action: 'THEME_DARK', label: 'Dark Mode', speechFeedback: 'Dark mode enabled.', confidence: 0.95 };
  }
  if (/\b(light\s+mode|light\s+theme|white\s+theme|enable\s+light|turn\s+on\s+light|set\s+light)\b/i.test(t)) {
    return { type: 'THEME_LIGHT', action: 'THEME_LIGHT', label: 'Light Mode', speechFeedback: 'Light mode enabled.', confidence: 0.95 };
  }
  if (/\b(high\s+contrast|contrast\s+mode|enable\s+contrast|set\s+contrast)\b/i.test(t) && !/\b(yellow)\b/i.test(t)) {
    return { type: 'THEME_CONTRAST', action: 'THEME_CONTRAST', label: 'High Contrast', speechFeedback: 'High contrast theme enabled.', confidence: 0.95 };
  }
  if (/\b(yellow\s+(?:on\s+)?black|yellow\s+theme|yellow\s+black)\b/i.test(t)) {
    return { type: 'THEME_YELLOW', action: 'THEME_YELLOW', label: 'Yellow on Black', speechFeedback: 'Yellow on black theme enabled.', confidence: 0.95 };
  }

  // Font Scaling
  if (/\b(huge\s+font|huge\s+text|maximum\s+text|maximum\s+font|sabse\s+bada\s+font)\b/i.test(t)) {
    return { type: 'FONT_HUGE', action: 'FONT_HUGE', label: 'Huge Font', speechFeedback: 'Font size set to huge.', confidence: 0.95 };
  }
  if (/\b(extra\s+large\s+font|extra\s+large\s+text|x\s*large\s+font|x\s*large\s+text)\b/i.test(t)) {
    return { type: 'FONT_XLARGE', action: 'FONT_XLARGE', label: 'X-Large Font', speechFeedback: 'Font size set to extra large.', confidence: 0.95 };
  }
  if (/\b(large\s+font|large\s+text|increase\s+text|increase\s+font|bada\s+font|bada\s+text)\b/i.test(t)) {
    return { type: 'FONT_LARGE', action: 'FONT_LARGE', label: 'Large Font', speechFeedback: 'Font size set to large.', confidence: 0.95 };
  }
  if (/\b(normal\s+font|normal\s+text|default\s+font|default\s+text|reset\s+font|reset\s+text)\b/i.test(t)) {
    return { type: 'FONT_NORMAL', action: 'FONT_NORMAL', label: 'Normal Font', speechFeedback: 'Font size set to normal.', confidence: 0.95 };
  }

  // Speech Synthesizer Tuning
  if (/\b(speak\s+faster|increase\s+voice\s+speed|faster\s+voice|speed\s+badhao|fast\s+bolo)\b/i.test(t)) {
    return { type: 'VOICE_FASTER', action: 'VOICE_FASTER', label: 'Faster Voice', speechFeedback: 'Speaking rate increased.', confidence: 0.95 };
  }
  if (/\b(speak\s+slower|decrease\s+voice\s+speed|slower\s+voice|speed\s+kam\s+karo|dheere\s+bolo)\b/i.test(t)) {
    return { type: 'VOICE_SLOWER', action: 'VOICE_SLOWER', label: 'Slower Voice', speechFeedback: 'Speaking rate decreased.', confidence: 0.95 };
  }
  if (/\b(sample\s+voice|test\s+voice|voice\s+test|voice\s+sample|awaz\s+test)\b/i.test(t)) {
    return { type: 'VOICE_SAMPLE', action: 'VOICE_SAMPLE', label: 'Sample Voice', speechFeedback: '', confidence: 0.95 };
  }
  if (/\b(reset\s+accessibility|reset\s+settings|reset\s+to\s+defaults?|default\s+settings)\b/i.test(t)) {
    return { type: 'RESET_SETTINGS', action: 'RESET_SETTINGS', label: 'Reset Settings', speechFeedback: 'Accessibility settings reset to defaults.', confidence: 0.95 };
  }

  // Performance Voice Briefing
  if (/\b(voice\s+briefing|read\s+briefing|performance\s+briefing|briefing\s+sunao|read\s+my\s+report)\b/i.test(t)) {
    return { type: 'VOICE_BRIEFING', action: 'VOICE_BRIEFING', label: 'Voice Briefing', speechFeedback: '', confidence: 0.95 };
  }

  // General Go Back (when not in exam)
  if (
    !isExamContext &&
    (/\b(go\s+back|previous\s+page|wapas\s+jao|piche\s+jao)\b/i.test(t) || /^(back|go back)$/i.test(t))
  ) {
    return {
      type: 'NAVIGATE_BACK',
      action: 'NAVIGATE_BACK',
      label: 'Go Back',
      speechFeedback: 'Going back.',
      confidence: 0.95,
    };
  }

  // ── SPECIALIZED ASSISTIVE EXAM ACTIONS ──
  if (/\b(verbalize\s+(?:the\s+)?formula|explain\s+(?:the\s+)?formula|math\s+formula|read\s+(?:the\s+)?formula|formula\s+padho|equation)\b/i.test(t)) {
    return { type: 'VERBALIZE_MATH', action: 'MATH', label: 'Verbalize Formula', speechFeedback: 'Verbalizing formula.', confidence: 0.9 };
  }
  if (/\b(describe\s+(?:the\s+)?(?:diagram|chart|graph|figure)|diagram\s+samjhao|diagram\s+padho|describe\s+chart|graph\s+samjhao)\b/i.test(t)) {
    return { type: 'DESCRIBE_DIAGRAM', action: 'DIAGRAM', label: 'Describe Diagram', speechFeedback: 'Describing diagram.', confidence: 0.9 };
  }
  if (/\b(explain\s+question|sawal\s+samjhao|simplify\s+question|ai\s+explain)\b/i.test(t)) {
    return { type: 'EXPLAIN_QUESTION', action: 'EXPLAIN', label: 'Explain Question', speechFeedback: 'Explaining question.', confidence: 0.9 };
  }
  if (/\b(shortcuts|keyboard\s+shortcuts|cheat\s+sheet|madad|keys)\b/i.test(t)) {
    return { type: 'SHOW_SHORTCUTS', action: 'SHORTCUTS', label: 'Keyboard Shortcuts', speechFeedback: 'Opening keyboard shortcuts.', confidence: 0.9 };
  }

  // ── STOP SPEECH / VOICE CONTROL ──
  if (
    /^(?:stop|ruko|ruk\s*jao|chup|pause|cancel|shant|quiet|रुको|रुक\s*जाओ|चुप|शांत)$/i.test(t) ||
    /\b(stop\s+speaking|stop\s+talking|chup\s+ho\s+jao|chup\s+raho|shant\s+ho\s+jao|quiet|stop\s+audio|mute\s+audio|audio\s+stop|speech\s+stop)\b/i.test(t)
  ) {
    return { type: 'STOP_SPEAKING', action: 'STOP_SPEAKING', label: 'Stop Speaking', speechFeedback: 'Stopped.', confidence: 0.98 };
  }
  if (/\b(stop\s+voice|voice\s+off|mic\s+off|band\s+karo\s+mic|mute\s+mic)\b/i.test(t)) {
    return { type: 'STOP_VOICE', action: 'STOP_VOICE', label: 'Voice Off', speechFeedback: 'Voice assistant muted.', confidence: 0.95 };
  }

  // ── PAGE ORIENTATION & EXPLANATION ──
  if (
    /\b(explain\s+(?:this\s+)?page|page\s+(?:details|overview|briefing|info)|tell\s+(?:me\s+)?all\s+details|is\s+page\s+(?:ke\s+bare\s+mein\s+batao|me\s+kya\s+hai)|screen\s+par\s+kya\s+hai|kya\s+likha\s+hai\s+is\s+screen\s+par|page\s+(?:sunao|padho)|page\s+kya\s+hai)\b/i.test(t) ||
    /(?:पेज\s*(?:के\s*बारे\s*में\s*बताओ|समझाओ|सुनाओ)|स्क्रीन\s*पर\s*क्या\s*है)/.test(t)
  ) {
    return { type: 'EXPLAIN_PAGE', action: 'EXPLAIN_PAGE', label: 'Explain Page', speechFeedback: 'Explaining page details.', confidence: 0.98 };
  }

  // ── AUTONOMOUS VOICE SCROLLING & ELEMENT ACTIONS ──
  // 1. Directional Scrolling (Top and Bottom take priority over Down and Up)
  if (
    /\b(scroll\s+(?:to\s+(?:the\s+)?)?top|go\s+to\s+(?:the\s+)?top|sabse\s+upar\s+jao|sabse\s+upar|top\s+par\s+jao|top\s+pe\s+jao|top\s+par|shuru\s+me\s+jao|ekdam\s+upar|ek\s+dam\s+upar)\b/i.test(t) ||
    /(?:सबसे\s*ऊपर|टॉप\s*पर|एकदम\s*ऊपर)/.test(t)
  ) {
    return { type: 'SCROLL_TOP', action: 'SCROLL_TOP', label: 'Scroll to Top', speechFeedback: 'Scrolling to top.', confidence: 0.98 };
  }
  if (
    /\b(scroll\s+(?:to\s+(?:the\s+)?)?bottom|go\s+to\s+(?:the\s+)?bottom|sabse\s+neeche\s+jao|sabse\s+neeche|sabse\s+niche\s+jao|sabse\s+niche|bottom\s+par\s+jao|bottom\s+pe\s+jao|bottom\s+par|aakhri\s+me\s+jao|last\s+me\s+jao|ekdam\s+niche|ek\s+dam\s+niche|ekdam\s+neeche|ek\s+dam\s+neeche)\b/i.test(t) ||
    /(?:सबसे\s*नीचे|बॉटम\s*पर|एकदम\s*नीचे)/.test(t)
  ) {
    return { type: 'SCROLL_BOTTOM', action: 'SCROLL_BOTTOM', label: 'Scroll to Bottom', speechFeedback: 'Scrolling to bottom.', confidence: 0.98 };
  }
  if (
    /\b(scroll\s+(?:the\s+page\s+)?down|scroll\s+down|neeche\s+scroll|scroll\s+neeche|niche\s+scroll|scroll\s+niche|page\s+down|neeche\s+jao|niche\s+jao|neeche\s+karo|niche\s+karo|thoda\s+niche|thoda\s+neeche|aur\s+niche|aur\s+neeche|aur\s+scroll|scroll\s+a\s+bit|scroll\s+further)\b/i.test(t) ||
    /(?:नीचे\s*स्क्रॉल|नीचे\s*करो|नीचे\s*जाओ|थोड़ा\s*नीचे|और\s*नीचे)/.test(t)
  ) {
    return { type: 'SCROLL_DOWN', action: 'SCROLL_DOWN', label: 'Scroll Down', speechFeedback: 'Scrolling down.', confidence: 0.98 };
  }
  if (
    /\b(scroll\s+(?:the\s+)?(?:page\s+)?up|scroll\s+up|upar\s+scroll|scroll\s+upar|oopar\s+scroll|page\s+up|upar\s+jao|oopar\s+jao|upar\s+karo|oopar\s+karo|thoda\s+upar|thoda\s+oopar|aur\s+upar|aur\s+oopar)\b/i.test(t) ||
    /(?:ऊपर\s*स्क्रॉल|ऊपर\s*करो|ऊपर\s*जाओ|थोड़ा\s*ऊपर|और\s*ऊपर)/.test(t)
  ) {
    return { type: 'SCROLL_UP', action: 'SCROLL_UP', label: 'Scroll Up', speechFeedback: 'Scrolling up.', confidence: 0.98 };
  }

  // 2. Continuous Auto-Scroll
  if (
    (/\b(start\s+auto\s*scroll|begin\s+auto\s*scroll|auto\s*scroll\s+(?:shuru|start|on|chalu)|auto\s*scroll|scroll\s+automatically)\b/i.test(t) || /(?:ऑटो\s*स्क्रॉल(?:\s*(?:शुरू|चलाओ|करो))?)/.test(t)) &&
    !/\b(stop|roko|faster|slower|band|ruk)\b/i.test(t)
  ) {
    return { type: 'AUTO_SCROLL_START', action: 'AUTO_SCROLL_START', label: 'Auto Scroll Started', speechFeedback: 'Auto scrolling started.', confidence: 0.98 };
  }
  if (
    /\b(stop\s+auto\s*scroll|stop\s+scroll|end\s+auto\s*scroll|auto\s*scroll\s+(?:roko|band|stop)|scroll\s+(?:roko|band|ruk)|pause\s+scroll)\b/i.test(t) ||
    /(?:स्क्रॉल\s*रोको|ऑटो\s*स्क्रॉल\s*बंद|रोक\s*दो)/.test(t)
  ) {
    return { type: 'AUTO_SCROLL_STOP', action: 'AUTO_SCROLL_STOP', label: 'Auto Scroll Stopped', speechFeedback: 'Auto scrolling stopped.', confidence: 0.98 };
  }
  if (
    /\b(scroll\s+faster|auto\s*scroll\s+faster|fast\s+scroll|tez\s+scroll|scroll\s+speed\s+badhao|speed\s+badhao)\b/i.test(t) ||
    /(?:तेज\s*स्क्रॉल|स्पीड\s*बढ़ाओ)/.test(t)
  ) {
    return { type: 'AUTO_SCROLL_FASTER', action: 'AUTO_SCROLL_FASTER', label: 'Scroll Faster', speechFeedback: 'Increasing scroll speed.', confidence: 0.95 };
  }
  if (
    /\b(scroll\s+slower|auto\s*scroll\s+slower|slow\s+scroll|dheere\s+scroll|scroll\s+speed\s+kam\s+karo|speed\s+kam\s+karo)\b/i.test(t) ||
    /(?:धीरे\s*स्क्रॉल|स्पीड\s*कम\s*करो)/.test(t)
  ) {
    return { type: 'AUTO_SCROLL_SLOWER', action: 'AUTO_SCROLL_SLOWER', label: 'Scroll Slower', speechFeedback: 'Decreasing scroll speed.', confidence: 0.95 };
  }

  // 3. Smart Section Jumps
  const sectionMatch = t.match(/\b(?:scroll\s+to|jump\s+to|navigate\s+to|go\s+to\s+section)\s+(?:the\s+)?(options?|questions?|submit|instructions?|overview|summary|header|palette|notifications?|formula|diagram|charts?|graphs?|tables?|results?|solutions?|explanations?|materials?|notes?|timer)\b/i);
  if (sectionMatch) {
    let sectionKey = sectionMatch[1].toLowerCase();
    if (sectionKey.startsWith('notification')) sectionKey = 'notification';
    else if (sectionKey.startsWith('option')) sectionKey = 'options';
    else if (sectionKey.startsWith('question')) sectionKey = 'question';
    else if (sectionKey.startsWith('solution')) sectionKey = 'solutions';
    else if (sectionKey.startsWith('material')) sectionKey = 'materials';
    else if (sectionKey.startsWith('table')) sectionKey = 'table';
    else if (sectionKey.startsWith('result')) sectionKey = 'results';
    return {
      type: 'SCROLL_TO_SECTION',
      action: `SCROLL_SECTION_${sectionKey.toUpperCase()}`,
      label: `Scroll to ${sectionKey}`,
      speechFeedback: `Scrolling to ${sectionKey}.`,
      targetSection: sectionKey,
      confidence: 0.96,
    };
  }

  // 4. Autonomous Element Clicking & Tap simulation
  const clickMatch = t.match(/\b(?:click|press|tap|dabao)\s+(?:on\s+)?(?:the\s+)?(.+)\b/i);
  if (clickMatch) {
    const rawTarget = clickMatch[1].trim().toLowerCase();
    if (rawTarget === 'start exam' || rawTarget === 'start test') {
      return { type: 'START_EXAM', action: 'START_EXAM', label: 'Start Exam', speechFeedback: 'Starting mock test.', confidence: 0.98 };
    }
    return {
      type: 'CLICK_ELEMENT',
      action: 'CLICK_ELEMENT',
      label: `Click ${clickMatch[1].trim()}`,
      speechFeedback: `Clicking ${clickMatch[1].trim()}.`,
      targetElement: clickMatch[1].trim(),
      confidence: 0.95,
    };
  }

  // 5. Accessible Focus Traversal
  if (/\b(focus\s+next\s+element|next\s+element|agla\s+element|focus\s+next)\b/i.test(t)) {
    return { type: 'FOCUS_NEXT', action: 'FOCUS_NEXT', label: 'Focus Next', speechFeedback: 'Focused next element.', confidence: 0.95 };
  }
  if (/\b(focus\s+previous\s+element|previous\s+element|pichla\s+element|focus\s+prev)\b/i.test(t)) {
    return { type: 'FOCUS_PREV', action: 'FOCUS_PREV', label: 'Focus Previous', speechFeedback: 'Focused previous element.', confidence: 0.95 };
  }

  // ── HELP & FEATURE GUIDANCE ──
  if (/\b(help|guide\s+me|guide|what\s+can\s+i\s+say|what\s+can\s+you\s+do|features|kya\s+bol\s+sakta|commands|options|available\s+features)\b/i.test(t) || /^(help|guide|features)$/i.test(t)) {
    return {
      type: 'HELP',
      action: 'HELP',
      label: 'Voice Guidance',
      speechFeedback: 'Available sections: Open Dashboard, Open Mock Tests, AI Practice Drills, Study Materials, Past Year Papers, Performance, Exam History, Accessibility Settings, or Candidate Profile. You can also say switch to dark mode, scroll down, or start auto scroll.',
      confidence: 0.95,
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Option Intent Extractor (Select / Change / Replace)
// ─────────────────────────────────────────────────────────────────────────────

function extractOptionIntent(text: string): MatchResult | null {
  // Contrast option selection: "select C instead of B", "option C rather than B", "C instead of B"
  const insteadOfMatch = text.match(/\b(?:select|choose|pick|mark|option)?\s*([abcd1-4]|bee|see|sea|si|dee)\s+(?:instead\s+of|rather\s+than)\s+(?:options?\s*)?([abcd1-4]|bee|see|sea|si|dee)\b/i);
  if (insteadOfMatch) {
    const opt = normalizeOptionLetter(insteadOfMatch[1]);
    if (opt) {
      return {
        type: 'CHANGE_ANSWER',
        action: `SELECT_${opt}`,
        label: `Option ${opt}`,
        speechFeedback: `Option ${opt} selected.`,
        targetOption: opt,
        confidence: 0.99,
      };
    }
  }

  // Preceding contrast: "instead of B, select C", "rather than B choose C"
  const insteadBeforeMatch = text.match(/\b(?:instead\s+of|rather\s+than)\s+(?:options?\s*)?([abcd1-4]|bee|see|sea|si|dee)[,\s]+(?:select|choose|pick|mark|option)?\s*([abcd1-4]|bee|see|sea|si|dee)\b/i);
  if (insteadBeforeMatch) {
    const opt = normalizeOptionLetter(insteadBeforeMatch[2]);
    if (opt) {
      return {
        type: 'CHANGE_ANSWER',
        action: `SELECT_${opt}`,
        label: `Option ${opt}`,
        speechFeedback: `Option ${opt} selected.`,
        targetOption: opt,
        confidence: 0.99,
      };
    }
  }

  // Check for answer change intent:
  // "Change my answer to C", "Change to C", "Switch to C", "Change my answer from B to C", "Make it C"
  const isChangeIntent = /\b(change|switch|update|modify|replace|badlo|badal)\b/i.test(text);

  // Look for target option letter or number at the end of the phrase or preceded by 'to', 'with', 'select', 'option'
  // 1. "to C", "to option C", "with C", "into C", "as C"
  const changeToMatch = text.match(/\b(?:to|into|with|as|kar\s+do|lagao)\s+(?:options?\s*)?([abcd1-4]|bee|see|sea|si|dee)\b/i);
  if (isChangeIntent && changeToMatch) {
    const opt = normalizeOptionLetter(changeToMatch[1]);
    if (opt) {
      return {
        type: 'CHANGE_ANSWER',
        action: `SELECT_${opt}`,
        label: `Option ${opt}`,
        speechFeedback: `Option ${opt} selected.`,
        targetOption: opt,
        confidence: 0.98,
      };
    }
  }

  // 2. Direct "change my answer to [X]" pattern
  const directChangeMatch = text.match(/\bchange\s+(?:my\s+)?(?:answer\s+)?(?:to\s+)?([abcd1-4]|bee|see|sea|si|dee)\b/i);
  if (directChangeMatch) {
    const opt = normalizeOptionLetter(directChangeMatch[1]);
    if (opt) {
      return {
        type: 'CHANGE_ANSWER',
        action: `SELECT_${opt}`,
        label: `Option ${opt}`,
        speechFeedback: `Option ${opt} selected.`,
        targetOption: opt,
        confidence: 0.98,
      };
    }
  }

  // 3. Regular selection: "Select option B", "Choose B", "Option B", "Option 2", "Mark B", "Option bee", "Option see", "Lock B"
  // Handles English and Hindi: pehla (A), dusra (B), teesra (C), chautha (D), ek, do, teen, char, Devanagari numerals and letters
  const selectRegex = /\b(?:select|choose|pick|tick|mark|tap|click|dabao|lagao|bharo|lock|lock\s+karo|chuno|answer\s+is|ans\s+is|answer|ans)\s*(?:on\s*)?(?:options?\s*(?:number|no\.?)?)?\s*([abcd1-4]|alpha|beta|bravo|charlie|delta|first|second|third|fourth|pehla|pahla|pratham|dusra|doosra|dwitiya|teesra|tisra|tritiya|chautha|chaturth|chaar|char|ek|do|teen|bee|be|see|sea|si|dee|di|[एबीसीडी]|[१२३४])\b/i;
  const selectMatch = text.match(selectRegex);
  if (selectMatch) {
    const opt = normalizeOptionLetter(selectMatch[1]);
    if (opt) {
      return {
        type: isChangeIntent ? 'CHANGE_ANSWER' : 'SELECT_OPTION',
        action: `SELECT_${opt}`,
        label: `Option ${opt}`,
        speechFeedback: `Option ${opt} selected.`,
        targetOption: opt,
        confidence: 0.98,
      };
    }
  }

  // 4. "Option [A/B/C/D]" or "[A/B/C/D] option" or "Option bee / see / dee" or Hindi "option do / teen / char"
  const optPhraseMatch = text.match(/\boptions?\s*([abcd1-4]|alpha|beta|bravo|charlie|delta|first|second|third|fourth|pehla|pahla|pratham|dusra|doosra|dwitiya|teesra|tisra|tritiya|chautha|chaturth|chaar|char|ek|do|teen|bee|be|see|sea|si|dee|di|[एबीसीडी]|[१२३४])\b/i) ||
    text.match(/\b([abcd1-4]|alpha|beta|bravo|charlie|delta|first|second|third|fourth|pehla|pahla|pratham|dusra|doosra|dwitiya|teesra|tisra|tritiya|chautha|chaturth|chaar|char|ek|do|teen|bee|be|see|sea|si|dee|di|[एबीसीडी]|[१२३४])\s+options?\b/i);
  if (optPhraseMatch) {
    const opt = normalizeOptionLetter(optPhraseMatch[1]);
    if (opt) {
      return {
        type: isChangeIntent ? 'CHANGE_ANSWER' : 'SELECT_OPTION',
        action: `SELECT_${opt}`,
        label: `Option ${opt}`,
        speechFeedback: `Option ${opt} selected.`,
        targetOption: opt,
        confidence: 0.95,
      };
    }
  }

  // 5. Bare option name if the entire utterance is just the option: "B", "Option B", "pehla option", "Second", "bee", "see", "दो", "सी"
  const bareMatch = text.match(/^(?:option\s*)?([abcd1-4]|alpha|beta|bravo|charlie|delta|first|second|third|fourth|pehla|pahla|pratham|dusra|doosra|dwitiya|teesra|tisra|tritiya|chautha|chaturth|chaar|char|ek|do|teen|bee|be|see|sea|si|dee|di|[एबीसीडी]|[१२३४])$/i);
  if (bareMatch) {
    const opt = normalizeOptionLetter(bareMatch[1]);
    if (opt) {
      return {
        type: isChangeIntent ? 'CHANGE_ANSWER' : 'SELECT_OPTION',
        action: `SELECT_${opt}`,
        label: `Option ${opt}`,
        speechFeedback: `Option ${opt} selected.`,
        targetOption: opt,
        confidence: 0.9,
      };
    }
  }

  // 6. Hindi conversational: "B wala", "doosra wala", "pehla sahi hai", "c hoga", "b lock karo", "c ko lock karo"
  const hindiMatch = text.match(/\b([abcd1-4]|alpha|beta|bravo|charlie|delta|pehla|pahla|pratham|dusra|doosra|dwitiya|teesra|tisra|tritiya|chautha|chaturth|chaar|char|ek|do|teen|[एबीसीडी]|[१२३४])\s*(?:wala|wali|hoga|hogi|hai|sahi\s*hai|ko\s*(?:lock\s*karo)?|ko|pe|par|lock\s*karo|chuno)\b/i);
  if (hindiMatch) {
    const opt = normalizeOptionLetter(hindiMatch[1]);
    if (opt) {
      return {
        type: isChangeIntent ? 'CHANGE_ANSWER' : 'SELECT_OPTION',
        action: `SELECT_${opt}`,
        label: `Option ${opt}`,
        speechFeedback: `Option ${opt} selected.`,
        targetOption: opt,
        confidence: 0.92,
      };
    }
  }

  return null;
}

function normalizeOptionLetter(raw: string): ('A' | 'B' | 'C' | 'D') | null {
  const s = raw.toLowerCase().trim();
  switch (s) {
    case 'a': case '1': case 'one': case 'won': case 'first': case 'alpha': case 'apple':
    case 'pehla': case 'pahla': case 'pratham': case 'ek': case 'ay': case 'eh':
    case 'ए': case '१': case 'अ': case 'क':
      return 'A';
    case 'b': case '2': case 'two': case 'to': case 'too': case 'second': case 'beta': case 'bravo': case 'bee': case 'be':
    case 'dusra': case 'doosra': case 'dwitiya': case 'do':
    case 'बी': case '२': case 'ब': case 'ख':
      return 'B';
    case 'c': case '3': case 'three': case 'tree': case 'third': case 'charlie': case 'see': case 'sea': case 'si':
    case 'teesra': case 'tisra': case 'tritiya': case 'teen':
    case 'सी': case '३': case 'स': case 'ग':
      return 'C';
    case 'd': case '4': case 'four': case 'for': case 'fore': case 'fourth': case 'delta': case 'dee': case 'di': case 'the':
    case 'chautha': case 'chaturth': case 'chaar': case 'char':
    case 'डी': case '४': case 'द': case 'घ':
      return 'D';
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Master Intent Classifier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classifies raw user voice input into a semantically validated VoiceIntent.
 * Correctly accounts for negation, contrastive clauses, typos, and application context.
 */
export function classifyVoiceIntent(raw: string, context?: VoiceContext): VoiceIntent {
  const normalized = normalizeTranscript(raw);

  if (!normalized) {
    return {
      type: 'UNRECOGNIZED',
      action: 'NONE',
      label: 'Silence',
      speechFeedback: "I didn't understand. Please say that again.",
      confidence: 0,
      rawText: raw,
    };
  }

  // Special immediate check for submit dialog (where "No" / "Don't submit" is cancellation)
  if (context?.examState === 'submit-dialog' || context?.isModalOpen) {
    const dlgDirect = matchSingleClause(normalized, context);
    if (dlgDirect && (dlgDirect.type === 'CONFIRM_SUBMIT' || dlgDirect.type === 'CANCEL_SUBMIT')) {
      return {
        type: dlgDirect.type,
        action: dlgDirect.action,
        label: dlgDirect.label,
        speechFeedback: dlgDirect.speechFeedback,
        confidence: dlgDirect.confidence,
        rawText: raw,
      };
    }
  }

  // Check for sequential multi-action commands that could cause unpredictable jumps
  if (isSequentialCommand(raw)) {
    return {
      type: 'SEQUENTIAL_UNSUPPORTED',
      action: 'SEQUENTIAL_UNSUPPORTED',
      label: 'One Command at a Time',
      speechFeedback: 'Please give one command at a time.',
      confidence: 0.85,
      rawText: raw,
    };
  }

  // Decompose sentence into clauses using original punctuation/conjunctions
  const clauses = parseClauses(raw);

  // Identify positive vs negated clauses
  const positiveClauses = clauses.filter(c => !c.isNegated);
  const negatedClauses = clauses.filter(c => c.isNegated);

  // If there are positive clauses (e.g. "Don't open results, go to dashboard"),
  // match against the positive clause first!
  for (const clause of positiveClauses) {
    const match = matchSingleClause(clause.text, context);
    if (match) {
      if (/\b(?:instead\s+of|rather\s+than)\b/i.test(raw) && match.targetOption) {
        match.type = 'CHANGE_ANSWER';
      }
      return {
        type: match.type,
        action: match.action,
        label: match.label,
        speechFeedback: match.speechFeedback,
        targetOption: match.targetOption,
        targetQuestionNumber: match.targetQuestionNumber,
        targetNotificationIndex: match.targetNotificationIndex,
        targetPage: match.targetPage,
        targetExamId: match.targetExamId,
        targetExamTitle: match.targetExamTitle,
        targetExamIndex: match.targetExamIndex,
        targetCategory: match.targetCategory,
        targetDifficulty: match.targetDifficulty,
        targetTopic: match.targetTopic,
        targetSection: match.targetSection,
        targetElement: match.targetElement,
        confidence: match.confidence,
        rawText: raw,
      };
    }
  }

  // If ONLY negative clauses were provided (e.g. "Don't open the results", "Don't submit the exam")
  if (positiveClauses.length === 0 && negatedClauses.length > 0) {
    const negClause = negatedClauses[0];
    const stripped = negClause.text
      .replace(/\b(?:dont|don'?t|do not|never|mat|nahi|nahin|stop|avoid|not)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const matchedNegated = matchSingleClause(stripped, context);
    if (matchedNegated) {
      // If candidate says "Don't submit" during submit dialog, treat as cancellation
      if ((context?.examState === 'submit-dialog' || context?.isModalOpen) && matchedNegated.type === 'INITIATE_SUBMIT') {
        return {
          type: 'CANCEL_SUBMIT',
          action: 'CANCEL_NO',
          label: 'Continue Exam',
          speechFeedback: 'Resuming examination.',
          confidence: 0.95,
          rawText: raw,
        };
      }

      return {
        type: matchedNegated.type,
        action: 'NEGATED_' + matchedNegated.action,
        label: `Cancelled ${matchedNegated.label}`,
        speechFeedback: 'Understood, cancelled.',
        isNegated: true,
        confidence: matchedNegated.confidence,
        rawText: raw,
      };
    }
  }

  // Try matching the full normalized sentence as fallback
  const fullMatch = matchSingleClause(normalized, context);
  if (fullMatch) {
    return {
      type: fullMatch.type,
      action: fullMatch.action,
      label: fullMatch.label,
      speechFeedback: fullMatch.speechFeedback,
      targetOption: fullMatch.targetOption,
      targetQuestionNumber: fullMatch.targetQuestionNumber,
      targetNotificationIndex: fullMatch.targetNotificationIndex,
      targetPage: fullMatch.targetPage,
      targetExamId: fullMatch.targetExamId,
      targetExamTitle: fullMatch.targetExamTitle,
      targetExamIndex: fullMatch.targetExamIndex,
      targetCategory: fullMatch.targetCategory,
      targetDifficulty: fullMatch.targetDifficulty,
      targetTopic: fullMatch.targetTopic,
      targetSection: fullMatch.targetSection,
      targetElement: fullMatch.targetElement,
      confidence: fullMatch.confidence,
      rawText: raw,
    };
  }

  // Unclear / Ambiguous utterance
  // Check if utterance was a vague pronoun/target without context (e.g. "open it", "start it", "do that")
  const isVagueTarget = /\b(?:open it|start it|click it|do that|kholo isko|shuru karo isse)\b/i.test(normalized);

  return {
    type: isVagueTarget ? 'CLARIFY_AMBIGUOUS' : 'UNRECOGNIZED',
    action: 'NONE',
    label: isVagueTarget ? 'Please Clarify' : 'Unrecognized',
    speechFeedback: "I didn't understand. Please say that again.",
    confidence: 0.2,
    rawText: raw,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Backward-Compatible Classifier Export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Backward-compatible classifier for existing code callers.
 * Resolves to null if the action was negated or unrecognized.
 */
export function classifyVoiceCommand(raw: string, context?: VoiceContext): VoiceCommandMatch | null {
  const intent = classifyVoiceIntent(raw, context);

  // If intent was negated or unrecognized, return null to prevent accidental execution
  if (intent.isNegated || intent.type === 'UNRECOGNIZED' || intent.type === 'CLARIFY_AMBIGUOUS' || intent.type === 'SEQUENTIAL_UNSUPPORTED') {
    return null;
  }

  return {
    action: intent.action,
    label: intent.label,
    speechFeedback: intent.speechFeedback,
    intent,
  };
}
