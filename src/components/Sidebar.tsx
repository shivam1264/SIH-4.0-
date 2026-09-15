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
} from 'lucide-react';

interface NavItem {
  id?: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  badge?: string;
  adminOnly?: boolean;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const STUDENT_NAV_GROUPS: NavGroup[] = [
  {
    heading: 'LEARNING & EXAMS',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: Home },
      { label: 'Mock Tests', path: '/exams', icon: FileText, badge: '4 Live' },
      { label: 'AI Practice Drills', path: '/practice', icon: Target, badge: 'New' },
    ],
  },
  {
    heading: 'ANALYTICS & RESULTS',
    items: [
      { label: 'Performance', path: '/performance', icon: BarChart3 },
    ],
  },
  {
    heading: 'ACCOUNT & SYSTEM',
    items: [
      { label: 'Profile', path: '/profile', icon: UserIcon },
      { label: 'Accessibility Settings', path: '/settings', icon: SettingsIcon },
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
    { id: 'students', label: 'Students', icon: Users, badge: '5 PwD' },
    { id: 'exams', label: 'Examinations', icon: FileText, badge: '4 Live' },
    { id: 'questions', label: 'Question Bank', icon: BookOpen },
    { id: 'ai-generator', label: 'AI Question Generator', icon: Bot, badge: 'AI' },
    { id: 'subjects', label: 'Subjects & Topics', icon: GraduationCap },
    { id: 'attempts', label: 'Attempts & Results', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility, badge: '99.4%' },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: '3' },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'profile', label: 'Admin Profile', icon: ShieldCheck },
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
    navigate(path);
    onClose?.();
  }

  function handleLogout() {
    logout();
    navigate('/');
    onClose?.();
  }

  return (
    <nav className="sidebar" aria-label="Main navigation" role="navigation">
      {/* Brand Header: perfectly aligned with top navbar at 56px height */}
      <div
        style={{
          height: 56,
          padding: '0 0.85rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 5px rgba(37,99,235,0.25)', flexShrink: 0 }}>
          <Eye size={18} strokeWidth={2.2} />
        </div>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.15, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {isAdminRoute ? 'SIGHT-EXAM AI' : 'SIGHT-EXAM'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {isAdminRoute ? 'ADMIN CONTROL CENTER' : 'EXAMS WITHOUT BARRIERS'}
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', padding: '0.75rem 0.65rem' }}>
        {isAdminRoute ? (
          /* Dedicated Admin Navigation (All 13 Modules) */
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', padding: '0 0.6rem', marginBottom: '0.5rem' }}>
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
                      padding: '0.5rem 0.7rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <Icon size={16} strokeWidth={isActive ? 2.3 : 1.8} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 500 }}>
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
                          background: item.badge === 'AI' ? '#FDF2F8' : item.badge === '99.4%' ? '#F0FDF4' : '#EFF6FF',
                          color: item.badge === 'AI' ? '#DB2777' : item.badge === '99.4%' ? '#16A34A' : '#2563EB',
                          border: `1px solid ${item.badge === 'AI' ? '#FCE7F3' : item.badge === '99.4%' ? '#BBF7D0' : '#DBEAFE'}`,
                          flexShrink: 0,
                          lineHeight: 1.2,
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
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.08em', padding: '0 0.6rem', marginBottom: '0.35rem' }}>
                  {group.heading}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
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
                          padding: '0.55rem 0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                          <Icon size={17} strokeWidth={isActive ? 2.3 : 1.8} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              background: item.badge === 'New' ? '#FDF2F8' : '#EFF6FF',
                              color: item.badge === 'New' ? '#DB2777' : '#2563EB',
                              border: `1px solid ${item.badge === 'New' ? '#FCE7F3' : '#DBEAFE'}`,
                              flexShrink: 0,
                              lineHeight: 1.2,
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
            );
          })
        )}
      </div>

      {/* Logout button */}
      <div style={{ padding: '0.65rem 0.75rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.65rem 1rem',
            borderRadius: '0.65rem',
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
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

