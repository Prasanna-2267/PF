export type LessonAccess = 'free' | 'owned' | 'locked' | 'paid';
export type Lesson = { id: string; title: string; pages: number; access: LessonAccess; price?: string; completed?: boolean; revisions?: number; kind: 'PDF' | 'Government link' };
export type Topic = { id: string; title: string; lessons: Lesson[] };
export type Unit = { id: string; title: string; description: string; lessons?: Lesson[]; topics?: Topic[] };
export type Subject = { id: string; title: string; lessonCount: number; progress: number; accent: string; units: Unit[] };
export type LessonEntry = { subject: Subject; unit: Unit; topic?: Topic; lesson: Lesson };

export const subjects: Subject[] = [
  { id: 'polity', title: 'Indian Polity', lessonCount: 12, progress: 42, accent: '#5366C4', units: [
    { id: 'constitutional-foundations', title: 'Constitutional foundations', description: 'The Constitution, its values, and key principles.', topics: [
      { id: 'constitution-and-preamble', title: 'Constitution and Preamble', lessons: [
        { id: 'constitutional-framework', title: 'Constitutional Framework', pages: 29, access: 'owned', completed: false, revisions: 2, kind: 'PDF' },
        { id: 'preamble', title: 'The Preamble', pages: 18, access: 'free', completed: true, revisions: 1, kind: 'PDF' },
      ] },
      { id: 'rights-and-principles', title: 'Rights and principles', lessons: [
        { id: 'fundamental-rights', title: 'Fundamental Rights', pages: 42, access: 'paid', price: '₹79', kind: 'PDF' },
        { id: 'directive-principles', title: 'Directive Principles of State Policy', pages: 26, access: 'locked', price: '₹59', kind: 'PDF' },
      ] },
    ] },
    { id: 'governance', title: 'Governance and institutions', description: 'Parliament, executive, judiciary, and federal structure.', lessons: [
      { id: 'parliament', title: 'Parliament and law-making', pages: 34, access: 'owned', kind: 'PDF' },
      { id: 'judiciary', title: 'Judiciary at a glance', pages: 22, access: 'free', kind: 'PDF' },
    ] },
  ] },
  { id: 'history', title: 'Modern Indian History', lessonCount: 18, progress: 17, accent: '#B5842D', units: [
    { id: 'early-resistance', title: 'Early resistance', description: 'The events and ideas that shaped the freedom movement.', lessons: [
      { id: 'revolt-1857', title: 'The Revolt of 1857', pages: 31, access: 'free', kind: 'PDF' },
      { id: 'national-movement', title: 'National Movement', pages: 58, access: 'paid', price: '₹99', kind: 'PDF' },
    ] },
  ] },
  { id: 'geography', title: 'Indian Geography', lessonCount: 10, progress: 0, accent: '#2D9670', units: [
    { id: 'physical-geography', title: 'Physical geography', description: 'Landforms, climate, and India’s physical divisions.', lessons: [
      { id: 'physiography', title: 'Physiographic Divisions', pages: 37, access: 'locked', price: '₹69', kind: 'PDF' },
    ] },
  ] },
];

export function allLessonEntries(): LessonEntry[] {
  return subjects.flatMap((subject) => subject.units.flatMap((unit) => unit.topics
    ? unit.topics.flatMap((topic) => topic.lessons.map((lesson) => ({ subject, unit, topic, lesson })))
    : (unit.lessons ?? []).map((lesson) => ({ subject, unit, lesson }))));
}

function key(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export function findSubject(id: string | string[] | undefined) { return subjects.find((subject) => subject.id === key(id)) ?? subjects[0]; }
export function findUnit(subjectId: string | string[] | undefined, unitId: string | string[] | undefined) {
  const subject = findSubject(subjectId); return { subject, unit: subject.units.find((unit) => unit.id === key(unitId)) ?? subject.units[0] };
}
export function findTopic(subjectId: string | string[] | undefined, unitId: string | string[] | undefined, topicId: string | string[] | undefined) {
  const { subject, unit } = findUnit(subjectId, unitId); return { subject, unit, topic: unit.topics?.find((topic) => topic.id === key(topicId)) ?? unit.topics?.[0] };
}
export function findLesson(id: string | string[] | undefined) {
  const entry = allLessonEntries().find((item) => item.lesson.id === key(id));
  return entry ?? allLessonEntries()[0];
}
