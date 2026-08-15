import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PracticeQuestionProgress = {
  subjectId: string;
  topicId: string;
  attempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  correct: boolean;
  lockedWrong: boolean;
  explanationSeen: boolean;
  lastAnsweredAt: string;
};

type PracticeProgressState = {
  byQuestionId: Record<string, PracticeQuestionProgress>;
  recordAnswer: (answer: { questionId: string; subjectId: string; topicId: string; correct: boolean; lockWrong: boolean; explanationShown: boolean }) => void;
};

const demoProgress: Record<string, PracticeQuestionProgress> = {
  'polity-cp-1': { subjectId: 'polity', topicId: 'constitution-preamble', attempts: 2, correctAttempts: 1, incorrectAttempts: 1, correct: true, lockedWrong: false, explanationSeen: true, lastAnsweredAt: '2026-08-14T18:20:00.000Z' },
  'polity-cp-2': { subjectId: 'polity', topicId: 'constitution-preamble', attempts: 1, correctAttempts: 0, incorrectAttempts: 1, correct: false, lockedWrong: true, explanationSeen: false, lastAnsweredAt: '2026-08-14T18:23:00.000Z' },
  'polity-rp-1': { subjectId: 'polity', topicId: 'rights-principles', attempts: 1, correctAttempts: 1, incorrectAttempts: 0, correct: true, lockedWrong: false, explanationSeen: true, lastAnsweredAt: '2026-08-13T17:05:00.000Z' },
  'history-er-1': { subjectId: 'history', topicId: 'early-resistance', attempts: 3, correctAttempts: 2, incorrectAttempts: 1, correct: true, lockedWrong: false, explanationSeen: true, lastAnsweredAt: '2026-08-12T19:10:00.000Z' },
  'history-er-2': { subjectId: 'history', topicId: 'early-resistance', attempts: 1, correctAttempts: 0, incorrectAttempts: 1, correct: false, lockedWrong: true, explanationSeen: false, lastAnsweredAt: '2026-08-12T19:13:00.000Z' },
  'history-nm-1': { subjectId: 'history', topicId: 'national-movement', attempts: 1, correctAttempts: 1, incorrectAttempts: 0, correct: true, lockedWrong: false, explanationSeen: true, lastAnsweredAt: '2026-08-10T16:45:00.000Z' },
};

export const usePracticeProgressStore = create<PracticeProgressState>()(persist((set) => ({
  byQuestionId: demoProgress,
  recordAnswer: ({ questionId, subjectId, topicId, correct, lockWrong, explanationShown }) => set((state) => {
    const previous = state.byQuestionId[questionId];
    if (previous?.lockedWrong) return state;
    return { byQuestionId: { ...state.byQuestionId, [questionId]: {
      subjectId,
      topicId,
      attempts: (previous?.attempts ?? 0) + 1,
      correctAttempts: (previous?.correctAttempts ?? (previous?.correct ? 1 : 0)) + (correct ? 1 : 0),
      incorrectAttempts: (previous?.incorrectAttempts ?? (previous && !previous.correct ? 1 : 0)) + (correct ? 0 : 1),
      correct,
      lockedWrong: lockWrong && !correct,
      explanationSeen: Boolean(previous?.explanationSeen || explanationShown),
      lastAnsweredAt: new Date().toISOString(),
    } } };
  }),
}), {
  name: 'parallax-flow-practice-progress',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ byQuestionId: state.byQuestionId }),
}));
