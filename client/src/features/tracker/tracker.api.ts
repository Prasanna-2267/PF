import { api } from '../../lib/api';

export type Tracker = {
  checkedIn: boolean;
  streak: number;
  todayMinutes: number;
  targetMinutes: number;
  momentum: number;
  syllabus: { total: number; completed: number; percent: number };
  totalRevisions: number;
  exam: { date: string | null; label: string | null; daysLeft: number | null; pressure: number };
  lastLesson: { id: string; title: string } | null;
  activeStageId: string | null;
  activeStage: {
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
  } | null;
};

export type TrackerSettings = Partial<{
  examDate: string | null;
  examLabel: string | null;
  dailyTargetMinutes: number;
  activeStageId: string | null;
}>;

export type StudyInsights = {
  daily: { date: string; minutes: number }[];
  hourly: number[];
  peakHour: number | null;
  subjects: { id: string; name: string; total: number; completed: number }[];
  summary: {
    totalMinutes: number;
    daysStudied: number;
    avgPerActiveDay: number;
    weekMinutes: number;
    lastWeekMinutes: number;
    bestDayMinutes: number;
    bestDayDate: string | null;
    completedLessons: number;
    recentCompleted14: number;
  };
};

export const trackerApi = {
  get: () => api.get<Tracker>('/tracker').then((r) => r.data),
  insights: () => api.get<StudyInsights>('/tracker/insights').then((r) => r.data),
  checkin: () => api.post('/tracker/checkin').then((r) => r.data),
  checkout: () => api.post('/tracker/checkout').then((r) => r.data),
  settings: (d: TrackerSettings) => api.patch<Tracker>('/tracker/settings', d).then((r) => r.data),
};
