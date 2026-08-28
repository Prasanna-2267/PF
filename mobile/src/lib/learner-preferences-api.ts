import { api } from '@/lib/api';
import type { FullPreferenceInput, LearnerPreferenceDto, PreferenceCourse } from '@/lib/learner-preferences';

export async function loadPreferenceOptions(): Promise<PreferenceCourse[]> {
  const response = await api.get<{ courses: PreferenceCourse[] }>('/student/preferences/options');
  return response.data.courses;
}

export async function putLearnerPreferences(input: FullPreferenceInput): Promise<LearnerPreferenceDto> {
  const response = await api.put<LearnerPreferenceDto>('/student/preferences', input);
  return response.data;
}

export async function patchLearnerPreferences(input: Partial<FullPreferenceInput>): Promise<LearnerPreferenceDto> {
  const response = await api.patch<LearnerPreferenceDto>('/student/preferences', input);
  return response.data;
}
