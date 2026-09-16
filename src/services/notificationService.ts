// ── DrishtiX Real-World Notification Service ─────────────────────────────
// Supports real-time cross-tab synchronization via BroadcastChannel,
// localStorage persistence, audio alerts, and accessible voice narration.

import { audioCueService } from './audioCueService';
import { speechService } from './speechService';

export interface AppNotification {
  id: string;
  type: 'exam' | 'study-material' | 'pyq' | 'announcement' | 'system';
  title: string;
  message: string;
  timestamp: number; // Unix timestamp ms
  read: boolean;
  link?: string;      // Target route to navigate to (e.g. '/exams', '/study-materials')
  priority?: 'normal' | 'high' | 'urgent';
  author?: string;
}

const STORAGE_KEY = 'drishtix_notifications';
const CHANNEL_NAME = 'drishtix_notifications_channel';

const INITIAL_SEEDED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-seed-1',
    type: 'exam',
    title: 'New Mock Test: SSC CGL Tier 1 Full Length',
    message: 'General Intelligence, Reasoning & Quantitative Aptitude test with 25 questions is now available with 1.5x PwD time allocation.',
    timestamp: Date.now() - 1000 * 60 * 25, // 25 mins ago
    read: false,
    link: '/exams',
    priority: 'high',
    author: 'Examination Controller',
  },
  {
    id: 'notif-seed-2',
    type: 'study-material',
    title: 'New Audio Study Material: Indian Constitution',
    message: 'Key constitutional articles, fundamental rights, and writ provisions summary notes with phonetic audio narration.',
    timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
    read: false,
    link: '/study-materials',
    priority: 'normal',
    author: 'Faculty Academic Cell',
  },
  {
    id: 'notif-seed-3',
    type: 'announcement',
    title: 'Welcome to DrishtiX Autonomous Platform',
    message: 'Autonomous scribe-free examination environment is active. You can navigate, listen, and answer all questions using voice commands.',
    timestamp: Date.now() - 1000 * 60 * 360, // 6 hours ago
    read: true,
    link: '/dashboard',
    priority: 'normal',
    author: 'System Administrator',
  },
];

type NotificationListener = (notifications: AppNotification[], latest?: AppNotification) => void;

class NotificationService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<NotificationListener> = new Set();
  private cache: AppNotification[] | null = null;

  constructor() {
    this.initChannel();
    this.initStorageListener();
  }

  private initChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'NEW_NOTIFICATION') {
            const incoming: AppNotification = event.data.payload;
            this.handleIncomingNotification(incoming);
          }
        };
      }
    } catch (err) {
      console.warn('[NotificationService] BroadcastChannel init error:', err);
    }
  }

  private initStorageListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          this.cache = JSON.parse(e.newValue);
          this.notifyListeners();
        } catch {}
      }
    });

    window.addEventListener('drishtix_internal_notification', (e: any) => {
      if (e.detail) {
        this.handleIncomingNotification(e.detail);
      }
    });
  }

  private handleIncomingNotification(incoming: AppNotification) {
    const list = this.getAll();
    if (!list.some(n => n.id === incoming.id)) {
      const updated = [incoming, ...list];
      this.save(updated);

      // Play audio earcon chime
      try {
        audioCueService.select();
      } catch {}

      // Notify visually impaired candidate via TTS if speech feedback is active
      try {
        const announceText = `New notification: ${incoming.title}. ${incoming.message}`;
        speechService.speak(announceText, { priority: false });
      } catch {}

      this.notifyListeners(incoming);
    }
  }

  public getAll(): AppNotification[] {
    if (this.cache) return this.cache;
    if (typeof window === 'undefined') return INITIAL_SEEDED_NOTIFICATIONS;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.cache = JSON.parse(raw);
        return this.cache || [];
      }
      // Seed initially if none found
      this.cache = [...INITIAL_SEEDED_NOTIFICATIONS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
      return this.cache;
    } catch (e) {
      console.warn('[NotificationService] Error reading notifications:', e);
      return INITIAL_SEEDED_NOTIFICATIONS;
    }
  }

  public getNotifications(): AppNotification[] {
    return this.getAll();
  }

  public getUnreadCount(): number {
    return this.getAll().filter(n => !n.read).length;
  }

  public markAsRead(id: string) {
    const list = this.getAll().map(n => (n.id === id ? { ...n, read: true } : n));
    this.save(list);
    this.notifyListeners();
  }

  public markAllAsRead() {
    const list = this.getAll().map(n => ({ ...n, read: true }));
    this.save(list);
    this.notifyListeners();
  }

  public clearAll() {
    this.save([]);
    this.notifyListeners();
  }

  public broadcastNotification(
    data: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
  ): AppNotification {
    const newNotification: AppNotification = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      read: false,
    };

    const current = this.getAll();
    const updated = [newNotification, ...current];
    this.save(updated);

    // 1. Broadcast to other browser tabs (Student Portals & Admin Portals)
    try {
      this.channel?.postMessage({
        type: 'NEW_NOTIFICATION',
        payload: newNotification,
      });
    } catch (err) {
      console.warn('[NotificationService] Broadcast error:', err);
    }

    // 2. Dispatch local event for same-window updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('drishtix_internal_notification', {
          detail: newNotification,
        })
      );
    }

    this.notifyListeners(newNotification);
    return newNotification;
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    listener(this.getAll());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private save(list: AppNotification[]) {
    this.cache = list;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        console.warn('[NotificationService] Save error:', err);
      }
    }
  }

  private notifyListeners(latest?: AppNotification) {
    const current = this.getAll();
    this.listeners.forEach(fn => fn(current, latest));
  }
}

export const notificationService = new NotificationService();
