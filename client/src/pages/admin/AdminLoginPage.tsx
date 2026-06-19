import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AuthShell, Button, Input } from '../../components/ui';
import { authApi, errorMessage } from '../../features/auth/auth.api';
import { useAuthStore } from '../../lib/auth-store';

export function AdminLoginPage() {
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
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        setError('This account does not have admin access.');
        return;
      }
      setAuth(user, accessToken);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Admin sign in" subtitle="Authorized administrators only">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input label="Email" type="email" value={form.email} onChange={update('email')} required />
        <Input label="Password" type="password" value={form.password} onChange={update('password')} required />
        <Alert>{error}</Alert>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
