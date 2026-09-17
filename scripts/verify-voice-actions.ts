import process from 'node:process';
import { classifyVoiceIntent } from '../src/services/voiceCommandClassifier';
import { drishtiActionService } from '../src/services/drishtiActionService';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  DRISHTI VOICE ACTIONS & AUTONOMOUS SCROLLING TEST SUITE');
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
  console.log('--- 1. Testing Directional Scrolling Intent Mapping ---');
  
  const down1 = classifyVoiceIntent('drishti scroll down');
  assert('Utterance "drishti scroll down" maps to SCROLL_DOWN', down1.type === 'SCROLL_DOWN');

  const down2 = classifyVoiceIntent('scroll the page down please');
  assert('Utterance "scroll the page down please" maps to SCROLL_DOWN', down2.type === 'SCROLL_DOWN');

  const downHindi = classifyVoiceIntent('neeche scroll karo');
  assert('Hindi utterance "neeche scroll karo" maps to SCROLL_DOWN', downHindi.type === 'SCROLL_DOWN');

  const up1 = classifyVoiceIntent('drishti scroll up');
  assert('Utterance "drishti scroll up" maps to SCROLL_UP', up1.type === 'SCROLL_UP');

  const upHindi = classifyVoiceIntent('upar scroll karo');
  assert('Hindi utterance "upar scroll karo" maps to SCROLL_UP', upHindi.type === 'SCROLL_UP');

  const top1 = classifyVoiceIntent('scroll to the top');
  assert('Utterance "scroll to the top" maps to SCROLL_TOP', top1.type === 'SCROLL_TOP');

  const topHindi = classifyVoiceIntent('sabse upar jao');
  assert('Hindi utterance "sabse upar jao" maps to SCROLL_TOP', topHindi.type === 'SCROLL_TOP');

  const bot1 = classifyVoiceIntent('scroll to bottom');
  assert('Utterance "scroll to bottom" maps to SCROLL_BOTTOM', bot1.type === 'SCROLL_BOTTOM');

  const botHindi = classifyVoiceIntent('sabse neeche jao');
  assert('Hindi utterance "sabse neeche jao" maps to SCROLL_BOTTOM', botHindi.type === 'SCROLL_BOTTOM');

  console.log('\n--- 2. Testing Continuous Auto-Scroll Mode ---');

  const autoStart1 = classifyVoiceIntent('start auto scroll');
  assert('Utterance "start auto scroll" maps to AUTO_SCROLL_START', autoStart1.type === 'AUTO_SCROLL_START');

  const autoStartHindi = classifyVoiceIntent('auto scroll shuru karo');
  assert('Hindi utterance "auto scroll shuru karo" maps to AUTO_SCROLL_START', autoStartHindi.type === 'AUTO_SCROLL_START');

  const autoStop1 = classifyVoiceIntent('stop auto scroll');
  assert('Utterance "stop auto scroll" maps to AUTO_SCROLL_STOP', autoStop1.type === 'AUTO_SCROLL_STOP');

  const autoStop2 = classifyVoiceIntent('stop scroll');
  assert('Utterance "stop scroll" maps to AUTO_SCROLL_STOP', autoStop2.type === 'AUTO_SCROLL_STOP');

  const autoStopHindi = classifyVoiceIntent('scroll roko');
  assert('Hindi utterance "scroll roko" maps to AUTO_SCROLL_STOP', autoStopHindi.type === 'AUTO_SCROLL_STOP');

  const faster = classifyVoiceIntent('scroll faster');
  assert('Utterance "scroll faster" maps to AUTO_SCROLL_FASTER', faster.type === 'AUTO_SCROLL_FASTER');

  const slower = classifyVoiceIntent('scroll slower');
  assert('Utterance "scroll slower" maps to AUTO_SCROLL_SLOWER', slower.type === 'AUTO_SCROLL_SLOWER');

  console.log('\n--- 3. Testing Smart Section-Targeted Page Jumps ---');

  const secOptions = classifyVoiceIntent('scroll to options');
  assert('Utterance "scroll to options" maps to SCROLL_TO_SECTION (options)', 
    secOptions.type === 'SCROLL_TO_SECTION' && secOptions.targetSection === 'options');

  const secQuestion = classifyVoiceIntent('scroll to question');
  assert('Utterance "scroll to question" maps to SCROLL_TO_SECTION (question)', 
    secQuestion.type === 'SCROLL_TO_SECTION' && secQuestion.targetSection === 'question');

  const secSubmit = classifyVoiceIntent('jump to submit button');
  assert('Utterance "jump to submit button" maps to SCROLL_TO_SECTION (submit)', 
    secSubmit.type === 'SCROLL_TO_SECTION' && secSubmit.targetSection === 'submit');

  const secInstructions = classifyVoiceIntent('scroll to instructions');
  assert('Utterance "scroll to instructions" maps to SCROLL_TO_SECTION (instructions)', 
    secInstructions.type === 'SCROLL_TO_SECTION' && secInstructions.targetSection === 'instructions');

  console.log('\n--- 4. Testing Autonomous Element Clicking & Focus Traversal ---');

  const clickSubmit = classifyVoiceIntent('click submit');
  assert('Utterance "click submit" maps to CLICK_ELEMENT (submit)', 
    clickSubmit.type === 'CLICK_ELEMENT' && clickSubmit.targetElement?.toLowerCase() === 'submit');

  const clickDownload = classifyVoiceIntent('click download admit card');
  assert('Utterance "click download admit card" maps to CLICK_ELEMENT (download admit card)', 
    clickDownload.type === 'CLICK_ELEMENT' && clickDownload.targetElement?.toLowerCase() === 'download admit card');

  const clickReview = classifyVoiceIntent('press review solutions');
  assert('Utterance "press review solutions" maps to CLICK_ELEMENT (review solutions)', 
    clickReview.type === 'CLICK_ELEMENT' && clickReview.targetElement?.toLowerCase() === 'review solutions');

  const startExam = classifyVoiceIntent('click start exam');
  assert('Utterance "click start exam" maps to high-level START_EXAM', startExam.type === 'START_EXAM');

  const focusNext = classifyVoiceIntent('focus next element');
  assert('Utterance "focus next element" maps to FOCUS_NEXT', focusNext.type === 'FOCUS_NEXT');

  const focusPrev = classifyVoiceIntent('previous element');
  assert('Utterance "previous element" maps to FOCUS_PREV', focusPrev.type === 'FOCUS_PREV');

  console.log('\n--- 5. Testing DrishtiActionService State Management ---');

  let listenerFired = false;
  let receivedActive = false;
  let receivedSpeed = 0;

  const unsub = drishtiActionService.onAutoScrollChange((active, speed) => {
    listenerFired = true;
    receivedActive = active;
    receivedSpeed = speed;
  });

  const speed1 = drishtiActionService.adjustSpeed(0.4);
  assert('DrishtiActionService adjustSpeed increases multiplier', speed1 === 1.4);
  assert('onAutoScrollChange listener was triggered', listenerFired);
  assert('Speed parameter matches in listener callback', receivedSpeed === 1.4);

  drishtiActionService.stopAutoScroll();
  assert('stopAutoScroll resets active state', !drishtiActionService.isAutoScrolling());
  unsub();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL VOICE ACTIONS & AUTONOMOUS SCROLLING TESTS PASSED PERFECTLY!\n');
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
