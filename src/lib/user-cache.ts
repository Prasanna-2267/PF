import { emptyLearnerProfile, useLearnerProfileStore } from '@/lib/learner-profile-store';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';
import { queryClient } from '@/lib/query-client';

export async function clearUserScopedCache(options: { clearQueries?: boolean } = {}): Promise<void> {
  if (options.clearQueries !== false) queryClient.clear();
  useLessonReaderStore.setState({ byLessonId: {}, recentlyOpened: [] });
  useLearnerProfileStore.setState({ profile: emptyLearnerProfile(), hydrated: false });
}
