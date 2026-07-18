import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { TaskDetail } from '@/components/domain/tasks/task-detail';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/tasks/TASK-001',
}));

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
        status: 'Status',
        stage_progress: 'Stage Progress',
        initiator: 'Initiator',
        blueprint: 'Blueprint',
        department: 'Department',
        created: 'Created',
        due_date: 'Overall Due',
        confidentiality: 'Confidentiality',
        suspended_at: 'Suspended',
        suspension_reason: 'Suspension reason',
        cancelled_at: 'Cancelled',
        cancellation_reason: 'Cancellation reason',
        recent_activity: 'Recent Activity',
        no_activity: 'No recent activity',
        view_full_audit_trail: 'View Full Audit Trail',
        audit_trail: 'Audit Trail',
        ref: 'Ref',
        copy_id: 'Copy task ID',
        id_copied: 'Task ID copied',
        bookmark: 'Bookmark',
        not_found_title: 'Task not found',
        not_found_description: 'This task may have been deleted or you may not have access.',
        no_permission_title: 'No permission',
        no_permission_description: 'You do not have permission to view this task.',
        error: 'Unable to load task details.',
        of: 'of',
        suspend: 'Suspend',
        resume: 'Resume',
        cancel_task: 'Cancel Task',
        suspend_task_title: 'Suspend this task',
        cancel_task_title: 'Cancel this task',
        cancel_task_description: 'This will permanently terminate the task. All parties will be notified.',
        reason: 'Reason',
        reason_placeholder: 'Enter reason...',
        cancel: 'Cancel',
        submitting: 'Submitting...',
        return_stage_title: 'Return to previous stage',
        target_stage: 'Target stage',
        select_target_stage: 'Select a stage to return to',
        return_stage: 'Return Stage',
        complete_stage_title: 'Complete this stage',
        completion_note: 'Completion note (optional)',
        completion_note_placeholder: 'Add a note for the next assignees...',
        complete: 'Complete',
        override_title: 'Override assignment',
        current_assignee: 'Current assignee',
        select_assignee: 'Select assignee to replace',
        new_assignee: 'New assignee',
        search_users: 'Search users...',
        no_results: 'No results found',
        override: 'Override',
        retry: 'Try again',
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
      'tasks.comments': {
        title: 'Comments',
        composer_label: 'New comment',
        composer_placeholder: 'Write your comment...',
        post_comment: 'Post Comment',
        post_reply: 'Post Reply',
        posting: 'Posting...',
        reply: 'Reply',
        reply_to: 'Reply to {author}',
        cancel: 'Cancel',
        load_more: 'Load more',
        loading_more: 'Loading...',
        empty_title: 'No comments yet',
        empty_description: 'Start the conversation by adding the first comment.',
        error: 'Unable to load comments.',
        toast_posted: 'Comment posted',
        comments_list_label: 'Comments',
        replies_list_label: 'Replies',
      },
      shared: {
        error: 'An error occurred.',
        retry: 'Retry',
      },
      nav: {
        dashboard: 'Dashboard',
        tasks: 'Task Board',
      },
      'tasks.board.status': {
        draft: 'Draft',
        active: 'Active',
        suspended: 'Suspended',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      'tasks.board.sla': {
        green: 'On Track',
        amber: 'At Risk',
        red: 'Overdue',
        grey: 'Suspended',
        none: 'No active SLA',
      },
      'tasks.board.priority': {
        unknown: 'Unknown',
      },
      'tasks.board.classification': {
        public: 'Public',
        internal: 'Internal',
        confidential: 'Confidential',
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

describe('TaskDetail', () => {
  it('renders loading skeleton initially', () => {
    renderWithProviders(<TaskDetail publicId="TASK-001" />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders success state with all cards', async () => {
    renderWithProviders(<TaskDetail publicId="TASK-001" />);

    await waitFor(() => {
      expect(screen.getByText('Stage Timeline')).toBeInTheDocument();
    });

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Test Task Detail')).toBeInTheDocument();
    expect(screen.getByText('Ref: T-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Task description')).toBeInTheDocument();
    expect(screen.getAllByText('Review Stage').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Test Blueprint')).toBeInTheDocument();
    expect(screen.getAllByText('Initiator').length).toBeGreaterThanOrEqual(1);
  });

  it('renders 404 empty state', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/tasks/:publicId', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      }),
    );

    renderWithProviders(<TaskDetail publicId="nonexistent" />);

    await screen.findByText('Task not found');
    expect(screen.getByText('This task may have been deleted or you may not have access.')).toBeInTheDocument();
  });

  it('renders metadata-only view on 403', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/tasks/:publicId', () => {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
      }),
      http.get('https://api.momentum.test/v1/tasks/:publicId/metadata', () => {
        return HttpResponse.json({
          public_id: 'forbidden-task',
          classification_level: '3',
          title: 'Confidential Task',
          owning_department: 'HR',
          current_responsible_position: 'Manager',
          status: 'active',
          due_date: '2026-08-01',
          sla_health: null,
          metadata_only: true,
        });
      }),
    );

    renderWithProviders(<TaskDetail publicId="forbidden-task" />);

    await screen.findByText('Confidential Task');
    expect(screen.getByText('HR')).toBeInTheDocument();
  });

  it('renders generic error state on 500', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/tasks/:publicId', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderWithProviders(<TaskDetail publicId="error-task" />);

    await screen.findByText('Unable to load task details.');
  });
});
