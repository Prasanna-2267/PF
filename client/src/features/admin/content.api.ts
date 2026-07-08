import { api } from '../../lib/api';

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
};

export type Stage = {
  _id: string;
  name: string;
  examCategoryId: string;
  order: number;
  isActive: boolean;
};

export type SubjectNode = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  parentSubjectId: string | null;
  children: SubjectNode[];
  lessonCount: number;
};

const ADMIN = '/admin/content';

export const adminContentApi = {
  listCategories: () =>
    api.get<{ categories: Category[] }>(`${ADMIN}/categories`).then((r) => r.data.categories),
  createCategory: (d: { name: string; slug: string }) =>
    api.post(`${ADMIN}/categories`, d).then((r) => r.data),
  updateCategory: (id: string, d: Partial<{ name: string; slug: string; isActive: boolean }>) =>
    api.patch(`${ADMIN}/categories/${id}`, d).then((r) => r.data),
  deleteCategory: (id: string) => api.delete(`${ADMIN}/categories/${id}`).then((r) => r.data),

  listStages: (categoryId: string) =>
    api.get<{ stages: Stage[] }>(`${ADMIN}/categories/${categoryId}/stages`).then((r) => r.data.stages),
  createStage: (d: { name: string; examCategoryId: string }) =>
    api.post(`${ADMIN}/stages`, d).then((r) => r.data),
  updateStage: (id: string, d: Partial<{ name: string; isActive: boolean }>) =>
    api.patch(`${ADMIN}/stages/${id}`, d).then((r) => r.data),
  deleteStage: (id: string) => api.delete(`${ADMIN}/stages/${id}`).then((r) => r.data),

  getSubjectTree: (stageId: string) =>
    api.get<{ subjects: SubjectNode[] }>(`${ADMIN}/stages/${stageId}/subjects`).then((r) => r.data.subjects),
  createSubject: (d: { name: string; stageId: string; parentSubjectId?: string | null }) =>
    api.post(`${ADMIN}/subjects`, d).then((r) => r.data),
  /** Convert a notes-bearing subject into a parent by moving its notes into a new sub-subject. */
  subdivideSubject: (id: string, name: string) =>
    api.post(`${ADMIN}/subjects/${id}/subdivide`, { name }).then((r) => r.data),
  updateSubject: (id: string, d: Partial<{ name: string; isActive: boolean }>) =>
    api.patch(`${ADMIN}/subjects/${id}`, d).then((r) => r.data),
  deleteSubject: (id: string) => api.delete(`${ADMIN}/subjects/${id}`).then((r) => r.data),
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
