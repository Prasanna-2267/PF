import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Input, PasswordInput } from '../components/ui';
import { EyeIcon } from '../components/ui/icons';
import { AuthShell } from '../components/layout';
import { GoogleButton } from '../components/GoogleButton';
import { authApi, errorInfo, errorMessage, type AuthResponse } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const login = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: ({ user, accessToken }: AuthResponse) => {
      setAuth(user, accessToken);
      navigate('/dashboard', { replace: true });
    },
    onError: (err) => {
      // 403 = account exists but email not yet verified → resume verification.
      if (errorInfo(err).status === 403) {
        navigate('/verify-otp', { state: { email: form.email } });
        return;
      }
      setError(errorMessage(err));
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    login.mutate();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue your preparation"
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="animate-slide-up">
        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-fg">
          <EyeIcon size={22} />
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
          <div className="space-y-1.5">
            <PasswordInput
              label="Password"
              autoComplete="current-password"
              value={form.password}
              onChange={update('password')}
              required
            />
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-muted hover:text-fg"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" fullWidth loading={login.isPending}>
            Log in
          </Button>
        </form>
        <div className="mt-4">
          <GoogleButton onError={setError} />
        </div>
      </div>
    </AuthShell>
  );
}
