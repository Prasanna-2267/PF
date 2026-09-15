import { api } from '@/lib/api';

export type TrackerConsistencyDay = {
  date: string;
  totalSeconds: number;
  focusSeconds: number;
  readingSeconds: number;
  practiceSeconds: number;
  revisionSeconds: number;
  targetMinutes: number;
  goalCompleted: boolean;
  active: boolean;
};

export type TrackerSummary = {
  range: { days: 7 | 30 | 90; from: string; to: string; timezone: string };
  course: { id: string; code: string; name: string };
  consistency: TrackerConsistencyDay[];
  summary: { totalSeconds: number; dailyAverageSeconds: number; activeDays: number; goalDays: number; bestDay: { date: string; totalSeconds: number } | null; changePercent: number };
  streak: { current: number; longest: number; lastQualifiedDate: string | null };
  readiness: { totalNotes: number; completedNotes: number; syllabusPercent: number; revisions: number; notesWithActivity: number };
  exam: { date: string | null; precision: 'DAY' | 'MONTH' | null; daysRemaining: number | null; pressurePercent: number | null };
  serverTime: string;
};

export type RevisionChapter = {
  id: string;
  title: string;
  subject: { id: string; title: string };
  totalNotes: number;
  completedNotes: number;
  revisedNotes: number;
  revisionCount: number;
  revisionDepthPercent: number;
  status: 'not_started' | 'due' | 'upcoming' | 'in_rhythm';
  lastRevisedAt: string | null;
  nextDueAt: string | null;
};

export type RevisionChaptersResponse = {
  course: { id: string; code: string; name: string };
  timezone: string;
  summary: { totalRevisions: number; totalChapters: number; revisedChapters: number; returnedNotes: number };
  chapters: RevisionChapter[];
  serverTime: string;
};

export async function getTrackerSummary(days: 7 | 30 | 90 = 7) {
  return (await api.get<TrackerSummary>('/student/tracker/summary', { params: { days } })).data;
}

export async function getRevisionChapters(filter: 'all' | 'due' | 'not_started' = 'all', subjectId?: string) {
  return (await api.get<RevisionChaptersResponse>('/student/revisions/chapters', { params: { filter, subjectId } })).data;
}

export async function getRevisionHistory(page = 1, limit = 25) {
  return (await api.get<{ items: { id: string; noteId: string; noteTitle: string; source: 'ACTION_SHEET' | 'READER' | 'MANUAL'; revisedAt: string }[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/student/revisions/history', { params: { page, limit } })).data;
}
