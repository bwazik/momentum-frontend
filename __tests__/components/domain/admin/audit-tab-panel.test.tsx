import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { AuditTabPanel } from '@/components/domain/admin/audit-tab-panel';
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
  useCapabilityStore.setState({ capabilities: ['audit.view_system'] });
});

test('shows empty state when no audit events', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/audit-trail/system', () =>
      HttpResponse.json({ data: [], next_cursor: null, has_more: false }),
    ),
  );
  renderWithProviders(<AuditTabPanel />);
  expect(await screen.findByText('empty_title')).toBeInTheDocument();
});
