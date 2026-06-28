import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { AuthorityGradesPanel } from '@/components/domain/organization/authority-grades-panel';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/organization',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const t: Record<string, Record<string, string>> = {
      organization: {
        'tabs.grades': 'Grades',
        'grades.add': 'Add Grade',
        'grades.columns.rank': 'Rank',
        'grades.columns.name': 'Name',
        'grades.columns.description': 'Description',
        'grades.create_title': 'Add Grade',
        'grades.edit_title': 'Edit Grade',
        'grades.has_active_positions': 'Has active positions',
        'grades.no_deactivation_hint': 'Cannot deactivate grades.',
        'grades.delete.title': 'Delete Grade',
        'grades.delete.description': 'Delete {name}?',
        'grades.empty.title': 'No grades',
        'grades.empty.description': 'Add the first grade.',
        'actions.edit': 'Edit',
        'actions.delete': 'Delete',
        'actions.cancel': 'Cancel',
        'actions.save': 'Save',
        'actions.saving': 'Saving...',
      },
    };
    return t[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

describe('AuthorityGradesPanel', () => {
  it('renders grades table with data', async () => {
    renderWithProviders(<AuthorityGradesPanel />);
    expect(await screen.findByText('Minister')).toBeInTheDocument();
    expect(await screen.findByText('Director')).toBeInTheDocument();
  });

  it('shows empty state when no grades', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/organization/authority-grades', () =>
        HttpResponse.json([]),
      ),
    );

    renderWithProviders(<AuthorityGradesPanel />);
    expect(await screen.findByText('Add the first grade.')).toBeInTheDocument();
  });
});
