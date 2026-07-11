import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { ExecutiveDashboard } from '@/components/domain/analytics/executive-dashboard';

const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'analytics.executive': {
        title: 'Executive Dashboard',
        description: 'Task health summary.',
        error: 'Unable to load the executive dashboard.',
        empty_title: 'No dashboard data',
        empty_description: 'No analytics data is available.',
        empty_filtered_title: 'No results match your filters',
        empty_filtered_description: 'Try adjusting or removing the active filters.',
        reset_filters: 'Reset filters',
        loading: 'Loading...',
        loading_more: 'Loading...',
        load_more: 'Load more',
        no_permission_title: 'No permission',
        no_permission_description: 'You do not have permission to view the executive dashboard.',
        stat_active: 'Total Active',
        stat_active_sub: 'Across all departments',
        stat_at_risk: 'At Risk',
        stat_at_risk_sub: 'Approaching SLA deadline',
        stat_overdue: 'Overdue',
        stat_overdue_sub: 'Requires immediate action',
        stat_suspended: 'Suspended',
        stat_suspended_sub: 'Paused tasks',
        stat_completion_rate: 'Completion Rate',
        completed_caption: '{count} completed',
        cancelled_sub: '{count} cancelled',
        department_active_label: '{count} active',
        department_overdue_label: '{count} overdue',
        department_at_risk_label: '{count} at risk',
        bottleneck_overdue_count: '{count} overdue',
        bottleneck_at_risk_count: '{count} at risk',
        bottleneck_avg_delay: 'Avg time in stage: {time}',
        panel_department_health: 'Department SLA Health',
        panel_bottlenecks: 'Top Bottlenecks',
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

vi.mock('@/lib/api/hooks/use-auth', () => ({
  useCurrentUser: () => ({ data: { public_id: 'user-1' } }),
}));

describe('ExecutiveDashboard', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    mockRouterReplace.mockClear();
  });

  it('renders loading skeleton initially', () => {
    renderWithProviders(<ExecutiveDashboard />);
    expect(screen.getByTestId('executive-dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders stat cards and panels when loaded', async () => {
    renderWithProviders(<ExecutiveDashboard />);
    await waitFor(() => {
      expect(screen.queryByTestId('executive-dashboard-skeleton')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
    expect(screen.getByTestId('department-health-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bottlenecks-panel')).toBeInTheDocument();
  });

  it('renders correct stat card values', async () => {
    renderWithProviders(<ExecutiveDashboard />);
    await waitFor(() => {
      expect(screen.queryByTestId('executive-dashboard-skeleton')).not.toBeInTheDocument();
    });
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders department health rows sorted by severity', async () => {
    renderWithProviders(<ExecutiveDashboard />);
    await waitFor(() => {
      expect(screen.queryByTestId('executive-dashboard-skeleton')).not.toBeInTheDocument();
    });
    const deptLabels = screen.getAllByText(/IT|HR|Finance/);
    expect(deptLabels.length).toBeGreaterThanOrEqual(3);
  });

  it('renders bottleneck cards', async () => {
    renderWithProviders(<ExecutiveDashboard />);
    await waitFor(() => {
      expect(screen.queryByTestId('executive-dashboard-skeleton')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Approval')).toBeInTheDocument();
  });

  it('renders empty state when no data', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/executive/summary', () => {
        return HttpResponse.json(null);
      }),
      http.get('https://api.momentum.test/v1/analytics/executive/department-health', () => {
        return HttpResponse.json([]);
      }),
      http.get('https://api.momentum.test/v1/analytics/executive/bottlenecks', () => {
        return HttpResponse.json([]);
      }),
    );
    renderWithProviders(<ExecutiveDashboard />);
    await screen.findByText('No dashboard data');
  });

  it('renders error state on API failure', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/executive/summary', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<ExecutiveDashboard />);
    await screen.findByText('Unable to load the executive dashboard.');
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders no permission state on 403', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/executive/summary', () => {
        return new HttpResponse(null, { status: 403 });
      }),
    );
    renderWithProviders(<ExecutiveDashboard />);
    await screen.findByText('No permission');
  });
});
