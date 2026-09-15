import { api } from '@/lib/api';

export type StudyTaskStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'RESCHEDULED' | 'REPLACED';
export type StudyTask = {
  id: string;
  type: 'READ_NOTE' | 'CONTINUE_NOTE' | 'REVISE_NOTE' | 'MANUAL';
  source: 'SYLLABUS_PLAN' | 'REVISION_DUE' | 'CONTINUE_RESOURCE' | 'CARRY_OVER' | 'MANUAL';
  status: StudyTaskStatus;
  estimateSource: 'ADMIN' | 'FALLBACK_V1' | 'LEARNER';
  title: string;
  reason: string;
  plannedMinutes: number;
  actualMinutes: number | null;
  priority: number;
  sequence: number;
  contentItemId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  rescheduledForDate: string | null;
};
export type StudyPlan = {
  id: string;
  localDate: string;
  timezone: string;
  availableMinutes: number;
  algorithmVersion: string;
  generation: number;
  generatedAt: string;
  course: { id: string; code: string; name: string };
  tasks: StudyTask[];
  summary: { completed: number; total: number; plannedMinutes: number; completedMinutes: number };
};

export async function getTodayStudyPlan() { return (await api.get<StudyPlan>('/student/study-plan/today')).data; }
export async function regenerateStudyPlan() { return (await api.post<StudyPlan>('/student/study-plan/generate', { regenerate: true })).data; }
export async function addStudyTask(title: string, plannedMinutes = 25) { return (await api.post<StudyPlan>('/student/study-plan/tasks', { title, plannedMinutes })).data; }
export async function updateStudyTask(id: string, action: 'start' | 'complete' | 'reopen' | 'skip' | 'reschedule', options?: { actualMinutes?: number; date?: string }) { return (await api.patch<StudyPlan>(`/student/study-plan/tasks/${id}`, { action, ...options })).data; }
export async function hideStudyTask(id: string) { return (await api.delete<StudyPlan>(`/student/study-plan/tasks/${id}`)).data; }
export async function clearCompletedStudyTasks() { return (await api.post<StudyPlan>('/student/study-plan/clear-completed', {})).data; }
