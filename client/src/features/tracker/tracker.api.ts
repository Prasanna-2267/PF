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
};

export type TrackerSettings = Partial<{
  examDate: string | null;
  examLabel: string | null;
  dailyTargetMinutes: number;
  activeStageId: string | null;
}>;

export const trackerApi = {
  get: () => api.get<Tracker>('/tracker').then((r) => r.data),
  checkin: () => api.post('/tracker/checkin').then((r) => r.data),
  checkout: () => api.post('/tracker/checkout').then((r) => r.data),
  settings: (d: TrackerSettings) => api.patch<Tracker>('/tracker/settings', d).then((r) => r.data),
};
