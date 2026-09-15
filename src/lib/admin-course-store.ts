import { create } from 'zustand';

export type AdminCourseSubject = { id: string; name: string };
export type AdminCourseCategory = { id: string; name: string; subjects: AdminCourseSubject[] };
export type AdminCourse = { id: string; name: string; categories: AdminCourseCategory[] };

const initialCourses: AdminCourse[] = [
  { id: 'jee', name: 'JEE', categories: [
    { id: 'jee-mains', name: 'Mains', subjects: [{ id: 'jee-mains-maths', name: 'Mathematics' }, { id: 'jee-mains-physics', name: 'Physics' }, { id: 'jee-mains-chemistry', name: 'Chemistry' }] },
    { id: 'jee-advanced', name: 'Advanced', subjects: [{ id: 'jee-advanced-maths', name: 'Mathematics' }, { id: 'jee-advanced-physics', name: 'Physics' }, { id: 'jee-advanced-chemistry', name: 'Chemistry' }] },
  ] },
  { id: 'ca', name: 'CA', categories: [
    { id: 'ca-foundation', name: 'Foundation', subjects: [{ id: 'ca-foundation-1', name: 'Principles & Practice of Accounting' }, { id: 'ca-foundation-2', name: 'Business Laws' }] },
    { id: 'ca-intermediate', name: 'Intermediate', subjects: [{ id: 'ca-inter-phase-1', name: 'Phase 1' }, { id: 'ca-inter-phase-2', name: 'Phase 2' }, { id: 'ca-inter-phase-3', name: 'Phase 3' }] },
  ] },
  { id: 'neet', name: 'NEET', categories: [
    { id: 'neet-ug', name: 'UG', subjects: [{ id: 'neet-ug-biology', name: 'Biology' }, { id: 'neet-ug-physics', name: 'Physics' }, { id: 'neet-ug-chemistry', name: 'Chemistry' }] },
  ] },
];

type AdminCourseState = {
  courses: AdminCourse[];
  addCourse: (name: string) => void;
  addCategory: (courseId: string, name: string) => void;
  addSubject: (courseId: string, categoryId: string, name: string) => void;
};

function idFor(prefix: string, name: string) {
  return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
}

export const useAdminCourseStore = create<AdminCourseState>((set) => ({
  courses: initialCourses,
  addCourse: (name) => set((state) => ({ courses: [...state.courses, { id: idFor('course', name), name: name.trim(), categories: [] }] })),
  addCategory: (courseId, name) => set((state) => ({ courses: state.courses.map((course) => course.id === courseId ? { ...course, categories: [...course.categories, { id: idFor(course.id, name), name: name.trim(), subjects: [] }] } : course) })),
  addSubject: (courseId, categoryId, name) => set((state) => ({ courses: state.courses.map((course) => course.id === courseId ? { ...course, categories: course.categories.map((category) => category.id === categoryId ? { ...category, subjects: [...category.subjects, { id: idFor(category.id, name), name: name.trim() }] } : category) } : course) })),
}));
