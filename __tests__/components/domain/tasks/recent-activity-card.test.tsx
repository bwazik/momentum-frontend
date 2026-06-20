import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentActivityCard } from '@/components/domain/tasks/recent-activity-card';
import type { TaskTimelineResource } from '@/components/domain/tasks/task-detail-types';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'tasks.detail': {
        page_title: 'Task Details',
        page_description: 'View and manage task details.',
        recent_activity: 'Recent Activity',
        no_activity: 'No recent activity',
        view_full_audit_trail: 'View Full Audit Trail',
        stage_started: 'stage started',
        stage_completed: 'stage completed',
        stage_returned: 'returned for revisions',
        sub_stage_started: 'sub-stage started',
        sub_stage_completed: 'sub-stage completed',
        assigned_to: 'assigned to',
        completed_work_on: 'completed work in',
        was_replaced: 'was replaced',
        stage_suffix: 'Stage',
        substage_suffix: 'substage',
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

const mockEntry: TaskTimelineResource = {
  type: 'stage_entered',
  user_name_ar: 'أحمد',
  user_name_en: 'Ahmed',
  stage_name_ar: 'مرحلة التقديم',
  stage_name_en: 'Submission Stage',
  parent_stage_name_ar: null,
  parent_stage_name_en: null,
  timestamp: new Date().toISOString(),
  completion_note: null,
  return_reason: null,
  reassignment_reason: null,
};

const mockEntries = Array.from({ length: 7 }, (_, i) => ({
  ...mockEntry,
  stage_name_en: `Stage ${i + 1}`,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
}));

describe('RecentActivityCard', () => {
  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(<RecentActivityCard entries={[]} isLoading={true} />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no entries', () => {
    render(<RecentActivityCard entries={[]} isLoading={false} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders up to 5 most recent entries', () => {
    render(<RecentActivityCard entries={mockEntries} isLoading={false} />);
    expect(screen.getByText('Stage 1')).toBeInTheDocument();
    expect(screen.getByText('Stage 5')).toBeInTheDocument();
    expect(screen.queryByText('Stage 6')).not.toBeInTheDocument();
    expect(screen.queryByText('Stage 7')).not.toBeInTheDocument();
  });

  it('renders view full audit trail link', () => {
    render(<RecentActivityCard entries={mockEntries} isLoading={false} />);
    expect(screen.getByText('View Full Audit Trail →')).toBeInTheDocument();
  });

  it('calls onViewFull when link is clicked', async () => {
    const user = userEvent.setup();
    const onViewFull = vi.fn();
    render(<RecentActivityCard entries={mockEntries} isLoading={false} onViewFull={onViewFull} />);

    await user.click(screen.getByText('View Full Audit Trail →'));
    expect(onViewFull).toHaveBeenCalledTimes(1);
  });
});
