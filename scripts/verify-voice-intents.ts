// ── Test Verification Script for Voice Command Intent Recognition ────
import {
  classifyVoiceIntent,
  classifyVoiceCommand,
  normalizeTranscript,
  parseClauses,
  VoiceContext,
} from '../src/services/voiceCommandClassifier';

interface TestCase {
  name: string;
  input: string;
  context?: VoiceContext;
  expectedType: string;
  expectedAction?: string;
  expectedOption?: string;
  expectedNegated?: boolean;
  expectedExamId?: string;
}

const testCases: TestCase[] = [
  // ── Core Scenarios from Prompt ──
  {
    name: '1. "Open mock test" should open mock test, NOT start',
    input: 'Open mock test',
    expectedType: 'OPEN_MOCK_TESTS',
    expectedAction: 'NAVIGATE_EXAMS',
  },
  {
    name: '2. "Start the mock test" should start the mock test',
    input: 'Start the mock test',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
  },
  {
    name: '3. "Open dashboard" should open dashboard',
    input: 'Open dashboard',
    expectedType: 'OPEN_DASHBOARD',
    expectedAction: 'NAVIGATE_DASHBOARD',
  },
  {
    name: '4. "Go to the next question" in exam should move to next question',
    input: 'Go to the next question',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'NEXT_QUESTION',
    expectedAction: 'NEXT',
  },
  {
    name: '5. "Go back" in exam should move to previous question',
    input: 'Go back',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'PREV_QUESTION',
    expectedAction: 'PREV',
  },
  {
    name: '6. "Go back" outside exam should perform general back navigation',
    input: 'Go back',
    context: { examState: 'none', route: '/exams' },
    expectedType: 'NAVIGATE_BACK',
    expectedAction: 'NAVIGATE_BACK',
  },
  {
    name: '7. "Read the question" should read question',
    input: 'Read the question',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'READ_QUESTION',
    expectedAction: 'READ',
  },
  {
    name: '8. "Repeat the question" should repeat question',
    input: 'Repeat the question',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'REPEAT_QUESTION',
    expectedAction: 'READ',
  },
  {
    name: '9. "Select option B" should select option B',
    input: 'Select option B',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '10. "Change my answer to C" should change answer to C',
    input: 'Change my answer to C',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01', currentAnswer: 'B' },
    expectedType: 'CHANGE_ANSWER',
    expectedAction: 'SELECT_C',
    expectedOption: 'C',
  },
  {
    name: '11. "Change my answer from B to C" should switch to C',
    input: 'Change my answer from B to C',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01', currentAnswer: 'B' },
    expectedType: 'CHANGE_ANSWER',
    expectedAction: 'SELECT_C',
    expectedOption: 'C',
  },
  {
    name: '12. "Show my results" should open results',
    input: 'Show my results',
    expectedType: 'OPEN_RESULTS',
    expectedAction: 'NAVIGATE_RESULTS',
  },
  {
    name: '13. "Submit the exam" should initiate submit confirmation dialog',
    input: 'Submit the exam',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'INITIATE_SUBMIT',
    expectedAction: 'SUBMIT',
  },

  // ── Negation and Contrast Clauses ──
  {
    name: '14. "Don\'t open the results, go back to the dashboard." -> opens dashboard, not results',
    input: "Don't open the results, go back to the dashboard.",
    expectedType: 'OPEN_DASHBOARD',
    expectedAction: 'NAVIGATE_DASHBOARD',
  },
  {
    name: '15. "Open the mock test but don\'t start it." -> opens mock test, does not start',
    input: "Open the mock test but don't start it.",
    expectedType: 'OPEN_MOCK_TESTS',
    expectedAction: 'NAVIGATE_EXAMS',
  },
  {
    name: '16. "Don\'t submit the exam, go to next question" -> next question, does not submit',
    input: "Don't submit the exam, go to next question",
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'NEXT_QUESTION',
    expectedAction: 'NEXT',
  },

  // ── Submit Dialog Safety ──
  {
    name: '17. Submit Dialog: "Yes" confirms submission',
    input: 'Yes',
    context: { examState: 'submit-dialog', route: '/exam/ssc-reasoning-01', isModalOpen: true },
    expectedType: 'CONFIRM_SUBMIT',
    expectedAction: 'CONFIRM_YES',
  },
  {
    name: '18. Submit Dialog: "Confirm" confirms submission',
    input: 'Confirm',
    context: { examState: 'submit-dialog', route: '/exam/ssc-reasoning-01', isModalOpen: true },
    expectedType: 'CONFIRM_SUBMIT',
    expectedAction: 'CONFIRM_YES',
  },
  {
    name: '19. Submit Dialog: "No" cancels submission and resumes',
    input: 'No',
    context: { examState: 'submit-dialog', route: '/exam/ssc-reasoning-01', isModalOpen: true },
    expectedType: 'CANCEL_SUBMIT',
    expectedAction: 'CANCEL_NO',
  },
  {
    name: '20. Submit Dialog: "Don\'t submit" cancels submission',
    input: "Don't submit",
    context: { examState: 'submit-dialog', route: '/exam/ssc-reasoning-01', isModalOpen: true },
    expectedType: 'CANCEL_SUBMIT',
    expectedAction: 'CANCEL_NO',
  },

  // ── Natural Variations ──
  {
    name: '21. "next" in exam -> Next Question',
    input: 'next',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'NEXT_QUESTION',
  },
  {
    name: '22. "go next" in exam -> Next Question',
    input: 'go next',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'NEXT_QUESTION',
  },
  {
    name: '23. "agla sawal" in exam -> Next Question',
    input: 'agla sawal',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'NEXT_QUESTION',
  },
  {
    name: '24. "aage badho" in exam -> Next Question',
    input: 'aage badho',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'NEXT_QUESTION',
  },
  {
    name: '25. "pichla sawal" in exam -> Previous Question',
    input: 'pichla sawal',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'PREV_QUESTION',
  },
  {
    name: '26. "sawal padho" in exam -> Read Question',
    input: 'sawal padho',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'READ_QUESTION',
  },

  // ── Whisper Transcription Error / Typo Tolerance ──
  {
    name: '27. Whisper Typo: "nex question" -> Next Question',
    input: 'nex question',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'NEXT_QUESTION',
  },
  {
    name: '28. Whisper Typo: "neck question" -> Next Question',
    input: 'neck question',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'NEXT_QUESTION',
  },
  {
    name: '29. Whisper Typo: "deshboard" -> Dashboard',
    input: 'open deshboard',
    expectedType: 'OPEN_DASHBOARD',
  },
  {
    name: '30. Whisper Typo: "submition" -> Submit Exam',
    input: 'submition',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'INITIATE_SUBMIT',
  },
  {
    name: '31. Phonetic Letter: "option bee" -> Option B',
    input: 'option bee',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'SELECT_OPTION',
    expectedOption: 'B',
  },
  {
    name: '32. Phonetic Letter: "option see" -> Option C',
    input: 'option see',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'SELECT_OPTION',
    expectedOption: 'C',
  },

  // ── Ambiguity Handling & Sequential Guard ──
  {
    name: '33. Vague pronoun: "open it" -> CLARIFY_AMBIGUOUS (no guess)',
    input: 'open it',
    expectedType: 'CLARIFY_AMBIGUOUS',
  },
  {
    name: '34. Sequential command: "Read question 5 and then go to the next question" -> SEQUENTIAL_UNSUPPORTED',
    input: 'Read question 5 and then go to the next question',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'SEQUENTIAL_UNSUPPORTED',
  },

  // ── Conversational Prefixes & Sub-features ──
  {
    name: '35. Conversational prefix: "Hey listen, open mock test" -> OPEN_MOCK_TESTS (not start)',
    input: 'Hey listen, open mock test',
    expectedType: 'OPEN_MOCK_TESTS',
    expectedAction: 'NAVIGATE_EXAMS',
  },
  {
    name: '36. Conversational prefix: "Hey listen, start the mock test" -> START_EXAM',
    input: 'Hey listen, start the mock test',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
  },
  {
    name: '37. Navigation: "Please open study materials" -> OPEN_STUDY_MATERIALS',
    input: 'Please open study materials',
    expectedType: 'OPEN_STUDY_MATERIALS',
    expectedAction: 'NAVIGATE_STUDY_MATERIALS',
  },
  {
    name: '38. Navigation: "Open past year papers" -> OPEN_PYQS',
    input: 'Open past year papers',
    expectedType: 'OPEN_PYQS',
    expectedAction: 'NAVIGATE_PYQS',
  },
  {
    name: '39. Navigation: "Open exam history" -> OPEN_EXAM_HISTORY',
    input: 'Open exam history',
    expectedType: 'OPEN_EXAM_HISTORY',
    expectedAction: 'NAVIGATE_HISTORY',
  },
  {
    name: '40. Universal Accessibility: "Switch to dark mode" -> THEME_DARK',
    input: 'Switch to dark mode',
    expectedType: 'THEME_DARK',
    expectedAction: 'THEME_DARK',
  },
  {
    name: '41. Universal Accessibility: "Yellow on black" -> THEME_YELLOW',
    input: 'Yellow on black',
    expectedType: 'THEME_YELLOW',
    expectedAction: 'THEME_YELLOW',
  },
  {
    name: '42. Universal Accessibility: "Huge font" -> FONT_HUGE',
    input: 'Huge font',
    expectedType: 'FONT_HUGE',
    expectedAction: 'FONT_HUGE',
  },
  {
    name: '43. System: "Log out" -> LOGOUT',
    input: 'Log out',
    expectedType: 'LOGOUT',
    expectedAction: 'LOGOUT',
  },
  {
    name: '44. Feature Guidance: "Guide me" -> HELP',
    input: 'Guide me',
    expectedType: 'HELP',
    expectedAction: 'HELP',
  },
  {
    name: '45. Conversational multi-turn: "Open mathematics mock test" -> OPEN_EXAM_OVERVIEW (not start)',
    input: 'Open mathematics mock test',
    expectedType: 'OPEN_EXAM_OVERVIEW',
    expectedAction: 'OPEN_EXAM_OVERVIEW',
    expectedExamId: 'banking-quant-01',
  },
  {
    name: '46. Conversational pronoun follow-up: "Start it" with memory -> START_EXAM (starts mathematics mock)',
    input: 'Start it',
    context: {
      conversationalState: {
        lastTargetExamId: 'banking-quant-01',
        lastTargetExamTitle: 'Mathematics',
      },
    },
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
    expectedExamId: 'banking-quant-01',
  },
  {
    name: '47. Disambiguate isolated target: "mock test" -> CLARIFY_AMBIGUOUS (no guess)',
    input: 'mock test',
    expectedType: 'CLARIFY_AMBIGUOUS',
    expectedAction: 'NONE',
  },
  {
    name: '48. Disambiguate isolated target: "the exam" -> CLARIFY_AMBIGUOUS (no guess)',
    input: 'the exam',
    expectedType: 'CLARIFY_AMBIGUOUS',
    expectedAction: 'NONE',
  },
  {
    name: '49. Universal repeat: "Repeat that" -> REPEAT_LAST',
    input: 'Repeat that',
    expectedType: 'REPEAT_LAST',
    expectedAction: 'REPEAT_LAST',
  },
  {
    name: '50. Voice safety contrast: "select C instead of B" -> CHANGE_ANSWER (Option C)',
    input: 'select C instead of B',
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'CHANGE_ANSWER',
    expectedAction: 'SELECT_C',
    expectedOption: 'C',
  },
  {
    name: '51. Voice safety contrast: "open but don\'t start" -> OPEN_MOCK_TESTS (does not start)',
    input: "open but don't start",
    expectedType: 'OPEN_MOCK_TESTS',
    expectedAction: 'NAVIGATE_EXAMS',
  },
  {
    name: '52. Voice safety negation: "don\'t submit yet" in exam -> INITIATE_SUBMIT (negated = true)',
    input: "don't submit yet",
    context: { examState: 'in-progress', route: '/exam/ssc-reasoning-01' },
    expectedType: 'INITIATE_SUBMIT',
    expectedNegated: true,
  },
  {
    name: '53. Voice safety dialog: "Don\'t submit" in submit-dialog -> CANCEL_SUBMIT',
    input: "Don't submit",
    context: { examState: 'submit-dialog', route: '/exam/ssc-reasoning-01', isModalOpen: true },
    expectedType: 'CANCEL_SUBMIT',
    expectedAction: 'CANCEL_NO',
  },
  {
    name: '54. Notifications: "Open notifications" -> OPEN_NOTIFICATIONS',
    input: 'Open notifications',
    expectedType: 'OPEN_NOTIFICATIONS',
    expectedAction: 'OPEN_NOTIFICATIONS',
  },
  {
    name: '55. Hindi Devanagari: "अगला सवाल" in exam -> NEXT_QUESTION',
    input: 'अगला सवाल',
    context: { route: '/exam/mock-1', examState: 'in-progress', currentQuestionIndex: 2, totalQuestions: 10 },
    expectedType: 'NEXT_QUESTION',
    expectedAction: 'NEXT',
  },
  {
    name: '56. Hindi Devanagari: "पिछला सवाल" in exam -> PREV_QUESTION',
    input: 'पिछला सवाल',
    context: { route: '/exam/mock-1', examState: 'in-progress', currentQuestionIndex: 2, totalQuestions: 10 },
    expectedType: 'PREV_QUESTION',
    expectedAction: 'PREV',
  },
  {
    name: '57. Hindi Devanagari: "ऑप्शन बी" in exam -> SELECT_OPTION (B)',
    input: 'ऑप्शन बी',
    context: { route: '/exam/mock-1', examState: 'in-progress', currentQuestionIndex: 2, totalQuestions: 10 },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '58. Hindi Devanagari: "सबमिट करो" in exam -> INITIATE_SUBMIT',
    input: 'सबमिट करो',
    context: { route: '/exam/mock-1', examState: 'in-progress', currentQuestionIndex: 2, totalQuestions: 10 },
    expectedType: 'INITIATE_SUBMIT',
    expectedAction: 'SUBMIT',
  },
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('  VOICE COMMAND INTENT RECOGNITION TEST SUITE');
console.log('═══════════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = classifyVoiceIntent(tc.input, tc.context);
  let ok = true;
  const errors: string[] = [];

  if (result.type !== tc.expectedType) {
    ok = false;
    errors.push(`Expected type "${tc.expectedType}" but got "${result.type}"`);
  }
  if (tc.expectedAction && result.action !== tc.expectedAction) {
    ok = false;
    errors.push(`Expected action "${tc.expectedAction}" but got "${result.action}"`);
  }
  if (tc.expectedOption && result.targetOption !== tc.expectedOption) {
    ok = false;
    errors.push(`Expected targetOption "${tc.expectedOption}" but got "${result.targetOption}"`);
  }
  if (tc.expectedNegated !== undefined && result.isNegated !== tc.expectedNegated) {
    ok = false;
    errors.push(`Expected isNegated=${tc.expectedNegated} but got ${result.isNegated}`);
  }
  if (tc.expectedExamId && result.targetExamId !== tc.expectedExamId) {
    ok = false;
    errors.push(`Expected targetExamId "${tc.expectedExamId}" but got "${result.targetExamId}"`);
  }

  if (ok) {
    console.log(`✅ PASS: ${tc.name}`);
    console.log(`   Input: "${tc.input}" → [${result.type}] action=${result.action} speech="${result.speechFeedback}"`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${tc.name}`);
    console.error(`   Input: "${tc.input}"`);
    console.error(`   Errors: ${errors.join(', ')}`);
    failed++;
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  RESULT: ${passed} PASSED / ${failed} FAILED (Total: ${testCases.length})`);
console.log('═══════════════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL VOICE INTENT TEST CASES PASSED PERFECTLY!\n');
}
