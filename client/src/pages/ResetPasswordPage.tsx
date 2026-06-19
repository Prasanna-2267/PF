import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, AuthShell, Button, Input } from '../components/ui';
import { authApi, errorMessage } from '../features/auth/auth.api';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email ?? '';

  const [form, setForm] = useState({ email: initialEmail, code: '', newPassword: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { message } = await authApi.resetPassword(form);
      setInfo(message);
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter the code from your email and a new password"
      footer={
        <Link to="/login" className="text-accent hover:underline">
          Back to login
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input label="Email" type="email" value={form.email} onChange={update('email')} required />
        <Input label="Reset code" inputMode="numeric" maxLength={6} value={form.code} onChange={update('code')} required />
        <Input
          label="New password"
          type="password"
          minLength={8}
          value={form.newPassword}
          onChange={update('newPassword')}
          required
        />
        <Alert>{error}</Alert>
        {info && <Alert tone="success">{info}</Alert>}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  );
}
