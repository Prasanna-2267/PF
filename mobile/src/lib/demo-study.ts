import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';

type StudyState = {
  checkedIn: boolean;
  startedAt: number | null;
  todayBaseMinutes: number;
  toggleSession: () => void;
};

export const useStudyStore = create<StudyState>((set, get) => ({
  checkedIn: false,
  startedAt: null,
  todayBaseMinutes: 78,
  toggleSession: () => {
    const { checkedIn } = get();
    set(checkedIn ? { checkedIn: false, startedAt: null } : { checkedIn: true, startedAt: Date.now() });
  },
}));

export const demoStudy = {
  targetMinutes: 120,
  streak: 6,
  momentum: 84,
  syllabusPercent: 42,
  revisions: 18,
  exam: { label: 'UPSC Prelims 2026', date: '26 Nov 2026', daysLeft: 124, pressure: 57 },
  lastLesson: { title: 'Constitutional Framework', subject: 'Indian Polity', progress: 62, pages: '18 / 29 pages' },
};

export function useDemoStudyClock() {
  const state = useStudyStore();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!state.checkedIn) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [state.checkedIn]);
  return useMemo(() => {
    const currentNow = now ?? state.startedAt ?? 0;
    const sessionSeconds = state.checkedIn && state.startedAt ? Math.floor((currentNow - state.startedAt) / 1000) : 0;
    const todayMinutes = state.todayBaseMinutes + Math.floor(sessionSeconds / 60);
    return { ...state, sessionSeconds, todayMinutes, targetPercent: Math.min(100, Math.round((todayMinutes / demoStudy.targetMinutes) * 100)) };
  }, [now, state]);
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatMinutes(minutes: number) { const hours = Math.floor(minutes / 60); const remainder = minutes % 60; return hours ? `${hours}h ${remainder}m` : `${remainder}m`; }
