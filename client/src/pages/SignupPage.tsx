import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Input, PasswordInput } from '../components/ui';
import { UserIcon } from '../components/ui/icons';
import { AuthShell } from '../components/layout';
import { GoogleButton } from '../components/GoogleButton';
import { authApi, errorMessage } from '../features/auth/auth.api';

export function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const signup = useMutation({
    mutationFn: () => authApi.signup(form),
    onSuccess: () => navigate('/verify-otp', { state: { email: form.email } }),
    onError: (err) => setError(errorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    signup.mutate();
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start learning with Parallax Flow"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="animate-slide-up">
        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-fg">
          <UserIcon size={22} />
        </span>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            label="Full name"
            autoComplete="name"
            leftIcon={<UserIcon size={18} />}
            value={form.name}
            onChange={update('name')}
            required
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            required
          />
          <Input
            label="Phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={update('phone')}
            required
          />
          <PasswordInput
            label="Password"
            hint="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={update('password')}
            required
          />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" fullWidth loading={signup.isPending}>
            Create account
          </Button>
        </form>
        <div className="mt-4">
          <GoogleButton onError={setError} />
        </div>
      </div>
    </AuthShell>
  );
}
