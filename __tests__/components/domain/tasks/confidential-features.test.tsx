import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassificationBadge } from '@/components/domain/tasks/task-badges';
import { ConfidentialParticipantsSkeleton } from '@/components/domain/tasks/confidential-participants-skeleton';
import { TaskMetadataSkeleton } from '@/components/domain/tasks/task-metadata-skeleton';
import { ConfidentialMetadataPage } from '@/components/domain/tasks/confidential-metadata-page';
import { AccessOverrideDialog } from '@/components/domain/tasks/access-override-dialog';
import { TaskOverrideSession } from '@/components/domain/tasks/task-override-session';

vi.mock('@/lib/api/hooks/use-capabilities', () => ({
  useCapability: () => true,
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string, opts?: Record<string, unknown>) => {
    const translationsByNamespace: Record<string, Record<string, string>> = {
      'tasks.board.classification': {
        public: 'Public',
        internal: 'Internal',
        confidential: 'Confidential',
        aria_confidential: 'Classification: Confidential',
      },
      'confidential.metadata': {
        alert_title: 'Restricted Access',
        alert_description: 'You are viewing restricted metadata only.',
        department: 'Department',
        responsible_position: 'Position',
        status: 'Status',
        sla_health: 'SLA',
        due_date: 'Due Date',
        open_content: 'Open Confidential Content',
      },
      'confidential.override': {
        title: 'Open Confidential Content',
        description: 'This action will be recorded.',
        audit_notice: 'This access is audited.',
        reason_label: 'Reason',
        reason_placeholder: 'Enter reason...',
        reason_hint: 'Min 10 chars',
        reason_too_short: 'Reason too short',
        cancel: 'Cancel',
        confirm: 'Confirm',
        session_title: 'Monitored Access Session',
        session_description: 'Reason: {reason}',
      },
    };
    const val = translationsByNamespace[namespace]?.[key];
    if (val && opts) return val.replace('{reason}', String(opts.reason ?? ''));
    return val ?? key;
  },
}));

describe('ClassificationBadge', () => {
  it('renders confidential variant with lock icon for level 3', () => {
    render(<ClassificationBadge level={3} />);
    expect(screen.getByText('Confidential')).toBeInTheDocument();
  });

  it('renders muted text with globe for level 1 (public)', () => {
    render(<ClassificationBadge level={1} />);
    expect(screen.getByText('Public')).toBeInTheDocument();
  });

  it('renders muted text with shield for level 2 (internal)', () => {
    render(<ClassificationBadge level={2} />);
    expect(screen.getByText('Internal')).toBeInTheDocument();
  });

  it('renders public for null level', () => {
    render(<ClassificationBadge level={null} />);
    expect(screen.getByText('Public')).toBeInTheDocument();
  });
});

describe('ConfidentialParticipantsSkeleton', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<ConfidentialParticipantsSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});

describe('TaskMetadataSkeleton', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<TaskMetadataSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});

describe('ConfidentialMetadataPage', () => {
  const mockMetadata = {
    public_id: 'task-1',
    classification_level: '3',
    title: 'HR Investigation',
    owning_department: 'Human Resources',
    current_responsible_position: 'HR Director',
    status: 'active',
    due_date: '2026-08-01',
    sla_health: null,
    metadata_only: true,
  };

  it('renders metadata fields and alert', () => {
    render(
      <ConfidentialMetadataPage
        metadata={mockMetadata}
        taskPublicId="task-1"
        onRequestOverride={vi.fn()}
      />,
    );
    expect(screen.getByText('HR Investigation')).toBeInTheDocument();
    expect(screen.getByText('Human Resources')).toBeInTheDocument();
    expect(screen.getByText('HR Director')).toBeInTheDocument();
    expect(screen.getByText('Restricted Access')).toBeInTheDocument();
  });

  it('renders override button', () => {
    render(
      <ConfidentialMetadataPage
        metadata={mockMetadata}
        taskPublicId="task-1"
        onRequestOverride={vi.fn()}
      />,
    );
    expect(screen.getByText('Open Confidential Content')).toBeInTheDocument();
  });
});

describe('AccessOverrideDialog', () => {
  it('calls onConfirm with valid reason', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <AccessOverrideDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Valid investigation reason');
    await user.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledWith('Valid investigation reason');
  });

  it('does not call onConfirm with short reason', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <AccessOverrideDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'short');
    await user.click(screen.getByText('Confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('TaskOverrideSession', () => {
  it('renders amber banner with reason', () => {
    render(
      <TaskOverrideSession reason="Urgent investigation">
        <div>Task content</div>
      </TaskOverrideSession>,
    );
    expect(screen.getByText('Monitored Access Session')).toBeInTheDocument();
    expect(screen.getByText(/Urgent investigation/)).toBeInTheDocument();
    expect(screen.getByText('Task content')).toBeInTheDocument();
  });
});
