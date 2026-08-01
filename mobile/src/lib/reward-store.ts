import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const monthlyHeartLimit = 3;
const oneDay = 86_400_000;

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function monthKey(date: Date) {
  return dateKey(date).slice(0, 7);
}

function previousDateKey(date: Date) {
  return dateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
}

function differenceInDays(from: string, to: Date) {
  const [year, month, day] = from.split('-').map(Number);
  const fromUtc = Date.UTC(year, month - 1, day);
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / oneDay);
}

type RewardState = {
  points: number;
  hearts: number;
  heartMonth: string;
  streak: number;
  lastCompletedDate: string | null;
  lastRewardDate: string | null;
  syncMonth: (today?: Date) => void;
  awardDailyStreak: (minutesStudied: number, targetMinutes: number, today?: Date) => number;
  recoverStreak: (today?: Date) => boolean;
};

const now = new Date();

export const useRewardStore = create<RewardState>()(persist((set) => ({
  points: 300,
  hearts: monthlyHeartLimit,
  heartMonth: monthKey(now),
  streak: 6,
  lastCompletedDate: previousDateKey(now),
  lastRewardDate: null,
  syncMonth: (today = new Date()) => set((state) => state.heartMonth === monthKey(today) ? state : { ...state, hearts: monthlyHeartLimit, heartMonth: monthKey(today) }),
  awardDailyStreak: (minutesStudied, targetMinutes, today = new Date()) => {
    let awarded = 0;
    set((state) => {
      const currentMonth = monthKey(today);
      const normalized = state.heartMonth === currentMonth ? state : { ...state, hearts: monthlyHeartLimit, heartMonth: currentMonth };
      const todayKey = dateKey(today);
      if (normalized.lastRewardDate === todayKey) return normalized;
      awarded = minutesStudied >= targetMinutes ? 20 : 10;
      const continuesStreak = normalized.lastCompletedDate ? differenceInDays(normalized.lastCompletedDate, today) <= 1 : false;
      return { ...normalized, points: normalized.points + awarded, streak: continuesStreak ? normalized.streak + 1 : 1, lastCompletedDate: todayKey, lastRewardDate: todayKey };
    });
    return awarded;
  },
  recoverStreak: (today = new Date()) => {
    let recovered = false;
    set((state) => {
      const currentMonth = monthKey(today);
      const normalized = state.heartMonth === currentMonth ? state : { ...state, hearts: monthlyHeartLimit, heartMonth: currentMonth };
      const missed = normalized.lastCompletedDate ? differenceInDays(normalized.lastCompletedDate, today) > 1 : false;
      if (!missed || normalized.hearts <= 0) return normalized;
      recovered = true;
      return { ...normalized, hearts: normalized.hearts - 1, lastCompletedDate: previousDateKey(today) };
    });
    return recovered;
  },
}), {
  name: 'parallax-flow-rewards',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ points: state.points, hearts: state.hearts, heartMonth: state.heartMonth, streak: state.streak, lastCompletedDate: state.lastCompletedDate, lastRewardDate: state.lastRewardDate }),
}));

export function canRecoverStreak(lastCompletedDate: string | null, today = new Date()) {
  return Boolean(lastCompletedDate && differenceInDays(lastCompletedDate, today) > 1);
}

export { monthlyHeartLimit };
