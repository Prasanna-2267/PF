import { useEffect, useState } from 'react';

function secondsUntil(deadline?: string | null): number {
  if (!deadline) return 0;
  const timestamp = new Date(deadline).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1_000));
}

export function useResendCountdown(resendAfter?: string | null) {
  const [secondsRemaining, setSecondsRemaining] = useState(() => secondsUntil(resendAfter));

  useEffect(() => {
    const update = () => setSecondsRemaining(secondsUntil(resendAfter));
    update();
    if (!resendAfter || secondsUntil(resendAfter) === 0) return undefined;
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [resendAfter]);

  return {
    secondsRemaining,
    canResend: secondsRemaining === 0,
    label: secondsRemaining > 0 ? `Resend in 00:${String(secondsRemaining).padStart(2, '0')}` : 'Resend OTP',
  };
}
