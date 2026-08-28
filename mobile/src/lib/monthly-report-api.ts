import { api } from '@/lib/api';

export type MonthlyReport = {
  id: string | null;
  yearMonth: string;
  state: 'LIVE' | 'FROZEN';
  timezone: string;
  course: { id: string; code: string; name: string };
  study: {
    totalSeconds: number;
    focusSeconds: number;
    readingSeconds: number;
    practiceSeconds: number;
    revisionSeconds: number;
    weeklySeconds: number[];
    activeDays: number;
    goalDays: number;
  };
  streak: { qualifiedDays: number; protectedDays: number };
  learning: {
    notesCompleted: number;
    revisionsCompleted: number;
    studyTasksCompleted: number;
    totalNotes: number;
    syllabusCompleted: number;
    syllabusPercent: number;
  };
  capabilities: { practiceAnalytics: false; practiceAnalyticsReason: 'PRACTICE_BACKEND_PAUSED' };
  generatedAt: string | null;
};

export async function listMonthlyReports() {
  return (await api.get<{ items: MonthlyReport[]; serverTime: string }>('/student/reports/monthly')).data;
}

export async function getMonthlyReport(yearMonth: string) {
  return (await api.get<MonthlyReport>(`/student/reports/monthly/${yearMonth}`)).data;
}
