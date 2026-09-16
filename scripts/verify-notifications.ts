import { notificationService, AppNotification } from '../src/services/notificationService';
import { classifyVoiceIntent } from '../src/services/voiceCommandClassifier';

console.log('🚀 Starting Notification System Automated Verification...\n');

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

// 1. Initial State
const initial = notificationService.getNotifications();
assert(initial.length >= 3, 'Initial notifications are loaded with seed data', `Count: ${initial.length}`);

const unreadCount = notificationService.getUnreadCount();
assert(unreadCount > 0, 'Unread count is correctly calculated', `Unread count: ${unreadCount}`);

// 2. Broadcast new mock exam notification (simulating admin uploading an exam)
let eventReceived: AppNotification | null = null;
const unsubscribe = notificationService.subscribe((notifications) => {
  if (notifications.length > 0) {
    eventReceived = notifications[0];
  }
});

const newExamNotification = notificationService.broadcastNotification({
  type: 'exam',
  title: 'New Mock Exam: IBPS PO Prelims 2026',
  message: 'Admin has uploaded a brand new mock test with 100 questions. Practice now!',
  link: '/exams',
  priority: 'high',
  author: 'Admin'
});

assert(newExamNotification.id.length > 0, 'New notification generated with unique ID');
assert(eventReceived !== null && (eventReceived as any).id === newExamNotification.id, 'Subscribers received real-time notification update');

const unreadAfterBroadcast = notificationService.getUnreadCount();
assert(unreadAfterBroadcast === unreadCount + 1, 'Unread count increments after new admin upload');

// 3. Mark notification as read
notificationService.markAsRead(newExamNotification.id);
const updatedUnread = notificationService.getUnreadCount();
assert(updatedUnread === unreadCount, 'Unread count decrements after marking notification as read');

// 4. Test Study Material & PYQ broadcast types
const studyMaterialNote = notificationService.broadcastNotification({
  type: 'study-material',
  title: 'New Study Material: Indian History Summary Notes',
  message: 'Complete quick-revision notes uploaded by Admin.',
  link: '/study-materials'
});
assert(studyMaterialNote.type === 'study-material', 'Study material notification type preserved');
assert(studyMaterialNote.link === '/study-materials', 'Direct link to study materials preserved');

const announcementNote = notificationService.broadcastNotification({
  type: 'announcement',
  title: 'Important System Maintenance',
  message: 'Scheduled maintenance on Sunday at 2 AM.',
  priority: 'urgent'
});
assert(announcementNote.priority === 'urgent', 'Urgent priority preserved for announcements');

// 5. Test Voice Intent classification for Notifications
const voicePhrases = [
  'open notifications',
  'show notifications',
  'check my notifications',
  'read my notification',
  'view notifications'
];

for (const phrase of voicePhrases) {
  const result = classifyVoiceIntent(phrase);
  assert(result.type === 'OPEN_NOTIFICATIONS', `Voice intent '${phrase}' resolves to OPEN_NOTIFICATIONS`, `Got: ${result.type}`);
}

// 6. Test Mark All As Read
notificationService.markAllAsRead();
const finalUnread = notificationService.getUnreadCount();
assert(finalUnread === 0, 'Mark all as read clears all unread notifications to 0', `Final unread: ${finalUnread}`);

unsubscribe();

console.log('\n========================================');
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log('========================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL NOTIFICATION SYSTEM TESTS PASSED SUCCESSFULLY!\n');
}
