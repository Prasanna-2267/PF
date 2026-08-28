import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDemoStudyClock } from '@/lib/demo-study';
import { claimReward, checkoutFocusSession, getActiveFocusSession, getDailySummary, getEligibleRecoveries, getRewardWallet, getStreak, heartbeatFocusSession, recoverStreak, startFocusSession, type FocusSource } from '@/lib/focus-api';
import { useRewardStore } from '@/lib/reward-store';
import { isDemoSession } from '@/lib/student-session';

export const focusKeys = {
  active: ['student', 'focus', 'active'] as const,
  daily: ['student', 'focus', 'daily'] as const,
  wallet: ['student', 'rewards', 'wallet'] as const,
  streak: ['student', 'streak'] as const,
  recovery: ['student', 'streak', 'recovery'] as const,
};

export function useStudySession(source: Extract<FocusSource, 'HOME' | 'TRACKER'>, fallbackTargetMinutes: number) {
  const demo = isDemoSession();
  const demoStudy = useDemoStudyClock();
  const demoPoints = useRewardStore((state) => state.points);
  const demoHearts = useRewardStore((state) => state.hearts);
  const demoStreak = useRewardStore((state) => state.streak);
  const demoAward = useRewardStore((state) => state.awardDailyStreak);
  const demoRecover = useRewardStore((state) => state.recoverStreak);
  const queryClient = useQueryClient();
  const [clock, setClock] = useState<{ sessionId: string | null; extraSeconds: number }>({ sessionId: null, extraSeconds: 0 });
  const active = useQuery({ queryKey: focusKeys.active, queryFn: getActiveFocusSession, enabled: !demo });
  const daily = useQuery({ queryKey: focusKeys.daily, queryFn: getDailySummary, enabled: !demo });
  const wallet = useQuery({ queryKey: focusKeys.wallet, queryFn: getRewardWallet, enabled: !demo });
  const streak = useQuery({ queryKey: focusKeys.streak, queryFn: getStreak, enabled: !demo });
  const recovery = useQuery({ queryKey: focusKeys.recovery, queryFn: getEligibleRecoveries, enabled: !demo });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: focusKeys.active }),
      queryClient.invalidateQueries({ queryKey: focusKeys.daily }),
      queryClient.invalidateQueries({ queryKey: focusKeys.wallet }),
      queryClient.invalidateQueries({ queryKey: focusKeys.streak }),
      queryClient.invalidateQueries({ queryKey: focusKeys.recovery }),
      queryClient.invalidateQueries({ queryKey: ['student', 'streak', 'calendar'] }),
    ]);
  };

  const toggle = useMutation({
    mutationFn: async () => {
      if (demo) {
        const wasActive = demoStudy.checkedIn;
        const seconds = demoStudy.sessionSeconds;
        const points = wasActive ? demoAward(demoStudy.todayMinutes, fallbackTargetMinutes) : 0;
        demoStudy.toggleSession();
        return wasActive ? { seconds, points } : null;
      }
      const current = active.data?.session;
      if (!current) { await startFocusSession(source); return null; }
      const result = await checkoutFocusSession(current.id);
      const earnedPoints = result.rewardClaim?.status === 'PENDING' ? result.rewardClaim.points : 0;
      if (result.rewardClaim?.status === 'PENDING') await claimReward(result.rewardClaim.id);
      return { seconds: result.session.durationSeconds ?? 0, points: earnedPoints };
    },
    onSuccess: async () => { if (!demo) await refresh(); },
  });

  const recover = useMutation({
    mutationFn: async () => {
      if (demo) return demoRecover();
      const date = recovery.data?.data[0]?.date;
      if (!date) return false;
      await recoverStreak(date);
      return true;
    },
    onSuccess: async () => { if (!demo) await refresh(); },
  });

  const remoteSession = active.data?.session;
  useEffect(() => {
    if (demo || !remoteSession) return;
    const interval = setInterval(() => setClock((current) => current.sessionId === remoteSession.id ? { ...current, extraSeconds: current.extraSeconds + 1 } : { sessionId: remoteSession.id, extraSeconds: 1 }), 1000);
    return () => clearInterval(interval);
  }, [demo, remoteSession]);
  useEffect(() => {
    if (demo || !remoteSession) return;
    const interval = setInterval(() => { void heartbeatFocusSession(remoteSession.id); }, 60_000);
    return () => clearInterval(interval);
  }, [demo, remoteSession]);

  if (demo) return {
      ...demoStudy,
      points: demoPoints,
      hearts: demoHearts,
      streak: demoStreak,
      longestStreak: Math.max(12, demoStreak),
      targetMinutes: fallbackTargetMinutes,
      recoveryAvailable: false,
      isPending: toggle.isPending || recover.isPending,
      error: null as string | null,
      toggleSession: () => toggle.mutateAsync(),
      recoverStreak: () => recover.mutate(),
    };
  const startedAt = remoteSession ? new Date(remoteSession.startedAt).getTime() : 0;
  const extraSeconds = remoteSession && clock.sessionId === remoteSession.id ? clock.extraSeconds : 0;
  const sessionSeconds = remoteSession ? remoteSession.elapsedSeconds + extraSeconds : 0;
  const targetMinutes = daily.data?.targetMinutes ?? fallbackTargetMinutes;
  const todayMinutes = Math.floor(((daily.data?.focusSeconds ?? 0) + sessionSeconds) / 60);
  const requestError = active.error ?? daily.error ?? wallet.error ?? streak.error;
  return {
    checkedIn: Boolean(remoteSession), startedAt: remoteSession ? startedAt : null, sessionSeconds, todayMinutes,
    targetPercent: Math.min(100, Math.round((todayMinutes / targetMinutes) * 100)),
    points: wallet.data?.points ?? 0, hearts: wallet.data?.hearts ?? 0,
    streak: streak.data?.currentStreak ?? 0, longestStreak: streak.data?.longestStreak ?? 0,
    targetMinutes, recoveryAvailable: Boolean(recovery.data?.data.length),
    isPending: toggle.isPending || recover.isPending,
    error: requestError instanceof Error ? requestError.message : requestError ? 'Focus data is temporarily unavailable.' : null,
    toggleSession: () => toggle.mutateAsync(), recoverStreak: () => recover.mutate(),
  };
}
