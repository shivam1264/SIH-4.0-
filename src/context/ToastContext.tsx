import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((message: string, type?: ToastType, title?: string, duration?: number) => void) | null = null;

// Standalone toast helper usable anywhere in the application
export const toast = {
  show: (message: string, type: ToastType = 'info', title?: string, duration: number = 4500) => {
    if (globalShowToast) {
      globalShowToast(message, type, title, duration);
    } else {
      console.log(`[Toast ${type}]:`, message);
    }
  },
  success: (message: string, title: string = 'Success') => toast.show(message, 'success', title),
  error: (message: string, title: string = 'Error') => toast.show(message, 'error', title),
  info: (message: string, title: string = 'Information') => toast.show(message, 'info', title),
  warning: (message: string, title: string = 'Notice') => toast.show(message, 'warning', title),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string, duration: number = 4500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newToast: ToastItem = { id, type, message, title, duration };

    setToasts(prev => [newToast, ...prev.slice(0, 4)]); // Keep max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => showToast(message, 'success', title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast(message, 'error', title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast(message, 'info', title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast(message, 'warning', title), [showToast]);

  useEffect(() => {
    globalShowToast = showToast;

    // Gracefully intercept window.alert so all browser alerts turn into modern accessible toasts
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      const text = String(msg ?? '');
      const lower = text.toLowerCase();
      if (lower.includes('success') || lower.includes('approved') || lower.includes('saved') || lower.includes('added') || lower.includes('cleared')) {
        showToast(text, 'success', 'Action Completed');
      } else if (lower.includes('error') || lower.includes('failed') || lower.includes('invalid')) {
        showToast(text, 'error', 'Error');
      } else if (lower.includes('warn') || lower.includes('alert') || lower.includes('caution')) {
        showToast(text, 'warning', 'Notice');
      } else {
        showToast(text, 'info', 'Notification');
      }
    };

    return () => {
      globalShowToast = null;
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, info, warning }}>
      {children}

      {/* Toast Notification Container */}
      <aside
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          maxWidth: '440px',
          width: 'calc(100vw - 2.5rem)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const config = {
            success: {
              border: '#10B981',
              bg: 'var(--bg-card, #ffffff)',
              icon: <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0 }} />,
              badgeBg: 'rgba(16, 185, 129, 0.12)',
              badgeColor: '#10B981',
              defaultTitle: 'Success',
            },
            error: {
              border: '#EF4444',
              bg: 'var(--bg-card, #ffffff)',
              icon: <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />,
              badgeBg: 'rgba(239, 68, 68, 0.12)',
              badgeColor: '#EF4444',
              defaultTitle: 'Error',
            },
            warning: {
              border: '#F59E0B',
              bg: 'var(--bg-card, #ffffff)',
              icon: <AlertTriangle size={20} color="#F59E0B" style={{ flexShrink: 0 }} />,
              badgeBg: 'rgba(245, 158, 11, 0.12)',
              badgeColor: '#F59E0B',
              defaultTitle: 'Notice',
            },
            info: {
              border: '#3B82F6',
              bg: 'var(--bg-card, #ffffff)',
              icon: <Info size={20} color="#3B82F6" style={{ flexShrink: 0 }} />,
              badgeBg: 'rgba(59, 130, 246, 0.12)',
              badgeColor: '#3B82F6',
              defaultTitle: 'Notification',
            },
          }[t.type];

          return (
            <div
              key={t.id}
              role="status"
              className="toast-card"
              style={{
                pointerEvents: 'auto',
                background: config.bg,
                color: 'var(--text)',
                borderRadius: '0.65rem',
                border: `1.5px solid ${config.border}`,
                borderLeft: `5px solid ${config.border}`,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                animation: 'toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ marginTop: '0.1rem' }}>{config.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    color: 'var(--text)',
                    marginBottom: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>{t.title || config.defaultTitle}</span>
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    color: 'var(--text)',
                    wordBreak: 'break-word',
                  }}
                >
                  {t.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.2rem',
                  borderRadius: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </aside>
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: toast.show,
      removeToast: () => {},
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
      toasts: [],
    };
  }
  return context;
}
