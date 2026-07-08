import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Badge, Button, Input, PasswordInput } from '../../components/ui';
import { ShieldIcon } from '../../components/ui/icons';
import { AuthShell } from '../../components/layout';
import { authApi, errorMessage, type AuthResponse } from '../../features/auth/auth.api';
import { useAuthStore } from '../../lib/auth-store';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const login = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: ({ user, accessToken }: AuthResponse) => {
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        setError('This account does not have admin access.');
        return;
      }
      setAuth(user, accessToken);
      navigate('/admin', { replace: true });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    login.mutate();
  }

  return (
    <AuthShell
      title="Admin sign in"
      subtitle={
        <span className="inline-flex items-center gap-2">
          <Badge tone="gold" size="sm" icon={<ShieldIcon size={12} />}>
            Admin
          </Badge>
          Authorized administrators only
        </span>
      }
    >
      <div className="animate-slide-up">
        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-soft text-gold-soft-fg">
          <ShieldIcon size={22} />
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
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={update('password')}
            required
          />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" fullWidth loading={login.isPending}>
            Sign in
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
