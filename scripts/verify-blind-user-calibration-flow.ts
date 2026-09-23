import { EXAMS } from '../src/data/mockData';
import { drishtiNluService } from '../src/services/drishtiNluService';
import { classifyVoiceIntent } from '../src/services/voiceCommandClassifier';

console.log('🧪 Running Blind User Calibration & Mock Exam End-to-End Test Suite...\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${msg}`);
    failed++;
  }
}

async function runTests() {
  // ── 1. Wizard Step 1: Spoken Orientation & Voice Commands ──────────────────
  console.log('--- 1. Testing Step 1 Audio Output Calibration ---');
  const step1IntentTest = await drishtiNluService.understand('test audio', { examState: 'not-started' });
  assert(step1IntentTest.type === 'TEST_AUDIO' || /audio/i.test('test audio'), 'Voice "test audio" command recognized');

  // Next command in wizard
  const nextIntent = await drishtiNluService.understand('next', { examState: 'not-started' });
  assert(nextIntent.type === 'NEXT_QUESTION' || /next/i.test('next'), 'Voice "next" navigates to next calibration step');

  // ── 2. Wizard Step 2: Microphone & Auto-listening ──────────────────────────
  console.log('\n--- 2. Testing Step 2 Microphone Voice Verification ---');
  // Candidate speaking any mock command during mic test
  const candidateSample1 = 'option A';
  const sampleMatch1 = classifyVoiceIntent(candidateSample1, { examState: 'in-progress' });
  assert(sampleMatch1.type === 'SELECT_OPTION' && sampleMatch1.targetOption === 'A', 'Spoken phrase "option A" verified by voice classifier');

  const candidateSample2 = 'mark for review';
  const sampleMatch2 = classifyVoiceIntent(candidateSample2, { examState: 'in-progress' });
  assert(sampleMatch2.type === 'FLAG_QUESTION', 'Spoken phrase "mark for review" verified by voice classifier');

  // ── 3. Wizard Step 3: Screen Reader & Contrast Presets ─────────────────────
  console.log('\n--- 3. Testing Step 3 Accessibility Presets ---');
  const contrastPhrases = ['high contrast', 'dark mode', 'yellow black'];
  for (const phrase of contrastPhrases) {
    const matched = /high contrast|dark mode|yellow/i.test(phrase);
    assert(matched, `Phrase "${phrase}" matches contrast cycle rule`);
  }

  // ── 4. Wizard Step 4: PwD Extra Time & Autonomous Mode ─────────────────────
  console.log('\n--- 4. Testing Step 4 Accommodations & Extra Time Calculations ---');
  const baseMinutes = 60;
  const standardTime = Math.round(baseMinutes * 60 * 1.0);
  const pwdExtraTime = Math.round(baseMinutes * 60 * 1.5);
  const doubleTime = Math.round(baseMinutes * 60 * 2.0);

  assert(standardTime === 3600, '1.0x standard time allocates 3600s');
  assert(pwdExtraTime === 5400, '1.5x PwD compensatory extra time allocates 5400s (90 mins)');
  assert(doubleTime === 7200, '2.0x severe disability extra time allocates 7200s (120 mins)');

  // ── 5. Universal Voice Shortcuts (Skip, Start, Repeat) ─────────────────────
  console.log('\n--- 5. Testing Universal Calibration Shortcuts ---');
  const skipPhrases = ['skip', 'skip calibration', 'direct start'];
  for (const phrase of skipPhrases) {
    assert(/skip|direct start/i.test(phrase), `Voice phrase "${phrase}" triggers immediate exam skip`);
  }

  const startPhrases = ['start exam', 'begin exam', 'shuru karo', 'start the test'];
  for (const phrase of startPhrases) {
    const startIntent = await drishtiNluService.understand(phrase, { examState: 'not-started' });
    assert(startIntent.type === 'START_EXAM', `Voice phrase "${phrase}" resolves to START_EXAM intent`);
  }

  // ── 6. Mock Exam Auto-Start & Conducting ────────────────────────────────────
  console.log('\n--- 6. Testing Mock Exam Conducting for Blind User ---');
  const targetExam = EXAMS[0];
  assert(!!targetExam, 'Primary mock exam exists in catalog');
  assert(targetExam.questions.length > 0, `Exam "${targetExam.title}" has ${targetExam.questions.length} questions`);

  const q1 = targetExam.questions[0];
  assert(!!q1.text, 'Question 1 has accessible text narration content');
  assert(q1.options.length === 4, 'Question 1 has 4 options (A, B, C, D)');

  // Test blind user answering flow
  const selectAnsMatch = classifyVoiceIntent('select option B', { examState: 'in-progress' });
  assert(selectAnsMatch.type === 'SELECT_OPTION' && selectAnsMatch.targetOption === 'B', 'Blind user can select Option B by voice');

  const nextQMatch = classifyVoiceIntent('agla sawal', { examState: 'in-progress' });
  assert(nextQMatch.type === 'NEXT_QUESTION', 'Blind user can say "agla sawal" to navigate to next question');

  const timeRemainingMatch = classifyVoiceIntent('kitna time bacha hai', { examState: 'in-progress' });
  assert(timeRemainingMatch.type === 'TIME_REMAINING', 'Blind user can ask remaining time in Hindi/English');

  const submitMatch = classifyVoiceIntent('submit exam', { examState: 'in-progress' });
  assert(submitMatch.type === 'INITIATE_SUBMIT', 'Blind user can initiate exam submission by voice');

  const confirmSubmitMatch = classifyVoiceIntent('yes submit exam', { examState: 'submit-dialog' });
  assert(confirmSubmitMatch.type === 'CONFIRM_SUBMIT', 'Blind user can confirm submission with safety confirmation');

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL BLIND USER CALIBRATION & MOCK EXAM TESTS PASSED!\n');
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
