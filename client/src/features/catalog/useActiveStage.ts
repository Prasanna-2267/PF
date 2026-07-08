import { useQuery } from '@tanstack/react-query';
import { trackerApi } from '../tracker/tracker.api';

/**
 * The student's saved study stage (their exam/stage preference, persisted via
 * tracker settings). Source of truth is the tracker query — it is invalidated
 * whenever settings change, so every consumer stays in sync. Notes/Practice
 * read this instead of asking for exam + stage on every page.
 */
export function useActiveStage() {
  const q = useQuery({ queryKey: ['tracker'], queryFn: trackerApi.get });
  return {
    stageId: q.data?.activeStageId ?? null,
    stageName: q.data?.activeStage?.name ?? null,
    categoryName: q.data?.activeStage?.categoryName ?? null,
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    refetch: q.refetch,
  };
}
