import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { ExecutiveBottleneckDrillDownList } from '@/components/domain/analytics/executive-bottleneck-drill-down-list';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics/executive/bottlenecks/st-1/drill-down',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'analytics.executive': {
        error: 'Unable to load the executive dashboard.',
        empty_title: 'No dashboard data',
        empty_description: 'No analytics data is available.',
        load_more: 'Load more',
        loading_more: 'Loading...',
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

describe('ExecutiveBottleneckDrillDownList', () => {
  it('renders skeleton initially', () => {
    renderWithProviders(<ExecutiveBottleneckDrillDownList stageType="st-1" />);
    expect(screen.getByTestId('drill-down-skeleton')).toBeInTheDocument();
  });

  it('renders task rows when loaded', async () => {
    renderWithProviders(<ExecutiveBottleneckDrillDownList stageType="st-1" />);
    await waitFor(() => {
      expect(screen.queryByTestId('drill-down-skeleton')).not.toBeInTheDocument();
    });
    const tasks = screen.getAllByText('Overdue Task');
    expect(tasks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no tasks', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/executive/bottlenecks/:stageType/drill-down', () => {
        return HttpResponse.json({
          data: [],
          next_cursor: null,
          has_more: false,
        });
      }),
    );
    renderWithProviders(<ExecutiveBottleneckDrillDownList stageType="st-1" />);
    await screen.findByText('No dashboard data');
  });

  it('renders error state on API failure', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/executive/bottlenecks/:stageType/drill-down', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<ExecutiveBottleneckDrillDownList stageType="st-1" />);
    await screen.findByText('Unable to load the executive dashboard.');
  });
});
