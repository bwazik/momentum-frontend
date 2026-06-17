import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';

async function getCsrfCookie(): Promise<void> {
  await fetch('https://api.momentum.test/sanctum/csrf-cookie', { credentials: 'include' });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      await getCsrfCookie();
      return apiClient.post<{ message: string }>('/v1/iam/auth/login', credentials);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => apiClient.post('/v1/iam/auth/logout'),
  });
}
