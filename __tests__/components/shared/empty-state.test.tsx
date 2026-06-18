import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/shared/empty-state';
import { InboxIcon } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No tasks" description="No tasks to show" />);
    expect(screen.getByText('No tasks')).toBeInTheDocument();
    expect(screen.getByText('No tasks to show')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<EmptyState icon={InboxIcon} title="Empty" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('renders action element', () => {
    render(<EmptyState title="Empty" action={<button>Retry</button>} />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
