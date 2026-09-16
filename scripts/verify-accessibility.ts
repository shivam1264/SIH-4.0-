import { speechService } from '../src/services/speechService';
import { screenReaderAnnouncer } from '../src/services/screenReaderAnnouncer';
import { classifyVoiceIntent } from '../src/services/voiceCommandClassifier';

console.log('🚀 Starting Universal Accessibility Test Suite...\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    testsFailed++;
  }
}

// ── 1. Test Educational Math & Formula Phonetic Verbalization ────────────
console.log('--- 1. Testing Math & Educational Formula Verbalization ---');

const formula1 = speechService.mathToPhonetic('Find the value of x^2 + y^2');
assert(formula1.includes('x squared') && formula1.includes('y squared'), 'Powers x^2, y^2 converted to squared', formula1);

const formula2 = speechService.mathToPhonetic('The area is \\frac{1}{2} × base × height');
assert(formula2.includes('one half') && formula2.includes('multiplied by'), 'LaTeX fraction and multiplication symbol converted', formula2);

const formula3 = speechService.mathToPhonetic('Calculate √64 and 3/4');
assert(formula3.includes('square root of 64') && formula3.includes('three fourths'), 'Square root and fractions converted', formula3);

const formula4 = speechService.mathToPhonetic('Principal amount is ₹5000 at 10% p.a.');
assert(formula4.includes('5000 rupees') && formula4.includes('10 percent') && formula4.includes('per annum'), 'Currency, percentages, and p.a. converted', formula4);

const formula5 = speechService.mathToPhonetic('Volume is 250 cm³ and speed is 60 km/h');
assert(formula5.includes('cubic centimeters') && formula5.includes('kilometers per hour'), 'Measurement units converted', formula5);

const formula6 = speechService.mathToPhonetic('Evaluate parts: (i) and (ii)');
assert(formula6.includes('part 1') && formula6.includes('part 2'), 'Roman numerals in questions converted to parts', formula6);

// ── 2. Test Screen Reader Announcer & Page Orientation ───────────────────
console.log('\n--- 2. Testing Screen Reader Announcer & Page Orientation ---');

// Mock DOM elements for test runner
const mockPolite = { textContent: '' } as any;
const mockAssertive = { textContent: '' } as any;
screenReaderAnnouncer.registerElements(mockPolite, mockAssertive);

screenReaderAnnouncer.announcePolite('Question 3 of 25');
assert(mockPolite.textContent === 'Question 3 of 25', 'Polite announcement correctly set on mock element');

screenReaderAnnouncer.announceAssertive('Warning: 5 minutes remaining!');
assert(mockAssertive.textContent === 'Warning: 5 minutes remaining!', 'Assertive announcement correctly set on mock element');

const dashboardOrientation = screenReaderAnnouncer.orientCurrentPage('/dashboard', false);
assert(dashboardOrientation !== null && dashboardOrientation.title === 'Student Dashboard', 'Dashboard page orientation resolved');
assert(dashboardOrientation?.keyActions.length! >= 3, 'Dashboard has key accessible actions');

const practiceOrientation = screenReaderAnnouncer.orientCurrentPage('/practice', false);
assert(practiceOrientation !== null && practiceOrientation.title === 'AI Practice Drills', 'Practice drills orientation resolved');

const examsOrientation = screenReaderAnnouncer.orientCurrentPage('/exams', false);
assert(examsOrientation !== null && examsOrientation.title === 'Mock Examination Library', 'Mock exams orientation resolved');

const studyOrientation = screenReaderAnnouncer.orientCurrentPage('/study-materials', false);
assert(studyOrientation !== null && studyOrientation.title === 'Audio Study Materials', 'Study materials orientation resolved');

// ── 3. Test Voice Intent Classification for Accessibility Commands ───────
console.log('\n--- 3. Testing Accessibility Voice Intent Commands ---');

const timeRes1 = classifyVoiceIntent('how much time is left');
assert(timeRes1.type === 'TIME_REMAINING', 'Voice command "how much time is left" resolves to TIME_REMAINING', timeRes1.type);

const timeRes2 = classifyVoiceIntent('time remaining');
assert(timeRes2.type === 'TIME_REMAINING', 'Voice command "time remaining" resolves to TIME_REMAINING', timeRes2.type);

const helpRes = classifyVoiceIntent('guide me');
assert(helpRes.type === 'HELP', 'Voice command "guide me" resolves to HELP', helpRes.type);

const mathRes = classifyVoiceIntent('explain the formula');
assert(mathRes.type === 'VERBALIZE_MATH', 'Voice command "explain the formula" resolves to VERBALIZE_MATH', mathRes.type);

const diagramRes = classifyVoiceIntent('describe the diagram');
assert(diagramRes.type === 'DESCRIBE_DIAGRAM', 'Voice command "describe the diagram" resolves to DESCRIBE_DIAGRAM', diagramRes.type);

console.log('\n========================================');
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log('========================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL UNIVERSAL ACCESSIBILITY TESTS PASSED SUCCESSFULLY!\n');
}
