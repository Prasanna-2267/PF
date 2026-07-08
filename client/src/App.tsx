import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout, AdminLayout } from './components/layout';
import { bootstrapAuth } from './features/auth/auth.api';
import { useAuthStore } from './lib/auth-store';
import { connectSocket, disconnectSocket } from './lib/socket';
import { DashboardPage } from './pages/DashboardPage';
import { NotesPage } from './pages/NotesPage';
import { SubjectPage } from './pages/SubjectPage';
import { TrackerPage } from './pages/TrackerPage';
import { PracticePage } from './pages/PracticePage';
import { LibraryPage } from './pages/LibraryPage';
import { ReceiptPage } from './pages/ReceiptPage';
import { AccountPage } from './pages/AccountPage';
import { LessonViewerPage } from './pages/LessonViewerPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ForcedLogoutPage } from './pages/ForcedLogoutPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminStudentDetailPage } from './pages/admin/AdminStudentDetailPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminPackagesPage } from './pages/admin/AdminPackagesPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminQuestionsPage } from './pages/admin/AdminQuestionsPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

function App() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const clear = useAuthStore((s) => s.clear);

  // Attempt a silent login (via the refresh cookie) on first load.
  useEffect(() => {
    void bootstrapAuth();
  }, []);

  // Realtime single-device: get pushed out if the account signs in elsewhere.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    connectSocket(token, () => {
      const role = useAuthStore.getState().user?.role;
      clear();
      navigate(role === 'admin' || role === 'superadmin' ? '/admin/login' : '/forced-logout', {
        replace: true,
      });
    });
    return () => disconnectSocket();
  }, [status, clear, navigate]);

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forced-logout" element={<ForcedLogoutPage />} />

      {/* Student app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:subjectId" element={<SubjectPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/tracker" element={<TrackerPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/receipt/:id" element={<ReceiptPage />} />
        </Route>
        {/* Full-screen secure viewer — no app chrome */}
        <Route path="/lesson/:id" element={<LessonViewerPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/students/:id" element={<AdminStudentDetailPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/content" element={<AdminContentPage />} />
          <Route path="/admin/packages" element={<AdminPackagesPage />} />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          <Route path="/admin/questions" element={<AdminQuestionsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

/** Send users to their natural home: admins to the command centre, students to the dashboard. */
function HomeRedirect() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === 'admin' || role === 'superadmin';
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}

export default App;
