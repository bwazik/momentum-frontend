import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { OrganizationOverview } from '@/components/domain/organization/organization-overview';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/organization',
}));

vi.mock('next-intl', () => ({
  useTranslations: (_namespace: string) => (key: string) => {
    const t: Record<string, Record<string, string>> = {
      organization: {
        'tabs.overview': 'Overview',
        'tabs.departments': 'Departments',
        'tabs.positions': 'Positions',
        'tabs.grades': 'Grades',
        'tabs.calendars': 'Calendars',
        'overview.total_departments': 'Total Departments',
        'overview.total_positions': 'Total Positions',
        'overview.filled': 'Filled',
        'overview.vacant': 'Vacant',
        'overview.org_chart': 'Org Chart',
        'overview.empty_title': 'No departments',
        'overview.empty_description': 'Start by creating departments.',
        'overview.position_count': '{filled}/{total} filled',
        'status.active': 'Active',
        'status.inactive': 'Inactive',
        'actions.edit': 'Edit',
        'actions.delete': 'Delete',
        'actions.deactivate': 'Deactivate',
        'actions.reactivate': 'Reactivate',
        'positions.head': 'Head',
        'positions.vacant': 'Vacant',
        'positions.grade_rank': 'Grade {rank}',
      },
    };
    return t[_namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

describe('OrganizationOverview', () => {
  it('renders empty state when no departments', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/organization/departments/tree', () =>
        HttpResponse.json([]),
      ),
    );

    renderWithProviders(<OrganizationOverview />);
    expect(await screen.findByText('No departments')).toBeInTheDocument();
  });

  it('renders stat cards and org chart with data', async () => {
    renderWithProviders(<OrganizationOverview />);
    await screen.findByText('Ministry');
    expect(screen.getAllByText('Total Departments').length).toBe(2);
    expect(screen.getAllByText('Total Positions').length).toBe(2);
    expect(screen.getAllByText('Filled').length).toBe(2);
    expect(screen.getAllByText('Vacant').length).toBe(2);
  });

  it('renders error state on API failure', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/organization/departments/tree', () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );

    renderWithProviders(<OrganizationOverview />);
    expect(await screen.findByText('Internal Server Error')).toBeInTheDocument();
  });
});
