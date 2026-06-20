import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { bootstrapAuth } from './features/auth/auth.api';
import { useAuthStore } from './lib/auth-store';
import { connectSocket, disconnectSocket } from './lib/socket';
import { DashboardPage } from './pages/DashboardPage';
import { NotesPage } from './pages/NotesPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SignupPage } from './pages/SignupPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminPackagesPage } from './pages/admin/AdminPackagesPage';

function App() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const clear = useAuthStore((s) => s.clear);

  // Attempt a silent login (via the refresh cookie) on first load.
  useEffect(() => {
    void bootstrapAuth();
  }, []);

  // Realtime single-device: get pushed to the login screen if we're logged out
  // because the account signed in on another device.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    connectSocket(token, () => {
      const role = useAuthStore.getState().user?.role;
      clear();
      navigate(role === 'admin' || role === 'superadmin' ? '/admin/login' : '/login', { replace: true });
    });
    return () => disconnectSocket();
  }, [status, clear, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/notes" element={<NotesPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminContentPage />} />
          <Route path="/admin/packages" element={<AdminPackagesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
