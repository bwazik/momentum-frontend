import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient, ApiRequestError } from '../client';
import { queryKeys } from '../query-keys';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];
type AuthTokenResource = components['schemas']['AuthTokenResource'];
type LoginRequest = components['schemas']['LoginRequest'];

async function getCsrfCookie(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.momentum.test';
  await fetch(`${baseUrl}/sanctum/csrf-cookie`, { credentials: 'include' });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => apiClient.get<UserResource>('/v1/iam/auth/me'),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiRequestError && error.status === 401) return false;
      return failureCount < 3;
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      await getCsrfCookie();
      return apiClient.post<AuthTokenResource>('/v1/iam/auth/login', credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => apiClient.post('/v1/iam/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.error.message);
      } else {
        queryClient.clear();
        router.push('/login');
      }
    },
  });
}
