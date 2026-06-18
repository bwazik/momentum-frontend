'use client';

import { dehydrate, HydrationBoundary, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiRequestError } from '@/lib/api/client';

export function Providers({ children, dehydratedState }: { children: React.ReactNode; dehydratedState?: ReturnType<typeof dehydrate> }) {
  const router = useRouter();

  const [queryClient] = useState(() => {
    const client = new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          if (error instanceof ApiRequestError && error.status === 401 && window.location.pathname !== '/login') {
            client.clear();
            router.push('/login');
          }
        },
      }),
      defaultOptions: {
        queries: {
          retry: (failureCount, error) => {
            if (error instanceof ApiRequestError && error.status === 401) {
              return false;
            }
            return failureCount < 3;
          },
        },
      },
    });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        {children}
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
