import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { bootstrapAuth } from './features/auth/auth.api';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';

function App() {
  // Attempt a silent login (via the refresh cookie) on first load.
  useEffect(() => {
    void bootstrapAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
