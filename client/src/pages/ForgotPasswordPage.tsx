import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Input } from '../components/ui';
import { LockIcon } from '../components/ui/icons';
import { AuthShell } from '../components/layout';
import { authApi, errorMessage } from '../features/auth/auth.api';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const forgot = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }),
    onSuccess: () => navigate('/reset-password', { state: { email } }),
    onError: (err) => setError(errorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    forgot.mutate();
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset code"
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" fullWidth loading={forgot.isPending}>
            Send reset code
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
