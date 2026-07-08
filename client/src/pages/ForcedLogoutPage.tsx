import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { ShieldArt } from '../components/decor';
import { AuthShell } from '../components/layout';

/**
 * Shown when the account was signed in on another device and this session was
 * ended (single-device policy). Calm, reassuring — nothing alarming.
 */
export function ForcedLogoutPage() {
  const navigate = useNavigate();

  return (
    <AuthShell title="Signed in on another device">
      <div className="animate-slide-up space-y-6">
        <ShieldArt className="h-36 w-auto" />
        <p className="text-[15px] leading-relaxed text-muted">
          Your account was signed in on another device, so you were signed out here. Only one device
          can be active at a time.
        </p>
        <Button fullWidth onClick={() => navigate('/login', { replace: true })}>
          Sign in again
        </Button>
      </div>
    </AuthShell>
  );
}
