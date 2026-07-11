import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { ExecutiveDrillDownList } from '@/components/domain/analytics/executive-drill-down-list';

const mockRouterPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics/executive/drill-down/overdue',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'analytics.executive': {
        title: 'Executive Dashboard',
        error: 'Unable to load the executive dashboard.',
        empty_title: 'No dashboard data',
        empty_description: 'No analytics data is available.',
        loading: 'Loading...',
        loading_more: 'Loading...',
        load_more: 'Load more',
        'columns.table_label': 'Executive drill-down',
        'columns.sla': 'SLA',
        'columns.task': 'Task',
        'columns.priority': 'Priority',
        'columns.stage': 'Current Stage',
        'columns.created_at': 'Created At',
      },
      'tasks.board.sla': {
        green: 'On Track',
        amber: 'At Risk',
        red: 'Overdue',
        grey: 'Suspended',
        none: 'None',
      },
      shared: {
        error: 'An error occurred.',
        retry: 'Retry',
      },
    };
    return translations[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

describe('ExecutiveDrillDownList', () => {
  it('renders skeleton initially', () => {
    renderWithProviders(<ExecutiveDrillDownList metric="overdue" />);
    expect(screen.getByTestId('drill-down-skeleton')).toBeInTheDocument();
  });

  it('renders task rows when loaded', async () => {
    renderWithProviders(<ExecutiveDrillDownList metric="overdue" />);
    await waitFor(() => {
      expect(screen.queryByTestId('drill-down-skeleton')).not.toBeInTheDocument();
    });
    const tasks = screen.getAllByText('Overdue Task');
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    const reviewTasks = screen.getAllByText('In Review Task');
    expect(reviewTasks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no tasks', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/executive/summary/drill-down/:metric', () => {
        return HttpResponse.json({
          data: [],
          next_cursor: null,
          has_more: false,
        });
      }),
    );
    renderWithProviders(<ExecutiveDrillDownList metric="overdue" />);
    await screen.findByText('No dashboard data');
  });

  it('renders error state on API failure', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/executive/summary/drill-down/:metric', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<ExecutiveDrillDownList metric="overdue" />);
    await screen.findByText('Unable to load the executive dashboard.');
  });
});
