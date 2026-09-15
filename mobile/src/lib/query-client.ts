import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !isAxiosError(error) || error.response?.status !== 401
        ? failureCount < 1
        : false,
      staleTime: 30_000,
    },
  },
});
