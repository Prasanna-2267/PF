import { create } from 'zustand';

import { adminStudents } from '@/lib/demo-admin';
import type { Lesson } from '@/lib/demo-catalog';

export type ComplimentaryNoteGrant = {
  id: string;
  studentId: string;
  noteId: string;
  grantedAt: string;
};

type AdminAccessState = {
  grants: ComplimentaryNoteGrant[];
  grantNote: (studentId: string, noteId: string) => void;
  revokeNote: (studentId: string, noteId: string) => void;
};

function todayLabel() {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
}

export const useAdminAccessStore = create<AdminAccessState>((set) => ({
  grants: [],
  grantNote: (studentId, noteId) => set((state) => {
    const id = `${studentId}:${noteId}`;
    if (state.grants.some((grant) => grant.id === id)) return state;
    return { grants: [...state.grants, { id, studentId, noteId, grantedAt: todayLabel() }] };
  }),
  revokeNote: (studentId, noteId) => set((state) => ({ grants: state.grants.filter((grant) => grant.studentId !== studentId || grant.noteId !== noteId) })),
}));

export function canOpenNote(lesson: Lesson, userEmail: string | undefined, grants: ComplimentaryNoteGrant[]) {
  if (lesson.access === 'free' || lesson.access === 'owned') return true;
  const studentId = adminStudents.find((student) => student.email.toLowerCase() === userEmail?.toLowerCase())?.id;
  return Boolean(studentId && grants.some((grant) => grant.studentId === studentId && grant.noteId === lesson.id));
}
