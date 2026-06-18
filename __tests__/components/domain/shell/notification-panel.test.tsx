import { render, screen, waitFor } from '@testing-library/react';
import { NotificationPanel } from '@/components/domain/shell/notification-panel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/__tests__/mocks/server';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, Record<string, string>> = {
      notifications: { title: 'الإشعارات', mark_all_read: 'تحديد الكل كمقروء', empty: 'لا توجد إشعارات', empty_description: '', load_more: '', loading: '' },
    };
    return messages[namespace]?.[key] ?? key;
  },
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('NotificationPanel', () => {
  beforeEach(() => {
    server.use(
      http.get('https://api.momentum.test/v1/notifications', () =>
        HttpResponse.json({ data: [], next_cursor: null, has_more: false }),
      ),
      http.get('https://api.momentum.test/v1/notifications/unread-count', () =>
        HttpResponse.json({ unread_count: 0 }),
      ),
    );
  });

  it('renders header with title', async () => {
    render(<NotificationPanel onClose={vi.fn()} />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText('الإشعارات')).toBeInTheDocument());
  });
});
