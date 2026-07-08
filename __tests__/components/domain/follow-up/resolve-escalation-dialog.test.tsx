import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import { ResolveEscalationDialog } from '@/components/domain/follow-up/resolve-escalation-dialog';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'resolve_title': 'Resolve Escalation',
      'resolution_note': 'Resolution note',
      'resolution_required': 'Resolution note is required',
      'resolved': 'Escalation resolved',
      'resolve_error': 'Failed to resolve escalation',
      'cancel': 'Cancel',
      'submitting': 'Submitting...',
      'resolve': 'Resolve',
    };
    return map[key] ?? key;
  },
}));

describe('ResolveEscalationDialog', () => {
  it('renders dialog title', () => {
    renderWithProviders(
      <ResolveEscalationDialog escalationPublicId="esc-1" open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText('Resolve Escalation')).toBeInTheDocument();
  });

  it('shows validation error on empty submit', async () => {
    const user = userEvent.setup();
    const sonner = await import('sonner');
    renderWithProviders(
      <ResolveEscalationDialog escalationPublicId="esc-1" open={true} onOpenChange={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(sonner.toast.error).toHaveBeenCalledWith('Resolution note is required');
  });
});
