import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, Button, ErrorText, TextInput } from '../components/ui';
import { GoogleButton } from '../components/GoogleButton';
import { authApi, errorMessage } from '../features/auth/auth.api';
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
      // Unverified accounts receive a fresh code server-side → route to verify.
      const status =
        typeof err === 'object' && err && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 403) {
        navigate('/verify-otp', { state: { email: form.email } });
        return;
      }
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to continue">
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextInput label="Email" type="email" value={form.email} onChange={update('email')} required />
        <TextInput
          label="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
          required
        />
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="text-center text-sm">
        <Link to="/forgot-password" className="text-slate-400 hover:text-slate-200">
          Forgot password?
        </Link>
      </p>
      <GoogleButton onError={setError} />
      <p className="text-center text-sm text-slate-400">
        New here?{' '}
        <Link to="/signup" className="text-violet-400 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
