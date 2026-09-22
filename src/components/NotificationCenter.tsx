import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Volume2,
  GraduationCap,
  BookOpen,
  Award,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { notificationService, AppNotification } from '../services/notificationService';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => notificationService.getAll());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [incomingToast, setIncomingToast] = useState<AppNotification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = notificationService.subscribe((list, latestNew) => {
      setNotifications(list);
      if (latestNew) {
        setIncomingToast(latestNew);
        const timer = setTimeout(() => {
          setIncomingToast(prev => (prev?.id === latestNew.id ? null : prev));
        }, 7000);
        return () => clearTimeout(timer);
      }
    });

    return unsub;
  }, []);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerBtnRef.current &&
        !triggerBtnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerBtnRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    audioCueService.select();
    if (next) {
      if (unreadCount > 0) {
        speechService.speak(`Notifications opened. You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`);
      } else {
        speechService.speak('Notifications opened. No unread notifications.');
      }
    }
  };

  const handleItemClick = (notif: AppNotification) => {
    notificationService.markAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleReadAloud = (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    speechService.speak(`${notif.title}. ${notif.message}`, { priority: true });
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'exam':
        return <GraduationCap size={16} color="#4F46E5" />;
      case 'study-material':
        return <BookOpen size={16} color="#059669" />;
      case 'pyq':
        return <Award size={16} color="#D97706" />;
      case 'announcement':
        return <Sparkles size={16} color="#7C3AED" />;
      default:
        return <ShieldCheck size={16} color="#2563EB" />;
    }
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* ── Header Notification Bell Trigger Button ── */}
      <button
        ref={triggerBtnRef}
        id="drishtix-notifications-trigger"
        onClick={handleToggle}
        aria-label={`Notifications: ${unreadCount} unread`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={`Notifications (${unreadCount} unread)`}
        style={{
          position: 'relative',
          padding: '0.4rem',
          borderRadius: '0.5rem',
          color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
          background: isOpen ? 'var(--primary-light)' : 'var(--bg-surface)',
          border: '1px solid var(--border)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#EF4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              minWidth: 16,
              height: 16,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--bg-header)',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Notification Center Panel ── */}
      {isOpen && (
        <div
          ref={panelRef}
          id="notification-panel"
          role="dialog"
          aria-label="Notification Center"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxWidth: 'calc(100vw - 24px)',
            background: 'var(--bg-card)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    border: '1px solid var(--primary)',
                  }}
                >
                  {unreadCount} New
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {unreadCount > 0 && (
                <button
                  className="btn-ghost"
                  onClick={() => notificationService.markAllAsRead()}
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} /> Mark Read
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={() => setIsOpen(false)}
                style={{ padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                aria-label="Close notifications"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-card)',
            }}
          >
            <button
              onClick={() => setFilter('all')}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '0.35rem',
                border: 'none',
                cursor: 'pointer',
                background: filter === 'all' ? 'var(--primary)' : 'transparent',
                color: filter === 'all' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '0.35rem',
                border: 'none',
                cursor: 'pointer',
                background: filter === 'unread' ? 'var(--primary)' : 'transparent',
                color: filter === 'unread' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div
            id="notification-panel-list"
            data-scrollable="true"
            style={{ maxHeight: 340, overflowY: 'auto', padding: '0.25rem 0' }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Check size={28} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5, color: '#10B981' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>You're all caught up!</p>
                <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0', opacity: 0.75 }}>
                  New uploads by your teachers & exam cell will appear here in real time.
                </p>
              </div>
            ) : (
              filtered.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid var(--border)',
                    background: notif.read ? 'transparent' : 'rgba(37, 99, 235, 0.04)',
                    cursor: notif.link ? 'pointer' : 'default',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                  onMouseLeave={e =>
                    (e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(37, 99, 235, 0.04)')
                  }
                >
                  {/* Type Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '0.5rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {getIconForType(notif.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: notif.read ? 600 : 800,
                          color: 'var(--text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: '#2563EB',
                            flexShrink: 0,
                          }}
                          title="Unread"
                        />
                      )}
                    </div>

                    <p
                      style={{
                        margin: '0.2rem 0 0.4rem 0',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.4,
                      }}
                    >
                      {notif.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                        {formatTimeAgo(notif.timestamp)} {notif.author ? `• ${notif.author}` : ''}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          onClick={e => handleReadAloud(e, notif)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.15rem 0.35rem',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                          title="Read aloud"
                          aria-label={`Read aloud: ${notif.title}`}
                        >
                          <Volume2 size={12} />
                        </button>
                        {notif.link && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.15rem',
                            }}
                          >
                            Open <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0.6rem 1rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Say "Read notifications"</span>
            {notifications.length > 0 && (
              <button
                className="btn-ghost"
                onClick={() => notificationService.clearAll()}
                style={{ fontSize: '0.7rem', color: 'var(--danger)', padding: '0.15rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Trash2 size={11} /> Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Real-World Live Notification Pop-up Toast Banner ── */}
      {incomingToast && (
        <aside
          aria-live="assertive"
          role="status"
          style={{
            position: 'fixed',
            top: 68,
            right: 20,
            maxWidth: 380,
            background: 'var(--bg-card)',
            borderRadius: '0.75rem',
            border: '2px solid var(--primary)',
            boxShadow: '0 14px 40px rgba(0, 0, 0, 0.25)',
            zIndex: 9999,
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '0.5rem',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getIconForType(incomingToast.type)}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
                {incomingToast.title}
              </span>
              <button
                onClick={() => setIncomingToast(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.1rem' }}
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>

            <p style={{ margin: '0.25rem 0 0.6rem 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {incomingToast.message}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {incomingToast.link && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    notificationService.markAsRead(incomingToast.id);
                    setIncomingToast(null);
                    navigate(incomingToast.link!);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', fontWeight: 700 }}
                >
                  View Now
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={() => {
                  speechService.speak(`${incomingToast.title}. ${incomingToast.message}`, { priority: true });
                }}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Volume2 size={13} /> Listen
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
