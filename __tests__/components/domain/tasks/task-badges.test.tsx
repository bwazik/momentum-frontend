import { screen, render } from '@testing-library/react';
import { SlaBadge, TaskStatusBadge, PriorityBadge, ClassificationBadge } from '@/components/domain/tasks/task-badges';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => {
    const translationsByNamespace: Record<string, Record<string, string>> = {
      'tasks.board.sla': {
        green: 'On Track',
        amber: 'At Risk',
        red: 'Overdue',
        grey: 'Suspended',
      },
      'tasks.board.status': {
        draft: 'Draft',
        active: 'Active',
        suspended: 'Suspended',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      'tasks.board.priority': {
        unknown: 'Unknown',
      },
      'tasks.board.classification': {
        internal: 'Internal',
        confidential: 'Confidential',
      },
    };
    return translationsByNamespace[namespace]?.[key] ?? key;
  },
}));

describe('SlaBadge', () => {
  it('renders green health as On Track', () => {
    render(<SlaBadge health="green" />);
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('renders red health as Overdue', () => {
    render(<SlaBadge health="red" />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders amber health as At Risk', () => {
    render(<SlaBadge health="amber" />);
    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });

  it('renders grey health as Suspended', () => {
    render(<SlaBadge health="grey" />);
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('defaults to green for unknown health', () => {
    render(<SlaBadge health="unknown" />);
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('defaults to green for null health', () => {
    render(<SlaBadge health={null} />);
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });
});

describe('TaskStatusBadge', () => {
  it('renders active status', () => {
    render(<TaskStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders draft status', () => {
    render(<TaskStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders suspended status', () => {
    render(<TaskStatusBadge status="suspended" />);
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('renders completed status', () => {
    render(<TaskStatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders cancelled status', () => {
    render(<TaskStatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('defaults to draft for unknown status', () => {
    render(<TaskStatusBadge status="unknown" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('defaults to draft for null status', () => {
    render(<TaskStatusBadge status={null} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});

describe('PriorityBadge', () => {
  it('renders English name when locale is en', () => {
    render(<PriorityBadge priority={{ name_ar: 'عالية', name_en: 'High', severity_rank: 'critical' }} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('falls back to Arabic when English is missing', () => {
    render(<PriorityBadge priority={{ name_ar: 'عالية', name_en: '', severity_rank: 'urgent' }} />);
    expect(screen.getByText('عالية')).toBeInTheDocument();
  });

  it('renders unknown for null priority', () => {
    render(<PriorityBadge priority={null} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

describe('ClassificationBadge', () => {
  it('renders nothing for public level', () => {
    const { container } = render(<ClassificationBadge level="public" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders internal label', () => {
    render(<ClassificationBadge level="internal" />);
    expect(screen.getByText('Internal')).toBeInTheDocument();
  });

  it('renders confidential label', () => {
    render(<ClassificationBadge level="confidential" />);
    expect(screen.getByText('Confidential')).toBeInTheDocument();
  });

  it('returns null for null level', () => {
    const { container } = render(<ClassificationBadge level={null} />);
    expect(container.firstChild).toBeNull();
  });
});
