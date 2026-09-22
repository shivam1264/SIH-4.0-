// ── Drishti Autonomous Voice Action & Scrolling Engine ───────────────────────
// Hands-free DOM manipulation, continuous auto-scroll, section targeting, and
// accessible element clicking designed for motor and visual accessibility.

export interface ClickResult {
  success: boolean;
  elementLabel?: string;
  tagName?: string;
  message: string;
}

export type AutoScrollListener = (isActive: boolean, speedMultiplier: number) => void;

class DrishtiActionService {
  private _autoScrollAnimationId: number | null = null;
  private _isAutoScrolling = false;
  private _speedMultiplier = 1.0; // 0.5x to 3.0x
  private _baseSpeedPxPerFrame = 0.9; // ~54px per second at 60fps
  private _listeners: Set<AutoScrollListener> = new Set();
  private _lastActiveContainer: HTMLElement | Window | null = null;

  constructor() {
    this._injectStyles();
  }

  private _injectStyles() {
    if (typeof document === 'undefined') return;
    const styleId = 'drishti-action-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes drishtiVoicePulse {
        0% { outline: 4px solid #3B82F6; outline-offset: 3px; box-shadow: 0 0 16px rgba(59, 130, 246, 0.7); }
        50% { outline: 5px solid #10B981; outline-offset: 6px; box-shadow: 0 0 24px rgba(16, 185, 129, 0.9); }
        100% { outline: 4px solid #3B82F6; outline-offset: 3px; box-shadow: 0 0 16px rgba(59, 130, 246, 0.7); }
      }
      .voice-action-target-pulse {
        animation: drishtiVoicePulse 0.9s ease-in-out 2 !important;
        border-radius: 6px !important;
        transition: all 0.2s ease !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Deeply scans for the primary scrollable container on the active screen.
   * Priority:
   * 1. Open modal, dialog, or drawer ([role="dialog"], .modal-box, .modal-overlay, #notification-panel)
   *    -> Traverses inside the modal to find the actual element with computed overflow-y: auto/scroll
   *       (such as [data-scrollable="true"], #shortcuts-modal-scroll, #notification-panel-list)
   * 2. Active exam question card or question palette (.exam-scroll-area, #exam-question-card, #exam-palette)
   * 3. Main content area (#main-content) in AppLayout
   * 4. Any element with [data-scrollable="true"], .overflow-y-auto, .overflow-y-scroll, or scrollable table
   * 5. Active focused element if scrollable
   * 6. Window / documentElement
   */
  public getScrollContainer(): HTMLElement | Window {
    if (typeof document === 'undefined') return {} as Window;

    const isScrollable = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      if (el.scrollHeight <= el.clientHeight) return false;
      if (typeof window === 'undefined') return true;
      const style = window.getComputedStyle(el);
      return (
        style.overflowY === 'auto' ||
        style.overflowY === 'scroll' ||
        (style.overflowY === 'visible' && el.clientHeight > 0)
      );
    };

    // Helper: find scrollable child inside a parent container
    const findScrollableChild = (parent: HTMLElement): HTMLElement | null => {
      // 1. Explicit scrollable targets
      const tagged = parent.querySelector<HTMLElement>(
        '[data-scrollable="true"], #shortcuts-modal-scroll, #calibration-wizard-scroll, #notification-panel-list'
      );
      if (tagged && tagged.scrollHeight > tagged.clientHeight) return tagged;

      // 2. Query elements with explicit overflow styles or classes
      const candidates = Array.from(
        parent.querySelectorAll<HTMLElement>(
          '.overflow-y-auto, .overflow-y-scroll, [style*="overflow"], div, ul, section'
        )
      );

      for (const c of candidates) {
        if (c.scrollHeight > c.clientHeight + 4) {
          if (typeof window !== 'undefined') {
            const style = window.getComputedStyle(c);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              return c;
            }
          } else {
            return c;
          }
        }
      }

      return null;
    };

    // 1. Check open modal or dialog (.modal-box, [role="dialog"], .modal-overlay, [aria-modal="true"])
    const modal = document.querySelector<HTMLElement>(
      '.modal-box, [role="dialog"], .modal-overlay, [aria-modal="true"]'
    );
    if (modal) {
      const innerScrollable = findScrollableChild(modal);
      if (innerScrollable) {
        this._lastActiveContainer = innerScrollable;
        return innerScrollable;
      }
      if (isScrollable(modal)) {
        this._lastActiveContainer = modal;
        return modal;
      }
    }

    // 2. Check open NotificationCenter panel
    const notifPanel = document.querySelector<HTMLElement>('#notification-panel, [aria-label="Notification Center"]');
    if (notifPanel) {
      const notifList = findScrollableChild(notifPanel);
      if (notifList) {
        this._lastActiveContainer = notifList;
        return notifList;
      }
    }

    // 3. Check exam question scroll area or card if present
    const examCards = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.exam-scroll-area, #exam-question-card, .question-scroll-wrapper, .question-card, #exam-palette, .question-palette'
      )
    );
    for (const card of examCards) {
      if (isScrollable(card)) {
        this._lastActiveContainer = card;
        return card;
      }
      const child = findScrollableChild(card);
      if (child) {
        this._lastActiveContainer = child;
        return child;
      }
    }

    // 4. Check #main-content in AppLayout
    const main = document.getElementById('main-content');
    if (main && isScrollable(main)) {
      this._lastActiveContainer = main;
      return main;
    }

    // 5. Check any explicitly tagged scrollable or table
    const scrollables = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-scrollable="true"], .overflow-y-auto, .overflow-y-scroll, .table-container'
      )
    );
    for (const el of scrollables) {
      if (isScrollable(el)) {
        this._lastActiveContainer = el;
        return el;
      }
    }

    // 6. Default to window / document.documentElement
    this._lastActiveContainer = typeof window !== 'undefined' ? window : ({} as Window);
    return this._lastActiveContainer;
  }

  // ── Directional Scrolling ──────────────────────────────────────────────────

  /**
   * Smoothly scrolls down by a given amount (default ~420px or 55% viewport).
   * Universally scrolls active container, modal, #main-content, and window.
   */
  public scrollDown(amount?: number): boolean {
    if (typeof window === 'undefined') return false;
    const delta = amount ?? Math.round(window.innerHeight * 0.55);
    const container = this.getScrollContainer();

    if (container && container !== window) {
      const el = container as HTMLElement;
      el.scrollBy({ top: delta, behavior: 'smooth' });
    }

    // Fallback: also scroll #main-content if it is different from container
    const main = document.getElementById('main-content');
    if (main && main !== container && main.scrollHeight > main.clientHeight) {
      main.scrollBy({ top: delta, behavior: 'smooth' });
    }

    // Also smoothly scroll window / documentElement
    window.scrollBy({ top: delta, behavior: 'smooth' });
    if (document.documentElement) {
      document.documentElement.scrollBy({ top: delta, behavior: 'smooth' });
    }

    return true;
  }

  /**
   * Smoothly scrolls up by a given amount (default ~420px).
   * Universally scrolls active container, modal, #main-content, and window.
   */
  public scrollUp(amount?: number): boolean {
    if (typeof window === 'undefined') return false;
    const delta = amount ?? Math.round(window.innerHeight * 0.55);
    const container = this.getScrollContainer();

    if (container && container !== window) {
      const el = container as HTMLElement;
      el.scrollBy({ top: -delta, behavior: 'smooth' });
    }

    const main = document.getElementById('main-content');
    if (main && main !== container && main.scrollHeight > main.clientHeight) {
      main.scrollBy({ top: -delta, behavior: 'smooth' });
    }

    window.scrollBy({ top: -delta, behavior: 'smooth' });
    if (document.documentElement) {
      document.documentElement.scrollBy({ top: -delta, behavior: 'smooth' });
    }

    return true;
  }

  /**
   * Smoothly scrolls all the way to the top of the active view.
   */
  public scrollToTop(): boolean {
    if (typeof window === 'undefined') return false;
    const container = this.getScrollContainer();

    if (container && container !== window) {
      (container as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    }

    const main = document.getElementById('main-content');
    if (main && typeof main.scrollTo === 'function') {
      main.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return true;
  }

  /**
   * Smoothly scrolls all the way to the bottom of the active view.
   */
  public scrollToBottom(): boolean {
    if (typeof window === 'undefined') return false;
    const container = this.getScrollContainer();

    if (container && container !== window) {
      const el = container as HTMLElement;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }

    const main = document.getElementById('main-content');
    if (main && typeof main.scrollTo === 'function') {
      main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
    }

    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
    return true;
  }

  // ── Continuous Auto-Scroll Mode ───────────────────────────────────────────

  /**
   * Starts butter-smooth continuous auto-scrolling using requestAnimationFrame.
   */
  public startAutoScroll(multiplier: number = 1.0): boolean {
    this.stopAutoScroll();
    this._isAutoScrolling = true;
    this._speedMultiplier = Math.max(0.4, Math.min(3.0, multiplier));
    this._notifyListeners();

    if (typeof window === 'undefined') return true;

    const scrollStep = () => {
      if (!this._isAutoScrolling) return;

      const container = this.getScrollContainer();
      const step = this._baseSpeedPxPerFrame * this._speedMultiplier;

      if (container === window) {
        window.scrollBy(0, step);
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY >= maxScroll - 4) {
          this.stopAutoScroll();
          return;
        }
      } else {
        const el = container as HTMLElement;
        el.scrollTop += step;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
          this.stopAutoScroll();
          return;
        }
      }

      this._autoScrollAnimationId = window.requestAnimationFrame(scrollStep);
    };

    this._autoScrollAnimationId = window.requestAnimationFrame(scrollStep);
    return true;
  }

  /**
   * Halts continuous auto-scroll immediately.
   */
  public stopAutoScroll(): boolean {
    if (!this._isAutoScrolling && this._autoScrollAnimationId === null) {
      return false;
    }

    this._isAutoScrolling = false;
    if (typeof window !== 'undefined' && this._autoScrollAnimationId !== null) {
      window.cancelAnimationFrame(this._autoScrollAnimationId);
      this._autoScrollAnimationId = null;
    }
    this._notifyListeners();
    return true;
  }

  /**
   * Increases or decreases auto-scroll speed.
   */
  public adjustSpeed(delta: number): number {
    this._speedMultiplier = Math.max(0.4, Math.min(3.0, Number((this._speedMultiplier + delta).toFixed(1))));
    if (!this._isAutoScrolling) {
      this.startAutoScroll(this._speedMultiplier);
    } else {
      this._notifyListeners();
    }
    return this._speedMultiplier;
  }

  public isAutoScrolling(): boolean {
    return this._isAutoScrolling;
  }

  public getSpeed(): number {
    return this._speedMultiplier;
  }

  public onAutoScrollChange(callback: AutoScrollListener): () => void {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  private _notifyListeners() {
    this._listeners.forEach(cb => {
      try {
        cb(this._isAutoScrolling, this._speedMultiplier);
      } catch (err) {
        console.error('[DrishtiAction] Listener error:', err);
      }
    });
  }

  // ── Smart Section-Targeted Scrolling ──────────────────────────────────────

  /**
   * Scrolls smoothly to a semantic landmark or section on the current page.
   */
  public scrollToSection(sectionTarget: string): boolean {
    if (typeof document === 'undefined') return false;

    const normalized = sectionTarget.toLowerCase().trim();
    let targetEl: HTMLElement | null = null;

    if (normalized.includes('notification') || normalized.includes('alert') || normalized.includes('notice')) {
      targetEl = document.querySelector('#notification-panel, #notification-panel-list, #drishtix-notifications-trigger, [aria-label*="Notification"]') as HTMLElement;
    } else if (normalized.includes('option') || normalized.includes('choice') || normalized.includes('answer')) {
      targetEl = document.querySelector('#exam-options, .options-grid, [aria-label*="Options"], [role="radiogroup"]') as HTMLElement;
    } else if (normalized.includes('question') || normalized.includes('problem') || normalized.includes('sawal')) {
      targetEl = document.querySelector('#question-text, #exam-question-card, .question-card, h2[id*="question"], [aria-label*="Question"]') as HTMLElement;
    } else if (normalized.includes('formula') || normalized.includes('equation') || normalized.includes('math')) {
      targetEl = document.querySelector('.math-formula, #math-formula-view, [aria-label*="formula"], .katex') as HTMLElement;
    } else if (normalized.includes('diagram') || normalized.includes('chart') || normalized.includes('graph') || normalized.includes('figure') || normalized.includes('image')) {
      targetEl = document.querySelector('.exam-diagram, #diagram-view, svg.exam-chart, img[alt*="diagram"]') as HTMLElement;
    } else if (normalized.includes('submit') || normalized.includes('finish')) {
      targetEl = document.querySelector('#submit-exam-btn, button[aria-label*="Submit"], button:has(svg.lucide-send)') as HTMLElement;
    } else if (normalized.includes('timer') || normalized.includes('clock') || normalized.includes('time')) {
      targetEl = document.querySelector('[aria-label*="Time remaining"], .exam-timer, #exam-timer') as HTMLElement;
    } else if (normalized.includes('palette') || normalized.includes('grid') || normalized.includes('overview')) {
      targetEl = document.querySelector('.question-palette, #exam-palette, [aria-label*="Question Palette"]') as HTMLElement;
    } else if (normalized.includes('instruction') || normalized.includes('guideline') || normalized.includes('rule')) {
      targetEl = document.querySelector('.instructions-card, #exam-instructions, [aria-label*="Instructions"]') as HTMLElement;
    } else if (normalized.includes('header') || normalized.includes('top bar') || normalized.includes('navbar')) {
      targetEl = document.querySelector('header, nav, #app-header') as HTMLElement;
    } else if (normalized.includes('table') || normalized.includes('score') || normalized.includes('result') || normalized.includes('scorecard')) {
      targetEl = document.querySelector('table, .results-grid, #score-card, .table-container') as HTMLElement;
    } else if (normalized.includes('solution') || normalized.includes('explanation')) {
      targetEl = document.querySelector('.solution-card, #solution-view, [aria-label*="Explanation"]') as HTMLElement;
    } else if (normalized.includes('material') || normalized.includes('note') || normalized.includes('study')) {
      targetEl = document.querySelector('.study-materials-grid, #study-materials-container, [aria-label*="Study"]') as HTMLElement;
    }

    // Generic fallback: match by id or class
    if (!targetEl) {
      targetEl = document.querySelector(`#${normalized}, .${normalized}`) as HTMLElement;
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this._highlightElement(targetEl);
      return true;
    }

    return false;
  }

  // ── Autonomous Element Clicking & Interaction ─────────────────────────────

  /**
   * Scans interactive elements in the DOM, fuzzy matches against target label,
   * highlights it with an accessible pulse, and invokes .click().
   */
  public clickElementByVoice(targetQuery: string): ClickResult {
    if (typeof document === 'undefined') {
      return { success: false, message: 'Document is not available' };
    }

    const query = targetQuery.toLowerCase().trim().replace(/^(the|a|an)\s+/i, '');
    if (!query) {
      return { success: false, message: 'Empty click query provided' };
    }

    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, a, [role="button"], [role="tab"], [role="radio"], input[type="button"], input[type="submit"], summary'
      )
    ).filter(el => {
      // Must be visible and enabled
      if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    let bestMatch: HTMLElement | null = null;
    let bestScore = 0;

    const queryTokens = query.split(/\s+/).filter(t => t.length > 2);

    for (const el of candidates) {
      const text = (el.innerText || el.textContent || '').toLowerCase().trim();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase().trim();
      const title = (el.getAttribute('title') || '').toLowerCase().trim();
      const id = (el.id || '').toLowerCase().trim();

      const combined = `${text} ${ariaLabel} ${title} ${id}`;

      let score = 0;

      // Exact match
      if (text === query || ariaLabel === query) {
        score = 100;
      } else if (combined.includes(query)) {
        score = 80;
      } else {
        // Token match
        const matchingTokens = queryTokens.filter(tok => combined.includes(tok));
        if (matchingTokens.length > 0) {
          score = (matchingTokens.length / Math.max(1, queryTokens.length)) * 60;
        }
      }

      // Bonus for shorter button text (more specific)
      if (score > 0 && text.length > 0 && text.length < 30) {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = el;
      }
    }

    if (bestMatch && bestScore >= 40) {
      const label = bestMatch.getAttribute('aria-label') || bestMatch.innerText || bestMatch.getAttribute('title') || 'Element';
      bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this._highlightElement(bestMatch);
      bestMatch.focus();

      // Trigger click smoothly
      try {
        bestMatch.click();
      } catch (err) {
        console.error('[DrishtiAction] Click failed:', err);
      }

      return {
        success: true,
        elementLabel: label.trim(),
        tagName: bestMatch.tagName.toLowerCase(),
        message: `Clicked ${label.trim()}`,
      };
    }

    return {
      success: false,
      message: `Could not find an interactive button or link matching "${targetQuery}" on this screen.`,
    };
  }

  // ── Accessible Focus Traversal ────────────────────────────────────────────

  public focusNext(): boolean {
    if (typeof document === 'undefined') return false;

    const focusables = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (focusables.length === 0) return false;

    const currentIdx = focusables.indexOf(document.activeElement as HTMLElement);
    const nextIdx = currentIdx < 0 || currentIdx >= focusables.length - 1 ? 0 : currentIdx + 1;
    const target = focusables[nextIdx];

    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this._highlightElement(target);
    return true;
  }

  public focusPrev(): boolean {
    if (typeof document === 'undefined') return false;

    const focusables = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (focusables.length === 0) return false;

    const currentIdx = focusables.indexOf(document.activeElement as HTMLElement);
    const prevIdx = currentIdx <= 0 ? focusables.length - 1 : currentIdx - 1;
    const target = focusables[prevIdx];

    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this._highlightElement(target);
    return true;
  }

  private _highlightElement(el: HTMLElement) {
    if (!el || typeof el.classList === 'undefined') return;
    el.classList.remove('voice-action-target-pulse');
    // Force reflow
    void el.offsetWidth;
    el.classList.add('voice-action-target-pulse');

    setTimeout(() => {
      el.classList.remove('voice-action-target-pulse');
    }, 2200);
  }
}

export const drishtiActionService = new DrishtiActionService();
