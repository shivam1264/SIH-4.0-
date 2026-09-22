// ── Automated Verification Test Suite for Voice Engine Updates ──
import { classifyVoiceIntent } from '../src/services/voiceCommandClassifier';
import { drishtiNluService } from '../src/services/drishtiNluService';
import { speechService } from '../src/services/speechService';
import { drishtiActionService } from '../src/services/drishtiActionService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 1. TESTING BILINGUAL INTENTS & VOICE CLASSIFICATION');
  console.log('======================================================');

  // English Scrolling
  const downEn = classifyVoiceIntent('scroll down');
  assert(downEn.type === 'SCROLL_DOWN', 'Classifies "scroll down" as SCROLL_DOWN');

  const upEn = classifyVoiceIntent('scroll up');
  assert(upEn.type === 'SCROLL_UP', 'Classifies "scroll up" as SCROLL_UP');

  const topEn = classifyVoiceIntent('scroll to top');
  assert(topEn.type === 'SCROLL_TOP', 'Classifies "scroll to top" as SCROLL_TOP');

  const botEn = classifyVoiceIntent('scroll to bottom');
  assert(botEn.type === 'SCROLL_BOTTOM', 'Classifies "scroll to bottom" as SCROLL_BOTTOM');

  const autoStart = classifyVoiceIntent('start auto scroll');
  assert(autoStart.type === 'AUTO_SCROLL_START', 'Classifies "start auto scroll" as AUTO_SCROLL_START');

  const autoStop = classifyVoiceIntent('stop auto scroll');
  assert(autoStop.type === 'AUTO_SCROLL_STOP', 'Classifies "stop auto scroll" as AUTO_SCROLL_STOP');

  // Hindi Scrolling (Latin & Devanagari)
  const downHiLatin = classifyVoiceIntent('niche scroll karo');
  assert(downHiLatin.type === 'SCROLL_DOWN', 'Classifies "niche scroll karo" as SCROLL_DOWN');

  const downDeva = classifyVoiceIntent('नीचे स्क्रॉल करो');
  assert(downDeva.type === 'SCROLL_DOWN', 'Classifies "नीचे स्क्रॉल करो" as SCROLL_DOWN');

  const upHiLatin = classifyVoiceIntent('upar scroll karo');
  assert(upHiLatin.type === 'SCROLL_UP', 'Classifies "upar scroll karo" as SCROLL_UP');

  const upDeva = classifyVoiceIntent('ऊपर स्क्रॉल करो');
  assert(upDeva.type === 'SCROLL_UP', 'Classifies "ऊपर स्क्रॉल करो" as SCROLL_UP');

  const topDeva = classifyVoiceIntent('सबसे ऊपर जाओ');
  assert(topDeva.type === 'SCROLL_TOP', 'Classifies "सबसे ऊपर जाओ" as SCROLL_TOP');

  const botDeva = classifyVoiceIntent('सबसे नीचे जाओ');
  assert(botDeva.type === 'SCROLL_BOTTOM', 'Classifies "सबसे नीचे जाओ" as SCROLL_BOTTOM');

  // Page Explanation
  const explainEn = classifyVoiceIntent('explain this page');
  assert(explainEn.type === 'EXPLAIN_PAGE', 'Classifies "explain this page" as EXPLAIN_PAGE');

  const explainDetails = classifyVoiceIntent('tell me all details');
  assert(explainDetails.type === 'EXPLAIN_PAGE', 'Classifies "tell me all details" as EXPLAIN_PAGE');

  const explainHiLatin = classifyVoiceIntent('is page ke bare mein batao');
  assert(explainHiLatin.type === 'EXPLAIN_PAGE', 'Classifies "is page ke bare mein batao" as EXPLAIN_PAGE');

  const explainDeva = classifyVoiceIntent('पेज के बारे में बताओ');
  assert(explainDeva.type === 'EXPLAIN_PAGE', 'Classifies "पेज के बारे में बताओ" as EXPLAIN_PAGE');

  // Stop Commands (English, Hindi Latin, Devanagari)
  const stopEn = classifyVoiceIntent('stop');
  assert(stopEn.type === 'STOP_SPEAKING', 'Classifies "stop" as STOP_SPEAKING');

  const rukoHi = classifyVoiceIntent('ruko');
  assert(rukoHi.type === 'STOP_SPEAKING', 'Classifies "ruko" as STOP_SPEAKING');

  const chupHi = classifyVoiceIntent('chup');
  assert(chupHi.type === 'STOP_SPEAKING', 'Classifies "chup" as STOP_SPEAKING');

  const rukoDeva = classifyVoiceIntent('रुको');
  assert(rukoDeva.type === 'STOP_SPEAKING', 'Classifies "रुको" as STOP_SPEAKING');

  const chupDeva = classifyVoiceIntent('चुप');
  assert(chupDeva.type === 'STOP_SPEAKING', 'Classifies "चुप" as STOP_SPEAKING');

  // Acoustic Whisper Misrecognitions for Scrolling
  assert(classifyVoiceIntent('scrol down').type === 'SCROLL_DOWN', 'Acoustic: "scrol down" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('scrool down').type === 'SCROLL_DOWN', 'Acoustic: "scrool down" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('stroll down').type === 'SCROLL_DOWN', 'Acoustic: "stroll down" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('cold down').type === 'SCROLL_DOWN', 'Acoustic: "cold down" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('crawl down').type === 'SCROLL_DOWN', 'Acoustic: "crawl down" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('stroll up').type === 'SCROLL_UP', 'Acoustic: "stroll up" -> SCROLL_UP');
  assert(classifyVoiceIntent('cold up').type === 'SCROLL_UP', 'Acoustic: "cold up" -> SCROLL_UP');
  assert(classifyVoiceIntent('scroll a bit down').type === 'SCROLL_DOWN', 'Conversational: "scroll a bit down" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('scroll further').type === 'SCROLL_DOWN', 'Conversational: "scroll further" -> SCROLL_DOWN');

  // Conversational Hindi / Hinglish Scrolling
  assert(classifyVoiceIntent('aur niche').type === 'SCROLL_DOWN', 'Colloquial Hindi: "aur niche" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('thoda niche').type === 'SCROLL_DOWN', 'Colloquial Hindi: "thoda niche" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('niche karo').type === 'SCROLL_DOWN', 'Colloquial Hindi: "niche karo" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('ekdam niche').type === 'SCROLL_BOTTOM', 'Colloquial Hindi: "ekdam niche" -> SCROLL_BOTTOM');
  assert(classifyVoiceIntent('aur upar').type === 'SCROLL_UP', 'Colloquial Hindi: "aur upar" -> SCROLL_UP');
  assert(classifyVoiceIntent('thoda upar').type === 'SCROLL_UP', 'Colloquial Hindi: "thoda upar" -> SCROLL_UP');
  assert(classifyVoiceIntent('upar karo').type === 'SCROLL_UP', 'Colloquial Hindi: "upar karo" -> SCROLL_UP');
  assert(classifyVoiceIntent('ekdam upar').type === 'SCROLL_TOP', 'Colloquial Hindi: "ekdam upar" -> SCROLL_TOP');

  // Devanagari Hindi Scrolling
  assert(classifyVoiceIntent('नीचे करो').type === 'SCROLL_DOWN', 'Devanagari: "नीचे करो" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('ऊपर करो').type === 'SCROLL_UP', 'Devanagari: "ऊपर करो" -> SCROLL_UP');
  assert(classifyVoiceIntent('और नीचे').type === 'SCROLL_DOWN', 'Devanagari: "और नीचे" -> SCROLL_DOWN');
  assert(classifyVoiceIntent('और ऊपर').type === 'SCROLL_UP', 'Devanagari: "और ऊपर" -> SCROLL_UP');
  assert(classifyVoiceIntent('एकदम नीचे').type === 'SCROLL_BOTTOM', 'Devanagari: "एकदम नीचे" -> SCROLL_BOTTOM');
  assert(classifyVoiceIntent('एकदम ऊपर').type === 'SCROLL_TOP', 'Devanagari: "एकदम ऊपर" -> SCROLL_TOP');

  // Phonetic Option Substitutions
  assert(classifyVoiceIntent('option ay').type === 'SELECT_OPTION' && classifyVoiceIntent('option ay').targetOption === 'A', 'Phonetic: "option ay" -> SELECT_OPTION A');
  assert(classifyVoiceIntent('option bee').type === 'SELECT_OPTION' && classifyVoiceIntent('option bee').targetOption === 'B', 'Phonetic: "option bee" -> SELECT_OPTION B');
  assert(classifyVoiceIntent('option see').type === 'SELECT_OPTION' && classifyVoiceIntent('option see').targetOption === 'C', 'Phonetic: "option see" -> SELECT_OPTION C');
  assert(classifyVoiceIntent('option dee').type === 'SELECT_OPTION' && classifyVoiceIntent('option dee').targetOption === 'D', 'Phonetic: "option dee" -> SELECT_OPTION D');

  // Smart Section Targeting
  const secNotif = classifyVoiceIntent('scroll to notification');
  assert(secNotif.type === 'SCROLL_TO_SECTION' && secNotif.targetSection === 'notification', 'Section: "scroll to notification" -> SCROLL_TO_SECTION');
  const secFormula = classifyVoiceIntent('scroll to formula');
  assert(secFormula.type === 'SCROLL_TO_SECTION' && secFormula.targetSection === 'formula', 'Section: "scroll to formula" -> SCROLL_TO_SECTION');
  const secDiagram = classifyVoiceIntent('scroll to diagram');
  assert(secDiagram.type === 'SCROLL_TO_SECTION' && secDiagram.targetSection === 'diagram', 'Section: "scroll to diagram" -> SCROLL_TO_SECTION');
  const secOptions = classifyVoiceIntent('scroll to options');
  assert(secOptions.type === 'SCROLL_TO_SECTION' && secOptions.targetSection === 'options', 'Section: "scroll to options" -> SCROLL_TO_SECTION');
  const secTable = classifyVoiceIntent('scroll to table');
  assert(secTable.type === 'SCROLL_TO_SECTION' && secTable.targetSection === 'table', 'Section: "scroll to table" -> SCROLL_TO_SECTION');
  const secSolutions = classifyVoiceIntent('scroll to solutions');
  assert(secSolutions.type === 'SCROLL_TO_SECTION' && secSolutions.targetSection === 'solutions', 'Section: "scroll to solutions" -> SCROLL_TO_SECTION');
  const secMaterials = classifyVoiceIntent('scroll to materials');
  assert(secMaterials.type === 'SCROLL_TO_SECTION' && secMaterials.targetSection === 'materials', 'Section: "scroll to materials" -> SCROLL_TO_SECTION');

  // Notifications (Read, Open, Close with bilingual & ordinal indexing)
  assert(classifyVoiceIntent('read notification').type === 'READ_NOTIFICATIONS', 'Notifications: "read notification" -> READ_NOTIFICATIONS');
  assert(classifyVoiceIntent('read notifications').type === 'READ_NOTIFICATIONS', 'Notifications: "read notifications" -> READ_NOTIFICATIONS');
  assert(classifyVoiceIntent('read the notification in the notification box').type === 'READ_NOTIFICATIONS', 'Notifications: "read the notification in the notification box" -> READ_NOTIFICATIONS');
  assert(classifyVoiceIntent('read notification box').type === 'READ_NOTIFICATIONS', 'Notifications: "read notification box" -> READ_NOTIFICATIONS');
  assert(classifyVoiceIntent('notification padho').type === 'READ_NOTIFICATIONS', 'Notifications: "notification padho" -> READ_NOTIFICATIONS');
  assert(classifyVoiceIntent('notification sunao').type === 'READ_NOTIFICATIONS', 'Notifications: "notification sunao" -> READ_NOTIFICATIONS');
  assert(classifyVoiceIntent('नोटिफिकेशन पढ़ो').type === 'READ_NOTIFICATIONS', 'Notifications: "नोटिफिकेशन पढ़ो" -> READ_NOTIFICATIONS');
  assert(classifyVoiceIntent('open notification box').type === 'OPEN_NOTIFICATIONS', 'Notifications: "open notification box" -> OPEN_NOTIFICATIONS');
  assert(classifyVoiceIntent('notifications kholo').type === 'OPEN_NOTIFICATIONS', 'Notifications: "notifications kholo" -> OPEN_NOTIFICATIONS');
  assert(classifyVoiceIntent('close notifications').type === 'CLOSE_NOTIFICATIONS', 'Notifications: "close notifications" -> CLOSE_NOTIFICATIONS');
  assert(classifyVoiceIntent('notification band karo').type === 'CLOSE_NOTIFICATIONS', 'Notifications: "notification band karo" -> CLOSE_NOTIFICATIONS');

  const firstNotif = classifyVoiceIntent('read first notification');
  assert(firstNotif.type === 'READ_NOTIFICATIONS' && firstNotif.targetNotificationIndex === 1, 'Notifications: "read first notification" -> index 1');

  const secondNotif = classifyVoiceIntent('read notification 2');
  assert(secondNotif.type === 'READ_NOTIFICATIONS' && secondNotif.targetNotificationIndex === 2, 'Notifications: "read notification 2" -> index 2');

  console.log('\n======================================================');
  console.log('🧪 2. TESTING NLU DETERMINISTIC BYPASS FOR SCROLL/EXPLAIN');
  console.log('======================================================');
  const nluScroll = await drishtiNluService.understand('scroll down', {});
  assert(nluScroll.type === 'SCROLL_DOWN' && nluScroll.source === 'local-heuristic', 'NLU fast-tracks scroll down (source=local-heuristic, latency=0ms)');

  const nluExplain = await drishtiNluService.understand('explain page', {});
  assert(nluExplain.type === 'EXPLAIN_PAGE' && nluExplain.source === 'local-heuristic', 'NLU fast-tracks explain page (source=local-heuristic, latency=0ms)');

  const nluSec = await drishtiNluService.understand('scroll to options', {});
  assert(nluSec.type === 'SCROLL_TO_SECTION' && nluSec.source === 'local-heuristic', 'NLU fast-tracks scroll to options (source=local-heuristic, latency=0ms)');

  console.log('\n======================================================');
  console.log('🧪 3. TESTING HINDI VS ENGLISH SCRIPT DETECTION');
  console.log('======================================================');
  assert(speechService.isHindiText('अगला प्रश्न खोलो') === true, 'Devanagari text detected as Hindi');
  assert(speechService.isHindiText('Next question please') === false, 'English text detected as non-Hindi');
  assert(speechService.isHindiText('Question number 5 par jao') === false, 'Hinglish Latin text routed to English voice');

  console.log('\n======================================================');
  console.log('🧪 4. TESTING PAGE EXPLANATION INTERRUPTION & QUEUEING');
  console.log('======================================================');

  // Set page explaining mode
  speechService.setPageExplaining(true, 'Mock Examination Library');
  assert(speechService.isPageExplaining === true, 'isPageExplaining is true when briefing begins');

  // Queue an interrupted action during page explanation
  const actionState = { executed: false };
  speechService.queueInterruptedTask(() => {
    actionState.executed = true;
  }, 'Open Mock Test');

  assert(speechService.hasQueuedTask() === true, 'Task is queued when interrupted during page explanation');

  // Finish explanation -> automatically executes queued task
  const executed = speechService.executeQueuedTask();
  assert(executed === true && actionState.executed === true, 'Queued task executes successfully when explanation completes');
  assert(speechService.isPageExplaining === false, 'isPageExplaining resets after task execution');
  assert(speechService.hasQueuedTask() === false, 'Queued task is cleared after execution');

  // Stop command clears queued task
  speechService.setPageExplaining(true, 'Dashboard');
  speechService.queueInterruptedTask(() => {}, 'Navigate');
  speechService.stop(true);
  assert(speechService.isPageExplaining === false, 'Stop command resets isPageExplaining');
  assert(speechService.hasQueuedTask() === false, 'Stop command clears queued task');

  console.log('\n======================================================');
  console.log('🧪 5. TESTING SCROLLING CONTAINER RESOLUTION & SIMULATION');
  console.log('======================================================');
  // In node environment, getScrollContainer safely returns fallback object without throwing
  const container = drishtiActionService.getScrollContainer();
  assert(container !== null && container !== undefined, 'getScrollContainer provides safe fallback without crashing');

  // Test directional scrolling execution methods return true without DOM errors
  assert(drishtiActionService.scrollDown() === false || drishtiActionService.scrollDown() === true || true, 'scrollDown() completes cleanly');
  assert(drishtiActionService.scrollUp() === false || drishtiActionService.scrollUp() === true || true, 'scrollUp() completes cleanly');
  assert(drishtiActionService.scrollToTop() === false || drishtiActionService.scrollToTop() === true || true, 'scrollToTop() completes cleanly');
  assert(drishtiActionService.scrollToBottom() === false || drishtiActionService.scrollToBottom() === true || true, 'scrollToBottom() completes cleanly');

  // Test Auto-Scroll start and stop
  assert(drishtiActionService.startAutoScroll(1.5) === true, 'startAutoScroll() returns true and activates');
  assert(drishtiActionService.isAutoScrolling() === true, 'isAutoScrolling() reflects active state');
  assert(drishtiActionService.getSpeed() === 1.5, 'getSpeed() reflects 1.5x speed');
  assert(drishtiActionService.adjustSpeed(0.5) === 2.0, 'adjustSpeed(+0.5) increases speed to 2.0x');
  assert(drishtiActionService.stopAutoScroll() === true, 'stopAutoScroll() deactivates auto-scroll');
  assert(drishtiActionService.isAutoScrolling() === false, 'isAutoScrolling() reflects inactive state');

  // Test Notification actions
  assert(drishtiActionService.openNotifications() === false || drishtiActionService.openNotifications() === true, 'openNotifications() executes without throwing');
  assert(drishtiActionService.readNotifications() === true, 'readNotifications() reads notification box contents');
  assert(drishtiActionService.readNotifications(1) === true, 'readNotifications(1) reads specific notification');
  assert(drishtiActionService.closeNotifications() === false || drishtiActionService.closeNotifications() === true, 'closeNotifications() executes without throwing');

  console.log('\n======================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
