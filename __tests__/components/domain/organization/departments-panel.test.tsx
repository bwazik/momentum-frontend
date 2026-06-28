import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { DepartmentsPanel } from '@/components/domain/organization/departments-panel';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/organization',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const t: Record<string, Record<string, string>> = {
      organization: {
        'tabs.overview': 'Overview',
        'tabs.departments': 'Departments',
        'departments.add': 'Add Department',
        'departments.search_placeholder': 'Search...',
        'departments.filter_active': 'Status',
        'departments.tree_title': 'Department Tree',
        'departments.clear_filter': 'Clear filter',
        'departments.columns.name': 'Name',
        'departments.columns.parent': 'Parent',
        'departments.columns.status': 'Status',
        'departments.create_title': 'Add Department',
        'departments.edit_title': 'Edit Department',
        'departments.create_description': 'Add a new department.',
        'departments.edit_description': 'Edit department.',
        'departments.parent': 'Parent Department',
        'departments.parent_placeholder': 'Select parent',
        'departments.no_parent': 'Top-level',
        'departments.deactivate_title': 'Deactivate Department',
        'departments.deactivate_description': 'Deactivate {name}?',
        'departments.cascade_to_children': 'Cascade to children',
        'departments.delete.title': 'Delete Department',
        'departments.delete.description': 'Delete {name}?',
        'departments.empty.title': 'No departments',
        'departments.empty.description': 'Start by creating departments.',
        'status.active': 'Active',
        'status.inactive': 'Inactive',
        'actions.edit': 'Edit',
        'actions.delete': 'Delete',
        'actions.deactivate': 'Deactivate',
        'actions.reactivate': 'Reactivate',
        'actions.cancel': 'Cancel',
        'actions.save': 'Save',
        'actions.saving': 'Saving...',
        'actions.create': 'Create',
        'actions.loading': 'Loading...',
        'actions.load_more': 'Load more',
        'actions.add': 'Add',
        'empty.no_calendars': 'No calendars',
        'empty.no_calendars_desc': 'Add the first calendar.',
      },
    };
    return t[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

describe('DepartmentsPanel', () => {
  it('renders tree and table with departments', async () => {
    renderWithProviders(<DepartmentsPanel />);
    const ministries = await screen.findAllByText('Ministry');
    expect(ministries.length).toBeGreaterThanOrEqual(1);
    const finances = await screen.findAllByText('Finance');
    expect(finances.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no departments', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/organization/departments/tree', () =>
        HttpResponse.json([]),
      ),
      http.get('https://api.momentum.test/v1/organization/departments', () =>
        HttpResponse.json({ data: [], next_cursor: null, has_more: false }),
      ),
    );

    renderWithProviders(<DepartmentsPanel />);
    expect(await screen.findByText('Start by creating departments.')).toBeInTheDocument();
  });
});
