import process from 'node:process';
import { drishtiNluService } from '../src/services/drishtiNluService';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  DRISHTI REAL-WORLD AI VOICE NLU VERIFICATION SUITE');
console.log('═══════════════════════════════════════════════════════════════\n');

interface TestCase {
  name: string;
  utterance: string;
  expectedType: string;
  expectedOption?: string;
}

const testCases: TestCase[] = [
  {
    name: '1. Motor impairment indirect request',
    utterance: "Drishti, my hands are shaking and I can't reach the keyboard, please choose option C for me",
    expectedType: 'SELECT_OPTION',
    expectedOption: 'C',
  },
  {
    name: '2. Low-vision emotional accessibility request',
    utterance: 'Drishti, my eyes are tired, can you make everything dark with bright yellow letters?',
    expectedType: 'THEME_YELLOW',
  },
  {
    name: '3. Conversational Indian Hinglish phrase',
    utterance: 'Drishti yaar doosra option select karo',
    expectedType: 'SELECT_OPTION',
    expectedOption: 'B',
  },
  {
    name: '4. Conversational exam launch',
    utterance: 'I am ready to begin the examination now',
    expectedType: 'START_EXAM',
  },
  {
    name: '5. Colloquial notification inquiry',
    utterance: 'Are there any new announcements or notifications for me today?',
    expectedType: 'OPEN_NOTIFICATIONS',
  },
  {
    name: '6. Natural time check',
    utterance: 'Drishti, how much time do I still have before my paper ends?',
    expectedType: 'TIME_REMAINING',
  },
  {
    name: '7. Answer retraction',
    utterance: 'Wait, I made a mistake, take away my answer for this question',
    expectedType: 'CLEAR_ANSWER',
  },
];

async function run() {
  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`\nTesting: "${tc.utterance}"`);
    await new Promise(r => setTimeout(r, 600));
    const result = await drishtiNluService.understand(tc.utterance, { route: '/exam/mock-1', examState: 'in-progress' });
    console.log(`  ➔ Engine Source: [${result.source}] (${result.latencyMs ?? 0}ms)`);
    console.log(`  ➔ Recognized Intent: ${result.type} | Target: ${result.targetOption ?? 'none'}`);
    console.log(`  ➔ Spoken Response: "${result.speechFeedback}"`);
    if (result.reasoning) {
      console.log(`  ➔ AI Reasoning: ${result.reasoning}`);
    }

    if (result.type === tc.expectedType && (!tc.expectedOption || result.targetOption === tc.expectedOption)) {
      console.log(`✅ PASS: ${tc.name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${tc.name} (Expected ${tc.expectedType}, got ${result.type})`);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${testCases.length})`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL REAL-WORLD AI VOICE NLU TEST CASES PASSED PERFECTLY!\n');
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
