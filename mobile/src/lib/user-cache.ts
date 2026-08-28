import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAdminAccessStore } from '@/lib/admin-access-store';
import { homeTodoDateKey, useHomeTodoStore } from '@/lib/home-todo-store';
import { emptyLearnerProfile, useLearnerProfileStore } from '@/lib/learner-profile-store';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';
import { usePracticeProgressStore } from '@/lib/practice-progress-store';
import { queryClient } from '@/lib/query-client';
import { useRewardStore } from '@/lib/reward-store';

const USER_SCOPED_ASYNC_STORAGE_KEYS = [
  'pf-home-todos',
  'parallax-flow-practice-progress',
  'parallax-flow-rewards',
] as const;

export async function clearUserScopedCache(): Promise<void> {
  queryClient.clear();
  useHomeTodoStore.setState({ dateKey: homeTodoDateKey(), todos: [] });
  usePracticeProgressStore.setState({ byQuestionId: {} });
  useRewardStore.setState({
    points: 0,
    hearts: 0,
    heartMonth: homeTodoDateKey().slice(0, 7),
    streak: 0,
    lastCompletedDate: null,
    lastRewardDate: null,
    practiceChallengeClaims: [],
  });
  useLessonReaderStore.setState({ byLessonId: {}, recentlyOpened: [] });
  useLearnerProfileStore.setState({ profile: emptyLearnerProfile() });
  useAdminAccessStore.setState({ grants: [] });
  await AsyncStorage.multiRemove([...USER_SCOPED_ASYNC_STORAGE_KEYS]);
}
