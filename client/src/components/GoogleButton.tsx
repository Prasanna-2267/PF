import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { authApi, errorMessage } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';

/** "Continue with Google" — renders nothing unless VITE_GOOGLE_CLIENT_ID is set. */
export function GoogleButton({ onError }: { onError?: (message: string) => void }) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-800" />
        or
        <span className="h-px flex-1 bg-slate-800" />
      </div>
      <div className="flex justify-center">
        <GoogleLogin
          theme="filled_black"
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
