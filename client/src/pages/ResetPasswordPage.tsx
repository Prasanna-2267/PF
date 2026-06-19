import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard, Button, ErrorText, TextInput } from '../components/ui';
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
    <AuthCard title="Reset password" subtitle="Enter the code from your email and a new password">
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextInput label="Email" type="email" value={form.email} onChange={update('email')} required />
        <TextInput
          label="Reset code"
          inputMode="numeric"
          maxLength={6}
          value={form.code}
          onChange={update('code')}
          required
        />
        <TextInput
          label="New password"
          type="password"
          value={form.newPassword}
          onChange={update('newPassword')}
          minLength={8}
          required
        />
        <ErrorText>{error}</ErrorText>
        {info ? <p className="text-sm text-emerald-400">{info}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-400">
        <Link to="/login" className="text-violet-400 hover:underline">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
