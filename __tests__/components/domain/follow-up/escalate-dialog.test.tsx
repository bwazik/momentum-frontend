import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import { EscalateDialog } from '@/components/domain/follow-up/escalate-dialog';
import type { BoardTaskResource } from '@/components/domain/follow-up/follow-up-types';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'title': 'Escalate Task',
      'reason': 'Reason',
      'reason_required': 'Reason is required',
      'submit': 'Escalate',
      'submitting': 'Submitting...',
      'cancel': 'Cancel',
      'created': 'Escalation created',
      'create_error': 'Failed to create escalation',
    };
    return map[key] ?? key;
  },
}));

const mockTask = {
  public_id: 'task-1',
  display_id: 'T-2026-0001',
  title_ar: 'مهمة اختبارية',
  title_en: 'Test Task',
  status: 'active',
  classification_level: 'public',
  sla_health: 'green',
  time_at_current_stage_seconds: '0',
} as unknown as BoardTaskResource;

describe('EscalateDialog', () => {
  it('renders dialog title', () => {
    renderWithProviders(
      <EscalateDialog task={mockTask} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText('Escalate Task')).toBeInTheDocument();
  });

  it('shows validation error on empty submit', async () => {
    const user = userEvent.setup();
    const sonner = await import('sonner');
    renderWithProviders(
      <EscalateDialog task={mockTask} open={true} onOpenChange={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Escalate' }));
    expect(sonner.toast.error).toHaveBeenCalledWith('Reason is required');
  });
});
