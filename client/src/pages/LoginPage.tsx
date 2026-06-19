import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AuthShell, Button, Input } from '../components/ui';
import { GoogleButton } from '../components/GoogleButton';
import { authApi, errorInfo, errorMessage } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, accessToken } = await authApi.login(form);
      setAuth(user, accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (errorInfo(err).status === 403) {
        navigate('/verify-otp', { state: { email: form.email } });
        return;
      }
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue"
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input label="Email" type="email" value={form.email} onChange={update('email')} required />
        <Input label="Password" type="password" value={form.password} onChange={update('password')} required />
        <Alert>{error}</Alert>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <div className="text-center text-sm">
        <Link to="/forgot-password" className="text-muted hover:text-ink">
          Forgot password?
        </Link>
      </div>
      <GoogleButton onError={setError} />
    </AuthShell>
  );
}
