// ── Central Screen Reader & Audio Orientation Service ─────────────────────
// Synchronizes native screen reader live regions (polite & assertive)
// with high-fidelity spoken orientation for visually impaired candidates.

import { speechService } from './speechService';
import { audioCueService } from './audioCueService';

export type AnnouncePriority = 'polite' | 'assertive';

export interface PageOrientationInfo {
  title: string;
  summary: string;
  keyActions: string[];
}

const PAGE_ORIENTATIONS: Record<string, PageOrientationInfo> = {
  '/dashboard': {
    title: 'Student Dashboard',
    summary: 'Candidate overview screen showing exam readiness, recent scores, and daily streak.',
    keyActions: [
      'Say "Open mock test" or press 1 to view competitive examinations',
      'Say "Open practice" or press 2 for AI practice drills',
      'Say "Open study materials" or press 3 for audio notes',
      'Press B or O anytime to repeat this briefing',
    ],
  },
  '/exams': {
    title: 'Mock Examination Library',
    summary: 'Catalog of competitive examinations including SSC CGL, Banking Quantitative Aptitude, Railway RRB, and UPSC Prelims.',
    keyActions: [
      'Press 1 to 4 to inspect an exam',
      'Say "Open [exam title]" to view instructions',
      'Say "Start the mock test" to begin examination',
    ],
  },
  '/practice': {
    title: 'AI Practice Drills',
    summary: 'Interactive drill sessions with instant audio explanations across Indian History, Pipes and Cisterns, Compound Interest, Blood Relations, and Mensuration.',
    keyActions: [
      'Press 1 to 5 to pick a topic',
      'In a drill, press 1 to 4 or say Option A, B, C, or D to answer',
      'Press R to read the current question again',
    ],
  },
  '/study-materials': {
    title: 'Audio Study Materials',
    summary: 'Curated quick-revision audio notes with key highlight bullets and text-to-speech narration.',
    keyActions: [
      'Press 1 to 4 to open an article reader',
      'Press Space to toggle audio reading',
      'Press K to listen to Key Highlights only',
    ],
  },
  '/pyqs': {
    title: 'Previous Year Question Papers',
    summary: 'Official past 5-year competitive papers for SSC CGL, IBPS PO, RRB NTPC, and UPSC Civil Services.',
    keyActions: [
      'Press 1 to 4 to inspect a past paper',
      'Press Enter to start practice in exam mode',
    ],
  },
  '/results': {
    title: 'Examination Scorecard & Solution Analysis',
    summary: 'Detailed attempt results including score percentage, accuracy, time per question, and solution explanations.',
    keyActions: [
      'Press R or say "Read solutions" to step through questions and explanations',
      'Press Retake Exam to practice again',
    ],
  },
  '/history': {
    title: 'Exam Attempt History',
    summary: 'Chronological log of all completed tests, scores, and date stamps.',
    keyActions: [
      'Press 1 to 9 to hear details for an attempt',
      'Press Enter on an attempt to review full solutions',
    ],
  },
  '/performance': {
    title: 'Performance Analytics',
    summary: 'Visual and auditory performance metrics, subject mastery breakdowns, and target benchmarks.',
    keyActions: [
      'Press B to hear your full subject strengths and areas needing review',
    ],
  },
  '/settings': {
    title: 'Universal Accessibility Settings',
    summary: 'Customize high contrast themes, large fonts, speech rates, pitch, sound cues, and auto-reading.',
    keyActions: [
      'Press 1 to 4 to cycle high-contrast color themes',
      'Press F to cycle text sizes up to 150%',
      'Press V to toggle voice guidance',
    ],
  },
  '/profile': {
    title: 'Candidate Profile & UDID Disability Verification',
    summary: 'Student identification, compensatory extra time multiplier, and autonomous mode settings.',
    keyActions: [
      'Review your compensatory extra time allocation (1.5x default for PwD)',
    ],
  },
};

class ScreenReaderAnnouncer {
  private politeElement: HTMLElement | null = null;
  private assertiveElement: HTMLElement | null = null;
  private lastAnnouncement = '';
  private lastRoute = '';

  public registerElements(polite: HTMLElement, assertive: HTMLElement) {
    this.politeElement = polite;
    this.assertiveElement = assertive;
  }

  public announce(message: string, priority: AnnouncePriority = 'polite') {
    if (!message || message === this.lastAnnouncement) {
      // Clear slightly to force screen reader re-announcement if identical
      if (this.politeElement) this.politeElement.textContent = '';
      if (this.assertiveElement) this.assertiveElement.textContent = '';
    }

    this.lastAnnouncement = message;

    const target = priority === 'assertive' ? this.assertiveElement : this.politeElement;
    if (target) {
      target.textContent = message;
    }

    // Also dispatch a browser custom event for logging and accessibility inspector
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('drishtix_accessibility_announcement', {
          detail: { message, priority, timestamp: Date.now() },
        })
      );
    }
  }

  public announcePolite(message: string) {
    this.announce(message, 'polite');
  }

  public announceAssertive(message: string) {
    this.announce(message, 'assertive');
    try {
      audioCueService.notification();
    } catch {}
  }

  public orientCurrentPage(pathname: string, speakAloud = true): PageOrientationInfo | null {
    // Normalize path (e.g. /exam/ssc-01 -> /exam)
    let matchedKey = Object.keys(PAGE_ORIENTATIONS).find(k => pathname === k || (k !== '/' && pathname.startsWith(k)));
    if (!matchedKey && pathname === '/') {
      matchedKey = '/dashboard';
    }

    const info = matchedKey ? PAGE_ORIENTATIONS[matchedKey] : null;
    if (!info) return null;

    const text = `${info.title}. ${info.summary} ${info.keyActions.join('. ')}.`;
    this.announcePolite(text);

    if (speakAloud) {
      // Gentle spoken orientation with audio earcon
      try {
        audioCueService.navigation();
      } catch {}
      speechService.speak(text, { priority: true });
    }

    return info;
  }

  public handleRouteChange(pathname: string, voiceModeEnabled: boolean) {
    if (pathname === this.lastRoute) return;
    this.lastRoute = pathname;

    // Do not auto-speak orientation inside active exam interface to avoid interrupting question flow
    if (pathname.startsWith('/exam/')) return;

    // Announce to screen reader
    this.orientCurrentPage(pathname, voiceModeEnabled);
  }
}

export const screenReaderAnnouncer = new ScreenReaderAnnouncer();
