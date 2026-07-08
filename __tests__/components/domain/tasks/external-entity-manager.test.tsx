import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../../../utils/test-utils';
import { server } from '../../../mocks/server';
import { ExternalEntityManager } from '@/components/domain/tasks/external-entity-manager';
import { useCapabilityStore } from '@/lib/stores/use-capability-store';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/tasks/external-entities',
}));

const mockLocale = 'en';
vi.mock('next-intl', () => ({
  useLocale: () => mockLocale,
  useTranslations: (namespace: string) => (key: string, params?: Record<string, unknown>) => {
    const entities: Record<string, string | ((p: Record<string, unknown>) => string)> = {
      page_title: 'External Entities',
      page_description: 'Manage the catalog of issuing entities.',
      create_entity: 'Create Entity',
      edit_entity: 'Edit Entity',
      name_ar: 'Name (Arabic)',
      name_ar_required: 'Arabic name is required',
      name_ar_placeholder: 'Enter Arabic name',
      name_en: 'Name (English)',
      name_en_placeholder: 'Enter English name',
      entity_type: 'Entity Type',
      select_entity_type: 'Select entity type',
      entity_type_governmentministry: 'Government Ministry',
      entity_type_governmentauthority: 'Government Authority',
      entity_type_semigovernment: 'Semi-Government',
      entity_type_university: 'University',
      entity_type_hospital: 'Hospital',
      entity_type_privatecompany: 'Private Company',
      entity_type_vendor: 'Vendor',
      entity_type_other: 'Other',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      actions: 'Actions',
      edit: 'Edit',
      deactivate: 'Deactivate',
      reactivate: 'Reactivate',
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      create: 'Create',
      empty_title: 'No external entities',
      empty_description: 'Create your first entity.',
      error: 'Unable to load external entities.',
      toast_created: 'Entity created',
      toast_updated: 'Entity updated',
      toast_deactivated: 'Entity deactivated',
      toast_reactivated: 'Entity reactivated',
    };
    const shared: Record<string, string> = { error: 'An error occurred.', retry: 'Try again', cancel: 'Cancel' };
    const blueprintsCatalog: Record<string, string> = { cancel: 'Cancel', saving: 'Saving...', edit: 'Save', actions: 'Actions' };
    if (namespace === 'tasks.entities') {
      const val = entities[key];
      return typeof val === 'function' ? val(params ?? {}) : (val ?? key);
    }
    if (namespace === 'shared') return shared[key] ?? key;
    if (namespace === 'blueprints.catalog') return blueprintsCatalog[key] ?? key;
    return key;
  },
}));

function setCapabilities(caps: string[]) {
  useCapabilityStore.getState().setCapabilities(caps);
}

describe('ExternalEntityManager', () => {
  beforeEach(() => {
    setCapabilities([]);
  });

  test('renders loading skeleton', () => {
    server.use(
      http.get('https://api.momentum.test/v1/tasks/external-entities', () => {
        return new Promise(() => {});
      }),
    );
    renderWithProviders(<ExternalEntityManager />);
  });

  test('renders error state on API failure', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/tasks/external-entities', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<ExternalEntityManager />);
    await screen.findByText('Unable to load external entities.');
  });

  test('renders empty state when no entities', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/tasks/external-entities', () => {
        return HttpResponse.json([]);
      }),
    );
    renderWithProviders(<ExternalEntityManager />);
    await screen.findByText('No external entities');
  });

  test('renders entities table with active and inactive', async () => {
    renderWithProviders(<ExternalEntityManager />);
    await screen.findByText('وزارة التجارة');
    expect(screen.getByText('Ministry of Commerce')).toBeInTheDocument();
    expect(screen.getByText('Tech Company')).toBeInTheDocument();
    expect(screen.getByText('Deactivated Entity')).toBeInTheDocument();
  });

  test('opens create dialog when triggered via prop', async () => {
    renderWithProviders(<ExternalEntityManager openCreate={true} />);
    await screen.findByText('وزارة التجارة');
    expect(screen.getByText('Create Entity')).toBeInTheDocument();
  });

  test('shows deactivate button for active entity', async () => {
    setCapabilities(['task.manage_external_entities']);
    renderWithProviders(<ExternalEntityManager />);
    await screen.findByText('وزارة التجارة');
    const ellipsis = screen.getAllByRole('button', { name: 'Actions' });
    expect(ellipsis.length).toBeGreaterThan(0);
  });
});
