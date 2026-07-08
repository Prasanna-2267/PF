import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Input, PasswordInput, useToast } from '../components/ui';
import { LockIcon } from '../components/ui/icons';
import { AuthShell } from '../components/layout';
import { authApi, errorMessage } from '../features/auth/auth.api';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();
  const initialEmail = (location.state as { email?: string } | null)?.email ?? '';

  const [form, setForm] = useState({ email: initialEmail, code: '', newPassword: '' });
  const [error, setError] = useState('');

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const reset = useMutation({
    mutationFn: () => authApi.resetPassword(form),
    onSuccess: ({ message }) => {
      success(message || 'Password updated. You can now log in.');
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    reset.mutate();
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter the code from your email and choose a new password"
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <div className="animate-slide-up">
        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-fg">
          <LockIcon size={22} />
        </span>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            required
          />
          <Input
            label="Reset code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="tabular"
            value={form.code}
            onChange={update('code')}
            required
          />
          <PasswordInput
            label="New password"
            hint="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            value={form.newPassword}
            onChange={update('newPassword')}
            required
          />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" fullWidth loading={reset.isPending}>
            Update password
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
