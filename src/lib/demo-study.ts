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
  // Primitive selectors keep React 19's external-store snapshot stable.
  const checkedIn = useStudyStore((state) => state.checkedIn);
  const startedAt = useStudyStore((state) => state.startedAt);
  const todayBaseMinutes = useStudyStore((state) => state.todayBaseMinutes);
  const toggleSession = useStudyStore((state) => state.toggleSession);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!checkedIn) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [checkedIn]);
  return useMemo(() => {
    const currentNow = now ?? startedAt ?? 0;
    const sessionSeconds = checkedIn && startedAt ? Math.max(0, Math.floor((currentNow - startedAt) / 1000)) : 0;
    const todayMinutes = todayBaseMinutes + Math.floor(sessionSeconds / 60);
    return { checkedIn, startedAt, todayBaseMinutes, toggleSession, sessionSeconds, todayMinutes, targetPercent: Math.min(100, Math.round((todayMinutes / demoStudy.targetMinutes) * 100)) };
  }, [checkedIn, now, startedAt, todayBaseMinutes, toggleSession]);
}

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatMinutes(minutes: number) { const hours = Math.floor(minutes / 60); const remainder = minutes % 60; return hours ? `${hours}h ${remainder}m` : `${remainder}m`; }
