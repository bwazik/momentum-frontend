import { render, screen } from '@testing-library/react';
import { NotificationItem } from '@/components/domain/shell/notification-item';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next-intl', () => ({ useLocale: () => 'ar' }));

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const baseNotification = {
  id: '1',
  type: 'stage_assignment',
  read_at: null,
  created_at: '2026-06-18T10:00:00Z',
  data: {
    title_ar: 'تم إسناد مهمة إليك',
    title_en: 'Task Assigned to You',
    body_ar: 'تم إسناد مهمة "تحديث نظام المعاملات" إليك',
    body_en: 'Task "Transaction System Update" has been assigned to you',
    task_public_id: '01912345-6789-7abc-def0-123456789abc',
    notification_type: 'stage_assignment',
  },
};

describe('NotificationItem', () => {
  it('renders unread notification title', () => {
    render(<NotificationItem notification={baseNotification} onClose={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByText('تم إسناد مهمة إليك')).toBeInTheDocument();
  });

  it('shows unread dot when read_at is null', () => {
    const { container } = render(<NotificationItem notification={baseNotification} onClose={vi.fn()} />, { wrapper: Wrapper });
    expect(container.querySelector('.bg-primary')).toBeInTheDocument();
  });

  it('hides unread dot when notification is read', () => {
    const readNotification = { ...baseNotification, read_at: '2026-06-18T11:00:00Z' };
    const { container } = render(<NotificationItem notification={readNotification} onClose={vi.fn()} />, { wrapper: Wrapper });
    expect(container.querySelector('.bg-primary')).not.toBeInTheDocument();
  });
});
