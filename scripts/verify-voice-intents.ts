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
  expectedCategory?: string;
  expectedDifficulty?: string;
  expectedTopic?: string;
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
  // ── Drishti Personalized Voice Assistant Wake Word & Commands ──
  {
    name: '59. "Drishti start exam" -> START_EXAM',
    input: 'Drishti start exam',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
  },
  {
    name: '60. "Drishti read notification" -> OPEN_NOTIFICATIONS',
    input: 'Drishti read notification',
    expectedType: 'OPEN_NOTIFICATIONS',
    expectedAction: 'OPEN_NOTIFICATIONS',
  },
  {
    name: '61. "Drishti read notifications" -> OPEN_NOTIFICATIONS',
    input: 'Drishti read notifications',
    expectedType: 'OPEN_NOTIFICATIONS',
    expectedAction: 'OPEN_NOTIFICATIONS',
  },
  {
    name: '62. "Hey Drishti read my notifications" -> OPEN_NOTIFICATIONS',
    input: 'Hey Drishti read my notifications',
    expectedType: 'OPEN_NOTIFICATIONS',
    expectedAction: 'OPEN_NOTIFICATIONS',
  },
  {
    name: '63. "Hey Drishti" -> DRISHTI_WAKE',
    input: 'Hey Drishti',
    expectedType: 'DRISHTI_WAKE',
    expectedAction: 'DRISHTI_WAKE',
  },
  {
    name: '64. "Drishti" standalone wake word -> DRISHTI_WAKE',
    input: 'Drishti',
    expectedType: 'DRISHTI_WAKE',
    expectedAction: 'DRISHTI_WAKE',
  },
  {
    name: '65. "Drishti who are you" -> DRISHTI_INTRO',
    input: 'Drishti who are you',
    expectedType: 'DRISHTI_INTRO',
    expectedAction: 'DRISHTI_INTRO',
  },
  {
    name: '66. "Drishti next question" in exam -> NEXT_QUESTION',
    input: 'Drishti next question',
    context: { route: '/exam/mock-1', examState: 'in-progress', currentQuestionIndex: 1, totalQuestions: 10 },
    expectedType: 'NEXT_QUESTION',
    expectedAction: 'NEXT',
  },
  {
    name: '67. "Drishti select option B" in exam -> SELECT_OPTION (B)',
    input: 'Drishti select option B',
    context: { route: '/exam/mock-1', examState: 'in-progress', currentQuestionIndex: 1, totalQuestions: 10 },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '68. "Drishti time remaining" in exam -> TIME_REMAINING',
    input: 'Drishti time remaining',
    context: { route: '/exam/mock-1', examState: 'in-progress' },
    expectedType: 'TIME_REMAINING',
    expectedAction: 'TIME',
  },
  {
    name: '69. Suffix wake word: "start exam Drishti" -> START_EXAM',
    input: 'start exam Drishti',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
  },
  {
    name: '70. Suffix wake word: "read notification Drishti" -> OPEN_NOTIFICATIONS',
    input: 'read notification Drishti',
    expectedType: 'OPEN_NOTIFICATIONS',
    expectedAction: 'OPEN_NOTIFICATIONS',
  },
  // ── SIGHT-EXAM Hindi + Hinglish 12 Commands Benchmark ──
  {
    name: '71. "next question" in exam -> NEXT_QUESTION',
    input: 'next question',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'NEXT_QUESTION',
    expectedAction: 'NEXT',
  },
  {
    name: '72. "agla question kholo" in exam -> NEXT_QUESTION',
    input: 'agla question kholo',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'NEXT_QUESTION',
    expectedAction: 'NEXT',
  },
  {
    name: '73. "अगला प्रश्न खोलो" in exam -> NEXT_QUESTION',
    input: 'अगला प्रश्न खोलो',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'NEXT_QUESTION',
    expectedAction: 'NEXT',
  },
  {
    name: '74. "pichla question" in exam -> PREV_QUESTION',
    input: 'pichla question',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'PREV_QUESTION',
    expectedAction: 'PREV',
  },
  {
    name: '75. "पिछला प्रश्न खोलो" in exam -> PREV_QUESTION',
    input: 'पिछला प्रश्न खोलो',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'PREV_QUESTION',
    expectedAction: 'PREV',
  },
  {
    name: '76. "option B select karo" in exam -> SELECT_OPTION (B)',
    input: 'option B select karo',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '77. "option C choose karo" in exam -> SELECT_OPTION (C)',
    input: 'option C choose karo',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_C',
    expectedOption: 'C',
  },
  {
    name: '78. "question number 5 par jao" in exam -> GOTO_QUESTION',
    input: 'question number 5 par jao',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'GOTO_QUESTION',
    expectedAction: 'GOTO_5',
  },
  {
    name: '79. "question number 12 par jao" in exam -> GOTO_QUESTION',
    input: 'question number 12 par jao',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'GOTO_QUESTION',
    expectedAction: 'GOTO_12',
  },
  {
    name: '80. "question padh ke sunao" in exam -> READ_QUESTION',
    input: 'question padh ke sunao',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'READ_QUESTION',
    expectedAction: 'READ',
  },
  {
    name: '81. "question repeat karo" in exam -> REPEAT_QUESTION',
    input: 'question repeat karo',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'REPEAT_QUESTION',
    expectedAction: 'READ',
  },
  {
    name: '82. "answer submit karo" in exam -> INITIATE_SUBMIT',
    input: 'answer submit karo',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'INITIATE_SUBMIT',
    expectedAction: 'SUBMIT',
  },
  {
    name: '83. "lock option B" in exam -> SELECT_OPTION (B)',
    input: 'lock option B',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '84. "B lock karo" in exam -> SELECT_OPTION (B)',
    input: 'B lock karo',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '85. "option do" in exam -> SELECT_OPTION (B)',
    input: 'option do',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '86. "chautha option" in exam -> SELECT_OPTION (D)',
    input: 'chautha option',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_D',
    expectedOption: 'D',
  },
  {
    name: '87. "pehla option" in exam -> SELECT_OPTION (A)',
    input: 'pehla option',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_A',
    expectedOption: 'A',
  },
  {
    name: '88. "teesra option choose karo" in exam -> SELECT_OPTION (C)',
    input: 'teesra option choose karo',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_C',
    expectedOption: 'C',
  },
  {
    name: '89. "option 3" in exam -> SELECT_OPTION (C)',
    input: 'option 3',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_C',
    expectedOption: 'C',
  },
  {
    name: '90. "ऑप्शन बी" in exam -> SELECT_OPTION (B)',
    input: 'ऑप्शन बी',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '91. "ans D" in exam -> SELECT_OPTION (D)',
    input: 'ans D',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_D',
    expectedOption: 'D',
  },
  {
    name: '92. "lock B" in exam -> SELECT_OPTION (B)',
    input: 'lock B',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '93. "login as student" -> DEMO_STUDENT_LOGIN',
    input: 'login as student',
    expectedType: 'DEMO_STUDENT_LOGIN',
    expectedAction: 'DEMO_STUDENT_LOGIN',
  },
  {
    name: '94. "demo student" -> DEMO_STUDENT_LOGIN',
    input: 'demo student',
    expectedType: 'DEMO_STUDENT_LOGIN',
    expectedAction: 'DEMO_STUDENT_LOGIN',
  },
  {
    name: '95. "login as admin" -> DEMO_ADMIN_LOGIN',
    input: 'login as admin',
    expectedType: 'DEMO_ADMIN_LOGIN',
    expectedAction: 'DEMO_ADMIN_LOGIN',
  },
  {
    name: '96. "demo admin" -> DEMO_ADMIN_LOGIN',
    input: 'demo admin',
    expectedType: 'DEMO_ADMIN_LOGIN',
    expectedAction: 'DEMO_ADMIN_LOGIN',
  },
  {
    name: '97. "open login" -> OPEN_LOGIN',
    input: 'open login',
    expectedType: 'OPEN_LOGIN',
    expectedAction: 'NAVIGATE_LOGIN',
  },
  {
    name: '98. "go to login page" -> OPEN_LOGIN',
    input: 'go to login page',
    expectedType: 'OPEN_LOGIN',
    expectedAction: 'NAVIGATE_LOGIN',
  },
  {
    name: '99. "create account" -> OPEN_REGISTER',
    input: 'create account',
    expectedType: 'OPEN_REGISTER',
    expectedAction: 'NAVIGATE_REGISTER',
  },
  {
    name: '100. "open register" -> OPEN_REGISTER',
    input: 'open register',
    expectedType: 'OPEN_REGISTER',
    expectedAction: 'NAVIGATE_REGISTER',
  },
  {
    name: '101. "open admin dashboard" -> OPEN_ADMIN',
    input: 'open admin dashboard',
    expectedType: 'OPEN_ADMIN',
    expectedAction: 'NAVIGATE_ADMIN',
  },
  {
    name: '102. "admin panel" -> OPEN_ADMIN',
    input: 'admin panel',
    expectedType: 'OPEN_ADMIN',
    expectedAction: 'NAVIGATE_ADMIN',
  },
  {
    name: '103. "verify answer" in practice -> VERIFY_ANSWER',
    input: 'verify answer',
    context: { route: '/practice' },
    expectedType: 'VERIFY_ANSWER',
    expectedAction: 'VERIFY_ANSWER',
  },
  {
    name: '104. "check answer" in practice -> VERIFY_ANSWER',
    input: 'check answer',
    context: { route: '/practice' },
    expectedType: 'VERIFY_ANSWER',
    expectedAction: 'VERIFY_ANSWER',
  },
  {
    name: '105. "give me a hint" in practice -> PRACTICE_HINT',
    input: 'give me a hint',
    context: { route: '/practice' },
    expectedType: 'PRACTICE_HINT',
    expectedAction: 'PRACTICE_HINT',
  },
  {
    name: '106. "need a hint" in practice -> PRACTICE_HINT',
    input: 'need a hint',
    context: { route: '/practice' },
    expectedType: 'PRACTICE_HINT',
    expectedAction: 'PRACTICE_HINT',
  },
  {
    name: '107. "try again" in practice -> PRACTICE_RETRY',
    input: 'try again',
    context: { route: '/practice' },
    expectedType: 'PRACTICE_RETRY',
    expectedAction: 'PRACTICE_RETRY',
  },
  {
    name: '108. "retry question" in practice -> PRACTICE_RETRY',
    input: 'retry question',
    context: { route: '/practice' },
    expectedType: 'PRACTICE_RETRY',
    expectedAction: 'PRACTICE_RETRY',
  },
  {
    name: '109. "change topic" in practice -> PRACTICE_TOPIC',
    input: 'change topic',
    context: { route: '/practice' },
    expectedType: 'PRACTICE_TOPIC',
    expectedAction: 'PRACTICE_TOPIC',
  },
  {
    name: '110. "switch topic" in practice -> PRACTICE_TOPIC',
    input: 'switch topic',
    context: { route: '/practice' },
    expectedType: 'PRACTICE_TOPIC',
    expectedAction: 'PRACTICE_TOPIC',
  },
  {
    name: '111. "filter category ssc" -> FILTER_CATEGORY (SSC)',
    input: 'filter category ssc',
    expectedType: 'FILTER_CATEGORY',
    expectedAction: 'FILTER_CATEGORY_SSC',
    expectedCategory: 'SSC',
  },
  {
    name: '112. "show banking exams" -> FILTER_CATEGORY (Banking)',
    input: 'show banking exams',
    expectedType: 'FILTER_CATEGORY',
    expectedAction: 'FILTER_CATEGORY_BANKING',
    expectedCategory: 'Banking',
  },
  {
    name: '113. "filter railway" -> FILTER_CATEGORY (Railway)',
    input: 'filter railway',
    expectedType: 'FILTER_CATEGORY',
    expectedAction: 'FILTER_CATEGORY_RAILWAY',
    expectedCategory: 'Railway',
  },
  {
    name: '114. "filter upsc" -> FILTER_CATEGORY (UPSC)',
    input: 'filter upsc',
    expectedType: 'FILTER_CATEGORY',
    expectedAction: 'FILTER_CATEGORY_UPSC',
    expectedCategory: 'UPSC',
  },
  {
    name: '115. "filter difficulty easy" -> FILTER_DIFFICULTY (Easy)',
    input: 'filter difficulty easy',
    expectedType: 'FILTER_DIFFICULTY',
    expectedAction: 'FILTER_DIFFICULTY_EASY',
    expectedDifficulty: 'Easy',
  },
  {
    name: '116. "show hard exams" -> FILTER_DIFFICULTY (Hard)',
    input: 'show hard exams',
    expectedType: 'FILTER_DIFFICULTY',
    expectedAction: 'FILTER_DIFFICULTY_HARD',
    expectedDifficulty: 'Hard',
  },
  {
    name: '117. "filter medium difficulty" -> FILTER_DIFFICULTY (Medium)',
    input: 'filter medium difficulty',
    expectedType: 'FILTER_DIFFICULTY',
    expectedAction: 'FILTER_DIFFICULTY_MEDIUM',
    expectedDifficulty: 'Medium',
  },
  {
    name: '118. "clear all filters" -> RESET_FILTERS',
    input: 'clear all filters',
    expectedType: 'RESET_FILTERS',
    expectedAction: 'RESET_FILTERS',
  },
  {
    name: '119. "reset filters" -> RESET_FILTERS',
    input: 'reset filters',
    expectedType: 'RESET_FILTERS',
    expectedAction: 'RESET_FILTERS',
  },
  {
    name: '120. "option 1" in exam -> SELECT_OPTION (A)',
    input: 'option 1',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_A',
    expectedOption: 'A',
  },
  {
    name: '121. "option 2" in exam -> SELECT_OPTION (B)',
    input: 'option 2',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '122. "option 4" in exam -> SELECT_OPTION (D)',
    input: 'option 4',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_D',
    expectedOption: 'D',
  },
  {
    name: '123. "alpha" in exam -> SELECT_OPTION (A)',
    input: 'alpha',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_A',
    expectedOption: 'A',
  },
  {
    name: '124. "bravo" in exam -> SELECT_OPTION (B)',
    input: 'bravo',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '125. "charlie" in exam -> SELECT_OPTION (C)',
    input: 'charlie',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_C',
    expectedOption: 'C',
  },
  {
    name: '126. "delta" in exam -> SELECT_OPTION (D)',
    input: 'delta',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_D',
    expectedOption: 'D',
  },
  {
    name: '127. "pehla option" in exam -> SELECT_OPTION (A)',
    input: 'pehla option',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_A',
    expectedOption: 'A',
  },
  {
    name: '128. "dusra option" in exam -> SELECT_OPTION (B)',
    input: 'dusra option',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '129. "chautha option" in exam -> SELECT_OPTION (D)',
    input: 'chautha option',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_D',
    expectedOption: 'D',
  },
  {
    name: '130. "option ek" in exam -> SELECT_OPTION (A)',
    input: 'option ek',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_A',
    expectedOption: 'A',
  },
  {
    name: '131. "option do" in exam -> SELECT_OPTION (B)',
    input: 'option do',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '132. "option chaar" in exam -> SELECT_OPTION (D)',
    input: 'option chaar',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_D',
    expectedOption: 'D',
  },
  {
    name: '133. "B wala" in exam -> SELECT_OPTION (B)',
    input: 'B wala',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '134. "C sahi hai" in exam -> SELECT_OPTION (C)',
    input: 'C sahi hai',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_C',
    expectedOption: 'C',
  },
  {
    name: '135. "lock option B" in exam -> SELECT_OPTION (B)',
    input: 'lock option B',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_B',
    expectedOption: 'B',
  },
  {
    name: '136. "C ko lock karo" in exam -> SELECT_OPTION (C)',
    input: 'C ko lock karo',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'SELECT_OPTION',
    expectedAction: 'SELECT_C',
    expectedOption: 'C',
  },
  {
    name: '137. "start banking exam" -> START_EXAM (banking-quant-01)',
    input: 'start banking exam',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
    expectedExamId: 'banking-quant-01',
  },
  {
    name: '138. "start upsc exam" -> START_EXAM (upsc-gs1-01)',
    input: 'start upsc exam',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
    expectedExamId: 'upsc-gs1-01',
  },
  {
    name: '139. "start railway exam" -> START_EXAM (railway-gk-01)',
    input: 'start railway exam',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
    expectedExamId: 'railway-gk-01',
  },
  {
    name: '140. "start defence exam" -> START_EXAM (defence-nda-01)',
    input: 'start defence exam',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
    expectedExamId: 'defence-nda-01',
  },
  {
    name: '141. "start state psc exam" -> START_EXAM (state-psc-01)',
    input: 'start state psc exam',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
    expectedExamId: 'state-psc-01',
  },
  {
    name: '142. "start test 2" -> START_EXAM (banking-quant-01)',
    input: 'start test 2',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
    expectedExamId: 'banking-quant-01',
  },
  {
    name: '143. "start test 5" -> START_EXAM (defence-nda-01)',
    input: 'start test 5',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
    expectedExamId: 'defence-nda-01',
  },
  {
    name: '144. "start test 6" -> START_EXAM (state-psc-01)',
    input: 'start test 6',
    expectedType: 'START_EXAM',
    expectedAction: 'START_EXAM',
    expectedExamId: 'state-psc-01',
  },
  {
    name: '145. "back" in exam -> PREV_QUESTION',
    input: 'back',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'PREV_QUESTION',
    expectedAction: 'PREV',
  },
  {
    name: '146. "go back" in exam -> PREV_QUESTION',
    input: 'go back',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'PREV_QUESTION',
    expectedAction: 'PREV',
  },
  {
    name: '147. "cancel" in exam -> CLEAR_ANSWER',
    input: 'cancel',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'CLEAR_ANSWER',
    expectedAction: 'CLEAR',
  },
  {
    name: '148. "marks" in exam -> EXAM_STATUS (action MARKS)',
    input: 'marks',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'EXAM_STATUS',
    expectedAction: 'MARKS',
  },
  {
    name: '149. "score" in exam -> EXAM_STATUS (action MARKS)',
    input: 'score',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'EXAM_STATUS',
    expectedAction: 'MARKS',
  },
  {
    name: '150. "result" in exam -> EXAM_STATUS (action MARKS)',
    input: 'result',
    context: { examState: 'in-progress', route: '/exam/mock-1' },
    expectedType: 'EXAM_STATUS',
    expectedAction: 'MARKS',
  },
  {
    name: '151. "filter defence" -> FILTER_CATEGORY (Defence)',
    input: 'filter defence',
    expectedType: 'FILTER_CATEGORY',
    expectedAction: 'FILTER_CATEGORY_DEFENCE',
    expectedCategory: 'Defence',
  },
  {
    name: '152. "filter state psc" -> FILTER_CATEGORY (State PSC)',
    input: 'filter state psc',
    expectedType: 'FILTER_CATEGORY',
    expectedAction: 'FILTER_CATEGORY_STATE_PSC',
    expectedCategory: 'State PSC',
  },
  {
    name: '153. "get started" -> OPEN_DASHBOARD',
    input: 'get started',
    expectedType: 'OPEN_DASHBOARD',
    expectedAction: 'NAVIGATE_DASHBOARD',
  },
  {
    name: '154. "get start" -> OPEN_DASHBOARD',
    input: 'get start',
    expectedType: 'OPEN_DASHBOARD',
    expectedAction: 'NAVIGATE_DASHBOARD',
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
  if (tc.expectedCategory && result.targetCategory !== tc.expectedCategory) {
    ok = false;
    errors.push(`Expected targetCategory "${tc.expectedCategory}" but got "${result.targetCategory}"`);
  }
  if (tc.expectedDifficulty && result.targetDifficulty !== tc.expectedDifficulty) {
    ok = false;
    errors.push(`Expected targetDifficulty "${tc.expectedDifficulty}" but got "${result.targetDifficulty}"`);
  }
  if (tc.expectedTopic && result.targetTopic !== tc.expectedTopic) {
    ok = false;
    errors.push(`Expected targetTopic "${tc.expectedTopic}" but got "${result.targetTopic}"`);
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
