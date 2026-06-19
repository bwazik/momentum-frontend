import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { TaskBoard } from '@/components/domain/tasks/task-board';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/tasks',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'tasks.board': {
        title: 'Task Board',
        description: 'Track active work.',
        error: 'Unable to load tasks.',
        empty_title: 'No tasks found',
        empty_description: 'Adjust filters or reset the board.',
        load_more: 'Load more',
        loading_more: 'Loading...',
        reset_filters: 'Reset filters',
        no_permission_title: 'No permission',
        no_permission_description: 'You do not have permission.',
        'filters.active': 'Active',
        'filters.mine': 'My Tasks',
        'filters.overdue': 'Overdue',
        'filters.at_risk': 'At Risk',
        'filters.suspended': 'Suspended',
        'filters.all': 'All',
        'filters.reset': 'Reset',
        'filters.search': 'Search',
        'filters.search_placeholder': 'Search tasks...',
        'filters.sort_by': 'Sort by',
        'filters.sort_time_at_stage': 'Time at stage',
        'filters.sort_priority': 'Priority',
        'filters.sort_due_date': 'Due date',
        'filters.sort_created_at': 'Created date',
        'filters.sort_department': 'Department',
        'filters.sort_stage_type': 'Stage type',
        'filters.sort_asc': 'Ascending',
        'filters.sort_desc': 'Descending',
        'columns.task': 'Task',
        'columns.status': 'Status',
        'columns.priority': 'Priority',
        'columns.stage': 'Stage',
        'columns.assignees': 'Assignees',
        'columns.department': 'Department',
        'columns.sla': 'SLA',
        'columns.due_date': 'Due Date',
        'columns.time_in_stage': 'Time In Stage',
        'columns.actions': 'Actions',
        'columns.table_label': 'Task board',
        'columns.row_actions': 'Row actions',
        'columns.open_details': 'Open Details',
        'columns.copy_link': 'Copy Link',
        'columns.link_copied': 'Link copied',
        'columns.copy_failed': 'Failed to copy link',
        'sla.green': 'On Track',
        'sla.amber': 'At Risk',
        'sla.red': 'Overdue',
        'sla.grey': 'Suspended',
        'status.draft': 'Draft',
        'status.active': 'Active',
        'status.suspended': 'Suspended',
        'status.completed': 'Completed',
        'status.cancelled': 'Cancelled',
        'priority.unknown': 'Unknown',
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

describe('TaskBoard', () => {
  it('renders loading skeleton initially', () => {
    renderWithProviders(<TaskBoard />);
    expect(screen.getByTestId('task-board-skeleton')).toBeInTheDocument();
  });

  it('renders tasks when loaded', async () => {
    renderWithProviders(<TaskBoard />);
    await waitFor(() => {
      expect(screen.queryByTestId('task-board-skeleton')).not.toBeInTheDocument();
    });
    const taskElements = await screen.findAllByText('Test Task');
    expect(taskElements.length).toBeGreaterThanOrEqual(1);
    const overdueElements = screen.getAllByText('Overdue Task');
    expect(overdueElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no tasks', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/follow-up/board', () => {
        return HttpResponse.json({
          data: [],
          next_cursor: null,
          has_more: false,
        });
      }),
    );
    renderWithProviders(<TaskBoard />);
    await screen.findByText('No tasks found');
  });

  it('renders error state on API failure', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/follow-up/board', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<TaskBoard />);
    await screen.findByText('Unable to load tasks.');
  });

  it('renders no permission state on 403', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/follow-up/board', () => {
        return new HttpResponse(null, { status: 403 });
      }),
    );
    renderWithProviders(<TaskBoard />);
    await screen.findByText('No permission');
  });

  it('shows load more button when has_more is true', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/follow-up/board', () => {
        return HttpResponse.json({
          data: [
            {
              public_id: '01912345-6789-7abc-def0-123456789abc',
              title_ar: 'مهمة اختبارية',
              title_en: 'Test Task',
              status: 'active',
              priority: null,
              classification_level: 'public',
              current_stage: null,
              current_assignees: [],
              sla_health: 'green',
              time_at_current_stage_seconds: '0',
              department: null,
              blueprint_category: null,
              due_date: '',
              created_at: '',
              launched_at: '',
            },
          ],
          next_cursor: 'next-page-cursor',
          has_more: true,
        });
      }),
    );
    renderWithProviders(<TaskBoard />);
    const taskElements = await screen.findAllByText('Test Task');
    expect(taskElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Load more')).toBeInTheDocument();
  });
});
