import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { authApi, errorMessage } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';
import { useTheme } from '../lib/theme';
import { Divider } from './ui';

/** "Continue with Google" — renders nothing unless VITE_GOOGLE_CLIENT_ID is set. */
export function GoogleButton({ onError }: { onError?: (message: string) => void }) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const theme = useTheme((s) => s.theme);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-4">
      <Divider>or</Divider>
      <div className="flex justify-center">
        <GoogleLogin
          theme={theme === 'dark' ? 'filled_black' : 'outline'}
          shape="pill"
          width="320"
          onSuccess={async (cred) => {
            if (!cred.credential) return;
            try {
              const { user, accessToken } = await authApi.google(cred.credential);
              setAuth(user, accessToken);
              navigate('/dashboard', { replace: true });
            } catch (err) {
              onError?.(errorMessage(err));
            }
          }}
          onError={() => onError?.('Google sign-in failed')}
        />
      </div>
    </div>
  );
}
