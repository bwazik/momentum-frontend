import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { SettingsWorkspace } from '@/components/domain/settings/settings-workspace';

const mockUser = {
  public_id: 'user-1',
  name_ar: 'أحمد',
  name_en: 'Ahmed',
  email: 'ahmed@example.com',
  mobile: '0555000000',
  employee_id: 'EMP001',
  account_type: 1,
  preferred_language: 'arabic',
  is_active: true,
  is_out_of_office: false,
  current_position: {
    public_id: 'pa-1',
    position: { public_id: 'pos-1', title_ar: 'مدير', title_en: 'Manager' },
  },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/settings',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const t: Record<string, Record<string, string>> = {
      settings: { page_title: 'Settings', 'tabs.profile': 'Profile', 'tabs.delegations': 'Active Delegations' },
      'settings.profile': { title: 'Profile', save: 'Save', name_ar: 'Arabic Name', name_en: 'English Name', name_ar_placeholder: 'Enter Arabic name', name_en_placeholder: 'Enter English name', mobile: 'Mobile Number', preferred_language: 'Preferred Language', language_arabic: 'العربية', language_english: 'English', email: 'Email', employee_id: 'Employee ID', position: 'Current Position', name_ar_required: 'Arabic name is required', error: 'Failed to load profile' },
      'settings.profile.toast': { profile_saved: 'Profile saved' },
      'settings.availability': { title: 'Availability', status_label: 'Status', status_in_office: 'In Office', status_out_of_office: 'Out of Office', toggle_aria: 'Toggle availability', error: 'Failed to load', delegate_label: 'Delegate', delegate_placeholder: 'Select', delegate_warning: 'Warning' },
      'settings.availability.toast': { marked_out_of_office: 'OOO', marked_back_in_office: 'Back' },
      'settings.delegations': { title: 'Active Delegations', error: 'Failed', empty_title: 'No Active', empty_description: 'None.', load_more: 'Load more', loading_more: 'Loading...', 'columns.delegator': 'Delegator', 'columns.delegate': 'Delegate', 'columns.scope': 'Scope', 'columns.dates': 'Period', 'columns.status': 'Status', 'columns.actions': 'Actions', status_active: 'Active', scope_all: 'All' },
      'settings.delegations.filters': {},
      'settings.delegations.form': { create_title: 'Create Delegation', create: 'Create' },
      'settings.delegations.revoke': { button: 'Revoke' },
      'settings.delegations.toast': { delegation_created: 'Created' },
      shell: {},
      colors: {},
      common: {},
      shared: { error: 'Error', retry: 'Retry' },
    };
    return t[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/api/hooks/use-capabilities', () => ({
  useCapability: (cap: string) => cap === 'iam.manage_users' || cap === 'iam.view_delegations',
}));

vi.mock('@/lib/stores/use-locale-store', () => ({
  useLocaleStore: () => ({ setLocale: vi.fn(), locale: 'en' }),
}));

// Mock inner components to avoid Radix Select/modal complexity
vi.mock('@/components/domain/settings/availability-card', () => ({
  AvailabilityCard: () => <div data-testid="availability-card">Availability</div>,
}));

vi.mock('@/components/domain/settings/profile-settings-card', () => ({
  ProfileSettingsCard: () => <div data-testid="profile-card">Profile</div>,
}));

vi.mock('@/components/domain/settings/active-delegations-panel', () => ({
  ActiveDelegationsPanel: () => <div data-testid="delegations-panel">Delegations</div>,
}));

describe('SettingsWorkspace', () => {
  beforeEach(() => {
    server.use(
      http.get('https://api.momentum.test/v1/iam/auth/me', () => HttpResponse.json(mockUser)),
    );
  });

  it('renders Profile tab as active by default', async () => {
    renderWithProviders(<SettingsWorkspace />);
    expect(await screen.findByTestId('profile-card')).toBeInTheDocument();
  });

  it('shows both Profile and Delegations tab triggers for manager users', () => {
    renderWithProviders(<SettingsWorkspace />);
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Active Delegations' })).toBeInTheDocument();
  });
});
