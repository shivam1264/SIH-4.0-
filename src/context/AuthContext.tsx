import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { DEMO_STUDENT, DEMO_ADMIN } from '../data/mockData';
import { authApi } from '../services/api';

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; role?: 'student' | 'admin'; error?: string }>;
  register: (name: string, email: string, password: string, role?: 'student' | 'admin') => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isLoggedIn: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

// Simulated user store fallback
const MOCK_USERS: Record<string, { user: User; password: string }> = {
  'aryan@example.com':        { user: DEMO_STUDENT, password: 'student123' },
  'rahul@student.in':         { user: DEMO_STUDENT, password: 'student123' },
  'admin@drishtix.in':        { user: DEMO_ADMIN,   password: 'admin123' },
  'admin@sightexamai.in':     { user: DEMO_ADMIN,   password: 'admin123' },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('sight-exam-user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem('sight-exam-user', JSON.stringify(user));
    else localStorage.removeItem('sight-exam-user');
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      // First try live Node.js + Express backend
      const res = await authApi.login(email, password);
      if (res && res.user) {
        setUser(res.user);
        return { ok: true, role: res.user.role };
      }
    } catch (err: any) {
      console.warn('Backend login error, checking fallback store:', err?.message);
    }

    // Resilient local fallback
    const entry = MOCK_USERS[email.toLowerCase()];
    if (!entry) return { ok: false, error: 'No account found with this email.' };
    if (entry.password !== password) return { ok: false, error: 'Incorrect password.' };
    setUser(entry.user);
    return { ok: true, role: entry.user.role };
  };

  const register = async (name: string, email: string, _password: string, role: 'student' | 'admin' = 'student') => {
    try {
      const res = await authApi.register({ name, email, password: _password, role });
      if (res && res.user) {
        setUser(res.user);
        return { ok: true };
      }
    } catch (err: any) {
      console.warn('Backend register error, checking local store:', err?.message);
    }

    if (MOCK_USERS[email.toLowerCase()]) return { ok: false, error: 'Email already registered.' };
    const newUser: User = {
      id: `student-${Date.now()}`,
      name, email, role,
      examInterests: [],
      createdAt: new Date().toISOString(),
      totalAttempts: 0,
      avgScore: 0,
    };
    MOCK_USERS[email.toLowerCase()] = { user: newUser, password: _password };
    setUser(newUser);
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem('sight_exam_jwt_token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, login, register, logout, isLoggedIn: !!user }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
