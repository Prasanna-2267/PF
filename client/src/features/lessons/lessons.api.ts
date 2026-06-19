import { api } from '../../lib/api';

export type Lesson = {
  id: string;
  title: string;
  type: 'pdf' | 'ism';
  externalUrl: string | null;
  pageCount: number | null;
  price: number;
  isFree: boolean;
  order: number;
  completed: boolean;
};

export const lessonsApi = {
  list: (subjectId: string) =>
    api.get<{ lessons: Lesson[] }>('/lessons', { params: { subjectId } }).then((r) => r.data.lessons),
  progress: (subjectId: string) =>
    api.get<{ total: number; completed: number }>('/lessons/progress', { params: { subjectId } }).then((r) => r.data),
  view: (id: string) =>
    api.get<{ id: string; title: string; pageCount: number }>(`/lessons/${id}/view`).then((r) => r.data),
  pageBlob: (id: string, n: number) =>
    api.get(`/lessons/${id}/pages/${n}`, { responseType: 'blob' }).then((r) => r.data as Blob),
  complete: (id: string) => api.post(`/lessons/${id}/complete`).then((r) => r.data),
  uncomplete: (id: string) => api.delete(`/lessons/${id}/complete`).then((r) => r.data),
};
