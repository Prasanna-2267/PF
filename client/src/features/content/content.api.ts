import { api } from '../../lib/api';

export type PubCategory = { _id: string; name: string; slug: string; order: number };
export type PubStage = { _id: string; name: string; order: number };
export type PubSubject = {
  id: string;
  name: string;
  order: number;
  parentSubjectId: string | null;
  children: PubSubject[];
};

export const contentApi = {
  categories: () =>
    api.get<{ categories: PubCategory[] }>('/content/categories').then((r) => r.data.categories),
  stages: (categoryId: string) =>
    api.get<{ stages: PubStage[] }>(`/content/categories/${categoryId}/stages`).then((r) => r.data.stages),
  subjectTree: (stageId: string) =>
    api.get<{ subjects: PubSubject[] }>(`/content/stages/${stageId}/subjects`).then((r) => r.data.subjects),
};
