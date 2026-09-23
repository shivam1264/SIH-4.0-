import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  FileText,
  Target,
  BarChart3,
  User as UserIcon,
  Settings as SettingsIcon,
  ShieldCheck,
  Eye,
  LogOut,
  Users,
  BookOpen,
  Bot,
  GraduationCap,
  Award,
  Accessibility,
  Bell,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';

import { audioCueService } from '../services/audioCueService';

interface NavItem {
  id?: string;
  label: string;
  description?: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  badge?: string;
  shortcut?: string;
  adminOnly?: boolean;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const STUDENT_NAV_GROUPS: NavGroup[] = [
  {
    heading: 'COMPETITIVE PREPARATION',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: Home, shortcut: 'Alt+1' },
      { label: 'Mock Tests', path: '/exams', icon: FileText, badge: 'Live', shortcut: 'Alt+2' },
      { label: 'Practice Drills', path: '/practice', icon: Target, badge: 'AI', shortcut: 'Alt+3' },
      { label: 'Study Materials', path: '/study-materials', icon: BookOpen, badge: 'Audio', shortcut: 'Alt+4' },
      { label: 'Past Papers (PYQs)', path: '/pyqs', icon: FileSpreadsheet, shortcut: 'Alt+5' },
    ],
  },
  {
    heading: 'ANALYTICS & RESULTS',
    items: [
      { label: 'Performance Hub', path: '/performance', icon: BarChart3, shortcut: 'Alt+6' },
      { label: 'Attempt History', path: '/history', icon: Clock, shortcut: 'Alt+7' },
      { label: 'Scorecard Review', path: '/results', icon: Award, shortcut: 'Alt+8' },
    ],
  },
  {
    heading: 'ACCESSIBILITY & PROFILE',
    items: [
      { label: 'Accessibility Settings', path: '/settings', icon: Accessibility, shortcut: 'Alt+9' },
      { label: 'Candidate Profile & PwD', path: '/profile', icon: UserIcon, shortcut: 'Alt+0' },
      { label: 'Admin Panel', path: '/admin?tab=dashboard', icon: ShieldCheck, adminOnly: true },
    ],
  },
];

const ADMIN_NAV_ITEMS: {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  badge?: string;
}[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'students', label: 'Students & Accommodations', icon: Users, badge: 'PwD' },
    { id: 'exams', label: 'Examinations', icon: FileText, badge: 'Live' },
    { id: 'questions', label: 'Question Bank', icon: BookOpen },
    { id: 'ai-generator', label: 'AI Question Generator', icon: Bot, badge: 'AI' },
    { id: 'attempts', label: 'Attempts & Speech Logs', icon: Award },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

interface Props { onClose?: () => void; }

