import { api } from '@/lib/api';

export type FocusSource = 'HOME' | 'TRACKER' | 'STUDY_TASK' | 'NOTE';
export type FocusSession = { id: string; source: FocusSource; sourceId: string | null; plannedDurationSeconds: number | null; status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED'; startedAt: string; lastHeartbeatAt: string; checkedOutAt: string | null; abandonedAt: string | null; durationSeconds: number | null; elapsedSeconds: number; serverTime: string };
export type DailySummary = { date: string; timezone: string; targetMinutes: number; focusSeconds: number; readingSeconds: number; practiceSeconds: number; revisionSeconds: number; focusSessionCount: number; qualifiesStreak: boolean; goalCompleted: boolean; progressPercent: number; lastActivityAt: string | null; serverTime: string };
export type RewardWallet = { points: number; hearts: number; heartCap: number; pendingClaims: number; version: number; updatedAt: string | null; heartRefreshAt: string; serverTime: string };
export type StreakSnapshot = { currentStreak: number; longestStreak: number; lastQualifiedDate: string | null; todayState: 'active' | 'protected' | 'pending'; nextProtectionDeadline: string; hearts: number; heartCap: number; timezone: string; serverTime: string };
export type StreakCalendar = { month: string; timezone: string; cells: { date: string; status: 'active' | 'protected' | 'missed' | 'today' | 'future' | 'untracked'; focusSeconds: number; targetMinutes: number | null }[]; streak: StreakSnapshot };
export type RewardClaim = { id: string; points: number; hearts: number; status: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED'; expiresAt: string | null };
export type FocusCheckout = { session: FocusSession; dailyActivity: DailySummary | null; streak: { currentStreak: number; longestStreak: number; lastQualifiedDate: string | null }; rewardClaim: RewardClaim | null };

const idempotencyKey = (scope: string) => `${scope}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function getActiveFocusSession() { return (await api.get<{ session: FocusSession | null; serverTime: string }>('/student/focus-sessions/active')).data; }
export async function startFocusSession(source: FocusSource) { return (await api.post<{ created: boolean; session: FocusSession }>('/student/focus-sessions', { source })).data; }
export async function heartbeatFocusSession(id: string) { return (await api.post<{ session: FocusSession }>(`/student/focus-sessions/${id}/heartbeat`)).data; }
export async function checkoutFocusSession(id: string) { return (await api.post<FocusCheckout>(`/student/focus-sessions/${id}/checkout`, {}, { headers: { 'Idempotency-Key': idempotencyKey(`focus-${id}`) } })).data; }
export async function getDailySummary() { return (await api.get<DailySummary>('/student/daily-summary')).data; }
export async function getRewardWallet() { return (await api.get<RewardWallet>('/student/rewards/wallet')).data; }
export async function getStreak() { return (await api.get<StreakSnapshot>('/student/streak')).data; }
export async function getStreakCalendar(month: string) { return (await api.get<StreakCalendar>('/student/streak/calendar', { params: { month } })).data; }
export async function getEligibleRecoveries() { return (await api.get<{ data: { date: string; heartCost: number; expiresAt: string }[]; heartCost: number; timezone: string }>('/student/streak/recoveries/eligible')).data; }
export async function recoverStreak(date: string) { return (await api.post<{ recoveredDate: string; streak: StreakSnapshot }>('/student/streak/recoveries', { date }, { headers: { 'Idempotency-Key': idempotencyKey(`recovery-${date}`) } })).data; }
export async function claimReward(claimId: string) { return (await api.post<{ wallet: RewardWallet }>(`/student/rewards/claims/${claimId}/claim`, {}, { headers: { 'Idempotency-Key': idempotencyKey(`claim-${claimId}`) } })).data; }
