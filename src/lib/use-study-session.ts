import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claimReward, checkoutFocusSession, getActiveFocusSession, getDailySummary, getEligibleRecoveries, getRewardWallet, getStreak, heartbeatFocusSession, recoverStreak, startFocusSession, type DailySummary, type FocusCheckout, type FocusSource, type StreakSnapshot } from '@/lib/focus-api';

export const focusKeys = {
  active: ['student', 'focus', 'active'] as const,
  daily: ['student', 'focus', 'daily'] as const,
  wallet: ['student', 'rewards', 'wallet'] as const,
  streak: ['student', 'streak'] as const,
  recovery: ['student', 'streak', 'recovery'] as const,
};

type ToggleResult =
  | { kind: 'started' }
  | { kind: 'completed'; seconds: number; points: number };
type ActiveFocusPayload = Awaited<ReturnType<typeof getActiveFocusSession>>;
type FocusMutationContext = { previous: ActiveFocusPayload };

export function useStudySession(source: Extract<FocusSource, 'HOME' | 'TRACKER'>) {
  const queryClient = useQueryClient();
  const interactionLock = useRef(false);
  const [clock, setClock] = useState<{ sessionId: string | null; extraSeconds: number }>({ sessionId: null, extraSeconds: 0 });
  const active = useQuery({ queryKey: focusKeys.active, queryFn: getActiveFocusSession });
  const daily = useQuery({ queryKey: focusKeys.daily, queryFn: getDailySummary });
  const wallet = useQuery({ queryKey: focusKeys.wallet, queryFn: getRewardWallet });
  const streak = useQuery({ queryKey: focusKeys.streak, queryFn: getStreak });
  const recovery = useQuery({ queryKey: focusKeys.recovery, queryFn: getEligibleRecoveries });

  const markRelatedDataStale = () => {
    void queryClient.invalidateQueries({ queryKey: focusKeys.recovery, refetchType: 'none' });
    void queryClient.invalidateQueries({ queryKey: ['student', 'streak', 'calendar'], refetchType: 'none' });
    void queryClient.invalidateQueries({ queryKey: ['student', 'tracker'], refetchType: 'none' });
  };

  const applyCheckoutResult = (result: FocusCheckout) => {
    queryClient.setQueryData(focusKeys.active, { session: null, serverTime: result.session.serverTime });
    if (result.dailyActivity) {
      queryClient.setQueryData<DailySummary>(focusKeys.daily, (current) => current ? {
        ...current,
        targetMinutes: result.dailyActivity!.targetMinutes,
        focusSeconds: result.dailyActivity!.focusSeconds,
        readingSeconds: result.dailyActivity!.readingSeconds,
        practiceSeconds: result.dailyActivity!.practiceSeconds,
        revisionSeconds: result.dailyActivity!.revisionSeconds,
        focusSessionCount: result.dailyActivity!.focusSessionCount,
        qualifiesStreak: result.dailyActivity!.qualifiesStreak,
        goalCompleted: result.dailyActivity!.goalCompleted,
        progressPercent: Math.min(100, Math.round((result.dailyActivity!.focusSeconds / Math.max(1, result.dailyActivity!.targetMinutes * 60)) * 100)),
        lastActivityAt: result.dailyActivity!.lastActivityAt,
        serverTime: result.session.serverTime,
      } : current);
    }
    queryClient.setQueryData<StreakSnapshot>(focusKeys.streak, (current) => current ? {
      ...current,
      currentStreak: result.streak.currentStreak,
      longestStreak: result.streak.longestStreak,
      lastQualifiedDate: result.streak.lastQualifiedDate,
      serverTime: result.session.serverTime,
    } : current);
    markRelatedDataStale();
  };

  const toggle = useMutation<ToggleResult, Error, void, FocusMutationContext>({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: focusKeys.active });
      const previous = queryClient.getQueryData<ActiveFocusPayload>(focusKeys.active)
        ?? { session: null, serverTime: new Date().toISOString() };
      const current = previous.session;
      if (current) {
        queryClient.setQueryData(focusKeys.active, { session: null, serverTime: new Date().toISOString() });
      } else {
        const now = new Date().toISOString();
        queryClient.setQueryData(focusKeys.active, {
          session: {
            id: `pending-${Date.now()}`,
            source,
            sourceId: null,
            plannedDurationSeconds: null,
            status: 'ACTIVE' as const,
            startedAt: now,
            lastHeartbeatAt: now,
            checkedOutAt: null,
            abandonedAt: null,
            durationSeconds: null,
            elapsedSeconds: 0,
            serverTime: now,
          },
          serverTime: now,
        });
      }
      return { previous };
    },
    mutationFn: async () => {
      const current = active.data?.session;
      if (!current) {
        const result = await startFocusSession(source);
        queryClient.setQueryData(focusKeys.active, { session: result.session, serverTime: result.session.serverTime });
        return { kind: 'started' };
      }
      const result = await checkoutFocusSession(current.id);
      applyCheckoutResult(result);
      const earnedPoints = result.rewardClaim?.status === 'PENDING' ? result.rewardClaim.points : 0;
      if (result.rewardClaim?.status === 'PENDING') {
        void claimReward(result.rewardClaim.id)
          .then(({ wallet: updatedWallet }) => queryClient.setQueryData(focusKeys.wallet, updatedWallet))
          .catch(() => { void queryClient.invalidateQueries({ queryKey: focusKeys.wallet }); });
      }
      return { kind: 'completed', seconds: result.session.durationSeconds ?? 0, points: earnedPoints };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(focusKeys.active, context.previous);
    },
  });

  const recover = useMutation({
    mutationFn: async () => {
      const date = recovery.data?.data[0]?.date;
      if (!date) return false;
      const result = await recoverStreak(date);
      queryClient.setQueryData(focusKeys.streak, result.streak);
      void queryClient.invalidateQueries({ queryKey: focusKeys.wallet });
      void queryClient.invalidateQueries({ queryKey: focusKeys.recovery });
      void queryClient.invalidateQueries({ queryKey: ['student', 'streak', 'calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['student', 'tracker'], refetchType: 'none' });
      return true;
    },
  });

  const remoteSession = active.data?.session;
  useEffect(() => {
    if (!remoteSession) return;
    const interval = setInterval(() => setClock((current) => current.sessionId === remoteSession.id ? { ...current, extraSeconds: current.extraSeconds + 1 } : { sessionId: remoteSession.id, extraSeconds: 1 }), 1000);
    return () => clearInterval(interval);
  }, [remoteSession]);
  useEffect(() => {
    if (!remoteSession) return;
    const interval = setInterval(() => { void heartbeatFocusSession(remoteSession.id); }, 60_000);
    return () => clearInterval(interval);
  }, [remoteSession]);

  const toggleSession = async () => {
    if (interactionLock.current) return null;
    interactionLock.current = true;
    try {
      const result = await toggle.mutateAsync();
      return result.kind === 'completed' ? { seconds: result.seconds, points: result.points } : null;
    } finally {
      interactionLock.current = false;
    }
  };

  const startedAt = remoteSession ? new Date(remoteSession.startedAt).getTime() : 0;
  const extraSeconds = remoteSession && clock.sessionId === remoteSession.id ? clock.extraSeconds : 0;
  const sessionSeconds = remoteSession ? remoteSession.elapsedSeconds + extraSeconds : 0;
  const targetMinutes = daily.data?.targetMinutes ?? 0;
  const todayMinutes = Math.floor(((daily.data?.focusSeconds ?? 0) + sessionSeconds) / 60);
  const requestError = active.error ?? daily.error ?? wallet.error ?? streak.error;
  return {
    checkedIn: Boolean(remoteSession), startedAt: remoteSession ? startedAt : null, sessionSeconds, todayMinutes,
    targetPercent: Math.min(100, Math.round((todayMinutes / targetMinutes) * 100)),
    points: wallet.data?.points ?? 0, hearts: wallet.data?.hearts ?? 0, heartCap: wallet.data?.heartCap ?? 0,
    streak: streak.data?.currentStreak ?? 0, longestStreak: streak.data?.longestStreak ?? 0,
    targetMinutes, recoveryAvailable: Boolean(recovery.data?.data.length),
    isLoading: active.isLoading || daily.isLoading || wallet.isLoading || streak.isLoading,
    isPending: toggle.isPending || recover.isPending,
    error: requestError instanceof Error ? requestError.message : requestError ? 'Focus data is temporarily unavailable.' : null,
    toggleSession, recoverStreak: () => recover.mutate(),
  };
}
