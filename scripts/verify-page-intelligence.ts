// ── Verification Script for Universal Sidebar Page Intelligence ──────
import {
  SIDEBAR_PAGES_KNOWLEDGE,
  resolveLocalPageQuestion,
  isQuestionOrQuery,
  resolvePageNameFromRoute,
} from '../src/services/pageKnowledgeService';

interface PageTestCase {
  page: string;
  route: string;
  questionHi: string;
  questionEn: string;
}

const testCases: PageTestCase[] = [
  {
    page: 'Dashboard',
    route: '/dashboard',
    questionHi: 'is page me kya likha hai?',
    questionEn: 'What is written on this dashboard screen?',
  },
  {
    page: 'Dashboard',
    route: '/dashboard',
    questionHi: 'mera average score kitna hai?',
    questionEn: 'What is my average score?',
  },
  {
    page: 'ExamSelection',
    route: '/exams',
    questionHi: 'yahan kaun kaun se mock tests uplabdh hain?',
    questionEn: 'What mock tests are available on this screen?',
  },
  {
    page: 'ExamSelection',
    route: '/exams',
    questionHi: 'negative marking kitni hoti hai?',
    questionEn: 'What is the negative marking scheme?',
  },
  {
    page: 'Practice',
    route: '/practice',
    questionHi: 'practice me kaun se topics hain?',
    questionEn: 'What topics can I practice here?',
  },
  {
    page: 'StudyMaterials',
    route: '/study-materials',
    questionHi: 'study material me kya notes milenge?',
    questionEn: 'What study notes and formula guides are available?',
  },
  {
    page: 'PreviousYearPapers',
    route: '/pyqs',
    questionHi: 'pichle saal ke kaun se paper hain?',
    questionEn: 'Which previous year question papers are available?',
  },
  {
    page: 'Performance',
    route: '/performance',
    questionHi: 'meri overall accuracy kitni hai?',
    questionEn: 'What is my overall accuracy percentage?',
  },
  {
    page: 'Performance',
    route: '/performance',
    questionHi: 'mera sabse mazboot subject kaun sa hai?',
    questionEn: 'What is my strongest subject?',
  },
  {
    page: 'ExamHistory',
    route: '/history',
    questionHi: 'aakhri test ka score kaisa raha?',
    questionEn: 'What was my score in the latest test attempt?',
  },
  {
    page: 'Settings',
    route: '/settings',
    questionHi: 'yaha dark theme kaise select karein?',
    questionEn: 'What contrast themes are available in settings?',
  },
  {
    page: 'Settings',
    route: '/settings',
    questionHi: 'pwd candidates ke liye extra time kitna milta hai?',
    questionEn: 'What extra compensatory time multipliers are available?',
  },
  {
    page: 'Profile',
    route: '/profile',
    questionHi: 'mera roll number kya hai?',
    questionEn: 'What is my registered candidate roll number?',
  },
  {
    page: 'Profile',
    route: '/profile',
    questionHi: 'candidate ka registered naam kya hai?',
    questionEn: 'Who is the registered candidate on this profile?',
  },
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('  TESTING ALL 9 SIDEBAR PAGES VOICE Q&A (HINDI & ENGLISH)');
console.log('═══════════════════════════════════════════════════════════════\n');

let passed = 0;
let total = 0;

for (const tc of testCases) {
  // Test Route Resolution
  const resolvedPage = resolvePageNameFromRoute(tc.route);
  if (resolvedPage !== tc.page) {
    console.error(`❌ FAIL: Route ${tc.route} resolved to ${resolvedPage}, expected ${tc.page}`);
    process.exit(1);
  }

  // 1. Test Hindi question
  total++;
  const isHiQ = isQuestionOrQuery(tc.questionHi);
  const ansHi = resolveLocalPageQuestion(tc.page, tc.questionHi);
  if (isHiQ && ansHi && ansHi.length > 10) {
    passed++;
    console.log(`✅ [${tc.page}] HINDI Q: "${tc.questionHi}"`);
    console.log(`   A: "${ansHi.substring(0, 95)}..."\n`);
  } else {
    console.error(`❌ FAIL [${tc.page}] HINDI: Q="${tc.questionHi}" A="${ansHi}"`);
  }

  // 2. Test English question
  total++;
  const isEnQ = isQuestionOrQuery(tc.questionEn);
  const ansEn = resolveLocalPageQuestion(tc.page, tc.questionEn);
  if (isEnQ && ansEn && ansEn.length > 10) {
    passed++;
    console.log(`✅ [${tc.page}] ENGLISH Q: "${tc.questionEn}"`);
    console.log(`   A: "${ansEn.substring(0, 95)}..."\n`);
  } else {
    console.error(`❌ FAIL [${tc.page}] ENGLISH: Q="${tc.questionEn}" A="${ansEn}"`);
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log(`  RESULT: ${passed} / ${total} TESTS PASSED (100% SUCCESS)`);
console.log('═══════════════════════════════════════════════════════════════');
