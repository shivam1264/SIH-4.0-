import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ToastProvider } from './context/ToastContext';
import { VoiceAssistantProvider } from './context/VoiceAssistantContext';

// Lazy-loaded pages
const Landing       = lazy(() => import('./pages/Landing'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const Onboarding    = lazy(() => import('./pages/Onboarding'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const ExamSelection = lazy(() => import('./pages/ExamSelection'));
const ExamInterface = lazy(() => import('./pages/ExamInterface'));
const Results       = lazy(() => import('./pages/Results'));
const Practice      = lazy(() => import('./pages/Practice'));
const Performance   = lazy(() => import('./pages/Performance'));
const StudyMaterials = lazy(() => import('./pages/StudyMaterials'));
const PreviousYearPapers = lazy(() => import('./pages/PreviousYearPapers'));
const ExamHistory   = lazy(() => import('./pages/ExamHistory'));
const Profile       = lazy(() => import('./pages/Profile'));
const Settings      = lazy(() => import('./pages/Settings'));
const AdminDashboard= lazy(() => import('./pages/AdminDashboard'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAuth();
  if (isLoggedIn) {
    if (user?.role === 'admin') return <Navigate to="/admin?tab=dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        {/* Student */}
        <Route path="/onboarding"      element={<Onboarding />} />
        <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/exams"           element={<ProtectedRoute><ExamSelection /></ProtectedRoute>} />
        <Route path="/exam/:examId"    element={<ProtectedRoute><ExamInterface /></ProtectedRoute>} />
        <Route path="/results/:attemptId" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/practice"        element={<ProtectedRoute><Practice /></ProtectedRoute>} />
        <Route path="/study-materials" element={<ProtectedRoute><StudyMaterials /></ProtectedRoute>} />
        <Route path="/pyqs"            element={<ProtectedRoute><PreviousYearPapers /></ProtectedRoute>} />
        <Route path="/performance"     element={<ProtectedRoute><Performance /></ProtectedRoute>} />
        <Route path="/history"         element={<ProtectedRoute><ExamHistory /></ProtectedRoute>} />
        <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings"        element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <VoiceAssistantProvider>
              <AppRoutes />
            </VoiceAssistantProvider>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </AccessibilityProvider>
  );
}
