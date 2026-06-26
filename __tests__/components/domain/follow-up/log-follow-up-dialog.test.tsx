import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import { LogFollowUpDialog } from '@/components/domain/follow-up/log-follow-up-dialog';
import type { BoardTaskResource } from '@/components/domain/follow-up/follow-up-types';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'followUp.actions': {
        'log_title': 'Log Follow-Up Action',
        'action_type': 'Action type',
        'action_type_placeholder': 'Select type',
        'action_type_required': 'Action type is required',
        'type_1': 'Phone Call',
        'type_2': 'Message',
        'type_3': 'Meeting',
        'type_4': 'Email',
        'type_5': 'Other',
        'note_ar': 'Note (Arabic)',
        'note_en': 'Note (English, optional)',
        'note_ar_required': 'Arabic note is required',
        'contact_name': 'Contact name',
        'contact_name_placeholder': 'Optional',
        'submit': 'Submit',
        'submitting': 'Submitting...',
        'cancel': 'Cancel',
        'logged': 'Follow-up action logged',
        'log_error': 'Failed to log action',
      },
    };
    return translations[namespace]?.[key] ?? key;
  },
}));

const mockTask = {
  public_id: 'task-1',
  display_id: 'T-2026-0001',
  title_ar: 'مهمة اختبارية',
  title_en: 'Test Task',
  status: 'active',
  priority: null,
  classification_level: 'public',
  current_stage: null,
  current_assignees: '[]',
  sla_health: 'green',
  time_at_current_stage_seconds: '0',
  department: null,
  blueprint_category: null,
  due_date: '',
  created_at: '',
  launched_at: '',
} as unknown as BoardTaskResource;

describe('LogFollowUpDialog', () => {
  it('renders dialog title', () => {
    renderWithProviders(
      <LogFollowUpDialog task={mockTask} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText('Log Follow-Up Action')).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LogFollowUpDialog task={mockTask} open={true} onOpenChange={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(screen.getByText('Action type is required')).toBeInTheDocument();
    });
    expect(screen.getByText('Arabic note is required')).toBeInTheDocument();
  });
});
