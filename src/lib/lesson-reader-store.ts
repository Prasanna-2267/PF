import { create } from 'zustand';

export type ReaderStatus = { read: boolean; favourite: boolean; revisions: number };
type LessonReaderState = {
  byLessonId: Record<string, ReaderStatus>;
  recentlyOpened: string[];
  recordOpen: (lessonId: string) => void;
  toggleRead: (lessonId: string, initial: ReaderStatus) => void;
  toggleFavourite: (lessonId: string, initial: ReaderStatus) => void;
  revise: (lessonId: string, initial: ReaderStatus) => void;
};

function currentStatus(state: LessonReaderState, lessonId: string, initial: ReaderStatus) {
  return state.byLessonId[lessonId] ?? initial;
}

export const useLessonReaderStore = create<LessonReaderState>((set) => ({
  byLessonId: {},
  recentlyOpened: ['constitutional-framework', 'preamble', 'revolt-1857'],
  recordOpen: (lessonId) => set((state) => ({ recentlyOpened: [lessonId, ...state.recentlyOpened.filter((id) => id !== lessonId)].slice(0, 3) })),
  toggleRead: (lessonId, initial) => set((state) => {
    const current = currentStatus(state, lessonId, initial);
    return { byLessonId: { ...state.byLessonId, [lessonId]: { ...current, read: !current.read } } };
  }),
  toggleFavourite: (lessonId, initial) => set((state) => {
    const current = currentStatus(state, lessonId, initial);
    return { byLessonId: { ...state.byLessonId, [lessonId]: { ...current, favourite: !current.favourite } } };
  }),
  revise: (lessonId, initial) => set((state) => {
    const current = currentStatus(state, lessonId, initial);
    return { byLessonId: { ...state.byLessonId, [lessonId]: { ...current, read: true, revisions: current.revisions + 1 } } };
  }),
}));
