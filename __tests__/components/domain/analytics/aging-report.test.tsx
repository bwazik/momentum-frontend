import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { AgingReport } from '@/components/domain/analytics/aging-report';

const mockRouterReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockRouterReplace }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics/aging',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'analytics.aging': {
        title: 'Aging Report',
        description: 'Tasks sorted by how long they have been at their current stage.',
        error: 'Unable to load the aging report.',
        empty_title: 'No tasks found',
        empty_description: 'Adjust filters or reset the report.',
        reset_filters: 'Reset filters',
        load_more: 'Load more',
        loading_more: 'Loading...',
        no_permission_title: 'No permission',
        no_permission_description: 'You do not have permission to view analytics.',
        filter_active: 'Active',
        filter_suspended: 'Suspended',
        filter_all: 'All',
        reset: 'Reset',
        advanced: 'Advanced filters',
        department: 'Department',
        priority: 'Priority',
        blueprint_category: 'Blueprint category',
        date_from: 'Date from',
        date_to: 'Date to',
        'columns.table_label': 'Aging report',
        'columns.sla': 'SLA',
        'columns.task': 'Task',
        'columns.priority': 'Priority',
        'columns.stage': 'Current Stage',
        'columns.assignees': 'Assignees',
        'columns.time_at_stage': 'Time at Stage',
        'columns.created_at': 'Created At',
      },
      'tasks.board.sla': {
        green: 'On Track',
        amber: 'At Risk',
        red: 'Overdue',
        grey: 'Suspended',
        none: 'None',
      },
      'tasks.board.priority': {
        unknown: 'Unknown',
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

vi.mock('@/lib/api/hooks/use-task-board', () => ({
  useTaskPriorities: () => ({ data: [] }),
  useBlueprintCategories: () => ({ data: [] }),
  useStageTypes: () => ({ data: [] }),
}));

vi.mock('@/lib/api/hooks/use-organization', () => ({
  useDepartmentsInfinite: () => ({ data: { pages: [{ data: [] }] } }),
}));

describe('AgingReport', () => {
  beforeEach(() => {
    mockRouterReplace.mockClear();
  });

  it('renders loading skeleton initially', () => {
    renderWithProviders(<AgingReport />);
    expect(screen.getByTestId('aging-report-skeleton')).toBeInTheDocument();
  });

  it('renders aging rows when loaded', async () => {
    renderWithProviders(<AgingReport />);
    await waitFor(() => {
      expect(screen.queryByTestId('aging-report-skeleton')).not.toBeInTheDocument();
    });
    const tasks = await screen.findAllByText('Overdue Task');
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    const reviewTasks = await screen.findAllByText('In Review Task');
    expect(reviewTasks.length).toBeGreaterThanOrEqual(1);
    const suspendedTasks = await screen.findAllByText('Suspended Task');
    expect(suspendedTasks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no tasks', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/tasks/aging', () => {
        return HttpResponse.json({
          data: [],
          next_cursor: null,
          has_more: false,
        });
      }),
    );
    renderWithProviders(<AgingReport />);
    await screen.findByText('No tasks found');
    expect(screen.getByText('Reset filters')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/tasks/aging', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<AgingReport />);
    await screen.findByText('Unable to load the aging report.');
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders no permission state on 403', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/tasks/aging', () => {
        return new HttpResponse(null, { status: 403 });
      }),
    );
    renderWithProviders(<AgingReport />);
    await screen.findByText('No permission');
  });

  it('shows load more button when has_more is true', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/analytics/tasks/aging', () => {
        return HttpResponse.json({
          data: [
            {
              task_public_id: '01912345-6789-7abc-def0-123456789abc',
              title_ar: 'مهمة متأخرة',
              title_en: 'Overdue Task',
              priority: {
                public_id: 'prio-1',
                name_ar: 'عاجل',
                name_en: 'Urgent',
                severity_rank: 'urgent',
                color_code: '#f59e0b',
              },
              current_stage_name_ar: 'مراجعة',
              current_stage_name_en: 'Review',
              active_assignees: [{ public_id: 'u1', name_ar: 'أحمد', name_en: 'Ahmad' }],
              sla_health: 'red',
              created_at: '2026-07-01T00:00:00Z',
              entered_at: '2026-07-05T00:00:00Z',
            },
          ],
          next_cursor: 'next-page',
          has_more: true,
        });
      }),
    );
    renderWithProviders(<AgingReport />);
    const tasks = await screen.findAllByText('Overdue Task');
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Load more')).toBeInTheDocument();
  });

  it('shows SLA badge with correct text', async () => {
    renderWithProviders(<AgingReport />);
    await waitFor(() => {
      expect(screen.queryByTestId('aging-report-skeleton')).not.toBeInTheDocument();
    });
    const slas = await screen.findAllByText('Overdue');
    expect(slas.length).toBeGreaterThanOrEqual(1);
  });

  it('handles quick filter click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgingReport />);
    await waitFor(() => {
      expect(screen.queryByTestId('aging-report-skeleton')).not.toBeInTheDocument();
    });
    const buttons = screen.getAllByRole('radio', { name: 'Suspended' });
    await user.click(buttons[0]);
    expect(mockRouterReplace).toHaveBeenCalledWith(expect.stringContaining('status=suspended'));
  });
});
