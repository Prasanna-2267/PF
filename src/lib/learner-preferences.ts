import type { LearnerProfile } from '@/lib/learner-profile-store';

export type PreferenceCourse = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  academy: { id: string; name: string; slug: string } | null;
};

export type LearnerPreferenceDto = {
  userId: string;
  selectedCourseId: string | null;
  examDate: string | null;
  examDatePrecision: 'DAY' | 'MONTH' | null;
  academyReference: string | null;
  dailyTargetMinutes: number;
  timezone: string;
  language: string;
  reminderTime: string;
  preferredTheme: 'LIGHT' | 'DARK';
  onboardingCompletedAt: string | null;
  version: number;
  selectedCourse: Omit<PreferenceCourse, 'description'> | null;
};

export type FullPreferenceInput = {
  selectedCourseId: string;
  examMonth: number;
  examYear: number;
  examDay?: number;
  academyReference?: string;
  dailyTargetMinutes: number;
  timezone: string;
  language?: string;
  reminderTime?: string;
  expectedVersion?: number;
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function learnerProfileFromPreference(preference: LearnerPreferenceDto, previous: LearnerProfile): LearnerProfile {
  const date = preference.examDate ? new Date(preference.examDate) : null;
  const examDate = date && !Number.isNaN(date.getTime())
    ? `${date.getUTCDate()} ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`
    : previous.examDate;
  return {
    ...previous,
    examName: preference.selectedCourse?.name ?? previous.examName,
    category: preference.selectedCourse?.code ?? previous.category,
    examDate,
    academyId: preference.academyReference ?? '',
    dailyTarget: formatDailyTarget(preference.dailyTargetMinutes),
    timezone: preference.timezone,
    language: preference.language,
    reminderTime: formatReminderTime(preference.reminderTime),
  };
}

export function parseExamDate(value: string): { examMonth: number; examYear: number; examDay?: number } | null {
  const match = value.trim().replace(/\s+/g, ' ').match(/^(?:(\d{1,2})\s+)?([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!match) return null;
  const month = monthNames.findIndex((entry) => match[2]!.toLowerCase().startsWith(entry.toLowerCase()));
  if (month < 0) return null;
  const examDay = match[1] ? Number(match[1]) : undefined;
  return { examMonth: month + 1, examYear: Number(match[3]), ...(examDay ? { examDay } : {}) };
}

export function parseDailyTarget(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  const hours = normalized.match(/(\d+(?:\.\d+)?)\s*(?:h|hour)/)?.[1];
  const minutes = normalized.match(/(\d+)\s*(?:m|min)/)?.[1];
  const total = Math.round((hours ? Number(hours) * 60 : 0) + (minutes ? Number(minutes) : 0));
  if (!total && /^\d+$/.test(normalized)) return Number(normalized);
  return total >= 15 && total <= 720 ? total : null;
}

export function parseReminderTime(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3] === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${twelveHour[2]}`;
  }
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(normalized) ? normalized : null;
}

function formatDailyTarget(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!hours) return `${remaining} minutes`;
  if (!remaining) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${hours}h ${remaining}m`;
}

function formatReminderTime(value: string) {
  const [hourValue, minute = '00'] = value.split(':');
  const hour = Number(hourValue);
  if (!Number.isInteger(hour)) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}
