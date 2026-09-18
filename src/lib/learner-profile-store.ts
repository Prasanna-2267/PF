import { create } from 'zustand';

export type LearnerProfile = {
  examName: string;
  category: string;
  examDate: string;
  academyId: string;
  dailyTarget: string;
  language: string;
  timezone: string;
  reminderTime: string;
};

const defaultProfile: LearnerProfile = {
  examName: 'JEE',
  category: 'Mains',
  examDate: '14 Sep 2026',
  academyId: '',
  dailyTarget: '2 hours',
  language: 'English',
  timezone: 'Asia/Kolkata',
  reminderTime: '7:00 PM',
};

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone?.trim() || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

export function emptyLearnerProfile(): LearnerProfile {
  return {
    examName: '',
    category: '',
    examDate: '',
    academyId: '',
    dailyTarget: '2 hours',
    language: 'English',
    timezone: deviceTimezone(),
    reminderTime: '7:00 PM',
  };
}

export function normalizeExamDate(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(trimmed)) return `1 ${trimmed}`;
  return trimmed;
}

export const useLearnerProfileStore = create<{ profile: LearnerProfile; hydrated: boolean; updateProfile: (profile: LearnerProfile) => void }>((set) => ({
  profile: defaultProfile,
  hydrated: false,
  updateProfile: (profile) => set({ profile: { ...profile, examDate: normalizeExamDate(profile.examDate) }, hydrated: true }),
}));
