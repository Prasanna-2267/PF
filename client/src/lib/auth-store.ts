import { create } from 'zustand';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'student' | 'admin' | 'superadmin';
  emailVerified: boolean;
  activeStageId: string | null;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
}));
