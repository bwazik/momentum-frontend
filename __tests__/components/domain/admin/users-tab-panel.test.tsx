import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { UsersTabPanel } from '@/components/domain/admin/users-tab-panel';
import { useCapabilityStore } from '@/lib/stores/use-capability-store';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

beforeEach(() => {
  useCapabilityStore.setState({ capabilities: ['iam.manage_users'] });
});

test('shows empty state when API returns no users', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/iam/users', () =>
      HttpResponse.json({ data: [], next_cursor: null, has_more: false }),
    ),
  );
  renderWithProviders(<UsersTabPanel />);
  expect(await screen.findByText('empty_title')).toBeInTheDocument();
});