export default function Sidebar({ onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const currentTab = searchParams.get('tab') || 'dashboard';

  function go(path: string) {
    audioCueService.navigation();
    navigate(path);
    onClose?.();
  }


  function handleLogout() {
    logout();
    navigate('/');
    onClose?.();
  }

  function getBadgeStyle(badge: string): React.CSSProperties {
    switch (badge) {
      case 'AI':
      case 'New':
        return {
          background: 'var(--badge-pink-bg)',
          color: 'var(--badge-pink-text)',
          border: '1px solid var(--badge-pink-border)',
        };
      case '99.4%':
        return {
          background: 'var(--badge-green-bg)',
          color: 'var(--badge-green-text)',
          border: '1px solid var(--badge-green-border)',
        };
      case 'WCAG':
      case 'Notes':
        return {
          background: 'var(--badge-purple-bg)',
          color: 'var(--badge-purple-text)',
          border: '1px solid var(--badge-purple-border)',
        };
      case '3':
      case 'Logs':
        return {
          background: 'var(--badge-amber-bg)',
          color: 'var(--badge-amber-text)',
          border: '1px solid var(--badge-amber-border)',
        };
      case 'PYQ':
        return {
          background: 'var(--badge-blue-bg)',
          color: 'var(--badge-blue-text)',
          border: '1px solid var(--badge-blue-border)',
        };
      case '4 Live':
      case '5 PwD':
      default:
        return {
          background: 'var(--badge-default-bg)',
          color: 'var(--badge-default-text)',
          border: '1px solid var(--badge-default-border)',
        };
    }
  }

  return (
    <nav className="sidebar" aria-label="Main navigation" role="navigation">
      {/* Brand Header: perfectly aligned with top navbar at 56px height */}
      <div
        style={{
          height: 56,
          maxHeight: 56,
          width: '100%',
          minWidth: '100%',
          maxWidth: '100%',
          padding: '0 0.85rem',
          borderBottom: '1px solid var(--sidebar-border, #E2E8F0)',
          background: 'var(--sidebar-header-bg, rgba(0, 0, 0, 0.02))',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          flexShrink: 0,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          onClick={() => go(isAdminRoute ? '/admin' : '/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            width: '100%',
            minWidth: 0,
            overflow: 'hidden',
          }}
          title={isAdminRoute ? 'DrishtiX Admin Control Center' : 'DrishtiX — Beyond Barriers, Brighter Futures'}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '0.6rem',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.2)',
              flexShrink: 0,
              overflow: 'hidden',
              padding: '2px',
            }}
          >
            <img
              src="/drishtix-logo.png"
              alt="DrishtiX Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: '1.05rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--sidebar-text, #0F172A)' }}>Drishti</span>
              <span style={{ color: '#F59E0B' }}>X</span>
              {isAdminRoute && (
                <span
                  style={{
                    fontSize: '0.58rem',
                    background: '#3B82F6',
                    color: '#fff',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    marginLeft: '6px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '0.58rem',
                color: 'var(--sidebar-text-muted, #94A3B8)',
                fontWeight: 700,
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                marginTop: '1px',
                lineHeight: 1.2,
              }}
            >
              {isAdminRoute ? 'Admin Control Center' : 'Beyond Barriers, Brighter Futures'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', padding: '0.75rem 0.65rem' }}>
        {isAdminRoute ? (
          /* Dedicated Admin Navigation (All 13 Modules) */
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--sidebar-heading, #60A5FA)', letterSpacing: '0.08em', padding: '0 0.6rem', marginBottom: '0.5rem' }}>
              ADMINISTRATION SUITE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {ADMIN_NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-link${isActive ? ' active' : ''}`}
                    onClick={() => go(`/admin?tab=${item.id}`)}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.52rem 0.7rem',
                      whiteSpace: 'nowrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                      <Icon size={16} strokeWidth={isActive ? 2.3 : 1.8} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '999px',
                          flexShrink: 0,
                          lineHeight: 1.2,
                          ...getBadgeStyle(item.badge),
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Student Navigation */
          STUDENT_NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(n => !n.adminOnly || user?.role === 'admin');
            if (!visibleItems.length) return null;

            return (
              <div key={group.heading}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--sidebar-heading, #60A5FA)', letterSpacing: '0.08em', padding: '0 0.6rem', marginBottom: '0.4rem' }}>
                  {group.heading}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path.startsWith('/admin') && location.pathname === '/admin');
                    return (
                      <button
                        key={item.path}
                        className={`sidebar-link${isActive ? ' active' : ''}`}
                        onClick={() => go(item.path)}
                        aria-current={isActive ? 'page' : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.65rem',
                          whiteSpace: 'nowrap',
                          borderRadius: '0.65rem',
                          gap: '0.45rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, textAlign: 'left', flex: 1 }}>
                          <Icon size={17} strokeWidth={isActive ? 2.3 : 1.8} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '0.83rem', whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                          {item.badge && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.42rem',
                                borderRadius: '999px',
                                flexShrink: 0,
                                lineHeight: 1.2,
                                ...getBadgeStyle(item.badge),
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.shortcut && (
                            <kbd
                              style={{
                                fontSize: '0.62rem',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                color: isActive ? '#fff' : 'var(--text-muted)',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                              }}
                            >
                              {item.shortcut}
                            </kbd>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Certified PwD Accommodations Card */}
      {!isAdminRoute && (
        <div
          style={{
            margin: '0 0.65rem 0.65rem',
            padding: '0.6rem 0.75rem',
            borderRadius: '0.65rem',
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
          role="region"
          aria-label="PwD Examination Accommodations"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em' }}>
              PwD Accommodations
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            Compensatory Extra Time: <strong style={{ color: 'var(--primary)' }}>+50% (1.5x)</strong><br />
            Compliant: <strong>RPwD Act 2016</strong>
          </div>
        </div>
      )}

      {/* Logout button */}
      <div style={{ padding: '0.65rem 0.75rem', borderTop: '1px solid var(--sidebar-border, #E2E8F0)', background: 'var(--sidebar-header-bg, transparent)', flexShrink: 0 }}>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.65rem 1rem',
            borderRadius: '0.65rem',
            background: 'var(--logout-bg, #FEF2F2)',
            border: '1px solid var(--logout-border, #FECACA)',
            color: 'var(--logout-color, #DC2626)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--logout-bg)';
            e.currentTarget.style.color = 'var(--logout-color)';
            e.currentTarget.style.borderColor = 'var(--logout-border)';
          }}
          aria-label="Logout"
        >
          <LogOut size={16} strokeWidth={2.2} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

