import { create } from 'zustand';

export type LearnerProfile = {
  examName: string;
  category: string;
  examDate: string;
  dailyTarget: string;
  language: string;
  timezone: string;
  reminderTime: string;
};

const defaultProfile: LearnerProfile = {
  examName: 'JEE',
  category: 'Mains',
  examDate: '14 Sep 2026',
  dailyTarget: '2 hours',
  language: 'English',
  timezone: 'Asia/Kolkata',
  reminderTime: '7:00 PM',
};

export const useLearnerProfileStore = create<{ profile: LearnerProfile; updateProfile: (profile: LearnerProfile) => void }>((set) => ({
  profile: defaultProfile,
  updateProfile: (profile) => set({ profile }),
}));
