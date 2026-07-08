import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, OTPInput } from '../components/ui';
import { ShieldArt } from '../components/decor';
import { AuthShell } from '../components/layout';
import { authApi, errorMessage, type AuthResponse } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';

const RESEND_SECONDS = 30;

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  // Countdown until the user may request a fresh code.
  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds]);

  const verify = useMutation({
    mutationFn: (value: string) => authApi.verifyOtp({ code: value }),
    onSuccess: ({ user, accessToken }: AuthResponse) => {
      setAuth(user, accessToken);
      navigate('/dashboard', { replace: true });
    },
    onError: (err) => setError(errorMessage(err, 'That code is invalid or has expired.')),
  });

  // Resend reuses the httpOnly pf_signup cookie — no email argument needed.
  const resend = useMutation({
    mutationFn: () => authApi.resendOtp(),
    onSuccess: () => {
      setInfo('A new code has been sent.');
      setSeconds(RESEND_SECONDS);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function submit(value: string) {
    if (value.length !== 6 || verify.isPending) return;
    setError('');
    verify.mutate(value);
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        email ? (
          <>
            Enter the 6-digit code we sent to{' '}
            <span className="font-semibold text-fg">{email}</span>
          </>
        ) : (
          'Enter the 6-digit code we sent to your email'
        )
      }
      footer={
        <>
          Wrong email?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Start over
          </Link>
        </>
      }
    >
      <div className="animate-slide-up">
        <ShieldArt className="mb-6 h-24 w-auto" />
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit(code);
          }}
        >
          <div className="space-y-2">
            <span className="block text-sm font-medium text-fg">Verification code</span>
            <OTPInput
              value={code}
              onChange={(v) => {
                setCode(v);
                if (error) setError('');
              }}
              invalid={Boolean(error)}
              onComplete={submit}
            />
          </div>
          {error ? <Alert>{error}</Alert> : null}
          {info ? <Alert tone="success">{info}</Alert> : null}
          <Button type="submit" fullWidth loading={verify.isPending} disabled={code.length !== 6}>
            Verify
          </Button>
        </form>

        <div className="mt-5 flex min-h-9 items-center justify-center text-center text-sm text-muted">
          {seconds > 0 ? (
            <span>
              Resend code in{' '}
              <span className="font-semibold tabular text-fg">{seconds}s</span>
            </span>
          ) : (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              loading={resend.isPending}
              onClick={() => {
                setError('');
                setInfo('');
                resend.mutate();
              }}
            >
              {resend.isPending ? 'Sending…' : "Didn't get it? Resend code"}
            </Button>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
