import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { PositionsPanel } from '@/components/domain/organization/positions-panel';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/organization',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const t: Record<string, Record<string, string>> = {
      organization: {
        'tabs.positions': 'Positions',
        'actions.add_position': 'Add Position',
        'actions.edit': 'Edit',
        'actions.delete': 'Delete',
        'actions.deactivate': 'Deactivate',
        'actions.reactivate': 'Reactivate',
        'actions.transfer': 'Transfer',
        'actions.cancel': 'Cancel',
        'actions.save': 'Save',
        'actions.saving': 'Saving...',
        'actions.create': 'Create',
        'actions.loading': 'Loading...',
        'actions.load_more': 'Load more',
        'dialogs.title_ar': 'Title',
        'dialogs.department': 'Department',
        'dialogs.department_placeholder': 'Select',
        'dialogs.authority_grade': 'Grade',
        'dialogs.grade_placeholder': 'Select',
        'dialogs.head': 'Head',
        'dialogs.head_of_dept': 'Head',
        'dialogs.vacant': 'Vacant',
        'dialogs.add_position': 'Add Position',
        'dialogs.edit_position': 'Edit Position',
        'dialogs.title_ar_required': 'Title required',
        'dialogs.department_required': 'Department required',
        'dialogs.grade_required': 'Grade required',
        'dialogs.reports_to': 'Reports To',
        'dialogs.reports_to_placeholder': 'Select',
        'dialogs.transfer_title': 'Transfer',
        'dialogs.transfer_desc': 'Select target department.',
        'dialogs.target_department_placeholder': 'Select',
        'dialogs.confirm_transfer': 'Transfer',
        'dialogs.name_ar': 'Name',
        'dialogs.name_ar_placeholder': 'Enter name',
        'empty.no_positions': 'No positions',
        'empty.no_positions_desc': 'Add the first position.',
        'status.active': 'Active',
        'status.inactive': 'Inactive',
      },
    };
    return t[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

describe('PositionsPanel', () => {
  it('renders table with positions', async () => {
    renderWithProviders(<PositionsPanel />);
    const directors = await screen.findAllByText('Director');
    expect(directors.length).toBeGreaterThanOrEqual(1);
    const accountants = await screen.findAllByText('Accountant');
    expect(accountants.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no positions', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/organization/positions', () =>
        HttpResponse.json({ data: [], next_cursor: null, has_more: false }),
      ),
    );

    renderWithProviders(<PositionsPanel />);
    expect(await screen.findByText('Add the first position.')).toBeInTheDocument();
  });
});
