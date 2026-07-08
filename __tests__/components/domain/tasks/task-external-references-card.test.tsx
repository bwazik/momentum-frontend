import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../../../utils/test-utils';
import { server } from '../../../mocks/server';
import { TaskExternalReferencesCard } from '@/components/domain/tasks/task-external-references-card';
import { useCapabilityStore } from '@/lib/stores/use-capability-store';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/tasks/test-uuid',
}));

const mockLocale = 'en';
vi.mock('next-intl', () => ({
  useLocale: () => mockLocale,
  useTranslations: (namespace: string) => (key: string, params?: Record<string, unknown>) => {
    const refs: Record<string, string | ((p: Record<string, unknown>) => string)> = {
      title: mockLocale === 'ar' ? 'الإشارات الخارجية' : 'External References',
      add: 'Add Reference',
      add_reference: 'Add Reference',
      edit_reference: 'Edit Reference',
      delete_reference: (p) => `Delete Reference ${p.number}`,
      reference_type: 'Reference Type',
      reference_type_required: 'Reference type is required',
      select_reference_type: 'Select reference type',
      reference_type_correspondence: 'Correspondence',
      reference_type_contract: 'Contract',
      reference_type_ministerialdecision: 'Ministerial Decision',
      reference_number: 'Reference Number',
      reference_number_required: 'Reference number is required',
reference_number_placeholder: 'e.g. وارد-2026-00413',
      issuing_entity: 'Issuing Entity',
      select_entity: 'Select entity',
      loading_entities: 'Loading entities...',
      create_new_entity: 'Add new entity',
      notes: 'Notes',
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      delete: 'Delete',
      deleting: 'Deleting...',
      delete_title: 'Delete Reference',
      delete_description: (p) => `Are you sure you want to delete reference "${p.number}"?`,
      view_all: (p) => `View all (${p.count})`,
      load_more: 'Load more',
      loading_more: 'Loading...',
      empty_title: 'No external references',
      empty_description: 'Add a correspondence, contract, or other external reference number.',
      error: 'Unable to load external references.',
      toast_created: 'Reference added',
      toast_updated: 'Reference updated',
      toast_deleted: 'Reference deleted',
    };
    const entities: Record<string, string> = {
      entity_type_governmentministry: 'Government Ministry',
      entity_type_privatecompany: 'Private Company',
      entity_type_other: 'Other',
      entity_type_governmentauthority: 'Government Authority',
      entity_type_semigovernment: 'Semi-Government',
      entity_type_university: 'University',
      entity_type_hospital: 'Hospital',
      entity_type_vendor: 'Vendor',
      name_ar_placeholder: 'Enter Arabic name',
      name_en_placeholder: 'Enter English name',
    };
    if (namespace === 'tasks.references') {
      const val = refs[key];
      return typeof val === 'function' ? val(params ?? {}) : (val ?? key);
    }
    if (namespace === 'tasks.entities') {
      return entities[key] ?? key;
    }
    if (namespace === 'shared') {
      const shared: Record<string, string> = { error: 'An error occurred.', retry: 'Try again' };
      return shared[key] ?? key;
    }
    if (namespace === 'tasks.detail') {
      const detail: Record<string, string> = {
        time_just_now: 'Just now', time_less_than_1h: 'Less than 1 hour',
        time_minute_one: 'minute', time_minute_many: 'minutes',
        time_hour_one: 'hour', time_hour_many: 'hours',
        time_day_one: 'day', time_day_two: 'two days', time_day_many: 'days',
        time_ago_prefix: '', time_ago_suffix: ' ago',
        time_overdue_prefix: 'Overdue by ', time_at_risk: 'At risk',
        time_remaining: ' remaining', time_due_today: 'Due today',
        time_paused: 'Paused', time_completed: 'Completed',
      };
      return detail[key] ?? key;
    }
    return key;
  },
}));

function setCapabilities(caps: string[]) {
  useCapabilityStore.getState().setCapabilities(caps);
}

describe('TaskExternalReferencesCard', () => {
  beforeEach(() => {
    setCapabilities([]);
  });

  test('renders loading skeleton', () => {
    server.use(
      http.get('https://api.momentum.test/v1/tasks/:task/external-references', () => {
        return new Promise(() => {});
      }),
    );
    renderWithProviders(<TaskExternalReferencesCard publicId="TASK-001" />);
    expect(screen.getByText('External References')).toBeInTheDocument();
  });

  test('renders empty state when no references', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/tasks/:task/external-references', () => {
        return HttpResponse.json({ data: [], next_cursor: null, has_more: false });
      }),
    );
    renderWithProviders(<TaskExternalReferencesCard publicId="TASK-001" />);
    await screen.findByText('No external references');
  });

  test('renders empty state with Add button when can manage', async () => {
    setCapabilities(['task.manage']);
    server.use(
      http.get('https://api.momentum.test/v1/tasks/:task/external-references', () => {
        return HttpResponse.json({ data: [], next_cursor: null, has_more: false });
      }),
    );
    renderWithProviders(<TaskExternalReferencesCard publicId="TASK-001" />);
    await screen.findByText('No external references');
    expect(screen.getAllByText('Add Reference').length).toBeGreaterThanOrEqual(1);
  });

  test('renders references on success', async () => {
    renderWithProviders(<TaskExternalReferencesCard publicId="TASK-001" />);
    await screen.findByText('وارد-2026-00412');
    expect(screen.getByText('CON-2026-001')).toBeInTheDocument();
    expect(screen.getByText('EXT-2026-003')).toBeInTheDocument();
  });

  test('shows inline error state on API failure', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/tasks/:task/external-references', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<TaskExternalReferencesCard publicId="TASK-001" />);
    await screen.findByText('Unable to load external references.');
  });

  test('shows view all link when more than 3 references', async () => {
    renderWithProviders(<TaskExternalReferencesCard publicId="TASK-001" />);
    await screen.findByText('View all (4)');
  });

  test('opens view all dialog with full list', async () => {
    renderWithProviders(<TaskExternalReferencesCard publicId="TASK-001" />);
    await screen.findByText('View all (4)');
    await userEvent.click(screen.getByText('View all (4)'));
    await screen.findByText('MD-2026-042');
  });

  test('shows add/edit/delete buttons when can manage', async () => {
    setCapabilities(['task.manage']);
    renderWithProviders(<TaskExternalReferencesCard publicId="TASK-001" />);
    await screen.findByText('وارد-2026-00412');
    const addButtons = screen.getAllByText('Add Reference');
    expect(addButtons.length).toBeGreaterThanOrEqual(1);
  });

  test('hides add/edit when cannot manage', async () => {
    renderWithProviders(<TaskExternalReferencesCard publicId="TASK-001" />);
    await screen.findByText('وارد-2026-00412');
    expect(screen.queryByText('Add Reference')).not.toBeInTheDocument();
  });
});
