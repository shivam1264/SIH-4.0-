import process from 'node:process';
import { speechService } from '../src/services/speechService';
import { globalVoiceService } from '../src/services/globalVoiceService';
import { classifyVoiceIntent } from '../src/services/voiceCommandClassifier';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  DRISHTI VOICE INTERRUPTION & BARGE-IN VERIFICATION SUITE');
console.log('═══════════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}${details ? ' - ' + details : ''}`);
    failed++;
  }
}

async function run() {
  console.log('--- 1. Testing SpeechService onStop & Interruption Listeners ---');
  let stopTriggered = false;
  const unsub = speechService.onStop(() => {
    stopTriggered = true;
  });

  speechService.speak('This is a long test reading passage that should be interrupted by the user.', true);
  speechService.stop();
  assert('SpeechService triggers onStop subscriber on stop()', stopTriggered);
  assert('SpeechService.isSpeaking resets to false after stop()', !speechService.isSpeaking);
  unsub();

  console.log('\n--- 2. Testing Universal Interruption Dispatcher in GlobalVoiceService ---');
  let handledCommand = '';
  const unreg = globalVoiceService.register((text: string) => {
    handledCommand = text;
    return true;
  });

  // Simulate long exam question reading
  globalVoiceService.recordSpoken('Question 1: What is the capital of India? Option A Mumbai. Option B New Delhi. Option C Kolkata.');
  speechService.speak('Question 1: What is the capital of India? Option A Mumbai. Option B New Delhi. Option C Kolkata.');

  // User interrupts by saying "Option B" (which is a substring of the reading text!)
  (globalVoiceService as any)._dispatch('option b');
  assert('SpeechService is immediately halted when user interrupts', !speechService.isSpeaking);
  assert('User interruption command "option b" is executed and NOT dropped by echo suppression', handledCommand === 'option b');

  // User interrupts by saying "stop"
  speechService.speak('Reading long detailed solution explanation for question 4...');
  (globalVoiceService as any)._dispatch('stop');
  assert('User command "stop" interrupts active reading', !speechService.isSpeaking);
  assert('Command "stop" was dispatched to handlers', handledCommand === 'stop');

  // User interrupts by saying "next question"
  speechService.speak('Notification 1: Admit card released for SSC CGL 2026 examination.');
  (globalVoiceService as any)._dispatch('next question');
  assert('User command "next question" interrupts notification reading', !speechService.isSpeaking);
  assert('Command "next question" was dispatched to handlers', handledCommand === 'next question');

  unreg();

  console.log('\n--- 3. Testing Semantic Action Preservation During Active Speech ---');
  // Verify that real-world commands are recognized correctly even while speech was just playing
  const intent1 = classifyVoiceIntent('drishti select option C', { examState: 'in-progress' });
  assert('Interruption "drishti select option C" maps to SELECT_OPTION (C)', intent1.type === 'SELECT_OPTION' && intent1.targetOption === 'C');

  const intent2 = classifyVoiceIntent('drishti read notification');
  assert('Interruption "drishti read notification" maps to OPEN_NOTIFICATIONS', intent2.type === 'OPEN_NOTIFICATIONS');

  const intent3 = classifyVoiceIntent('cancel', { examState: 'submit-dialog' });
  assert('Interruption "cancel" in submit dialog maps to CANCEL_SUBMIT', intent3.type === 'CANCEL_SUBMIT');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL VOICE INTERRUPTION & BARGE-IN TESTS PASSED PERFECTLY!\n');
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
