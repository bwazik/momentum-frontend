import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { DepartmentDashboard } from '@/components/domain/analytics/department-dashboard';

const mockRouterReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockRouterReplace }),
  useSearchParams: () => new URLSearchParams('departmentId=dept-1'),
  usePathname: () => '/analytics/department',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, Record<string, string>> = {
      'analytics.department': {
        title: 'Department Dashboard',
        description: 'Department-level task performance.',
        error: 'Unable to load the department dashboard.',
        empty_title: 'No dashboard data',
        empty_description: 'No analytics data is available.',
        empty_filtered_title: 'No results match your filters',
        empty_filtered_description: 'Try adjusting or removing the active filters.',
        reset_filters: 'Reset filters',
        loading_more: 'Loading...',
        load_more: 'Load more',
        no_permission_title: 'No permission',
        no_permission_description: 'You do not have permission',
        select_department_title: 'Select a department',
        select_department_description: 'Choose a department.',
        department_label: 'Department',
        select_department: 'Select department',
        stat_active: 'Active Tasks',
        stat_overdue: 'Overdue Tasks',
        stat_at_risk: 'At Risk Tasks',
        stat_avg_delay: 'Average Stage Delay',
        panel_team: 'Team Workload',
        team_active: '{count} active tasks',
        team_overdue: '{count} overdue',
        team_completed: '{count} stages completed',
        drill_down_error: 'Unable to load tasks.',
        drill_down_empty_title: 'No tasks found',
        drill_down_empty_description: 'Adjust filters.',
      },
      'analytics.aging': {
        advanced: 'Advanced',
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

    let value = translations[namespace]?.[key];
    if (value !== undefined && params) {
      value = value.replace(/\{count\}/g, String(params.count ?? ''));
    }
    return value ?? key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/api/hooks/use-capabilities', () => ({
  useCapability: () => true,
}));

vi.mock('@/lib/api/hooks/use-auth', () => ({
  useCurrentUser: () => ({ data: { public_id: 'user-1' }, isLoading: false }),
}));

describe('DepartmentDashboard', () => {
  beforeEach(() => {
    mockRouterReplace.mockClear();
  });

  it('renders skeleton while loading', () => {
    renderWithProviders(<DepartmentDashboard />);
    expect(screen.getByTestId('department-dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders stat cards and team rows when loaded', async () => {
    renderWithProviders(<DepartmentDashboard />);
    await waitFor(() => {
      expect(screen.queryByTestId('department-dashboard-skeleton')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('department-performance-cards')).toBeInTheDocument();
    expect(screen.getByTestId('department-team-panel')).toBeInTheDocument();
    expect(screen.getByText('Active Tasks')).toBeInTheDocument();
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
    expect(screen.getByText('At Risk Tasks')).toBeInTheDocument();
    expect(screen.getByText('Average Stage Delay')).toBeInTheDocument();
  });

  it('renders correct stat card values', async () => {
    renderWithProviders(<DepartmentDashboard />);
    await waitFor(() => {
      expect(screen.queryByTestId('department-dashboard-skeleton')).not.toBeInTheDocument();
    });
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders team rows sorted by overdue assignments', async () => {
    renderWithProviders(<DepartmentDashboard />);
    await waitFor(() => {
      expect(screen.queryByTestId('department-dashboard-skeleton')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Ahmad')).toBeInTheDocument();
    expect(screen.getByText('Sara')).toBeInTheDocument();
    expect(screen.getByText('3 active tasks')).toBeInTheDocument();
    expect(screen.getByText('1 overdue')).toBeInTheDocument();
  });

  it('renders drill-down task list', async () => {
    renderWithProviders(<DepartmentDashboard />);
    await waitFor(() => {
      expect(screen.queryByTestId('department-dashboard-skeleton')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('department-drill-down-list')).toBeInTheDocument();
  });

  it('renders empty state when no data', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/departments/:department/performance', () => {
        return HttpResponse.json({
          department_public_id: 'dept-1',
          active_tasks: '0',
          overdue_tasks: '0',
          at_risk_tasks: '0',
          average_stage_delay_seconds: '0',
        });
      }),
      http.get('https://api.momentum.test/v1/analytics/departments/:department/team', () => {
        return HttpResponse.json([]);
      }),
    );
    renderWithProviders(<DepartmentDashboard />);
    await screen.findByText('No dashboard data');
  });

  it('renders error state on API failure', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/departments/:department/performance', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<DepartmentDashboard />);
    await screen.findByText('Unable to load the department dashboard.');
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders no permission state on 403', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/departments/:department/performance', () => {
        return new HttpResponse(null, { status: 403 });
      }),
    );
    renderWithProviders(<DepartmentDashboard />);
    await screen.findByText('No permission');
  });
});
