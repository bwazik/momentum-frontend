import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import { FollowUpBoard } from '@/components/domain/follow-up/follow-up-board';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/follow-up',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'followUp.board': {
        'error': 'Unable to load the follow-up board.',
        'empty_title': 'No tasks found',
        'empty_description': 'Adjust filters or reset the board.',
        'load_more': 'Load more',
        'loading_more': 'Loading...',
        'reset_filters': 'Reset filters',
        'no_permission_title': 'No permission',
        'no_permission_description': 'You do not have permission to view the follow-up board.',
        'table_label': 'Follow-up board',
        'row_actions': 'Row actions',
        'open_details': 'Open Details',
        'open_workflow': 'Open Workflow',
        'log_follow_up': 'Log Follow-Up',
        'escalate': 'Escalate',
        'columns.sla': 'SLA',
        'columns.task': 'Task',
        'columns.stage': 'Stage',
        'columns.assignees': 'Assignees',
        'columns.time_in_stage': 'Time In Stage',
        'columns.actions': 'Actions',
      },
      'tasks.board.sla': {
        green: 'On Track', amber: 'At Risk', red: 'Overdue', grey: 'Suspended', none: 'No SLA',
      },
      'tasks.board.status': {
        draft: 'Draft', active: 'Active', suspended: 'Suspended', completed: 'Completed', cancelled: 'Cancelled',
      },
      'tasks.board.priority': { unknown: 'Unknown' },
      'tasks.board.classification': { public: 'Public', internal: 'Internal', confidential: 'Confidential' },
    };
    return translations[namespace]?.[key] ?? key;
  },
}));

vi.mock('@/lib/api/hooks/use-capabilities', () => ({
  useCapability: () => true,
}));

describe('FollowUpBoard', () => {
  it('renders loading skeleton initially', () => {
    renderWithProviders(
      <FollowUpBoard
        allTasks={[]}
        query={{ isLoading: true, isError: false, error: null, data: undefined, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn(), refetch: vi.fn() }}
        onLogFollowUp={vi.fn()}
        onEscalate={vi.fn()}
      />
    );
    expect(screen.getByTestId('follow-up-skeleton')).toBeInTheDocument();
  });
});
