import { create } from 'axios';

import { API_BASE_URL } from '@/lib/env';

// Auth transport intentionally has no refresh interceptor. It prevents a
// failed refresh request from recursively attempting another refresh.
export const authHttp = create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});
