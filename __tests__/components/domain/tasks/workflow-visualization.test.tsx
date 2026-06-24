import { screen } from '@testing-library/react';
import { WorkflowVisualization } from '@/components/domain/tasks/workflow-visualization';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import { server } from '@/__tests__/mocks/server';
import { http, HttpResponse } from 'msw';

Element.prototype.scrollIntoView = vi.fn();

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => {
    const translationsByNamespace: Record<string, Record<string, string>> = {
      'tasks.workflow': {
        page_title: 'Workflow Visualization',
        page_description: 'Visual map of the task\'s blueprint stages and execution state.',
        back_to_details: 'Back to Details',
        diagram_title: 'Workflow Diagram',
        fit_to_screen: 'Fit to Screen',
        empty_title: 'No workflow defined',
        empty_description: 'This task does not have any blueprint stages.',
        view_details: 'View Details',
        stage_node_label: 'Stage {name} — {status}',
        stage_n: 'Stage {n}',
        status_completed: 'Completed',
        status_active: 'Active',
        status_pending: 'Pending',
        status_returned: 'Returned',
        status_skipped: 'Skipped',
        legend_completed: 'Completed',
        legend_active: 'Active',
        legend_pending: 'Pending',
        legend_returned: 'Returned',
        legend_skipped: 'Skipped',
        legend_advance: 'Advance',
        legend_return: 'Return',
        legend_terminal: 'Task Complete',
        tooltip_entered: 'Started',
        tooltip_exited: 'Finished',
        tooltip_duration: 'Duration',
        tooltip_assignees: 'Assignees',
        sla: 'SLA',
        sla_no_policy: 'No SLA policy',
        no_permission_title: 'No permission',
        no_permission_description: 'You do not have permission to view this task workflow.',
        not_found_title: 'Task not found',
        not_found_description: 'This task may have been deleted or you may not have access.',
        error: 'Unable to load workflow.',
      },
      'tasks.detail': {
        time_less_than_1h: 'Less than 1 hour',
        time_just_now: 'Just now',
        time_ago_prefix: '',
        time_ago_suffix: ' ago',
        time_overdue_prefix: 'Overdue by ',
        time_at_risk: 'At risk',
        time_remaining: ' remaining',
        time_due_today: 'Due today',
        time_paused: 'Paused',
        time_completed: 'Completed',
        time_day_one: 'day',
        time_day_many: 'days',
        time_hour_one: 'hour',
        time_hour_many: 'hours',
        time_minute_one: 'minute',
        time_minute_many: 'minutes',
      },
      'blueprints.builder.canvas': {
        sla_unit_hours: 'hours',
        sla_unit_days: 'days',
      },
      'shared': {
        error: 'An error occurred.',
        retry: 'Retry',
      },
    };
    return translationsByNamespace[namespace]?.[key] ?? key;
  },
}));

vi.mock('@/lib/stores/use-task-display-store', () => {
  let displayId = '';
  return {
    useTaskDisplayStore: (selector: (s: { displayId: string; setDisplayId: (id: string) => void }) => unknown) =>
      selector({ displayId, setDisplayId: (id: string) => { displayId = id; } }),
  };
});

test('renders skeleton while loading', () => {
  renderWithProviders(<WorkflowVisualization publicId="test-task" />);
  expect(screen.getByTestId('workflow-skeleton')).toBeInTheDocument();
});

test('renders workflow nodes when task loads', async () => {
  renderWithProviders(<WorkflowVisualization publicId="test-task" />);
  expect(await screen.findByText('Review Stage')).toBeInTheDocument();
  expect(screen.getByText('Submission Stage')).toBeInTheDocument();
  expect(screen.getByText('Approval Stage')).toBeInTheDocument();
});

test('shows empty state when no blueprint stages', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId', () => {
      return HttpResponse.json({
        public_id: 'TASK-EMPTY',
        display_id: 'T-2026-9999',
        title_ar: 'مهمة بدون مراحل',
        title_en: 'Task Without Stages',
        description_ar: '',
        description_en: '',
        status: 'active',
        priority: null,
        classification_level: 'public',
        initiator_id: 'user-1',
        initiator_name_ar: 'مستخدم',
        initiator_name_en: 'User',
        created_at: '2026-06-01T10:00:00Z',
        due_date: '2026-07-01T10:00:00Z',
        blueprint: {
          public_id: 'bp-empty',
          name_ar: 'نموذج فارغ',
          name_en: 'Empty Blueprint',
          stages: [],
        },
        stages: [],
      });
    }),
  );

  renderWithProviders(<WorkflowVisualization publicId="TASK-EMPTY" />);
  expect(await screen.findByText('No workflow defined')).toBeInTheDocument();
});
