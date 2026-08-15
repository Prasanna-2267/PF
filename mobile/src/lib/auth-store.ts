import { create } from 'zustand';

export type LearnerPlan = 'free' | 'paid';
export type AuthUser = { id: string; name: string; email: string; phone: string | null; role: 'student' | 'admin' | 'superadmin'; plan: LearnerPlan; emailVerified: boolean; activeStageId: string | null; avatarUrl: string | null };
export type StudentSignupIdentity = { name: string; email: string; phone?: string | null };
type AuthState = { user: AuthUser | null; accessToken: string | null; status: 'loading' | 'authenticated' | 'unauthenticated'; setAuth: (user: AuthUser, accessToken: string) => void; completeStudentSignup: (identity: StudentSignupIdentity) => void; beginDemoSession: () => void; beginPaidDemoSession: () => void; beginAdminDemoSession: () => void; setAccessToken: (accessToken: string) => void; setUser: (user: AuthUser) => void; clear: () => void };
const demoUser: AuthUser = { id: 'demo-student', name: 'Aditi Sharma', email: 'aditi@example.com', phone: '+91 98765 43210', role: 'student', plan: 'free', emailVerified: true, activeStageId: 'upsc-prelims', avatarUrl: null };
const demoPaidUser: AuthUser = { id: 'demo-paid-student', name: 'Aditi Premium', email: 'paid@example.com', phone: '+91 98765 40001', role: 'student', plan: 'paid', emailVerified: true, activeStageId: 'upsc-prelims', avatarUrl: null };
const demoAdmin: AuthUser = { id: 'demo-admin', name: 'Mock Admin', email: 'admin@parallaxflow.demo', phone: '+91 90000 00002', role: 'admin', plan: 'paid', emailVerified: true, activeStageId: null, avatarUrl: null };
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'unauthenticated',
  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  completeStudentSignup: (identity) => set({
    user: {
      id: `student-${Date.now()}`,
      name: identity.name.trim(),
      email: identity.email.trim().toLowerCase(),
      phone: identity.phone?.trim() || null,
      role: 'student',
      plan: 'free',
      emailVerified: true,
      activeStageId: null,
      avatarUrl: null,
    },
    accessToken: 'ui-only-signup-token',
    status: 'authenticated',
  }),
  beginDemoSession: () => set({ user: demoUser, accessToken: 'ui-only-demo-token', status: 'authenticated' }),
  beginPaidDemoSession: () => set({ user: demoPaidUser, accessToken: 'ui-only-paid-demo-token', status: 'authenticated' }),
  beginAdminDemoSession: () => set({ user: demoAdmin, accessToken: 'ui-only-admin-demo-token', status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
}));
