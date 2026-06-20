import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test-utils';
import { StageTimeline } from '@/components/domain/tasks/stage-timeline';
import type { TaskStageInstanceResource, SlaTimerInstanceResource } from '@/components/domain/tasks/task-detail-types';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'tasks.detail': {
        page_title: 'Task Details',
        page_description: 'View and manage task details.',
        stage_timeline: 'Stage Timeline',
        no_stages: 'No stages yet',
        completed: 'Completed',
        active: 'Active',
        returned: 'Returned',
        pending: 'Pending',
        suspended: 'Suspended',
        cancelled: 'Cancelled',
        submit_and_advance: 'Submit & Advance',
        return_to_previous: 'Return to Previous',
        override_assignment: 'Override Assignment',
        return_reason: 'Return reason',
        details: 'Details',
        time_day_one: 'day',
        time_day_many: 'days',
        time_hour_one: 'hour',
        time_hour_many: 'hours',
        time_minute_one: 'minute',
        time_minute_many: 'minutes',
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
        toast_stage_completed: 'Stage completed',
        toast_sub_stage_completed: 'Sub-stage completed',
        toast_stage_returned: 'Stage returned',
        toast_sub_stage_returned: 'Sub-stage returned',
        toast_assignment_overridden: 'Assignment overridden',
        toast_task_suspended: 'Task suspended',
        toast_task_resumed: 'Task resumed',
        toast_task_cancelled: 'Task cancelled',
      },
    };
    return translations[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/api/hooks/use-auth', () => ({
  useCurrentUser: () => ({ data: { public_id: 'user-1' } }),
}));

vi.mock('@/lib/api/hooks/use-capabilities', () => ({
  useCapability: () => false,
}));

const completedStage: TaskStageInstanceResource = {
  instance_id: 'stage-inst-1',
  blueprint_stage: { public_id: 'bp-stage-1', name_ar: 'مرحلة التقديم', name_en: 'Submission Stage' },
  status: 'completed',
  entered_at: '2026-06-01T10:00:00Z',
  exited_at: '2026-06-03T10:00:00Z',
  assignments: [
    { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: '1', reassigned_at: null },
  ],
  sub_stages: [],
  completion_note: 'Initial submission done',
  return_reason: null,
};

const activeStage: TaskStageInstanceResource = {
  instance_id: 'stage-inst-2',
  blueprint_stage: { public_id: 'bp-stage-2', name_ar: 'مرحلة المراجعة', name_en: 'Review Stage' },
  status: 'active',
  entered_at: '2026-06-03T10:00:00Z',
  exited_at: null,
  assignments: [
    { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: false, reassigned_at: null },
  ],
  sub_stages: [
    {
      instance_id: 'sub-stage-inst-1',
      blueprint_sub_stage: { public_id: 'bp-sub-1', name_ar: 'مراجعة أولية', name_en: 'Initial Review' },
      status: 'active',
      entered_at: '2026-06-04T10:00:00Z',
      exited_at: null,
      assignments: [
        { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: false, reassigned_at: null },
      ],
      completion_note: null,
      return_reason: null,
    },
  ],
  completion_note: null,
  return_reason: null,
};

const pendingStage: TaskStageInstanceResource = {
  instance_id: 'stage-inst-3',
  blueprint_stage: { public_id: 'bp-stage-3', name_ar: 'مرحلة الاعتماد', name_en: 'Approval Stage' },
  status: 'pending',
  entered_at: null,
  exited_at: null,
  assignments: [],
  sub_stages: [],
  completion_note: null,
  return_reason: null,
};

const slaTimers: SlaTimerInstanceResource[] = [
  {
    stage_instance_id: 'stage-inst-2',
    sub_stage_instance_id: '',
    deadline_at: '2026-06-13T10:00:00Z',
    warning_at: '2026-06-10T10:00:00Z',
    status: '1',
  },
];

describe('StageTimeline', () => {
  it('renders card title', () => {
    renderWithProviders(<StageTimeline stages={[]} taskPublicId="TASK-001" />);
    expect(screen.getByText('Stage Timeline')).toBeInTheDocument();
  });

  it('renders empty state when no stages', () => {
    renderWithProviders(<StageTimeline stages={[]} taskPublicId="TASK-001" />);
    expect(screen.getByText('No stages yet')).toBeInTheDocument();
  });

  it('renders completed stage node with check icon and completion note', () => {
    renderWithProviders(<StageTimeline stages={[completedStage]} taskPublicId="TASK-001" />);
    expect(screen.getByText('Submission Stage')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Initial submission done')).toBeInTheDocument();
  });

  it('renders active stage node with assignees', () => {
    renderWithProviders(<StageTimeline stages={[completedStage, activeStage]} taskPublicId="TASK-001" slaTimers={slaTimers} />);
    expect(screen.getByText('Review Stage')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getAllByText('Ahmed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Submit & Advance')).toBeInTheDocument();
    expect(screen.getByText('Return to Previous')).toBeInTheDocument();
  });

  it('renders pending stage node with muted style', () => {
    renderWithProviders(<StageTimeline stages={[completedStage, activeStage, pendingStage]} taskPublicId="TASK-001" />);
    expect(screen.getByText('Approval Stage')).toBeInTheDocument();
    expect(screen.getByText('Approval Stage')).toHaveClass('text-muted-foreground');
  });

  it('renders sub-stage checklist within active stage', () => {
    renderWithProviders(<StageTimeline stages={[completedStage, activeStage]} taskPublicId="TASK-001" />);
    expect(screen.getByText('Initial Review')).toBeInTheDocument();
  });

  it('sorts stages by entered_at', () => {
    const unsorted = [activeStage, completedStage];
    renderWithProviders(<StageTimeline stages={unsorted} taskPublicId="TASK-001" />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Submission Stage');
    expect(listItems[1]).toHaveTextContent('Review Stage');
  });
});
