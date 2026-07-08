import { useQuery } from '@tanstack/react-query';
import { contentApi, type PubSubject } from '../content/content.api';

/** Published exam categories. */
export function useCategories() {
  return useQuery({ queryKey: ['pub', 'categories'], queryFn: () => contentApi.categories() });
}

/** Stages within a category. */
export function useStages(categoryId: string | null | undefined) {
  return useQuery({
    queryKey: ['pub', 'stages', categoryId],
    queryFn: () => contentApi.stages(categoryId as string),
    enabled: Boolean(categoryId),
  });
}

/** Nested subject tree for a stage. */
export function useSubjectTree(stageId: string | null | undefined) {
  return useQuery({
    queryKey: ['pub', 'subjects', stageId],
    queryFn: () => contentApi.subjectTree(stageId as string),
    enabled: Boolean(stageId),
  });
}

export type FlatSubject = { id: string; name: string; depth: number };

/** Depth-first flatten of the subject tree, carrying nesting depth for indentation. */
export function flattenSubjects(nodes: PubSubject[], depth = 0): FlatSubject[] {
  return nodes.flatMap((n) => [
    { id: n.id, name: n.name, depth },
    ...flattenSubjects(n.children, depth + 1),
  ]);
}

/** Root→node path to a subject id (inclusive), or null if not present. For breadcrumbs + drill-in. */
export function findSubjectPath(nodes: PubSubject[], id: string): PubSubject[] | null {
  for (const n of nodes) {
    if (n.id === id) return [n];
    const deeper = findSubjectPath(n.children, id);
    if (deeper) return [n, ...deeper];
  }
  return null;
}
