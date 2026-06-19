import { api } from '../../lib/api';

export type AdminLesson = {
  id: string;
  title: string;
  type: 'pdf' | 'ism';
  externalUrl: string | null;
  pageCount: number | null;
  price: number;
  isFree: boolean;
  order: number;
  isActive: boolean;
};

export const adminLessonsApi = {
  list: (subjectId: string) =>
    api.get<{ lessons: AdminLesson[] }>('/admin/lessons', { params: { subjectId } }).then((r) => r.data.lessons),
  uploadPdf: (fd: FormData) => api.post('/admin/lessons/pdf', fd).then((r) => r.data),
  createIsm: (d: { title: string; subjectId: string; externalUrl: string; isFree?: boolean; price?: number }) =>
    api.post('/admin/lessons/ism', d).then((r) => r.data),
  update: (id: string, d: Partial<{ title: string; isActive: boolean; isFree: boolean; price: number }>) =>
    api.patch(`/admin/lessons/${id}`, d).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/lessons/${id}`).then((r) => r.data),
};
