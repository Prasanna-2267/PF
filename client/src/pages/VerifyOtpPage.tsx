import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, AuthShell, Button, Input } from '../components/ui';
import { authApi, errorMessage } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const email = (location.state as { email?: string } | null)?.email ?? '';
  const sentTo = email || 'your email';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, accessToken } = await authApi.verifyOtp({ code });
      setAuth(user, accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError('');
    setInfo('');
    try {
      await authApi.resendOtp();
      setInfo('A new code has been sent.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${sentTo}`}
      footer={
        <>
          Wrong email?{' '}
          <Link to="/signup" className="text-accent hover:underline">
            Start over
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="Verification code"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <Alert>{error}</Alert>
        {info && <Alert tone="success">{info}</Alert>}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Verifying…' : 'Verify'}
        </Button>
      </form>
      <button type="button" onClick={resend} className="w-full text-center text-sm text-muted hover:text-ink">
        Resend code
      </button>
    </AuthShell>
  );
}
